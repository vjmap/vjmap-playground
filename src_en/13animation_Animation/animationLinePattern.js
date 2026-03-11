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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationLinePattern
        // --Line pattern path animation--
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
    pitch: 0, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();
map.setRasterOpacity(svc.rasterLayerId(), 0.3);

const mapBounds = map.getGeoBounds(0.6);
/*
Method 1
 */
await map.loadImageEx(`arrow2`, `../../assets/images/arrow.png`);
const lines2 = mapBounds.randomGeoJsonLineCollection(3, 3);
map.addGeoJSONSource('lines2', map.toLngLat(lines2));
map.addSymbolLayer("SymbolLayer2", "lines2", {
    iconImage: "arrow2",
    symbolPlacement: 'line',
    iconAllowOverlap: true,
    iconRotationAlignment: "map",
    symbolSpacing: 64,
    iconSize: 1,
    iconOffset: [0,0],
    iconPadding: 0
});
map.addLineLayer("lineLayer2", "lines2", {
    lineColor: "green",
    lineWidth: 16,
    lineOpacity: 0.5
});

vjmap.createAnimation({
    from: 0,
    to: 64,
    repeat: Infinity,
    duration: 2000,
    ease:vjmap.linear, // Linear
    onUpdate: latest => {
        map.setLayoutProperty('SymbolLayer2', 'icon-offset', [latest, 0]);
    }
})
/*
Method 2
 */
const size = 32;
const arrow = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    // Get map canvas context when layer added
    onAdd: function () {
        let canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
    },

    // Called before each frame
    render: function () {
        const duration = 800;
        let t = (performance.now() % duration) / duration / 2;

        const len = size / 2;
        let context = this.context;
        context.clearRect(0, 0, this.width, this.height);
        const x = t * size;
        const y = 0;
        context.beginPath();
        context.strokeStyle = "#058";
        context.lineWidth = 5;
        context.moveTo(x,0);
        context.lineTo(x + len,size / 2);
        context.lineTo(x,size);
        context.stroke();
        this.data = context.getImageData(
            0,
            0,
            this.width,
            this.height
        ).data;
        // Redraw map for smooth animation
        map.triggerRepaint();

        // Return true so map knows image updated
        return true;

    }
};

map.addImage('arrow', arrow, { pixelRatio: 2 });

const lines = mapBounds.randomGeoJsonLineCollection(1, 3);
map.addGeoJSONSource('lines', map.toLngLat(lines));
map.addSymbolLayer("SymbolLayer", "lines", {
    iconImage: "arrow",
    symbolPlacement: 'line',
    iconAllowOverlap: true,
    iconRotationAlignment: "map",
    symbolSpacing: 1,
    iconSize: 1
});
map.addLineLayer("lineLayer", "lines", {
    lineColor: "yellow",
    lineWidth: 16,
    lineOpacity: 0.5
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