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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/09leafletcomposemap
        // --CAD map composition--Layer/clip/rotate/scale multiple CAD maps and merge

// Leaflet website: https://leafletjs.com/
// Leaflet source: https://github.com/Leaflet/Leaflet
if (typeof L !== "object") {
    // If no Leaflet environment
    await vjmap.addScript([{
        src: "../../js/leaflet2.0/leaflet.js"
    },{
        src: "../../js/leaflet2.0/leaflet.css"
    }]);
}

// Map service object, open map via VJMap service, get map metadata
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)

// Compose new map: process sys_world, merge with sys_hello, generate new map file
let rsp = await svc.composeNewMap([
    {
        mapid: "sys_world", // Map ID
        // Set params for layers, bounds, coord transform
        layers: ["经纬度标注","COUNTRY"], // Layers to show (keep data key "经纬度标注")
        //clipbounds: [10201.981489534268, 9040.030491346213, 26501.267379,  4445.465999], // Display bounds
        //fourParameter: [0,0,1,0] // Four-parameter transform for map
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
    mapid: "newComposeHelloWord", // New map name
    fileid: rsp.fileid,
    //mapdependencies: rsp.mapdependencies, // Pass returned params for collaborative
    //mapfrom: rsp.mapfrom, // Pass returned params for collaborative
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style:  vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    message.error(res.error)
}

// Get map bounds
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);

// Create geo projection from map bounds
let CadCRS = L.Class.extend({
    includes: L.CRS.Simple,
    initialize: function (bounds) {
        // Current CAD map bounds
        this.bounds = bounds;
        // Projection
        this.projection = L.Projection.LonLat;
        // Calculate resolution
        let r = (256 / Math.abs(this.bounds.getEast() - this.bounds.getWest()));
        // Set transformation params: affine transform coefficients a,b,c,d for (x,y)->(ax+b,cy+d) and inverse
        this.transformation = new L.Transformation(r, -r * this.bounds.getWest(),  - r,  r * this.bounds.getNorth());
    }
});

// Leaflet uses reversed coords: use [y,x] with L.latLng for [x,y], see https://leafletjs.com/examples/crs-simple
// https://leafletjs.com/examples/crs-simple/crs-simple.html
L.XY = function(x, y) {
    if (L.Util.isArray(x)) {    // When doing XY([x, y]);
        return L.latLng(x[1], x[0]);
    }
    return L.latLng(y, x);  // When doing XY(x, y);
};

// Current CAD map bounds
let bounds = new L.LatLngBounds([L.XY(mapBounds.min.toArray()), L.XY(mapBounds.max.toArray())]);
let center = mapBounds.center(); // Map center

// Create Leaflet map object
let map = L.map('map', {
    // CRS
    crs: new CadCRS(bounds),
    attributionControl: false
}).setView(L.XY([center.x, center.y]), 2); // Set initial center and zoom
// If using L.latLng, swap x,y e.g.
// map.setView(L.latLng([center.y, center.x]), 2);

// Add raster tile layer
let layer = L.tileLayer(
    svc.rasterTileUrl(),  // VJMap CAD raster tile service URL
    {
        bounds: bounds // Current CAD map bounds
    }
).addTo(map);
// Add layer to map
layer.addTo(map);

document.getElementById("map").style.background = "#ffffff00"; // Set map bg transparent to use page bg
map.on('click', (e) => message.info({content: `Coordinates clicked: ${e.latlng.lng}, ${e.latlng.lat}}`, key: "info", duration: 3}));

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