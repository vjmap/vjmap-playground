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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/l7layer/01wavebarLayer
        // --Light column and path animation--
// JS code
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID (ensure exists or upload new)
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    message.error(res.error)
}
// Get map bounds
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
// Create projection
let prj = new vjmap.GeoProjection(mapExtent);

// Create map object
let map = new vjmap.Map({
    container: 'map', // container ID
    style: svc.rasterStyle(), // Raster tile style
    center: prj.toLngLat(mapExtent.center()), // Center
    zoom: 2,
    pitch: 60,
    //minZoom: initZoom - 3,// Optional min zoom
    renderWorldCopies: false
});
// Attach service and projection
map.attach(svc, prj);
map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
// Click to highlight
map.enableLayerClickHighlight(svc, e => {
    if (!e) return;
    let msg = {
        content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
        key: "layerclick",
        duration: 5
    }
    e && message.info(msg);
})

let mousePositionControl = new vjmap.MousePositionControl({
    showZoom: true,
    showLatLng: true
});
map.addControl(mousePositionControl, "bottom-left");

await map.onLoad();
map.setRasterOpacity(svc.rasterLayerId(), 0.3);

let c = map.getCenter()

// Add L7 library, see https://l7.antv.vision
if (typeof L7 !== "object") {
    // If no deck environment
    await vjmap.addScript({
        src: "../../js/l7.js"
    });

}
// Create L7 scene
const scene = new vjmap.Scene(L7, map);

const waveLayer = new L7.PointLayer({ zIndex: 2, blend: 'additive' })
    .source(
        [
            { lng: 0, lat: 0, size: 10000 },
        ],
        {
            parser: {
                type: 'json',
                x: 'lng',
                y: 'lat'
            }
        }
    )
    .shape('circle')
    .color('#00F8F9')
    .size('size', v => v / 100.0)
    .animate(true)
    .style({
    });

const barLayer = new L7.PointLayer({ zIndex: 2, depth: false })
    .source(
        [
            { lng: 0, lat: 0, size: 10000 },
        ],
        {
            parser: {
                type: 'json',
                x: 'lng',
                y: 'lat'
            }
        }
    )
    .shape('cylinder')
    .color('#00F8F9')
    .size('size', v => [ 5, 5, v / 100 ])
    .active({
        color: 'red',
        mix: 0.0,
    })
    .animate(true)
    .style({
        opacityLinear: {
            enable: true, // true - false
            dir: 'up' // up - down
        },
        lightEnable: false
    });

scene.addImage(
    'arrow',
    'https://gw.alipayobjects.com/zos/bmw-prod/ce83fc30-701f-415b-9750-4b146f4b3dd6.svg'
);

let data = {
    "type": "FeatureCollection",
    "name": "dl2",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    "features": [
        { "type": "Feature", "properties": { }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ -50, -30 ], [ 0, 0], [ 20, 40 ] ] ] } },
    ]}
const layer = new L7.LineLayer({})
    .source(data)
    .size(10)
    .shape('line')
    .texture('arrow')
    .active(true)
    .color('#00F8F9')
    .animate({
        interval: 1, // Interval
        duration: 1, // Duration, delay
        trailLength: 2 // Trail length
    })
    .style({
        opacity: 0.6,
        lineTexture: true, // Enable line texture
        iconStep: 10, // Texture spacing
        borderWidth: 0.4, // Default 0, max 0.5
        borderColor: '#fff' // Default #ccc
    });

layer.on('click', (e) => {
    console.log('click', e);
});

scene.on('loaded', () => {
    scene.addLayer(waveLayer);
    scene.addLayer(barLayer);
    scene.addLayer(layer);
});

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