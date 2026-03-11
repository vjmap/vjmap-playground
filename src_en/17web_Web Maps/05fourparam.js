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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/05fourparam
        // --Overlay web map by control points--
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Create lnglat projection by map bounds
let prj = new vjmap.LnglatProjection();
// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: {
        version: svc.styleVersion(),
        sources: {
            tdt1: {
                type: 'raster',
                tiles: ["https://t3.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
            },
            tdt2: {
                type: 'raster',
                tiles: ["https://t3.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
            }
        },
        layers: [{
            id: 'tdt1',
            type: 'raster',
            source: 'tdt1',
        }, {
            id: 'tdt2',
            type: 'raster',
            source: 'tdt2',
        }]
    },
    center: [113.27384341272153, 23.206602011277003],
    zoom: 15,
    pitch: 0,
    renderWorldCopies: false // Do not show multi-screen map
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent by map bounds
//map.fitMapBounds();
await map.onLoad();
// Get map metadata for layer style
let cadMapId = "sys_webwms"
let style = await svc.createStyle({
    backcolor: 0xFFFFFF // Light theme
}, cadMapId);

// CAD control points
let cadPoints = [
    vjmap.geoPoint([39760.07407, 237424.52134]),
    vjmap.geoPoint([39006.60468, 237808.49494749]),
    vjmap.geoPoint([38823.92918, 235003.98994]),
    vjmap.geoPoint([37885.55424, 235452.80893])
];

// Web control points (Baidu) corresponding to above
let baiduPoints = [
    vjmap.geoPoint([113.292983, 23.206979]),
    vjmap.geoPoint([113.285631, 23.210304]),
    vjmap.geoPoint([113.283897, 23.185047]),
    vjmap.geoPoint([113.274716, 23.188962])
]

// Baidu to WGS84; use GCJ02 for Gaode, WGS84 for Tianditu
// Convert to Mercator 3857
let epsg3857Points = baiduPoints.map(e => vjmap.geoPoint(vjmap.transform.convert([e.x, e.y], vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.EPSG3857)));

// Four-param from Mercator 3857 to CAD
let fourparam = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints, true); // No rotation here

let wmsurl = svc.wmsTileUrl({
    mapid: cadMapId,
    version: "v1",
    layers: style.stylename,
    srs: "", // Empty = use four-param only
    crs: "", // Empty = use four-param only
    fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate] // To 4326 then four-param to CAD
})

map.addSource('wms-test-source', {
    'type': 'raster',
    'tiles': [
        wmsurl
    ],
    'tileSize': 256
});
map.addLayer({
        'id': 'wms-test-layer',
        'type': 'raster',
        'source': 'wms-test-source',
        'paint': { "raster-opacity": 1 }
    }
);

// Mark control points
// EPSG:3857 points
for (let pt of epsg3857Points) {
    let wgs84 = vjmap.Projection.mercator2LngLat(pt); // Mercator 3857 to WGS84 lnglat
    let marker = new vjmap.Marker({
        color: "green"
    });
    marker.setLngLat(wgs84).addTo(map);
}

// CAD points
for (let pt of cadPoints) {
    let marker = new vjmap.Marker({
        color: "red"
    });
    // CAD points; inverse four-param to get lnglat
    let p = vjmap.coordTransfromByInvFourParamter(pt, fourparam);
    let wgs84 = vjmap.Projection.mercator2LngLat(p); // Mercator 3857 to WGS84 lnglat
    marker.setLngLat(wgs84).addTo(map);
}





// CAD to web WGS84
const cadToWebCoordinate = point => {
    // Inverse four-param to 3857 then to 4326
    let p = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(point), fourparam);
    return vjmap.Projection.mercator2LngLat(p);
}
// Web WGS84 to CAD
const webTocadCoordinate = point => {
    // 4326 to 3857 then four-param to CAD
    let p = vjmap.Projection.lngLat2Mercator(point);
    return vjmap.coordTransfromByFourParamter(vjmap.geoPoint(p), fourparam);
}


let polygonLayer;
const queryDrawHatch = async () => {
    if (polygonLayer) return; // Skip if already drawn
    let polygons = [];
    let query = await svc.conditionQueryFeature({
        mapid: cadMapId,
        version: "v1",
        condition: `name="11"`, // SQL WHERE condition, see server query docs
        fields: "",
        geom: true,
        layer: style.stylename,
        limit: 100000 // Set large to get all; default 100
    })
    if (query.error) {
        // message.error(query.error);
        return;
    } else {
        if (query.recordCount > 0) {
            // Get CAD map metadata
            const metadata = await svc.metadata(cadMapId);
            let mapExtent = vjmap.GeoBounds.fromString(metadata.bounds);
            let cadPrj = new vjmap.GeoProjection(mapExtent);

            for (let i = 0; i < query.result.length; i++) {
                let bounds = map.getEnvelopBounds(query.result[i].envelop);
                let clr = vjmap.entColorToHtmlColor(query.result[i].color); // Entity color to HTML color
                let cadPts = bounds.toPointArray();
                let webPts = cadPts.map(pt => {
                    // Data is CAD full-extent lnglat, not overlay lnglat
                    const cadPoint = cadPrj.fromLngLat(pt); // Convert CAD full-extent lnglat to CAD coordinate
                    return cadToWebCoordinate(cadPoint); // CAD to web lnglat
                })
                polygons.push({
                    points: map.toLngLat(webPts),
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
        fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#0f0', '#f00'],
        fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.3, 0.5],
        fillOutlineColor: ['get', 'color'],
        isHoverPointer: true,
        isHoverFeatureState: true
    });
    polygonLayer.addTo(map);
}

// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{ width: "230px", right: "10px" }}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => queryDrawHatch()}>Query and draw all arrow Hatches on map
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