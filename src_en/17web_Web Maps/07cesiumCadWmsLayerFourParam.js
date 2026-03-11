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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/07cesiumCadWmsLayerFourParam
        // --Load CAD map in Cesium (WMS layer four-param overlay)--
// Map service
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
window.svc = svc
// Open map
let mapId = "sys_cadcesium";
let res = await svc.openMap({
    mapid: mapId, // Map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
    style: vjmap.openMapDarkStyle() // Dark background style
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
let layer = res.layer;// Layer style name



if (typeof Cesium !== "object") {
    // If not available
    await vjmap.addScript([{
        src: "../../js/Cesium/Cesium.js"
    }, {
        src: "../../js/Cesium/Widgets/widgets.css"
    }])
}

let imageryProvider= new Cesium.UrlTemplateImageryProvider({
    url: "https://t1.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=3346bb6ad29b5013c5952cf1117b80e9",
})

let viewer = new Cesium.Viewer('map', {
    imageryProvider: imageryProvider,
    contextOptions: {
        webgl: {
            alpha: true
        }
    },
    selectionIndicator: false,
    animation: false, // Show animation control
    baseLayerPicker: false, // Show layer picker
    geocoder: false, // Show geocoder
    timeline: false, // Show timeline
    sceneModePicker: false, // Show scene mode picker
    navigationHelpButton: false, // Show navigation help
    infoBox: false, // Show info box on click
    fullscreenButton: false,
    shouldAnimate: true // Animate
});


var layers = viewer.scene.imageryLayers;

// Add Gaode label layer
layers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
        url: "https://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    })
);


// CAD control points
let cadPoints = [
    vjmap.geoPoint([595544.328982, 3252528.216226]),
    vjmap.geoPoint([627928.010946,3263082.764822]),
    vjmap.geoPoint([625319.1513109521,3246689.371984474]),
];

// Web control points (WGS84, e.g. from Tianditu) corresponding to above
let webPoints = [
    vjmap.geoPoint([105.9842161763667,29.38665272938248]),
    vjmap.geoPoint([106.31897105133609, 29.478968581719126]),
    vjmap.geoPoint([106.29021011814865, 29.331372065225345])
]

// WGS84 to 3857
webPoints = webPoints.map(e => vjmap.geoPoint(vjmap.transform.convert([e.x, e.y],vjmap.transform.CRSTypes.WGS84, vjmap.transform.CRSTypes.EPSG3857)));

// Four-param from 3857 to CAD
let fourparam = vjmap.coordTransfromGetFourParamter(webPoints, cadPoints, true); // No rotation

// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // Map id
    layers: layer, // Layer name
    bbox: '', // bbox not needed, Cesium adds it
    srs: "EPSG:4326", // Cesium map is WGS84
    crs: "EPSG:3857",
    fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate] // (offsetX, offsetY, scaleK, rotateRad)
})
layers.addImageryProvider(
    new Cesium.WebMapServiceImageryProvider({
        url: wmsUrl,
    })
);


// CAD to web WGS84
const cadToWebCoordinate =  point => {
    // Inverse four-param to 3857 then to 4326
    let p = vjmap.coordTransfromByInvFourParamter(point, fourparam);
    return vjmap.Projection.mercator2LngLat(p);
}
// Web WGS84 to CAD
const webTocadCoordinate =  point => {
    // 4326 to 3857 then four-param to CAD
    let p = vjmap.Projection.lngLat2Mercator(point);
    return vjmap.coordTransfromByFourParamter(vjmap.geoPoint(p), fourparam);
}
// Compute WGS84 center from CAD map center
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let cadCenter = mapBounds.center();
let webCenter = cadToWebCoordinate(cadCenter);

// Set initial position
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(webCenter[0], webCenter[1], 30000)
});

// To query CAD entity coordinates on map, use svc.rectQueryFeature with two CAD point bounds
// Use webTocadCoordinate to convert WGS84 to CAD for query.


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