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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationLineDashArray
        // --Dashed line path animation--
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
// Get map bounds
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
// Create geo projection from map bounds
let prj = new vjmap.GeoProjection(mapExtent);

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterStyle(), // style, raster style here
    center: prj.toLngLat(mapExtent.center()), // set map center
    zoom: 2, // set map zoom level
    pitch: 0, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();
map.setRasterOpacity(svc.rasterLayerId(), 0.3);

const mapBounds = map.getGeoBounds(0.6);

const lines = mapBounds.randomGeoJsonLineCollection(3, 4);
map.addGeoJSONSource('lines', map.toLngLat(lines));


let dash = [3, 3]; // your input; dash you want to animate
let speed = 0.5; // your input; speed rate
let dashArraySeq = createDashArraySeq(dash, speed); // `dashArraySeq` contains dash arrays you can use

function createDashArraySeq(dash, speed = 1) {
    let dashArraySeq = [dash];
    for (let i = speed, len = dash[0] + dash[1]; i < len; i += speed) {
        const arr = [];
        if (i <= len - dash[0]) {
            arr.push(0, i, dash[0], dash[1] - i);
        } else {
            const leftFillCnt = i - (len - dash[0]);
            arr.push(leftFillCnt, dash[1], dash[0] - leftFillCnt, 0);
        }
        dashArraySeq.push(arr);
    }
    return dashArraySeq;
}

map.addLineLayer("lineLayer", "lines", {
    lineColor: "red",
    lineWidth: 5,
    lineOpacity: 0.8,
    lineDasharray: dashArraySeq[0]
});

let dashArrayIdx = 0;
function animateLine(ts) {
    dashArrayIdx = (dashArrayIdx + 1) % dashArraySeq.length;
    map.setPaintProperty('lineLayer', 'line-dasharray', dashArraySeq[dashArrayIdx]);
    requestAnimationFrame(animateLine);
}
requestAnimationFrame(animateLine);
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