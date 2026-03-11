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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/03animationImage
        // --Particle line effect (image-based)--
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
for(let i = 1;  i <= 5; i++) {
    let mapBounds = map.getGeoBounds(i / 20.0);
    let points = mapBounds.toPointArray();
    points.push(points[0]); // Close
    geoDatas.push({
        points: map.toLngLat(points),
        id: i,
        properties: {
            lineWidth: 4 + i * 2,
            name: `${i} ring`
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
let img = await loadUrlImage(env.assetsPath + "images/green.png");
// Load image to create animation image set

let createImagesOptions = {
    canvasWidth: img.width,
    canvasHeight: img.height * 3,
    frameCount: 4,
    directionReverse: true,
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
let animateLine = vjmap.createAnimateLineLayer(map, geoDatas, {
    animateImages,
    lineWidth: ['get', 'lineWidth'],
    lineOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
    isHoverPointer: true,
    isHoverFeatureState: true,
    speed: 1,
});
animateLine.polyline.clickLayer(e => message.info(`Clicked ${e.features[0].id}, name: ${e.features[0].properties.name}`))
animateLine.polyline.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });

let speed = 1.0;
let dirReverse = false;
let oldData = vjmap.cloneDeep(geoDatas);
let bSetData = false;
const changeAnimateLine = (action) => {
    if (!animateLine) return;
    if (action === "stopAnimation") {
        // Stop animation
        animateLine.stopAnimation();
    } else if (action === "startAnimation") {
        // Start animation
        animateLine.startAnimation();
    } else if (action === "setSpeedFaster") {
        // Speed up
        speed *= 2;
        animateLine.setSpeed(speed);
    } else if (action === "setSpeedSlower") {
        // Speed down
        speed /= 2;
        animateLine.setSpeed(speed);
    } else if (action === "directionReverse") {
        // Reverse direction
        dirReverse = !dirReverse;
        createImagesOptions = {
            ...createImagesOptions,
            directionReverse: dirReverse
        }
        animateLine.updateImages(vjmap.createAnimateImages(createImagesOptions));
    } else if (action === "setColor") {
        // Set color
        createImagesOptions = {
            ...createImagesOptions,
            fillColor: vjmap.randInt(0, 5) === 0 ? "" : vjmap.randomColor(), // empty = transparent
        }
        animateLine.updateImages(vjmap.createAnimateImages(createImagesOptions));
    } else if (action === "setData") {
        let data = vjmap.cloneDeep(oldData);
        bSetData = !bSetData;
        for(let i = 0; i < data.length; i++) {
            // Use first four coords
            data[i].points = bSetData ? data[i].points.slice(0, 4) : data[i].points.slice(1, 5)
        }
        // Update coords
        animateLine.updateData(data)
    } else if (action === "remove") {
        // Remove
        animateLine.remove()
        animateLine = null;
    }
}
// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{width: "90px", right: "10px"}}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateLine("stopAnimation")}>Stop animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateLine("startAnimation")}>Start animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateLine("setSpeedFaster")}>Speed up
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateLine("setSpeedSlower")}>Speed down
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateLine("directionReverse")}>Reverse direction
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateLine("setColor")}>Change color
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateLine("setData")}>Update coords
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateLine("remove")}>Remove
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