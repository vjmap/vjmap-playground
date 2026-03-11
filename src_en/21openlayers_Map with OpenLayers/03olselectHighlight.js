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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/03olselectHighlight
        // --Click to highlight entities with OpenLayers--

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
// Get all layers
const cadLayers = svc.getMapLayers();
// Get map bounds
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
let mapPrj = new vjmap.GeoProjection(mapBounds);

// Custom projection
let cadProjection = new ol.proj.Projection({
    code: "cad",
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

map.on('click', async (e) => {
    await highlight_ent(e.coordinate);
});

// GeoJSON for highlight
const geojsonObject = {
    'type': 'FeatureCollection',
    'features': [
    ],
};

const vectorSource = new ol.source.Vector({
    projection: cadProjection, // CAD projection
    features: new ol.format.GeoJSON().readFeatures(geojsonObject, {dataProjection: cadProjection}),
});

const highlightColor = svc.currentMapParam().darkMode ? "#57FFC9" : "#11F";
const image = new ol.style.Circle({
    radius: 3,
    fill: null,
    stroke: new ol.style.Stroke({color: highlightColor, width: 1}),
});

const styles = {
    'Point': new ol.style.Style({
        image: image,
    }),
    'LineString': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: highlightColor,
            width: 2,
        }),
    }),
    'MultiLineString': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: highlightColor,
            width: 2,
        }),
    }),
    'MultiPoint': new ol.style.Style({
        image: image,
    }),
    'MultiPolygon': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: highlightColor,
            width: 2,
        }),
        fill: new ol.style.Fill({
            color: highlightColor,
        }),
    }),
    'Polygon': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: highlightColor,
            width: 2,
        }),
        fill: new ol.style.Fill({
            color: highlightColor,
        }),
    }),
    'Circle': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: highlightColor,
            width: 2,
        }),
        fill: new ol.style.Fill({
            color: highlightColor,
        }),
    }),
};

const styleFunction = function (feature) {
    return styles[feature.getGeometry().getType()];
};

const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: styleFunction,
});
map.addLayer(vectorLayer);



const highlight_ent = async co => {
    vectorSource.clear();
    let res = await svc.pointQueryFeature({
        x: co[0],
        y: co[1],
        zoom: map.getView().getZoom(),
        fields: ""
    }, pt => {
        // Coordinate callback for each point
        return mapPrj.fromMercator(pt);// to CAD coords
    })
    if (res && res.result && res.result.length > 0) {
        let features = [];
        for (let ent of res.result) {
            if (ent.geom && ent.geom.geometries) {
                let clr = vjmap.entColorToHtmlColor(ent.color);
                for (let g = 0; g < ent.geom.geometries.length; g++) {
                    features.push({
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
                // Selection info
                let content = `feature: ${ent.objectid}; layer: ${cadLayers[ent.layerindex].name}; type: ${ent.name}`
                message.info({ content, key: "info", duration: 3});
            }
        }
        geojsonObject.features = features;
        if (geojsonObject.features.length > 0) {
            vectorSource.addFeatures( new ol.format.GeoJSON().readFeatures(geojsonObject, {dataProjection: cadProjection}))
        }
    }
};

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