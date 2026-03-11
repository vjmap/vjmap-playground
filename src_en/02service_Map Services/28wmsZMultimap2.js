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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/28wmsZMultimap2
        // --WMS overlay multiple maps (fixed coordinate system)--Overlay multiple maps via WMS raster tiles
        /*
        Set full extent of overlay in advance; coordinate system does not change after WMS overlay.
        Pros: Coordinate system unchanged; drawn features remain valid after overlay.
        Cons: Must set full extent in advance.
        */
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        svc.setCurrentMapParam({
            darkMode: true // Set dark mode when no map opened yet
        })
        // Get max bounds of all maps
        const getMapIdsMaxBounds = async (mapIds) => {
            let bounds = new vjmap.GeoBounds()
            for(let mid of mapIds) {
                let meta = await svc.metadata(mid);
            // Update bounds to max extent
            bounds.updateByBounds(vjmap.GeoBounds.fromString(meta.bounds));
            }
            // Optionally scale up extent
            bounds = bounds.scale(2); // e.g. 2x (larger is ok, must not be smaller than overlay extent)
            return bounds;
        }
        // Set full extent for overlay; overlay maps must not exceed this. Can set larger.
        // Can write bounds directly, or get via getMapIdsMaxBounds:
        let mapExtent = await getMapIdsMaxBounds(['sys_hello', 'sys_world', 'sys_topo']);
        mapExtent = mapExtent.square(); // Make square
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },// vector tile style
            center: [0,0], // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        
        //map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        const addWmsLayer = async (maps) => {
            let mapIds = [];
            let layers = [];
            let versions = [];
            for(let m of maps) {
                let mid = m.mapid;
                mapIds.push(mid);
                versions.push(m.version);
                let meta = await svc.metadata(mid);
        
                let layerIndexs
                if (m.layernames) {
                    // If layer names set, convert to layer indices
                    layerIndexs = [];
                    for(let i = 0; i < m.layernames.length; i++) {
                        let idx = meta.layers.findIndex(e => e.name === m.layernames[i] )
                        if (idx >= 0) layerIndexs.push(idx)
                    }
                }
                let style = await svc.createStyle({
                    backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF,
                    layeron: layerIndexs ? `{"*": "(${layerIndexs.join(",")})"}` : undefined,
                    clipbounds: mapExtent.toArray().toString() // Pass initial full map extent for style
                }, mid);
                layers.push(style.stylename)
            }
        
            let wmsurl = svc.wmsTileUrl({
                mapid: mapIds,
                layers: layers,
                version: versions, // Use latest version
                mapbounds: mapExtent.toString() // Pass initial full map extent
            })
        
            map.addSource('wms-maps-source', {
                'type': 'raster',
                'tiles': [
                    wmsurl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': 'wms-maps-layer',
                    'type': 'raster',
                    'source': 'wms-maps-source',
                    'paint': { "raster-opacity": 1 }
                }
            );
        }
        
        
        await addWmsLayer([
            {
                mapid: "sys_hello",
                version: "_" // Use latest version
            },
            {
                mapid: "sys_world",
                version: "_", // Use latest version
                layernames: ["COUNTRY", "经纬度标注"] // Layer names to show; empty = all (keep "经纬度标注" in code)
            },
            {
                mapid: "sys_topo",
                version: "_" // Use latest version
            }
        ]);
        
        const addMarker = ()=> {
            new vjmap.Marker().setLngLat(map.toLngLat([725.3178740000039,18969.19101399999])).addTo(map)
        }
        addMarker();
        
        const switchWmsMap1 = async ()=> {
            map.removeSourceEx('wms-maps-source'); // Remove previous WMS source and layers
            // Add new WMS layer
            await addWmsLayer([
                {
                    mapid: "sys_hello",
                    version: "_", // Use latest version
                },
                {
                    mapid: "sys_topo",
                    version: "_" // Use latest version
                }
            ]);
            addMarker();
        }
        
        const switchWmsMap2 = async ()=> {
            map.removeSourceEx('wms-maps-source'); // Remove previous WMS source and layers
            // Add new WMS layer
            await addWmsLayer([
                {
                    mapid: "sys_hello",
                    version: "_" // Use latest version
                },
                {
                    mapid: "sys_world",
                    version: "_" // Use latest version
                }
            ]);
            addMarker();
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>Switch overlay map:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmsMap1}>Switch map 1</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmsMap2}>Switch map 2</button>
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