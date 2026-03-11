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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerFillStyleExtension
        // --Deck fill pattern layer--
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
    zoom: 3, // set map zoom level
    pitch: 0, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();

// Limit map bounds to full extent to prevent multi-world display
map.setMaxBounds(map.toLngLat(prj.getMapExtent()));

const mapBounds = map.getGeoBounds(0.6);

// Add deck library
if (typeof deck !== "object") {
    // If no deck environment
    await vjmap.addScript([{
        src: "../../js/deck.gl.min.js"
    }]);

}

let len = mapBounds.width() / 50;
let polygons = []
for(let i = 0; i < 200; i++) {
    const p1 = mapBounds.randomPoint();
    const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
    const p3 = vjmap.geoPoint([p1.x + len, p1.y + len]);
    const p4 = vjmap.geoPoint([p1.x + len, p1.y]);
    polygons.push({
        // Part triangles, part quadrilaterals
        points: map.toLngLat(i % 5 ===  0 ? [p1, p2, p4] : [p1, p2, p3, p4]),
        properties: {
            name: "polygon" + (i + 1),
            color: vjmap.randomColor()
        }
    })
}


const patterns = ['dots', 'hatch-1x', 'hatch-2x', 'hatch-cross'];
const deckLayer = new vjmap.DeckLayer({
    id: 'deck',
    type: deck.GeoJsonLayer,
    data: vjmap.createPolygonGeoJson(polygons),

    stroked: true,
    filled: true,
    lineWidthMinPixels: 2,
    getLineColor: [60, 60, 60],
    getFillColor: [60, 180, 240],

    // props added by FillStyleExtension
    fillPatternMask: true,
    fillPatternAtlas: env.assetsPath + 'data/pattern.png',
    fillPatternMapping: env.assetsPath + 'data/pattern.json',
    getFillPattern: (f, {index}) => patterns[index % 4],
    getFillPatternScale: 500,
    getFillPatternOffset: [0, 0],

    // Define extensions
    extensions: [new deck.FillStyleExtension({pattern: true})]
});
map.addLayer(deckLayer);
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