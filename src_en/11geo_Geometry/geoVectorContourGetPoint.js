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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoVectorContourGetPoint
        // --Auto-collect points and elevation from contours--Contours have no elevation; get elevation from contour labels, then sample contour points
// Create map service object with service URL and token
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: 'sys_contour', // map ID (ensure exists or upload new)
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    message.error(res.error)
}
// Get map bounds
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
// Create projection
let prj = new vjmap.GeoProjection(mapExtent);

// Create map object
let map = new vjmap.Map({
    container: 'map', // container ID
    style: svc.rasterStyle(), // Raster tile style
    center: prj.toLngLat(mapExtent.center()), // Center
    zoom: 2,
    renderWorldCopies: false
});
// Attach service and projection
map.attach(svc, prj);
await map.onLoad();
// Fit map to full extent
// map.fitMapBounds();


// Query all entities in specified layers and types; isQueryGeojsonData = whether to fetch GeoJSON
const getQueryEntities = async (layers, types, isQueryGeojsonData)=> {
    // Entity type ID to name mapping
    const { entTypeIdMap } = await svc.getConstData();
    const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
    // Get layer id by layer name
    const getLayerIdByName = name => svc.getMapLayers().findIndex(layer => layer.name === name);

    let condtions = []
    // Layer SQL condition
    if (layers && layers.length > 0) {
        let layersIndexArr = layers.map(y => `layerindex='${getLayerIdByName(y)}'`);
        let layerCondtion = layersIndexArr.join(" or ");
        condtions.push(layerCondtion);
    }

    // Entity type SQL condition
    if (types && types.length > 0) {
        let typeNames = types.map(t => `name='${getTypeNameById(t)}'`);
        let typeCondtion = typeNames.join(" or ");
        condtions.push(typeCondtion);
    }

    let query = await svc.conditionQueryFeature({
        condition: condtions.join(" and "), // SQL WHERE clause; see server condition query docs
        fields: "",
        geom: true,
        includegeom: isQueryGeojsonData,
        realgeom: true,
        limit: 100000 // High limit to fetch all (default 100)
    })
    if (query.error) {
        message.error(query.error);
        return;
    } else {
        return query.result; // Return results
    }
}

