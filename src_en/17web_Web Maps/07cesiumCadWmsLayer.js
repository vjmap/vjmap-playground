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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/07cesiumCadWmsLayer
        // --Load CAD map in Cesium (WMS layer auto overlay)--
// Map service
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "sys_cadcesium";
let res = await svc.openMap({
    mapid: mapId, // Map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
    style: vjmap.openMapDarkStyle() // Dark background style
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
let layer = res.layer;// Layer style name


if (typeof Cesium !== "object") {
    // If not available
    await vjmap.addScript([{
        src: "../../js/Cesium/Cesium.js"
    }, {
        src: "../../js/Cesium/Widgets/widgets.css"
    }])
}
// Load proj4 for coordinate conversion
if (typeof proj4 !== "object") {
    // If not available
    await vjmap.addScript([{
        src: "../../js/proj4.min.js"
    }])
}

// Query params at https://epsg.io/
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
proj4.defs("EPSG:4544", "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs");

let imageryProvider= new Cesium.UrlTemplateImageryProvider({
    url: "https://t1.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=3346bb6ad29b5013c5952cf1117b80e9",
})

let viewer = new Cesium.Viewer('map', {
    imageryProvider: imageryProvider,
    contextOptions: {
        webgl: {
            alpha: true
        }
    },
    selectionIndicator: false,
    animation: false, // Show animation control
    baseLayerPicker: false, // Show layer picker
    geocoder: false, // Show geocoder
    timeline: false, // Show timeline
    sceneModePicker: false, // Show scene mode picker
    navigationHelpButton: false, // Show navigation help
    infoBox: false, // Show info box on click
    fullscreenButton: false,
    shouldAnimate: true // Animate
});


var layers = viewer.scene.imageryLayers;

// Add Gaode label layer
layers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
        url: "https://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    })
);

let cadEpsg = "EPSG:4544" ;// CAD map EPSG code
// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // Map id
    layers: layer, // Layer name
    bbox: '', // bbox not needed, Cesium adds it
    srs: "EPSG:4326", // Cesium map is WGS84
    crs: cadEpsg,
    // fourParameter: "(offsetX, offsetY, scaleK, rotateRad)"; if belt CRS and x is 6 digits, add belt prefix
})
layers.addImageryProvider(
    new Cesium.WebMapServiceImageryProvider({
        url: wmsUrl,
    })
);

// CAD to web WGS84
const cadToWebCoordinate =  point => {
    let co = proj4(cadEpsg, "EPSG:4326", point);
    return [co.x, co.y]
}
// Web WGS84 to CAD
const webTocadCoordinate =  point => {
    let co = proj4("EPSG:4326", cadEpsg, point);
    return [co.x, co.y]
}
// Compute WGS84 center from CAD map center
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let cadCenter = mapBounds.center();
let webCenter =  cadToWebCoordinate(cadCenter);

// Set initial position
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(webCenter[0], webCenter[1], 30000)
});

