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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/14olCadWmsLayer4326
        // --Web map 4326 with CAD overlay [web as base]-- base in EPSG:4326
if (typeof ol !== "object") {
    // If no OpenLayers environment
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}
const layers = [
    new ol.layer.Tile({
        source: new ol.source.OSM(),
    })
];
const map = new ol.Map({
    layers: layers,
    target: 'map',
    view: new ol.View({
        center: [106.166187, 29.44102],
        projection: 'EPSG:4326', // base CRS is 4326
        zoom: 15,
    }),
});

// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "sys_cadcesium";
let res = await svc.openMap({
    mapid: mapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
let layer = res.layer; // Layer style name


let cadEpsg = "EPSG:4544";// CAD EPSG code
// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // map id
    layers: layer, // layer name
    bbox: '', // bbox not needed
    srs: "EPSG:4326", // base CRS is 4326
    crs: cadEpsg
})


let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
// CAD coords to web WGS84
const cadToWebCoordinate = async point => {
    let co = await svc.cmdTransform(cadEpsg, "EPSG:4326", point);
    return co[0]
}
// CAD to WGS84 lat-lon
let boundsMin = await cadToWebCoordinate(mapBounds.min);
let boundsMax = await cadToWebCoordinate(mapBounds.max);

// Add WMS layer to OpenLayers
map.addLayer(new ol.layer.Tile({
    // Extent
    extent: [boundsMin[0], boundsMin[1], boundsMax[0], boundsMax[1]],
    source: new ol.source.TileWMS({
        url: wmsUrl,
        params: { 'TILED': true },
        tileLoadFunction: function(image, src) {
            // OpenLayers 4326 swaps BBOX xy; swap back
            let index = src.indexOf('?');
            let params = new URLSearchParams(src.slice(index));
            let bbox = params.get('BBOX').split(',');
            params.set('BBOX', [bbox[1], bbox[0], bbox[3], bbox[2]].toString());
            image.getImage().src = src.slice(0, index + 1) + params.toString();
        }
    }),
}))


// Custom CRS example:
/*
if (typeof ol !== "object") {
    // If no OpenLayers env
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}
// Load proj4 for coordinate transform
if (typeof proj4 !== "object") {
    // If no env
    await vjmap.addScript([{
        src: "../../js/proj4.min.js"
    }])
}
const layers = [
    new ol.layer.Tile({
        source: new ol.source.OSM(),
    })
];
const map = new ol.Map({
    layers: layers,
    target: 'map',
    view: new ol.View({
        center: vjmap.Projection.lngLat2Mercator([113.26797190135004, 23.306017680608843]),
        zoom: 15,
    }),
});

// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "c84193cc2603";
let res = await svc.openMap({
    mapid: mapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
let layer = res.layer; // Layer style name

let epsgCode = "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs"
// epsgCode can be PRJ WKT; convert with: await svc.cmdPrjWktToPrj4(epsgCode). Example: epsgCode = `PROJCS["CGCS2000 / 3-degree Gauss-Kruger CM 111E",GEOGCS["China Geodetic Coordinate System 2000",DATUM["China_2000",SPHEROID["CGCS2000",6378300,300,AUTHORITY["EPSG","1024"]],AUTHORITY["EPSG","1043"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.018,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4490"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",112.1],PARAMETER["scale_factor",1],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","4546"]]`
// Custom CRS
proj4.defs("EPSG:900888", epsgCode);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");

let cadEpsg = encodeURIComponent(epsgCode); // CAD EPSG code
// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // Map ID
    layers: layer, // Layer name
    bbox: '', // bbox not needed
    srs: "EPSG:3857", //
    crs: cadEpsg
})


let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
// CAD coords to web WGS84
const cadToWebCoordinate = async point => {
    let co = proj4("EPSG:900888", "EPSG:4326", point);
    console.log(co)
    return co
}
// CAD to WGS84 lat-lon
let boundsMin = await cadToWebCoordinate(mapBounds.min);
let boundsMax = await cadToWebCoordinate(mapBounds.max);
// WGS84 to Mercator
boundsMin = vjmap.Projection.lngLat2Mercator(boundsMin);
boundsMax = vjmap.Projection.lngLat2Mercator(boundsMax);

// Add WMS layer to OpenLayers
map.addLayer(new ol.layer.Tile({
    // Extent
    extent: [boundsMin[0], boundsMin[1], boundsMax[0], boundsMax[1]],
    source: new ol.source.TileWMS({
        url: wmsUrl,
        params: {'TILED': true}
    }),
}))
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