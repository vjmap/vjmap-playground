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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/07olswitchtheme
        // --Switch dark/light theme--

// OpenLayers: https://openlayers.org/ | https://github.com/openlayers/openlayers
if (typeof ol !== "object") {
    // If no OpenLayers environment
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let mapId = "sys_zp";
let style = {
    backcolor: 0 // use dark style when div has dark background
}
let res = await svc.openMap({
    mapid: mapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: style // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
// Get map bounds
let mapBounds = vjmap.GeoBounds.fromString(res.bounds);

// Custom projection
let cadProjection = new ol.proj.Projection({
    // extent for zoom levels
    extent: mapBounds.toArray(),
    units: 'm'
});
// Set resolution per level
let resolutions= [];
for(let i = 0; i < 25; i++) {
    resolutions.push(mapBounds.width() / (512 * Math.pow(2, i - 1)))
}
// Add custom CAD projection
ol.proj.addProjection(cadProjection);

// Create OpenLayers map
let map = new ol.Map({
    target: 'map', // DIV container ID
    view: new ol.View({
        center: mapBounds.center().toArray(),  // map center
        projection: cadProjection, // CAD projection
        resolutions:resolutions, // resolutions
        zoom: 2// initial zoom
    })
});

// Add tile layer
let layer = new ol.layer.Tile({
    // Tile source
    source: new ol.source.TileImage({
        url: svc.rasterTileUrl() // CAD raster tile URL
    })
});
// Add layer to map
map.addLayer(layer);

map.on('click', (e) => message.info({content: `Coordinates clicked: ${JSON.stringify(e.coordinate)}`, key: "info", duration: 3}));


let curIsDarkTheme = true;
const switchToDarkTheme = async () => {
    if (curIsDarkTheme) return;
    curIsDarkTheme = true;
    document.body.style.background = "#022B4F"; // dark background
    await updateStyle(curIsDarkTheme)
}

const switchToLightTheme = async () => {
    if (!curIsDarkTheme) return;
    curIsDarkTheme = false;
    document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
    await updateStyle(curIsDarkTheme)
}

const updateStyle = async (isDarkTheme) => {
    style.backcolor = isDarkTheme ? 0 : 0xFFFFFF;// dark=black, light=white
    let res = await svc.cmdUpdateStyle(style);
    let source = layer.getSource();
    // Update tile URL
    source.setUrl(svc.rasterTileUrl());
    // Refresh
    source.refresh();
}

// UI
const App = () => {
    return (
        <div>
            <div className="info w160">
                <h4>Theme:</h4>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToDarkTheme}>Switch to dark theme</button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToLightTheme}>Switch to light theme</button>
                </div>

            </div>
        </div>
    );
}
ReactDOM.render(<App />, document.getElementById('ui'));

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