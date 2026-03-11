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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/08gaodeCadWmsLayer
        // --Load CAD map (WMS layer) in Gaode SDK--

if (typeof AMap !== "object") {
    // If AMap not available
    await vjmap.addScript({
        // Replace key with your Gaode SDK key
        src: "https://webapi.amap.com/maps?v=2.0&key=5ef803514b9a411419dc3c82d6643e12"
    });

}
let map = new AMap.Map('map', {
    layers: [
        new AMap.TileLayer.Satellite()  // Satellite layer
    ],
    expandZoomRange: true,  // Expand zoom range
    zooms: [3, 20],        // Zoom range
    zoom: 15,
    center: [106.166187, 29.44102]
});
// Map service
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
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


let cadEpsg = "EPSG:4544";// CAD map EPSG code
// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // Map id
    layers: layer, // Layer name
    bbox: '', // bbox not needed
    srs: "EPSG:3857", //
    crs: cadEpsg,
    webMapType: "GCJ02"
})
function getQueryStringArgs(url) {
    let theRequest = {};
    let idx = url.indexOf("?");
    if (idx != -1) {
        let str = url.substr(idx + 1);
        let strs = str.split("&");
        for (let i = 0; i < strs.length; i++) {
            let items = strs[i].split("=");
            theRequest[items[0]] = items[1];
        }
    }
    return theRequest;
}

let wms = new AMap.TileLayer.WMS({
    url: wmsUrl.substr(0, wmsUrl.indexOf("?")),
    blend: true,
    tileSize: 256,
    dataZooms: [2, 24],
    params: getQueryStringArgs(wmsUrl)
});

wms.setMap(map);

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