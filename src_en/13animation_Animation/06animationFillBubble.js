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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/06animationFillBubble
        // --Fill bubble animation (Canvas drawn)--
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
let mapBounds2 = map.getGeoBounds(0.2);
const points = mapBounds2.toPointArray();
const w = mapBounds2.width() / 2;
// Four vertices -> four small rects (holes)
for(let i = 0; i < points.length; i++) {
    const path = [];
    path.push(...vjmap.GeoBounds.fromCenterWH(points[i], w).toPointArray());
    geoDatas.push({
        points: map.toLngLat(path),
        id: i,
        properties: {
            lineWidth: 4 + i * 2,
            name: `${i + 1}`
        }
    });
}


// Create animation image set via canvas drawing
let createImagesOptions = {
    canvasWidth: 64,
    canvasHeight: 64,
    frameCount: 4,
    directionReverse: true,
    fillColor: "", // transparent background
    bubbleCountMin: 1, // min bubble count
    bubbleCountMax: 4, // max bubble count
    bubbleRadiusMin: 8, // min bubble radius
    bubbleRadiusMax: 16, // max bubble radius
    yAxis: true, // animate along Y
    draw: (context, width, height, opts) => {
        // Draw callback for first frame (context, width, height, opts)
        // Fill background
        if (opts.fillColor) {
            context.fillStyle = opts.fillColor;
            context.fillRect(0, 0, width, height );
        }
        // Draw bubbles below
        let bubbleCount = vjmap.randInt(opts.bubbleCountMin, opts.bubbleCountMax);
        for(let b = 0; b < bubbleCount; b++) {
            let r = vjmap.randInt(opts.bubbleRadiusMin, opts.bubbleRadiusMax);
            let x  = vjmap.randInt(r, width - r);
            let y = vjmap.randInt(r, height - r);
            let gradient = context.createRadialGradient(x, y, 0, x, y, r);
            gradient.addColorStop(0, vjmap.randomColor() + "aa"); // alpha
            gradient.addColorStop(1, vjmap.randomColor() + "aa");
            context.beginPath();
            context.fillStyle = gradient;
            context.arc(x, y, r, 0, 2 * Math.PI)
            context.fill()
        }

    }
};
let animateImages = vjmap.createAnimateImages(createImagesOptions);
let animateFill = vjmap.createAnimateFillLayer(map, geoDatas, {
    animateImages,
    fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
    isHoverPointer: true,
    isHoverFeatureState: true,
    speed: 1,
});
animateFill.polygon.clickLayer(e => message.info(`Clicked ${e.features[0].id}, name: ${e.features[0].properties.name}`))
animateFill.polygon.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });

let speed = 1.0;
let dirReverse = false;
let oldData = vjmap.cloneDeep(geoDatas);
let bSetData = false;
const changeAnimateFill = (action) => {
    if (!animateFill) return;
    if (action === "stopAnimation") {
        // Stop animation
        animateFill.stopAnimation();
    } else if (action === "startAnimation") {
        // Start animation
        animateFill.startAnimation();
    } else if (action === "setSpeedFaster") {
        // Speed up
        speed *= 2;
        animateFill.setSpeed(speed);
    } else if (action === "setSpeedSlower") {
        // Speed down
        speed /= 2;
        animateFill.setSpeed(speed);
    } else if (action === "directionReverse") {
        // Reverse direction
        dirReverse = !dirReverse;
        createImagesOptions = {
            ...createImagesOptions,
            directionReverse: dirReverse
        }
        animateFill.updateImages(vjmap.createAnimateImages(createImagesOptions));
    } else if (action === "setColor") {
        // Set color
        createImagesOptions = {
            ...createImagesOptions,
            fillColor:  vjmap.randInt(0, 5) === 0 ? "" : vjmap.randomColor(), // empty = transparent
            bubbleCountMin: vjmap.randInt(1, 4), // min bubble count
            bubbleCountMax: vjmap.randInt(4, 8), // max bubble count
            bubbleRadiusMin: vjmap.randInt(4, 8), // min bubble radius
            bubbleRadiusMax: vjmap.randInt(8, 16), // max bubble radius
        }
        animateFill.updateImages(vjmap.createAnimateImages(createImagesOptions));
    } else if (action === "setData") {
        let data = vjmap.cloneDeep(oldData);
        bSetData = !bSetData;
        for(let i = 0; i < data.length; i++) {
            // Use first four coords
            data[i].points = bSetData ? data[i].points.slice(0, 3) : data[i].points.slice(0, 4)
        }
        // Remove one at random
        data.splice(vjmap.randInt(0, data.length - 1), 1)

        // Update coords
        animateFill.updateData(data)
    } else if (action === "remove") {
        // Remove
        animateFill.remove()
        animateFill = null;
    }
}

// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{width: "90px", right: "10px"}}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateFill("stopAnimation")}>Stop animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateFill("startAnimation")}>Start animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateFill("setSpeedFaster")}>Speed up
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateFill("setSpeedSlower")}>Speed down
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateFill("directionReverse")}>Reverse direction
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateFill("setColor")}>Change color
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateFill("setData")}>Update coords
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateFill("remove")}>Remove
                    </button>
                </div>
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