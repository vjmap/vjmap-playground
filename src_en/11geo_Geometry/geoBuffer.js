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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoBuffer
        // --Buffer calculation--
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
// Navigation control
map.addControl(new vjmap.NavigationControl());
// Mouse position control
map.addControl(new vjmap.MousePositionControl({showZoom: true}));


const mapBounds = map.getGeoBounds(0.6);
for(let i = 0; i < 100; i ++) {
    let marker = new vjmap.Marker();
    marker.setLngLat(map.toLngLat(mapBounds.randomPoint()));
    marker.addTo(map);
}

message.info("Draw a buffer; markers inside the buffer will turn red")

let drawCircle = await vjmap.Draw.actionDrawCircle(map);
if (drawCircle.cancel) {
    return
}

let feature = drawCircle.features[0];
let polygon = new vjmap.Polygon({
    data: feature.geometry.coordinates[0],
    fillColor: 'yellow',
    fillOpacity: 0.3,
    fillOutlineColor: "#f00"
});
polygon.addTo(map);

let center = map.fromLngLat(feature.properties.center);
let circlePoint = map.fromLngLat(feature.geometry.coordinates[0][0]);
let radius = center.distanceTo(circlePoint);
// Iterate all markers
let markers = map.getMarkers();
for (let m of markers) {
    let pt = map.fromLngLat(m.getLngLat());
    if (center.distanceTo(pt) <= radius) {
        m.setColor("red");
    }
}


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