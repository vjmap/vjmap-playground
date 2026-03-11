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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/05fourparamautomany
        // --Overlay multiple CAD maps on web map-- Auto overlay or by control points
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
            },
            // Imagery without labels
            gaodeImgSource: {
                type: 'raster',
                tiles:  [
                    "https://webst02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                ],
            },
            // Imagery with labels
            gaodeImgSourceLabel: {
                type: 'raster',
                tiles:  [
                    "https://webst02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                ],
            }
        },
        layers: [{
            id: 'gaodeRoad',
            type: 'raster',
            source: 'gaodeRoadSource',
            layout: {
                visibility: "none"
            }
        },{
            id: 'gaodeImg',
            type: 'raster',
            source: 'gaodeImgSource'
        },{
            id: 'gaodeImgLabel',
            type: 'raster',
            source: 'gaodeImgSourceLabel',
        }]
    },
    center: [0, 0],
    zoom: 11,
    pitch: 0,
    renderWorldCopies: false // Do not show multi-screen map
});

// Attach service and projection
map.attach(svc, prj);
await map.onLoad();

// Load proj4 (in production install via npm)
if (typeof proj4 !== "object") {
    // If not available
    await vjmap.addScript([{
        src: "../../js/proj4.min.js"
    }])
}
let isWebWgs84 = false; // true=WGS84 (Tianditu), false=GCJ02 (Gaode). This example uses Gaode
// CAD map params to overlay
let overCadMaps = [
    {
        mapid: "ca422a931980", // Auto overlay; omit epsg to get automatically
        crsType: vjmap.transform.EpsgCrsTypes.Xian80 // Xian 80 CRS
    },
    {
        mapid: "sys_cad2000",
        epsg: 4509, // Auto overlay with explicit epsg
        proj: "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs" // proj optional, from epsg: vjmap.transform.getProjByEpsgCode(4509)
    },
    {
        mapid: "sys_zp", // Overlay by control points
        // Control points: web and CAD corresponding coordinates
        points: {
            "web": [
                [111.27461919876993,39.48424837164032],
                [111.35308796357572,39.45803376417072]
            ],
            "cad": [
                [587464241.006472,3104004303.192057],
                [ 587761241.006472,3103794303.192057]
            ]
        }
    }
]

for (let item of overCadMaps) {
    let mapid = item.mapid;
    let res = await svc.openMap({
        mapid: mapid, // Map ID
        mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
        style: vjmap.openMapDarkStyle() // Dark background style
    })
    if (res.error) {
        // If open failed
        map.logInfo(res.error, "error")
        return;
    }
    item.layers = JSON.parse(res.layers); // Layer data
    // Save current open params
    item.openParam = {...svc.currentMapParam()}

    // Current map projection
    item.projection = new vjmap.GeoProjection(item.openParam.bounds);


    if (item.points) {
        // Overlay by control points
        // CAD control points
        let cadPoints = item.points.cad.map(e => vjmap.geoPoint(e));

        // Web control points (WGS84) corresponding to above
        let webPoints = item.points.web.map(e => vjmap.geoPoint(e))

        // Four-param from control points
        let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
        let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , true); // No rotation
        let fourparam = [param.dx, param.dy, param.scale, param.rotate]
        item.fourParam = param;

        // WMS tile URL
        item.wmsUrl = svc.wmsTileUrl({
            mapid: mapid,
            version: item.openParam.version,
            layers: item.openParam.layer,
            fourParameter: fourparam
        })

        // CAD to web coordinate
        item.cadToWebPoint = (pt) => {
            let pt3857 = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(pt), item.fourParam); // Inverse four-param
            let pt4326 = vjmap.Projection.mercator2LngLat(pt3857);
            return vjmap.geoPoint(pt4326)
        }

        // Web to CAD coordinate
        item.webToCadPoint = (pt) => {
            let pt3857 = vjmap.Projection.lngLat2Mercator(pt)
            let res = vjmap.coordTransfromByFourParamter(vjmap.geoPoint(pt3857), item.fourParam); // Forward four-param
            return vjmap.geoPoint(res)
        }

    } else {
        // Auto overlay
        let bounds = item.openParam.bounds;
        let proj = item.proj;
        if (!proj) {
            if (item.crsType) {
                // Has CRS
                let result = vjmap.transform.getEpsgCode(bounds.center().toArray(), item.crsType)
                if (result.length > 0) {
                    proj = result[0].proj;
                    item.epsg = result[0].epsg
                }
            } else if (item.epsg) {
                proj = vjmap.transform.getProjByEpsgCode(item.epsg)
            }
            item.proj = proj;
        }

        if (!proj) {
            map.logInfo(mapid + " get proj string error", "error")
            return
        }
        if (typeof item.epsg == "number") {
            item.epsg = "EPSG:" + item.epsg
        }

        item.wmsUrl = svc.wmsTileUrl({
            mapid: mapid, // Map id
            layers: item.openParam.layer, // Layer name
            srs: "EPSG:3857",
            crs: item.epsg,
            webMapType: isWebWgs84 ? undefined : "GCJ02" // Base is Gaode, use GCJ02; omit for Tianditu
        })

        proj4.defs(item.epsg, item.proj)
        // CAD to web coordinate
        item.cadToWebPoint = point => {
            let co = proj4(item.epsg, "EPSG:4326", vjmap.geoPoint(point).toArray());
            if (isWebWgs84) return co;// If base is WGS84, no need to convert to GCJ02
            // Convert WGS84 to Gaode coordinate
            let res = vjmap.transform.convert(co, vjmap.transform.CRSTypes.WGS84, vjmap.transform.CRSTypes.GCJ02);
            return vjmap.geoPoint(res)
        }
        // Web to CAD coordinate
        item.webToCadPoint = point => {
            let co = point;
            if (!isWebWgs84) {
                // If base not WGS84, convert GCJ02 to WGS84
                co = vjmap.transform.convert(point, vjmap.transform.CRSTypes.GCJ02, vjmap.transform.CRSTypes.WGS84)
            }
            let res = proj4("EPSG:4326", item.epsg, co);
            return vjmap.geoPoint(res)
        }
    }

    // Check if point is within current map bounds
    item.isPointInMapBounds = (pt, isWebPoint) => {
        if (!item.visible) return false;// If hidden
        if (isWebPoint) {
            // If web coordinate
            pt = item.webToCadPoint(pt)
        }
        if(Array.isArray(pt)) {
            // If pt is [x,y]
            pt = vjmap.geoPoint(pt)
        }
        return item.openParam.drawBounds.contains(pt)
    }

    item.visible = true; // Show
}


