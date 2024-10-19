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
        // --自定义绘图控件界面风格--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
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
        
        
        // 具体文档查看 https://vjmap.com/guide/draw.html
        const opts = vjmap.Draw.defaultOptions();
        opts.isActionDrawMode = true; // 按钮都隐藏，界面用自己的
        
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
                        isClosed: true // 是否自动闭合
                    }*/)
                    break;
                case "polygon":
                    draw.changeMode("draw_polygon")
                    break;
                case "fillExtrusion":
                    draw.changeMode("draw_polygon", {
                        drawType: "fillExtrusion" // 可以写一些自定义属性数据，然后在draw.create中通过上下文来获取这个属性，判断是绘制多边形还是拉伸
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
                    draw.deleteAll(); // 不能撤销还原
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
                    message.info(`当前选择的个数: ${sels.length}`);
                    break;
                case "getAllCoord": {
                    let allents = draw.getAll();
                    let tip = "";
                    for (let f of allents.features) {
                        let featureType = f.geometry.type;
                        // 把经纬度转成地理坐标
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
                    // 先选中此实体
                    draw.changeMode("simple_select", {featureIds: [featureId]});
                    // 再进入编辑模式
                    draw.changeMode("direct_select", {featureId: featureId});
                }
                    break;
                case "changeColor": {
                    let sels = draw.getSelectedIds();
                    if (sels.length <= 0) return;
                    for (let featureId of sels) {
                        draw.setFeatureProperty(featureId, "color", vjmap.randomColor()); // 随机生成一个颜色
                        // 如果要修改坐标，如只保留线的前两个坐标，可用如下代码
                        /*
                        let feature = draw.get(featureId)
                        if (feature.geometry.type == "LineString") {
                            draw.setFeatureProperty(featureId, "coordinates", feature.geometry.coordinates.splice(0, 2));
                        }*/
                    }
                    map.triggerRepaint(); // 刷新
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
                    // 转成地理坐标
                    entsJson = map.fromLngLat(entsJson);
                    let curParam = map.getService().currentMapParam() || {};
                    // 用地图的mapid和版本号做为key值，把数据保存起来，这里演示只是做数据保存到了localStorage,实际中请保存至后台数据库中
                    let key = `map_drawdata_${curParam.mapid}_${curParam.version}`;
                    window.localStorage.setItem(key, JSON.stringify(entsJson));
                    message.info('保存成功')
                }
                    break;
                case "load": {
                    // 用地图的mapid和版本号做为key值, 这里演示只是从localStorage去加载,实际中请从后台去请求数据加载
                    let curParam = map.getService().currentMapParam() || {};
                    let key = `map_drawdata_${curParam.mapid}_${curParam.version}`;
                    let data = window.localStorage.getItem(key);
                    if (data && data != "") {
                        try {
                            data = JSON.parse(data);
                            draw.set(map.toLngLat(data));
                            message.info("加载成功")
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
                        draw.setFeatureProperty(featureId, "isOff", true); // isOff属性设置为true，即为隐藏了
                    }
                    draw.changeMode('simple_select')
                }
                    break;
                case 'showAllFeatures': {
                    let ents = draw.getAll();
                    if (ents.features.length == 0) return;
                    for (let feature of ents.features) {
                        draw.setFeatureProperty(feature.id, "isOff", undefined); // isOff属性移除了。默认就是显示
                    }
                    // 刷新下
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
                        draw.setFeatureProperty(feature.id, "isLocked", undefined); //属性移除了。默认就是不锁定
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
        // 之前是禁止编辑，现设置成允许编辑
                            draw.setFeatureProperty(featureId, "disable_edit", undefined);
                        } else {
        // 之前是允许编辑，现设置成禁止编辑
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
                    // 把曲线上的点转为贝塞尔曲线参数
                    const c = vjmap.polylineToBezierCurve(map.fromLngLat(feature.geometry.coordinates).map(e => [e.x, e.y]));
                    // 据贝塞尔曲线参数离散成线
                    const curvePath = vjmap.bezierCurveToPolyline(c, 100);
                    draw.setFeatureProperty(feature.id, "coordinates", map.toLngLat(curvePath));
                } else {
                    let coordinates = []
                    for (let p = 0; p < feature.geometry.coordinates.length; p++) {
                        // 把曲线上的点转为贝塞尔曲线参数
                        const c = vjmap.polylineToBezierCurve(map.fromLngLat(feature.geometry.coordinates[p]).map(e => [e.x, e.y]));
                        // 据贝塞尔曲线参数离散成线
                        const curvePath = vjmap.bezierCurveToPolyline(c, 1000);
                        coordinates.push(map.toLngLat(curvePath));
                    }
                    draw.setFeatureProperty(feature.id, "coordinates", coordinates);
                }
            }
            // 重新再获取一次所选择的实体数据
            let newFeatures = draw.getSelected().features.filter(e => e.geometry.type == "LineString" || e.geometry.type == "Polygon");
            // 用于撤销，重做
            map.fire('draw.update', {
                action: "toBezierCurve",
                features: vjmap.cloneDeep(newFeatures), // 更新后的数据
                prevFeatures: preFeatures, // 更新前的数据
                styleId: draw.options.styleId
            });
            draw.changeMode("simple_select")
        }
        
        // 选择多个实体进行旋转
        const selectRotate = async ()=> {
            // 先进行选择，点右键确定选择
            let selected = await vjmap.Draw.actionSelect(map, draw, );
            if (selected.features.length == 0) return;// 如果没有要选择的实体
        
            message.info("请指定的旋转的基点");
            let basePointRes = await vjmap.Draw.actionDrawPoint(map, { });
            if (basePointRes.cancel) {
                return;// 取消操作
            }
            message.info("请指定要旋转的角度");
            let basePoint = basePointRes.features[0].geometry.coordinates;
            let endPoint = basePoint;
            // 可以做一条辅助线显示
            let tempLine = new vjmap.Polyline({
                data: [basePoint, endPoint],
                lineColor: 'yellow',
                lineWidth: 1,
                lineDasharray: [2, 2]
            });
            tempLine.addTo(map);
        
            // 先把选择的复制下，用于取消还原
            let oldSelected = vjmap.cloneDeep(selected.features);
            let rotatePointRes = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    endPoint = e.lnglat;
                    // 修改临时线坐标
                    tempLine.setData([basePoint, endPoint])
                    let angle = map.fromLngLat(endPoint).angleTo(map.fromLngLat(basePoint));
        
                    let updateFeatures = vjmap.cloneDeep(oldSelected); // 先用之前保存的数据，不要用更新完的数据
                    // 修改选择的实体的坐标
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
            tempLine.remove();//删除临时线
            if (rotatePointRes.cancel) {
                // 还原回来的
                for(let i = 0; i < oldSelected.length; i++) {
                    draw.setFeatureProperty(oldSelected[i].id, "coordinates", oldSelected[i]);
                }
                draw.forceRefresh();
                return;// 取消操作
            }
        
        }
        // 绘制文本
        const drawSymol = async () => {
            let text = prompt("请输入文本内容：");
            if (!text) return
            let feature = {type: 'Point', coordinates: [0, 0]};
            let featureIds = draw.add(feature);
            let featureId = featureIds[0];
            // 设置文本内容
            draw.setFeatureProperty(featureId, "symbol", true); // 设置为文字符号
            draw.setFeatureProperty(featureId, "text", text);
            draw.setFeatureProperty(featureId, "color", vjmap.randomColor());
            draw.setFeatureProperty(featureId, "hoverPointer", true); // 允许非编辑模式下高亮
        
            // 如果需要画图标，不需要不要设置就可以
            draw.setFeatureProperty(featureId, "icon_image", "sensor1");
        
            // 移动位置
            let textPoint = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    let feature = draw.get(featureId);
                    // 修改坐标
                    feature.geometry.coordinates = e.lnglat;
                    draw.delete(featureId);
                    draw.add(feature)
                }
            });
            if (textPoint.cancel) {
                draw.delete(featureId);
                return;// 取消操作
            }
        
            message.info("请拉线设置文字高度");
            // 下面获取文字大小
            // 可以做一条辅助线显示
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
                    // 修改临时线坐标
                    tempLine.setData([startPoint, endPoint])
                }
            });
            let size = 22;
            if (!sizePoint.cancel) {
                // 如果不是取消
                const co = map.fromLngLat(endPoint);
                let dist = co.distanceTo(map.fromLngLat(startPoint));
                let len = map.geoToPixelLength(dist, map.getZoom());
                size = Math.round(len * 2);
            }
            let isScale = curDrawActionName === "symbolscale";
            if (isScale) {
                // 为了使文字随缩放级别缩放，每个级别的字体大小都要设置下
                let zoom = Math.round(map.getZoom());
                for (let i = 1; i <= 24; i++) {
                    // 设置文字高度
                    let textSize = Math.pow(2, i - zoom) * size;
                    if (textSize > 150) textSize = 150;
                    draw.setFeatureProperty(featureId, "text_size_zoom" + i, textSize);
                }
        
                // 自动缩放，需要设置级别的缩放大小
                let iconSize = 1;
                for (let i = 1; i <= 24; i++) {
                    // 设置图标大小
                    let sz = Math.pow(2, i - zoom) * iconSize;
                    //if (sz > 1) continue;
                    draw.setFeatureProperty(featureId, "icon_size_zoom" + i, sz);
                }
            }
        
            if (curDrawActionName === "symbolscale") {
                // 需要缩放的才缩放旋转角度，不缩放的永远的视图保存一致,不用设置旋转
                message.info("请拉线设置文字旋转角度")
                // 设置文字旋转角度
                tempLine.setData([startPoint, startPoint])
                let anglePoint = await vjmap.Draw.actionDrawPoint(map, {
                    updatecoordinate: (e) => {
                        if (!e.lnglat) return;
                        endPoint = e.lnglat;
                        // 修改临时线坐标
                        tempLine.setData([startPoint, endPoint])
                    }
                });
        
                if (!anglePoint.cancel) {
                    //  如果不是取消
                    let angle = -map.fromLngLat(endPoint).angleTo(map.fromLngLat(startPoint)) * 180.0 / Math.PI;
                    // 设置旋转角度
                    draw.setFeatureProperty(featureId, "text_rotate", angle);
                    draw.setFeatureProperty(featureId, "icon_rotate", angle);
                }
            }
            tempLine.remove(); // 辅助绘制完成，删除
        }
        
        // 创建完后修改颜色
        map.on("draw.create", function (e) {
            let color = vjmap.randomColor();
            for (let i = 0; i < e.features.length; i++) {
                let id = e.features[i].id;
                if (!draw.get(id)) continue;
                draw.setFeatureProperty(id, "color", color);
                draw.setFeatureProperty(id, "hoverPointer", true); // 允许非编辑模式下高亮
        
                //draw.setFeatureProperty(id, "minZoom", i);
                //draw.setFeatureProperty(id, "maxZoom", i + 5);
        
        
                // 如果当前上下文选项有的drawType值为"fillExtrusion",做拉伸处理
                if ( e.state.options.drawType === "fillExtrusion") {
                    // 如果是拉伸多边形，要设置高度
                    // 高度默认设置外包的矩形的四分之一吧
                    let bounds = map.getFeatureBounds(e.features[i], true)
                    draw.setFeatureProperty(id, "extrusionHeight", prj.toMeter(bounds.width() / 4));
                }
            }
        });
        
        const popup = new vjmap.Popup({
            closeButton: false
        });
        // 非编辑模式下，鼠标悬浮时，显示信息提示内容
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
                message.info(`您点击了id为：${e.event.featureTarget.properties.id} 的实体`)
            }
        });
        
        
        
        // 查询数据 queryParam 查询条件； propData 属性数据
        let globalIndex = 0;
        const getQueryGeomData = async (queryParam, propData = {})=> {
            let res = await svc.conditionQueryFeature({
                fields: "",
                includegeom: true, // 是否返回几何数据,为了性能问题，realgeom为false时，如果返回条数大于1.只会返回每个实体的外包矩形，如果条数为1的话，会返回此实体的真实geojson；realgeom为true时每条都会返回实体的geojson
                realgeom: true,
                limit: 10000, //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
                ...queryParam
            })
            const features = []
            if (res && res.result && res.result.length > 0) {
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = map.entColorToHtmlColor(ent.color); // 实体颜色转html颜色
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
                                    ...propData // 把额外的属性数据加上
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
        
        // data geojson数据；basePt基点，destPt要移动至的位置；scale 缩放倍数，angle旋转角度
        const transformGeoJsonData = (data, basePt, destPt, scale = 1.0, angle = 0.0) => {
            return vjmap.transform.convert(data, (pt) => {
                let point = map.fromLngLat(vjmap.geoPoint(pt));
                point.transform(basePt, destPt, scale, angle);
                return map.toLngLat(point) ;
            });
        }
        
        
        const createOutSymbol = async () => {
            message.info("请移动鼠标将要绘制的符号移动至指定位置点击进行绘制")
            let symbolId = vjmap.randInt(1, 2) ; // 随机画一个符号
            let symbolMapId = "sys_symbols";
            let symbolMapVer = "v1";
            let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true)
            // 获取到的数据，如果条件不变，建议加上缓存，不要每次去后台获取，这里演示就直接每次去获取了
            let data = await getQueryGeomData({
                mapid: symbolMapId,
                version: symbolMapVer,
                layer: styleName,
                condition: `layerindex=${symbolId}`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
            }, {
                symbolId: vjmap.RandomID(),
                lineWidth: 3,
                color: vjmap.randomColor() /*颜色可以覆盖之前的*/
            });
        
            let drawDestPt = await vjmap.Draw.actionDrawPoint(map, {});
            if (drawDestPt.cancel) {
                return ;// 取消操作
            }
            // 已经获取了要绘制到哪的目的地坐标
            let destPt = map.fromLngLat(drawDestPt.features[0].geometry.coordinates);
        
            // 获取数据范围
            let dataBounds = vjmap.getGeoBounds(data);
            //  要放置的位置点
            let drawData = transformGeoJsonData(vjmap.cloneDeep(data), map.fromLngLat(dataBounds.center()), destPt, vjmap.randInt(1, 10) / 20.0)
        
            let addFeatureIds = []
            drawData.features.forEach(feature => {
                addFeatureIds.push(...draw.add(feature));
            });
        
            // 先选中此实体
            draw.changeMode("simple_select", {featureIds: addFeatureIds});
            // 然后组合成一个
            draw.combineFeatures();
        }
        
        // 显示隐藏图层代码
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
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "40px", right: "140px"}}>
                        <h4>绘图类型：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("point")}>点
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("line")}>线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("polygon")}>多边形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("fillExtrusion")}>拉伸多边形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("circle")}>圆
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("rectangle")}>矩形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("slantRectangle")}>斜矩形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("symbolscale")}>缩放图标文本
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("symbol")}>文本图标
                            </button>
                        </div>
                        <h4>绘图工具：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("trash")}>删除
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("scaleRotate")}>缩放旋转
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("combine")}>组合实体
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("unCombine")}>取消组合
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("splitLine")}>分割线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("cutPolygon")}>分割多边形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("toMultiPolygon")}>合并成多多边形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("toBezierCurve")}>转化为曲线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("selectRotate")}>选择多个旋转
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("deleteAll")}>清空全部实体
                            </button>
                        </div>
        
        
                    </div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <h4>编辑：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("undo")}>撤销
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("redo")}>重做
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("static")}>浏览模式
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("simple_select")}>编辑模式
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("hideSelected")}>隐藏所选实体
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("showAllFeatures")}>显示全部实体
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("lockedSelected")}>锁定所选实体
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("unLockedAllFeatures")}>解锁全部实体
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("lockedEdit")}>禁止编辑实体
                            </button>
                        </div>
                        <h4>捕捉设置：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("snapPoint")}>捕捉点
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("snapGrid")}>捕捉网格
                            </button>
                        </div>
                        <h4>数据获取：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("getSelected")}>获取选择的个数
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("getAllCoord")}>所有实体坐标
                            </button>
                        </div>
                        <h4>保存打开：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("save")}>保存
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("load")}>加载
                            </button>
                        </div>
                        <h4>扩展功能：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("editFirst")}>编辑第一个实体
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doAction("changeColor")}>修改选择颜色
                            </button>
                        </div>
                        <div className="input-item">
                            <button className="btn" onClick={ () => createOutSymbol() }>插入外部图形符号</button>
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