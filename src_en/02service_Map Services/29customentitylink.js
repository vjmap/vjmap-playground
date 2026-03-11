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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29customentitylink
        // --Custom entity link--Set entity links; clicking a linked entity highlights related entities
        // Note: This example uses vjcommon. Add vjcommon.min.js or: npm install vjcommon, import vjcommon from 'vjcommon'
        // vjcommon is open source: https://github.com/vjmap/vjmap-common
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
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
        let featureLinks = {};
        
        // Click to highlight (highlight when clicking on map element)
        map.enableLayerClickHighlight(svc, e => {
            vjcommon.clearHighlight(map);
            if (!e) return;
            let links = featureLinks[e.objectid] || [];
            let linkObjectIds = new Set(links);
            if (linkObjectIds.size == 0) {
                message.info(`No entities linked to this entity`);
            } else {
                message.info(`${linkObjectIds.size} entity(ies) linked to this entity`);
                highLightObjectIds(Array.from(linkObjectIds))
            }
        })
        // Bind linked entities
        const bindConnect = async () => {
            vjcommon.clearHighlight(map); // Clear previous highlight
            message.info("Select entities to link, right-click to end")
            let srcFeature = await vjcommon.selectFeatures(map, true, true, true, true);
            message.info("Select entities to link with, right-click to end")
            let destFeature = await vjcommon.selectFeatures(map, true, true, true, true);
            let srcObjectIds = srcFeature.map(feature => feature.properties.objectid);
            let destObjectIds = destFeature.map(feature => feature.properties.objectid);
            vjcommon.clearHighlight(map);
            srcObjectIds.forEach(id => {
                let links = featureLinks[id] || [];
                links.push(...destObjectIds); // Can use Set to dedup
                featureLinks[id] = links;
        
                // Reverse link
                destObjectIds.map(destId => {
                    let destLinks = featureLinks[destId] || [];
                    destLinks.push(id);
                    featureLinks[destId] = destLinks;
                })
            })
            message.info(`${srcObjectIds.length} entity(ies) linked with ${destObjectIds.length} entity(ies)`);
        
        }
        
        // Locate linked entities
        const posToConnectObject = async () => {
            message.info(`Click an entity on the map to view linked entities`);
        }
        
        const highLightObjectIds = async (objectIds) => {
            let condition = objectIds.map(id => `objectid = '${id}'`).join(" or ")
            await vjcommon.getHighlightEntities(map, undefined, true, {
                condition
            }, false)
        }
        
        // Save link data; in production save to your backend
        const saveData = async () => {
            let svc = map.getService();
            let curParam = svc.currentMapParam() || {};
            let key = `map_highconnect_${curParam.mapid}_${curParam.version}`;
            await svc.saveCustomData(key, featureLinks);
            message.info('Save success')
        }
        
        // Load link data; in production load from your backend
        const loadData = async () => {
            try {
                let svc = map.getService();
                let curParam = svc.currentMapParam() || {};
                let key = `map_highconnect_${curParam.mapid}_${curParam.version}`;
                let res = await svc.getCustomData(key);
                if (res.data) {
                    featureLinks = res.data
                    message.info("Load success")
                }
            } catch (e) {
                console.error(e)
            }
        }
        await loadData();
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>Actions:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={bindConnect}>Bind linked entities</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => posToConnectObject(true)}>Locate linked entities</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={saveData}>Save link data</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={loadData}>Load link data</button>
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