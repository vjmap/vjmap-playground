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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/09baiduCadLayer
        // --Load CAD map in Baidu Map SDK--
// Demo loads Baidu SDK dynamically; in production include Baidu map script in HTML
// <script src="http://api.map.baidu.com/api?type=webgl&v=1.0&ak=G1LFyjrNGIkns5OfpZnrCGAKxpycPLwb">
function LoadBaiduMapScript() {
    const AK = 'G1LFyjrNGIkns5OfpZnrCGAKxpycPLwb';
    const BMapURL = "https://api.map.baidu.com/api?type=webgl&v=1.0&ak="+ AK +"&s=1&callback=onBMapCallback";
    return new Promise((resolve, reject) => {
        // If already loaded return        
        if(typeof BMapGL !== "undefined") {
            resolve(BMapGL);
            return true;
        }
        // Baidu map async load callback  
        window.onBMapCallback = function () {
            resolve(BMapGL);
        };
        // Insert script   
        let scriptNode = document.createElement("script");
        scriptNode.setAttribute("type", "text/javascript");
        scriptNode.setAttribute("src", BMapURL);
        document.body.appendChild(scriptNode);
    });
}
await LoadBaiduMapScript();

var map = new BMapGL.Map("map");
var point = new BMapGL.Point(106.166187, 29.44102);
map.centerAndZoom(point, 15);
map.enableScrollWheelZoom(true);     // Enable scroll wheel zoom

// Map service
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "sys_cadcesium";
let res = await svc.openMap({
    mapid: mapId, // Map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // Open by geometry render mode
    style: vjmap.openMapDarkStyle() // Dark background style
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
let layer = res.layer;// Layer style name


let cadEpsg = "EPSG:4544";// CAD map EPSG code
// Add CAD WMS layer
let wmsUrl = svc.wmsTileUrl({
    mapid: mapId, // Map id
    layers: layer, // Layer name
    bbox: '', // bbox not needed
    srs: "EPSG:3857", //
    crs: cadEpsg
})

let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let cadPrj = new vjmap.GeoProjection(mapBounds);


// Load proj4
if (typeof proj4 !== "object") {
    // If not available
    await vjmap.addScript([{
        src: "../../js/proj4.min.js"
    }])
}
// Query params at https://epsg.io/
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
proj4.defs("EPSG:4544", "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs");


// CAD to web WGS84, then to Baidu coordinate
const cadToWebCoordinate = point => {
    let co = proj4(cadEpsg, "EPSG:4326", vjmap.geoPoint(point).toArray());
    return co;
}
// Baidu to web WGS84 to CAD coordinate
const webTocadCoordinate = point => {
    let co = vjmap.transform.convert(point, vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.WGS84)
    return proj4("EPSG:4326", cadEpsg, co);
}

async function queryData(svc, cadPrj) {
    let res = await svc.conditionQueryFeature({
        condition: `layerindex = 1`, // SQL WHERE condition, see server query docs
        fields: "",
        includegeom: true, // Return geometry; when false, >1 returns bbox only
        realgeom: true,
        limit: 100000 // Set large; default 100
    }, pt => {
        // Coordinate transform for each queried point
        let cadPoint = cadPrj.fromMercator(pt);// To CAD coordinate
        return cadToWebCoordinate(cadPoint); // CAD to current map lnglat
    })

    if (res && res.result && res.result.length > 0) {

        let features = [];
        for (let ent of res.result) {
            if (ent.geom && ent.geom.geometries) {
                let clr = vjmap.entColorToHtmlColor(ent.color);
                for (let g = 0; g < ent.geom.geometries.length; g++) {
                    features.push({
                        id: ent.id,
                        type: "Feature",
                        properties: {
                            objectid: ent.objectid + "_" + g,
                            color: clr,
                            alpha: ent.alpha / 255,
                            lineWidth: 1,
                            name: ent.name,
                            isline: ent.isline,
                            layerindex: ent.layerindex
                        },
                        geometry: ent.geom.geometries[g]
                    })
                }
            }
        }

        let geom = {
            type: "FeatureCollection",
            features: features
        };

        return geom;
    }
}

function addGeoJsonData(map, data) {
    var region = data;

    // https://lbsyun.baidu.com/index.php?title=jspopularGL/guide/geoJsonLayer

    var label = new BMapGL.Label();
    label.setStyle({
        color: 'blue',
        borderRadius: '5px',
        borderColor: '#ccc',
        padding: '10px',
        fontSize: '16px',
        fontFamily: 'Microsoft YaHei',
        transform: 'translateX(-50%) translateY(calc(-100% - 10px))'
    });

    function popup(e) {
        if (e.features && e.features.length > 0) {
            var overlay = e.features[0];
            // Reset data style
            resetGeoLayer();
            if (overlay.toString() === 'Polygon') {
                overlay.setFillColor('yellow');
            }
            if (overlay.toString() === 'Polyline') {
                overlay.setStrokeColor('yellow');
            }

            label.setPosition(e.latLng);
            label.setContent(`<h4 style='margin:0 0 5px 0;'>${overlay.properties.name}</h4>
    <p style='margin:0;line-height:1.5;font-size:13px;text-indent:2em'>
    objectid：${overlay.properties.objectid}
    </p></div>`);
            map.addOverlay(label);
        }
    }

    var cadLayer = new BMapGL.GeoJSONLayer('cad-child', {
        reference: 'WGS84',
        dataSource: region,
        level: -10,
        polygonStyle: function (properties) {
            var index = properties.join || 0;
            return {
                fillColor: properties.color
            }
        },
        polylineStyle: function (properties) {
            return {
                strokeColor: properties.color
            }
        },
        markerStyle: function (properties) {
            return {

            }
        }
    });
    cadLayer.addEventListener('click', function (e) {
        if (e.features) {
            popup(e);

        } else {
            resetGeoLayer();
            map.removeOverlay(label);

        }

    });
    map.addGeoJSONLayer(cadLayer);
    function resetGeoLayer() {
        cadLayer && cadLayer.resetStyle();
    }
    return cadLayer;
}

let wmsLayer;
const addWmsLayer = ()=> {
    if (wmsLayer) return;
    // tileUrlTemplate contains OGC WMS GetMap params
    wmsLayer = BMapGL.XYZLayer({
        tileUrlTemplate: wmsUrl + '&BBOX=[b] ',
        useThumbData: false
    });
    map.addTileLayer(wmsLayer);
}

const removeWmsLayer = ()=> {
    if (!wmsLayer) return;
    map.removeTileLayer(wmsLayer);
    wmsLayer = null;
}

let cadGeoJsonLayer;
const addGeoJsonLayer = async ()=> {
    if (cadGeoJsonLayer) return;
    let geom = await queryData(svc, cadPrj);
    cadGeoJsonLayer = addGeoJsonData(map, geom);
}

const removeGeoJsonLayer = ()=> {
    if (!cadGeoJsonLayer) return;
    map.removeGeoJSONLayer(cadGeoJsonLayer);
    cadGeoJsonLayer = null;
}
// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{ width: "200px", right: "10px" }}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addWmsLayer()}>Load CAD WMS layer
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => removeWmsLayer()}>Remove CAD WMS layer
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addGeoJsonLayer()}>Load CAD GeoJSON layer
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => removeGeoJsonLayer()}>Remove CAD GeoJSON layer
                    </button>
                </div>
            </div>
        </div>
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