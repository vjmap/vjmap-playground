const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/overlay/01eventOverlay
        // --Overlay polyline/polygon events--
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
    center: prj.toLngLat(mapExtent.center()), // Center
    zoom: 2,
    renderWorldCopies: false
});
// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
map.fitMapBounds();

await map.onLoad();
let mapBounds = map.getGeoBounds(0.6);


let polygon;
const addTestPolygons = ()=> {
    let len = mapBounds.width() / 50;
    let polygons = []
    for(let i = 0; i < 200; i++) {
        const p1 = mapBounds.randomPoint();
        const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
        const p3 = vjmap.geoPoint([p1.x + len, p1.y]);
        polygons.push({
            points: map.toLngLat([p1, p2, p3]),
            properties: {
                name: "polygon" + (i + 1),
                color: vjmap.randomColor()
            }
        })
    }

    polygon = new vjmap.Polygon({
        data: polygons,
        // If hover: red; otherwise use 'color' from properties
        fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
        fillOpacity: 0.8,
        fillOutlineColor: "#f00",
        isHoverPointer: true,
        isHoverFeatureState: true
    });
    polygon.addTo(map);
    polygon.clickLayer(e => {
        if (e.defaultPrevented) return; // Skip if prevented
        message.info(`Clicked polygon ${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}`)
        e.preventDefault();
    })
}

addTestPolygons();

let polylines;
const addTestPolygines = ()=> {
    let geoDatas = [];
    const lines = [];
    for(let i = 0; i < 20; i++) {
        const points = mapBounds.randomPoints(2, 3);
        geoDatas.push({
            points: map.toLngLat(points),
            properties: {
                name: "line" + (i + 1),
                color: vjmap.randomColor(),
            }
        });
        lines.push(points);
    }

    polylines = new vjmap.Polyline({
        data: geoDatas,
        // If hover: red; otherwise use 'color' from properties
        lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
        lineWidth: 10,
        isHoverPointer: true,
        isHoverFeatureState: true
    });
    polylines.addTo(map);
    polylines.clickLayer(e => {
        if (e.defaultPrevented) return; // Skip if prevented
        message.info(`Clicked polyline ${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}`)
        e.preventDefault();
    })
    map.moveLayer(polylines.layerId, polygon.layerId); // Move polylines below polygon
}

addTestPolygines();

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