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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/09olcomposemap
        // --Compose CAD maps--merge multiple CAD maps with layer/clip/rotate/scale

// OpenLayers: https://openlayers.org/ | https://github.com/openlayers/openlayers
if (typeof ol !== "object") {
    // If no OpenLayers environment
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)

// Compose new map from sys_world (processed) + sys_hello
let rsp = await svc.composeNewMap([
    {
        mapid: "sys_world", // map id
        // params for layer, extent, transform
        layers: ["经纬度标注","COUNTRY"], // Lat/lon labels layer; layers to show
        //clipbounds: [10201.981489534268, 9040.030491346213, 26501.267379,  4445.465999], // Display extent
        //fourParameter: [0,0,1,0] // Four-parameter transform
    },
    {
        mapid: "sys_hello"
    }
])
if (!rsp.status) {
    message.error(rsp.error)
}
// Returns
/*
{
    "fileid": "pec9c5f73f1d",
    "mapdependencies": "sys_world||sys_hello",
    "mapfrom": "sys_world&&v1&&&&0&&&&&&&&&&00A0&&10||sys_hello&&v1&&&&0&&&&&&&&&&&&2",
    "status": true
}
 */
let res = await svc.openMap({
    mapid: "newComposeHelloWord", // new map name
    fileid: rsp.fileid,
    //mapdependencies: rsp.mapdependencies, // for compose maps
    //mapfrom: rsp.mapfrom, // for compose maps
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style:  vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    message.error(res.error)
}

// Get map bounds
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);

// Custom projection
let cadProjection = new ol.proj.Projection({
    // extent for zoom levels
    extent: mapBounds.toArray(),
    units: 'm'
});
// Set resolution per level
let resolutions= [];
for(let i = 0; i < 25; i++) {
    resolutions.push(mapBounds.width() / (512 * Math.pow(2, i - 1)))
}
// Add custom CAD projection
ol.proj.addProjection(cadProjection);

// Create OpenLayers map
let map = new ol.Map({
    target: 'map', // DIV container ID
    view: new ol.View({
        center: mapBounds.center().toArray(),  // map center
        projection: cadProjection, // CAD projection
        resolutions:resolutions, // resolutions
        zoom: 2 // initial zoom
    })
});

// Add tile layer
let layer = new ol.layer.Tile({
    // Tile source
    source: new ol.source.TileImage({
        url: svc.rasterTileUrl() // CAD raster tile URL
    })
});
// Add layer to map
map.addLayer(layer);

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