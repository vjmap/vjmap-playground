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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerTrips
        // --Deck trips/path flow layer--
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
map.setRasterOpacity(svc.rasterLayerId(), 0.3);
// Limit map bounds to full extent to prevent multi-world display
map.setMaxBounds(map.toLngLat(prj.getMapExtent()));

const mapBounds = map.getGeoBounds(0.6);

// Add deck library
if (typeof deck !== "object") {
    // If no deck environment
    await vjmap.addScript({
        src: "../../js/deck.gl.min.js"
    });

}
let geoDatas = []
const data = [];
const now = Date.now();
for(let i = 0; i < 20; i++) {
    const points = map.toLngLat(mapBounds.randomPoints(3, 3));
    const color = [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)];
    data.push({
        id: i + 1,
        color,
        "waypoints": [
            {
                "coordinates": points[0],
                "timestamp": now
            },
            {
                "coordinates": points[1],
                "timestamp": now + 1000
            },
            {
                "coordinates": points[2],
                "timestamp": now + 2000
            }
        ]
    })
    geoDatas.push({
        points: points,
        properties: {
            color
        }
    });
};

// Create line layer
let lines = new vjmap.Polyline({
    data: geoDatas,
    lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
    lineWidth: 10,
    lineOpacity: 0.1,
    isHoverPointer: true,
    isHoverFeatureState: true
});
lines.addTo(map);

// Create trips layer
const deckLayer = new vjmap.DeckLayer({
    id: 'deck',
    type: deck.TripsLayer,
    data,
    getPath: d => d.waypoints.map(p => p.coordinates),
    // deduct start timestamp from each data point to avoid overflow
    getTimestamps: d => d.waypoints.map(p => p.timestamp -now),
    getColor: d => d.color,
    opacity: 0.8,
    widthMinPixels: 5,
    rounded: true,
    fadeTrail: true,
    trailLength: 200,
    currentTime: 0,
    pickable: true,
    autoHighlight: true,
    onClick: ({object}) => {
        message.info(`You clicked object ${object.id} in Deck layer`)
    }
});
map.addLayer(deckLayer);


// Create animation
vjmap.createAnimation({
    from: 0,
    to: 2000, // Total time
    repeat: Infinity,
    duration: 4000,
    ease:vjmap.linear, // Linear
    onUpdate: latest => {
        // Update current time property
        deckLayer.setProps({currentTime: latest})
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