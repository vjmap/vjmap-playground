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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoVectorContour
        // --Contour/isosurface analysis--Generate contours or isosurfaces from coordinates and attributes
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: "sys_world", // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
// Get map bounds
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
// Create geo projection from map bounds
let prj = new vjmap.GeoProjection(mapExtent);

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterStyle(), // style, raster style here
    center:  prj.toLngLat(mapExtent.center()), // set map center
    zoom: 2, // set map zoom level
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
map.doubleClickZoom.disable(); // Disable double-click zoom
let mapBounds = map.getGeoBounds(0.4);
await map.onLoad();

// Add mouse position control
const mousePositionControl = new vjmap.MousePositionControl({
    labelFormat: (lng, lat, x, y)=> {
        return  `lng:${lng.toFixed(6 )},lat:${lat.toFixed(6)};`;
    }
});
map.addControl(mousePositionControl, "bottom-left");

map.setRasterOpacity(svc.rasterLayerId(), 0.4);

// Generate test data
let dataBounds = await svc.cmdGetDrawBounds(); // Get map data bounds
let isClipContour = false; // Whether to clip contours
let clipBounds = dataBounds.scale(0.5); // Clip extent (default half of bounds); use vjmap.GeoBounds.fromArray([x1,y1,x2,y2]) for custom

// To hide border initially, use smaller clip extent
//isClipContour = true; // Clip contours
//clipBounds = dataBounds.scale(0.9999);

let extent = map.toLngLat(dataBounds).toArray();
// Omit if extent auto-generated from data
let pt1 = extent[0];
let pt2 = extent[1];
extent = [pt1[0], pt1[1], pt2[0], pt2[1]];

let dataMinValue = 10; // Min value
let dataMaxValue = 500; // Max value
let dataset = {
    "type" : "FeatureCollection",
    "features" : []
};

// Color scale
let colors = ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf","#fee08b",
    "#fdae61", "#f46d43", "#d73027", "#a50026"];

for (let i = 0; i < 100; i++) {
    let feature={
        "type" : "Feature",
        "properties" : {
            "value" : vjmap.randInt(dataMinValue, dataMaxValue) // Random test data in range
        },
        "geometry" : {
            "type" : "Point",
            "coordinates" : map.toLngLat(mapBounds.randomPoint())
        }
    };
    dataset.features.push(feature);
}

/* For custom data, see example below:
let list = [
    { name: '1', coordinateX:  4983.743653922847, coordinateY: 15416.30519881966, value: 671.139 },
    { name: '2', coordinateX: 20940.3830161238, coordinateY: 15275.718067875001, value: 926.95 },
    { name: '3', coordinateX: 8287.541231118597, coordinateY: 8597.829348010353, value: 760.66 },
    { name: '4', coordinateX: 18550.40179006735, coordinateY: 3958.454026841191, value: 866.43 },
    { name: '5', coordinateX:  24455.06128973639, coordinateY: 9019.590740843836, value: 723.51 }
];
dataset.features = [];
for (let i = 0; i < list.length; i++) {
    if (i == 0) {
        dataMinValue = list[i].value;
        dataMaxValue = list[i].value;
    } else {
        if (list[i].value < dataMinValue) dataMinValue = list[i].value;
        if (list[i].value > dataMaxValue) dataMaxValue = list[i].value;
    }
    let feature={
        "type" : "Feature",
        "properties" : {
            "value" : list[i].value // Use custom value
        },
        "geometry" : {
            "type" : "Point",
            "coordinates" : map.toLngLat([list[i].coordinateX,list[i].coordinateY])
        }
    };
    dataset.features.push(feature);
}
*/

