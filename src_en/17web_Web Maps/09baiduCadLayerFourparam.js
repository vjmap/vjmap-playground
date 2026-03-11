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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/09baiduCadLayerFourparam
        // --Load CAD map in Baidu SDK by control points--
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

var map = new BMapGL.Map("map", {
    maxZoom: 24
});
var point = new BMapGL.Point(116.49749690241316, 39.96795950710483);
map.centerAndZoom(point, 17);
map.enableScrollWheelZoom(true);     // Enable scroll wheel zoom

// Map service
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "sys_zp";
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


// CAD control points
let cadPoints = [
    vjmap.geoPoint([587464448.8435846, 3104003685.208661,]),
    vjmap.geoPoint([587761927.7224838, 3104005967.655292]),
    vjmap.geoPoint([587463688.0280377, 3103796743.3798513]),
    vjmap.geoPoint([587760406.0913897, 3103793700.1176634])
];


// Web control points (Baidu) corresponding to above
let webPoints = [
    vjmap.geoPoint([116.49738632967344,39.969244215079016]),
    vjmap.geoPoint([116.50000171663382,39.96753915494187]),
    vjmap.geoPoint([116.49843968869915,39.96613594214925]),
    vjmap.geoPoint([116.49581440721418,39.967790723887404])
]

// Four-param from control points
let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.transform.convert(w, vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.EPSG3857)));
let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , false); // With rotation
let fourparam = [param.dx, param.dy, param.scale, param.rotate]

// WMS layer URL
const getCadWmsUrl = (transparent) => {
    let wmsUrl = svc.wmsTileUrl({
        mapid: mapId, // Map id
        layers: layer, // Layer name
        bbox: '', // bbox not needed
        srs: "EPSG:3857", //
        fourParameter: fourparam,
        transparent: transparent,
        backgroundColor: 'rgba(240, 255, 255)' // When not transparent
    })
    return wmsUrl
}


let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let cadPrj = new vjmap.GeoProjection(mapBounds);


// CAD to web WGS84
const cadToWebCoordinate = point => {
    // Inverse four-param: CAD to 3857
    let epsgPoint = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(point), param)
    // 3857 to 4326
    return vjmap.Projection.mercator2LngLat(epsgPoint);
}

// Use Baidu SDK to convert WGS84 to Baidu coordinate
const wgs84ToBd09 = async pointArr => {
    return new Promise((resolve, reject) => {
        let translateCallback = function (data){
            if (data.status === 0) {
                resolve(data.points)
            } else {
                reject(data)
            }
        }
        let convertor = new BMapGL.Convertor();
        convertor.translate(pointArr, COORDINATES_WGS84, COORDINATES_BD09,  translateCallback)
    })
}
// Baidu to web WGS84 to CAD coordinate
const webTocadCoordinate = point => {
    // Baidu to 3857
    let co = vjmap.transform.convert(point, vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.EPSG3857)
    // 3857 via four-param to CAD
    return vjmap.coordTransfromByFourParamter(vjmap.geoPoint(co), param)
}

async function queryData(svc, cadPrj) {
    message.info("Loading data, please wait...")
    let res = await svc.conditionQueryFeature({
        condition: `1 == 1`, // SQL WHERE condition, see server query docs
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
        let idx = 0;
        let features = [];
        for (let ent of res.result) {
            if (ent.geom && ent.geom.geometries) {
                let clr = vjmap.entColorToHtmlColor(ent.color);
                for (let g = 0; g < ent.geom.geometries.length; g++) {
                    features.push({
                        id: idx++,
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
                icon: new BMapGL.Icon("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAAMSURBVBhXY2BgYAAAAAQAAVzN/2kAAAAASUVORK5CYII=", new BMapGL.Size(1, 1))
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
    map.addGeoJSONLayer(cadLayer, {
        maxZoom: 24
    });
    function resetGeoLayer() {
        cadLayer && cadLayer.resetStyle();
    }
    return cadLayer;
}


let wmsLayer;
const addWmsLayer = async (transparent)=> {
    removeWmsLayer();
    // tileUrlTemplate contains OGC WMS GetMap params
    wmsLayer = BMapGL.XYZLayer({
        useThumbData: true,
        transparentPng: false,
        tileUrlTemplate: getCadWmsUrl(transparent) + '&BBOX=[b] '
    });
    map.addTileLayer(wmsLayer);
    wmsLayer.setZIndexTop();

    if (!transparent) {
        // If not transparent, add mask so blank area is hidden
        let boundary = [[587455886.1376927,3104009909.769687],[587774984.5609306,3104009909.769687],[587774984.5609306,3103786792.3276925],[587455796.0465667,3103786792.3276925],[587455886.1376927,3104009909.769687 ]];
        let b = boundary.map(b => cadToWebCoordinate(b));
        //boundary = await wgs84ToBd09(b);
        boundary = b.map(p => vjmap.transform.convert(p, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.BD09))
        b = boundary.map(p => p[0] + ", " + p[1]).join(';');
        wmsLayer.addBoundary(b); // Add mask
    }

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
            <div className="info" style={{ width: "230px", right: "10px" }}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addWmsLayer(true)}>Load CAD transparent WMS layer
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addWmsLayer(false)}>Load CAD opaque WMS layer
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