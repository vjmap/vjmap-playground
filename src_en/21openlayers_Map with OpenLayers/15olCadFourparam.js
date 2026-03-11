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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/15olCadFourparam
        // --Web map with CAD overlay via common points [web as base]--

if (typeof ol !== "object") {
    // If no OpenLayers environment
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}
const layers = [
    new ol.layer.Tile({
        source: new ol.source.OSM(),
    })
];
const map = new ol.Map({
    layers: layers,
    target: 'map',
    view: new ol.View({
        center: vjmap.Projection.lngLat2Mercator([116.4849310885225,  39.960672361810566]),
        zoom: 16,
    }),
});

// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "sys_zp";
let res = await svc.openMap({
    mapid: mapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
let layer = res.layer;// layer name


// CAD points
let cadPoints = [
    vjmap.geoPoint([587464448.8435847, 3104003685.208651,]),
    vjmap.geoPoint([587761927.7224838, 3104005967.655292]),
    vjmap.geoPoint([587463688.0280377, 3103796743.3798513]),
    vjmap.geoPoint([587760406.0913897, 3103793700.1176634])
];


// Web points (WGS84) corresponding to CAD points
let webPoints = [
    vjmap.geoPoint([116.48476281710168, 39.96200739703454]),
    vjmap.geoPoint([116.48746772021137, 39.96022062215167]),
    vjmap.geoPoint([116.48585059441585, 39.9588451134361]),
    vjmap.geoPoint([116.48317418949145, 39.960515760972356])
]


// Compute four-parameter transform
let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , false); // consider rotation
let fourparam = [param.dx, param.dy, param.scale, param.rotate]

// WMS layer URL
const getCadWmsUrl = (transparent) => {
    let wmsUrl = svc.wmsTileUrl({
        mapid: mapId, // map id
        layers: layer, // layer name
        bbox: '', // bbox not needed
        fourParameter: fourparam,
        transparent: transparent,
        backgroundColor: 'rgba(240, 255, 255)' // used when opaque
    })
    return wmsUrl
}

let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let cadPrj = new vjmap.GeoProjection(mapBounds);


// CAD to 3857 coords
const cadToWebCoordinate = point => {
    // Inverse four-param to get web coords
    return vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(point), param)
}
// 3857 to CAD coords
const webToCadCoordinate = point => {
    return vjmap.coordTransfromByFourParamter(vjmap.geoPoint(point), param)
}
let VisibleBounds = mapBounds.scale(0.4);
let pt1 =  cadToWebCoordinate([VisibleBounds.min.x, VisibleBounds.min.y])
let pt2 =  cadToWebCoordinate([VisibleBounds.min.x, VisibleBounds.max.y])
let pt3 =  cadToWebCoordinate([VisibleBounds.max.x, VisibleBounds.max.y])
let pt4 =  cadToWebCoordinate([VisibleBounds.max.x, VisibleBounds.min.y])
// Compute CAD extent
let bounds = vjmap.GeoBounds.fromDataExtent([pt1, pt2, pt3, pt4])


let wmsLayer;
const addWmsLayer = async (transparent)=> {
    removeWmsLayer();
    let wmsUrl = getCadWmsUrl(transparent);
    wmsLayer = new ol.layer.Tile({
        // extent
        extent: bounds.toArray(),
        source: new ol.source.TileWMS({
            url: wmsUrl,
            params: {'TILED': true}
        }),
    });
    // Add WMS layer to map
    map.addLayer(wmsLayer);
}

const removeWmsLayer = ()=> {
    if (!wmsLayer) return;
    map.removeLayer(wmsLayer);
    wmsLayer = null;
}

let cadGeoJsonLayer;
let cadGeoJsonData
const addGeoJsonLayer = async ()=> {
    if (cadGeoJsonLayer) return;
    if (!cadGeoJsonData) {
        cadGeoJsonData = await queryData(svc, cadPrj);
    }
    cadGeoJsonLayer = addGeoJsonData(map, cadGeoJsonData);
}

const removeGeoJsonLayer = ()=> {
    if (!cadGeoJsonLayer) return;
    map.removeLayer(cadGeoJsonLayer);
    cadGeoJsonLayer = null;
}

function addGeoJsonData(map, data) {

    const image = new ol.style.Circle({
        radius: 3,
        fill: null,
        stroke: new ol.style.Stroke({color: 'yellow', width: 1}),
    });

    const styles = {
        'Point': new ol.style.Style({
            image: image,
        }),
        'LineString': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'green',
                width: 1,
            }),
        }),
        'Polygon': new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'red',
            }),
        })
    };

    const styleFunction = function (feature) {
        let style = styles[feature.getGeometry().getType()];
        const color = feature.get('color');
        if (style.getFill()) {
            style.getFill().setColor(color);
        }
        if (style.getStroke()) {
            style.getStroke().setColor(color);
        }
        return style;
    };

    const vectorSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(data),
    });


    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleFunction,
    });

    map.addLayer(vectorLayer);
    return vectorLayer;
}

async function queryData(svc, cadPrj) {
    message.info("Loading data, please wait...")
    let res = await svc.conditionQueryFeature({
        condition: `1 == 1`, // SQL where condition
        fields: "",
        includegeom: true, // return geometry
        realgeom: true,
        limit: 100000 // max records; default 100
    }, pt => {
        // Coordinate callback for each point
        let cadPoint = cadPrj.fromMercator(pt);// to CAD coords
        let webPoint = cadToWebCoordinate(cadPoint); // CAD to Mercator
        return [webPoint.x, webPoint.y];
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

// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{ width: "230px", right: "10px" }}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addWmsLayer(true)}>Add CAD transparent WMS layer
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addWmsLayer(false)}>Add CAD opaque WMS layer
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => removeWmsLayer()}>Remove CAD WMS layer
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addGeoJsonLayer()}>Add CAD GeoJSON layer
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