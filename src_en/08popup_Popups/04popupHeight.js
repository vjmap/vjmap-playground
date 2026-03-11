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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/popup/04popupHeight
        // --Popup with height--
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
    style: svc.rasterStyle(), //svc.rasterBlankStyle(0, 24), // style, raster style here
    center: prj.toLngLat(prj.getMapExtent().center()), // set map center
    zoom: 2, // set map zoom level
    pitch: 60,
    renderWorldCopies: false // do not show multi-world copies
});


// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
map.fitMapBounds();

await map.onLoad();
const mapBounds = map.getGeoBounds(0.4);
let geoDatas = [];
let len1 = mapBounds.width() / 50;
for (let i = 0; i < 10; i++) {
    const pts = []
    const len = len1;
    const p1 = mapBounds.randomPoint();
    const p2 = vjmap.geoPoint([p1.x - len, p1.y - len]);
    const p3 = vjmap.geoPoint([p1.x - len, p1.y + len]);
    const p4 = vjmap.geoPoint([p1.x + len, p1.y + len]);
    const p5 = vjmap.geoPoint([p1.x + len, p1.y - len]);
    pts.push(p2, p3, p4, p5);

    let height = map.pixelToHeight(vjmap.randInt(100, 150), 2) ;// 100-150 pixels at zoom level 2
    geoDatas.push({
        points: map.toLngLat(pts),
        properties: {
            name:  "square" ,
            color: vjmap.randomColor(),
            baseHeight: 0,
            height: height
        }
    })

    const popup = new vjmap.Popup({ closeOnClick: false, closeButton: true, anchor: "bottom" });
    popup.setHTML(`I am number ${i + 1}!`)
        .setLngLat(map.toLngLat(p1))
        .setHeight(height) // set height value
        .addTo(map);
}


let fillExtrusions = new vjmap.FillExtrusion({
    data: geoDatas,
    fillExtrusionColor: ['get', 'color'],
    fillExtrusionOpacity: 0.7,
    fillExtrusionHeight: ['get', 'height'],
    fillExtrusionBase: ['get', 'baseHeight']
});
fillExtrusions.addTo(map);

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