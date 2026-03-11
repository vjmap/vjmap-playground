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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationMarker
        // --Marker animation--
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
    pitch: 40, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();
map.setRasterOpacity(svc.rasterLayerId(), 0.3);

let pixelPos = [100, 0];
const marker = new vjmap.Marker();
marker.setLngLat(map.unproject(pixelPos));
marker.addTo(map);

vjmap.createAnimation({
        from: 0,
        to: 450, // pixel y distance
        duration: 3000,
        ease:vjmap.linear, // linear
        onUpdate: latest => {
            marker.setLngLat(map.unproject([100, latest]));
        }
    }
);

let greenPixelPos = [200, 0];
const greenMarker = new vjmap.Marker({
    color: "green"
});
greenMarker.setLngLat(map.unproject(greenPixelPos));
greenMarker.addTo(map);

vjmap.createAnimation({
        from: 0,
        to: 450, // pixel y distance
        duration: 3000,
        type: "spring", // spring bounce
        stiffness: 100, // spring stiffness (higher = faster)
        damping: 5, // damping (opposite of stiffness)
        mass: 2, // object mass (heavier = slower accel)
        velocity: 10, // initial velocity per second
        bounce: 1, // bounce 0-1 (0 = no bounce)
        onUpdate: latest => {
            greenMarker.setLngLat(map.unproject([200, latest]));
        }
    }
);

let redPixelPos = [300, 0];
const redMarker = new vjmap.Marker({
    color: 'red'
});
redMarker.setLngLat(map.unproject(redPixelPos));
redMarker.addTo(map);

vjmap.createAnimation({
        from: 0,
        to: 450, // pixel y distance
        duration: 3000,
        type: "decay", // decay for inertia
        velocity: 450, // initial velocity per second
        power: 0.8, // target value constant (higher = farther)
        timeConstant: 400, // deceleration duration
        min: 0, // min value for spring capture
        max: 100, // max value for spring capture
        bounceStiffness: 500, // spring stiffness at min/max
        bounceDamping: 10, // spring damping at min/max
        onUpdate: latest => {
            redMarker.setLngLat(map.unproject([300, latest]));
        }
    }
);
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