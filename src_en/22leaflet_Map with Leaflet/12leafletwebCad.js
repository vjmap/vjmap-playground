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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/12leafletwebCad
        // --CAD map with web map overlay [CAD as basemap]--

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
// Open map
let mapId = "sys_cad2000";
let res = await svc.openMap({
    mapid: mapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
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


// Add Gaode map basemap
let gdlayer;
const addGaodeMap = async (isRoadway) => {
    const tileUrl = svc.webMapUrl({
        tileCrs: "gcj02",
        tileUrl:  isRoadway ? [
                "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            ] :
            /* If using imagery */
            [
                "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            ],
        tileSize: 256,
        tileRetina: 1,
        tileMaxZoom: 18,
        tileShards: "1,2,3,4",
        tileToken: "",
        tileFlipY: false,
        mapbounds: res.bounds,
        srs: "EPSG:4527",// e.g. vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
        // sys_cad2000 has 6-digit coords; apply zone offset before transform
        fourParameterBefore: "39000000,0,1,0"
    })

    gdlayer = L.tileLayer(
        tileUrl,
        {
            zIndex: 0
        }
    );
    gdlayer.addTo(map);


    // CAD<->Gaode coord conversion example
    let webCo = await cad2webCoordinate(center, false); // CAD to Gaode
    let cadCo = await web2cadCoordinate(webCo, false); // Gaode to CAD
    console.log(center, webCo, cadCo)
}

// Add Tianditu basemap
let tdtlayer;
const addTiandituMap = async (isRoadway) => {
    const tileUrl = svc.webMapUrl({
        tileCrs: "wgs84",
        tileUrl: [
            isRoadway ? "https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk={t}" :
                /* If using imagery */"https://t{s}.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk={t}",
            "https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk={t}"
        ],
        tileSize: 256,
        tileRetina: 1,
        tileMaxZoom: 18,
        tileShards: "1,2,3,4,5,6",
        tileToken: [
            "6d53378dc5f7dbef8d84ffdd2b54139b", // Fallback tokens for rate limit
            "69eb2fa0de3b2a668f1ef603a3f8bc73"
        ],
        tileFlipY: false,
        mapbounds: res.bounds,
        srs: "EPSG:4527", // e.g. vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
        // sys_cad2000 has 6-digit coords; apply zone offset before transform
        fourParameterBefore: "39000000,0,1,0"
    })

    // Add tile layer
    tdtlayer = L.tileLayer(
        tileUrl,
        {
            zIndex: 0
        }
    );
    tdtlayer.addTo(map);

    // CAD<->Tianditu coord conversion example
    let webCo = await cad2webCoordinate(center, true); // CAD to Tianditu
    let cadCo = await web2cadCoordinate(webCo, true); // Tianditu to CAD
    console.log(center, webCo, cadCo)
}



const removeMapLayer = ()=> {
    if (gdlayer) {
        map.removeLayer(gdlayer);
    }
    if (tdtlayer) {
        map.removeLayer(tdtlayer);
    }
}

// CAD to web coords. isWgs84=true for WGS84 (e.g. Tianditu); false for GCJ02 (e.g. Gaode)
const cad2webCoordinate = async (pt, isWgs84) => {
    let srs = "EPSG:4527"; // e.g. vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
    // sys_cad2000 has 6-digit coords; apply zone offset before transform
    let fourParameter = "39000000,0,1,0".split(",");
    // Four-param to 4527, then transform 4527->4326, then 4326->GCJ02 if needed
    //pt.x += 39000000;
    pt = vjmap.coordTransfromByFourParamter(pt, {
        dx: +fourParameter[0],
        dy: +fourParameter[1],
        scale: +fourParameter[2],
        rotate: +fourParameter[3]
    })
    // Transform 4527 to WGS84 4326
    let res = await svc.cmdTransform("EPSG:4527","EPSG:4326",pt); // Or use proj4 client-side
    let webPt = res[0];// First result
    if (isWgs84 === false) {
        webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
    }
    return webPt;
}

// Web to CAD coords. isWgs84=true for WGS84 (e.g. Tianditu); false for GCJ02 (e.g. Gaode)
const web2cadCoordinate = async (pt, isWgs84) => {
    let srs = "EPSG:4527"; // e.g. vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
    // sys_cad2000 has 6-digit coords; apply zone offset before transform  https://blog.csdn.net/thinkpang/article/details/124172626
    let fourParameter = "39000000,0,1,0".split(",");
    // Inverse of above: GCJ02->4326 if needed, then 4326->4527, then four-param to CAD
    if (isWgs84 === false) {
        pt = vjmap.transform.convert(pt, vjmap.transform.CRSTypes.AMap, vjmap.transform.CRSTypes.EPSG4326);
    }
    // Transform 4326 to 4527
    let res = await svc.cmdTransform("EPSG:4326","EPSG:4527",vjmap.geoPoint(pt)); // Or use proj4 client-side
    let cadPt = res[0];// First result
    //pt.x -= 39000000;
    // Inverse four-param
    cadPt = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(cadPt), {
        dx: +fourParameter[0],
        dy: +fourParameter[1],
        scale: +fourParameter[2],
        rotate: +fourParameter[3]
    })
    return cadPt
}



const { useState } = React;
const { Radio, Space } = antd;
// UI
const App = () => {
    const [value, setValue] = useState(0);
    const onChange = (v) => {
        let val = v.target.value
        setValue(val)
        switch (val) {
            case 0:
                removeMapLayer(); // Remove previous basemap
                break;
            case 1:
                removeMapLayer(); // Remove previous basemap
                addGaodeMap(true);
                break;
            case 2:
                removeMapLayer(); // Remove previous basemap
                addGaodeMap(false);
                break;
            case 3:
                removeMapLayer(); // Remove previous basemap
                addTiandituMap(true);
                break;
            case 4:
                removeMapLayer(); // Remove previous basemap
                addTiandituMap(false);
                break;
        }
    }

    let style ={"min-width":"65px"}
    return (
        <Radio.Group className="input-card"  onChange={onChange} value={value} style={style}>
            <Space direction="vertical">
                <Radio value={0}>No overlay</Radio>
                <Radio value={1}>Gaode road</Radio>
                <Radio value={2}>Gaode imagery</Radio>
                <Radio value={3}>Tianditu road</Radio>
                <Radio value={4}>Tianditu imagery</Radio>
            </Space>
        </Radio.Group>
    );
}
ReactDOM.render(<App />, document.getElementById('ui'));


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