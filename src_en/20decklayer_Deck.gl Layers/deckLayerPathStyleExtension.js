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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerPathStyleExtension
        // --Deck line animation layer--
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
    zoom: 3, // set map zoom level
    pitch: 0, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();

// Limit map bounds to full extent to prevent multi-world display
map.setMaxBounds(map.toLngLat(prj.getMapExtent()));

const mapBounds = map.getGeoBounds(0.6);

// Add deck library
if (typeof deck !== "object") {
    // If no deck environment
    await vjmap.addScript([{
        src: "../../js/deck.gl.min.js"
    }]);

}

let data = []
for(let i = 0; i < 10; i++) {
    data.push({
        id: i+ 1,
        path: map.toLngLat(mapBounds.randomPoints(2, 4)),
        width: vjmap.randInt(5, 10),
        color: [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)]
    })
}
class MyPathLayer extends deck.PathLayer {
    getShaders() {
        const shaders = super.getShaders();
        shaders.inject['vs:#decl'] += `\
                        uniform float dashStart;`;
        shaders.inject['vs:#main-end'] += `\
                        vDashOffset += dashStart;`;
        return shaders;
    }

    draw(opts) {
        opts.uniforms.dashStart = this.props.dashStart || 0;
        super.draw(opts);
    }
}


let dashStart = (Date.now() / 100) % 1000;
const deckLayer = new vjmap.DeckLayer({
    id: 'deck2',
    type: MyPathLayer,
    data,
    getPath: d => d.path,
    getWidth: d => d.width,
    getColor: d => d.color,
    getDashArray: [4, 4],
    dashStart,
    widthUnits: 'pixels',
    pickable: true,
    autoHighlight: true,
    onClick: ({object}) => {
        message.info(`You clicked object ${object.id} in Deck layer`)
    },
    extensions: [new deck.PathStyleExtension({highPrecisionDash: true})]
});
map.addLayer(deckLayer);

function redraw() {
    dashStart = (Date.now() / 100) % 1000;
    deckLayer.setProps({dashStart: dashStart});
}

let isAnimating = false;
function animate() {
    redraw();
    if (isAnimating) {
        requestAnimationFrame(animate);
    }
}

const setAnimation = b => {
    isAnimating = b;
    animate();
}
setAnimation(true);
// UI
const App = () => {
    return (
        <div className="input-card">
            <h4>Animation control</h4>
            <div className="input-item">
                <button className="btn" onClick={ () => setAnimation(true) }>Start animation</button>
                <button className="btn" onClick={ () => setAnimation(false) }>Stop animation</button>
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