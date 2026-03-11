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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/06wmsselentity
        // --Click on overlay to select CAD entity--
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
            },
            tdt2: {
                type: 'raster',
                tiles: ["https://t3.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
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
    center: [113.27384341272153, 23.206602011277003],
    zoom: 15,
    pitch: 0,
    renderWorldCopies: false // Do not show multi-screen map
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent by map bounds
//map.fitMapBounds();
await map.onLoad();
// Get map metadata for layer style
let cadMapId = "sys_webwms"
let style = await svc.createStyle({
    backcolor: 0xFFFFFF // Light theme
}, cadMapId);

// CAD control points
let cadPoints = [
    vjmap.geoPoint([39760.07407, 237424.52134]),
    vjmap.geoPoint([39006.60468, 237808.49494749]),
    vjmap.geoPoint([38823.92918, 235003.98994]),
    vjmap.geoPoint([37885.55424, 235452.80893])
];

// Web control points (Baidu map) corresponding to above
let baiduPoints = [
    vjmap.geoPoint([113.292983, 23.206979]),
    vjmap.geoPoint([113.285631, 23.210304]),
    vjmap.geoPoint([113.283897, 23.185047]),
    vjmap.geoPoint([113.274716, 23.188962])
]

// Baidu to WGS84; for Gaode use CRSTypes.GCJ02, for Tianditu use WGS84 directly
let wgs84Points = baiduPoints.map(e => vjmap.geoPoint(vjmap.transform.convert([e.x, e.y],vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.WGS84)));

// Four-param from control points
let fourparam = vjmap.coordTransfromGetFourParamter(wgs84Points, cadPoints, true); // No rotation here

let wmsurl = svc.wmsTileUrl({
    mapid: cadMapId,
    version:"v1",
    layers: style.stylename,
    srs: "EPSG:3857", // Base map is Tianditu CRS
    crs: "EPSG:4326", // Four-param input is WGS84, so convert 3857 to 4326 first
    fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate] // To 4326 then four-param to CAD
})

map.addSource('wms-test-source', {
    'type': 'raster',
    'tiles': [
        wmsurl
    ],
    'tileSize': 256
});
map.addLayer({
        'id': 'wms-test-layer',
        'type': 'raster',
        'source': 'wms-test-source',
        'paint': { "raster-opacity": 1 }
    }
);

// Click to highlight CAD entity
const name = "myhighlight";
const highlightColor = "#FF8957";
const addSourceLayer = () => {
    //  Data source
    map.addGeoJSONSource(`${name}-source`, {
        type: "FeatureCollection",
        features: []
    });

    map.addLineLayer(`${name}-line-layer`, `${name}-source`, {
        lineJoin: "round",
        lineCap: "round",
        lineColor: highlightColor,
        lineWidth: 3,
        lineOpacity: 0.8,
        filter: [
            "==",
            ["geometry-type"],
            "LineString"
        ]
    });


    map.addFillLayer(`${name}-fill-layer`, `${name}-source`, {
        fillColor: highlightColor,
        fillOpacity: 1.0,
        filter: [
            "==",
            ["geometry-type"],
            "Polygon"
        ]
    })

}
const clear = () => {
    if (map.getSource(`${name}-source`)) {
        map.getSource(`${name}-source`).setData({
            type: "FeatureCollection",
            features: []
        });
    }
};


// Get CAD map metadata
const metadata = await svc.metadata(cadMapId);
// Create projection
// Get map extent
let mapExtent = vjmap.GeoBounds.fromString(metadata.bounds);
let cadPrj = new vjmap.GeoProjection(mapExtent);

const click_highlight_evt = async e => {
    if (map.isInteracting()) return; // Ignore when map is interacting (e.g. drawing)
    const co = vjmap.coordTransfromByFourParamter(map.fromLngLat(e.lngLat), fourparam); // Base is WGS84, use four-param to CAD for point query
    // Geo length per pixel at this level (CAD uses WMS, no zoom level concept)
    let pixel = map.project(e.lngLat);
    pixel.x = pixel.x + 1 ;// Add one pixel
    let lngLat2 = map.unproject(pixel);// LngLat after adding one pixel
    // To CAD coordinate
    const co2 = vjmap.coordTransfromByFourParamter(map.fromLngLat(lngLat2), fourparam);
    // Geo length per pixel
    const pixelToGeoLength = co2.x - co.x;
    // Click to highlight
    const res = await svc.pointQueryFeature({
        pixelToGeoLength: pixelToGeoLength,
        x: co.x,
        y: co.y,
        geom: true,
        mapid: cadMapId, // Map id to query
        layer: style.stylename
    });

    if (res && res.result && res.result.length > 0) {
        if (!map.getSource(`${name}-source`)) {
            addSourceLayer();// First init
        }

        const geom = {
            geometries: [],
            type: "GeometryCollection"
        }

        for(let ent of res.result) {
            if (ent.geom && ent.geom.geometries) {
                let g = ent.geom.geometries;
                for(let i = 0; i < g.length; i++) {
                    g[i].coordinates = vjmap.transform.convert(g[i].coordinates, data => {
                        // Data is CAD full-extent lnglat, not overlay lnglat
                        const cadPoint = cadPrj.fromLngLat(data); // Convert lnglat to CAD coordinate
                        const pt = vjmap.coordTransfromByInvFourParamter(cadPoint, fourparam); // Inverse four-param: CAD to lnglat
                        return [pt.x, pt.y];
                    });
                    geom.geometries.push(g[i])
                }

            }
        }
        if (geom.geometries.length > 0) {
            map.getSource(`${name}-source`).setData(geom);
        } else {
            clear();
        }
    } else {
        clear();
    }
    map.triggerRepaint();
};
map.on("click", click_highlight_evt);
//map.off("click", click_highlight_evt); // Use this to cancel

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