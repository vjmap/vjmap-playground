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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/l7layer/06isolineLayer
        // --Isoline/contour layer--
// JS code
// Create map service object with service URL and token
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map

let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID (ensure exists or upload new)
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
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
    center: [ 102.597971, 23.110479 ],
    zoom: 13.34, // Center
    pitch: 60,
    renderWorldCopies: false
});
// Attach service and projection
map.attach(svc, prj);
map.setMaxBounds(map.toLngLat(prj.getMapExtent()));


let mousePositionControl = new vjmap.MousePositionControl({
    showZoom: true,
    showLatLng: true
});
map.addControl(mousePositionControl, "bottom-left");

await map.onLoad();

// Add L7 library, see https://l7.antv.vision
if (typeof L7 !== "object") {
    // If no L7 environment
    await vjmap.addScript({
        src: "../../js/l7.js"
    });

}
// Create L7 scene
const scene = new vjmap.Scene(L7, map);

scene.on('loaded', () => {
    fetch('https://gw.alipayobjects.com/os/rmsportal/ZVfOvhVCzwBkISNsuKCc.json')
        .then(res => res.json())
        .then(data => {
            console.log(data)
            const layer = new L7.LineLayer({})
                .source(data)
                .size('ELEV', h => {
                    return [ h % 50 === 0 ? 1.0 : 0.5, (h - 1300) * 0.2 ];
                })
                .shape('line')
                .scale('ELEV', {
                    type: 'quantize'
                })
                .color('ELEV', [
                    '#094D4A',
                    '#146968',
                    '#1D7F7E',
                    '#289899',
                    '#34B6B7',
                    '#4AC5AF',
                    '#5FD3A6',
                    '#7BE39E',
                    '#A1EDB8',
                    '#CEF8D6'
                ]);
            scene.addLayer(layer);
        });
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