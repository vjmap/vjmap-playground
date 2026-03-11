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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findtextallinmap
        // --Get all text in map and highlight--
        // js code
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
        
        
        let polygonLayer;
        const getAllTexts = async ()=> {
            if (polygonLayer) return; // Skip if already drawn
            // Entity type ID and name mapping
            const { entTypeIdMap } = await svc.getConstData();
            const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
            let polygons = [];
            let queryTextEntTypeId = getTypeNameById("AcDbText"); // single-line text
            let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // multiline text
            let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // attribute definition text
            let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // attribute text
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // WHERE condition only; see docs
                fields: "",
                geom: true,
                limit: 100000 // Large limit to get all; default 100
            })
            if (query.error) {
                message.error(query.error);
                return;
            } else {
                if (query.recordCount > 0) {
                    for(let i = 0; i < query.recordCount; i++) {
                        let bounds = map.getEnvelopBounds(query.result[i].envelop);
                        let clr = vjmap.entColorToHtmlColor(query.result[i].color); // entity color to HTML color
                        polygons.push({
                            points: map.toLngLat(bounds.toPointArray()),
                            properties: {
                                name: query.result[i].objectid,
                                color: clr,
                                text: query.result[i].text
                            }
                        });
                    }
                }
            }
            polygonLayer = new vjmap.Polygon({
                data: polygons,
                fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', '#f0f'],
                fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 0.4],
                fillOutlineColor: ['get', 'color'],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygonLayer.addTo(map);
            polygonLayer.hoverFeatureState(e => {
                if (e.features) {
                    message.info({
                        content: `Text name: ${e.features[0].properties.name}, value: ${e.features[0].properties.text}`,
                        key: "info",
                        duration: 5
                    })
                }
            })
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "180px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => getAllTexts()}>Get all text in map and highlight
                            </button>
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