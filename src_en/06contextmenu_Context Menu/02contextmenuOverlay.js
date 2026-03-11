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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/contextmenu/02contextmenuOverlay
        // --Overlay layer context menu--
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
    style: svc.rasterStyle(), // style, raster style here
    center: prj.toLngLat(prj.getMapExtent().center()), // set map center
    zoom: 2, // set map zoom level
    renderWorldCopies: false
});


// Attach service and projection
map.attach(svc, prj);
await map.onLoad();

// Add polygons for testing; right-click on polygon shows polygon context menu, otherwise map context menu
let mapBounds = map.getGeoBounds(0.6);

let len = mapBounds.width() / 50;
let polygons = []
for(let i = 0; i < 200; i++) {
    const p1 = mapBounds.randomPoint();
    const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
    const p3 = vjmap.geoPoint([p1.x + len, p1.y]);
    polygons.push({
        points: map.toLngLat([p1, p2, p3]),
        properties: {
            name: "polygon" + (i + 1),
            color: vjmap.randomColor()
        }
    })
}

let polygon = new vjmap.Polygon({
    data: polygons,
    // If hover, use red; else use properties.color
    fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
    fillOpacity: 0.8,
    fillOutlineColor: "#f00",
    isHoverPointer: true,
    isHoverFeatureState: true
});
polygon.addTo(map);
polygon.clickLayer(e => message.info(`You clicked polygon #${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}`))


// By default map menu is shown (key is empty); when setMenu is called multiple times, keys sort descending, empty is last
map.setMenu(event => {
    return new vjmap.ContextMenu({
        event: event.originalEvent,
        theme: "dark", //light
        width: "250px",
        items: [
            {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">Map context menu</span>`},
            {
                label: 'Show full extent',
                onClick: () => {
                    map.setBearing(0);
                    map.setPitch(0);
                    map.fitMapBounds();
                }
            },
            {
                label: 'Get coordinates at this location',
                onClick: () => {
                    let point = map.fromLngLat(event.lngLat);
                    message.info({content: `Current coordinates: x: ${point.x}, y: ${point.y}`, key: "info", duration: 3});
                }
            }
        ]
    });
})

// Set menu when clicking overlay; key is custom. If function returns null, map menu is shown; else this menu is shown
map.setMenu(event => {
    let features = map.queryRenderedFeatures(event.point, {
        layers: [polygon.layerId]
    });
    if (features.length == 0) {
        // No polygon at click; show default map menu
        return null;
    }
    // Polygon at click; show polygon layer context menu
    return new vjmap.ContextMenu({
        event: event.originalEvent,
        theme: "dark", //light
        width: "250px",
        items: [
            {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">Polygon layer context menu</span>`},
            {
                label: 'View selected polygon info',
                onClick: () => {
                    message.info({content: `Polygon ID: ${features[0].properties.id}, color: ${features[0].properties.color}`, key: "info", duration: 3});
                }
            },
            {
                label: 'Delete',
                onClick: () => {
                    let data = polygon.getData();
                    data.features = data.features.filter(f => f.id != features[0].properties.id);
                    polygon.setData(data);
                }
            }
        ]
    });
}, "overlay")



// Draw control context menu
const draw = new vjmap.Draw.Tool();
map.addControl(draw, 'top-right');

map.on("draw.simpleselect.contextmenu", function (e) {
    // Ignore if not this draw object's event
    if (e.styleId != draw.options.styleId) return;
    let feature = e.event.featureTarget
    if (!feature) return
    //if (draw.getMode() != "simple_select") return
    let selectFeatureId = feature.properties.id
    // Must be selected to right-click
    let selectIds = draw.getSelectedIds() || []
    if (selectIds.indexOf(selectFeatureId)== -1) return
    let event = e.event.originalEvent
    // Prevent default map context menu
    event.preventDefault();
    event.stopPropagation();

    return new vjmap.ContextMenu({
        event: event,
        theme: "dark", //light
        width: "250px",
        items: [
            {
                label: "Delete",
                onClick: () => {
                    draw.delete(selectFeatureId)
                }
            }
        ]
    });
});

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