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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/05fourparamrotatewebMany
        // --Multiple CAD maps rotated and overlaid on web map [web map as base]--
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
    center: prj.toLngLat([116.4849310885225,  39.960672361810566]),
    zoom: 16,
    pitch: 0,
    maxZoom: 24,
    renderWorldCopies: false // Do not show multi-screen map
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent by map bounds
//map.fitMapBounds();
await map.onLoad();


const addCadLayer = async (mapId, version, cadPts, webPts)=> {
// CAD control points
    let cadPoints = cadPts.map(e => vjmap.geoPoint(e));

// Web control points (WGS84) corresponding to above
    let webPoints = webPts.map(e => vjmap.geoPoint(e))

// Four-param from control points
    let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
    let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , false); // With rotation
    let fourparam = [param.dx, param.dy, param.scale, param.rotate]

// Get map metadata for layer style
    let cadMapId = mapId;
    let style = await svc.createStyle({
        backcolor: 0xFFFFFF // Light theme
    }, cadMapId)
    let wmsurl = svc.wmsTileUrl({
        mapid: cadMapId,
        version: version,
        layers: style.stylename,
        fourParameter: fourparam
    })

    let key = `${mapId}-${version}`;
    let sourceId = 'wms-test-source' + key;
    map.addSource(sourceId, {
        'type': 'raster',
        'tiles': [
            wmsurl
        ],
        'tileSize': 256
    });
    map.addLayer({
            'id': 'wms-test-layer' + key,
            'type': 'raster',
            'source': sourceId,
            'paint': { "raster-opacity": 1 }
        }
    );

    // Draw CAD control points on map
    for(let cadPt of cadPoints) {
        let pt3857 = vjmap.coordTransfromByInvFourParamter(cadPt, param); // Inverse four-param to web Mercator
        let pt4326 = vjmap.Projection.mercator2LngLat(pt3857);
        new vjmap.Marker().setLngLat(pt4326).addTo(map);
    }
    // For auto-overlay maps, CAD to web coordinate approach:
    /*
    (1) Get EPSG from x coord prefix and CRS, e.g. let epsg = vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg;
    (2) Transform EPSG to WGS84 4326
        let res = await svc.cmdTransform("EPSG:xxxx","EPSG:4326",pt); // Or use proj4 on frontend
    (3) If Amap (GCJ-02), convert 4326 to GCJ-02
        let webPt = res[0];// First result
        if (isWgs84 === false) {
            webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
         }
     */

    return sourceId;
}

let sourceId1, sourceId2;

const addCadMap1 = async () => {
    if (sourceId1) return;
    sourceId1 = await addCadLayer('sys_zp', 'v1', [
        [587464448.8435847, 3104003685.208651], // Get points from cloud console: Data display => Get point
        [587761927.7224838, 3104005967.655292],
        [587463688.0280377, 3103796743.3798513],
        [587760406.0913897, 3103793700.1176634]
    ], [
        [116.4849310885225,  39.9606723618105], // Or map.on("click", e=>console.log(e.lngLat))
        [116.48571466352934, 39.9601669054582],
        [116.48440741215745, 39.9601639321747],
        [116.48517547082753, 39.9596852318108]
    ])
}

const removeCadMap1 = async () => {
    if (!sourceId1) return;
    map.removeSourceEx(sourceId1); // Remove this source and all related layers
    sourceId1 = null;
}

const addCadMap2 = async () => {
    if (sourceId2) return;
    sourceId2 = await addCadLayer('sys_world', 'v1', [
        [2371.9857148576993,17684.712620161758],
        [27147.25278, 17638.89665600001],
        [27261.514060999998, 2774.543744999999],
        [2271.3403719999988, 2828.677678]
    ], [
        [116.48471651179932, 39.961860646794605],
        [116.48547825916069, 39.96135079694321],
        [116.48500619037321, 39.96093140147377],
        [116.48416934116136, 39.961334350110604]
    ])
}

const removeCadMap2 = async () => {
    if (!sourceId2) return;
    map.removeSourceEx(sourceId2); // Remove this source and all related layers
    sourceId2 = null;
}

addCadMap1();
addCadMap2();


// UI
const App = () => {
    return (
        <div className="input-card">
            <h4>Overlay CAD map</h4>
            <div className="input-item">
                <button className="btn" onClick={ () => addCadMap1() }>Overlay sys_zp</button>
                <button className="btn" onClick={ () => removeCadMap1() }>Remove sys_zp</button>
                <button className="btn" onClick={ () => addCadMap2() }>Overlay sys_world</button>
                <button className="btn" onClick={ () => removeCadMap2() }>Remove sys_world</button>
            </div>
        </div>
    );
}
ReactDOM.render(<App/>, document.getElementById('ui'));


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