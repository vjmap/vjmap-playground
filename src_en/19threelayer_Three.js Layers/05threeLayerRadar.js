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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/05threeLayerRadar
        // --Radar scan animation--
// !!! `vjthree` is deprecated; use latest [vjmap 3D] https://vjmap.com/map3d/
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
    center: prj.toLngLat(mapExtent.center()),
    zoom: 3,
    pitch: 30,
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
    // If no env
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


let Radars = []
const addRadars= () => {
    if (Radars.length > 0) return;
    for (let i = 0; i < 50; i++) {
        let pt = mapExtent.randomPoint();
        let radar = threeContext.radar(pt, {
            texture1: (env.assetsPath + 'images/扫描雷达.png'), // Scan radar texture (keep path if file uses Chinese name)
            texture2: (env.assetsPath + 'images/雷达刻度.png'), // Radar scale texture (keep path if file uses Chinese name)
            color1: vjmap.randomColor(),
            color2: vjmap.randomColor()
        });
        Radars.push(radar)
    }
}
addRadars();



const removeRadars = () => {
    if (Radars.length == 0) return;
    for(let c of Radars) {
        c.stop();
        threeContext.remove(c)
    }
    Radars = []
}


// UI
const App = () => {
    return (
        <div>
            <div className="input-card">
                <h4>Settings</h4>
                <div>
                    <div className="input-item">
                        <button className="btn" onClick={() => removeRadars()}>Remove</button>
                        <button className="btn" onClick={() => addRadars()}>Add</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
ReactDOM.render(<App />, document.getElementById('ui'))

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