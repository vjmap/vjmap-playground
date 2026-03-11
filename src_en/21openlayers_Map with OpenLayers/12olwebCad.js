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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/12olwebCad
        // --CAD overlay on web map [CAD as base]--

// OpenLayers: https://openlayers.org/ | https://github.com/openlayers/openlayers
if (typeof ol !== "object") {
    // If no OpenLayers environment
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}
// CAD full extent at zoom 8 so web map still shows when zoomed out
let initZoom = 8;
let style = {
    backcolor: 0, // use dark style when div has dark background
    clipbounds: Math.pow(2, initZoom) // scale factor when no extent
}
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
let res = await svc.openMap({
    mapid: "sys_cad2000",
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
        zoom: 9 // initial zoom
    })
});

// Add tile layer
let layer = new ol.layer.Tile({
    // Add tile source
    source: new ol.source.TileImage({
        url: svc.rasterTileUrl() // CAD raster tile URL
    })
});
// Add layer to map
map.addLayer(layer);

map.on('click', (e) => message.info({content: `Coordinates clicked: ${JSON.stringify(e.coordinate)}`, key: "info", duration: 3}));


// Add Gaode (Amap) base layer
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
        srs: "EPSG:4527",
        // fourParameterBefore for 6-digit CAD coords
        fourParameterBefore: "39000000,0,1,0"
    })


    // Add tile layer
    gdlayer = new ol.layer.Tile({
        // Add tile source
        source: new ol.source.TileImage({
            url: tileUrl
        })
    });
    gdlayer.setZIndex(-1);
// Add layer to map
    map.addLayer(gdlayer);


    // CAD <-> Gaode coordinate conversion
    let webCo = await cad2webCoordinate(center, false); // CAD -> Gaode
    let cadCo = await web2cadCoordinate(webCo, false); // Gaode -> CAD
    console.log(center, webCo, cadCo)
}

// Add Tianditu base layer
let tdtlayer;
const addTiandituMap = async (isRoadway) => {
    const tileUrl = svc.webMapUrl({
        tileCrs: "wgs84",
        tileUrl: [
            isRoadway ? "https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk={t}" :
                /* satellite */"https://t{s}.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk={t}",
            "https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk={t}"
        ],
        tileSize: 256,
        tileRetina: 1,
        tileMaxZoom: 18,
        tileShards: "1,2,3,4,5,6",
        tileToken: [
            "6d53378dc5f7dbef8d84ffdd2b54139b",
            "69eb2fa0de3b2a668f1ef603a3f8bc73"
        ],
        tileFlipY: false,
        mapbounds: res.bounds,
        srs: "EPSG:4527",
        // fourParameterBefore for 6-digit CAD coords
        fourParameterBefore: "39000000,0,1,0"
    })

    // Add tile layer
    tdtlayer = new ol.layer.Tile({
        // Add tile source
        source: new ol.source.TileImage({
            url: tileUrl
        })
    });
    tdtlayer.setZIndex(-1);
// Add layer to map
    map.addLayer(tdtlayer);

    // CAD <-> Tianditu coordinate conversion
    let webCo = await cad2webCoordinate(center, true); // CAD -> Tianditu
    let cadCo = await web2cadCoordinate(webCo, true); // Tianditu -> CAD
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

// CAD to web coords: isWgs84=true for WGS84 (Tianditu), false for GCJ02 (Gaode)
const cad2webCoordinate = async (pt, isWgs84) => {
    let srs = "EPSG:4527"; // e.g. vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
    // sys_cad2000 uses 6-digit coords; add zone offset before transform
    let fourParameter = "39000000,0,1,0".split(",");
    // Four-param CAD->4527, then transform to WGS84, optionally to GCJ02
    // Restore CAD to 4527: add x offset 39000000
    //pt.x += 39000000;
    pt = vjmap.coordTransfromByFourParamter(pt, {
        dx: +fourParameter[0],
        dy: +fourParameter[1],
        scale: +fourParameter[2],
        rotate: +fourParameter[3]
    })
    // Transform 4527 to WGS84 4326
    let res = await svc.cmdTransform("EPSG:4527","EPSG:4326",pt);
    // 4326 -> GCJ02 if needed
    let webPt = res[0];
    if (isWgs84 === false) {
        webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
    }
    return webPt;
}

// Web to CAD coords: isWgs84 for WGS84 (Tianditu), false for GCJ02 (Gaode)
const web2cadCoordinate = async (pt, isWgs84) => {
    let srs = "EPSG:4527"; // e.g. vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
    // sys_cad2000 uses 6-digit coords; add zone offset before transform
    let fourParameter = "39000000,0,1,0".split(",");
    // Inverse: GCJ02->4326 if needed, 4326->4527, then four-param to CAD
    if (isWgs84 === false) {
        pt = vjmap.transform.convert(pt, vjmap.transform.CRSTypes.AMap, vjmap.transform.CRSTypes.EPSG4326);
    }
    // Transform 4527 to WGS84 4326
    let res = await svc.cmdTransform("EPSG:4326","EPSG:4527",vjmap.geoPoint(pt));
    let cadPt = res[0];
    // Restore 4527 to CAD: subtract x offset
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
                removeMapLayer();
                break;
            case 1:
                removeMapLayer();
                addGaodeMap(true);
                break;
            case 2:
                removeMapLayer();
                addGaodeMap(false);
                break;
            case 3:
                removeMapLayer();
                addTiandituMap(true);
                break;
            case 4:
                removeMapLayer();
                addTiandituMap(false);
                break;
        }
    }

    let style ={"min-width":"65px"}
    return (
        <Radio.Group className="input-card"  onChange={onChange} value={value} style={style}>
            <Space direction="vertical">
                <Radio value={0}>No overlay</Radio>
                <Radio value={1}>Gaode road map</Radio>
                <Radio value={2}>Gaode satellite map</Radio>
                <Radio value={3}>Tianditu road</Radio>
                <Radio value={4}>Tianditu satellite</Radio>
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