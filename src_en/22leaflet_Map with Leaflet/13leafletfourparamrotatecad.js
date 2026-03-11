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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/13leafletfourparamrotatecad
        // --CAD map with rotated web map overlay [CAD as basemap]--

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

let initZoom = 8;
let style = {
    backcolor: 0, // use dark style when div has dark background
    clipbounds: Math.pow(2, initZoom) // Value only = zoom factor for previous bounds
}
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
let res = await svc.openMap({
    mapid: "sys_zp",
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style:  style
})
if (res.error) {
    message.error(res.error)
}
// Get map bounds
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let prj = new vjmap.GeoProjection(mapBounds);
let center = mapBounds.center();

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

// Create Leaflet map object
let map = L.map('map', {
    // CRS
    crs: new CadCRS(bounds),
    attributionControl: false
}).setView(L.XY([center.x, center.y]), 9); // Set initial center and zoom
// If using L.latLng, swap x,y e.g.
// map.setView(L.latLng([center.y, center.x]), 9);

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


// For manual point pick: VJMap Cloud https://vjmap.com/app/cloud/#/ open map > More > Four-param web overlay

// Points on CAD map
let cadPoints = [
    vjmap.geoPoint([587464448.8435847, 3104003685.208651,]),
    vjmap.geoPoint([587761927.7224838, 3104005967.655292]),
    vjmap.geoPoint([587463688.0280377, 3103796743.3798513]),
    vjmap.geoPoint([587760406.0913897, 3103793700.1176634])
];


// Matching points on web map (WGS84)
let webPoints = [
    vjmap.geoPoint([116.4849310885225,  39.960672361810566]),
    vjmap.geoPoint([116.48571466352934, 39.96016690545824]),
    vjmap.geoPoint([116.48440741215745, 39.96016393217476]),
    vjmap.geoPoint([116.48517547082753, 39.95968523181088])
]

// Get four-param from point pairs
let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
let param = vjmap.coordTransfromGetFourParamter(cadPoints, epsg3857Points, false); // With rotation
let fourparam = [param.dx, param.dy, param.scale, param.rotate]

// For rotation: rotate map so web map is upright
// Leaflet does not support rotation; use https://github.com/Leaflet/Leaflet/tree/rotate

// Add Gaode basemap
let gdlayer;
const addGaodeMap = async (isRoadway) => {
    let b = mapBounds;
    const tileUrl = svc.webMapUrl({
        tileCrs: "gcj02",
        tileUrl: isRoadway ? [
                "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            ] :
            /* If using imagery */
            [
                "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            ],
        tileSize: 256,
        tileRetina: 1,
        // @ts-ignore
        tileMaxZoom: 18,
        tileShards: "1,2,3,4",
        tileToken: "",
        tileFlipY: false,
        mapbounds: JSON.stringify([b.min.x,b.min.y,b.max.x,b.max.y]),
        srs: "EPSG:3857",
        // If coords have 6 digits only, apply zone offset before transform
        fourParameterBefore: fourparam
    })

    gdlayer = L.tileLayer(
        tileUrl,
        {
            zIndex: 0
        }
    );
    gdlayer.addTo(map);
}

const removeMapLayer = ()=> {
    // Remove source and its layers
    if (gdlayer) gdlayer.remove();
}


addGaodeMap(true);


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