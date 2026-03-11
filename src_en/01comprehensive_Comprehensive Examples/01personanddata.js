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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/01personanddata
        // --Person positioning and data integration display--
        // When there are many persons (e.g. hundreds or thousands), use symbol to draw persons (WebGL rendering). See https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolpath
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID (ensure this ID exists; upload new drawing to create new ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render mode
            style: vjmap.openMapDarkStyle() // use dark background style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // New map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.vectorStyle(),
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            pitch: 60,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Make map fully visible
        map.fitMapBounds();
        await map.onLoad();
        
        const len = mapExtent.width() / 80;
        // Get all layers
        const layers = svc.getMapLayers();
        const prefix = "my";
        // Vector tile data source
        const sourceId = prefix + "-source";
        map.addVectorSource(sourceId, svc.vectorTileUrl(), {
            maxzoom: 25,
            minzoom: 0
        });
        
        const mapParam = svc.currentMapParam();
        const darkMode = mapParam && mapParam.darkMode;
        // Invert color setting
        const darkColor = [
            "case",
            ["==", ["get", "color"], "#000000"],
            "#FFFFFF",
            ["get", "color"]
        ];
        
        const color = [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "rgba(0,0,255,255)",
            darkMode ? darkColor : ["get", "color"]
        ];
        
        
        // Extrusion layer
        let extrusionLayer; // extrusion layer
        const showHideExtrusionLayer = (isHide) => {
            const extrusionLayerId = prefix + "-layer-polygons-extrusion";
            if (isHide) {
                if (extrusionLayer) {
                    map.removeLayerEx(extrusionLayerId)
                    extrusionLayer = null
                }
            } else {
                if (extrusionLayer) return;
                extrusionLayer = map.addFillExtrusionLayer(extrusionLayerId, sourceId, {
                    source: sourceId,
                    sourceLayer: "polygons",
                    filter: ["all", ['!=', ['get', 'type'], 12], ['!=', ['get', 'type'], 13], ['!=', ['get', 'type'], 0]], // text layer no extrusion
                    fillExtrusionColor: color,
                    fillExtrusionBase: 0,
                    fillExtrusionHeight: prj.toMeter(len)
                })
            }
        }
        
        // Add mouse position
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
        
        // Entity type ID and name mapping
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        // Get two longest lines in road layer
        const getRoadways = async () => {
            let entType = getTypeNameById('AcDbLine'); // Get line type. Or use "1" directly.
            let layerIndex = svc.getMapLayers().findIndex(t => t.name == "道路"); // Find layer index by layer name (keep "道路" as data key if needed)
            // SQL condition query (point query, rect query, condition query). Queries spatial DB via SQL for speed.
            let query = await svc.conditionQueryFeature({
                condition: `name='${entType}' and layerindex=${layerIndex}`,
                fields: "objectid,points",
                limit: 100000
            })
        
            /*
            // Or use expression query for complex cases where SQL is not enough. Slower.
            let query = await svc.exprQueryFeature({
                expr: `gOutReturn := if((gInFeatureType == 'AcDbLine' and  gInLayerName == '道路'), 1, 0);`,
                fields: "objectid,points",
                limit: 100000
            })*/
            let results = query.result;
            if (!results) return;
            let lines =  results.map(e => {
                let pts = e.points.split(";");
                e.points = pts.map(p => vjmap.GeoPoint.fromString(p))
                e.length = vjmap.Math2D.lineDist(e.points) // get line length
                return e
            })
            // Sort by line length
            lines = lines.sort((r1, r2) => r2.length - r1.length)
            // Take first two longest
            if (lines.length < 2)  return lines;
            return [lines[0], lines[1]]
        }
        
        // Get polygon from line offset/expand
        const getLinesOffsetPolygon = (line, offset = 16000) => {
            const offsetLn1 = vjmap.offsetPoints(line.points, {offset })
            const offsetLn2 = vjmap.offsetPoints(line.points, {offset: -offset })
            line.offsetPolygon = [...offsetLn1, ...offsetLn2.reverse()]
        }
        
        // Draw polygon
        const drawPolygon = (points, color = 'yellow', opacity = 0.2) => {
            let polygon = new vjmap.Polygon({
                data: map.toLngLat(points),
                fillColor: color,
                fillOpacity: opacity,
                fillOutlineColor: "#f00"
            });
            polygon.addTo(map);
            return polygon
        }
        
        // Generate a point at random position on a line
        const getRandomPointOnLine = (points) => {
            let newPoints = vjmap.interpolatePointsByRatio(points, Math.random());
            // Take last one
            return newPoints[newPoints.length - 1]
        }
        
        // Generate a random point within given bounds by step
        const getRandomPointOnPolygon = (marker, step, polygons) => {
            // Get previous direction, or random if none
            marker.dir = marker.dir || vjmap.randInt(0, 360)
            let s = 0;
            // Get geo coordinate
            const co = map.fromLngLat(marker.getLngLat())
            while (s++ < 100) {
                const newX = co.x + step * Math.cos(vjmap.degToRad(marker.dir))
                const newY = co.y + step * Math.sin(vjmap.degToRad(marker.dir))
                const newCo = new vjmap.Point(newX, newY);
                let isInPolygon = false;
                for(let p of polygons) {
                    if (vjmap.isPointInPolygon(newCo, p)) {
                        isInPolygon = true;
                    }
                }
                if (isInPolygon) {
                    return newCo
                }
                // Change direction
                marker.dir = vjmap.randInt(0, 360)
            }
            return co // unchanged
        }
        
        // Move a marker to new position
        const moveMarkerToPos =  (marker, pos, duration, cb) => {
            return new Promise((resolve => {
                // Get geo coordinate
                const co = map.fromLngLat(marker.getLngLat())
                const mapProgressToValues = vjmap.interpolate(
                    [0, 1],
                    [co, pos]
                )
        
                // Walking animation
                vjmap.createAnimation({
                    from: 0,
                    to: 1,
                    duration: duration || 2000,
                    ease:vjmap.linear, // linear
                    onUpdate: latest => {
                        const newPos = mapProgressToValues(latest)
                        if (cb) {
                            cb(latest, newPos); // if callback provided
                        }
                        else {
                            marker.setLngLat(map.toLngLat(newPos));
                        }
                    },
                    onComplete: (e) => {
                        resolve()
                    },
                    onStop: () => resolve()
                })
            }))
        }
        
        // Start walking, set walk bounds
        const beginWalk = async (marker, step, walkRegions) => {
            if (marker.isWalking) return
            while (!marker.isStopWalk) {
                marker.isWalking = true
                let nextPoint = getRandomPointOnPolygon(marker, step, walkRegions)
        
                await moveMarkerToPos(marker, nextPoint)
                if (marker.personName == "Male1") {
                    personOneWalkPaths.push({
                        coordinate: nextPoint,
                        time: new Date()
                    })
                }
            }
        }
        
        // Person walking
        const startWalks = () => {
            for(let m of personMarker) {
                m.isStopWalk = false;
                beginWalk(m, 10000, walkRegions)
            }
        }
        
        // Stop walking
        const stopWalks = () => {
            for(let m of personMarker) {
                m.isStopWalk = true
                m.isWalking = false;
            }
        }
        
        // Set fence alarm on/off
        const setFenceAlarm = (alarm) => {
            if (alarm) {
                if (!fencePopup) {
                    fencePopup = new vjmap.Popup({ closeOnClick: false, closeButton: false, anchor: "bottom" });
                    fencePopup.setHTML('Entered fence area!!!')
                        .setLngLat(map.toLngLat([587569941.62898, 3103985897.0580]))
                        .addTo(map);
                    fencePolygon.setFillColor("red")
                    fencePolygon.setFillOpacity(0.6)
                }
            } else {
        
                if (fencePopup) {
                    fencePopup.remove()
                    fencePopup = null
                    fencePolygon.setFillColor("green")
                    fencePolygon.setFillOpacity(0.2)
                }
        
            }
        }
        
        // Open/Close fence check
        const openCloseFenceCheck = (isClose) => {
            if (isClose) {
                if (fenceTimeId) {
                    clearInterval(fenceTimeId)
                    fenceTimeId = null
                }
                return
            }
            if (fenceTimeId) return;
            fenceTimeId = setInterval(() => {
                let isAlarm = false;
                for(let m of personMarker) {
                    if (vjmap.isPointInPolygon(map.fromLngLat(m.getLngLat()), fenceRegion)) {
                        isAlarm = true;
                        break;
                    }
                }
                setFenceAlarm(isAlarm)
            }, 800)
        }
        
        // Show/hide person positioning layer
        const showHidePersonLayer = (isHide) => {
            if (isHide) {
                for(let m of personMarker) {
                    m.hide();
                    m.getPopup().remove()
                }
                stopWalks();
                openCloseFenceCheck(true);
                setFenceAlarm(false)
            } else {
                for(let m of personMarker) {
                    m.show();
                }
                startWalks();
                openCloseFenceCheck(false)
            }
        }
        
        // Fly to a person
        const postionToPerson = (index) => {
            const marker = personMarker[index];
            map.flyTo({
                center: marker.getLngLat(),
                zoom: 3
            });
            if (!marker.getPopup().isOpen()) {
                marker.togglePopup();
            }
        
            flashPos(marker)
        }
        
        // Show person route
        let personRouteLine, realPersonRouteLine, personRouteMarker, isRoutePlaying;
        const showPersonRoute = async () => {
            hidePersonRoute();
            // Close person positioning layer
            showHidePersonLayer(true);
            let routePath = personOneWalkPaths.map(p => p.coordinate);
            map.fitMapBounds(vjmap.GeoBounds.fromDataExtent(routePath), {
                padding: 100,
        
            }); // Fly to path
            // https://vjmap.com/demo/#/demo/map/overlay/polyline/polylineAnimate
            // Route line
            personRouteLine = new vjmap.PolylineArrow({
                path: map.toLngLat(routePath),
                lineWidth: 10,
                showDir: true,
                lineColor: '#009EFF'
            });
            personRouteLine.addTo(map);
        
            // Real-time animated route line
            let realPath = [routePath[0], routePath[0]]; // Start with first point
            realPersonRouteLine = new vjmap.PolylineArrow({
                path: map.toLngLat(realPath),
                lineWidth: 10,
                showDir: true,
                showBorder: true,
                borderColor: "#f00",
                lineColor: '#FF9900'
            });
            realPersonRouteLine.addTo(map);
        
            const formatTime = (milliseconds) => {
                let totalSeconds = Math.floor(milliseconds / 1000);
                let minutes = Math.floor((totalSeconds % 3600) / 60);
                let seconds = totalSeconds % 60;
                let mseconds = milliseconds % 1000;
                return  minutes + "m " + seconds + "s " + mseconds.toFixed(0) + "ms";
            }
            personRouteMarker = createMarker(routePath[0], true, '');
            personRouteMarker.getPopup().setText(formatTime(personOneWalkPaths[0].time.getTime()));
            if (!personRouteMarker.getPopup().isOpen()) {
                personRouteMarker.togglePopup();
            }
        
        
            isRoutePlaying = true;
            for(let i = 1; i < routePath.length; i++) {
                // Time diff from previous point
                let tm = personOneWalkPaths[i].time.getTime() - personOneWalkPaths[i - 1].time.getTime();
                // Interpolate time
                const timeInterPolate = vjmap.interpolate(
                    [0, 1],
                    [personOneWalkPaths[i - 1].time.getTime(), personOneWalkPaths[i].time.getTime()]
                )
                await moveMarkerToPos(personRouteMarker, routePath[i], tm, (latest, newPos) => {
                    if (!isRoutePlaying) return; // if route animation ended
                    try {
                        const curTime = timeInterPolate(latest);
                        personRouteMarker.setLngLat(map.toLngLat(newPos));
                        personRouteMarker.getPopup().setText(formatTime(curTime));
                        realPath.push(newPos);
                        realPersonRouteLine.setPath(map.toLngLat(realPath)); // Update route position
                    } catch (e) {
        
                    }
                })
                if (!isRoutePlaying) break; // if route animation ended
            }
        
        }
        
        // Close person route
        const hidePersonRoute = async () => {
            isRoutePlaying = false;
            if (personRouteLine) {
                personRouteLine.remove();
                personRouteLine = null;
            }
            if (realPersonRouteLine) {
                realPersonRouteLine.remove();
                realPersonRouteLine = null;
            }
            if (personRouteMarker) {
                if (personRouteMarker.getPopup().isOpen()) {
                    personRouteMarker.togglePopup(); // Close
                }
                personRouteMarker.remove();
                personRouteMarker = null;
            }
        }
        // Flash a position
        const flashPos = (marker) => {
            return new Promise((resolve => {
                const center = map.fromLngLat(marker.getLngLat());
                const radius1 = map.pixelToGeoLength(10, map.getZoom())
                const radius2 = map.pixelToGeoLength(40, map.getZoom())
                let circle = new vjmap.CircleFill({
                    center: center,
                    radius: radius1,
                    fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
                    fillOpacity: ['get', 'opacity'],
                    fillOutlineColor: "#f00",
                    properties: {
                        color: "#ffff00",
                        opacity: 0.8
                    }
                });
                circle.addTo(map);
        
                const mapProgressToValues = vjmap.interpolate(
                    [0, 1],
                    [
                        { r: radius1, color: "#f0f", opacity: 0.8 },
                        { r: radius2, color: "#0ff", opacity: 0.2 }
                    ]
                )
                vjmap.createAnimation({
                    from: 0,
                    to: 1,
                    repeat: 5,
                    duration: 1000,
                    onUpdate: latest => {
                        const value = mapProgressToValues(latest)
                        circle.options.properties.color = value.color;
                        circle.options.properties.opacity = value.opacity;
                        circle.setRadius(value.r);
                        circle.setCenter(map.fromLngLat(marker.getLngLat()));
                    },
                    onStop: () => {
                        circle.remove()
                        resolve({})
                    },
                    onComplete: () => {
                        circle.remove()
                        resolve({})
                    }
                })
        
        
            }))
        }
        
        let roadways = await getRoadways();
        
        let personPostions = [];
        // Get bounds of two roads and draw corresponding polygons
        roadways.forEach(line => {
            getLinesOffsetPolygon(line)
            drawPolygon(line.offsetPolygon)
            // Randomly place 5 persons on each road
            for(let i = 0; i < 5; i++) {
                personPostions.push(getRandomPointOnLine(line.points))
            }
        })
        
        // Add fence
        let fenceRegion = [
            vjmap.geoPoint([587569997.38432, 3103985911.28681]),
            vjmap.geoPoint([587597808.20691, 3103969182.98853]),
            vjmap.geoPoint([587586488.08591, 3103939034.83197]),
            vjmap.geoPoint([587557994.40768, 3103955786.22497])];
        const fencePolygon = drawPolygon(fenceRegion, "green", 0.1)
        let fencePopup = null;
        setFenceAlarm(true)
        
        let personOneWalkPaths = [];// Record path of person 1 for route replay
        let personMarker = [];
        
        const createMarker = (pos, isMan, personName)=> {
            let el = document.createElement('div');
            el.className = 'marker';
        
            el.style.backgroundImage =
                isMan ? 'url("../../assets/images/man.png")' : 'url("../../assets/images/girl.png")';
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.backgroundSize = '100%';
        
            // Add markers to the map.
            const marker = new vjmap.Marker({
                element: el,
                anchor: 'bottom'
            });
        
            marker.personName = personName;
            marker.setLngLat(map.toLngLat(pos))
                .addTo(map);
            const popup = new vjmap.Popup({offset: [0, -40], closeOnClick: false})
                .setText(personName);
            marker.setPopup(popup)
            return marker;
        }
        // Draw person markers
        for(let p = 0; p < personPostions.length; p++) {
            let isMan = vjmap.randInt(0, 1) === 0;
            let personName = '';
            if (p == 0) isMan = true; // First one as Male1 for route replay
            personName = `${isMan ? 'Male' : 'Female'}${p + 1}`
            let marker = createMarker(personPostions[p], isMan, personName)
            personMarker.push(marker);
            if (marker.personName == "Male1") {
                personOneWalkPaths.push({
                    coordinate: vjmap.geoPoint(personPostions[p]),
                    time: new Date()
                })
            }
        }
        
        
        
        let walkRegions = roadways.map(ln => ln.offsetPolygon)
        startWalks()
        
        // Periodically check if entered fence area
        let fenceTimeId = null
        openCloseFenceCheck(false)
        
        
        
        // Sensor layer
        const mapBounds = map.getGeoBounds(0.6);
        const geoDatas = []
        for(let s = 1; s <= 5; s++) {
            await map.loadImageEx(`sensor${s}`, `../../assets/images/sensor${s}.png`);
            for(let i = 0; i < 5; i++) {
                const pt = mapBounds.randomPoint();
                let val = vjmap.randInt(0, 100)
                const data = {
                    point: map.toLngLat(pt),
                    properties: {
                        type: s,
                        img: `sensor${s}`,
                        index: i,
                        text:  `Value:${val}`,
                        textColor: val > 80 ? "#ff0000" : '#0EFFFF' // Red when > 80
                    }
                }
                geoDatas.push(data);
            }
        }
        
        
        const sensorLayer = new vjmap.Symbol({
            data: geoDatas,
            iconImage: ['get', 'img'],
            iconOffset: [0, -10],
            textField: ['get', 'text'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 14,
            textColor: ['get', 'textColor'],
            textOffset: [0, 0.5],
            textAnchor: 'top',
            iconAllowOverlap: true,
            textAllowOverlap: true
        });
        sensorLayer.addTo(map);
        
        let sensorPopup;
        map.on("click", sensorLayer.getLayerId(), e => {
            if (e.features && e.features.length > 0) {
                const prop = e.features[0].properties;
                let html = "";
                for(let p in prop) {
                    html += `<div style="color:blue;font-size: 16px">${p}: ${prop[p]}</div>`
                }
                if (!sensorPopup) {
                    sensorPopup = new vjmap.Popup({offset: [0, -26], closeOnClick: false});
                    sensorPopup
                        .setLngLat(e.features[0].geometry.coordinates)
                        .setHTML(html)// Popup content
                        .addTo(map);
                } else {
                    sensorPopup
                        .setLngLat(e.features[0].geometry.coordinates)
                        .setHTML(html)
                }
            }
        })
        
        let updateDataTimeId;
        // Mock data change
        const mockDataChange = () => {
            if (updateDataTimeId) return
            updateDataTimeId = setInterval(() => {
                let data = sensorLayer.getData();
                for(let f of data.features) {
                    let val = vjmap.randInt(0, 100);
                    f.properties.text = `Value:${val}` // Mock new value
                    f.properties.textColor =  val > 80 ? "#ff0000" : '#0EFFFF' // Red when > 80
                }
                sensorLayer.setData(data)
            }, 3000)
        }
        mockDataChange();
        
        const showHideSensorLayer = (isHide) => {
            if (isHide) {
                sensorLayer.hide()
                if (sensorPopup) {
                    sensorPopup.remove()
                    sensorPopup = null
                }
                if (updateDataTimeId) {
                    clearInterval(updateDataTimeId)
                    updateDataTimeId = null;
                }
            } else {
                sensorLayer.show()
                mockDataChange()
            }
        }
        
        // Switch 2D/3D view
        const switchView = (is3dView) => {
            if (is3dView) {
                showHideExtrusionLayer(false)
                map.flyTo({
                    pitch: 60
                });
            } else {
                showHideExtrusionLayer(true)
                map.flyTo({
                    pitch: 0
                });
            }
        }
        
        
        const createLeaderMarker = (lnglat, content) => {
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.position = 'relative'
        
            let img = document.createElement("div");
            img.style.backgroundImage =
                'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4AAAAAlCAYAAACj1PQVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTJFMTU1RjExN0UzMTFFOTg3RTBFODdGNTY0NThGQkUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MTJFMTU1RjIxN0UzMTFFOTg3RTBFODdGNTY0NThGQkUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxMkUxNTVFRjE3RTMxMUU5ODdFMEU4N0Y1NjQ1OEZCRSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxMkUxNTVGMDE3RTMxMUU5ODdFMEU4N0Y1NjQ1OEZCRSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pj97JFoAAAV9SURBVHja7N1faJ1nHQfw33nzpuekaZfWNFmbLHXWdf7DWgvebF4M0SEZhTG8mKvFyzG9UJFKh9peVGnd0DkE/10Ic6s6BBEGbshggho3BVGnRnC2s1n/ras2J2uzc05PXp+3yZzSm7XJkvfi84HveZ9z3ve8F7/bL8/71oqiiMs8NhCLsCllfcpfAwAAAAAAAIDlsXM68jfgtl9K2Z3Sa8IAAAAAAAAAb7hjKW8uF9kS3/jdKR9PaZkxAAAAAAAAwPJa6h3A96X0pBxK+bLxAgAAAAAAACyfpSyAP5jy4ZQXUh747687p00ZAAAAAAAAYBlkS3if+xfW+1MuGC0AAAAAAADA8lqqAnh3yvaUZ1MeMlYAAAAAAACA5bcUBXBfyoGF9edSusYKAAAAAAAAsPyWogD+VMpYypMpTxgpAAAAAAAAwMpYbAG8IWVvylzKHuMEAAAAAAAAWDmLLYC/mDKQ8nDKH4wTAAAAAAAAYOUspgC+IeWelNmYL4IBAAAAAAAAWEGLKYAPpfSmfD1lyigBAAAAAAAAVtbVFsA3pdyR8lLMF8EAAAAAAAAArLCrKYBrKfcvHA+kNI0RAAAAAAAAYOVdTQFc7vwtdwA/l/ItIwQAAAAAAACohistgMt3/h5cWO9N6RghAAAAAAAAQDVcaQF8d8rWlImUnxgfAAAAAAAAQHVcSQF8Tcq+lCJlz8IRAAAAAAAAgIq4kgK4fOTzUMzv/J0wOgAAAAAAAIBqeb0F8FjKp2P+nb97jQ0AAAAAAACgel5vAXwgpS/l2ynPGRsAAAAAAABA9eSjd370sh+P7/q/r9tTdqc0Y74IBgAAAAAAAKCC8v9Zl7uB6yn9o4fHG+lYS2n/867Hv5bXivLcoZQzRgYAAAAAAABQTfnw5nvjxWMHe9N6cP+OyVtv2nj2ruFG6209WbGqM5c181rx9m5RO/ngn2/4zlf/tLV2fNfPCmMDAAAAAAAAqJ68LH+HGq2xRz7wu2+8a31zvCgiLs5FlC3vqp4YKS8638mzqZf7tqXlb1MuGBsAAAAAAABA9ZSPdh58tfyd7UScOh9xYjqLszNZlGVwN6U/71z7hR1/e/g9g9NbRg+P9xobAAAAAAAAQPVk+3ZMfujV8vf0TC3WXWzE9ZveHyNjt0UxOxCnp7NotiPWr2pfl67dk/6zxtgAAAAAAAAAqie7eePZXeVO33OtiOGsHqtvfjDi1scibnkkesafipHVI3HuQi3a3Yh3rpsZT/+5ZvTweM3oAAAAAAAAAKolH2q0byzf+dtuZ9G/8b0RW+587ezat0a84xPR+8z+aHU7MVDvbLhl05lrf3FyaGr08Hj5muA4/qMfmiIAAAAAAABABWS1KPJLTW75UR+8/Ir6uksvCi6K+a/Dfa26sQEAAAAAAABUT/ZyJz+Z19IiL6J7eiLi/NRrZ4tuxNEfRzvmorcnoj2XvfL41MZTMV8XAwAAAAAAAFAh2eS5tU9kWcRAo4ipC9MRP98ZMfnNiH/8IOLJO+LMC7+ORl83Gj0RR5r9z8x08nOhAAYAAAAAAAConPyzT2976H1D//7YYL21ZW5NN442n4/ep/ddeuxzK+air68bb2pEdCN75dEj192Xfp4xNgAAAAAAAIDqyWY6+akHnt16d7Oz6uRAPWJkoIi1azuxek0nhge6MdQXUatlrZ8+P/L5706+ZSLKXhgAAAAAAACAyik3+s5+/++bJ+751fbbfv/S+kc7c/l0WQSva0TUe2rtIzNrJr7yxxs/8pnfbPteurY5vPlej38GAAAAAAAAqKC8LHRfPHZw9penNvwl5ZP1nrmB268/MdafX+x96sTQ8aMz/f9K102ntJS/AAAAAAAAANX1HwEGAM75MhcANnAkAAAAAElFTkSuQmCC")';
            img.style.backgroundRepeat = "no-repeat"
            img.style.height = '37px';
            img.style.width = '100px';
            img.style.position = 'absolute';
            img.style.left = '-3px';
            img.style.bottom = '-3px';
            img.style.right = "0px"
            el.appendChild(img);
        
            let panel = document.createElement("div");
            panel.style.height = '50px';
            panel.style.width = '200px';
            panel.style.position = 'absolute';
            panel.style.left = '97px';
            panel.style.top = '-60px';
            panel.style.border = "solid 1px #8E0EFF";
            panel.style.background = 'linear-gradient(#00ffff, #00ffff) left top,  linear-gradient(#00ffff, #00ffff) left top,     linear-gradient(#00ffff, #00ffff) right bottom,    linear-gradient(#00ffff, #00ffff) right bottom';
            panel.style.backgroundRepeat = 'no-repeat';
            panel.style.backgroundColor ='rgba(87,255,255, 0.3)'
            panel.style.backgroundSize = '1px 6px, 6px 1px';
            panel.style.fontSize = '18px';
            panel.style.color = '#ffffff';
            panel.innerHTML =  `<div style='margin: 15px'>${content}</div>`;
            el.appendChild(panel);
        
            // Add markers to the map.
            let marker = new vjmap.Marker({
                element: el,
                anchor: "bottom-left"
            })
            marker.setLngLat(lnglat)
                .addTo(map);
            return marker
        }
        
        createLeaderMarker(map.toLngLat([587620983.82089, 3104004010.05005]), "Community monitoring demo")
        
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Demo - VJMap</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => switchView(false) }>2D view</button>
                        <button className="btn" onClick={ () => switchView(true) }>3D view</button>
                        <button className="btn" onClick={ () => showHidePersonLayer(true) }>Close person layer</button>
                        <button className="btn" onClick={ () => showHidePersonLayer(false) }>Show person layer</button>
                        <button className="btn" onClick={ () => postionToPerson(0) }>Locate person</button>
                        <button className="btn" onClick={ () => showPersonRoute() }>Person route replay</button>
                        <button className="btn" onClick={ () => { hidePersonRoute(); showHidePersonLayer(false) }}>Close route replay</button>
                        <button className="btn" onClick={ () => showHideSensorLayer(true) }>Close sensor layer</button>
                        <button className="btn" onClick={ () => showHideSensorLayer(false) }>Show sensor layer</button>
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