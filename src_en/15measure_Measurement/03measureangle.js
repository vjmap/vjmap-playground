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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/measure/03measureangle
        // --Measure angle--
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
// Get map bounds
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
// Create geo projection from map bounds
let prj = new vjmap.GeoProjection(mapExtent);

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterStyle(), // style, raster style here
    center: prj.toLngLat(mapExtent.center()), // set map center
    zoom: 2, // set map zoom level
    renderWorldCopies: false, // do not show multi-world copies
    doubleClickZoom: false // disable double-click zoom
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
map.fitMapBounds();


const addStyle = cssStyle => {
    let style = `<style>${cssStyle }</style>`;
    let ele = document.createElement('div');
    ele.innerHTML = style;
    document.getElementsByTagName('head')[0].appendChild(ele.firstElementChild)
}
// Add custom popup style
addStyle(`
                .custom-popup .vjmapgis-popup-content {
                    background-color: #0EFFC2;
                    opacity: 0.7;
                }
                .custom-popup .vjmapgis-popup-tip {
                    border-top-color: #0EFFC2;
                    opacity: 0.7;
                }
            `)

let popup = null;
const setPopupText = text => {
    if (text) {
        if (!popup) {
            popup = new vjmap.Popup({
                className: "custom-popup",
                closeOnClick: false,
                closeButton: false
            })
                .setHTML(text)
                .setMaxWidth("500px")
                .trackPointer()
                .addTo(map)
        }
        else {
            popup.setHTML(text);
        }
    } else {
        // Remove popup when empty
        if (popup) {
            popup.setLngLat([0,0]); // cancel trackPointer
            popup.remove();
            popup = null;
        }
    }

}

let snapObj = {}; // snap features

// Measure angle
const measureAngle = async ()=> {
    let isDrawing = false;
    let line = await vjmap.Draw.actionDrawLineSting(map, {
        pointCount: 3,// only 3 points; auto-finish after drawing 3 points
        api: {
            getSnapFeatures: snapObj // snap data assigned via features property
        },
        updatecoordinate: (e) => {
            if (!e.lnglat) return;
            isDrawing = true;
            const co = map.fromLngLat(e.feature.coordinates[e.feature.coordinates.length - 1]);
            let html = `Current coordinates:<span style="color: #ff0000"> ${co.x.toFixed(2)}, ${co.y.toFixed(2)}</span>`;
            if (e.feature.coordinates.length == 1) {
                html += "<br/>Specify the first point for measurement"
            } else {
                let len = e.feature.coordinates.length;
                html += `<br/>Alt: snap; Ctrl: ortho; Backspace: remove last point`
                html += `<br/>Current angle: <span style="color: #ff0000">${getAngle(e.feature.coordinates).angle}</span>`
            }
            setPopupText(html)
        },
        contextMenu: (e) => {
            new vjmap.ContextMenu({
                event: e.event.originalEvent,
                theme: "dark", //light
                width: "250px",
                items: [
                    {
                        label: 'Confirm',
                        onClick: () => {
                            // Simulate Enter key to finish
                            map.fire("keyup", {keyCode:13})
                            setPopupText("");
                        }
                    },
                    {
                        label: 'Cancel',
                        onClick: () => {
                            // Simulate ESC key to cancel
                            map.fire("keyup", {keyCode:27})
                            setPopupText("");
                        }
                    },{
                        label: 'Remove last point',
                        onClick: () => {
                            // Simulate Backspace to remove last point
                            map.fire("keyup", {keyCode:8})
                        }
                    },{
                        label: 'Finish measure angle',
                        onClick: () => {
                            // Simulate ESC to finish
                            map.fire("keyup", {keyCode:27})
                            isDrawing = false;
                            setPopupText("");
                        }
                    }
                ]
            });

        }
    });
    if (line.cancel) {
        setPopupText("");
        return {
            cancel: true,
            exit: isDrawing === false // finish if cancelled before drawing
        };// cancel operation
    }

    let color = vjmap.randomColor();
    let polyline = new vjmap.Polyline({
        data: line.features[0].geometry.coordinates,
        lineColor: color,
        lineWidth: 2
    });
    polyline.addTo(map);
    addMarkersToAngle(line.features[0].geometry.coordinates, color, polyline.sourceId);
    return {
        polyline
    };
}

// Measure angle loop until ESC to cancel; after each line, continue with next
const measureAngleLoop = async ()=> {
    while(true) {
        let res = await measureAngle();
        if (res.exit === true) break;
    }
}

measureAngleLoop();