const getContourPoints = async () => {
    // Query all text on "等值线注记"/"等值线" layers (AcDbText, AcDbMText, etc.)
    let allNoteTexts = await getQueryEntities(["等值线注记", "等值线"], ["AcDbText", "AcDbMText", "AcDbAttributeDefinition", "AcDbAttribute"]);
    // Get bounding box for each text
    allNoteTexts.forEach(t => {
        t.bounds = map.getEnvelopBounds(t.envelop).scale(2); // Scale bounds for intersection
        t.bounsCoordiantes = t.bounds.toPointArray().map(e => vjmap.geoPoint(e)); // Bounds to segment coords
        t.bounsCoordiantes.push(t.bounsCoordiantes[0]); // Close the rectangle
    });

    console.log(allNoteTexts)

    // Query all curve entities on "等值线" layer ”AcDbSpline“ entity type may be AcDbLine, AcDb2dPolyline, AcDb3dPolyline, AcDbSpline
    let allContours = await getQueryEntities(["等值线"], ["AcDbSpline"], true);
    // Get all contour coordinates (polygons or polylines), convert to line coordinate arrays
    let contours = [];
    for(let c of allContours) {
        let coordinates;
        if (c.geom.geometries && c.geom.geometries[0].type == "Polygon") {
            coordinates = map.fromLngLat(c.geom.geometries[0].coordinates[0]);
            coordinates.push(coordinates[0]) ;// Close
        } else if (c.geom.geometries && c.geom.geometries[0].type == "LineString") {
            coordinates = map.fromLngLat(c.geom.geometries[0].coordinates);
        }
        if (coordinates) {
            contours.push({
                name: c.name,
                objectid: c.objectid,
                bounds: map.getEnvelopBounds(c.envelop),
                coordinates: coordinates,
                lineLength: vjmap.Math2D.lineDist(coordinates) // Total line length
            });
        }
    }
    console.log(contours);

    // Intersect contours with labels to get elevation for each contour
    for(let c of contours) {
        for(let t of allNoteTexts) {
            // Quick check: bounding box intersection
            if (!(c.bounds.isIntersect(t.bounds) || c.bounds.isContains(t.bounds))) {
                // Skip if bounds don't intersect
                continue;
            }
            let isIntersect = false;
            for (let k = 0; k < c.coordinates.length - 1; k++) {
                for(let m = 0; m < t.bounsCoordiantes.length - 1; m++) {
                    let res = vjmap.segmentIntersect(c.coordinates[k].x, c.coordinates[k].y, c.coordinates[k + 1].x, c.coordinates[k + 1].y,  t.bounsCoordiantes[m].x, t.bounsCoordiantes[m].y, t.bounsCoordiantes[m + 1].x, t.bounsCoordiantes[m + 1].y);
                    if (res.status) { // Intersection at res.x, res.y
                        isIntersect = true;
                        break;
                    }
                }
                if (isIntersect) break;
            }
            if (isIntersect) {
                // Found intersection
                let elevation = +t.text; // Parse text as elevation
                if (typeof elevation == 'number' && !isNaN(elevation)) {
                    c.elevation = elevation;
                    break;
                }
            }
        }
    }
    console.log(contours);

    // Contours without label intersection: use elevation from nearest contour with elevation
    // For each contour without elevation, find closest endpoint distance to contours with elevation
    for(let c of contours) {
        if (typeof c.elevation == "number") continue; // Has elevation
        let findResults = [];
        for(let n of contours) {
            if (typeof n.elevation != "number") continue; // Skip contours without elevation
            // Distance between endpoints
            findResults.push({
                elevation: n.elevation,
                dist: c.coordinates[0].distanceTo(n.coordinates[0])
            });
            findResults.push({
                elevation: n.elevation,
                dist: c.coordinates[c.coordinates.length - 1].distanceTo(n.coordinates[0])
            });
            findResults.push({
                elevation: n.elevation,
                dist: c.coordinates[0].distanceTo(n.coordinates[n.coordinates.length - 1])
            });
            findResults.push({
                elevation: n.elevation,
                dist: c.coordinates[c.coordinates.length - 1].distanceTo(n.coordinates[n.coordinates.length - 1])
            });
        }
        if (findResults.length == 0) continue;
        // Sort by distance, use elevation of nearest
        findResults = findResults.sort((a, b) => a.dist - b.dist);
        c.elevation = findResults[0].elevation;
    }

    // Sample points along contours by distance
    let spaceLength = mapExtent.width() / 100 ;// Sampling interval (1/100 of map width)
    let pointDatas = [];
    for(let c of contours) {
        if (typeof c.elevation != "number") continue; // Skip without elevation
        let len = 0;
        for(len = 0; len < c.lineLength; len += spaceLength) {
            let ratio = len / c.lineLength; // Ratio along line
            // Interpolate coordinates at ratio
            let pts = vjmap.interpolatePointsByRatio(c.coordinates, ratio);
            let pt = c.coordinates[0];
            if (pts.length > 0) {
                // Use last point
                pt = pts[pts.length - 1];
            }
            pointDatas.push({
                point: vjmap.geoPoint(pt),
                objectid: c.objectid,
                elevation: c.elevation
            })
        }
        if (!vjmap.isZero(len, c.lineLength)) {
            // Add endpoint if not yet sampled
            pointDatas.push({
                point: c.coordinates[c.coordinates.length -1],
                objectid: c.objectid,
                elevation: c.elevation
            })
        }
    }

    // Icon
    await map.loadImageEx("stretchTextBackImg", env.assetsPath + "images/textback.png", {
        // Horizontally stretchable pixel columns (x:7-32, x:42-62)
        stretchX: [
            [7, 32],
            [42, 62]
        ],
        // Vertically stretchable (y:3-19)
        stretchY: [[3, 19]],
        // Text content region [x1,y1,x2,y2]
        content: [7, 3, 62, 19]
    });

    let symbols;
    const showDataInMap = (datas)=> {
        let geoDatas = []
        for(let i = 0; i < datas.length; i++) {
            const pt = datas[i].point;
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    text:  datas[i].elevation,
                    textColor: "#00ffff",
                    objectid: datas[i].objectid
                }
            }
            geoDatas.push(data);
        }
        if (symbols) {
            symbols.remove(); // Remove existing
        }
        symbols = new vjmap.Symbol({
            data: geoDatas,
            iconImage: "stretchTextBackImg",
            iconAnchor: "bottom",
            iconOpacity: 0.5,
            iconOffset: [-2, -10],
            textTranslate: [-2, -6],
            textAnchor: "bottom",
            textField: ['get', 'text'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 18,
            textColor: ['get', 'textColor'],
            iconTextFit: "both",
            iconAllowOverlap: false,
            textAllowOverlap: false
        });
        symbols.addTo(map);
    }

    showDataInMap(pointDatas);
    return {
        pointDatas,
        symbols
    };
}

