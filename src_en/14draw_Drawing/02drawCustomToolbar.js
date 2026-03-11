const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/02drawCustomToolbar
        // --Custom draw control UI style--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        await map.onLoad();
        
        
        // See https://vjmap.com/guide/draw.html
        const opts = vjmap.Draw.defaultOptions();
        opts.isActionDrawMode = true; // hide default buttons, use custom UI
        
        const draw = new vjmap.Draw.Tool(opts);
        map.addControl(draw, 'top-right');
        
        
        const sensor1 = await map.loadImageEx("sensor1", env.assetsPath + "images/sensor1.png");
        
        let curDrawActionName;
        const doAction = (actionName) => {
            curDrawActionName = actionName;
            switch (actionName) {
                case "point":
                    draw.changeMode("draw_point")
                    break;
                case "line":
                    draw.changeMode("draw_line_string"/*, {
                        isClosed: true // auto-close
                    }*/)
                    break;
                case "polygon":
                    draw.changeMode("draw_polygon")
                    break;
                case "fillExtrusion":
                    draw.changeMode("draw_polygon", {
                        drawType: "fillExtrusion" // custom property; check in draw.create to distinguish polygon vs extrusion
                    })
                    break;
                case "circle":
                    draw.changeMode("draw_circle")
                    break;
                case "rectangle":
                    draw.changeMode("draw_rectangle")
                    break;
                case "slantRectangle":
                    draw.changeMode("draw_slant_rectangle")
                    break;
                case "symbolscale":
                case "symbol":
                    drawSymol();
                    break;
                case "simple_select":
                    draw.changeMode("simple_select")
                    break;
                case "trash":
                    draw.trash()
                    break;
                case "deleteAll":
                    draw.deleteAll(); // cannot undo
                    break;
                case "scaleRotate":
                    draw.changeMode("scaleRotateMode");
                    break;
                case "combine":
                    draw.combineFeatures();
                    break;
                case "unCombine":
                    draw.uncombineFeatures();
                    break;
                case "splitLine":
                    draw.changeMode("splitLineMode");
                    break;
                case "cutPolygon":
                    draw.changeMode("cutPolygonMode");
                    break;
                case "toMultiPolygon":
                    draw.doAction("toMultiPolygon");
                    break;
                case "toBezierCurve":
                    toBezierCurve();
                    break;
                case "undo":
                    draw.undo()
                    break;
                case "redo":
                    draw.redo()
                    break;
                case "static":
                    draw.changeMode('static')
                    break;
                case "getSelected":
                    let sels = draw.getSelectedIds();
                    message.info(`Selected count: ${sels.length}`);
                    break;
                case "getAllCoord": {
                    let allents = draw.getAll();
                    let tip = "";
                    for (let f of allents.features) {
                        let featureType = f.geometry.type;
                        // convert lng/lat to map coordinates
                        let co = map.fromLngLat(f.geometry.coordinates);
                        tip += `${featureType}: ${JSON.stringify(co)};  `
                    }
                    message.info(tip);
                }
                    break;
                case "editFirst": {
                    let features = draw.getAll().features;
                    if (features.length === 0) return;
                    let featureId = features[0].id;
                    // select this feature first
                    draw.changeMode("simple_select", {featureIds: [featureId]});
                    // then enter edit mode
                    draw.changeMode("direct_select", {featureId: featureId});
                }
                    break;
                case "changeColor": {
                    let sels = draw.getSelectedIds();
                    if (sels.length <= 0) return;
                    for (let featureId of sels) {
                        draw.setFeatureProperty(featureId, "color", vjmap.randomColor()); // random color
                        // to change coordinates, e.g. keep only first two coords of line:
                        /*
                        let feature = draw.get(featureId)
                        if (feature.geometry.type == "LineString") {
                            draw.setFeatureProperty(featureId, "coordinates", feature.geometry.coordinates.splice(0, 2));
                        }*/
                    }
                    map.triggerRepaint(); // refresh
                }
                    break;
                case "snapPoint":
                    draw.options.snap = !draw.options.snap;
                    break;
                case "snapGrid":
                    draw.options.guides = !draw.options.guides;
                    break;
                case "save": {
                    let entsJson = draw.getAll();
                    // convert to map coordinates
                    entsJson = map.fromLngLat(entsJson);
                    let curParam = map.getService().currentMapParam() || {};
                    // use mapid and version as key; demo saves to localStorage, in production save to backend
                    let key = `map_drawdata_${curParam.mapid}_${curParam.version}`;
                    window.localStorage.setItem(key, JSON.stringify(entsJson));
                    message.info('Saved')
                }
                    break;
                case "load": {
                    // use mapid and version as key; demo loads from localStorage, in production load from backend
                    let curParam = map.getService().currentMapParam() || {};
                    let key = `map_drawdata_${curParam.mapid}_${curParam.version}`;
                    let data = window.localStorage.getItem(key);
                    if (data && data != "") {
                        try {
                            data = JSON.parse(data);
                            draw.set(map.toLngLat(data));
                            message.info("Loaded")
                        } catch (error) {
                            message.error(error)
                        }
                    }
                }
                    break;
                case 'hideSelected': {
                    let sels = draw.getSelectedIds();
                    if (sels.length == 0) return;
                    for (let featureId of sels) {
                        draw.setFeatureProperty(featureId, "isOff", true); // isOff=true means hidden
                    }
                    draw.changeMode('simple_select')
                }
                    break;
                case 'showAllFeatures': {
                    let ents = draw.getAll();
                    if (ents.features.length == 0) return;
                    for (let feature of ents.features) {
                        draw.setFeatureProperty(feature.id, "isOff", undefined); // remove isOff, default is visible
                    }
                    // refresh
                    draw.forceRefresh();
                }
                    break;
                case 'lockedSelected': {
                    let sels = draw.getSelectedIds();
                    if (sels.length == 0) return;
                    for (let featureId of sels) {
                        draw.setFeatureProperty(featureId, "isLocked", true);
                    }
                    draw.changeMode('simple_select')
                }
                    break;
                case 'unLockedAllFeatures': {
                    let ents = draw.getAll();
                    if (ents.features.length == 0) return;
                    for (let feature of ents.features) {
                        draw.setFeatureProperty(feature.id, "isLocked", undefined); // remove property, default is unlocked
                    }
                    draw.changeMode('simple_select')
                }
                    break;
                case "lockedEdit": {
                    let sels = draw.getSelectedIds();
                    if (sels.length == 0) return;
                    for (let featureId of sels) {
                        let feature = draw.get(featureId);
                        if (feature.properties.disable_edit === true) {
        // was disabled, now allow edit
                            draw.setFeatureProperty(featureId, "disable_edit", undefined);
                        } else {
        // was allowed, now disable edit
                            draw.setFeatureProperty(featureId, "disable_edit", true);
                        }
                    }
                    draw.changeMode('simple_select')
                }
                break;
                case 'selectRotate': {
                    selectRotate();
                    break;
                }
            }
        }
        
        
        const toBezierCurve = () => {
            let selected = draw.getSelected().features.filter(e => e.geometry.type == "LineString" || e.geometry.type == "Polygon");
            if (selected.length == 0) return;
            let preFeatures = vjmap.cloneDeep(selected);
            for (let i = 0; i < selected.length; i++) {
                let feature = selected[i];
                if (feature.geometry.type == "LineString") {
                    // convert polyline points to Bezier curve params
                    const c = vjmap.polylineToBezierCurve(map.fromLngLat(feature.geometry.coordinates).map(e => [e.x, e.y]));
                    // discretize Bezier to polyline
                    const curvePath = vjmap.bezierCurveToPolyline(c, 100);
                    draw.setFeatureProperty(feature.id, "coordinates", map.toLngLat(curvePath));
                } else {
                    let coordinates = []
                    for (let p = 0; p < feature.geometry.coordinates.length; p++) {
                        // convert polyline points to Bezier curve params
                        const c = vjmap.polylineToBezierCurve(map.fromLngLat(feature.geometry.coordinates[p]).map(e => [e.x, e.y]));
                        // discretize Bezier to polyline
                        const curvePath = vjmap.bezierCurveToPolyline(c, 1000);
                        coordinates.push(map.toLngLat(curvePath));
                    }
                    draw.setFeatureProperty(feature.id, "coordinates", coordinates);
                }
            }
            // get selected features again
            let newFeatures = draw.getSelected().features.filter(e => e.geometry.type == "LineString" || e.geometry.type == "Polygon");
            // for undo/redo
            map.fire('draw.update', {
                action: "toBezierCurve",
                features: vjmap.cloneDeep(newFeatures), // updated data
                prevFeatures: preFeatures, // previous data
                styleId: draw.options.styleId
            });
            draw.changeMode("simple_select")
        }
        
        // Select multiple features and rotate
        const selectRotate = async ()=> {
            // select first, right-click to confirm
            let selected = await vjmap.Draw.actionSelect(map, draw, );
            if (selected.features.length == 0) return;// nothing selected
        
            message.info("Specify rotation base point");
            let basePointRes = await vjmap.Draw.actionDrawPoint(map, { });
            if (basePointRes.cancel) {
                return;// cancelled
            }
            message.info("Specify rotation angle");
            let basePoint = basePointRes.features[0].geometry.coordinates;
            let endPoint = basePoint;
            // optional helper line
            let tempLine = new vjmap.Polyline({
                data: [basePoint, endPoint],
                lineColor: 'yellow',
                lineWidth: 1,
                lineDasharray: [2, 2]
            });
            tempLine.addTo(map);
        
            // copy selection for revert on cancel
            let oldSelected = vjmap.cloneDeep(selected.features);
            let rotatePointRes = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    endPoint = e.lnglat;
                    // update temp line
                    tempLine.setData([basePoint, endPoint])
                    let angle = map.fromLngLat(endPoint).angleTo(map.fromLngLat(basePoint));
        
                    let updateFeatures = vjmap.cloneDeep(oldSelected); // use saved data, not updated
                    // update selected feature coordinates
                    for(let i = 0; i < updateFeatures.length; i++) {
                        let changeFeatures = vjmap.transform.convert(updateFeatures[i], g => {
                            let pt = map.fromLngLat(g);
                            let rotatePt = pt.roateAround(angle, map.fromLngLat(basePoint));
                            return map.toLngLat(rotatePt)
                        });
                        draw.setFeatureProperty(updateFeatures[i].id, "coordinates", changeFeatures);
                    }
                    draw.forceRefresh();
                }
            });
            tempLine.remove();// remove temp line
            if (rotatePointRes.cancel) {
                // revert
                for(let i = 0; i < oldSelected.length; i++) {
                    draw.setFeatureProperty(oldSelected[i].id, "coordinates", oldSelected[i]);
                }
                draw.forceRefresh();
                return;// cancelled
            }
        
        }
        // Draw text symbol
        const drawSymol = async () => {
            let text = prompt("Enter text content:");
            if (!text) return
            let feature = {type: 'Point', coordinates: [0, 0]};
            let featureIds = draw.add(feature);
            let featureId = featureIds[0];
            // set text content
            draw.setFeatureProperty(featureId, "symbol", true); // text symbol
            draw.setFeatureProperty(featureId, "text", text);
            draw.setFeatureProperty(featureId, "color", vjmap.randomColor());
            draw.setFeatureProperty(featureId, "hoverPointer", true); // highlight in non-edit mode
        
            // set icon_image if icon needed
            draw.setFeatureProperty(featureId, "icon_image", "sensor1");
        
            // move position
            let textPoint = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    let feature = draw.get(featureId);
                    // update coordinates
                    feature.geometry.coordinates = e.lnglat;
                    draw.delete(featureId);
                    draw.add(feature)
                }
            });
            if (textPoint.cancel) {
                draw.delete(featureId);
                return;// cancelled
            }
        
            message.info("Drag to set text height");
            // get text size below
            // optional helper line
            let startPoint = draw.get(featureId).geometry.coordinates;
            let endPoint = startPoint;
            let tempLine = new vjmap.Polyline({
                data: [startPoint, endPoint],
                lineColor: 'yellow',
                lineWidth: 1,
                lineDasharray: [2, 2]
            });
            tempLine.addTo(map);
        
            let sizePoint = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    endPoint = e.lnglat;
                    // update temp line
                    tempLine.setData([startPoint, endPoint])
                }
            });
            let size = 22;
            if (!sizePoint.cancel) {
                // not cancelled
                const co = map.fromLngLat(endPoint);
                let dist = co.distanceTo(map.fromLngLat(startPoint));
                let len = map.geoToPixelLength(dist, map.getZoom());
                size = Math.round(len * 2);
            }
            let isScale = curDrawActionName === "symbolscale";
            if (isScale) {
                // set font size per zoom level so text scales with zoom
                let zoom = Math.round(map.getZoom());
                for (let i = 1; i <= 24; i++) {
                    // set text height
                    let textSize = Math.pow(2, i - zoom) * size;
                    if (textSize > 150) textSize = 150;
                    draw.setFeatureProperty(featureId, "text_size_zoom" + i, textSize);
                }
        
                // scale with zoom, set icon size per level
                let iconSize = 1;
                for (let i = 1; i <= 24; i++) {
                    // set icon size
                    let sz = Math.pow(2, i - zoom) * iconSize;
                    //if (sz > 1) continue;
                    draw.setFeatureProperty(featureId, "icon_size_zoom" + i, sz);
                }
            }
        
            if (curDrawActionName === "symbolscale") {
                // set rotation for scale symbols only
                message.info("Drag to set text rotation angle")
                // set text rotation
                tempLine.setData([startPoint, startPoint])
                let anglePoint = await vjmap.Draw.actionDrawPoint(map, {
                    updatecoordinate: (e) => {
                        if (!e.lnglat) return;
                        endPoint = e.lnglat;
                        // update temp line
                        tempLine.setData([startPoint, endPoint])
                    }
                });
        
                if (!anglePoint.cancel) {
                    // not cancelled
                    let angle = -map.fromLngLat(endPoint).angleTo(map.fromLngLat(startPoint)) * 180.0 / Math.PI;
                    // set rotation angle
                    draw.setFeatureProperty(featureId, "text_rotate", angle);
                    draw.setFeatureProperty(featureId, "icon_rotate", angle);
                }
            }
            tempLine.remove(); // remove helper line
        }
        
        // Change color after create
        map.on("draw.create", function (e) {
            let color = vjmap.randomColor();
            for (let i = 0; i < e.features.length; i++) {
                let id = e.features[i].id;
                if (!draw.get(id)) continue;
                draw.setFeatureProperty(id, "color", color);
                draw.setFeatureProperty(id, "hoverPointer", true); // highlight in non-edit mode
        
                //draw.setFeatureProperty(id, "minZoom", i);
                //draw.setFeatureProperty(id, "maxZoom", i + 5);
        
        
                // if drawType is "fillExtrusion", set extrusion
                if ( e.state.options.drawType === "fillExtrusion") {
                    // set height for fill extrusion polygon
                    // default height: quarter of bounding rect width
                    let bounds = map.getFeatureBounds(e.features[i], true)
                    draw.setFeatureProperty(id, "extrusionHeight", prj.toMeter(bounds.width() / 4));
                }
            }
        });
        
        const popup = new vjmap.Popup({
            closeButton: false
        });
        // In static mode, show tooltip on hover
        map.on("draw.static.mouseenter", e => {
            if (e.event.featureTarget) {
                popup.setLngLat(e.event.lngLat);
                popup.setHTML(JSON.stringify(e.event.featureTarget.properties, null, 4));
                popup.addTo(map);
            }
        });
        
        map.on("draw.static.mouseleave", e => {
            if (popup) popup.remove();
        });
        
        map.on("draw.static.click", e => {
            if (e.event.featureTarget) {
                message.info(`Clicked entity id: ${e.event.featureTarget.properties.id}`)
            }
        });
        
        
        
        // queryParam: query condition; propData: property data
        let globalIndex = 0;
        const getQueryGeomData = async (queryParam, propData = {})=> {
            let res = await svc.conditionQueryFeature({
                fields: "",
                includegeom: true, // return geometry; when realgeom false and count>1 returns bbox per entity, count=1 returns real geojson; realgeom true returns geojson per entity
                realgeom: true,
                limit: 10000, // large limit to get all; default 100 if omitted
                ...queryParam
            })
            const features = []
            if (res && res.result && res.result.length > 0) {
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = map.entColorToHtmlColor(ent.color); // entity color to HTML color
                        for (let g = 0; g < ent.geom.geometries.length; g++) {
                            features.push({
                                id: globalIndex++,
                                type: "Feature",
                                properties: {
                                    objectid: ent.objectid + "_" + g,
                                    color: clr,
                                    alpha: ent.alpha / 255,
                                    lineWidth: 1,
                                    name: ent.name,
                                    isline: ent.isline,
                                    layerindex: ent.layerindex,
                                    ...propData // merge extra property data
                                },
                                geometry: ent.geom.geometries[g]
                            })
                        }
                    }
                }
            }
            return {
                type: "FeatureCollection",
                features: features
            };
        }
        
        // data: geojson; basePt: base point; destPt: destination; scale: scale factor; angle: rotation
        const transformGeoJsonData = (data, basePt, destPt, scale = 1.0, angle = 0.0) => {
            return vjmap.transform.convert(data, (pt) => {
                let point = map.fromLngLat(vjmap.geoPoint(pt));
                point.transform(basePt, destPt, scale, angle);
                return map.toLngLat(point) ;
            });
        }
        
        
        const createOutSymbol = async () => {
            message.info("Move mouse to position and click to draw symbol")
            let symbolId = vjmap.randInt(1, 2) ; // random symbol
            let symbolMapId = "sys_symbols";
            let symbolMapVer = "v1";
            let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true)
            // cache result if query unchanged; demo fetches each time
            let data = await getQueryGeomData({
                mapid: symbolMapId,
                version: symbolMapVer,
                layer: styleName,
                condition: `layerindex=${symbolId}`, // SQL WHERE clause; see "server condition query" docs
            }, {
                symbolId: vjmap.RandomID(),
                lineWidth: 3,
                color: vjmap.randomColor() /* can override previous color*/
            });
        
            let drawDestPt = await vjmap.Draw.actionDrawPoint(map, {});
            if (drawDestPt.cancel) {
                return ;// cancelled
            }
            // destination coordinates
            let destPt = map.fromLngLat(drawDestPt.features[0].geometry.coordinates);
        
            // get data bounds
            let dataBounds = vjmap.getGeoBounds(data);
            // placement point
            let drawData = transformGeoJsonData(vjmap.cloneDeep(data), map.fromLngLat(dataBounds.center()), destPt, vjmap.randInt(1, 10) / 20.0)
        
            let addFeatureIds = []
            drawData.features.forEach(feature => {
                addFeatureIds.push(...draw.add(feature));
            });
        
            // select these features
            draw.changeMode("simple_select", {featureIds: addFeatureIds});
            // then combine into one
            draw.combineFeatures();
        }
        
        // Show/hide layer
        const showHideLayer = (isHide) => {
            let drawStyleId = draw.options.styleId;
            let sourceIds = [`vjmap-map-draw-cold${drawStyleId}`, `vjmap-map-draw-hot${drawStyleId}`];
            sourceIds.forEach(sId => {
                if (isHide) {
                    map.hideSource(sId)
                } else {
                    map.showSource(sId)
                }
            });
        }
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "40px", right: "140px"}}>
                        <h4>Draw type:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("point")}>Point
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("line")}>Line
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("polygon")}>Polygon
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("fillExtrusion")}>Fill extrusion
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("circle")}>Circle
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("rectangle")}>Rectangle
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("slantRectangle")}>Slant rectangle
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("symbolscale")}>Scale icon text
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("symbol")}>Text icon
                            </button>
                        </div>
                        <h4>Draw tools:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("trash")}>Delete
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("scaleRotate")}>Scale rotate
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("combine")}>Combine
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("unCombine")}>Uncombine
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("splitLine")}>Split line
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("cutPolygon")}>Cut polygon
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("toMultiPolygon")}>To multi-polygon
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("toBezierCurve")}>To curve
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("selectRotate")}>Select & rotate
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("deleteAll")}>Clear all
                            </button>
                        </div>
        
        
                    </div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <h4>Edit:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("undo")}>Undo
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("redo")}>Redo
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("static")}>Browse mode
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("simple_select")}>Edit mode
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("hideSelected")}>Hide selected
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("showAllFeatures")}>Show all
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("lockedSelected")}>Lock selected
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("unLockedAllFeatures")}>Unlock all
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("lockedEdit")}>Disable edit
                            </button>
                        </div>
                        <h4>Snap:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("snapPoint")}>Snap point
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("snapGrid")}>Snap grid
                            </button>
                        </div>
                        <h4>Data:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("getSelected")}>Get selected count
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("getAllCoord")}>All coordinates
                            </button>
                        </div>
                        <h4>Save/Load:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("save")}>Save
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("load")}>Load
                            </button>
                        </div>
                        <h4>Extended:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("editFirst")}>Edit first
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("changeColor")}>Change color
                            </button>
                        </div>
                        <div className="input-item">
                            <button className="btn" onClick={ () => createOutSymbol() }>Insert external symbol</button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App/>, document.getElementById('ui'));
        
    }
    catch (e) {
        console.error(e);
        message.error({
            content: "catch error: " + (e.message || e.response || JSON.stringify(e).substr(0, 80)),
            duration: 60,
            key: "err"
        });
    }
};