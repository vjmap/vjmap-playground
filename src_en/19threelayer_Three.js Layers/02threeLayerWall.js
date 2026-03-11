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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/02threeLayerWall
        // --3D light wall--
        // !!! `vjthree` is deprecated; use latest [vjmap 3D] https://vjmap.com/map3d/
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(mapExtent.center()),
            zoom: 3,
            pitch: 80,
            antialias: true,
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.5);
        
        
        const mapBounds = map.getGeoBounds(0.6);
        let len = mapBounds.width() / 20;
        const center = map.getCenter();
        
        if (typeof vjThree !== "object") {
            // If no env
            await vjmap.addScript([{
                src: "../../js/plugins/vjthree.min.js"
            }, {
                src: "../../js/plugins/vjthree.min.css"
            }])
        }
        
        const threeContext = map.createThreeJsContext({
            defaultLights: true,
            enableSelectingObjects: false
        });
        map.addLayer(new vjmap.ThreeLayer({ context: threeContext }));
        
        let query = await svc.conditionQueryFeature({
            condition: `objectid='4AB'`, // SQL WHERE clause; see doc "Server condition query"
            // Query text entities; type codes see doc "Server condition query - CAD entity types"
            // condition: `name='12' or name='13' or name='26' or name='27'`,
            fields: ""
        })
        if (query.error) {
            message.error(query.error)
        } else {
            if (query.recordCount > 0) {
                let points = query.result[0].points; // Point sequence
                let pts = points.split(";").map(p => vjmap.GeoPoint.fromString(p));
                // Close
                pts.push(pts[0]);
                threeContext.wall(pts)
            }
        }
        
        let walls = []
        const drawWalls = async () => {
            // Draw polygon
            let drawPoly = await vjmap.Draw.actionDrawPolygon(map, {
            });
            if (drawPoly.cancel) {
                return ;// Cancelled
            }
            let pts = map.fromLngLat(drawPoly.features[0].geometry.coordinates);
            pts = pts[0].map(e => [e.x, e.y])
            let wall = threeContext.wall(pts, {
                color1: 0xFF00FF,
                color2: 0xFFFF00
            })
            walls.push(wall)
        }
        
        const removeWalls = () => {
            for(let w of walls) {
                w.stop();
                threeContext.remove(w);
            }
            walls = []
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>Settings</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => drawWalls()}>Draw wall</button>
                                <button className="btn" onClick={() => removeWalls()}>Remove walls</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'))
        
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