let contourPoints;
let drawSymbols;
const autoGetContourPoints = async () => {
    if (contourPoints) return; // Already drawn
    let res = await getContourPoints();
    contourPoints = res.pointDatas;
    drawSymbols = res.symbols;
}
const createContours = async () => {
    if (!contourPoints) return;
    let dataBounds = await svc.cmdGetDrawBounds(); // Get map data bounds
    let extent = map.toLngLat(dataBounds).toArray();
// Omit if extent auto-generated from data
    let pt1 = extent[0];
    let pt2 = extent[1];
    extent = [pt1[0], pt1[1], pt2[0], pt2[1]];

    let dataMinValue = Math.min.apply(null, contourPoints.map(item => item.elevation)); // Min elevation
    let dataMaxValue = Math.max.apply(null, contourPoints.map(item => item.elevation)); // Max elevation
    let dataset = {
        "type" : "FeatureCollection",
        "features" : []
    };

// Color scale
    let colors = ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf","#fee08b",
        "#fdae61", "#f46d43", "#d73027", "#a50026"];

    for (let i = 0; i < contourPoints.length; i++) {
        let feature={
            "type" : "Feature",
            "properties" : {
                "value" : contourPoints[i].elevation
            },
            "geometry" : {
                "type" : "Point",
                "coordinates" : map.toLngLat(contourPoints[i].point)
            }
        };
        dataset.features.push(feature);
    }

    let contoursSize = 100; // Contour interval count (higher = denser)
    let variog;
    let curModel = 'exponential'; // Model: exponential/gaussian/spherical
    let curAlpha = 0.1; // Alpha value
    const createContour = async (dataset, contoursSize, propField, colors, dataMinValue, dataMaxValue, maxHeight, model) => {
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
            model: curModel || 'exponential', // exponential, gaussian, or spherical
            sigma2: 0, // Gaussian process variance (usually 0)
            alpha: curAlpha || 100, // Prior for variance; lower = larger range
            extent: map.fromLngLat(vjmap.GeoBounds.fromArray(extent)).toArray() // Omit if auto-generated
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
    let contour = await createContour(dataset, contoursSize, "value" /* GeoJSON property for contour */, colors, dataMinValue, dataMaxValue, maxHeight);
    contour.features.forEach(f => {
        f.properties.formatValue = Math.round(f.properties.value) // Formatted label value
    })

    let polyline = new vjmap.Polyline({
        data: contour,
        lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00ffff', ['get', 'color']],
        isHoverPointer: true,
        isHoverFeatureState: true
    });
    polyline.addTo(map);
    polyline.clickPopup(f => `<h3>Value: ${f.properties.value.toFixed(2)}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });

}

const showContourPoints = () => {
    if (drawSymbols) {
        drawSymbols.show();
    }
}

const hideContourPoints = () => {
    if (drawSymbols) {
        drawSymbols.hide();
    }
}
// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{ width: "180px", right: "10px" }}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => autoGetContourPoints()}>Auto-collect contour points
                    </button>
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => createContours()}>Generate contours from points
                    </button>
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => hideContourPoints()}>Hide collected points
                    </button>
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => showContourPoints()}>Show collected points
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