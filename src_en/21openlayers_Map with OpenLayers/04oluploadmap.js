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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/04oluploadmap
        // --Upload and open CAD DWG with OpenLayers--

// OpenLayers: https://openlayers.org/ | https://github.com/openlayers/openlayers
if (typeof ol !== "object") {
    // If no OpenLayers environment
    await vjmap.addScript([{
        src: "../../js/ol7.1.0/ol.js"
    },{
        src: "../../js/ol7.1.0/ol.css"
    }]);
}


// Create OpenLayers map
let map = new ol.Map({
    target: 'map', // DIV container ID
    view: new ol.View({
        center: [0, 0],  // map center
        zoom: 2 // initial zoom
    })
});

// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)

// Upload DWG file
const uploadDwgFile = async file => {
    message.info("Uploading, please wait...", 2);
    let res = await svc.uploadMap(file); // upload map
    let mapid = prompt("Enter map name ID", res.mapid);
    res.mapid = mapid;
    res.mapopenway = vjmap.MapOpenWay.GeomRender; // geometry render; use vjmap.MapOpenWay.Memory for memory render
    res.isVector = false; // use raster tiles
    res.style = vjmap.openMapDarkStyle(); // dark style; use openMapLightStyle for light
    message.info("Opening map, please wait. First load may take seconds to minutes depending on size.", 5);
    let data = await svc.openMap(res); // Open map
    if (data.error) {
        message.error(data.error)
        return;
    }
    openMap(data);
}

let layer;
const openMap = res => {
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

    if (layer) map.removeLayer(layer); // remove previous layer, or recreate ol.Map

    let view = new ol.View({
        center: mapBounds.center().toArray(),  // map center
        projection: cadProjection, // CAD projection
        resolutions:resolutions, // resolutions
        zoom: 2// initial zoom
    });
    map.setView(view);

    // Add tile layer
    layer = new ol.layer.Tile({
        // Tile source
        source: new ol.source.TileImage({
            url: svc.rasterTileUrl() // CAD raster tile URL
        })
    });
    // Add layer to map
    map.addLayer(layer);
}
map.on('click', (e) => console.log(message.info(`Coordinates clicked: ${JSON.stringify(e.coordinate)}`)));

const { Upload } = antd;
const  { useState } = React;
// UI
const App = () => {
    const props = {
        onChange: ({file}) => {
            uploadDwgFile(file);
        },
            beforeUpload: (file) => {
            // return false for manual upload
            return false;
        }
    };
    return (
        <div>
            <div className="info" style={{width: "90px", right: "10px"}}>
                <div className="input-item">
                    <Upload {...props}>
                        <button >Click to upload and open DWG file</button>
                    </Upload>
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