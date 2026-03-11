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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationPolylineFlow
        // --Line flow animation--
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
    pitch: 60, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();
map.setRasterOpacity(svc.rasterLayerId(), 0.3);

const mapBounds = map.getGeoBounds(0.6);
let geoLineDatas = [];
let geoFlowLineDatas = [];

let speed = mapBounds.width() / 10; // Speed: complete distance in 10s

for(let i = 0; i < 50; i++) {
    const path = mapBounds.randomPoints(2, 4);
    // Path line
    geoLineDatas.push({
        points: map.toLngLat(path),
        properties: {
            name: "line" + (i + 1),
            color: vjmap.randomColor(),
            length: vjmap.Math2D.lineDist(path), // Total line length
        }
    })
    // Animation line
    geoFlowLineDatas.push({
        points: [],
        properties: {
            name: "flow_line" + (i + 1),
            coordinates: path, // Store points to draw
            color: vjmap.randomColor()
        }
    })
}

let polylines = new vjmap.Polyline({
    data: geoLineDatas,
    lineColor: ['get', 'color'],
    lineWidth: 2
});
polylines.addTo(map);

let flowPolylines = new vjmap.Polyline({
    data: geoFlowLineDatas,
    lineColor: ['get', 'color'],
    lineWidth: 2
});
flowPolylines.addTo(map);


let startTime = new Date();
let timeEqualMockCount = geoFlowLineDatas.length / 2; // First half: equal time; second half: equal speed
vjmap.createAnimation({
    from: 0,
    to: 1,
    repeat: Infinity,
    duration: 5000,
    ease:vjmap.linear, // Linear
    onUpdate: latest => {
        let flowData = flowPolylines.getData();
        // First half: equal time
        for(let i = 0; i < timeEqualMockCount; i++) {
            // Get original points
            let coordinates = flowData.features[i].properties.coordinates;
            const path = vjmap.interpolatePointsByRatio(coordinates, latest);
            flowData.features[i].geometry.coordinates = map.toLngLat(path);
        }
        // Second half: equal speed
        let time = (new Date() - startTime) / 1000.0; // Total elapsed time (seconds)
        for(let i = timeEqualMockCount; i < flowData.features.length; i++) {
            let coordinates = flowData.features[i].properties.coordinates;
            // Distance = speed * time
            let dist = time * speed;
            dist = dist % flowData.features[i].properties.length; // Current length modulo, restart when exceeded
            let ratio = dist / flowData.features[i].properties.length;
            const path = vjmap.interpolatePointsByRatio(coordinates, ratio);
            flowData.features[i].geometry.coordinates = map.toLngLat(path);
        }
        flowPolylines.setData(flowData);
    }
})


// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{width: "90px", right: "10px"}}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => polylines.hide()}>Hide path line
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => polylines.show()}>Show path line
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