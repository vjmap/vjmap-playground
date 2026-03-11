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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/l7layer/04bubbleLayer
        // --Bubble animation layer--
// JS code
// Create map service object with service URL and token
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
// Assume full map at zoom level 8
let initZoom = 8;
let style = {
    backcolor: 0, // use dark style when div has dark background
    clipbounds: Math.pow(2, initZoom) // Value only = zoom factor (not extent)
}
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID (ensure exists or upload new)
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: style // use dark style when div has dark background
})
if (res.error) {
    message.error(res.error)
}
// Get map bounds
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
// Create projection
let prj = new vjmap.GeoProjection(mapExtent);

// Create map object
let map = new vjmap.Map({
    container: 'map', // container ID
    style: svc.rasterStyle(), // Raster tile style
    center: prj.toLngLat(mapExtent.center()), // Center
    zoom: initZoom + 1,
    pitch: 60,
    minZoom: initZoom - 3, // Optional min zoom
    renderWorldCopies: false
});
// Attach service and projection
map.attach(svc, prj);
map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
// Click to highlight (elements highlight on click)
map.enableLayerClickHighlight(svc, e => {
    if (!e) return;
    let msg = {
        content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
        key: "layerclick",
        duration: 5
    }
    e && message.info(msg);
})

let mousePositionControl = new vjmap.MousePositionControl({
    showZoom: true,
    showLatLng: true
});
map.addControl(mousePositionControl, "bottom-left");

await map.onLoad();

let mapBounds = vjmap.GeoBounds.fromString(res.mapBounds); // Actual map bounds
mapBounds = mapBounds.scale(0.4);

// Add L7 library, see https://l7.antv.vision
if (typeof L7 !== "object") {
    // If no L7 environment
    await vjmap.addScript({
        src: "../../js/l7.js"
    });

}
// Create L7 scene
const scene = new vjmap.Scene(L7, map);

let datas = mapBounds.randomGeoJsonPointCollection(50);

const pointLayer = new L7.PointLayer({})
    .source(map.toLngLat(datas))
    .shape('circle')
    .active(true)
    .animate(true)
    .size(56)
    .color('index', (value) => {
        let idx = +value % 4;
        let colors = [
            "#4cfd47",
            "#00F8F9",
            "#FFFF00",
            "#FF0000"
        ];
        return colors[idx];
    })
    .style({
        opacity: 1
    });

scene.addLayer(pointLayer);

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