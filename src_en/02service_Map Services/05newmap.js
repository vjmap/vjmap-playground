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
        // --Create new map [Preview then export DWG]--Preview generated graphics in front-end, then export and open as DWG
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
            // Can add text style
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
            // Add layer in CAD drawing
            let cadLayer1 = new vjmap.DbLayer();
            cadLayer1.name = "Text layer";
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
                    contents: "Basketball court diagram",
                    horizontalMode: 4,
                    height: 1,
                    layer: "Text layer", // set layer (was "text layer")
                    colorIndex: 256, // by layer
                    // textStyle: "mytext", // if custom text style is set
                })
            ]
        
            doc.appendEntity(otherEnts);
            return doc;
        }
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        // Set an initial extent (exact value does not matter); export DWG will compute real extent from entity coordinates.
        let mapBounds = '[-10000,-10000,10000,10000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        mapExtent = mapExtent.square(); // Make square
        
        svc.setCurrentMapParam({
            darkMode: true, // No map opened yet; set dark mode
            bounds: mapExtent.toString()
        })
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map instance
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            }, // Vector tile style
            center: [0,0], // Center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        
        // Create geometry data
        const createGeomData = async (map, doc) => {
            let svc = map.getService();
            let res = await svc.cmdCreateEntitiesGeomData({
                filedoc: JSON.stringify(doc)
                /* Or create CAD from SVG:
                filedoc: JSON.stringify({
                    isSvgData: true,
                    svg: `<svg ...></svg>`
                })
                */
            });
            const features = [];
            if (res && res.result && res.result.length > 0) {
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = map.entColorToHtmlColor(ent.color); // Entity color to HTML color
                        for (let g = 0; g < ent.geom.geometries.length; g++) {
                            let featureAttr = {};
                            // Distinguish line vs polygon for composite entity
                            if (ent.isPolygon) {
                                featureAttr.color = clr; // Fill color (polygon only)
                                featureAttr.noneOutline = true; // No polygon outline (polygon only)
                            } else {
                                featureAttr.color = clr; // Color
                                featureAttr.line_width = ent.lineWidth; // Line width
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
            // Change default style: point radius 1, no stroke (default 5)
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
                    backcolor: 0 // Use 0xFFFFFF if div background is light
                }
            })
            if (res.error) {
                message.error(res.error)
            } else{
                window.open(`https://vjmap.com/app/cloud/#/map/${res.mapid}?version=${res.version}&mapopenway=Memory&vector=false`)
            }
        }
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={exportDwgOpen}>Export as DWG and open</button>
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