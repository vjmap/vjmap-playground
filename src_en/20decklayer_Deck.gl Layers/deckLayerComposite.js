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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerComposite
        // --Composite layer (vjmap polygon + deck layer overlay)--
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
{
    // Add vjmap polygon layer
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


    let polygon = new vjmap.Polygon({
        data: polygons,
        // If hover, use red; otherwise use 'color' from properties
        fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
        fillOpacity: 0.8,
        fillOutlineColor: "#f00",
        isHoverPointer: true,
        isHoverFeatureState: true
    });
    polygon.addTo(map);
    polygon.clickLayer(e => message.info(`You clicked polygon ${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}`))
    polygon.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });

}
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
// Add deck layer
const popup = new vjmap.Popup({ closeButton: false })
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