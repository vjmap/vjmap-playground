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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/05fourparamrotateweb
        // --CAD rotated overlay on web map [web map as base]--
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
                // For imagery use this URL
                // tiles: ["https://t3.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"]
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
        },{
            id: 'tdt2',
            type: 'raster',
            source: 'tdt2',
        }]
    },
    center: prj.toLngLat([116.4849310885225,  39.960672361810566]),
    zoom: 15,
    pitch: 0,
    maxZoom: 24,
    renderWorldCopies: false // Do not show multi-screen map
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent by map bounds
//map.fitMapBounds();
await map.onLoad();


// CAD control points
let cadPoints = [
    vjmap.geoPoint([587464448.8435847, 3104003685.208651,]),
    vjmap.geoPoint([587761927.7224838, 3104005967.655292]),
    vjmap.geoPoint([587463688.0280377, 3103796743.3798513]),
    vjmap.geoPoint([587760406.0913897, 3103793700.1176634])
];


// Web control points (WGS84) corresponding to above
let webPoints = [
    vjmap.geoPoint([116.4849310885225,  39.9606723618105]),
    vjmap.geoPoint([116.48571466352934, 39.9601669054582]),
    vjmap.geoPoint([116.48440741215745, 39.9601639321747]),
    vjmap.geoPoint([116.48517547082753, 39.9596852318108])
]


// Four-param from control points
let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , false); // With rotation
let fourparam = [param.dx, param.dy, param.scale, param.rotate]

// Get map metadata for layer style
let cadMapId = "sys_zp"
let style = await svc.createStyle({
    backcolor: 0xFFFFFF // Light theme
}, cadMapId)
let wmsurl = svc.wmsTileUrl({
    mapid: cadMapId,
    version:"v1",
    layers: style.stylename,
    fourParameter: fourparam
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


// Add control points
webPoints.forEach(pt => {
    new vjmap.Marker({color: "#f00"}).setLngLat(map.toLngLat(pt)).addTo(map);
});
cadPoints.forEach(pt => {
    // Inverse four-param to web coordinate
    let co3857 = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(pt), param)
    // Mercator to WGS84
    let cowgs84 = vjmap.transform.convert(
        co3857,
        vjmap.transform.CRSTypes.EPSG3857,
        vjmap.transform.CRSTypes.EPSG4326
    );
    new vjmap.Marker({color: "#0f0"}).setLngLat(map.toLngLat(cowgs84)).addTo(map);
});

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