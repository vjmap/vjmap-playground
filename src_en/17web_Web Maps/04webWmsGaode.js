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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/04webWmsGaode
        // --Gaode map and CAD overlay [Gaode as base]-- Gaode as CRS
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Create lnglat projection by map bounds
        let prj = new vjmap.LnglatProjection();
        
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {
                    // Road
                    gaodeRoadSource: {
                        type: 'raster',
                        tiles: ["https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"],
                        maxzoom: 18,// Max zoom 18
                    },
                    // Imagery without labels
                    gaodeImgSource: {
                        type: 'raster',
                        tiles:  [
                            "https://webst02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                        ],
                        maxzoom: 18,// Max zoom 18
                    },
                    // Imagery with labels
                    gaodeImgSourceLabel: {
                        type: 'raster',
                        tiles:  [
                            "https://webst02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                        ],
                        maxzoom: 18,// Max zoom 18
                    }
                },
                layers: [{
                    id: 'gaodeRoad',
                    type: 'raster',
                    source: 'gaodeRoadSource',
                },{
                    id: 'gaodeImg',
                    type: 'raster',
                    source: 'gaodeImgSource',
                    layout: {
                        visibility: "none"
                    }
                },{
                    id: 'gaodeImgLabel',
                    type: 'raster',
                    source: 'gaodeImgSourceLabel',
                    layout: {
                        visibility: "none"
                    }
                }]
            },
            center: [0, 0],
            zoom: 12,
            pitch: 0,
            maxZoom: 24, // Max map zoom 24
            renderWorldCopies: false // Do not show multi-screen map
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        await map.onLoad();
        
        
        // Open CAD map first
        let mapId = "sys_cadcesium";
        let res = await svc.openMap({
            mapid: mapId, // Map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
            style: vjmap.openMapLightStyle() // Dark background style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        let layers = JSON.parse(res.layers); // All layer data
        let layer = res.layer;// Layer style name
        
        let cadEpsg = "EPSG:4544";// CAD map EPSG code
        
        let wmsSourceId = 'wms-test-source';
        // Add CAD WMS layer
        let wmsUrl = svc.wmsTileUrl({
            mapid: mapId, // Map id
            layers: layer, // Layer name
            srs: "EPSG:3857",
            crs: cadEpsg,
            webMapType: "GCJ02" // Base is Gaode, use GCJ02; omit for Tianditu
        })
        map.addSource(wmsSourceId, {
            'type': 'raster',
            'tiles': [
                wmsUrl
            ],
            'tileSize': 256
        });
        map.addLayer({
                'id': 'wms-test-layer',
                'type': 'raster',
                'source': wmsSourceId,
                'paint': { "raster-opacity": 1 }
            }
        );
        
        // Load proj4
        if (typeof proj4 !== "object") {
            // If not available
            await vjmap.addScript([{
                src: "../../js/proj4.min.js"
            }])
        }
        
        // Query params at https://epsg.io/
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
        proj4.defs("EPSG:4544", "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs");
        
        // CAD coordinate to web WGS84, then to Gaode (GCJ02)
        const cadToWebCoordinate = point => {
            let co = proj4(cadEpsg, "EPSG:4326", vjmap.geoPoint(point).toArray());
            // Convert WGS84 to Gaode coordinate
            return vjmap.transform.convert(co, vjmap.transform.CRSTypes.WGS84, vjmap.transform.CRSTypes.GCJ02);
        }
        // Gaode to web WGS84 to CAD coordinate
        const webTocadCoordinate = point => {
            let co = vjmap.transform.convert(point, vjmap.transform.CRSTypes.GCJ02, vjmap.transform.CRSTypes.WGS84)
            return proj4("EPSG:4326", cadEpsg, co);
        }
        // Compute WGS84 center from CAD map center
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let cadCenter = mapBounds.center();
        let webCenter = cadToWebCoordinate(cadCenter);
        // Set CAD map center as map center
        map.setCenter(webCenter)
        
        let cadPrj = new vjmap.GeoProjection(mapBounds);
        
        // Highlight when clicking CAD elements
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        }, null, null, (curResult, zoom, x, y) => {
            // Result callback: convert CAD coordinates to web for drawing
            if (!(curResult && curResult.result && curResult.result.length > 0)) return;// No result
            let queryResult = svc.processQueryResult(curResult, pt => {
                // Coordinate transform for each queried point
                let cadPoint = cadPrj.fromMercator(pt);// To CAD coordinate
                return cadToWebCoordinate(cadPoint); // CAD to current map lnglat
            });
            return queryResult;
        }, (lngLat) => {
            // Pre-query callback to modify params (e.g. coordinates)
            // Convert click lnglat to CAD coordinate for query
            let coCad = webTocadCoordinate([lngLat.lng, lngLat.lat])
            // Geo length per pixel for current CAD map
            let coCad1 = webTocadCoordinate(map.unproject([500, 500]));// Pixel (500,500) to lngLat to CAD
            let coCad2 = webTocadCoordinate(map.unproject([501, 500]));// Pixel (501,500) to lngLat to CAD
            let pixelToGeoLength = Math.abs(coCad2[0] - coCad1[0]); // Geo length per pixel
            return {
                x: coCad[0],
                y: coCad[1],
                pixelToGeoLength
            }
        })
        
        
        const name = "myhighlight";
        const highlightColor = "#00ff00"; //
        const hoverColor = "#ff00ff"; // Hover color
        const color = [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            hoverColor,
            highlightColor
        ]
        const addSourceLayer = () => {
            //  Data source
            map.addGeoJSONSource(`${name}-source`, {
                type: "FeatureCollection",
                features: []
            });
        
            map.addCircleLayer(`${name}-point-layer`, `${name}-source`, {
                circleColor: color,
                circleRadius: 3,
                circleOpacity: 0.6,
                filter: [
                    "==",
                    ["geometry-type"],
                    "Point"
                ]
            });
        
        
            map.addLineLayer(`${name}-line-layer`, `${name}-source`, {
                lineJoin: "round",
                lineCap: "round",
                lineColor: color,
                lineWidth: 5,
                lineOpacity: 0.6,
                filter: [
                    "==",
                    ["geometry-type"],
                    "LineString"
                ]
            });
        
        
            map.addFillLayer(`${name}-fill-layer`, `${name}-source`, {
                fillColor: color,
                fillOpacity: 0.6,
                filter: [
                    "==",
                    ["geometry-type"],
                    "Polygon"
                ]
            })
        
        }
        const clear = () => {
            if (map.getSource(`${name}-source`)) {
                map.getSource(`${name}-source`).setData({
                    type: "FeatureCollection",
                    features: []
                });
            }
        };
        
        // Highlight CAD layer data
        const highlightCadLayer = async () => {
            let res = await svc.conditionQueryFeature({
                condition: `layerindex = 1`, // SQL WHERE condition, see server condition query docs
                fields: "",
                includegeom: true, // Return geometry; when false, >1 returns bbox only
                realgeom: true,
                limit: 100000 // Set large; default 100
            }, pt => {
                // Coordinate transform for each queried point
                let cadPoint = cadPrj.fromMercator(pt);// To CAD coordinate
                return cadToWebCoordinate(cadPoint); // CAD to map lnglat
            })
        
            if (res && res.result && res.result.length > 0) {
                if (!map.getSource(`${name}-source`)) {
                    addSourceLayer();// First init
                }
        
                const features = []
                if (res && res.result && res.result.length > 0) {
                    for (let ent of res.result) {
                        if (ent.geom && ent.geom.geometries) {
                            let clr = map.entColorToHtmlColor(ent.color);
                            for (let g = 0; g < ent.geom.geometries.length; g++) {
                                features.push({
                                    id: ent.id,
                                    type: "Feature",
                                    properties: {
                                        objectid: ent.objectid + "_" + g,
                                        color: clr,
                                        alpha: ent.alpha / 255,
                                        lineWidth: 1,
                                        name: ent.name,
                                        isline: ent.isline,
                                        layerindex: ent.layerindex
                                    },
                                    geometry: ent.geom.geometries[g]
                                })
                            }
                        }
                    }
                }
                let geom = {
                    type: "FeatureCollection",
                    features: features
                };
        
                if (geom.features.length > 0) {
                    map.getSource(`${name}-source`).setData(geom);
                } else {
                    clear();
                }
            } else {
                clear();
            }
            map.triggerRepaint();
        };
        
        let hoverId;
        map.hoverLayer([`${name}-point-layer`, `${name}-line-layer`, `${name}-fill-layer`], (cb) => {
            if (!(cb && cb.features && cb.features.length > 0)) {
                if (hoverId) {
                    map.setFeatureState({
                        source: `${name}-source`,
                        id: hoverId
                    }, {
                        hover: false
                    })
                }
                hoverId = null;
                return;
            }
            hoverId = cb.features[0].id;
            map.setFeatureState({
                source: `${name}-source`,
                id: hoverId
            }, {
                hover: true
            })
        })
        
        
        // Clear CAD layer highlight
        const unHightlightCadLayer = () => {
            clear();
            map.triggerRepaint();
        }
        
        
        
        const roadMap = () => {
            map.showSource("gaodeRoadSource")
            map.hideSource("gaodeImgSource")
            map.hideSource("gaodeImgSourceLabel")
        }
        
        const imageMap = () => {
            map.showSource("gaodeImgSource")
            map.showSource("gaodeImgSourceLabel")
            map.hideSource("gaodeRoadSource")
        }
        
        const showHideCadLayer = async (isHidden) => {
            // Show/hide a CAD layer
            let layerNames = ['zhix'];
            // Layer name to index
            let layerIndexs = layerNames.map(name => layers.find(layer => layer.name == name).index)
            // Create new style by layer visibility
            let style = await svc.createStyle({
                layeron: isHidden ? undefined: layerIndexs, // Layers to show
                layeroff: isHidden ? layerIndexs: undefined, // Layers to hide
                backcolor: 0xFFFFFF // Light theme; use 0 for dark
            }, mapId)
        
            let layer = style.stylename; // New style name
        
        
            // Remove previous WMS source
            map.removeSourceEx(wmsSourceId)
        
            // Add new WMS URL from style
        
            let wmsUrl = svc.wmsTileUrl({
                mapid: mapId, // Map id
                layers: layer, // Layer name
                srs: "EPSG:3857",
                crs: cadEpsg,
                webMapType: "GCJ02" // Base is Gaode, use GCJ02
            })
            map.addSource(wmsSourceId, {
                'type': 'raster',
                'tiles': [
                    wmsUrl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': 'wms-test-layer',
                    'type': 'raster',
                    'source': wmsSourceId,
                    'paint': { "raster-opacity": 1 }
                }
            );
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "185px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => highlightCadLayer()}>Highlight CAD layer data
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => unHightlightCadLayer()}>Clear CAD layer highlight
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => roadMap()}>Switch to road map
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => imageMap()}>Switch to imagery map
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showHideCadLayer(true)}>Hide CAD layer
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showHideCadLayer(false)}>Show CAD layer
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