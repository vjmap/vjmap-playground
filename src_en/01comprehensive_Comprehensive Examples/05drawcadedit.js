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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/05drawcadedit
        // --CAD online editing-- Modify, delete, add to CAD and export as DWG
        // Note: This example uses vjcommon. Include vjcommon.min.js or npm install vjcommon.
        // vjcommon: https://github.com/vjmap/vjmap-common
        // Note: This example uses vjgeo for geometry. Include vjgeo.min.js or npm install vjgeo.
        // Geometry guide: https://vjmap.com/guide/geomodel.html
        // Geometry API: https://vjmap.com/docs/geomodel/
        // More demos: https://vjmap.com/demo/#/demo/map/models/01geomodels
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID (ensure it exists)
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div is dark
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // New map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.vectorStyle(), // vector tile style
            center: [45.14,4.47], // center
            zoom: 6,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Make map fully visible
        // map.fitMapBounds();
        await map.onLoad();
        map.doubleClickZoom.disable(); // Disable double-click zoom
        
        // Draw parameters
        let strokeColor = "#ff0000";  // stroke color
        let fillColor = "#00ffff"; // fill color
        let lineWidth = 1; // line width
        let fillOpacity = 1.0; // fill opacity
        let pointPixel = 5; // point pixel size
        let extrusionHeight = 500000; // default extrusion height
        let isSnapMap = true; // snap to map points
        let isSnap = true;// snap to drawn points
        
        // Update map style object
        const updateMapStyleObj = vjcommon.createUpdateMapStyleObj(map);
        const opts = vjmap.cloneDeep(vjmap.Draw.defaultOptions());
        opts.isActionDrawMode = true; // use custom UI
        let snapObj = {};
        // If CAD is base map, can snap to DWG points
        vjcommon.getMapSnapPoints(map, snapObj);
        const draw = map.getDrawLayer();
        const getDrawOptions = () => {
            let mapSnapFeatures = [];
            if (isSnapMap) {
                // @ts-ignore
                mapSnapFeatures = snapObj.features;
            }
            let drawFeatures = [];
            if (typeof draw != 'undefined') {
                drawFeatures = draw.getAll().features;
            }
            return {
                ...opts,
                snap: isSnap, // enable vertex snap
                guides: isSnap,// enable grid snap
                api: {
                    getSnapFeatures: isSnap ? {
                        ...snapObj,
                        features: [
                            ...mapSnapFeatures,
                            ...drawFeatures
                        ]
                    } : {} // snap to map/draw data via features
                }
            }
        }
        
        const addDwgDocToMap = async (doc) => {
            let dwgDoc = new vjmap.DbDocument();
            dwgDoc.entitys = doc.entitys
            let geojson = await map.createDbGeomData(dwgDoc);
            let result = await vjcommon.interactiveCreateGeom(geojson, map);
            if (!(result && result.feature && result.feature.features)) return;
            let mapJson = draw.getAll();
            result.feature.features.forEach(f => f.id = vjmap.RandomID(10)); // avoid duplicate id
            mapJson.features.push(...result.feature.features);
            draw.set(mapJson);
        }
        const addModelToMap = async (modelName, context) => {
            // Get model default parameters
            let param = vjgeo.models[modelName].metaParameters;
            if (context) {
                let value = JSON.stringify(param.map(p => {return {title: p.title, value: (p.type == 'select') ? p[0] : p}}), null, 0)
                let content = await context.prompt("Enter draw parameters", value);
                if (!content) return;
                param = JSON.parse(content)
            }
            let args = param.map(p => p); // get parameter values
            let model = new vjgeo.models[modelName](...args);
            model.data = {
                ...model.data,
                color: vjmap.htmlColorToEntColor(strokeColor),
                isFill: vjmap.randInt(0, 3) == 0
            }
            let dwgDoc = vjgeo.exporter.toDWG(model);
            await addDwgDocToMap(dwgDoc);
        }
        let geoModelMenus = []; // Geometry model menus, auto from built-in models
        geoModelMenus = Object.keys(vjgeo.models).sort().map(modelName => {
            return {
                id: modelName,
                name: modelName,
                cb: (context) => {
                    addModelToMap(modelName, context)
                }
            }
        })
        
        const menus = [
            {
                name: "Draw",
                menus: [
                    {
                        id: "point",
                        name: "Point",
                        cb: () => {
                            vjcommon.drawPoint(map, draw, {
                                ...getDrawOptions(),
                            }, {
                                "color_inactive": fillColor,// point color in edit mode
                                "color_static": fillColor,// point color in preview mode
                                "radius_inactive": pointPixel,// point radius in edit mode
                                "radius_static": pointPixel // point radius in preview mode
                            });
                        }
                    },
                    {
                        id: "line",
                        name: "Line",
                        cb: () => {
                            vjcommon.drawLineSting(map, draw, getDrawOptions(), {
                                "color": strokeColor,
                                "line_width": lineWidth,
                            });
                        }
                    },
                    {
                        id: "polygon",
                        name: "Polygon",
                        cb: () => {
                            vjcommon.drawPolygon(map, draw, getDrawOptions(), {
                                "color": fillColor,
                                "opacity": fillOpacity,
                                "outlineColor": strokeColor,
                                "line_width": lineWidth,
                                "line_opacity": fillOpacity,
                            });
                        }
                    },
                    {
                        id: "fillExtrusion",
                        name: "Extrusion",
                        cb: () => {
                            vjcommon.drawPolygon(map, draw, getDrawOptions(), {
                                "color": fillColor,
                                "opacity": fillOpacity,
                                "outlineColor": strokeColor,
                                "line_width": lineWidth,
                                "line_opacity": fillOpacity,
                                "extrusionHeight": extrusionHeight,
                            });
                        }
                    },
                    {
                        id: "circle",
                        name: "Circle",
                        cb: () => {
                            vjcommon.drawCircle(map, draw, getDrawOptions(), {
                                "color": fillColor,
                                "opacity": fillOpacity,
                                "outlineColor": strokeColor,
                                "line_width": lineWidth,
                                "line_opacity": fillOpacity,
                            }, false);
                        }
                    },
                    {
                        id: "fillcircle",
                        name: "Filled circle",
                        cb: () => {
                            vjcommon.drawCircle(map, draw, getDrawOptions(), {
                                "color": fillColor,
                                "opacity": fillOpacity,
                                "outlineColor": strokeColor,
                                "line_width": lineWidth,
                                "line_opacity": fillOpacity,
                            }, true);
                        }
                    },
                    {
                        id: "rectangle",
                        name: "Rectangle",
                        cb: () => {
                            vjcommon.drawRectangle(map, draw, getDrawOptions(), {
                                "color": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "outlineColor": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, false);
                        }
                    },
                    {
                        id: "fillRectangle",
                        name: "Filled rectangle",
                        cb: () => {
                            vjcommon.drawRectangle(map, draw, getDrawOptions(), {
                                "color": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "outlineColor": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, true);
                        }
                    },
                    {
                        id: "slantRectangle",
                        name: "Slant rectangle",
                        cb: () => {
                            vjcommon.drawSlantRectangle(map, draw, getDrawOptions(), {
                                "color": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "outlineColor": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, false);
                        }
                    },
                    {
                        id: "fillSlantRectangle",
                        name: "Filled slant rectangle",
                        cb: () => {
                            vjcommon.drawSlantRectangle(map, draw, getDrawOptions(), {
                                "color": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "outlineColor": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, true);
                        }
                    },
                    {
                        id: "text",
                        name: "Text",
                        cb: async (context) => {
                            let content = await context.prompt("Enter text content");
                            if (!content) return;
                            let param = {
                                text: content,
                                height: 30, // initial text height in px
                                disableScale: false,
                                disableRotate: false,
                            }
                            vjcommon.drawText(map, draw, {
                                ...getDrawOptions(),
                            }, {
                                "color": fillColor,
                                ...param
                            }, message.info);
                        }
                    },
                    {
                        id: "fillEllipse",
                        name: "Filled ellipse",
                        cb: () => {
                            vjcommon.drawEllipseFill(map, draw, getDrawOptions(), {
                                "color": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "outlineColor": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, message.info);
                        }
                    },
                    {
                        id: "ellipse",
                        name: "Ellipse",
                        cb: () => {
                            vjcommon.drawEllipseEdge(map, draw, getDrawOptions(), {
                                "color": strokeColor,// color
                                "line_width": lineWidth, // line width
                            }, message.info);
                        }
                    },
                    {
                        id: "fillEllipseArc",
                        name: "Filled sector",
                        cb: () => {
                            vjcommon.drawEllipseFillArc(map, draw, getDrawOptions(), {
                                "color": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "outlineColor": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, message.info);
                        }
                    },
                    {
                        id: "ellipseArc",
                        name: "Ellipse arc",
                        cb: () => {
                            vjcommon.drawEllipseArc(map, draw, getDrawOptions(), {
                                "color": strokeColor,// color
                                "line_width": lineWidth, // line width
                            }, message.info);
                        }
                    },
                    {
                        id: "arrow",
                        name: "Create arrow",
                        cb:  () => {
                            let param = {
                                lineWidth: 50,
                                contents: "Arrow",
                                noLineType: false,
                                noText: false,
                                textPositon: [100, 70],
                                textHeight: 20,
                                arrowShape: [
                                    [10, 60],
                                    [150, 20],
                                    [140, 40],
                                    [190, 0],
                                    [140, -40],
                                    [150, -20],
                                    [10, -40],
                                    [10, 60],
                                ]
                            };
                            vjcommon.drawArrow(map, draw, getDrawOptions(), {
                                "color": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "outlineColor": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, message.info, param);
                        }
                    },
                    {
                        id: "lineTypePolyline",
                        name: "Line type polyline",
                        cb: () => {
                            let param = {
                                mapid: "sys_symbols",
                                version: "v1",
                                linetypeScale: 100,
                                objectid: '40D'
                            };
                            vjcommon.createLineTypePolyline(map, draw, getDrawOptions(), {
                                "color": strokeColor,// color
                                "line_width": lineWidth, // line width
                            }, message.info, param);
                        }
                    },
                    {
                        id: "lineTypeCurve",
                        name: "Line type curve",
                        cb: () => {
                            let param = {
                                mapid: "sys_symbols",
                                version: "v1",
                                linetypeScale: 100,
                                objectid: '40E'
                            };
                            vjcommon.createLineTypeCurve(map, draw, getDrawOptions(), {
                                "color": strokeColor,// color
                                "line_width": lineWidth, // line width
                            }, message.info, param);
                        }
                    },
                    {
                        id: "symbolHatch",
                        name: "Symbol hatch",
                        cb: () => {
                            let param = {
                                mapid: "sys_symbols",
                                version: "v1",
                                patternScale: 400,
                                objectid: '42F'
                            };
                            vjcommon.createHatch(map, draw, getDrawOptions(), {
                                "color": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "outlineColor": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, message.info, param);
                        }
                    },
                    {
                        id: "insertOutSymbol",
                        name: "Insert external symbol",
                        cb: () => {
                            let param = {
                                mapid: "sys_symbols",
                                version: "v1",
                                condition: 'layerindex=1'
                            };
                            vjcommon.createOutSymbol(map, draw, getDrawOptions(), {
                                "fillColor": fillColor,// color
                                "opacity": fillOpacity, // opacity
                                "color": strokeColor,// color
                                "line_width": lineWidth, // line width
                                "line_opacity": fillOpacity, // opacity
                            }, message.info, param);
                        }
                    }
                ]
            },{
                name: "Modify",
                menus: [
                    {
                        id: "undo",
                        name: "Undo",
                        cb: () => {
                            draw.undo();
                        }
                    },
                    {
                        id: "redo",
                        name: "Redo",
                        cb: () => {
                            draw.redo();
                        }
                    },
                    {
                        id: "trash",
                        name: "Delete selected",
                        tooltip: "Select drawn object(s) then click Delete",
                        cb: () => {
                            draw.trash();
                        }
                    },
                    {
                        id: "scaleRotate",
                        name: "Scale/Rotate",
                        tooltip: "Select object(s) then click Scale/Rotate",
                        cb: () => {
                            draw.changeMode("scaleRotateMode");
                        }
                    },
                    {
                        id: "combine",
                        name: "Combine",
                        tooltip:
                            "Combine lines to multiline or polygons to multipolygon. Select multiple then click.",
                        cb: () => {
                            draw.combineFeatures();
                        }
                    },
                    {
                        id: "unCombine",
                        name: "Uncombine",
                        tooltip:
                            "Split multiline to lines or multipolygon to polygons. Select then click.",
                        cb: () => {
                            draw.uncombineFeatures();
                        }
                    },
                    {
                        id: "splitLine",
                        name: "Split line",
                        tooltip:
                            "(1)Select line to split, click“Split line”, draw temp line to split. (2) Then click“Uncombine” to get two parts. (3) Select and press Delete to remove",
                        cb: () => {
                            draw.changeMode("splitLineMode");
                        }
                    },
                    {
                        id: "cutPolygon",
                        name: "Cut polygon",
                        tooltip: "Select polygon, then draw a polygon to cut it",
                        cb: () => {
                            draw.changeMode("cutPolygonMode");
                        }
                    },
                    {
                        id: "polygonToPolyline",
                        name: "Polygon to polyline",
                        tooltip: "Select a polygon, convert to polyline",
                        cb: () => {
                            const sels = draw.getSelectedIds();
                            if (sels.length == 0) return;
                            const ents = draw.getAll();
                            for (let i = 0; i < sels.length; i++) {
                                const idx = ents.features.findIndex((f) => f.id == sels[i]);
                                if (idx == -1) continue;
                                const feature = ents.features[idx];
                                if (feature.geometry.type != "Polygon") continue;
                                feature.geometry.type = "LineString";
                                // @ts-ignore
                                feature.geometry.coordinates = feature.geometry.coordinates[0];
                            }
                            const newEnts = vjmap.cloneDeep(ents);
                            draw.deleteAll();
                            draw.set(newEnts);
                        }
                    },
                    {
                        id: "toMultiPolygon",
                        name: "To multipolygon",
                        tooltip: "Select multiple polygons, convert to multipolygon",
                        cb: () => {
                            draw.doAction("toMultiPolygon");
                        }
                    },
                    {
                        id: "toBezierCurve",
                        name: "To curve",
                        tooltip: "Select a line, convert to curve",
                        cb: () => {
                            vjcommon.toBezierCurve(map, draw);
                        }
                    },
                    {
                        id: "selectRotate",
                        name: "Rotate selected",
                        tooltip: "Select multiple objects to rotate",
                        cb: () => {
                            vjcommon.selectRotate(map, draw, getDrawOptions(), message.info);
                        }
                    },
                    {
                        id: "hideSelected",
                        name: "Hide selected",
                        cb: () => {
                            const sels = draw.getSelectedIds();
                            if (sels.length == 0) return;
                            for (const featureId of sels) {
                                draw.setFeatureProperty(featureId, "isOff", true); // isOff = true to hide
                            }
                            draw.changeMode("simple_select");
                        }
                    },
                    {
                        id: "showAllFeatures",
                        name: "Show all",
                        cb: () => {
                            const ents = draw.getAll();
                            if (ents.features.length == 0) return;
                            for (const feature of ents.features) {
                                // @ts-ignore
                                draw.setFeatureProperty(feature.id, "isOff", undefined); // remove isOff to show
                            }
                            draw.forceRefresh()
                        }
                    },
                    {
                        id: "lockedSelected",
                        name: "Lock selected",
                        tooltip: "Lock selected; locked entities cannot be edited",
                        cb: () => {
                            const sels = draw.getSelectedIds();
                            if (sels.length == 0) return;
                            for (const featureId of sels) {
                                draw.setFeatureProperty(featureId, "isLocked", true);
                            }
                            draw.changeMode("simple_select");
                        }
                    },
                    {
                        id: "unLockedAllFeatures",
                        name: "Unlock all",
                        tooltip: "Unlock all; unlocked entities can be edited",
                        cb: () => {
                            const ents = draw.getAll();
                            if (ents.features.length == 0) return;
                            for (const feature of ents.features) {
                                // @ts-ignore
                                draw.setFeatureProperty(feature.id, "isLocked", undefined); // remove to unlock
                            }
                            draw.changeMode("simple_select");
                        }
                    },
                    {
                        id: "deleteAll",
                        name: "Clear all",
                        cb: () => {
                            let ret = confirm("Clear all drawn objects?");
                            if (!ret) return
                            draw.deleteAll(); // cannot undo
                        }
                    },
                    {
                        id: "save",
                        name: "Save to local cache",
                        cb: async () => {
                            let entsJson = draw.getAll();
                            // To geo coordinates
                            entsJson = map.fromLngLat(entsJson);
                            const curParam = map.getService().currentMapParam() || {};
                            // Use mapid and version as key; this demo uses localStorage; in production save to server
                            const key = `map_drawdata_${curParam.mapid}_${curParam.version}${map
                                .getService()
                                .getCurWorkspaceName()}`;
                            await vjcommon.cacheStorage.setValueByKey(key, entsJson, true)
                            message.info("Saved");
                        }
                    },
                    {
                        id: "load",
                        name: "Load from local cache",
                        cb: async () => {
                            const curParam = map.getService().currentMapParam() || {};
                            const key = `map_drawdata_${curParam.mapid}_${curParam.version}${map
                                .getService()
                                .getCurWorkspaceName()}`;
                            const data = await vjcommon.cacheStorage.getValueByKey(key, false);
                            if (data != "") {
                                try {
                                    vjcommon.loadDataToDraw(map, draw, data, updateMapStyleObj)
                                    message.info("Loaded");
                                } catch (error) {
                                    message.error(error);
                                }
                            }
                        }
                    }
                ]
            },{
                name: "Edit CAD",
                menus: [
                    {
                        id: "modifyCADByPointSel",
                        name: "Modify CAD (point select)",
                        cb: async (context) => {
                            await vjcommon.modifyCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, false);
                        }
                    },
                    {
                        id: "deleteCADByPointSel",
                        name: "Delete CAD (point select)",
                        cb: async (context) => {
                            await vjcommon.deleteCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, false);
                        }
                    },
                    {
                        id: "copyCADByPointSel",
                        name: "Copy CAD (point select)",
                        cb: async (context) => {
                            await vjcommon.copyCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, false);
                        }
                    },
                    {
                        id: "modifyCADByRectSel",
                        name: "Modify CAD (rect select)",
                        divided: true,
                        cb: async (context) => {
                            await vjcommon.modifyCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, true);
                        }
                    },
                    {
                        id: "deleteCADByRectSel",
                        name: "Delete CAD (rect select)",
                        cb: async (context) => {
                            await vjcommon.deleteCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, true);
                        }
                    },
                    {
                        id: "copyCADByRectSel",
                        name: "Copy CAD (rect select)",
                        cb: async (context) => {
                            await vjcommon.copyCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, true);
                        }
                    },
                    {
                        id: "exportCAD",
                        name: "Export as new CAD",
                        divided: true,
                        cb: async ()=>{
                            message.info("Exporting DWG and opening, please wait...")
                            const res = await vjcommon.exportDwg(map, draw);
                            if (res.error) {
                                window.$message.error(res.error);
                                return;
                            }
                            const isCloud = map.getService().serverUrl.indexOf("vjmap.com") >= 0;
                            const host = isCloud ? "https://vjmap.com/app/cloud" : (window.location.origin + "/_cloud");
                            const url = host + `/#/map/${res.mapid}?mapopenway=Memory&version=${res.version}`;
                            window.open(url);
                        }
                    },
                    {
                        id: "exportPdf",
                        name: "Export as PDF",
                        divided: true,
                        cb: async ()=>{
                            message.info("Exporting PDF and opening, please wait...")
                            const res = await vjcommon.exportDwg(map, draw);
                            if (res.error) {
                                window.$message.error(res.error);
                                return;
                            }
        
                            let param; // optional, use defaults if not set
                            /*
                            param = {
                                bIncludeOffLayers: false,
                                bSearchableSHX: false,
                                bSearchableTTF: false,
                                pageWidth: 210, // mm
                                pageHeight: 297, // mm
                                pageLeftMargin: 0,
                                pageRightMargin: 0,
                                pageTopMargin: 0,
                                pageBottomMargin: 0,
                                geomDPI: 600,
                                colorImagesDPI: 400,
                                isBlackWhiteMode: false,
                                isGrayMode: false,
                            }*/
                            const result = await svc.execCommand("exportPdf", param, res.mapid, res.version, true);
                            if (result.error) {
                                message.error(result.error)
                            } else {
                                let pdfUrl = svc.baseUrl() + result.path + "?token=" + svc.accessToken;
                                window.open(pdfUrl, )
                            }
                        }
                    }
                ]
            },{
                name: "Measure",
                menus: [
                    {
                        id: "measureDist",
                        name: "Measure distance",
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureDist");
                        }
                    },
                    {
                        id: "measureArea",
                        name: "Measure area",
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureArea");
                        }
                    },
                    {
                        id: "measureAngle",
                        name: "Measure angle",
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureAngle");
                        }
                    },
                    {
                        id: "measureCoordinate",
                        name: "Measure coordinate",
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureCoordinate");
                        }
                    },
                    {
                        id: "measureCancel",
                        name: "Cancel measure",
                        divided: true,
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureCancel");
                        }
                    }
                ]
            }, {
                name: "Geometry model",
                menus: [...geoModelMenus]
            }, {
                name: "Layout clone",
                menus: [{
                    id: "cloneToRow",
                    name: "Row layout",
                    cb: (context) => {
                        cloneModel("cloneToRow", context)
                    }
                },{
                    id: "cloneToColumn",
                    name: "Column layout",
                    cb: (context) => {
                        cloneModel("cloneToColumn", context)
                    }
                },{
                    id: "cloneToGrid",
                    name: "Grid layout",
                    cb: (context) => {
                        cloneModel("cloneToGrid", context)
                    }
                },{
                    id: "cloneToBrick",
                    name: "Brick layout",
                    cb: (context) => {
                        cloneModel("cloneToBrick", context)
                    }
                },{
                    id: "cloneToHoneycomb",
                    name: "Honeycomb layout",
                    cb: (context) => {
                        cloneModel("cloneToHoneycomb", context)
                    }
                },{
                    id: "cloneToRadial",
                    name: "Radial layout",
                    cb: (context) => {
                        cloneModel("cloneToRadial", context)
                    }
                }]
            },{
                name: "Other",
                menus: [
                    {
                        id: "jsonView",
                        name: "View drawn JSON",
                    },
                    {
                        id: "snapMap",
                        name: "Snap to map points",
                        cb: () => {
                            isSnapMap = true;
                        }
                    },
                    {
                        id: "noSnapMap",
                        name: "Do not snap to map",
                        cb: () => {
                            isSnapMap = false;
                        }
                    },
                    {
                        id: "snapDraw",
                        name: "Snap to drawn points",
                        cb: () => {
                            isSnap = true;
                        }
                    },
                    {
                        id: "noSnapDraw",
                        name: "Do not snap to drawn",
                        cb: () => {
                            isSnap = false;
                        }
                    }
                ]
            }
        ]
        
        // Clone model
        const cloneModel = async (methodName, context) => {
            message.info("Select drawn entity to clone, right-click to finish.")
            let selected = await vjmap.Draw.actionSelect(map, draw);
            if (selected.features.length == 0) {
                message.info("No entity selected")
                return
            }
            // Convert GeoJSON to geometry model
            let symbol = vjgeo.importer.fromGeoJsonData(map.fromLngLat(selected));
            // Get symbol extent
            let extent = vjgeo.measure.modelExtents(symbol)
            // Layout model
            let model;
            let param;
            let margin = +(extent.width / 2).toFixed(2);
            if (methodName == "cloneToRow" || methodName == "cloneToColumn") {
                param = [{title:"count",value:4},{title:"margin",value:margin}]
            } else  if (methodName == "cloneToGrid" || methodName == "cloneToBrick" || methodName == "cloneToHoneycomb") {
                param = [{title:"xCount",value:4},{title:"yCount",value:3},{title:"margin",value:margin}]
            } else if (methodName == "cloneToRadial") {
                message.info("Specify center point")
                let origin = await vjmap.Draw.actionDrawPoint(map);
                let center = map.fromLngLat(origin.features[0].geometry.coordinates);
                param = [{title:"count",value:8},{title:"angleInDegrees",value:45},{title:"rotationOrigin",value:[center.x,center.y]}]
            }
            if (!param) return;
            param = JSON.stringify(param, null, 0)
            let content = await context.prompt("Enter layout clone parameters", param);
            if (!content) return;
            param = JSON.parse(content)
            let args = param.map(p => p); // get parameter values
            model = vjgeo.layout[methodName](symbol, ...args);
            if (!model) return;
            // To GeoJSON
            let json = vjgeo.exporter.toDWG(model, { isGeoJson: true});
            // Interactive draw GeoJSON
            let result = await vjcommon.interactiveCreateGeom(map.toLngLat(json), map, null, null, {disableScale: true,keepGeoSize:true});
            if (!(result && result.feature && result.feature.features)) return;
            let mapJson = draw.getAll();
            result.feature.features.forEach(f => f.id = vjmap.RandomID(10)); // avoid duplicate id
            mapJson.features.push(...result.feature.features);
            draw.set(mapJson);
        }
        
        // Color change event
        const onColorChange = (props) => {
            strokeColor = props.strokeColor;
            fillColor = props.fillColor;
        
            // Update properties
            let data = draw.getSelected();
            for (let i = 0; i < data.features.length; i++) {
                let feature = data.features[i];
                if (feature.geometry.type == "LineString" || feature.geometry.type == "MultiLineString") {
                    draw.setFeatureProperty(feature.id, "color", strokeColor);
                } else if (feature.geometry.type == "Polygon" || feature.geometry.type == "MultiPolygon") {
                    draw.setFeatureProperty(feature.id, "outlineColor", strokeColor);
                } else if (feature.geometry.type == "GeometryCollection") {
                    draw.setFeatureProperty(feature.id, "color", strokeColor);
                }
            }
            for (let i = 0; i < data.features.length; i++) {
                let feature = data.features[i];
                if (feature.geometry.type == "Polygon"  || feature.geometry.type == "MultiPolygon") {
                    draw.setFeatureProperty(feature.id, "color", fillColor);
                } else if (feature.geometry.type == "GeometryCollection" ) {
                    draw.setFeatureProperty(feature.id, "fillColor", fillColor);
                } else if (feature.geometry.type == "Point" || feature.geometry.type == "MultiPoint") {
                    draw.setFeatureProperty(feature.id, "color_inactive", fillColor);
                    draw.setFeatureProperty(feature.id, "color_static", fillColor);
                }
            }
            map.triggerRepaint();
            draw.forceRefresh();
        }
        if (typeof Vue !== "object") {
            // If no Vue/Element UI
            await vjmap.addScript([{
                src: "../../js/vue@2.js"
            }, {
                src: "../../js/element-ui@2.15.10/index.js"
            },{
                src: "../../js/element-ui@2.15.10/index.css"
            }])
        }
        
        let app = new Vue({
            el: '#ui',
            data: {
                dialogVisible: false,
                strokeColor: "#ff0000",
                fillColor: "#00ffff",
                menus: menus,
                jsonData: ''
            },
            watch: {
                strokeColor(val) {
                    onColorChange({
                        strokeColor: val,
                        fillColor: this.strokeColor,
                    });
                },fillColor(val) {
                    onColorChange({
                        strokeColor: this.strokeColor,
                        fillColor: val,
                    });
                }
            },
            methods: {
                handleMeasureSelect(cmdId) {
                    vjcommon.cancelDraw(map); // Cancel previous draw when selecting command
                    let func;
                    for(let group of menus) {
                        const menu = group.menus.find(m => m.id == cmdId);
                        if (menu) {
                            func = menu.cb;
                            if (menu.tooltip) {
                                message.info(menu.tooltip)
                            }
                            break;
                        }
                    }
                    if (func) func(this);
                    else if (cmdId == "jsonView") {
                        let data = draw.getAll();
                        if (draw.getSelectedIds().length > 0) {
                            // If selected, show selected data
                            data = draw.getSelected()
                        }
                        this.jsonData = JSON.stringify(map.fromLngLat(data), null, 4);
                        this.dialogVisible = true;
                    } else {
                        message.error("unknown command " + cmdId)
                    }
                },
                prompt(content, inputValue) {
                    return new Promise((resolve, reject) => {
                        this.$prompt(content, 'Prompt', {
                            inputValue,
                            confirmButtonText: 'OK',
                            cancelButtonText: 'Cancel',
                            closeOnClickModal: false
                        }).then(({ value }) => {
                            resolve(value)
                        }).catch(() => {
                            reject();
                        });
                    })
                },
                confirm(content) {
                    return new Promise((resolve, reject) => {
                        this.$confirm(content, 'Confirm', {
                            confirmButtonText: 'OK',
                            cancelButtonText: 'Cancel',
                            type: 'warning'
                        }).then(() => {
                            resolve(true);
                        }).catch(() => {
                            resolve();
                        });
                    })
                }
            },
            template: `
              <template>
                <div style="position: absolute; z-index: 2;left:10px; top:10px">
                  <el-row>
                    <el-button-group size="mini" >
                      <el-dropdown size="mini" @command="handleMeasureSelect" v-for="menu in menus" :key="menu.name">
                        <el-button type="primary" size="mini" plain>{{menu.name}}</el-button>
                        <el-dropdown-menu slot="dropdown">
                          <el-dropdown-item :command="m.id" v-for="m in menu.menus" :divided="m.divided">{{m.name}}</el-dropdown-item>
                        </el-dropdown-menu>
                      </el-dropdown>
                    </el-button-group>
                    <el-tag type='success' size="medium">Stroke</el-tag>
                    <el-color-picker v-model="strokeColor" size="mini" style="top:10px"></el-color-picker>
                    <el-tag type='success' size="medium">Fill</el-tag>
                    <el-color-picker v-model="fillColor" size="mini" style="top:10px"></el-color-picker>
                  </el-row>
                  <el-dialog
                    title="View"
                    :visible.sync="dialogVisible"
                    :modal="false"
                    width="550px">
                    <el-form  label-width="140px" size="mini">
                      <el-input
                        type="textarea"
                        :rows="15"
                        v-model="jsonData">
                      </el-input>
                    </el-form>
                  </el-dialog>
                </div>
              </template>
            `
        })
        
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