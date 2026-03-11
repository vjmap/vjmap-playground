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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/08olcustommapstyle
        // --Custom map style via backend style data--

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
        zoom: 2 // initial zoom
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

// Update style
const expressionList = [] ;// expression array
const updateStyle = async (style) => {
    let res = await svc.cmdUpdateStyle({
        name: "customStyle2",
        backcolor: 0,
        expression: expressionList.join("\n"),
        ...style
    });
    let source = layer.getSource();
    // Update tile URL
    source.setUrl(svc.rasterTileUrl());
    // Refresh
    source.refresh();
}

// See server condition/expression: https://vjmap.com/guide/svrStyleVar.html
// See server render expression: https://vjmap.com/guide/expr.html

// Modify color: r,g,b,a; optional zoom sets level and above
const modifyColor = (color, zoom) => {
    let result = "";
    let z = Number.isInteger(zoom) ? `[${zoom + 1}]` : '';
    if ("r" in color) result += `gOutColorRed${z}:=${color.r};`;
    if ("g" in color) result += `gOutColorGreen${z}:=${color.g};`;
    if ("b" in color) result += `gOutColorBlue${z}:=${color.b};`;
    if ("a" in color) result += `gOutColorAlpha${z}:=${color.a};`;
    return result;
}

// Modify line width; optional zoom sets level and above
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

// Modify visibility; optional zoom sets level and above
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

// Entity type condition, e.g. ['AcDbPolyline','AcDbText']
const conditionFeatureType = featureTypes => {
    if (!Array.isArray(featureTypes)) featureTypes = [featureTypes];
    return featureTypes.map(featureType => `gInFeatureType=='${featureType}'`).join(" or ");
}

// Layer condition, e.g. ['Layer1','Layer2']
const conditionLayers = layers => {
    if (!Array.isArray(layers)) layers = [layers];
    return layers.map(layer => `gInLayerName=='${layer}'`).join(" or ");
}

// ObjectId condition, e.g. ['283','285']
const conditionObjectIds = objectIds => {
    if (!Array.isArray(objectIds)) objectIds = [objectIds];
    let strObjectIds = objectIds.join("||");
    return `gInObjectId  in  '${strObjectIds}'`
}
// Color condition, e.g. [{r:255,g:122,b:100}]
const conditionColors = colors => {
    if (!Array.isArray(colors)) colors = [colors];
    return colors.map(color => {
        let result = [];
        if ("r" in color) result.push(`gInColorRed==${color.r}`);
        if ("g" in color) result.push(`gInColorGreen==${color.g}`);
        if ("b" in color) result.push(`gInColorBlue==${color.b}`);
        if ("a" in color) result.push(`gInColorAlpha==${color.a}`);
        return `(${result.join(" and ")})`
    }).join(" or ");
}

// Bounds condition, e.g. [{width:10,height:20,tol:0.01}]
const conditionBounds = bounds => {
    if (!Array.isArray(bounds)) bounds = [bounds];
    return bounds.map(bound => {
        let result = [];
        if ("width" in bound) result.push(`(abs(gInExtendMaxX-gInExtendMinX-${bound.width})<${bound.tol ? bound.tol: 0.001})`);
        if ("height" in bound) result.push(`(abs(gInExtendMaxY-gInExtendMinY-${bound.height})<${bound.tol ? bound.tol: 0.001})`);
        return `(${result.join(" and ")})`
    }).join(" or ");
}

const updateExpr = async expr => {
    if (expressionList.findIndex(e => e === expr) >= 0) return;// already added
    expressionList.push(expr);
    await updateStyle();// update style
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
    let value1 = modifyVisible(false, 1); // level 1-3 invisible
    let value2 = modifyVisible(true, 3); // level 3+ visible
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
    message.info('Zoom in and switch levels to see different layer content')
    let style = {
        // layeroff/layeron control layer visibility per zoom
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
                            onClick={() => setLayerTextColors()}>Make WZ layer text red
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setObjectsVisible()}>Hide north arrow (visible at level 3+)
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setLineWidth()}>Yellow lines: thicker, cyan, transparent
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setBoundsColors()}>Red circle at specified radius
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setZoomLayer()}>Different layers at different zoom levels
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