for (let item of overCadMaps) {
    let mapid = item.mapid;
    let sourceId = 'wms-test-source-' + mapid;
    let layerId = 'wms-test-layer-' + mapid;
    item.sourceId = sourceId;
    item.layerId = layerId;

    // Add CAD WMS layer
    let wmsUrl = item.wmsUrl
    map.addSource(sourceId, {
        'type': 'raster',
        'tiles': [
            wmsUrl
        ],
        'tileSize': 256
    });
    map.addLayer({
            'id': layerId,
            'type': 'raster',
            'source': sourceId,
            'paint': { "raster-opacity": 1 }
        }
    );
    // Move highlight layers to top so click highlight is visible
    let topLayerIds = ['highlight-line-layer', 'highlight-fill-layer'];
    for(let layerId of topLayerIds) {
        let idx = map.getStyle().layers.findIndex(item => item.id == layerId)
        if(idx >= 0) {
            // If layer exists, move to top
            map.moveLayer(layerId)
        }
    }
}
if (overCadMaps.length == 0) return;


// Compute WGS84 center from first CAD map center
let mapBounds = overCadMaps[0].openParam.bounds;
let cadCenter = mapBounds.center();
let webCenter = overCadMaps[0].cadToWebPoint(cadCenter).toArray();
// Set CAD map center as map center
map.setCenter(webCenter)

// Highlight when clicking CAD elements
let curClickMapItem;
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
    if (!curClickMapItem) return; // If none
    let queryResult = svc.processQueryResult(curResult, pt => {
        // Coordinate transform for each queried point
        let cadPoint = curClickMapItem.projection.fromMercator(pt);// To CAD coordinate
        return curClickMapItem.cadToWebPoint(cadPoint).toArray(); // CAD to current map lnglat
    });
    return queryResult;
}, (lngLat) => {
    // Pre-query callback to modify params (e.g. coordinates)
    // Determine which map the point is on
    curClickMapItem = overCadMaps.find(item => item.isPointInMapBounds([lngLat.lng, lngLat.lat], true));
    if (!curClickMapItem) return ; // If none
    // Convert click lnglat to CAD coordinate for query
    let coCad = curClickMapItem.webToCadPoint([lngLat.lng, lngLat.lat]).toArray()
    // Geo length per pixel for current CAD map
    let coCad1 = curClickMapItem.webToCadPoint(map.unproject([500, 500])).toArray();// Pixel (500,500) to lngLat to CAD
    let coCad2 = curClickMapItem.webToCadPoint(map.unproject([501, 500])).toArray();// Pixel (501,500) to lngLat to CAD
    let pixelToGeoLength = Math.abs(coCad2[0] - coCad1[0]); // Geo length per pixel
    return {
        x: coCad[0],
        y: coCad[1],
        pixelToGeoLength,
        mapid: curClickMapItem.mapid,
        version: curClickMapItem.openParam.version,
        layer: curClickMapItem.openParam.layer,
        geom: curClickMapItem.openParam.mapopenway == vjmap.MapOpenWay.GeomRender
    }
})


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
imageMap()

