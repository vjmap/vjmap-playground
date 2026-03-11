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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/21conditionquery
        // --Condition query and locate flash entity--In geometry render mode, query entities by condition on server and locate/flash to that entity
        // Set div background to light
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
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
            e && message.info(`type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`);
        })
        
        const flashPos = (bounds) => {
            return new Promise((resolve => {
                const routePath = [];
                routePath.push(bounds.min);
                routePath.push(vjmap.geoPoint([bounds.max.x, bounds.min.y]));
                routePath.push(bounds.max);
                routePath.push(vjmap.geoPoint([bounds.min.x, bounds.max.y]));
                routePath.push(bounds.min);
                let geoLineDatas = [];
                geoLineDatas.push({
                    points: map.toLngLat(routePath),
                    properties: {
                        opacity: 1.0
                    }
                })
        
                let polylines = new vjmap.Polyline({
                    data: geoLineDatas,
                    lineColor: 'yellow',
                    lineWidth: 3,
                    lineOpacity: ['get', 'opacity'],
                    isHoverPointer: false,
                    isHoverFeatureState: false
                });
                polylines.addTo(map);
        
                vjmap.createAnimation({
                    from: 1,
                    to: 10,
                    duration: 1000,
                    onUpdate: (e) => {
                        const data = polylines.getData();
                        data.features[0].properties.opacity = parseInt(e) % 2 ? 1.0 : 0 ;
                        polylines.setData(data);
                    },
                    onStop: () => {
                        polylines.remove()
                        resolve({})
                    },
                    onComplete: () => {
                        polylines.remove()
                        resolve({})
                    }
                })
            }))
        }
        
        const { Button } = antd
        const App = () => {
            const handleClick = async () => {
                let query = await svc.conditionQueryFeature({
                    condition: `objectid='53D'`, // SQL WHERE clause only; see docs "Server condition query and expression query"
                    // Query all text (single-line, multi-line, block text, attribute text); type codes see docs "Supported CAD entity types"
                    // condition: `name='12' or name='13' or name='26' or name='27'`,
                    fields: ""
                })
                if (query.error) {
                    message.error(query.error)
                } else {
                    message.info(`Matched record count: ${query.recordCount}`)
                    if (query.recordCount > 0) {
                        let bounds = map.getEnvelopBounds(query.result[0].envelop);
                        // Demo two ways to locate entity
                        let n = vjmap.randInt(0, 1)
                        if (n == 0) {
        					let center = bounds.center();
                            // Current screen geo bounds
                            let lnglatBounds = map.getBounds();
                            let nePoint = map.fromLngLat(lnglatBounds.getNorthEast());
                            let swPoint = map.fromLngLat(lnglatBounds.getSouthWest());
                            // Current screen geo width
                            let screenGeoWidth = nePoint.x - swPoint.x;
                            // Target zoom extent width
                            let zoomGeoWidth = bounds.width()
                            // Current zoom level
                            let curZoom = map.getZoom()
                            // Zoom factor from width ratio
                            let addZoom = Math.log2(screenGeoWidth / zoomGeoWidth)
                            // New zoom level
                            let newzoom = curZoom + addZoom
                            map.flyTo({
                                center: map.toLngLat(center),
                                zoom: newzoom - 0.2
                            });
                        } else {
                            let lnglatBouds = map.toLngLat(bounds);
                            map.fitBounds(lnglatBouds)
                        }
                        await flashPos(bounds)
                    }
                }
        
                /*
                    // Find all blocks in map
                    // Entity id
                // Block objectid: blockId_refDefId1_refDefId2_entityId_#;
                // Table objectid: blockId_refDefId1_refDefId2_entityId_@;
                // Group objectid: entityId_elementIndex$groupId;
                    let query = await svc.conditionQueryFeature({
                        condition: `objectid like '%#%'`,
                        fields: ""
                    })
        
                    let blockEnts = {}; // Block entity map
                    if (query.result) {
                        for(let i = 0; i < query.result.length; i++) {
                            let item = query.result[i];
                            let objId = item.objectid;
                            if (objId.indexOf("#") < 0) continue
                            let ids = objId.split("#");
                            let blockId = ids[0];
                            let entId = ids[1];
                            blockEnts[blockId] = blockEnts[blockId] || [];
                            blockEnts[blockId].push(objId);
                        }
                    }
        
                    console.log(`Total ${Object.keys(blockEnts).length} block entities`);
                 */
            };
            return (
                <Button type="primary" onClick={handleClick}>Click this button to query entity with objectid '53D‘and locate/flash it</Button>
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