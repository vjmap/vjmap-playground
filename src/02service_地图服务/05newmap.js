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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05newmap
        // --新建地图[先预览后生成DWG图]--在前端先预览生成的图形，再导出打开DWG图
        const createDwgDoc = () => {
            let doc = new vjmap.DbDocument();
            let entitys = [];
            let line1 = new vjmap.DbLine();
            line1.start = [0, 0]
            line1.end = [0, 15]
            entitys.push(line1)
        
        
            let line2 = new vjmap.DbLine();
            line2.start = [0, 14.1]
            line2.end = [2.99, 14.1]
            entitys.push(line2)
        
            let line3 = new vjmap.DbLine();
            line3.start = [0, 0.9]
            line3.end = [2.99, 0.9]
            entitys.push(line3)
        
            let line4 = new vjmap.DbLine();
            line4.start = [0, 9.95]
            line4.end = [5.8, 9.95]
            entitys.push(line4)
        
            let line5 = new vjmap.DbLine();
            line5.start = [0, 5.05]
            line5.end = [5.8, 5.05]
        
            let hatch = new vjmap.DbHatch();
            hatch.pattern = "SOLID";
            hatch.color = 0xB43F32;
            hatch.points = [line4.start, line4.end, line5.end, line5.start];
            entitys.push(hatch);
            entitys.push(line4)
            entitys.push(line5)
        
            let line6 = new vjmap.DbLine();
            line6.start = [5.8, 5.05]
            line6.end = [5.8, 9.95]
            entitys.push(line6)
        
            let arc1 = new vjmap.DbArc();
            arc1.center = [5.7963, 7.504];
            arc1.radius = 1.8014;
            arc1.startAngle = 270 * Math.PI / 180.0;
            arc1.endAngle = 90 * Math.PI / 180.0;
            entitys.push(arc1)
        
            let arc2 = new vjmap.DbArc();
            arc2.center = [5.7963, 7.504];
            arc2.radius = 1.8014;
            arc2.startAngle = 90 * Math.PI / 180.0;
            arc2.endAngle = 270 * Math.PI / 180.0;
        //arc2.linetype = "DASHED"
            entitys.push(arc2)
        
            let arc3 = new vjmap.DbArc();
            arc3.center = [1.575, 7.5];
            arc3.radius = 6.75;
            arc3.startAngle = 282 * Math.PI / 180.0;
            arc3.endAngle = 78 * Math.PI / 180.0;
            entitys.push(arc3)
        
            let block = new vjmap.DbBlock();
            block.name = "ball";
            block.origin = [0, 0]
            block.entitys = entitys;
            doc.appendBlock(block);
        
            let blockRef1 = new vjmap.DbBlockReference();
            blockRef1.blockname = "ball";
            blockRef1.position = [0, 0];
            doc.appendEntity(blockRef1);
        
            let blockRef2 = new vjmap.DbBlockReference();
            blockRef2.blockname = "ball";
            blockRef2.position = [28, 15];
            blockRef2.rotation = Math.PI;
            doc.appendEntity(blockRef2);
        
            /*
            // 可以增加文字样式
            let textStyle = new vjmap.DbTextStyle({
                name: "mytext",
                isShapeFile: false,
                textSize: 0.0,
                xScale: 1.0,
                priorSize: 22,
                obliquingAngle: 0.0,
                fileName: "msyh.ttc",
                typeFace: "Microsoft YaHei",
                bold: false,
                italic: false,
                charset: 0,
                pitchAndFamily: 34
            })
            doc.appendTextStyle(textStyle);
             */
            // 在cad图新增图层
            let cadLayer1 = new vjmap.DbLayer();
            cadLayer1.name = "文字图层";
            cadLayer1.color = 1;
            doc.layers = doc.layers || [];
            doc.layers.push(cadLayer1);
        
            let otherEnts = [
                new vjmap.DbLine({
                    start: [0, 15],
                    end: [28, 15]
                }),
                new vjmap.DbLine({
                    start: [0, 0],
                    end: [28, 0]
                }),
                new vjmap.DbLine({
                    start: [14, 0],
                    end: [14, 15],
                    colorIndex: 1
                }),
                new vjmap.DbCircle({
                    center:[14, 7.5],
                    radius: 1.83,
                    color: 0xFF0000
                }),
                new vjmap.DbText({
                    position: [14, 16],
                    contents: "篮球场示意图",
                    horizontalMode: 4,
                    height: 1,
                    layer: "文字图层", // 设置图层
                    colorIndex: 256, // 随层
                    // textStyle: "mytext", // 如果设置了自定义的文字样式
                })
            ]
        
            doc.appendEntity(otherEnts);
            return doc;
        }
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
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
            const features = [];
            if (res && res.result && res.result.length > 0) {
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = map.entColorToHtmlColor(ent.color); // 实体颜色转html颜色
                        for (let g = 0; g < ent.geom.geometries.length; g++) {
                            let featureAttr = {};
                            // 因为要组合成一个组合实体，所以线和多边形的颜色得区分
                            if (ent.isPolygon) {
                                featureAttr.color = clr; // 填充色，只对多边形有效
                                featureAttr.noneOutline = true; // 不显示多边形边框，只对多边形有效
                            } else {
                                featureAttr.color = clr; // 颜色
                                featureAttr.line_width = ent.lineWidth; // 线宽
                            }
                            features.push({
                                id: vjmap.RandomID(10),
                                type: "Feature",
                                properties: {
                                    objectid: ent.objectid + "_" + g,
                                    opacity: ent.alpha / 255,
                                    ...featureAttr,
                                },
                                geometry: ent.geom.geometries[g],
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
        
        const doc = await createDwgDoc();
        const createMap = async () => {
            let geojson = await createGeomData(map, doc);
            const opts = vjmap.Draw.defaultOptions();
            // 修改默认样式，把点的半径改成1，没有边框，默认为5
            let pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-point-stroke-inactive");
            if (pointIdx >= 0) {
                opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 0
            }
            pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-inactive");
            if (pointIdx >= 0) {
                opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 1
            }
            map.getDrawLayer(opts).set(geojson);
        }
        await createMap();
        
        const exportDwgOpen = async () => {
            const mapid = 'exportdwgmap';
            let res = await svc.updateMap({
                mapid: mapid,
                filedoc: JSON.stringify(doc),
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
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={exportDwgOpen}>导出成DWG图并打开</button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
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