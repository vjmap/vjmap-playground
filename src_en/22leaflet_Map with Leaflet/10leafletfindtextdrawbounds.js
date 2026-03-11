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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/10leafletfindtextdrawbounds
        // --Query all text in map and draw bounds--

// Leaflet website: https://leafletjs.com/
// Leaflet source: https://github.com/Leaflet/Leaflet
if (typeof L !== "object") {
    // If no Leaflet environment
    await vjmap.addScript([{
        src: "../../js/leaflet2.0/leaflet.js"
    },{
        src: "../../js/leaflet2.0/leaflet.css"
    }]);
}

// Map service object, open map via VJMap service, get map metadata
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

// Create geo projection from map bounds
let CadCRS = L.Class.extend({
    includes: L.CRS.Simple,
    initialize: function (bounds) {
        // Current CAD map bounds
        this.bounds = bounds;
        // Projection
        this.projection = L.Projection.LonLat;
        // Calculate resolution
        let r = (256 / Math.abs(this.bounds.getEast() - this.bounds.getWest()));
        // Set transformation params: affine transform coefficients a,b,c,d for (x,y)->(ax+b,cy+d) and inverse
        this.transformation = new L.Transformation(r, -r * this.bounds.getWest(),  - r,  r * this.bounds.getNorth());
    }
});

// Leaflet uses reversed coords: use [y,x] with L.latLng for [x,y], see https://leafletjs.com/examples/crs-simple
// https://leafletjs.com/examples/crs-simple/crs-simple.html
L.XY = function(x, y) {
    if (L.Util.isArray(x)) {    // When doing XY([x, y]);
        return L.latLng(x[1], x[0]);
    }
    return L.latLng(y, x);  // When doing XY(x, y);
};

// Current CAD map bounds
let bounds = new L.LatLngBounds([L.XY(mapBounds.min.toArray()), L.XY(mapBounds.max.toArray())]);
let center = mapBounds.center(); // Map center

// Create Leaflet map object
let map = L.map('map', {
    // CRS
    crs: new CadCRS(bounds),
    attributionControl: false
}).setView(L.XY([center.x, center.y]), 2); // Set initial center and zoom
// If using L.latLng, swap x,y e.g.
// map.setView(L.latLng([center.y, center.x]), 2);

// Add raster tile layer
let layer = L.tileLayer(
    svc.rasterTileUrl(),  // VJMap CAD raster tile service URL
    {
        bounds: bounds // Current CAD map bounds
    }
).addTo(map);
// Add layer to map
layer.addTo(map);

document.getElementById("map").style.background = "#ffffff00"; // Set map bg transparent to use page bg
map.on('click', (e) => message.info({content: `Coordinates clicked: ${e.latlng.lng}, ${e.latlng.lat}}`, key: "info", duration: 3}));


// Entity type ID to name mapping
const { entTypeIdMap } = await svc.getConstData();
const getTypeNameById = name => {
    for(let id in entTypeIdMap) {
        if (entTypeIdMap[id] == name) {
            return id
        }
    }
}

let highlightLayer; // Highlight layer
const queryTextAndDrawBounds = async () => {
    if (highlightLayer) {
        highlightLayer.remove(); // Remove previous highlight layer
        highlightLayer = null;
    }
    let queryTextEntTypeId = getTypeNameById("AcDbText"); // Single-line text
    let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // Multi-line text
    let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // Attribute def
    let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // Attribute
    let query = await svc.conditionQueryFeature({
        condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // SQL WHERE clause, see server condition query docs
        fields: "",
        limit: 100000 // Large limit to get all; default is 100
    }, pt => {
        // Coordinate callback for each queried point
        return mapPrj.fromMercator(pt);// Convert to CAD coordinates
    })
    if (query.error) {
        message.error(query.error)
    } else {
        message.info(`Found ${query.recordCount} matching records`)

        if (query.recordCount > 0) {
            let features = [];
            for(var i = 0; i < query.recordCount; i++) {
                let bounds = vjmap.getEnvelopBounds(query.result[i].envelop, mapPrj);
                let clr = vjmap.entColorToHtmlColor(query.result[i].color); // Entity color to HTML

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


            let data = {
                type: "FeatureCollection",
                features: features
            }
            if (data.features.length > 0) {
                highlightLayer = L.geoJSON(data, {
                    style: function (feature) {
                        return {color: "#FF6EA0", fillColor: "#FF6EA0", fillOpacity: 0.4}; // feature.properties.color
                    }
                })
                highlightLayer.addTo(map);
            }
        }
    }
}


const App = () => {
    const handleClick = async () => {
        queryTextAndDrawBounds()
    };
    return (
        <div>
            <div className="info ">
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0" onClick={handleClick}>Click to query all text and draw bounds</button>
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