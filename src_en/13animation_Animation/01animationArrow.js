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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/01animationArrow
        // --Arrow animation layer--
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
            lineWidth: 8 + i * 2,
            name: `${i} ring`
        }
    });
}

let arrowAnimateLine = vjmap.createArrowAnimateLineLayer(map, geoDatas, {
    arrowFillColor: "#22B14C",
    arrowStrokeColor: "#fff",
    arrowStrokeWidth: 6,
    canvasWidth: 128,
    canvasHeight: 32,
    arrowWidth: 16,
    frameCount: 4,
    lineWidth: ['get', 'lineWidth'],
    lineOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
    isHoverPointer: true,
    isHoverFeatureState: true
});
arrowAnimateLine.polyline.clickLayer(e => message.info(`Clicked ${e.features[0].id}, name: ${e.features[0].properties.name}`))
arrowAnimateLine.polyline.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });

let speed = 1.0;
let dirReverse = false;
let oldData = vjmap.cloneDeep(geoDatas);
let bSetData = false;
const changeArrowAnimateLine = (action) => {
    if (!arrowAnimateLine) return;
    if (action === "stopAnimation") {
        // Stop animation
        arrowAnimateLine.stopAnimation();
    } else if (action === "startAnimation") {
        // Start animation
        arrowAnimateLine.startAnimation();
    } else if (action === "setSpeedFaster") {
        // Speed up
        speed *= 2;
        arrowAnimateLine.setSpeed(speed);
    } else if (action === "setSpeedSlower") {
        // Speed down
        speed /= 2;
        arrowAnimateLine.setSpeed(speed);
    } else if (action === "directionReverse") {
        // Reverse direction
        dirReverse = !dirReverse;
        arrowAnimateLine.updateImages(arrowAnimateLine.createAnimateImages({
            directionReverse: dirReverse
        }));
    } else if (action === "setColor") {
        // Set color
        arrowAnimateLine.updateImages(arrowAnimateLine.createAnimateImages({
            arrowFillColor: vjmap.randomColor(),
            arrowStrokeColor: vjmap.randomColor(),
        }));
    } else if (action === "setData") {
        let data = vjmap.cloneDeep(oldData);
        bSetData = !bSetData;
        for(let i = 0; i < data.length; i++) {
            // Use first four coords
            data[i].points = bSetData ? data[i].points.slice(0, 4) : data[i].points.slice(1, 5)
        }
        // Update coords
        arrowAnimateLine.updateData(data)
    } else if (action === "remove") {
        // Remove
        arrowAnimateLine.remove()
        arrowAnimateLine = null;
    }
}
// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{width: "90px", right: "10px"}}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeArrowAnimateLine("stopAnimation")}>Stop animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeArrowAnimateLine("startAnimation")}>Start animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeArrowAnimateLine("setSpeedFaster")}>Speed up
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeArrowAnimateLine("setSpeedSlower")}>Speed down
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeArrowAnimateLine("directionReverse")}>Reverse direction
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeArrowAnimateLine("setColor")}>Change color
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeArrowAnimateLine("setData")}>Update coords
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeArrowAnimateLine("remove")}>Remove
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