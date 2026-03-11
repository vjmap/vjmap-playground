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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoWebWorkerIntersect
        // --Line segment intersection (WebWorker implementation)--
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
// Create geo projection from map bounds
let prj = new vjmap.GeoProjection(res.bounds);

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.vectorStyle(), // style, raster style here
    center: prj.toLngLat(prj.getMapExtent().center()), // set map center
    zoom: 2, // set map zoom level
    pitch: 60,
    renderWorldCopies: false, // do not show multi-world copies
    doubleClickZoom: false // Disable double-click zoom
});


// Attach service and projection
map.attach(svc, prj);
await map.onLoad()
let mapBounds = map.getGeoBounds(0.4); // Get map geographic bounds

// Add user data
let userGeoData =  mapBounds.randomGeoJsonLineCollection(20, 5);
// Draw lines
let polylines = new vjmap.Polyline({
    data: map.toLngLat(userGeoData),
    lineColor: '#0ff',
    lineWidth: 3,
    lineOpacity: 0.6
});
polylines.addTo(map);

let geoDatas = vjmap.cloneDeep(userGeoData);

// Merge map data
const getMapData = () => {
    // Query all line features from vector layer
    let features = map.queryRenderedFeatures({layers: ['vector-layer-lines']})
    let mapGeoDatas = {
        type: "FeatureCollection",
        features: features.map(f => {
            return {
                id: f.id,
                type: f.type,
                properties: f.properties,
                geometry: f.geometry
            }
        })
    }
    let mapDatas = map.fromLngLat(mapGeoDatas);
    // Merge map data with user data
    geoDatas.features = [...userGeoData.features, ...mapDatas.features]
}
getMapData();
// Re-fetch when map zooms or pans (vector tiles change)
map.on("zoomend", e => getMapData());
map.on("moveend", e => getMapData());


// Create intersecting line
let startPoint = mapBounds.randomPoint();
let endPoint = mapBounds.randomPoint();
let intersectLine = new vjmap.Polyline({
    data: map.toLngLat([startPoint, endPoint]),
    lineColor: '#f00',
    lineWidth: 8
});
intersectLine.addTo(map);

// Animate the intersecting line
const moveLine =  (newStartPoint, newEndPoint) => {
    let data = map.getSourceData(intersectLine.sourceId);
    let geoData = map.fromLngLat(data);
    // Start point interpolation
    let mapProgressToValueStart = vjmap.interpolate(
        [0, 1],
        [geoData.features[0].geometry.coordinates[0], [newStartPoint.x, newStartPoint.y]]
    )
    // End point interpolation
    let mapProgressToValueEnd = vjmap.interpolate(
        [0, 1],
        [geoData.features[0].geometry.coordinates[1], [newEndPoint.x, newEndPoint.y]]
    )
    vjmap.createAnimation({
        from: 0,
        to: 1,
        duration: 5000,
        ease:vjmap.linear, // Linear
        onUpdate: latest => {
            let beginPoint = mapProgressToValueStart(latest)
            let endPoint = mapProgressToValueEnd(latest)
            // Update coordinates
            data.features[0].geometry.coordinates = map.toLngLat([beginPoint, endPoint])
            map.setData(intersectLine.sourceId, data)
        },
        onComplete: (e) => {
            map.fire("moveLineFinish"); // Fire line move complete event
        }
    })
}

moveLine(mapBounds.randomPoint(), mapBounds.randomPoint());
// On line move complete, move toward new points
map.on("moveLineFinish", ()=> moveLine(mapBounds.randomPoint(), mapBounds.randomPoint()));

// Use symbol to display intersection points
await map.loadImageEx("symbol", env.assetsPath + "images/sensor1.png");
const intersectSymbols = new vjmap.Symbol({
    data: [],
    iconImage: "symbol",
    iconAnchor: "bottom",
    iconOpacity: 0.7,
    iconAllowOverlap: true
});
intersectSymbols.addTo(map);


// Intersection runs in WebWorker to avoid blocking main thread
const getIntersects = (startPoint, endPoint, allLineGeoJson)=> {
    let intersectPoints = []
    for(let i = 0; i < allLineGeoJson.features.length; i++) {
        for(let k = 0; k < allLineGeoJson.features[i].geometry.coordinates.length - 1; k++) {
            // Check if each segment intersects
            let co1 = allLineGeoJson.features[i].geometry.coordinates[k];
            let co2 = allLineGeoJson.features[i].geometry.coordinates[k + 1];
            // If vjmap is imported, call: vjmap.segmentIntersect(...)
            //let res = vjmap.segmentIntersect(startPoint[0], startPoint[1], endPoint[0], endPoint[1],  co1[0], co1[1], co2[0], co2[1]);

            // Only intersectFunc is passed to worker, not full vjmap
            let res = intersectFunc(startPoint[0], startPoint[1], endPoint[0], endPoint[1],  co1[0], co1[1], co2[0], co2[1]);
            if (res.status) {
                // Store intersection point
                intersectPoints.push([res.x, res.y])
            }
        }
    }
    return intersectPoints;
}

/* To use other vjmap functions, get script content:
let script = await vjmap.httpHelper.get("../../js/vjmap/vjmap.min.js", undefined, {
    raw: true
})*/

// Create WebWorker proxy for intersection
let intersect = vjmap.WorkerProxy(getIntersects, {
    // vjmap: script.data, // Pass full vjmap script if worker needs other functions
    intersectFunc: vjmap.segmentIntersect // Pass intersect function to worker context (avoids loading full vjmap; function must not call other lib code)
});
// Compute intersections in WebWorker
const calcIntersect = async ()=> {
    // Get line coordinates
    let coordinates = map.fromLngLat(map.getSourceData(intersectLine.sourceId)).features[0].geometry.coordinates;
    // Compute intersections in WebWorker
    let intersectPoints = await intersect(coordinates[0], coordinates[1], geoDatas)
    intersectSymbols.setData(map.toLngLat(intersectPoints)); // Update data
    map.fire("calcIntersectFinish"); // Fire calc complete event
}
map.on("calcIntersectFinish", async ()=> setTimeout(async ()=> await calcIntersect(), 15))
calcIntersect();

// To stop WebWorker
//intersect.worker.terminate()

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