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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerMultiLayer
        // --Three.js multiple layers--
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
            zoom: 2,
            pitch: 60,
            antialias:true,
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        const center = map.getCenter();
        const len = mapBounds.width() / 20;
        
        if (typeof vjThree !== "object") {
            // If no env
            await vjmap.addScript([{
                src: "../../js/plugins/vjthree.min.js"
            },{
                src: "../../js/plugins/vjthree.min.css"
            }])
        }
        
        const threeContext = map.createThreeJsContext({
            defaultLights: true,
            enableSelectingObjects: true,
            enableTooltips: true,
            multiLayer: true // Creates default custom layer for per-item updates
        });
        
        const colors = ['red', 'green', 'blue'];
        for(let i = 0; i < 3; i++) {
            const layerId = "custom_layer_" + i;
            const pt = map.toLngLat(mapBounds.randomPoint());
            map.addLayer(new vjmap.ThreeLayer({
                id: layerId,
                context: threeContext
            }));
            const sphere = threeContext.sphere({
                color: colors[i],
                radius: prj.toMeter(len),
                units: "meters",
                material: 'MeshToonMaterial'
            }).setCoords([...pt, len]);
            threeContext.add(sphere, layerId);
        }
        
        const setLayerVisibility = (idx, visible) => {
            const layerId = "custom_layer_" + idx;
            map.setLayoutProperty(layerId, 'visibility', visible ? "": 'none');
            threeContext.toggleLayer(layerId, visible);
            // Set zoom range for layer visibility
            threeContext.setLayerZoomRange(layerId, 0, 3 + i);
        }
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>Settings</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => setLayerVisibility(0, true)}>Layer 1 on</button>
                                <button className="btn" onClick={() => setLayerVisibility(0, false)}>Layer 1 off</button>
                                <button className="btn" onClick={() => setLayerVisibility(1, true)}>Layer 2 on</button>
                                <button className="btn" onClick={() => setLayerVisibility(1, false)}>Layer 2 off</button>
                                <button className="btn" onClick={() => setLayerVisibility(2, true)}>Layer 3 on</button>
                                <button className="btn" onClick={() => setLayerVisibility(2, false)}>Layer 3 off</button>
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