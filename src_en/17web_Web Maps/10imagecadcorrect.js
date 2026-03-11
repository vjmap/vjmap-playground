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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/10imagecadcorrect
        // --Calibrate map by reference image-- Image as background, auto-calibrate CAD by control points
message.info("Please adjust control points on the two maps to calibrate. Image is large, loading may be slow, please wait...")
// This demo shows image loading; in production upload image to generate tile map for faster load. See https://vjmap.com/demo/#/demo/map/comprehensive/04imagecadmap
// Set base image pixel size and geo extent
const imagePixelSize = [11081, 8645]; // Base image pixel size
const imageBounds = [
    [1000, 3000],
    [4000, 659.51]
]; // Top-left and bottom-right
if (!vjmap.isZero(
    (imageBounds[1][0] - imageBounds[0][0]) / (imageBounds[0][1] - imageBounds[1][1]) -
    imagePixelSize[0] / imagePixelSize[1], 0.01)
) {
    // message.error("Extent aspect ratio does not match pixel size");
    // return;
    imageBounds[1][1] = imageBounds[0][1] - (imageBounds[1][0] - imageBounds[0][0])  * imagePixelSize[1] / imagePixelSize[0]
}
const imageExtent =vjmap.GeoBounds.fromDataExtent(imageBounds); // Image extent
const correctMapId = 'correctdwg'; // Map id to correct

// Create same-size divs under id"map” for new map container id
const createNewMapDivIds = ()=> {
    // Clear previous first
    let parentDiv = document.getElementById("map");
    parentDiv.style.display = "flex";
    parentDiv.style.flexDirection = "column";

    let newMapDiv1 = document.createElement("div");
    newMapDiv1.id = vjmap.RandomID(6);
    newMapDiv1.style.flex = "1";
    parentDiv.appendChild(newMapDiv1);

    let newMapDiv2 = document.createElement("div");
    newMapDiv2.id = vjmap.RandomID(6);
    newMapDiv2.style.flex = "1";
    newMapDiv2.style.backgroundColor = '#022B4F'
    parentDiv.appendChild(newMapDiv2);

    parentDiv = document.getElementById( newMapDiv1.id);
    parentDiv.style.display = "flex";
    parentDiv.style.justifyContent = "space-between"
    let newMapDiv3 = document.createElement("div");
    newMapDiv3.id = vjmap.RandomID(6);
    newMapDiv3.style.flex = "1";
    newMapDiv3.style.backgroundColor = '#125558'
    parentDiv.appendChild(newMapDiv3);

    let newMapDiv4 = document.createElement("div");
    newMapDiv4.id = vjmap.RandomID(6);
    newMapDiv4.style.flex = "1";
    newMapDiv4.style.backgroundColor = '#271258'
    parentDiv.appendChild(newMapDiv4);
    return [newMapDiv3.id, newMapDiv4.id, newMapDiv2.id];
}

const createImageBackgroundMap = async (mapContainerId) => {
    let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
    svc.setCurrentMapParam({
        darkMode: true // Set dark mode when no map opened yet
    })
    let mapExtent = imageExtent.square().scale(3);// Square extent and scale so image can be zoomed out
// Create projection
    let prj = new vjmap.GeoProjection(mapExtent);

// New map object
    let map = new vjmap.Map({
        container: mapContainerId, // container ID
        style: {
            version: svc.styleVersion(),
            glyphs: svc.glyphsUrl(),
            sources: {},
            layers: []
        },
        center: [0,0], // Center
        zoom: 1,
        renderWorldCopies: false
    });
// Attach service and projection
    map.attach(svc, prj);
    await map.onLoad();

    // Get current map extent
    const coords = map.toLngLat(imageExtent.toPointArray());
    map.addImageSource("pic", {
        url: env.assetsPath + "images/correctdwg.jpg",
        coordinates: coords
    })
    map.addRasterLayer("picLayer", "pic", {
        rasterOpacity: 1.0
    })
    let mousePositionControl = new vjmap.MousePositionControl();
    map.addControl(mousePositionControl, "bottom-left");
    return map;
}

const createCadMap = async (mapContainerId) => {
    let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
    let res = await svc.openMap({
        mapid: correctMapId, // Map ID (ensure exists or upload new)
        mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
        style: vjmap.openMapDarkStyle() // Dark background style
    })
    if (res.error) {
        message.error(res.error)
    }
    // Get map extent
    let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
    // Create projection
    let prj = new vjmap.GeoProjection(mapExtent);

    // New map object
    let map = new vjmap.Map({
        container: mapContainerId, // container ID
        style: svc.rasterStyle(), // Raster tile style
        center: prj.toLngLat(mapExtent.center()), // Center
        zoom: 2,
        renderWorldCopies: false
    });
    // Attach service and projection
    map.attach(svc, prj);
    // Fit map to full extent
    map.fitMapBounds();
    await map.onLoad();
    let mousePositionControl = new vjmap.MousePositionControl();
    map.addControl(mousePositionControl, "bottom-left");
    return map;
}
const divIds = createNewMapDivIds();
const mapImage = await createImageBackgroundMap(divIds[0]);
const mapCad = await createCadMap(divIds[1]);
const mapMerge = await createImageBackgroundMap(divIds[2]);
const draw = new vjmap.Draw.Tool();
mapMerge.addControl(draw, 'top-right');