let contoursSize = 20; // Contour interval count (higher = denser)
let variog;
let curModel = 'exponential'; // Model: exponential, gaussian, or spherical
let curAlpha = 100; // Alpha value
const createContour = async (dataset, contoursSize, propField, colors, dataMinValue, dataMaxValue, maxHeight, model, alpha) => {
    let contours = [];
    for(let i = 0; i < contoursSize; i++) {
        contours.push(dataMinValue + (dataMaxValue - dataMinValue) * i /  (contoursSize - 1));
    }
    if (dataMinValue >= 10 && dataMaxValue > 100) {
        // Round contour values to 10
        for(let i = 0; i < contours.length; i++) {
            contours[i] = (parseInt(contours[i]/10) * 10);
        }
    }

    let interpolateInput = [], interpolateOutput = [];
    for(let i = 0; i < colors.length; i++) {
        interpolateInput.push(i / (colors.length - 1)); // Input 0-1 ratio
        interpolateOutput.push(colors[i]) // Output color
    }

    // Run contour in WebWorker
    let createContourWorker = vjmap.WorkerProxy(vjmap.vectorContour);
    let { grid, contour, variogram } = await createContourWorker(map.fromLngLat(dataset), propField, contours, {
        model: model || 'exponential', // exponential, gaussian, or spherical
        sigma2:0, // Gaussian process variance (usually 0)
        alpha: alpha || 100, // Prior for variance; lower = larger range
        extent: map.fromLngLat(vjmap.GeoBounds.fromArray(extent)).toArray(), // Omit if extent auto-generated from data
        width: 500 // Contour grid width in pixels (larger = more precise, slower)
    }, []);
    contour = map.toLngLat(contour);
    variog = variogram;

    // Interpolate color by ratio
    const mapProgressToValues = value => vjmap.interpolate(
        interpolateInput,
        interpolateOutput,
        { ease: vjmap.linear }
    )(value)

    // Set colors on original data for markers
    dataset.features.forEach(f => f.properties.color = mapProgressToValues((f.properties.value - dataMinValue) / (dataMaxValue - dataMinValue)))

    let h = maxHeight; // Max extrusion height
    for(let i = 0; i < contour.features.length; i++) {
        let prop = contour.features[i].properties;
        let r = (prop.value - dataMinValue) / (dataMaxValue - dataMinValue);
        prop.color = mapProgressToValues(r); // Interpolate color
        prop.height = h * r; // Interpolate height
    }
    return contour;
}


let maxHeight = map.pixelToHeight(100, map.getZoom()); // Max extrusion height
let contour = await createContour(dataset, contoursSize, "value" /* GeoJSON property for contour */, colors, dataMinValue, dataMaxValue, maxHeight, curModel, curAlpha);
contour.features.forEach(f => {
    f.properties.formatValue = Math.round(f.properties.value) // Formatted label value
})

let markers = null;
const addMarkers = ()=> {
    if (markers) return;
    markers = dataset.features.map(f => {
        if (isClipContour && !clipBounds.contains(map.fromLngLat(f.geometry.coordinates))) {
            // Skip markers outside clip bounds
            return null;
        }
        // Random marker styles
        let _marker = new vjmap.DiffusedApertureMarker({
            lngLat: f.geometry.coordinates,
            text: f.properties.value.toFixed(0)
        }, {
            // Customize width, color, font, etc.
            width: 10,
            colors: [f.properties.color, vjmap.randomColor()],
            textFontSize: 14,
            textColor: f.properties.color
        }).createMarker();
        _marker.addTo(map)
        return _marker
    })
}
const removeMarkers = ()=> {
    if (!markers) return;
    for(let i = markers.length - 1; i >= 0; i--) {
        if (markers[i]) markers[i].remove();
    }
    markers = null;
}

