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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/l7layer/03hexagonLayer
        // --Hexagon 3D layer--
// JS code
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
// Full map display at zoom 8
let initZoom = 8;
let style = {
    backcolor: 0, // use dark style when div has dark background
    clipbounds: Math.pow(2, initZoom) // Value only = zoom factor
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
    minZoom: initZoom - 3,// Optional min zoom
    renderWorldCopies: false
});
// Attach service and projection
map.attach(svc, prj);
map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
// Click to highlight
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
    // If no deck environment
    await vjmap.addScript({
        src: "../../js/l7.js"
    });

}

// Add L7 library, see https://l7.antv.vision
if (typeof L7 !== "object") {
    // If no deck environment
    await vjmap.addScript({
        src: "../../js/l7.js"
    });

}
let datas = []
for(let i = 0; i < 5000; i++) {
    let pt = map.toLngLat(mapBounds.randomPoint());
    datas.push({
        x: pt[0],
        y: pt[1],
        v: Math.abs(Math.sin(pt[0] * pt[1])) * 1000
    })
}

// Create L7 scene
const scene = new vjmap.Scene(L7, map);
const layer = new L7.HeatmapLayer({})
.source(datas, {
    parser: {
        type:'json',
        x:'x',
        y:'y'
    },
    transforms: [
        {
            type: 'hexagon',
            size: 1000,
            field: 'v',
            method: 'sum'
        }
    ]
})
.size('sum', sum => {
    return sum * 200;
})
.shape('hexagonColumn')
.style({
    coverage: 0.8,
    angle: 0,
    opacity: 1.0
})
.color('sum', [
    "#33B5E5",
    "#0099CC",
    "#AA66CC",
    "#9933CC",
    "#99CC00",
    "#669900",
    "#FFBB33",
    "#FF8800",
    "#FF4444",
    "#CC0000"
]);
scene.addLayer(layer);

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