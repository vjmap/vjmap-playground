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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/28wmsZZArrange
        // --WMS map arrangement--Arrange multiple maps via WMS
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        svc.setCurrentMapParam({
            darkMode: true // Set dark mode when no map opened yet
        })
        
        // Arrange the four maps in 2x2 grid
        let mapIds = ['sys_zp', 'sys_world', 'sys_hello', "sys_topo"];
        // New map extent e.g. 0,0,20000,20000
        const newMapLength = 20000;
        // Get metadata and coordinate extent for each map
        const col = 2;
        const cellMapColLength = newMapLength / col;
        const cellMapRowLength = newMapLength / Math.ceil( mapIds.length / col);
        
        let allMapParams = [];// All map params
        let mapFourParam = {};// Four-parameter per map for coordinate transform into new map
        let addMarkers = []; // Center position of each map to add
        
        for(let i = 0; i < mapIds.length; i++) {
            let metadata = await svc.metadata(mapIds[i]);
            let bounds = vjmap.GeoBounds.fromString(metadata.bounds);
            let mapBounds = bounds; // Original map extent
            let style = await svc.createStyle({
                backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF
            }, mapIds[i]); // Original map style
        
            bounds = bounds.scale(+metadata.initViewScale * 1.1); // Slightly larger than initial view
            // Four-parameter: match source top-left and bottom-right to dest points (min 2 points)
            let srcPoints = [
                bounds.min,
                bounds.max
            ];
        
            const curRow = Math.floor(i / col);
            const curCol = i % col;
            let destMin = [cellMapColLength * curCol, newMapLength - cellMapRowLength * (curRow + 1)];
            let destMax = [cellMapColLength * (curCol + 1), newMapLength - cellMapRowLength * curRow];
            // New extent may not be square; get minimum square centered on rectangle
            let newBounds = new vjmap.GeoBounds(vjmap.geoPoint(destMin), vjmap.geoPoint(destMax));
            const c = newBounds.center();
            let w = newBounds.width() < newBounds.height() ? newBounds.width() : newBounds.height();
            // Corresponding points in destination coordinate system
            let destPoints = [
                vjmap.geoPoint([c.x - w / 2.0, c.y - w / 2.0]),
                vjmap.geoPoint([c.x + w / 2.0, c.y + w / 2.0])
            ]
        
            // Solve four-parameter from coordinates (no rotation)
            // WMS overlay uses WMS extent to find map extent, so use destPoints -> srcPoints
            let fourparam = vjmap.coordTransfromGetFourParamter(destPoints, srcPoints, true);
        
            allMapParams.push({
                mapid: mapIds[i],
                fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate],  // (offsetX, offsetY, scale, rotate)
                layer: style.stylename,  // Original map style
                mapBounds: mapBounds // Original map extent
            })
        
            // Record each map center to draw in new map for testing coordinate transform
            mapFourParam[mapIds[i]] = fourparam;
            addMarkers.push({
                mapid: [mapIds[i]],
                point: bounds.center()
            })
        }
        
        
        let mapBounds = [0, 0, newMapLength, newMapLength];
        let mapExtent = vjmap.GeoBounds.fromArray(mapBounds)
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
        await map.onLoad();
        
        const addWmsLayer = async (maps) => {
        
            let mapIds = [];
            let layers = [];
            let fourParameters = [];
            for(let a = 0; a < maps.length; a++) {
                let m = maps[a];
                mapIds.push(m.mapid);
                fourParameters.push(m.fourParameter);
                layers.push(m.layer);
            }
        
            let wmsurl = svc.wmsTileUrl({
                mapid: mapIds,
                layers: layers,
                fourParameter: fourParameters,
                mapbounds: mapExtent.toString() // Full map extent
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
        
        addWmsLayer(allMapParams);
        
        // Draw each map center in new coordinate system
        for(let m of addMarkers) {
            let fourParam = mapFourParam[m.mapid];
            // From original map to WMS extent, use inverse four-parameter for coordinate transform
            let newPoint = vjmap.coordTransfromByInvFourParamter(m.point, fourParam);
            new vjmap.Marker({color: vjmap.randomColor()})
                .setLngLat(map.toLngLat(newPoint))
                .addTo(map);
        }
        
        
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.setZoom(0);// Set to min zoom
        
        let polygonLayer;
        const getAllTexts = async ()=> {
            if (polygonLayer) return; // Skip if already drawn
            // Entity type ID and name mapping
            let _svc = new vjmap.Service(env.serviceUrl, env.accessToken)
            const { entTypeIdMap } = await _svc.getConstData();
            const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
            let polygons = [];
            for(let a = 0; a < allMapParams.length; a++) {
                let m = allMapParams[a];
                let queryTextEntTypeId = getTypeNameById("AcDbText"); // single-line text
                let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // multiline text
                let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // attribute definition
                let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // attribute text
                let mapPrj = new vjmap.GeoProjection(m.mapBounds); // Coordinate system for this map; coords transformed below
                let fourParam = mapFourParam[m.mapid]; // Four-parameter for this map
                let query = await _svc.conditionQueryFeature({
                    mapid: m.mapid,
                    layer: m.layer,
                    condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // WHERE condition only; see docs
                    fields: "",
                    geom: true,
                    limit: 100000 // Large limit to get all; default 100
                }, pt => {
                    // Callback to transform each queried point
                    let cadPt =  mapPrj.fromMercator(pt);// To CAD coordinate
                    return vjmap.coordTransfromByInvFourParamter(cadPt, fourParam); // Inverse four-parameter to current map
                })
                if (query.error) {
                    message.error(query.error);
                    continue;
                } else {
                    if (query.recordCount > 0) {
        
                        for(let i = 0; i < query.recordCount; i++) {
                            let bounds = vjmap.getEnvelopBounds(query.result[i].envelop, mapPrj);
                            let clr = vjmap.entColorToHtmlColor(query.result[i].color); // Entity color to HTML color
        
                            let realBounds = [];  // bounds is source map CAD extent; transform to current map with inverse four-parameter
                            realBounds.push(vjmap.coordTransfromByInvFourParamter(bounds.min, fourParam));
                            realBounds.push(vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint([bounds.max.x, bounds.min.y]), fourParam));
                            realBounds.push(vjmap.coordTransfromByInvFourParamter(bounds.max, fourParam));
                            realBounds.push(vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint([bounds.min.x, bounds.max.y]), fourParam));
                            realBounds.push(vjmap.coordTransfromByInvFourParamter(bounds.min, fourParam));
                            polygons.push({
                                points: map.toLngLat(realBounds),
                                properties: {
                                    name: "objectid:" + query.result[i].objectid,
                                    color: clr,
                                    mapid: m.mapid,
                                    text: query.result[i].text
                                }
                            });
                        }
                    }
                }
            }
            polygonLayer = new vjmap.Polygon({
                data: polygons,
                fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', '#0f0'],
                fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 0.5],
                // To hide polygon initially, set opacity to 0; show on hover
                // fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 0.0],
                fillOutlineColor: ['get', 'color'],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygonLayer.addTo(map);
            polygonLayer.clickLayer(e => message.info(`Clicked map ${e.features[0].properties.mapid}, #${e.features[0].id}, name: ${e.features[0].properties.name}, text: ${e.features[0].properties.text}`))
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