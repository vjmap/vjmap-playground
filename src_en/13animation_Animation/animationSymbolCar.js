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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationSymbolCar
        // --Icon path animation--
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
    pitch: 60, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();
map.setRasterOpacity(svc.rasterLayerId(), 0.3);

const mapBounds = map.getGeoBounds(0.6);
let len = mapBounds.width() / 200;
let geoLineDatas = [];
let geoPointDatas = [];

for(let i = 0; i < 10; i++) {
    const path = mapBounds.randomPoints(2, 4);
    // Line
    geoLineDatas.push({
        points: map.toLngLat(path),
        properties: {
            name: "line" + (i + 1),
            color: vjmap.randomColor(),
            type: "line"
        }
    })

    // Point
    // Get angle
    const angle = vjmap.geoPoint(path[1]).angleTo(vjmap.geoPoint(path[0]));
    geoPointDatas.push({
        point: map.toLngLat(path[0]),
        properties: {
            name:  `ID:${i + 1}`,
            bearing: vjmap.radToDeg(-angle),
            path: path
        }
    });
}

let polylines = new vjmap.Polyline({
    data: geoLineDatas,
    // Red when hover, otherwise use 'color' from properties
    lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
    lineWidth: 20,
    lineOpacity: 0.4,
    isHoverPointer: true,
    isHoverFeatureState: true
});
polylines.addTo(map);

// Icon
await map.loadImageEx("car", env.assetsPath + "images/car.png");
const symbols = new vjmap.Symbol({
    data: geoPointDatas,
    iconImage: "car",
    iconRotate: ['get', 'bearing'],
    iconAllowOverlap: true,
    iconRotationAlignment: 'map'
});

symbols.addTo(map);

const initData = vjmap.cloneDeep(symbols.getData());
let lastValue = 0;
vjmap.createAnimation({
    from: 0,
    to: 1,
    repeatType: "reverse",// Reverse on repeat
    repeat: Infinity,
    duration: 5000,
    ease:vjmap.linear, // Linear
    onUpdate: latest => {
        // Check if animation reversed, update car direction
        let isReverse = lastValue > latest;
        lastValue = latest;
        const data = symbols.getData();
        for(let i = 0 ; i < data.features.length; i++) {
            const value = latest;
            const prop = initData.features[i].properties;
            const path = vjmap.interpolatePointsByRatio(prop.path, value);
            if (path.length > 1) {
                let start = path[path.length - 2];
                let end = path[path.length - 1];
                let angle = 0;
                if (isReverse) {
                    angle = vjmap.geoPoint(start).angleTo(vjmap.geoPoint(end));
                } else {
                    angle = vjmap.geoPoint(end).angleTo(vjmap.geoPoint(start));
                }
                // Update direction
                data.features[i].properties.bearing = vjmap.radToDeg(-angle);

                // Update coordinates
                const geojson = vjmap.createPointGeoJson(map.toLngLat(end));
                if (geojson.features[0] && geojson.features[0].geometry) {
                    data.features[i].geometry.coordinates = geojson.features[0].geometry.coordinates;
                }
            }
        }
        symbols.setData(data);
    }
})

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