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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/14olCadWmsLayer
        // --Web map 3857 with CAD overlay [web as base]-- base in EPSG:3857
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
        center: vjmap.Projection.lngLat2Mercator([106.166187,  29.44102]),
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
let layer = res.layer;// layer name


let cadEpsg = "EPSG:4544";// CAD EPSG code
// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // map id
    layers: layer, // layer name
    bbox: '', // bbox not needed
    srs: "EPSG:3857", //
    crs: cadEpsg
})


let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
// CAD to web WGS84 coords
const cadToWebCoordinate = async point => {
    let co = await svc.cmdTransform(cadEpsg, "EPSG:4326", point);
    return co[0]
}
// CAD to WGS84 lnglat
let boundsMin = await cadToWebCoordinate(mapBounds.min);
let boundsMax = await cadToWebCoordinate(mapBounds.max);
// WGS84 lnglat to Mercator
boundsMin = vjmap.Projection.lngLat2Mercator(boundsMin);
boundsMax = vjmap.Projection.lngLat2Mercator(boundsMax);

// Add WMS layer to map
map.addLayer(new ol.layer.Tile({
    // extent
    extent: [boundsMin[0], boundsMin[1], boundsMax[0], boundsMax[1]],
    source: new ol.source.TileWMS({
        url: wmsUrl,
        params: {'TILED': true}
    }),
}))

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