let symbols = null;
const addSymbols = async ()=> {
    if (symbols) return;
    let contourData = contour;
    if (isClipContour) contourData = clipContours(contour, clipBounds);

    // Add text background image matching map background
    await map.addImageData("imgMaskText", `<svg viewBox="0 0 1024 1024" width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0L0 1024 1024 1024 1024 0z"  fill="#022B4F"></path>
            </svg>`, 30, 15);
    symbols = new vjmap.Symbol({
        data: contourData,
        iconImage: "imgMaskText",
        symbolSpacing: 250, // Symbol spacing in pixels
        textField:  [
            'format',
            ["to-string", ['round', ['get', 'value']]], // Round value for display; for decimals use ['number-format',['get', 'value'], { 'min-fraction-digits': 1, 'max-fraction-digits': 1 }],
            {}
        ],
        textFont: ['Arial Unicode MS Regular'],
        textSize: 14,
        textColor: '#00ffff',
        symbolPlacement: "line",
        textAnchor: 'center',
        textRotationAlignment: "map",
        iconAllowOverlap: false,
        textAllowOverlap: false
    });
    symbols.addTo(map);
}

const removeSymbols = ()=> {
    if (!symbols) return;
    symbols.remove();
    symbols = null;
}

let polyline = null;
const addPolyline = ()=> {
    if (polyline) return;
    let contourData = contour;
    if (isClipContour) contourData = clipContours(contour, clipBounds);
    polyline = new vjmap.Polyline({
        data: contourData,
        lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00ffff', ['get', 'color']],
        isHoverPointer: true,
        isHoverFeatureState: true
    });
    polyline.addTo(map);
    polyline.clickPopup(f => `<h3>Value: ${f.properties.value.toFixed(2)}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });

}
const removePolyline = ()=> {
    if (!polyline) return;
    polyline.remove();
    polyline = null;
    removeSymbols();
}
const drawPolyline = () => {
    addPolyline();
    removeSymbols();
    addSymbols();
}

let polygon = null;
const addPolygon = ()=> {
    if (polygon) return;
    let contourData = contour;
    if (isClipContour) contourData = clipContoursPolygon(contour, clipBounds);
    polygon = new vjmap.Polygon({
        data: contourData,
        fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00ffff', ['get', 'color']],
        fillOpacity: 0.9,
        isHoverPointer: true,
        isHoverFeatureState: true
    });
    polygon.addTo(map);
    polygon.clickPopup(f => `<h3>Value: ${f.properties.value.toFixed(2)}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
}
const removePolygon = ()=> {
    if (!polygon) return;
    polygon.remove();
    polygon = null;
    removeSymbols();
}

const drawPolygon = () => {
    addPolygon();
    removeSymbols();
    addSymbols();
}

let fillExtrusions = null;
const addFillExtrusion = ()=> {
    if (fillExtrusions) return;
    fillExtrusions = new vjmap.FillExtrusion({
        data: contour,
        fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00ffff', ['get', 'color']],
        fillExtrusionOpacity: 0.9,
        fillExtrusionHeight: ['get', 'height'],
        fillExtrusionBase:0,
        isHoverPointer: true,
        isHoverFeatureState: true
    });
    fillExtrusions.addTo(map);
    fillExtrusions.clickPopup(f => `<h3>Value: ${f.properties.value.toFixed(2)}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
}
const removeFillExtrusion = ()=> {
    if (!fillExtrusions) return;
    fillExtrusions.remove();
    fillExtrusions = null;
    removeSymbols();
}

const drawFillExtrusion = ()=> {
    addFillExtrusion();
    removeSymbols();
    addSymbols();
}

let clipPolyline = null;
const addClipPolyline = () => {
    if (clipPolyline) return;
    let points = clipBounds.toPointArray();
    points.push(points[0]);
    clipPolyline = new vjmap.Polyline({
        data: map.toLngLat(points),
        lineWidth: 2,
        lineColor: 'red'
    });
    clipPolyline.addTo(map);
}
const removeClipPolyline = ()=> {
    if (!clipPolyline) return;
    clipPolyline.remove();
    clipPolyline = null;
}



const refresh = async ()=> {
    contour = await createContour(dataset, contoursSize, "value" /* GeoJSON property for contour */, colors, dataMinValue, dataMaxValue, maxHeight, curModel, curAlpha);
    contour.features.forEach(f => {
        f.properties.formatValue = Math.round(f.properties.value) // Formatted label value
    })
    setNoClipContour();
    if (markers) {
        removeMarkers();
        addMarkers();
    }
    if (polyline) {
        polyline.setData(contour)
    }
    if (symbols) {
        symbols.setData(contour)
    }
    if (polygon) {
        polygon.setData(contour)
    }
    if (fillExtrusions) {
        fillExtrusions.setData(contour)
    }
}

const mockDataChange = async ()=> {
    dataset.features.forEach(f => f.properties.value = vjmap.randInt(dataMinValue, dataMaxValue));
    refresh();
}

// Clip polylines by extent
const clipContours = (polylineData, clipBounds) => {
    let data = {
        type: 'FeatureCollection',
        features: []
    }
    for(let k = 0; k < polylineData.features.length; k++) {
        // Iterate each sub-polygon
        for(let n = 0; n < polylineData.features[k].geometry.coordinates.length; n++) {
            let coordinates = map.fromLngLat(polylineData.features[k].geometry.coordinates[n]);
            // Clip each segment by extent
            let clipCoordinates = [];
            let clipSubCoordinates = [];
            for(let j = 1; j < coordinates.length; j++) {
                let p1 = vjmap.geoPoint(coordinates[j - 1]);
                let p2 = vjmap.geoPoint(coordinates[j]);
                let res = vjmap.clipSegment(p1, p2, clipBounds);
                if (res === false) {
                    // Outside extent: split segment
                    if (clipSubCoordinates.length > 0) {
                        clipCoordinates.push(map.toLngLat(clipSubCoordinates));
                        clipSubCoordinates = [];
                    }
                    continue;
                }
                let pt1 = [res[0].x, res[0].y];
                let pt2 = [res[1].x, res[1].y];
                clipSubCoordinates.push(pt1, pt2);
            }
            if (clipSubCoordinates.length > 0) {
                clipCoordinates.push(map.toLngLat(clipSubCoordinates));
            }
            if (clipCoordinates.length > 0) {
                for(let i = 0; i < clipCoordinates.length; i++) {
                    let feature = vjmap.cloneDeep(polylineData.features[k]);
                    feature.geometry.type = "LineString" ;// Polygon to LineString
                    feature.geometry.coordinates = clipCoordinates[i];
                    data.features.push(feature);
                }
            }
        }
    }
    return data
}

// Clip polygon by extent
const clipContoursPolygon = (polygonData, clipBounds) => {
    let data = {
        type: 'FeatureCollection',
        features: []
    }
    for (let k = 0; k < polygonData.features.length; k++) {
        // Iterate each sub-polygon
        for (let n = 0; n < polygonData.features[k].geometry.coordinates.length; n++) {
            let feature = vjmap.cloneDeep(polygonData.features[k]);
            feature.geometry.coordinates = []
            let coordinates = map.fromLngLat(polygonData.features[k].geometry.coordinates[n]);
            let clipCoordinates = vjmap.clipPolygon(coordinates, clipBounds)
            if (clipCoordinates.length > 2) {
                clipCoordinates.push(clipCoordinates[0]); // Close
                feature.geometry.coordinates.push(map.toLngLat(clipCoordinates));
                feature.properties.area = vjmap.calcPolygonArea(clipCoordinates)
                data.features.push(feature)
            }
        }
    }
    // Sort by area (larger first) so small polygons render on top
    data.features = data.features.sort((a, b) => b.properties.area - a.properties.area)
    return data
}


const setClipContour = () => {
    isClipContour = true;
    removeMarkers();
    addMarkers();
    removePolyline();
    removePolygon();
    addPolyline();
    removeSymbols();
    addSymbols();
    addClipPolyline();
}

const setNoClipContour = () => {
    if (!isClipContour) {
        return
    }
    isClipContour = false;
    removeMarkers();
    addMarkers();
    removePolyline();
    addPolyline();
    removeSymbols();
    addSymbols();
    removeClipPolyline();
}

const setClipContourPolygon = () => {
    isClipContour = true;
    removeMarkers();
    addMarkers();
    removePolyline();
    removePolygon();
    addPolygon();
    removeSymbols();
    addSymbols();
    addClipPolyline();
}

const setNoClipContourPolygon = () => {
    isClipContour = false;
    removeMarkers();
    addMarkers();
    removePolyline();
    removePolygon();
    addPolygon();
    removeSymbols();
    addSymbols();
    removeClipPolyline();
}

addMarkers();
addPolyline();
addSymbols();

// On double-click, predict value at that point
map.on("dblclick", e => {
    let pt = map.fromLngLat(e.lngLat);
    let { alg } = vjmap.vectorContour();
    if (typeof variog.model != 'function')  variog.model = alg[`model_${variog.model}`]
    let result = alg.core.predict(pt.x, pt.y, variog);
    message.info('Value at point: ' + result);
})

/*
// Train on discrete points, then predict value at new point
// Get algorithm object
let { alg } = vjmap.vectorContour();
let am = alg.core;
// Generate test data
function generateTestData(n){
   let x = [], y = [], t = [];

   for (let i = 0; i < n; i++){
       x[i] = (-180)+Math.random()*360;
       y[i] = (-90)+Math.random()*180;
       t[i] = (x[i] > 0) ? 100 : 0;
   }
   return [t,x,y];
}
// Generate 100 random points
let data = generateTestData(100);
// Train model
let variogram = am.train(data[0],data[1],data[2],"exponential", 0, 10);

if (variogram) {
   // Predict value at point (80=x, 60=y)
   let predictValue = am.predict(80, 60, variogram);
   console.log(predictValue)
}
*/

// UI
const { useState } = React;
const { Slider, Select, InputNumber} = antd;
const App = () => {
    const [inputValue, setInputValue] = useState(100);
    let timeId = 0;
    const onChange = (value) => {
        setInputValue(value);
        if (timeId) {
            clearTimeout(timeId)
        }
        timeId = setTimeout(() => { curAlpha = value; refresh(); }, 2000)
    };
    const handleModelChange = (value) => {
        curModel = value;
        refresh();
    }
    return (
        <div>
            <div className="info" style={{width: "90px", right: "10px"}}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addMarkers()}>Draw raw points
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => removeMarkers()}>Hide raw points
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => drawPolyline()}>Draw contours
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => removePolyline()}>Hide contours
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => drawPolygon()}>Draw isosurface
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => removePolygon()}>Hide isosurface
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => drawFillExtrusion()}>Draw extruded isosurface
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => removeFillExtrusion()}>Hide extruded isosurface
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => removeSymbols()}>Hide contour labels
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => addSymbols()}>Draw contour labels
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setClipContour()}>Clip contours
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setNoClipContour()}>Do not clip contours
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setClipContourPolygon()}>Clip isosurface
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => setNoClipContourPolygon()}>Do not clip isosurface
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => mockDataChange()}>Simulate value change
                    </button>
                </div>
                <div>
                    Model:
                    <Select
                        defaultValue="exponential"
                        style={{ width: 120 }}
                        onChange={handleModelChange}
                        options={[
                            { value: 'exponential', label: 'exponential' },
                            { value: 'spherical', label: 'spherical' },
                            //{ value: 'gaussian', label: 'gaussian' },
                        ]}
                    />
                </div>
                <div>
                    Alpha: <Slider step={0.01}  value={inputValue}
                                    onChange={onChange} />
                    <InputNumber
                        min={0}
                        max={100}
                        style={{ margin: '0 16px' }}
                        step={0.01}
                        value={inputValue}
                        onChange={onChange}
                    />
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