// Fit to map by index
const fitMap = idx => {
    if (idx >= overCadMaps.length || idx < 0) return 0;
    let item = overCadMaps[idx];
    // Get CAD map bounds
    let mapBounds = item.openParam.bounds;
    let p1 = item.cadToWebPoint(mapBounds.min);
    let p2 = item.cadToWebPoint(mapBounds.max);
    let webBounds = vjmap.GeoBounds.fromDataExtent([p1, p2]);
    map.fitMapBounds(webBounds, {padding: 0})
}

// Show/hide map by index
const showHideMap = idx => {
    if (idx >= overCadMaps.length || idx < 0) return 0;
    let item = overCadMaps[idx];
    item.visible = !item.visible
    // Show/hide by controlling data source
    if (item.visible) {
        map.showSource(item.sourceId)
    } else {
        map.hideSource(item.sourceId)
    }
}
// Delete map
const deleteMap = mapid => {
    let idx = overCadMaps.findIndex(item => item.mapid == mapid)
    if (idx < 0 ) return;
    let item = overCadMaps[idx];
    // Remove source and related layers
    map.removeSourceEx(item.sourceId)
    // Remove from array
    overCadMaps.splice(idx, 1)
}

const showHideMapLayer = async (idx) => {
    if (idx >= overCadMaps.length || idx < 0) return ;
    let item = overCadMaps[idx];
    // let layerNames = ['0'];
    // // Convert layer name to layer index
    // let layerIndexs = layerNames.map(name => item.layers.find(layer => layer.name == name).index)
    //console.log("layerIndexs", layerIndexs, item.layers);
    let layerIndexs = [0, 1]; // Switch by layer index; use commented code above to convert from layer name
    // Create new style by layer visibility
    let isHidden = item.layerIsHidden
    item.layerIsHidden = !item.layerIsHidden
    let style = await svc.createStyle({
        layeron: isHidden ? undefined : layerIndexs, // Layers to show
        backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF
    }, item.mapid)

    item.layer = style.stylename; // New style name

    // Remove previous WMS source
    map.removeSourceEx(item.sourceId)

    // Add new WMS URL from style
    if (item.fourParam) {
        // WMS tile URL
        let fourparam = [item.fourParam.dx, item.fourParam.dy, item.fourParam.scale, item.fourParam.rotate]
        item.wmsUrl = svc.wmsTileUrl({
            mapid: item.mapid,
            version: item.openParam.version,
            layers: item.layer,
            fourParameter: fourparam
        })
    } else {
        item.wmsUrl = svc.wmsTileUrl({
            mapid: item.mapid, // Map id
            layers: item.layer, // Layer name
            srs: "EPSG:3857",
            crs: item.epsg,
            webMapType: isWebWgs84 ? undefined : "GCJ02" // Base is Gaode, use GCJ02
        })
    }
    map.addSource(item.sourceId, {
        'type': 'raster',
        'tiles': [
            item.wmsUrl
        ],
        'tileSize': 256
    });
    map.addLayer({
            'id': item.layerId,
            'type': 'raster',
            'source': item.sourceId,
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
                            onClick={() => fitMap(0)}>Fit to map 1
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => fitMap(1)}>Fit to map 2
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => fitMap(2)}>Fit to map 3
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => showHideMap(0)}>Show/hide map 1
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => showHideMap(1)}>Show/hide map 2
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => showHideMap(2)}>Show/hide map 3
                    </button>
                </div>

                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => showHideMapLayer(0)}>Show/hide map 1 layer data
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => showHideMapLayer(1)}>Show/hide map 2 layer data
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => showHideMapLayer(2)}>Show/hide map 3 layer data
                    </button>
                </div>

                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => deleteMap("ca422a931980")}>Delete map 1
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => deleteMap("sys_cad2000")}>Delete map 2
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => deleteMap("sys_zp")}>Delete map 3
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