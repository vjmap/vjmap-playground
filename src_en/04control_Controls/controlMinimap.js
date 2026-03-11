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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/control/controlMinimap
        // --Minimap control (overview)--
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
    style: svc.rasterStyle(), //svc.rasterBlankStyle(0, 24), // style, raster style here
    center: prj.toLngLat(prj.getMapExtent().center()), // set map center
    zoom: 2, // set map zoom level
    renderWorldCopies: false // do not show multi-world copies
});


// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
map.fitMapBounds();

await map.onLoad();

map.addControl(new vjmap.MiniMapControl({
    containerStyle: {
        background: "#31346a85",
        transform: "scale(0.6)",
        transformOrigin: "100% 0%"
        //'top-right'
        //transformOrigin: "100% 0%"
        //'top-left'
        //transformOrigin: "0% 0%"
        //'bottom-right'
        //transformOrigin: "100% 100%"
        //'bottom-left'
        //transformOrigin: "0% 100%"
    }
}), 'top-right');


/* To set map rotation, use the code below */
/*
// Get initial map bearing; or use custom value
let bearing = svc.currentMapParam().view.bearing
// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterStyle(), //svc.rasterBlankStyle(0, 24), // style, raster style here
    center: prj.toLngLat(prj.getMapExtent().center()), // set map center
    zoom: 2, // set map zoom level
    bearing: bearing, // set bearing
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);

await map.onLoad();

let ctrl = new vjmap.MiniMapControl({
    containerStyle: {
        background: "#31346a85",
        transform: "scale(0.6)",
        transformOrigin: "100% 0%"
    }
})

map.addControl(ctrl, 'top-right');
// Set overview control bearing
ctrl.getMap().setBearing(bearing)
// Set main map bearing
map.setBearing(bearing)
// Sync bearing back after overview drag
ctrl.getMap().on("mouseup", () => map.setBearing(bearing));
*/

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