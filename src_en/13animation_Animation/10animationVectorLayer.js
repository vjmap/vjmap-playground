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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/10animationVectorLayer
        // --Vector tile animation layer-- Animate a layer in vector tiles
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: 'sys_zp', // map ID
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
    style: svc.vectorStyle(), // Vector tile style
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


let styles = map.getStyle().layers;
let lineLayerId = styles.filter(s => s.type === "line" && s['source-layer'] === 'lines')[0].id
let antPathImages = vjmap.createAntPathAnimateImages({
    canvasWidth: 128,
    canvasHeight: 4,
    fillColor1: "#f0f",
    fillColor2: "#0ff"
});
let animLineLayer;
const startLineAnimation = () => {
    if (animLineLayer) {
        // Already exists, start animation
        animLineLayer.startAnimation();
    } else {
        // Create new animation
        animLineLayer = vjmap.animateVectorLayer(map, lineLayerId, {
            animateImages: antPathImages
        }, 0)
    }
}
startLineAnimation();

const stopLineAnimation = () => {
    if (!animLineLayer) return
    animLineLayer.stopAnimation();
}

const removeLineAnimation = () => {
    if (!animLineLayer) return
    animLineLayer.remove();
    animLineLayer = null
}

let fillLayerId = styles.filter(s => s.type === "fill" && s['source-layer'] === 'polygons')[0].id

let antPathFillImages = vjmap.createAntPathAnimateImages({
    canvasWidth: 4,
    canvasHeight: 4,
    fillColor1: "#f00",
    fillColor2: "#0f0"
});
let animFillLayer;
const startFillAnimation = () => {
    if (animFillLayer) {
        // Already exists, start animation
        animFillLayer.startAnimation();
    } else {
        // Create new animation
        animFillLayer = vjmap.animateVectorLayer(map, fillLayerId, {
            animateImages: antPathFillImages
        }, 1)
    }
}
startFillAnimation();

const stopFillAnimation = () => {
    if (!animFillLayer) return
    animFillLayer.stopAnimation();
}

const removeFillAnimation = () => {
    if (!animFillLayer) return
    animFillLayer.remove();
    animFillLayer = null
}
// UI
const App = () => {
    return (
        <div className="input-card">
            <h4>Animation control</h4>
            <div className="input-item">
                <button className="btn" onClick={ () => startLineAnimation()}>Start line flow animation</button>
                <button className="btn" onClick={ () => stopLineAnimation() }>Stop line animation</button>
                <button className="btn" onClick={ () => removeLineAnimation() }>Remove line animation</button>
            </div>

            <div className="input-item">
                <button className="btn" onClick={ () => startFillAnimation()}>Start fill arrow animation</button>
                <button className="btn" onClick={ () => stopFillAnimation() }>Stop fill arrow animation</button>
                <button className="btn" onClick={ () => removeFillAnimation() }>Remove fill animation</button>
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