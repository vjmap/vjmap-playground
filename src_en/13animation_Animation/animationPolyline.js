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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationPolyline
        // --Polyline stretch animation--
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
let geoDatas = [];


for(let i = 0; i < 10; i++) {
    const path = mapBounds.randomPoints(3, 5);
    geoDatas.push({
        points: [],
        properties: {
            name: "line" + (i + 1),
            color: vjmap.randomColor(),
            type: "line",
            baseHeight: 0,
            height: vjmap.randInt(1000000, 2000000),
            path:  path, // Store path for animation
            offset: len
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

// Convert polyline to polygon
const polylineToPolygon = (path, offset) => {
    return vjmap.polylineMarginToPolygon(path, {offset: len});
}
vjmap.createAnimation({
    from: 0,
    to: 1,
    repeatType: "reverse", // Reverse on repeat
    repeat: Infinity,
    duration: 5000,
    ease:vjmap.linear, // Linear
    onUpdate: latest => {
        const data = fillExtrusions.getData();
        for(let i = 0 ; i < data.features.length; i++) {
            const value = latest;
            const prop = initData.features[i].properties;
            const path = vjmap.interpolatePointsByRatio(prop.path, value);
            if (path.length > 1) {
                const polyPath = polylineToPolygon(path, {offset: prop.offset});
                const geojson = vjmap.createPolygonGeoJson(map.toLngLat(polyPath));
                if (geojson.features[0] && geojson.features[0].geometry) {
                    data.features[i].geometry.coordinates = geojson.features[0].geometry.coordinates;
                }
            }
        }
        fillExtrusions.setData(data);
        // Add light effect
        map.setLight({
            color: '#FFE9FE',
            intensity: latest
        });
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