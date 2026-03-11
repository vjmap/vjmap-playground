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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/08leafletcustommapstyle
        // --Custom map style--Customize map via VJMap backend style

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


// Update style
const expressionList = [] ;// Expression list
const updateStyle = async (style) => {
    let res = await svc.cmdUpdateStyle({
        name: "customStyle2",
        backcolor: 0,
        expression: expressionList.join("\n"),
        ...style
    });
    layer.setUrl(svc.rasterTileUrl());  // VJMap CAD raster tile service URL
}

// Expression syntax reference:
// Server condition query: https://vjmap.com/guide/svrStyleVar.html
// Server render expression: https://vjmap.com/guide/expr.html

// Modify color: r,g,b,a. zoom sets level and above
const modifyColor = (color, zoom) => {
    let result = "";
    let z = Number.isInteger(zoom) ? `[${zoom + 1}]` : '';
    if ("r" in color) result += `gOutColorRed${z}:=${color.r};`;
    if ("g" in color) result += `gOutColorGreen${z}:=${color.g};`;
    if ("b" in color) result += `gOutColorBlue${z}:=${color.b};`;
    if ("a" in color) result += `gOutColorAlpha${z}:=${color.a};`;
    return result;
}

// Modify line width; zoom sets level and above
const modifyLineWidth = (lw, zoom) => {
    let result = "";
    if (lw) {
        if (!Number.isInteger(zoom)) {
            result += `gOutLineWidth:=${lw};`;
        } else {
            result += `gOutLineWidth[${zoom + 1}]:=${lw};`;
        }
    }
    return result;
}

// Modify visibility; zoom sets level and above
const modifyVisible = (visible, zoom) => {
    let result = "";
    if (visible !== undefined) {
        if (!Number.isInteger(zoom)) {
            result += `gOutVisible:=${visible ? 1 : 0};`;
        } else {
            result += `gOutVisible[${zoom + 1}]:=${visible ? 1 : 0};`;
        }
    }
    return result;
}

// Add feature type condition (any match), e.g. ['AcDbPolyline','AcDbText']
const conditionFeatureType = featureTypes => {
    if (!Array.isArray(featureTypes)) featureTypes = [featureTypes];// Ensure array
    return featureTypes.map(featureType => `gInFeatureType=='${featureType}'`).join(" or ");
}

// Add layer condition (any match), e.g. ['Layer1','Layer2']
const conditionLayers = layers => {
    if (!Array.isArray(layers)) layers = [layers];// Ensure array
    return layers.map(layer => `gInLayerName=='${layer}'`).join(" or ");
}

// Add object ID condition (any match), e.g. ['283','285']
const conditionObjectIds = objectIds => {
    if (!Array.isArray(objectIds)) objectIds = [objectIds];// Ensure array
    let strObjectIds = objectIds.join("||");
    return `gInObjectId  in  '${strObjectIds}'`
}
// Add color condition (any match), e.g. [{r:255,g:122,b:100},{r:100}]
const conditionColors = colors => {
    if (!Array.isArray(colors)) colors = [colors];// Ensure array
    return colors.map(color => {
        let result = [];
        if ("r" in color) result.push(`gInColorRed==${color.r}`);
        if ("g" in color) result.push(`gInColorGreen==${color.g}`);
        if ("b" in color) result.push(`gInColorBlue==${color.b}`);
        if ("a" in color) result.push(`gInColorAlpha==${color.a}`);
        return `(${result.join(" and ")})`
    }).join(" or ");
}

// Add bounds condition (any match), e.g. [{width:10,height:20,tol:0.01},{width:300,height:200}]
const conditionBounds = bounds => {
    if (!Array.isArray(bounds)) bounds = [bounds];// Ensure array
    return bounds.map(bound => {
        let result = [];
        if ("width" in bound) result.push(`(abs(gInExtendMaxX-gInExtendMinX-${bound.width})<${bound.tol ? bound.tol: 0.001})`);
        if ("height" in bound) result.push(`(abs(gInExtendMaxY-gInExtendMinY-${bound.height})<${bound.tol ? bound.tol: 0.001})`);
        return `(${result.join(" and ")})`
    }).join(" or ");
}

const updateExpr = async expr => {
    if (expressionList.findIndex(e => e === expr) >= 0) return;// Already added
    expressionList.push(expr);
    await updateStyle();// Update style
}

const setLayerTextColors = async ()=> {
    // Type condition
    let condition1 = conditionFeatureType(["AcDbText", "AcDbMText", "AcDbAttributeDefinition", "AcDbAttribute"]);
    // Layer condition
    let condition2 = conditionLayers("WZ");
    let value = modifyColor({r: 255, g: 0, b: 0});
    let expr = `if((${condition1}) and (${condition2})) {${value}} `;
    await updateExpr(expr);
}

const setObjectsVisible = async () => {
    // objectId
    let condition = conditionObjectIds(["10D#110", "10D#111"]);
    let value1 = modifyVisible(false, 1); // Level 1-3 hidden
    let value2 = modifyVisible(true, 3); // Level 3+ visible
    let expr = `if(${condition}) {${value1} ${value2}} `;
    await updateExpr(expr);
}

const setLineWidth = async () => {
    // Color condition
    let condition = conditionColors([{r: 255, g: 255, b:0}]);
    let value1 = modifyLineWidth(5);
    let value2 = modifyColor({r: 0, g: 255, b: 255, a: 100});
    let expr = `if(${condition}) {${value1} ${value2}} `;
    await updateExpr(expr);
}

const setBoundsColors = async () => {
    // Bounds condition
    let condition = conditionBounds({width: 4000, tol: 20});
    let value = modifyColor({r: 255, g: 0, b: 0});
    let expr = `if(${condition}) {${value}} `;
    await updateExpr(expr);
}

const setZoomLayer = async () => {
    message.info('Zoom map to switch levels and see different layer content')
    let style = {
        // layeroff closes layer indices, layeron opens them per zoom
        layeron:`{
                        "*": "()",
                        "1": "(19,24)",
                        "2": "(19,24,5)",
                        "3-4": "(1,19,24,5,22)",
                        "5": "(1,19,24,5,22,15)",
                        "6-7": "(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,19,22,24)"
                    }`
    }
    await updateStyle(style);
}

// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{width: "185px", right: "10px"}}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setLayerTextColors()}>Set title layer text to red
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setObjectsVisible()}>Hide north arrow (visible at level 3+)
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setLineWidth()}>Recolor, transparency and thicken yellow lines
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setBoundsColors()}>Set circles of given radius to red
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setZoomLayer()}>Show different layers per zoom level
                    </button>
                </div>
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