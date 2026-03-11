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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/layer/heatmapLayer
        // --Heatmap layer--
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
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
map.fitMapBounds();
await map.onLoad();
const mapBounds = map.getGeoBounds(0.6);
let geoDatas = []
for(let i = 0; i < 1000; i++) {
    const pt = mapBounds.randomPoint();
    const data = {
        point:  map.toLngLat(pt),
        properties: {
           value: vjmap.randInt(0, 100)
        }
    }
    geoDatas.push(data)
}

let heatmapLayer = new vjmap.Heatmap({
    data: geoDatas,
    // heatmapWeight: point weight contribution; larger = more prominent
    heatmapWeight:  [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, // Normalize min/max (0,100) to 0-1
        0,
        100,
        1
    ],
    // heatmapRadius: point radius for weight calc, in pixels, default 30
    heatmapRadius: [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, // Level 0
        10, // Radius 10
        9, // Level 9 (other levels: linear interpolation)
        50 // Radius 50
    ],
    // heatmapColor: color at each heatmap value
    heatmapColor: [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(33,102,172,0)',
        0.2,
        'rgb(103,169,207)',
        0.4,
        'rgb(209,229,240)',
        0.6,
        'rgb(253,219,199)',
        0.8,
        'rgb(239,138,98)',
        1,
        'rgb(178,24,43)'
    ],
    // heatmapIntensity: overall heatmap strength, similar to heatmapWeight
    heatmapIntensity: [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        1,
        9,
        3
    ],
    // heatmapOpacity: heatmap opacity
    heatmapOpacity: [
        'interpolate',
        ['linear'],
        ['zoom'],
        7,
        1,
        9,
        0
    ]
});
heatmapLayer.addTo(map);


// Click to query heatmap layer
map.on('click', heatmapLayer.layerId, (e) => {
    message.info({content:`Features affecting this point: ${e.features.length}`, duration: 2, key: "info"});
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