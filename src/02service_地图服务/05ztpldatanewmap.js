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
        // --基于模板数据自动成图--根据一个cad图模板，用数据自动生成导出dwg图形
        // 图模板来源地图id和版本
        let templateId = "sys_drawtemplate";
        let templateSecVersion = "v1";
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        
        // 注：以下所的有objectid来源方法为：
        // 在唯杰云端管理平台里面以内存方式打开模板图，然后点击相应实体，在属性面板中获取object值
        // 或者以几何渲染方式打开模板图，点击相应实体，在属性面板中获取object值，如果是块实体(objectid中有多个_),取第一个_前面的字符串
        let symbols = {
            "symbol1": "8F9",//符号一objectid
            "symbol2": "92A" ,//符号二objectid
        }
        let lineObjectId = "905"; //线objectid
        let arrowObjectId = "909"; //箭头objectid
        let textObjectId = "8FA"; //文字objectid
        // 模拟数据
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
                        symbol: (k % 2 == 0) ? "symbol1" : "symbol2", // 模拟用，偶数点用符号二，奇数点用符号二
                        text: "CY" + vjmap.randInt(0, 1000), // 随机生成一个文本值
                        position: [vjmap.randInt(-50, 50), vjmap.randInt(-50, 50)],
                        symbolColor: vjmap.randomColor()
                    })
                }
                lines.push(items);
            }
            return lines
        }
        
        // 创建图
        const createDoc = async (Data) => {
            // 获取要绘制的数据
            let drawData = Data;
        
            let doc = new vjmap.DbDocument();
            // 数据来源
            doc.from = `${templateId}/${templateSecVersion}`;
        
            // 把来源图的数据最后都清空，（这里的模板不需要清空，直接用了)
            doc.isClearFromDb = true;
            let entitys = [];
        
            // 所有线
            for(let ln = 0; ln < drawData.length; ln++) {
                let lineItem = drawData[ln];
                let textColor = lineItem.textColor; // 文本颜色
                let lineColor = lineItem.lineColor; // 线颜色
                let arrowColor = lineItem.arrowColor; // 箭头颜色
                // 线上所有点
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
                        // 创建两点之间的线
                        let startPt = lineItem.points[pt - 1].position;
                        let endPt = lineItem.points[pt].position;
                        entitys.push(new vjmap.Db2dPolyline({
                            cloneObjectId: lineObjectId,
                            points: [startPt, endPt],
                            color: vjmap.htmlColorToEntColor(lineColor)
                        }))
        
                        // 在中点创建一个箭头
                        let midPt = [(startPt[0] + endPt[0]) / 2.0, (startPt[1] + endPt[1]) / 2.0];
                        entitys.push(new vjmap.DbBlockReference({
                            cloneObjectId: arrowObjectId,
                            position: midPt,
                            // 旋转
                            matrix: [
                                {
                                    op: "rotate", // 旋转
                                    angle: vjmap.geoPoint(startPt).angleTo(vjmap.geoPoint(endPt)), // 弧度
                                    origin: midPt // 旋转基点
                                }
                            ],
                            color: vjmap.htmlColorToEntColor(arrowColor)
                        }))
        
                        let arrowTextPoint = [midPt[0], midPt[1] + 1];
                        let arrowTextAngle = vjmap.geoPoint(startPt).angleTo(vjmap.geoPoint(endPt));
                        if (arrowTextAngle > Math.PI / 2 && arrowTextAngle < Math.PI * 3 / 2 ) {
                            // 使文字不倒立
                            arrowTextAngle += Math.PI
                        }
                        // 箭头上方的文本
                        entitys.push(new vjmap.DbText({
                            cloneObjectId: textObjectId,
                            position: arrowTextPoint,
                            horizontalMode: vjmap.DbTextHorzMode.kTextCenter, // kTextCenter
                            verticalMode: vjmap.DbTextVertMode.kTextVertMid, // kTextVertMid,
                            color: vjmap.htmlColorToEntColor(arrowColor),
                            // 旋转
                            matrix: [
                                {
                                    op: "rotate", // 旋转
                                    angle: arrowTextAngle, // 弧度
                                    origin: arrowTextPoint // 旋转基点
                                }
                            ],
                        }))
                    }
                }
            }
        
            doc.entitys = entitys;
            return doc;
        }
        
        
        // 先得设置一个要图形的所有范围，这个范围是随便都没有有关系的。最后导出dwg时，会根据实体的所有坐标去自动计算真实的范围。
        let mapBounds = '[-10000,-10000,10000,10000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        mapExtent = mapExtent.square(); // 要转成正方形
        
        svc.setCurrentMapParam({
            darkMode: true, // 由于没有打开过图，所以主动设置黑色模式
            bounds: mapExtent.toString()
        })
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },// 矢量瓦片样式
            center: [0,0], // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        
        
        // 创建一个几何对象
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
                // 如果返回的元数据里面有当前地图的范围，则更新当前地图的坐标范围
                map.updateMapExtent(res.metadata.mapBounds);
            }
        
            const features = [];
            if (res && res.result && res.result.length > 0) {
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = map.entColorToHtmlColor(ent.color); // 实体颜色转html颜色
                        let featureAttr = {};
                        // 因为要组合成一个组合实体，所以线和多边形的颜色得区分
                        if (ent.isPolygon) {
                            featureAttr.color = clr; // 填充色，只对多边形有效
                            featureAttr.noneOutline = true; // 不显示多边形边框，只对多边形有效
                        } else {
                            featureAttr.color = clr; // 颜色
                            featureAttr.line_width = ent.lineWidth; // 线宽
                        }
                        for(let g = 0; g < ent.geom.geometries.length; g++) {
                            if (ent.geom.geometries[g].type == "Point") {
                                // 改成起始和终点一样的线
                                ent.geom.geometries[g].type = "LineString";
                                ent.geom.geometries[g].coordinates = [
                                    ent.geom.geometries[g].coordinates, // 始点
                                    ent.geom.geometries[g].coordinates // 终点
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
        
        // 清空之前的地图数据
        const clearMapData = () => {
            svc.setCurrentMapParam({
                darkMode: true, // 由于没有打开过图，所以主动设置黑色模式
                bounds: mapExtent.toString()
            })
            map.disableLayerClickHighlight();
            map.removeDrawLayer();
            let sources = map.getStyle().sources;
            for(let source in sources) {
                map.removeSourceEx(source);
            }
        }
        
        // 创建一个有数据的地图
        const createDataMap = async (doc) => {
            clearMapData();
            let geojson = await createGeomData(map, doc);
            map.getDrawLayer().set(geojson);
        }
        
        // 创建一个dwg的地图
        const createDwgMap = async (doc) => {
            // 先清空之前绘制的
            clearMapData();
            // js代码
            let res = await svc.updateMap({
                // 获取一个临时的图id(临时图形只会用临时查看，过期会自动删除)
                mapid: vjmap.getTempMapId(1), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
                filedoc: JSON.stringify(doc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
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
                    backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
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
            // 点击有高亮状态（鼠标点击地图元素上时，会高亮)
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
        // 随机生成一个图
        creatDataMap();
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: '430px'}}>
                        <div className="input-item">
                            <button className="btn btn-full mr0" onClick={creatDataMap}>随机生成一个图[前端直接绘制,适合于生成图不大的情况]</button>
                            <button className="btn btn-full mr0" onClick={creatDwgMap}>随机生成图[后台生成DWG前端展示,适合于生成图大的情况]</button>
                            <button className="btn btn-full mr0" onClick={exportDwgOpen}>导出成DWG图并打开</button>
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