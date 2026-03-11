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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/14leafletCadWmsLayer
        // --Web map with CAD overlay [web map as basemap]--

// Leaflet website: https://leafletjs.com/
// Leaflet source: https://github.com/Leaflet/Leaflet
if (typeof L !== "object") {
    // If no Leaflet environment
    await vjmap.addScript([{
        src: "../../js/leaflet2.0/leaflet.js"
    },{
        src: "../../js/leaflet2.0/leaflet.css"
    }]);
}


// Create Leaflet map object
let map = L.map('map', {
    center: [29.44102, 106.166187],
    zoom: 15
});
L.tileLayer('https://t3.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66').addTo(map);


// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "sys_cadcesium";
let res = await svc.openMap({
    mapid: mapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
let layer = res.layer;// Layer style name

let cadEpsg = "EPSG:4544";// CAD map EPSG code
// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // Map ID
    layers: layer, // Layer name
    bbox: '', // bbox not needed
    srs: "EPSG:3857", //
    crs: cadEpsg,
})

let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
// CAD coordinates to web WGS84
const cadToWebCoordinate = async point => {
    let co = await svc.cmdTransform(cadEpsg, "EPSG:4326", point);
    return co[0]
}

// Add WMS layer
let wmsLayer = L.tileLayer.wms(wmsUrl, {
    attribution: "vjmap.com"
});
wmsLayer.addTo(map);

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