// Add measurement result value
const addMarkersToAngle = (coordinates, color, sourceId) => {
    if (coordinates.length < 3) return;
    let markerTexts = [];
    let points = map.fromLngLat(coordinates);
    let textPoint = coordinates[1];
    let ang = getAngle(coordinates);
    // Draw annotation arc
    const cirleArcPath = vjmap.getCirclePolygonCoordinates(
        points[1],
        points[1].distanceTo(points[0]) / 4.0, 36,
        ang.startAngle,  ang.endAngle, false);
    let path = new vjmap.Polyline({
        data: map.toLngLat(cirleArcPath),
        lineColor: color,
        lineWidth: 2
    });
    path.addTo(map);
    markerTexts.push(path)

    let arcPoints = path.getData().features[0].geometry.coordinates;
    let arcMid = arcPoints[Math.ceil(arcPoints.length / 2)];// midpoint
    let textAngle = vjmap.radiansToDegrees(-map.fromLngLat(arcMid).angleTo(points[1])) + 90;
    if (textAngle > 90) textAngle += 180;
    else if (textAngle > 270) textAngle -= 180;
    let text = new vjmap.Text({
        text: ang.angle,
        anchor: "center",
        rotation: textAngle,
        offset: [0, 0], // pixel offset x, y
        style:{     // custom style
            'cursor': 'pointer',
            'opacity': 0.8,
            'padding': '6px',
            'border-radius': '12px',
            'background-color': color,
            'border-width': 0,
            'box-shadow': '0px 2px 6px 0px rgba(97,113,166,0.2)',
            'text-align': 'center',
            'font-size': '14px',
            'color': `#${color.substr(1).split("").map(c => (15 - parseInt(c,16)).toString(16)).join("")}`,
        }
    });
    text.setLngLat(arcMid).addTo(map);
    markerTexts.push(text);
    // Add delete marker at first point
    const deletePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAbNJREFUWEftlrFOAkEQhv9Z4XgJOCrlTgp5ABOhMBoTCws7EzUaeAx5A0sDiYmFxpLGaAkU2KqFArHi4CU4cMccAQN6HHcIwZi7cnd25tt/5maHsOCPFhwfPoAnBarhQFIIccjAkV3qCMhKKct6q1tym1pPAHVVOWMg6+ScgKuYYR7PBaCmKmw5XgLiy4b5NhzkXVVWP4BXa00zTNcXc21oOR4AjAswaX9M2n4u1yLBIoiSbmV0Zcdc0pqd1HdbWwUWDuDqRjMy8lQDM4o54sYRoJcKq6qHclePKnuScQ0pd/RWt2ztVyOhLUFckIwTvWneDiLYnXdVA18O+r/dcNXXIsozCGsMzuhGJ98DUINpAuUAqmhGe33k/JjiG9g4K2ADUFdDOQan7QAIlI8Z7YwP4CvgK/C/FahFlQcwtm0bEeNFa5qJuSpgdT2AzkFyU290H3udMBzYgBD3gnAQa5iFuQJ4eZB6A8ovW/ETgARLmfIyaPZVSZIQRTBdas326Thwx7fAzRA6SREB2l0x2ndTAfTnwH0CrGk4PinY6D5VQHyhNcwbp3N/eyDxduPprH0FPgHEyH4wGIHUYwAAAABJRU5ErkJggg==";
    let el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage =
        `url(${deletePng})`;
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.backgroundSize = '100%';
    el.style.cursor = "pointer";

    el.addEventListener('click', function (e) {
        map.removeSourceEx(sourceId); // remove drawn line
        markerTexts.forEach(m => m.remove());
        markerTexts = [];
    });
    // Add markers to the map.
    let deleteMarker = new vjmap.Marker({
        element: el,
        anchor: 'right'
    });
    deleteMarker.setLngLat(coordinates[1])
        .setOffset([-5, 0])
        .addTo(map);
    markerTexts.push(deleteMarker)

    // Add coordinates to snap array
    addSnapCoordinates(coordinates);
}
// Get angle value
const getAngle = (coordinates) => {
    let points = map.fromLngLat(coordinates);
    if (points.length < 3) return {  angle: 0.0 }
    let angle1 = points[0].angleTo(points[1]);
    let angle2 = points[2].angleTo(points[1]);
    let angle = angle1 - angle2;
    let deg = vjmap.radiansToDegrees(angle);// radians to degrees
    let dir = true;
    if (deg < 0) {
        deg = -deg;
        dir = !dir;
    }
    if (deg > 180) {
        deg = 360 - deg;
        dir = !dir;
    }
    let startAngle = !dir ? vjmap.radiansToDegrees(angle1) : vjmap.radiansToDegrees(angle2);
    let endAngle = dir ? vjmap.radiansToDegrees(angle1) : vjmap.radiansToDegrees(angle2);
    startAngle = startAngle < 0 ? 360 + startAngle : startAngle;
    endAngle = endAngle < 0 ? 360 + endAngle : endAngle;
    if (endAngle < startAngle) {
        endAngle += 360;
    }
    return {
        angle: deg.toFixed(2) + "°",
        dir,
        startAngle,
        endAngle
    }
}
// Add snap point
const addSnapCoordinates = (coordinates) => {
    snapObj.features.push({
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: [...coordinates]
        }
    })
}

// Get snap points
if (map.hasVectorLayer()) {
    // Vector style
    // Get snap points from vector layer
    snapObj.features = map.queryRenderedFeatures({layers: ['vector-layer-lines']})
} else {
    // Raster: fetch coordinates from server
    // Get snap points from raster
    // Query all coordinate data; see https://vjmap.com/guide/svrStyleVar.html for field reference
    let res = await svc.conditionQueryFeature({ fields:"s3", condition:"s3 != ''", limit: 100000})
    res = res.result.map(e => e.s3.split(";"))
    snapObj.features = []
    for(let item of res) {
        let coordinates = []
        for(let pt of item) {
            const p = pt.split(",")
            if (p.length >= 2) {
                coordinates.push(map.toLngLat([+p[0], +p[1]]))
            }
        }
        if (coordinates.length == 1) {
            snapObj.features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: coordinates[0]
                }
            })
        }
        else if (coordinates.length > 1) {
            snapObj.features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: coordinates
                }
            })
        }

    }
}

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