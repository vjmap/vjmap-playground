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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationFillExtrusionMany
        // --Extrusion animation--
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
    zoom: 2, // set map zoom level,
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
let len1 = mapBounds.width() / 100;
let len2 = mapBounds.width() / 200;
let len3 = mapBounds.width() / 300;
let geoDatas = []
for(let i = 0; i < 1000; i++) {
    const isSquare = vjmap.randInt(0, 1);
    const pts = []
    const len = vjmap.randInt(len1, len3);
    const p1 = mapBounds.randomPoint();
    const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
    const p3 = vjmap.geoPoint([p1.x + len, p1.y + len]);
    pts.push(p1, p2, p3);
    if (isSquare) {
        pts.push(vjmap.geoPoint([p1.x + len, p1.y]));
    }
    geoDatas.push({
        points: map.toLngLat(pts),
        properties: {
            name: isSquare ? "square": "triangle" + (i + 1),
            color:  vjmap.randomColor(),
            color2:  vjmap.randomColor(),
            type: isSquare ? "square": "triangle",
            baseHeight: 0,
            height: vjmap.randInt(1000000, 2000000)
        }
    })
}



let fillExtrusions = new vjmap.FillExtrusion({
    data: geoDatas,
    // If hover: red; otherwise use 'color' from properties
    fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
    fillExtrusionOpacity: 0.8,
    fillExtrusionHeight:['get', 'height'],
    fillExtrusionBase: ['get', 'baseHeight'],
    isHoverPointer: true,
    isHoverFeatureState: true
});
fillExtrusions.addTo(map);
const initData = vjmap.cloneDeep(fillExtrusions.getData());

const mapProgressToValues = idx => vjmap.interpolate(
    [0, 1],
    [
        { color: initData.features[idx].properties.color, height: 500000 },
        { color: initData.features[idx].properties.color2, height: initData.features[idx].properties.height }
    ]
)
vjmap.createAnimation({
    from: 0,
    to: 1,
    repeat: Infinity,
    duration: 2000,
    onUpdate: latest => {
        const data = fillExtrusions.getData();
        for(let i = 0 ; i < data.features.length; i++) {
            const value = mapProgressToValues(i)(latest)
            data.features[i].properties.color = value.color;
            data.features[i].properties.height = value.height;
        }
        fillExtrusions.setData(data);
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