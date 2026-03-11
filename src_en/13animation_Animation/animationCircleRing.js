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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationCircleRing
        // --Animated circle ring--
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
//map.fitMapBounds();
await map.onLoad();

const mapBounds = map.getGeoBounds(0.6);
let len1 = mapBounds.width() / 10;
let len2 = mapBounds.width() / 50;
let len = mapBounds.width() / 100;
let geoDatas = [];

// Compute circle arc path
const calcCircleRingPath = (center, radiusOut, radiusIn, startAngle, endAngle) => {
    const cirleArcPathOut = vjmap.getCirclePolygonCoordinates(center, radiusOut, 36, startAngle, endAngle, false);
    const cirleArcPathInner = vjmap.getCirclePolygonCoordinates(center, radiusIn, 36, startAngle, endAngle, false);
    // Connect outer and inner arcs, close polygon
    return [...cirleArcPathOut, ...cirleArcPathInner.reverse(), cirleArcPathOut[0]];
}
for(let i = 0; i < 10; i++) {
    const c = mapBounds.randomPoint();
    const radius = vjmap.randInt(len1, len2);
    let startAngle = vjmap.randInt(0, 360);
    let endAngle = vjmap.randInt(0, 360);
    const circleRingPath  = calcCircleRingPath(c, radius, radius - len, startAngle, endAngle);
    geoDatas.push({
        points: map.toLngLat(circleRingPath),
        properties: {
            name: "circle" + (i + 1),
            color: vjmap.randomColor(),
            color2: vjmap.randomColor(),
            type: "circle",
            center: c,
            radiusOut: radius,
            radiusIn: radius - len,
            startAngle,
            endAngle
        }
    })
}

let circleRings = new vjmap.Polygon({
    data: geoDatas,
    // Red when hover, otherwise use 'color' from properties
    fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
    fillOpacity: 0.8,
    fillOutlineColor: "#f00",
    isHoverPointer: true,
    isHoverFeatureState: true
});
circleRings.addTo(map);

const initData = vjmap.cloneDeep(circleRings.getData());

// Interpolation for three keyframes
const mapProgressToValues = idx => vjmap.interpolate(
    [0, 0.5, 1],
    [
        { color: initData.features[idx].properties.color, angle: 0 },
        { color: initData.features[idx].properties.color2, angle: 180 },
        { color: initData.features[idx].properties.color, angle: 360 }
    ], {
        ease: vjmap.linear
    }
)
vjmap.createAnimation({
    from: 0,
    to: 1,
    repeat: Infinity,
    duration: 2000,
    ease:vjmap.linear, // Linear
    onUpdate: latest => {
        const data = circleRings.getData();
        for(let i = 0 ; i < data.features.length; i++) {
            const value = mapProgressToValues(i)(latest)
            const prop = initData.features[i].properties;
            const angle = value.angle;
            const startAngle = (prop.startAngle + angle);
            const endAngle = (prop.endAngle + angle);
            const circleRingPath  = map.toLngLat(calcCircleRingPath(prop.center, prop.radiusOut, prop.radiusIn, startAngle, endAngle));
            data.features[i].properties.color = value.color;
            const geojson = vjmap.createPolygonGeoJson(circleRingPath);
            data.features[i].geometry.coordinates = geojson.features[0].geometry.coordinates;
        }
        circleRings.setData(data);
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