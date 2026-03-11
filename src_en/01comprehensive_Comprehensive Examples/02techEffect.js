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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/02techEffect
        // --Tech effect display--
// Map service object
// Note: This example uses the legacy vjthree 3D library; VJMap 3D is updated. See latest demo:
// https://vjmap.com/map3d/demo/#/demo/map/entity/custom/05entitycustommap2d
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render mode
    style:{
        name: "styleDark", // style name
        backcolor: 0, // background color when opening map on server
        // Custom expression
        expression: "var color := gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);gOutColorAlpha[0] := 50;"
    }
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
    style: svc.rasterStyle(), // style, raster here
    center: prj.toLngLat(mapExtent.center()),
    zoom: 0,
    pitch: 60,
    antialias: true,
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();

const mapBounds = map.getGeoBounds(0.6);
let len = mapBounds.width() / 20;
const center = map.getCenter();

if (typeof vjThree !== "object") {
    // If env not loaded
    await vjmap.addScript([{
        src: "../../js/plugins/vjthree.min.js"
    }, {
        src: "../../js/plugins/vjthree.min.css"
    }])
}

const threeContext = map.createThreeJsContext({
    defaultLights: true,
    enableSelectingObjects: false
});
map.addLayer(new vjmap.ThreeLayer({ context: threeContext }));



// Query coordinates for light wall line
let query = await svc.conditionQueryFeature({
    condition: `objectid='9BE'`, // SQL WHERE clause only; see doc "Server condition and expression query"
    // Query all text (single-line, multi-line, block note, attribute). See doc for CAD entity type codes.
    // condition: `name='12' or name='13' or name='26' or name='27'`,
    fields: ""
})
let linePoints = [];
if (query.error) {
    message.error(query.error)
} else {
    if (query.recordCount > 0) {
        let points = query.result[0].points; // Get point sequence
        linePoints = points.split(";").map(p => vjmap.GeoPoint.fromString(p));
        // Close
        linePoints.push(linePoints[0]);
        threeContext.wall(linePoints, {
            height: 40000
        })
    }
}


let c = mapExtent.center();
linePoints[0] = c;

for(let i = 0; i < linePoints.length; i++) {
    if (i != 0) {
        // Add flyline from center to point
        threeContext.flyline({
            source: {
                x: c.x,
                y: c.y,
                z: 0
            },
            target: {
                x: linePoints[i].x,
                y: linePoints[i].y,
                z: 0,
            },
            count: 1000,
            range: 200,
            height: 300000,
            color: vjmap.randomColor(),
            color2: vjmap.randomColor(),
            size: 30
        });
    }

    let pt = linePoints[i];
    pt.z = 1000;
    // Create pyramid
    threeContext.coneMesh(pt, {
        size: 10240,
        color: vjmap.randomColor()
    });

    // Create wave ring
    threeContext.wave(linePoints[i], {
        color: vjmap.randomColor(),
        size: 5000
    });
}

// Create radial gradient sphere
threeContext.radialGradient(c, {
    color: new THREE.Vector3(0.0,1.0,1.0),
    size: 50000
});

// Create wave ring wall
threeContext.waveWall(c, {
    color: "#ffff00",
    height: 4000
});

// Add firework background
for(let i = 0; i < 20; i++) {
    let pt = mapExtent.randomPoint();
    threeContext.flyline({
        source: {
            x: pt.x,
            y: pt.y,
            z: 0
        },
        target: {
            x: pt.x,
            y: pt.y,
            z: 500000,
        },
        count: 1000,
        range: 500,
        height: 0,
        color: vjmap.randomColor(),
        color2: vjmap.randomColor(),
        speed: 1,
        size: 3,
        opacity: 1.0,
    });
}

// Add radar
let pt = mapExtent.randomPoint();
let radar = threeContext.radar(pt, {
    size: 80000,
    texture1: (env.assetsPath + 'images/扫描雷达.png'), // Scan radar texture
    texture2: (env.assetsPath + 'images/雷达刻度.png'), // Radar scale texture
    color1: "#ffff00",
    color2: "#00ff00"
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