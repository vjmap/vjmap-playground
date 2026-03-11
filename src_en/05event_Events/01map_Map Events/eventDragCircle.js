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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/map/eventDragCircle
        // --A draggable circle symbol--
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle()
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
    center: prj.toLngLat(mapExtent.center()),
    zoom: 1,
    pitch: 60,
    antialias: true,
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();

const geojson = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [0, 0]
            }
        }
    ]
};

const onMove = (e) => {
    const coords = e.lngLat;
    map.getCanvas().style.cursor  = 'grabbing';
    geojson.features[0].geometry.coordinates = [coords.lng, coords.lat];
    map.setData("point", geojson);
}

const onUp = (e) => {
    const coords = map.fromLngLat(e.lngLat);

    let msg = {
        content: `${coords.x}, ${coords.y}`,
        key: "message",
        duration: 5
    }
    message.info(msg);

    map.getCanvas().style.cursor  = '';

    // Unbind events
    map.off('mousemove', onMove);
    map.off('touchmove', onMove);
}

map.addGeoJSONSource("point", geojson);
map.addCircleLayer("circle", "point", {
    circleRadius: 20,
    circleColor: '#ffff00'
})


map.on('mouseenter', 'circle', () => {
    map.setCircleColor("circle", '#ff00ff');
    map.getCanvas().style.cursor  = 'move';
});

map.on('mouseleave', 'circle', () => {
    map.setCircleColor("circle", '#ffff00');
    map.getCanvas().style.cursor  = '';
});

map.on('mousedown', 'circle', (e) => {
    e.preventDefault();
    map.getCanvas().style.cursor  = 'grab';
    map.on('mousemove', onMove);
    map.once('mouseup', onUp);
});

map.on('touchstart', 'circle', (e) => {
    if (e.points.length !== 1) return;
    e.preventDefault();
    map.on('touchmove', onMove);
    map.once('touchend', onUp);
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