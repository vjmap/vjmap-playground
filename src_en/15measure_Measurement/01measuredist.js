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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/measure/01measuredist
        // --Measure distance--
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
// Popup follows pointer

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

// Measure distance
const measureDist = async ()=> {
    let isDrawing = false;
    let line = await vjmap.Draw.actionDrawLineSting(map, {
        api: {
            getSnapFeatures: snapObj // snap data assigned via features property
        },
        updatecoordinate: (e) => {
            if (!e.lnglat) return;

            /*
            // To specify start point in advance, use:
            if (e.state.line.coordinates.length == 1) {
                // Add first point as start when drawing first point
                e.state.line.coordinates.unshift(map.toLngLat([
                    587662045.9814225, // cad x
                    3103973655.658176 // cad y
                ]))
                e.state.currentVertexPosition = 1;
            }*/

            isDrawing = true;
            const co = map.fromLngLat(e.feature.coordinates[e.feature.coordinates.length - 1]);
            let html = `Current coordinates:<span style="color: #ff0000"> ${co.x.toFixed(2)}, ${co.y.toFixed(2)}</span>`;
            if (e.feature.coordinates.length == 1) {
                html += "<br/>Specify the first point for measurement"
            } else {
                let len = e.feature.coordinates.length;
                html += `<br/>Alt: snap; Ctrl: ortho; Backspace: remove last point`
                html += `<br/>Distance from last point: <span style="color: #ff0000">${getDist([e.feature.coordinates[len - 2], e.feature.coordinates[len -1]])}</span>`
                html += `;  Total distance: <span style="color: #ff0000">${getDist(e.feature.coordinates)}</span>`
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
                        label: 'Finish measure',
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
    addMarkersToLine(line.features[0].geometry.coordinates, color, polyline.sourceId);
    return {
        polyline
    };
}

// Measure distance loop until ESC to cancel; after each line, continue with next
const measureDistLoop = async ()=> {
    while(true) {
        let res = await measureDist();
        if (res.exit === true) break;
    }
}

measureDistLoop();

const clearAll  = (map)=> {
    // Clear drawn layers; to avoid accidental delete, record sourceId and marker after each draw
    // @ts-ignore
    Object.keys(map.getStyle().sources).filter(e=>e.indexOf("custom_") == 0).forEach(e=> map.removeSourceEx(e));
    // Remove all markers
    map.removeMarkers();
}
// Add measurement result to each point on line
const addMarkersToLine = (coordinates, color, sourceId) => {
    let markerTexts = [];
    for(let i = 1; i < coordinates.length; i++) {
        let text = new vjmap.Text({
            text: getDist(coordinates.slice(0, i + 1)),
            anchor: "left",
            offset: [3, 0], // pixel offset x, y
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
        text.setLngLat(coordinates[i]).addTo(map);
        markerTexts.push(text);
    }
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

        // Simulate Backspace to remove last point
        map.fire("keyup", {keyCode:8})
    });
    // Add markers to the map.
    let deleteMarker = new vjmap.Marker({
        element: el,
        anchor: 'right'
    });
    deleteMarker.setLngLat(coordinates[0])
        .setOffset([-5, 0])
        .addTo(map);
    markerTexts.push(deleteMarker)

    // Add coordinates to snap array
    addSnapCoordinates(coordinates);
}
// Get distance value
const getDist = (coordinates) => {
    let result = vjmap.Math2D.lineDist(map.fromLngLat(coordinates));
    let unit = "m";
    if (result >= 1000) {
        result /= 1000;
        unit = "km";
    } else if (result < 0.01) {
        result *= 100;
        unit = "cm";
    }
    return result.toFixed(2) + " " + unit;
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