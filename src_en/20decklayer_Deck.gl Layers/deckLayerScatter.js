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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerScatter
        // --Deck scatter plot layer--
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
    pitch: 0, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();

const mapBounds = map.getGeoBounds(0.6);
let len = mapBounds.width() / 100;

// Add deck library
if (typeof deck !== "object") {
    // If no deck environment
    await vjmap.addScript({
        src: "../../js/deck.gl.min.js"
    })
}
// Generate random data
const data = [];
for(let i = 0; i < 100; i++) {
    data.push({
        id: i + 1,
        position: map.toLngLat(mapBounds.randomPoint()),
        radius: vjmap.randInt(prj.toMeter(len / 2), prj.toMeter(len)),
        color: [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)]
    })
}

const popup = new vjmap.Popup({ closeButton: false });
// Add deck layer
const deckLayer = new vjmap.DeckLayer({
    id: 'my-scatterplot',
    type: deck.ScatterplotLayer,
    data: data,
    wrapLongitude: false,
    getPosition: d => d.position,
    getRadius: d => d.radius,
    getFillColor: d => d.color,
    radiusUnits: "meters", // pixels
    autoHighlight: true,
    highlightColor: [255, 0, 0],
    pickable: true,
    onHover: ({object}) => {
        if (object) {
            popup.setLngLat(object.position);
            popup.setHTML(`id: ${object.id}`);
            popup.addTo(map);
        } else {
            popup.remove();
        }
    },
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