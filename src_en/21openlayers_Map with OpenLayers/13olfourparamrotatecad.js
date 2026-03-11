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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/13olfourparamrotatecad
        // --CAD rotated overlay on web map [CAD as base]--

// OpenLayers: https://openlayers.org/ | https://github.com/openlayers/openlayers
if (typeof ol !== "object") {
    // If no OpenLayers environment
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}

let initZoom = 8;
let style = {
    backcolor: 0, // use dark style when div has dark background
    clipbounds: Math.pow(2, initZoom) // scale factor when no extent
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



// To manually pick corresponding points: VJMap Cloud https://vjmap.com/app/cloud/#/ -> open map -> More -> Overlay with web map (four-parameter)

// CAD points
let cadPoints = [
    vjmap.geoPoint([587464448.8435847, 3104003685.208651,]),
    vjmap.geoPoint([587761927.7224838, 3104005967.655292]),
    vjmap.geoPoint([587463688.0280377, 3103796743.3798513]),
    vjmap.geoPoint([587760406.0913897, 3103793700.1176634])
];


// Web points (WGS84) corresponding to CAD points
let webPoints = [
    vjmap.geoPoint([116.4849310885225,  39.960672361810566]),
    vjmap.geoPoint([116.48571466352934, 39.96016690545824]),
    vjmap.geoPoint([116.48440741215745, 39.96016393217476]),
    vjmap.geoPoint([116.48517547082753, 39.95968523181088])
]

// Compute four-parameter transform
let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
let param = vjmap.coordTransfromGetFourParamter(cadPoints, epsg3857Points, false); // consider rotation
let fourparam = [param.dx, param.dy, param.scale, param.rotate]

// Rotate map if needed so web map is upright
map.getView().setRotation(-param.rotate) ;

// Add Gaode base layer
let gdlayer;
const addGaodeMap = async (isRoadway) => {
    let b = mapBounds;
    const tileUrl = svc.webMapUrl({
        tileCrs: "gcj02",
        tileUrl: isRoadway ? [
                "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            ] :
            /* satellite */
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
        // fourParameterBefore for 6-digit CAD coords
        fourParameterBefore: fourparam
    })

// Add tile layer
    gdlayer = new ol.layer.Tile({
        // Tile source
        source: new ol.source.TileImage({
            url: tileUrl
        })
    });
    gdlayer.setZIndex(-1);
// Add layer to map
    map.addLayer(gdlayer);
}

const removeMapLayer = ()=> {
    // Remove layer
    map.removeLayr(gdlayer);
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