// Two control points on image, default top-left and bottom-right
let imagePublicPoint = [
    vjmap.geoPoint([imageExtent.min.x, imageExtent.max.y]),
    vjmap.geoPoint([imageExtent.max.x, imageExtent.min.y])
];
const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
for(let k = 0; k < imagePublicPoint.length; k++) {
    let marker = new vjmap.Marker({
        color: colors[k % (colors.length - 1)],
        draggable: true
    });
    marker.setLngLat(mapImage.toLngLat(imagePublicPoint[k]));
    marker.addTo(mapImage);
    marker.on('drag', e => {
        // Update coordinate on drag
        imagePublicPoint[k] = mapImage.fromLngLat(marker.getLngLat());
        updateMergeMapDebounce();
    });
}

// Two control points on CAD map, default top-left and bottom-right
let cadBounds = mapCad.getGeoBounds(0.3);
let cadPublicPoint = [
    vjmap.geoPoint([cadBounds.min.x, cadBounds.max.y]),
    vjmap.geoPoint([cadBounds.max.x, cadBounds.min.y])
];
for(let k = 0; k < cadPublicPoint.length; k++) {
    let marker = new vjmap.Marker({
        color: colors[k % (colors.length - 1)],
        draggable: true
    });
    marker.setLngLat(mapCad.toLngLat(cadPublicPoint[k]));
    marker.addTo(mapCad);
    marker.on('drag', e => {
        // Update coordinate on drag
        cadPublicPoint[k] = mapCad.fromLngLat(marker.getLngLat());
        updateMergeMapDebounce();
    });
}
// Compose map from control points
const updateMergeMap = () => {
    // Four-param then WMS to overlay CAD
    let fourparam = vjmap.coordTransfromGetFourParamter(imagePublicPoint, cadPublicPoint, true);
    let mapParam = mapCad.getService().currentMapParam();
    addWmsLayer(mapMerge, mapParam.mapid, mapParam.layer, fourparam, mapMerge.getGeoBounds(1.0));
}

const addWmsLayer = async (map, mapid, layer, fourparam, mapFullbounds) => {
    let fourParameter = [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate];
    map.removeSourceEx('wms-maps-source' + mapid)
    let wmsurl = mapCad.getService().wmsTileUrl({
        mapid: mapid,
        layers: layer,
        fourParameter: fourParameter,
        mapbounds: mapFullbounds // Full extent
    })

    map.addSource('wms-maps-source' + mapid, {
        'type': 'raster',
        'tiles': [
            wmsurl
        ],
        'tileSize': 256
    });
    map.addLayer({
        'id': 'wms-maps-layer' + mapid,
        'type': 'raster',
        'source': 'wms-maps-source' + mapid,
        'paint': {"raster-opacity": 1}
    });

    map.removeMarkers();
    // Show control points
    for(let k = 0; k < imagePublicPoint.length; k++) {
        // Point on image
        let markerImage = new vjmap.Marker({
            color: colors[k % (colors.length - 1)]
        });
        markerImage.setLngLat(map.toLngLat(imagePublicPoint[k]));
        markerImage.addTo(map);
    }

    // CAD points inverse four-param to overlay
    for(let k = 0; k < cadPublicPoint.length; k++) {
        let newPoint = vjmap.coordTransfromByInvFourParamter(cadPublicPoint[k], fourparam);
        // Point on image
        let markerCad = new vjmap.Marker({
            color: colors[k % (colors.length - 1)],
        });
        markerCad.setLngLat(map.toLngLat(newPoint));
        markerCad.addTo(map);
        markerCad.getElement().style.opacity = '0.7';
    }
}
let tmId;
const updateMergeMapDebounce = (value) => {
    if (tmId) clearTimeout(tmId);
    tmId = setTimeout(() => {
        // Throttle
        updateMergeMap();
    }, 1000)
};

updateMergeMapDebounce();

// Notes:
// (1) Multiple CAD maps can be overlaid; image extent as CRS (this example uses one CAD; same for multiple)
// (2) After overlay, use four-param to calibrate CAD and export new DWG (not in this example; use composeNewMap with mapid and four-param)

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