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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/05animationTraffic
        // --Traffic flow animation layer--
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
    doubleClickZoom: false
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();

map.setRasterOpacity(svc.rasterLayerId(), 0.3);

let geoDatas = [];
for(let i = 1;  i <= 10; i++) {
    let mapBounds = map.getGeoBounds(i / 30.0);
    let points = mapBounds.toPointArray();
    points.push(points[0]); // Close
    geoDatas.push({
        points: map.toLngLat(points),
        id: i,
        properties: {
            lineWidth: 4 + i * 1,
            name: `${i} ring`,
            status: i < 3 ? "red" : (vjmap.randInt(0, 1) === 0 ? "yellow" : "green")
        }
    });
}

const loadUrlImage = (src) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            resolve(image)
        }
        image.onerror = ()=> {
            reject(`load image ${src} error`)
        }
    })
}

// Batch same-route draws for performance; avoid per-line renders.
const createTrafficRoute = async (color, speed) => {
    let img = await loadUrlImage(env.assetsPath + `images/${color}.png`);
    // Load image to create animation image set
    let createImagesOptions = {
        canvasWidth: img.width,
        canvasHeight: img.height * 3,
        frameCount: 4,
        fillColor: "#1E5AA4",
        draw: (context, width, height, opts) => {
            // Draw callback for first frame (context, width, height, opts)
            // Fill background
            if (opts.fillColor) {
                context.fillStyle = opts.fillColor;
                context.fillRect(0, 0, width, height );
            }
            // Center image
            context.drawImage(img, 0, 0, img.width, img.height, 0, height / 2.0 - img.height / 2.0, width, img.height)
        }
    };
    let animateImages = vjmap.createAnimateImages(createImagesOptions);
    // Data set empty; populate from traffic data
    let animateLine = vjmap.createAnimateLineLayer(map, [], {
        animateImages,
        lineWidth: ['get', 'lineWidth'],
        lineOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
        isHoverPointer: true,
        isHoverFeatureState: true,
        speed
    });
    animateLine.polyline.clickLayer(e => message.info(`Clicked ${e.features[0].id}, name: ${e.features[0].properties.name}`))
    animateLine.polyline.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
    return animateLine;
}
let greenRoute = await createTrafficRoute("green", 4); // Green route
let yellowRoute = await createTrafficRoute("yellow", 1); // Yellow route
let redRoute = await createTrafficRoute("red", 0.5); // Red route

// Set data
const setRouteData = ()=> {
    greenRoute.updateData(geoDatas.filter(d => d.properties.status === "green"));
    yellowRoute.updateData(geoDatas.filter(d => d.properties.status === "yellow"));
    redRoute.updateData(geoDatas.filter(d => d.properties.status === "red"));
}
setRouteData();

// Simulate traffic data change
setInterval(()=> {
    geoDatas.forEach(d => d.properties.status = vjmap.randInt(0, 2) === 0 ? "red" : (vjmap.randInt(0, 1) === 0 ? "yellow" : "green"));
    setRouteData();
}, 3000)

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