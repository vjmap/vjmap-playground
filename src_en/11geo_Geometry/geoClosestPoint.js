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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoClosestPoint
        // --Closest point--
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
// Create geo projection from map bounds
let prj = new vjmap.GeoProjection(res.bounds);

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterStyle(), // style, raster style here
    center: prj.toLngLat(prj.getMapExtent().center()), // set map center
    zoom: 2, // set map zoom level
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();
map.setRasterOpacity(svc.rasterLayerId(), 0.3);

const mapBounds = map.getGeoBounds(0.6);

let geoDatas = [];
const lines = [];
for(let i = 0; i < 20; i++) {
    const points = mapBounds.randomPoints(2, 3);
    geoDatas.push({
        points: map.toLngLat(points),
        properties: {
            name: "line" + (i + 1),
            color: vjmap.randomColor(),
            selected: false
        }
    });
    lines.push(points);
}
let polylines = new vjmap.Polyline({
    data: geoDatas,
    lineColor: ['get', 'color'],
    lineWidth: ['case', ['to-boolean', ['get', 'selected']], 5, 2],
});
polylines.addTo(map);

// marker
let marker1 = new vjmap.Marker({
    color: "blue"
});
marker1.setLngLat(map.getCenter()).addTo(map);
let marker2 = new vjmap.Marker({
    color: "red",
    draggable: true
});
marker2.setLngLat(map.getCenter()).addTo(map);

let curIndex = -1;

const updateIntersect = lngLat => {
    // Convert lat-lon to geometric coordinates
    const coord = map.fromLngLat(lngLat);
    // Find closest point on all polylines
    const res = vjmap.closestPointOnPolylines(coord, lines);
    // Set marker position to closest point
    marker1.setLngLat(map.toLngLat(res.closestPoint));
    if (curIndex !== -1) {
        // Unhighlight previous line
        geoDatas[curIndex].properties.selected = false;
    }
    // Highlight current line
    geoDatas[res.closestIndex].properties.selected = true;
    curIndex = res.closestIndex;
    // Update data
    polylines.setData(geoDatas);
}
marker2.on("dragend", e => {
    const lngLat = e.target.getLngLat();
    updateIntersect(lngLat);
})
// Compute closest point on load
updateIntersect(marker2.getLngLat());

message.info("Drag the red marker to compute the closest point in real time!")
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