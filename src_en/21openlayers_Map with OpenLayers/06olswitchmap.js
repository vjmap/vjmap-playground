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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/06olswitchmap
        // --Switch maps--

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

// Create OpenLayers map
let map;

const mapids = ["sys_zp", "sys_hello", "sys_world", "sys_cad2000"]
let curIdx = 1;
let curMapId = mapids[0]
const switchMap = async () => {
    curMapId = mapids[curIdx++ % mapids.length]
    await switchToMapId(curMapId);
}

const switchToMapId = async (mapId)=> {
    let res = await svc.openMap({
        mapid: mapId, // map ID
        mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
        style: vjmap.openMapDarkStyle() // use dark style when div has dark background
    })
    if (res.error) {
        // If open failed
        message.error(res.error)
        return;
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

// Recreate OpenLayers map
    map = new ol.Map({
        target: createNewMapDivId(), // DIV container ID
        view: new ol.View({
            center: mapBounds.center().toArray(),  // map center
            projection: cadProjection, // CAD projection
            resolutions:resolutions, // resolutions
            zoom: 2 // initial zoom
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
}
switchMap();

const createNewMapDivId = ()=> {
    // Clear previous
    let parentDiv = document.getElementById("map");
    parentDiv.innerHTML = "";
    let newMapDiv = document.createElement("div");
    newMapDiv.id = vjmap.RandomID(6);
    newMapDiv.style.position = 'absolute';
    newMapDiv.style.width = "100%";
    newMapDiv.style.height = "100%";
    parentDiv.appendChild(newMapDiv);
    return newMapDiv.id;
}
// UI
const App = () => {
    return (
        <div className="input-card">
            <h4>Switch map</h4>
            <div className="input-item">
                <button className="btn" onClick={ () => switchMap() }>Click to switch map</button>
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