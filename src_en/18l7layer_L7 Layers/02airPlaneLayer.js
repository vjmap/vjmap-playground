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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/l7layer/02airPlaneLayer
        // --Flight line animation--
// JS code
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
// Full map display at zoom 8
let initZoom = 8;
let style = {
    backcolor: 0, // use dark style when div has dark background
    clipbounds: Math.pow(2, initZoom) // Value only = zoom factor for bounds
}
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID (ensure exists or upload new)
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: style // use dark style when div has dark background
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
    zoom: initZoom + 1,
    pitch: 60,
    minZoom: initZoom - 3,// Optional min zoom
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

let mapBounds = vjmap.GeoBounds.fromString(res.mapBounds); // Actual map bounds
mapBounds = mapBounds.scale(0.4);

// Add L7 library, see https://l7.antv.vision
if (typeof L7 !== "object") {
    // If no deck environment
    await vjmap.addScript({
        src: "../../js/l7.js"
    });

}

let lngLat1 = map.toLngLat(mapBounds.min);
let lngLat2= map.toLngLat([mapBounds.min.x, mapBounds.max.y]);
let lngLat3 = map.toLngLat(mapBounds.max);
let lngLat4 = map.toLngLat([mapBounds.max.x, mapBounds.min.y]);

const airPorts = [
    {
        name: 'Location 1',
        lng: lngLat1[0],
        lat: lngLat1[1]
    },
    {
        name: 'Location 2',
        lng: lngLat2[0],
        lat: lngLat2[1]
    },
    {
        name: 'Location 3',
        lng: lngLat3[0],
        lat: lngLat3[1]
    },
    {
        name: 'Location 4',
        lng: lngLat4[0],
        lat: lngLat4[1]
    }
];
const center = map.toLngLat(mapBounds.center())
const planeTarget = {
    lng2: center[0],
    lat2: center[1]
};
const airLineData = [
    {
        name: 'Location 1',
        lng: lngLat1[0],
        lat: lngLat1[1],
        ...planeTarget
    },
    {
        name: 'Location 2',
        lng: lngLat2[0],
        lat: lngLat2[1],
        ...planeTarget
    },
    {
        name: 'Location 3',
        lng: lngLat3[0],
        lat: lngLat3[1],
        ...planeTarget
    },
    {
        name: 'Location 4',
        lng: lngLat4[0],
        lat: lngLat4[1],
        ...planeTarget
    }
];

// Create L7 scene
const scene = new vjmap.Scene(L7, map);

scene.addImage(
    'plane',
    'https://gw.alipayobjects.com/zos/bmw-prod/96327aa6-7fc5-4b5b-b1d8-65771e05afd8.svg'
);
const airPrtsLayer = new L7.PointLayer()
    .source(airPorts, {
        parser: {
            type: 'json',
            x: 'lng',
            y: 'lat'
        }
    })
    .shape('name', 'text')
    .color('#00F8F9')
    .size(10);

const airLineLayer = new L7.LineLayer({ blend: 'normal' })
    .source(airLineData, {
        parser: {
            type: 'json',
            x: 'lng',
            y: 'lat',
            x1: 'lng2',
            y1: 'lat2'
        }
    })
    .shape('arc3d')
    .size(3)
    .color('#f00')
    .style({
        sourceColor: '#00F8F9',
        targetColor: 'rgba(0,248,249,0.1)'
    });

const airPlaneLayer = new L7.LineLayer({ blend: 'normal', zIndex: 1 })
    .source(airLineData, {
        parser: {
            type: 'json',
            x: 'lng2',
            y: 'lat2',
            x1: 'lng',
            y1: 'lat'
        }
    })
    .shape('arc3d')
    .texture('plane')
    .size(60)
    .color('#f00')
    .animate({
        duration: 0.2,
        interval: 0.2,
        trailLength: 0.2
    })
    .style({
        textureBlend: 'replace',
        lineTexture: true, // Enable line texture
        iconStep: 6 // Texture spacing
    });


const dotPoint = new L7.PointLayer({ bland: 'additive' })
    .source(airPorts, {
        parser: {
            type: 'json',
            x: 'lng',
            y: 'lat'
        }
    })
    .shape('circle')
    .color('#00F8F9')
    .animate(true)
    .size(80)
    .style({
        opacity: 1.0
    });

scene.on('loaded', () => {
    scene.addLayer(dotPoint);
    scene.addLayer(airPrtsLayer);
    scene.addLayer(airLineLayer);
    scene.addLayer(airPlaneLayer);
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