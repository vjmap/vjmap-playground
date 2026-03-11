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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/06webcadwmts
        // --CAD WMTS overlay [Tianditu as base]-- Tianditu as CRS, CAD as WMTS layer
// Note: Only suitable for small geographic extent; otherwise large deviation
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Create lnglat projection by map bounds
let prj = new vjmap.LnglatProjection();
// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: {
        version: svc.styleVersion(),
        sources: {
            tdt1: {
                type: 'raster',
                tiles: ["https://t3.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                // For imagery use this URL
                // tiles: ["https://t3.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"]
                maxzoom: 18,// Max zoom 18
            },
            tdt2: {
                type: 'raster',
                tiles: ["https://t3.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                maxzoom: 18,// Max zoom 18
            }
        },
        layers: [{
            id: 'tdt1',
            type: 'raster',
            source: 'tdt1',
        },{
            id: 'tdt2',
            type: 'raster',
            source: 'tdt2',
        }]
    },
    center: prj.toLngLat([117.21242940465396, 39.196783504641644]),
    zoom: 15,
    maxZoom: 24, // Max map zoom 24
    pitch: 0,
    renderWorldCopies: false // Do not show multi-screen map
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent by map bounds
//map.fitMapBounds();
await map.onLoad();
// Get map metadata for layer style
let cadMapId = "sys_cad2000";
let cadEpsg = "EPSG:4548"; // CAD map is CGCS2000

let isWgs84 = true; // true=WGS84 (Tianditu), false=GCJ02 (Gaode)

// CAD to web; isWgs84: true=Tianditu, false=Gaode GCJ02
const cad2webCoordinate = async (pt, isWgs84) => {
    // Transform to WGS84 4326
    let res = await svc.cmdTransform(cadEpsg,"EPSG:4326",pt); // Or use proj4 on frontend
    // If GCJ02, convert from 4326
    let webPt = res[0];// First result
    if (isWgs84 === false) {
        webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
    }
    return webPt;
}

// Web to CAD; isWgs84: true=Tianditu, false=Gaode GCJ02
const web2cadCoordinate = async (pt, isWgs84) => {
    // Inverse of above; if GCJ02 convert to 4326 then to CAD
    if (isWgs84 === false) {
        pt = vjmap.transform.convert(pt, vjmap.transform.CRSTypes.AMap, vjmap.transform.CRSTypes.EPSG4326);
    }
    // Transform CAD EPSG to WGS84 4326
    let res = await svc.cmdTransform("EPSG:4326",cadEpsg,vjmap.geoPoint(pt)); // Or use proj4 on frontend
    let cadPt = res[0];// First result
    return cadPt
}

// Get CAD map extent, convert to Mercator
let metadata = await svc.metadata(cadMapId, "v1")
let mapBounds = vjmap.GeoBounds.fromString(metadata.bounds);
// Top-left
let p1 = mapBounds.leftTop();
// Bottom-right
let p2 = mapBounds.rightBottom();
let webp1 = await cad2webCoordinate(p1, isWgs84)
let webp2 = await cad2webCoordinate(p2, isWgs84)
// To Mercator
let mctp1 = vjmap.Projection.lngLat2Mercator(webp1);
let mctp2 = vjmap.Projection.lngLat2Mercator(webp2);

// Mercator world extent
// Make square (some deviation)
let delta = ((mctp1[1] - mctp2[1] ) +  (mctp2[0] - mctp1[0] )) / 2.0;
mctp2[0] = mctp1[0] + delta;
mctp2[1] = mctp1[1] - delta

let earthBounds = vjmap.Projection.EARTH_BOUNDS;
// Inverse to get CAD global extent
let ratioX1 = (mctp1[0] - earthBounds[0]) / (earthBounds[2] - earthBounds[0])
let ratioY1 = (mctp2[1] - earthBounds[1]) / (earthBounds[3] - earthBounds[1])
let ratioX2 = (mctp2[0] - earthBounds[0]) / (earthBounds[2] - earthBounds[0])
let ratioY2 = (mctp1[1] - earthBounds[1]) / (earthBounds[3] - earthBounds[1])

let cadEarthBoundsX1 = (ratioX2 * p1.x - ratioX1 * p2.x) / (ratioX2 - ratioX1)
let cadEarthBoundsX2 = (p1.x - cadEarthBoundsX1) / ratioX1 + cadEarthBoundsX1;
let cadEarthBoundsY1 = (ratioY2 * p2.y - ratioY1 * p1.y) / (ratioY2 - ratioY1)
let cadEarthBoundsY2 = (p2.y - cadEarthBoundsY1) / ratioY1 + cadEarthBoundsY1;

let cadEarthBounds = vjmap.GeoBounds.fromArray([cadEarthBoundsX1, cadEarthBoundsY1, cadEarthBoundsX2, cadEarthBoundsY2])
cadEarthBounds = cadEarthBounds.square()
let style = await svc.createStyle({
    name: "cadEarthStyle",
    clipbounds: cadEarthBounds.toString() // New full extent
}, cadMapId, "v1");


let tiles = svc.rasterTileUrl({
    mapid: cadMapId,
    version:"v1",
    layer: style.stylename
});
map.addRasterSource("mapTileSource", {
    type: "raster",
    tiles: [tiles],
    tileSize: 256
});
map.addRasterLayer("mapTileLayer", "mapTileSource");

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