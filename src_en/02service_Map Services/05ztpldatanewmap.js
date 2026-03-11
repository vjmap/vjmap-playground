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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05ztpldatanewmap
        // --Auto generate map from template data--Generate and export DWG from CAD template + data
        // Template map ID and version
        let templateId = "sys_drawtemplate";
        let templateSecVersion = "v1";
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        
        // Note: objectid source: open template in cloud manager (memory) or geometry render, click entity, get object from property panel; for block (objectid with multiple _), use string before first _
        let symbols = {
            "symbol1": "8F9",// symbol1 objectid
            "symbol2": "92A" ,// symbol2 objectid
        }
        let lineObjectId = "905"; // line objectid
        let arrowObjectId = "909"; // arrow objectid
        let textObjectId = "8FA"; // text objectid
        // Mock data
        const mockData = (num) => {
            num = num || 5;
            let lines = []
            for(let i = 0; i < num; i++) {
                let items = {
                    points: [],
                    textColor: vjmap.randomColor(),
                    lineColor: vjmap.randomColor(),
                    arrowColor: vjmap.randomColor()
                }
                for(let k = 0; k < 3; k++) {
                    items.points.push({
                        symbol: (k % 2 == 0) ? "symbol1" : "symbol2",
                        text: "CY" + vjmap.randInt(0, 1000),
                        position: [vjmap.randInt(-50, 50), vjmap.randInt(-50, 50)],
                        symbolColor: vjmap.randomColor()
                    })
                }
                lines.push(items);
            }
            return lines
        }
        
        // Create map document
        const createDoc = async (Data) => {
            let drawData = Data;
        
            let doc = new vjmap.DbDocument();
            doc.from = `${templateId}/${templateSecVersion}`;
        
            doc.isClearFromDb = true;
            let entitys = [];
        
            for(let ln = 0; ln < drawData.length; ln++) {
                let lineItem = drawData[ln];
                let textColor = lineItem.textColor;
                let lineColor = lineItem.lineColor;
                let arrowColor = lineItem.arrowColor;
                for(let pt = 0; pt < lineItem.points.length; pt++) {
                    let point = lineItem.points[pt];
                    entitys.push(new vjmap.DbBlockReference({
                        cloneObjectId: symbols[point.symbol],
                        position: point.position,
                        color: vjmap.htmlColorToEntColor(point.symbolColor)
                    }))
        
                    entitys.push(new vjmap.DbText({
                        cloneObjectId: textObjectId,
                        position: [point.position[0], point.position[1]-0.5],
                        horizontalMode: vjmap.DbTextHorzMode.kTextCenter, // kTextCenter
                        verticalMode: vjmap.DbTextVertMode.kTextTop, // kTextVertMid,
                        color: vjmap.htmlColorToEntColor(textColor)
                    }))
        
                    if (pt != 0) {
                        let startPt = lineItem.points[pt - 1].position;
                        let endPt = lineItem.points[pt].position;
                        entitys.push(new vjmap.Db2dPolyline({
                            cloneObjectId: lineObjectId,
                            points: [startPt, endPt],
                            color: vjmap.htmlColorToEntColor(lineColor)
                        }))
        
                        let midPt = [(startPt[0] + endPt[0]) / 2.0, (startPt[1] + endPt[1]) / 2.0];
                        entitys.push(new vjmap.DbBlockReference({
                            cloneObjectId: arrowObjectId,
                            position: midPt,
                            matrix: [
                                {
                                    op: "rotate",
                                    angle: vjmap.geoPoint(startPt).angleTo(vjmap.geoPoint(endPt)),
                                    origin: midPt
                                }
                            ],
                            color: vjmap.htmlColorToEntColor(arrowColor)
                        }))
        
                        let arrowTextPoint = [midPt[0], midPt[1] + 1];
                        let arrowTextAngle = vjmap.geoPoint(startPt).angleTo(vjmap.geoPoint(endPt));
                        if (arrowTextAngle > Math.PI / 2 && arrowTextAngle < Math.PI * 3 / 2 ) {
                            arrowTextAngle += Math.PI
                        }
                        entitys.push(new vjmap.DbText({
                            cloneObjectId: textObjectId,
                            position: arrowTextPoint,
                            horizontalMode: vjmap.DbTextHorzMode.kTextCenter,
                            verticalMode: vjmap.DbTextVertMode.kTextVertMid,
                            color: vjmap.htmlColorToEntColor(arrowColor),
                            matrix: [
                                {
                                    op: "rotate",
                                    angle: arrowTextAngle,
                                    origin: arrowTextPoint
                                }
                            ],
                        }))
                    }
                }
            }
        
            doc.entitys = entitys;
            return doc;
        }
        
        
        // Set an initial extent (arbitrary); export will compute real bounds from entity coords
        let mapBounds = '[-10000,-10000,10000,10000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        mapExtent = mapExtent.square();
        
        svc.setCurrentMapParam({
            darkMode: true,
            bounds: mapExtent.toString()
        })
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },
            center: [0,0],
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        
        map.fitMapBounds();
        await map.onLoad();
        
        
        const createGeomData = async (map, doc) => {
            let svc = map.getService();
            let res = await svc.cmdCreateEntitiesGeomData({
                filedoc: JSON.stringify(doc)
            });
            if (res.error) {
                message.error(res.error);
                return {
                    type: "FeatureCollection",
                    features: []
                };
            }
            if (res.metadata && res.metadata.mapBounds) {
                map.updateMapExtent(res.metadata.mapBounds);
            }
        
            const features = [];
            if (res && res.result && res.result.length > 0) {
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = map.entColorToHtmlColor(ent.color);
                        let featureAttr = {};
                        if (ent.isPolygon) {
                            featureAttr.color = clr;
                            featureAttr.noneOutline = true;
                        } else {
                            featureAttr.color = clr;
                            featureAttr.line_width = ent.lineWidth;
                        }
                        for(let g = 0; g < ent.geom.geometries.length; g++) {
                            if (ent.geom.geometries[g].type == "Point") {
                                // Convert to line with same start and end
                                ent.geom.geometries[g].type = "LineString";
                                ent.geom.geometries[g].coordinates = [
                                    ent.geom.geometries[g].coordinates,
                                    ent.geom.geometries[g].coordinates
                                ]
                            }
                        }
        
                        let ft = {
                            id: vjmap.RandomID(10),
                            type: "Feature",
                            properties: {
                                objectid: ent.objectid,
                                opacity: ent.alpha / 255,
                                ...featureAttr,
                            }
                        }
                        if (ent.geom.geometries.length == 1) {
                            features.push({
                                ...ft,
                                geometry: ent.geom.geometries[0],
                            });
                        } else {
                            features.push({
                                ...ft,
                                geometry: {
                                    geometries: ent.geom.geometries,
                                    type: "GeometryCollection"
                                },
                            });
                        }
        
                    }
                }
            }
            return {
                type: "FeatureCollection",
                features: features,
            };
        };
        
        // Clear previous map data
        const clearMapData = () => {
            svc.setCurrentMapParam({
                darkMode: true,
                bounds: mapExtent.toString()
            })
            map.disableLayerClickHighlight();
            map.removeDrawLayer();
            let sources = map.getStyle().sources;
            for(let source in sources) {
                map.removeSourceEx(source);
            }
        }
        
        // Create map with data
        const createDataMap = async (doc) => {
            clearMapData();
            let geojson = await createGeomData(map, doc);
            map.getDrawLayer().set(geojson);
        }
        
        // Create DWG map
        const createDwgMap = async (doc) => {
            clearMapData();
            let res = await svc.updateMap({
                mapid: vjmap.getTempMapId(1), // Temp map auto-delete time in minutes when not viewed; default 30
                filedoc: JSON.stringify(doc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // Use 0xFFFFFF for light div background
                }
            })
            if (res.error) {
                message.error(res.error)
            }
            await map.switchMap(res);
        }
        
        
        let curDoc;
        const exportDwgOpen = async () => {
            if (!curDoc) return;
            const mapid = 'exportdwgmap';
            let res = await svc.updateMap({
                mapid: mapid,
                filedoc: JSON.stringify(curDoc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // Use 0xFFFFFF for light div background
                }
            })
            if (res.error) {
                message.error(res.error)
            } else{
                window.open(`https://vjmap.com/app/cloud/#/map/${res.mapid}?version=${res.version}&mapopenway=Memory&vector=false`)
            }
        }
        
        
        const creatDataMap = async () => {
            let Data = mockData(5);
            const doc = await createDoc(Data);
            await createDataMap(doc);
            map.fitMapBounds();
            curDoc = doc;
        }
        const creatDwgMap = async () => {
            let Data = mockData(15);
            const doc = await createDoc(Data);
            await createDwgMap(doc);
            map.fitMapBounds();
            map.enableLayerClickHighlight(svc, e => {
                if (!e) return;
                let msg = {
                    content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                    key: "layerclick",
                    duration: 5
                }
                e && message.info(msg);
            })
            curDoc = doc;
        }
        creatDataMap();
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: '430px'}}>
                        <div className="input-item">
                            <button className="btn btn-full mr0" onClick={creatDataMap}>Random generate map (frontend draw, for small maps)</button>
                            <button className="btn btn-full mr0" onClick={creatDwgMap}>Random generate map (backend DWG, for large maps)</button>
                            <button className="btn btn-full mr0" onClick={exportDwgOpen}>Export as DWG and open</button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
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