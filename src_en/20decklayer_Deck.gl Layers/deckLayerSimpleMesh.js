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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerSimpleMesh
        // --Deck model layer--
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
    pitch: 60, // pitch angle
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
await vjmap.addScript([{
    src: "../../js/deck.gl.min.js"
},{
    src: "../../js/loaders.gl/core/dist/dist.min.js"
},{
    src: "../../js/loaders.gl/obj/dist/dist.min.js"
}]);
// Register loaders
loaders.registerLoaders([loaders.OBJLoader]);

const data = [];
for(let i = 0; i < 100; i++) {
    data.push({
        id: i + 1,
        position: map.toLngLat(mapBounds.randomPoint()),
        color: [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)],
        angle: vjmap.randInt(0, 360)
    })
}

const popup = new vjmap.Popup({ closeButton: false });

const deckLayer = new vjmap.DeckLayer({
    id: 'my-scatterplot',
    type: deck.SimpleMeshLayer,
    data: data,
    getPosition: d => d.position,
    mesh: env.assetsPath + "data/Bulbasaur.obj",
    getColor: d => d.color,
    getOrientation: d => [0, d.angle, 90],
    sizeScale: 40000,
    autoHighlight: true,
    pickable: true,
    onClick: ({object}) => {
        message.info(`You clicked object ${object.id} in Deck layer`)
    }
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