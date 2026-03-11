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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/09animationSymbolCanvas
        // --Point symbol animation [canvas per-frame draw]--
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
let mapBounds = map.getGeoBounds(0.4);
let geoDatas = mapBounds.randomGeoJsonPointCollection(50, 1, 1, (index)=> {
    return {
        id: index,
        name: `Name:${index}`
    }
})


let createImagesOptions = {
    canvasWidth: 40,
    canvasHeight: 40,
    frameCount: 10, // Total 10 frames
    outerCircleFillStyle: vjmap.randomColor(), // Outer circle fill color
    innerCircleStrokeStyle: vjmap.randomColor(), // Inner circle stroke color
    innerCircleFillStyle: vjmap.randomColor(), // Inner circle fill color
    drawFrame: (context, canvasWidth, canvasHeight, frameCount, curFrame, options) => {
        // Per-frame callback, draw different image each frame for animation
        let t = curFrame / frameCount;
        const radius = (canvasWidth / 2) * 0.3;
        const outerRadius = (canvasWidth / 2) * 0.7 * t + radius;

        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.beginPath();
        context.arc(
            canvasWidth / 2,
            canvasHeight / 2,
            outerRadius,
            0,
            Math.PI * 2
        );
        let outerCircleFillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
        if (options.outerCircleFillStyle) {
            let opacity = Math.floor((1 - t) * 256);
            outerCircleFillStyle = options.outerCircleFillStyle + opacity.toString(16).padStart(2, '0')
        }
        context.fillStyle = outerCircleFillStyle;
        context.fill();

        // draw inner circle
        context.beginPath();
        context.arc(
            canvasWidth / 2,
            canvasHeight / 2,
            radius,
            0,
            Math.PI * 2
        );
        context.fillStyle = options.innerCircleFillStyle || 'rgba(255, 100, 100, 1)';
        context.strokeStyle = options.innerCircleStrokeStyle || 'white';
        context.lineWidth = 2
        context.fill();
        context.stroke();
    }
}
let animateImages = vjmap.createAnimateImages(createImagesOptions);
let animateSymbol = vjmap.createAnimateSymbolLayer(map, map.toLngLat(geoDatas), {
    animateImages,
    iconAllowOverlap: true,
    iconAnchor: "center",
    iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
    isHoverPointer: true,
    isHoverFeatureState: true,
    speed: 1,
});
animateSymbol.symbol.clickLayer(e => message.info(`You clicked item ${e.features[0].id}, name: ${e.features[0].properties.name}`))
animateSymbol.symbol.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });

let speed = 1.0;

const changeAnimateSymbol = (action) => {
    if (!animateSymbol) return;
    if (action === "stopAnimation") {
        // Stop animation
        animateSymbol.stopAnimation();
    } else if (action === "startAnimation") {
        // Start animation
        animateSymbol.startAnimation();
    } else if (action === "setSpeedFaster") {
        // Speed up
        speed *= 2;
        animateSymbol.setSpeed(speed);
    } else if (action === "setSpeedSlower") {
        // Slow down
        speed /= 2;
        animateSymbol.setSpeed(speed);
    }  else if (action === "setColor") {
        // Set color
        createImagesOptions = {
            ...createImagesOptions,
            outerCircleFillStyle: vjmap.randomColor(), // Outer circle fill color
            innerCircleStrokeStyle: vjmap.randomColor(), // Inner circle stroke color
            innerCircleFillStyle: vjmap.randomColor(), // Inner circle fill color
        }
        animateSymbol.updateImages(vjmap.createAnimateImages(createImagesOptions));
    } else if (action === "setData") {
        let data = mapBounds.randomGeoJsonPointCollection(vjmap.randInt(20, 100), 1, 1, (index)=> {
            return {
                id: index,
                name: `Name:${index}`
            }
        })
        // Update coordinates
        animateSymbol.updateData(map.toLngLat(data))
    }else if (action === "remove") {
        // Remove
        animateSymbol.remove()
        animateSymbol = null;
    }
}
// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{width: "90px", right: "10px"}}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("stopAnimation")}>Stop animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("startAnimation")}>Start animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("setSpeedFaster")}>Speed up
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("setSpeedSlower")}>Slow down
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("setColor")}>Change color
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("setData")}>Update coordinates
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("remove")}>Remove
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