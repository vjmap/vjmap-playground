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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/10olfindtextdrawbounds
        // --Query all text and draw bounds--

// OpenLayers: https://openlayers.org/ | https://github.com/openlayers/openlayers
if (typeof ol !== "object") {
    // If no OpenLayers environment
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}
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
// Get map bounds
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let mapPrj = new vjmap.GeoProjection(mapBounds);

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
        zoom: 2// initial zoom
    })
});

// Add tile layer
let layer = new ol.layer.Tile({
    // Tile source
    source: new ol.source.TileImage({
        url: svc.rasterTileUrl() // CAD raster tile URL
    })
});
// Add layer to map
map.addLayer(layer);

map.on('click', (e) => message.info({content: `Coordinates clicked: ${JSON.stringify(e.coordinate)}`, key: "info", duration: 3}));


// Entity type ID and name mapping
const { entTypeIdMap } = await svc.getConstData();
const getTypeNameById = name => {
    for(let id in entTypeIdMap) {
        if (entTypeIdMap[id] == name) {
            return id
        }
    }
}
const queryTextAndDrawBounds = async () => {
    let queryTextEntTypeId = getTypeNameById("AcDbText"); // single-line text
    let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // multi-line text
    let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // attribute def
    let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // attribute
    let query = await svc.conditionQueryFeature({
        condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // SQL where condition
        fields: "",
        limit: 100000 // max records; default 100
    }, pt => {
        // Coordinate callback for each point
        return mapPrj.fromMercator(pt);// to CAD coords
    })
    if (query.error) {
        message.error(query.error)
    } else {
        message.info(`Matched records: ${query.recordCount}`)

        if (query.recordCount > 0) {
            let features = [];
            for(var i = 0; i < query.recordCount; i++) {
                let bounds = vjmap.getEnvelopBounds(query.result[i].envelop, mapPrj);
                let clr = vjmap.entColorToHtmlColor(query.result[i].color); // entity color to HTML

                features.push({
                    type: "Feature",
                    properties: {
                        name: "objectid:" + query.result[i].objectid,
                        color: clr
                    },
                    geometry: {
                        'type': 'Polygon',
                        'coordinates': [
                            bounds.toPointArray(),
                        ],
                    }
                })
            }

            if (!vectorSource) {
                // Add highlight layer if not exists
                addHighLightLayer();
            }
            vectorSource.clear();
            let geojsonObject = {
                'type': 'FeatureCollection',
                'features': features
            }
            // Update vector source
            vectorSource.addFeatures( new ol.format.GeoJSON().readFeatures(geojsonObject, {dataProjection: cadProjection}))
        }
    }
}

let vectorSource;
const addHighLightLayer = ()=> {
    // GeoJSON for highlight
    const geojsonObject = {
        'type': 'FeatureCollection',
        'features': [
        ],
    };
    vectorSource = new ol.source.Vector({
        projection: cadProjection, // CAD projection
        features: new ol.format.GeoJSON().readFeatures(geojsonObject, {dataProjection: cadProjection}),
    });

    const styles = {
        'Polygon': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: "#FF48AA",
                width: 2,
            }),
            fill: new ol.style.Fill({
                color: "#FF48AA40"
            }),
        })
    };

    const styleFunction = function (feature) {
        return styles[feature.getGeometry().getType()];
    };

    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleFunction,
    });
    map.addLayer(vectorLayer);
}

const App = () => {
    const handleClick = async () => {
        queryTextAndDrawBounds()
    };
    return (
        <div>
            <div className="info ">
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0" onClick={handleClick}>Query all text and draw bounds</button>
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