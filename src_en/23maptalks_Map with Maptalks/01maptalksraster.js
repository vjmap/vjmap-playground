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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/maptalks/01maptalksraster
        // --Load VJMap CAD raster tiles with MapTalks--

// MapTalks: https://maptalks.org/ | https://github.com/maptalks/maptalks.js
if (typeof L !== "object") {
    // If no MapTalks environment
    await vjmap.addScript([{
        src: "../../js/maptalks1.0rc14/maptalks.min.js"
    },{
        src: "../../js/maptalks1.0rc14/maptalks.css"
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
// Set resolution per level
let resolutions= [];
for(let i = 0; i < 25; i++) {
    resolutions.push(mapBounds.width() / (512 * Math.pow(2, i - 1)))
}

// Create MapTalks map
let map = new maptalks.Map('map', {
    center: mapBounds.center().toArray(), // initial center
    zoom:  2, // initial zoom
    zoomControl: true,
    attribution: false,
    // spatial reference based on CAD extent
    spatialReference : {
        projection : 'identity',
        resolutions : resolutions,
        fullExtent : {
            'top': mapBounds.max.y,
            'left': mapBounds.min.x,
            'bottom': mapBounds.min.y,
            'right': mapBounds.max.x
        }
    }
});

// Add tile layer
let layer = new maptalks.TileLayer('base', {
    tileSystem: [1, -1, mapBounds.min.x, mapBounds.max.y],
    urlTemplate: svc.rasterTileUrl(), // CAD raster tile URL
    repeatWorld: false
});
map.addLayer(layer);

map.on('click', (e) => console.log(message.info(`Coordinates clicked: ${e.coordinate.x}, ${e.coordinate.y}`)));

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