// Click to pick CAD map
let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(async (movement) => {
    console.log(movement.position);
    var ray = viewer.scene.camera.getPickRay(movement.position);
    var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    // let cartesian = viewer.scene.pickPosition(movement.position);
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    let longitude = Cesium.Math.toDegrees(cartographic.longitude);
    let latitude = Cesium.Math.toDegrees(cartographic.latitude);

    let cadpoint = proj4("EPSG:4326", cadEpsg, [longitude, latitude]);
    console.log(cadpoint);
    let pixelToGeoLength = getPixelGeoLength();
    console.log(pixelToGeoLength, mapId, layer);
    const res = await svc.pointQueryFeature({
        pixelToGeoLength: pixelToGeoLength,
        x: cadpoint[0],
        y: cadpoint[1],
        geom: true,
        mapid: mapId, // Map id to query
        layer: layer
    });
    console.log(res);
    if (res && res.recordCount
        > 0 && res.result.length > 0) {
        message.info(res.result[0].name + "," + res.result[0].objectid)
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

function getPixelGeoLength() {
    let scene = viewer.scene;
    // Get canvas size
    var width = scene.canvas.clientWidth;
    var height = scene.canvas.clientHeight;
    // Get two pixel coordinates at canvas center (map renders at center by default)
    var left = scene.camera.getPickRay(new Cesium.Cartesian2((width / 2) | 0, (height - 1) / 2));
    var right = scene.camera.getPickRay(new Cesium.Cartesian2(1 + (width / 2) | 0, (height - 1) / 2));

    var globe = scene.globe;
    var leftPosition = globe.pick(left, scene);
    var rightPosition = globe.pick(right, scene);
    let leftCartographic = Cesium.Cartographic.fromCartesian(leftPosition);
    let leftLng = Cesium.Math.toDegrees(leftCartographic.longitude);
    let leftLat = Cesium.Math.toDegrees(leftCartographic.latitude);
    let rightCartographic = Cesium.Cartographic.fromCartesian(rightPosition);
    let rightLng = Cesium.Math.toDegrees(rightCartographic.longitude);
    let rightLat = Cesium.Math.toDegrees(rightCartographic.latitude);
    console.log(leftLng, leftLat);
    if (!Cesium.defined(leftPosition) || !Cesium.defined(rightPosition)) {
        return;
    }

    let leftPoint = proj4("EPSG:4326", cadEpsg, [leftLng, leftLat]);
    let rightPoint = proj4("EPSG:4326", cadEpsg, [rightLng, rightLat]);
    return Math.sqrt(Math.pow(leftPoint[0] - rightPoint[0], 2) + Math.pow(leftPoint[1] - rightPoint[1], 2));
}
// To query CAD entity coordinates on map, use svc.rectQueryFeature with two CAD point bounds
// Use webTocadCoordinate to convert WGS84 to CAD coordinate for query.


// For custom CRS, use the following code:
/*
// --Load CAD map in Cesium (WMS auto overlay)--
// Map service
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "c84193cc2603";
let res = await svc.openMap({
    mapid: mapId, // Map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
    style: vjmap.openMapDarkStyle() // Dark background style
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
let layer = res.layer;// Layer style name


if (typeof Cesium !== "object") {
    // If not available
    await vjmap.addScript([{
        src: "../../js/Cesium/Cesium.js"
    }, {
        src: "../../js/Cesium/Widgets/widgets.css"
    }])
}
// Load proj4 for coordinate conversion
if (typeof proj4 !== "object") {
    // If not available
    await vjmap.addScript([{
        src: "../../js/proj4.min.js"
    }])
}
let imageryProvider = new Cesium.UrlTemplateImageryProvider({
    url: "https://t1.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=3346bb6ad29b5013c5952cf1117b80e9",
})

let viewer = new Cesium.Viewer('map', {
    imageryProvider: imageryProvider,
    contextOptions: {
        webgl: {
            alpha: true
        }
    },
    selectionIndicator: false,
    animation: false, // Show animation control
    baseLayerPicker: false, // Show layer picker
    geocoder: false, // Show geocoder
    timeline: false, // Show timeline
    sceneModePicker: false, // Show scene mode picker
    navigationHelpButton: false, // Show navigation help
    infoBox: false, // Show info box on click
    fullscreenButton: false,
    shouldAnimate: true // Animate
});


var layers = viewer.scene.imageryLayers;

// Add Gaode label layer
layers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
        url: "https://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    })
);


let epsgCode = "+proj=tmerc +lat_0=0 +lon_0=113.283333 +k=1 +x_0=39980 +y_0=-2329620 +ellps=GRS80 +units=m +no_defs"

// Custom EPSG CRS
proj4.defs("EPSG:900888", epsgCode);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // Map id
    layers: layer, // Layer name
    bbox: '', // bbox not needed, Cesium adds it
    srs: "EPSG:4326", // Cesium map is WGS84
    crs: epsgCode,
    // fourParameter: (offsetX, offsetY, scaleK, rotateRad)
})
layers.addImageryProvider(
    new Cesium.WebMapServiceImageryProvider({
        url: wmsUrl,
    })
);


// CAD to web WGS84
const cadToWebCoordinate =  point => {
    return proj4("EPSG:900888", "EPSG:4326", point);
}
// Web WGS84 to CAD
const webTocadCoordinate =  point => {
    return proj4("EPSG:4326", "EPSG:900888", point);
}
// Compute WGS84 center from CAD map center
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let cadCenter = mapBounds.center();
let webCenter = cadToWebCoordinate([cadCenter.x, cadCenter.y]);

// Set initial position
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(webCenter[0], webCenter[1], 30000)
});

// To query CAD entity coordinates on map, use svc.rectQueryFeature with two CAD point bounds
// Use webTocadCoordinate to convert WGS84 to CAD coordinate for query.

 */




// If loading CAD in Mapbox GL (CAD has geo CRS), use the following:
/*
let mapId = "sys_cadcesium";
map.once('style.load', async () => {
    let res = await svc.openMap({
        mapid: mapId, // Map ID
        mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
        style: vjmap.openMapDarkStyle() // Dark background style
    })
    if (res.error) {
        // If open failed
        message.error(res.error)
    }
    let layer = res.layer;// Layer style name

    let cadEpsg = "EPSG:4544" ;// CAD map EPSG code
    // Add CAD WMS layer
    let wmsUrl = svc.wmsTileUrl({
        mapid: mapId, // Map id
        layers: layer, // Layer name
        bbox: '', // bbox not needed
        srs: "EPSG:3857", // Mapbox GL map is WGS84
        crs: cadEpsg
    })

    wmsUrl += '&bbox={bbox-epsg-3857}'
    map.addLayer({
        'id': 'wms-layer', // Layer unique ID
        'type': 'raster', // Raster layer type
        'source': {
            'type': 'raster',
            'tiles': [wmsUrl],
            'tileSize': 256
        },
        'paint': {
            'raster-opacity': 1.0 // Layer opacity
        }
    });
})
 */

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