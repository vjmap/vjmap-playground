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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/04openMapSelectEntity
        // --Vector tile select and highlight whole entity--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // let style = svc.vectorStyle(); // Default style
        // Custom vector style
        let style = svc.vectorStyle({
            hoverColor: 'rgba(0,255,255,255)', // Highlight color
            hoverOpacity: 0.5, // Highlight opacity
            hoverLineWidth: 3 // Highlight line width
        });
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: style,
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        await map.onLoad();
        
        // Get entity objectID; in geometry mode objectid may be a block split into multiple features but same logical entity; this returns the CAD entity objectid
        const getEntityObjectId = (id) => {
            // id format like A0F$A10 or 380#26F&26C; the leading alphanumeric part is the CAD entity objectid
            let objectId = "";
            let k = 0;
            // Check if character is alphanumeric
            const isAlphanumeric = (char) => {
                return /^[a-zA-Z0-9]+$/.test(char);
            }
            for(k = 0; k < id.length; k++) {
                if (isAlphanumeric(id[k])) {
                    objectId += id[k]
                } else {
                    break;
                }
            }
            return objectId;
        }
        
        // Query backend for all entity id to objectid mappings
        let query = await svc.conditionQueryFeature({
            // Filter by type/color as needed
            condition: `1=1`, // SQL WHERE clause only; see docs "Server-side condition query and expression query"
            fields: "id,objectid",
            limit: 10000000 // Large limit to get all; default is 100
        })
        
        let featureIdObjectIdMap = {}; // id -> objectid (1:1)
        let entityIdFeatureIdMap = {}; // entityid -> feature ids (1:many, e.g. block has multiple features)
        for(let i = 0; i < query.result.length; i++) {
            let item = query.result[i];
            featureIdObjectIdMap[item.id] = item.objectid;
            let entityId = getEntityObjectId(item.objectid); // Get whole-entity id
            let ids = entityIdFeatureIdMap[entityId];
            if (ids === undefined) {
                entityIdFeatureIdMap[entityId] = new Set();
            }
            entityIdFeatureIdMap[entityId].add(item.id);
        }
        
        let curHoverIds;
        
        const highlightEntity = (featureId) => {
            if (curHoverIds) {
                changeFeatureStatus(curHoverIds, {hover: false});
                curHoverIds = null;
            }
            // Callback when entity is hover-highlighted
            if (featureId === null) {
                return;
            }
            let id = featureId;
            let objectId = featureIdObjectIdMap[id];
            let entityId = getEntityObjectId(objectId); // Get whole-entity id
            // Get other feature ids of the same entity
            let ids = entityIdFeatureIdMap[entityId];
            if (ids.size > 0) {
                changeFeatureStatus(ids, {hover: true});
                curHoverIds = ids;
            }
            let content = `entityId: ${entityId}`
            message.info({ content, key: "info", duration: 5});
        }
        
        
        const changeFeatureStatus = (ids, state) => {
            if (!ids) return;
            let sourceLayers = ['polygons', 'lines', 'points'];
            // All layers under vector source
            for (let sourceLayer of sourceLayers) {
                // All feature ids (e.g. under block)
                for(let id of ids) {
                    map.setFeatureState({
                            source: "vector-source",
                            sourceLayer: sourceLayer,
                            id: id
                        },
                        state)
                }
            }
        }
        
        
        // Enable hover highlight
        const hoverHighlight = (disable) => {
            if (!disable) clickHighlight(true); // Disable click highlight
            map.disableVectorLayerHoverHighlight();
            if (disable) return;
            // Enable hover highlight (element highlights when mouse is over it)
            map.enableVectorLayerHoverHighlight((event, feature, layer) => {
                // Callback when entity is hover-highlighted
                if (event == "mouseleave") {
                    highlightEntity(null);
                    return;
                }
                if (!feature) {
                    return;
                }
                let id = feature.id;
                highlightEntity(id);
            })
        }
        
        // Click highlight
        const clickHighlight = (disable) => {
            if (!disable) hoverHighlight(true); // Disable hover highlight
            map.disableLayerClickHighlight();
            map.enableLayerClickHighlight(svc, e => {
                highlightEntity(null);
                if (!e) {
                    return;
                }
                let id = e.id;
                highlightEntity(id);
            }, "#0000" /* No draw, only respond to click */)
        }
        
        // Default: hover highlight
        hoverHighlight();
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "185px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => hoverHighlight()}>Hover highlight
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => clickHighlight()}>Click highlight
                            </button>
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