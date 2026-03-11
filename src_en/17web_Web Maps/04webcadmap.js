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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/04webcadmap
        // --CAD and web map overlay-- CAD as CRS
// CAD full extent at zoom 8 so web map still shows when zoomed out
let initZoom = 8;
let style = {
    backcolor: 0, // Dark background style when div is dark
    clipbounds: Math.pow(2, initZoom) // Scale factor for extent
}
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
let res = await svc.openMap({
    mapid: "sys_cad2000",
    mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
    style:  style
})
if (res.error) {
    message.error(res.error)
}
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
let prj = new vjmap.GeoProjection(mapExtent);
let center = mapExtent.center();
let map = new vjmap.Map({
    container: 'map', // container ID
    style: svc.rasterStyle(),
    center: prj.toLngLat(center),
    zoom: initZoom,
    renderWorldCopies: false
});
map.attach(svc, prj);
await map.onLoad();
map.addControl(new vjmap.NavigationControl());
map.addControl(new vjmap.MousePositionControl({showZoom: true}));

// If x is 8 digits, get by first two digits e.g. vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
// If x is 6 digits, use tool https://vjmap.com/demo/#/demo/map/web/03webzgetepsg: move map to CAD area, get center lnglat, compute EPSG
let epsg = "EPSG:4509" // CAD map EPSG
// Add Gaode base map
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
        srs: epsg
    })

    map.addSource('web-gaode-source', {
        'type': 'raster',
        'tiles': [
            tileUrl
        ],
        'tileSize': 256
    });
    map.addLayer({
            'id': 'web-gaode-layer',
            'type': 'raster',
            'source': 'web-gaode-source',
            'paint': { "raster-opacity": 1 }
        }
    );
    let layers = map.getStyle().layers
    // Move this layer to bottom
    map.moveLayer('web-gaode-layer', layers[0].id)

    // CAD and Gaode coordinate conversion example
    let webCo = await cad2webCoordinate(center, false); // CAD to Gaode
    let cadCo = await web2cadCoordinate(webCo, false); // Gaode to CAD
    console.log(center, webCo, cadCo)
}

// Add Tianditu base map
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
            "6d53378dc5f7dbef8d84ffdd2b54139b", // Multiple tokens; on failure next is tried
            "69eb2fa0de3b2a668f1ef603a3f8bc73"
        ],
        tileFlipY: false,
        mapbounds: res.bounds,
        srs: epsg
    })

    map.addSource('web-tdt-source', {
        'type': 'raster',
        'tiles': [
            tileUrl
        ],
        'tileSize': 256
    });
    map.addLayer({
            'id': 'web-tdt-layer',
            'type': 'raster',
            'source': 'web-tdt-source',
            'paint': { "raster-opacity": 1 }
        }
    );
    let layers = map.getStyle().layers
    // Move this layer to bottom
    map.moveLayer('web-tdt-layer', layers[0].id)

    // CAD and Tianditu coordinate conversion example
    let webCo = await cad2webCoordinate(center, true); // CAD to Tianditu
    let cadCo = await web2cadCoordinate(webCo, true); // Tianditu to CAD
    console.log(center, webCo, cadCo)
}



const removeMapLayer = ()=> {
    // Remove source and its layers
    map.removeSourceEx(['web-gaode-source', 'web-tdt-source'])
}

// CAD to web; isWgs84: true=Tianditu, false=Gaode GCJ02
const cad2webCoordinate = async (pt, isWgs84) => {
    // Transform to WGS84 4326
    let res = await svc.cmdTransform(epsg,"EPSG:4326",pt); // Or use proj4 on frontend
    // If GCJ02, convert from 4326
    let webPt = res[0];// First result
    if (isWgs84 === false) {
        webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
    }
    return webPt;
}

// Web to CAD; isWgs84: true=Tianditu, false=Gaode GCJ02
const web2cadCoordinate = async (pt, isWgs84) => {
    // Inverse of above; if GCJ02, convert to 4326 then to CAD
    if (isWgs84 === false) {
        pt = vjmap.transform.convert(pt, vjmap.transform.CRSTypes.AMap, vjmap.transform.CRSTypes.EPSG4326);
    }
    // Transform to CAD EPSG
    let res = await svc.cmdTransform("EPSG:4326",epsg,vjmap.geoPoint(pt)); // Or use proj4 on frontend
    let cadPt = res[0];// First result
    return cadPt
}

map.on("zoomend", async ()=> {
    let center = map.fromLngLat(map.getCenter());// CAD map geo center
    let gcj02Web = await cad2webCoordinate(center, false);// To Gaode
    let wgs84Web = await cad2webCoordinate(center, true);// To Tianditu
    let content = `Current map center: CAD:${center.x.toFixed(4)},${center.y.toFixed(4)}; Gaode:${gcj02Web[0].toFixed(4)},${gcj02Web[1].toFixed(4)}; Tianditu:${wgs84Web[0].toFixed(4)},${wgs84Web[1].toFixed(4)}`;
    message.info({ content, key: "info", duration: 3});
})

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
                removeMapLayer(); // Remove previous base map
                break;
            case 1:
                removeMapLayer(); // Remove previous base map
                addGaodeMap(true);
                break;
            case 2:
                removeMapLayer(); // Remove previous base map
                addGaodeMap(false);
                break;
            case 3:
                removeMapLayer(); // Remove previous base map
                addTiandituMap(true);
                break;
            case 4:
                removeMapLayer(); // Remove previous base map
                addTiandituMap(false);
                break;
        }
    }

    let style ={"min-width":"65px"}
    return (
        <Radio.Group className="input-card"  onChange={onChange} value={value} style={style}>
            <Space direction="vertical">
                <Radio value={0}>No overlay</Radio>
                <Radio value={1}>Overlay Gaode road</Radio>
                <Radio value={2}>Overlay Gaode imagery</Radio>
                <Radio value={3}>Overlay Tianditu road</Radio>
                <Radio value={4}>Overlay Tianditu imagery</Radio>
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