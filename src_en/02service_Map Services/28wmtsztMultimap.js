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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/28wmtsztMultimap
        // --WMTS overlay multiple maps (base map, fixed coordinate system)--Overlay multiple maps via WMTS raster tiles
        /*
        Pros: Simple; no need to clear/redraw after overlay. Cons: Set initial extent correctly.
        */
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let baseMapId =  "sys_world";
        let res = await svc.openMap({
            mapid: baseMapId, // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: {
                backcolor: 0, // Use dark style when div has dark background
                clipbounds: Math.pow(2, 3) // Scale factor for extent (no array = scale previous extent)
            }
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds (with this approach, this is the final extent and cannot change)
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        
        map.addControl(new vjmap.NavigationControl());
        let mousePosCtrl = new vjmap.MousePositionControl({showZoom: true});
        map.addControl(mousePosCtrl);
        
        const addWmtsLayer = async (maps) => {
            let mapIds = [];
            let versions = [];
            let metas = []
            for(let m of maps) {
                let mid = m.mapid;
                mapIds.push(mid);
                versions.push(m.version);
                let meta = await svc.metadata(mid);
                metas.push(meta);
            }
        
        
            for(let k = 0; k < maps.length; k++) {
                let m = maps[k];
                let mid = m.mapid;
                let meta = metas[k];
                let layerIndexs;
                if (m.layernames) {
                    // If layer names set, convert to layer indices
                    layerIndexs = [];
                    for(let i = 0; i < m.layernames.length; i++) {
                        let idx = meta.layers.findIndex(e => e.name === m.layernames[i] )
                        if (idx >= 0) layerIndexs.push(idx)
                    }
                }
                let style = await svc.createStyle({
                    name: "customStyle",
                    backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF,
                    layeron: layerIndexs ? `{"*": "(${layerIndexs.join(",")})"}` : undefined,
                    clipbounds: mapExtent.toArray().toString() // Use full map extent
                }, mid, m.version);
        
        
                let tiles = svc.rasterTileUrl({
                    mapid: mid,
                    version: (m.version == "_" || !m.version) ? undefined : m.version,
                    layer: style.stylename
                });
                map.addRasterSource("mapTileSource" + mid, {
                    type: "raster",
                    tiles: [tiles],
                    tileSize: 256
                });
                map.addRasterLayer("mapTileLayer" + mid, "mapTileSource" + mid);
            }
        
        }
        
        
        await addWmtsLayer([
            {
                mapid: "sys_hello",
                version: "_" // Use latest version
            },
            {
                mapid: "sys_topo",
                version: "_" // Use latest version
            }
        ]);
        
        const clear = () => {
            map.removeMarkers();
            map.removeControl(mousePosCtrl);
            // Re-add mouse position control after coordinate system change
            mousePosCtrl = new vjmap.MousePositionControl({showZoom: true});
            map.addControl(mousePosCtrl);
        }
        // With this approach, do not remove/re-add overlays since map extent is unchanged
        const addMarker = ()=> {
            new vjmap.Marker().setLngLat(map.toLngLat([725.3178740000039,18969.19101399999])).addTo(map)
        }
        addMarker();
        
        const removeMapSource = () => {
            let sources = map.getStyle().sources;
            for(let source in sources) {
                if (source.indexOf("mapTileSource") != 0) continue;
                map.removeSourceEx(source);
            }
        }
        
        const switchWmtsMap1 = async ()=> {
            removeMapSource(); // Remove previous WMTS source and layers
            // Add new WMTS layer
            await addWmtsLayer([
                {
                    mapid: "sys_hello",
                    version: "_", // Use latest version
                }
            ]);
        
        }
        
        const switchWmtsMap2 = async ()=> {
            removeMapSource();
            // Add new WMTS layer
            await addWmtsLayer([
                {
                    mapid: "sys_topo",
                    version: "_" // Use latest version
                }
            ]);
        
        }
        
        const switchWmtsMap3 = async ()=> {
            removeMapSource();
            // Add new WMTS layer
            await addWmtsLayer([
                {
                    mapid: "sys_world",
                    version: "_" // Use latest version
                },
                {
                    mapid: "sys_topo",
                    version: "_" // Use latest version
                }
            ]);
        
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>Switch overlay map:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmtsMap1}>Switch map 1</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmtsMap2}>Switch map 2</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmtsMap3}>Show all</button>
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