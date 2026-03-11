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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/02olvector
        // --Load VJMap CAD vector tiles with OpenLayers--

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

// Add vector tile layer
let layer = new ol.layer.VectorTile({
    // Vector tile source
    source: new ol.source.VectorTile({
        projection: cadProjection,
        format: new ol.format.MVT(),
        url: svc.vectorTileUrl() // CAD vector tile URL
    }),
    style: createVjMapVectorStyle(ol.style.Style, ol.style.Fill, ol.style.Stroke, ol.style.Circle)
});
// Add layer to map
map.addLayer(layer);

// Create style
function createVjMapVectorStyle(Style, Fill, Stroke, Circle) {
    let fill = new Fill({color: ''});
    let stroke = new Stroke({color: '', width: 1});
    let polygon = new Style({fill: fill});
    let image = new Circle({
        radius: 1,
        fill: new Fill({color: '', }),
    })
    let strokedPolygon = new Style({fill: fill, stroke: stroke});
    let line = new Style({stroke: stroke});
    let circle = new Style({image: image});

    let styles = [];
    return function(feature, resolution) {
        let length = 0;
        let geom = feature.getGeometry().getType();
        // Get color property
        let color = vjmap.entColorToHtmlColor(feature.getProperties().color, svc.currentMapParam().darkMode, feature.getProperties().alpha);
        if (geom == 'Polygon' || geom == 'MultiPolygon') {
            // Polygon
            fill.setColor(color);
            stroke.setColor(color);
            styles[length++] = strokedPolygon;
        } else if (geom == 'LineString' || geom == 'MultiLineString' ) {
            // Line
            stroke.setColor(color);
            let width = feature.getProperties().linewidth;
            if (width > 0) stroke.setWidth(width > 0 ? width : 1);
            styles[length++] = line;
        } else if (geom == 'Point' || geom == 'MultiPoint') {
            // Point
            image.getFill().setColor(color);
            styles[length++] = circle;
        } else {
            console.log(geom)
        }
        styles.length = length;
        return styles;
    };
}

map.on('click', (e) => message.info({content: `Coordinates clicked: ${JSON.stringify(e.coordinate)}`, key: "info", duration: 3}));
// Highlight on hover; use similar code for click-to-select
const enableHighlightLayer = () => {
    let selection = {};
    // Selection style
    const selectedStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(200,20,20,0.8)',
            width: 2,
        }),
        fill: new ol.style.Fill({
            color: 'rgba(200,20,20,0.4)',
        }),
        image: new ol.style.Circle({
            radius: 3,
            fill: new ol.style.Fill({color: 'rgba(200,20,20,0.4)'}),
        })
    });

    // Selection
    const selectionLayer = new ol.layer.VectorTile({
        map: map,
        renderMode: 'vector',
        projection: cadProjection,
        source: layer.getSource(),
        style: function (feature) {
            if (feature.getId() in selection) {
                return selectedStyle;
            }
        },
    });
    map.on(['pointermove'], function (event) {
        layer.getFeatures(event.pixel).then(function (features) {
            if (!features.length) {
                selection = {};
                selectionLayer.changed();
                return;
            }
            const feature = features[0];
            if (!feature) {
                return;
            }
            const fid = feature.getId();
            // add selected feature to lookup
            selection[fid] = feature;
            selectionLayer.changed();

            let content = `feature: ${fid}; layer: ${feature.getProperties().layer}; type: ${feature.getProperties().type}`
            message.info({ content, key: "info", duration: 3});
        });
    });
}
enableHighlightLayer();

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