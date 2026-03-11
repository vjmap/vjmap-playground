const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/map/eventMapMoving
        // --Map move events--
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
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
map.fitMapBounds();


// UI
const App = () => {
    return (
        <div>
            <div className="info w240">
                <h4 id="text">Map move events</h4>
                <p>Current center: <span id="el"></span></p>
                <p>Map move event: <span id="map-center">Unbound</span></p>
            </div>
            <div className="input-card w280">
                <h4>Map move events</h4>
                <div>
                    <div className="input-item">
                        <button id="moveOn" className="btn">Bind event</button>
                        <button id="moveOff" className="btn">Unbind event</button>
                    </div>
                </div>
            </div>
            <div id="tip"></div>
        </div>
    );
}
ReactDOM.render(<App />, document.getElementById('ui'));

// Events
let mapStatus = document.querySelector("#map-center");
let mapLnglat  = document.querySelector("#el");
map.on("load",function(){
    logMapinfo();
});
let logMapinfo = function (){
    let center = map.getCenter(); // Get current map center
    center = map.fromLngLat(center); // Convert to map coordinates
    mapLnglat.innerText = center.toString(2);
};
function mapMovestart(){
    mapStatus.innerText = 'Map move started';
}
function mapMove(){
    logMapinfo();
    mapStatus.innerText = 'Map moving';
}
function mapMoveend(){
    mapStatus.innerText = 'Map move ended';
}
// Bind events
function moveOn(e){
    let el = e.target;
    el.classList.add("btn-active");
    message.info("Events bound!");
    map.on('movestart', mapMovestart);
    map.on('move', mapMove);
    map.on('moveend', mapMoveend);

}
// Unbind events
function moveOff(){
    removeClass("btn");
    message.info("Unbound successfully!");
    map.off('movestart', mapMovestart);
    map.off('move', mapMove);
    map.off('moveend', mapMoveend);
    mapStatus.innerText = "Unbound";
}

function removeClass(el){
    let els = document.getElementsByClassName(el);
    for (let i = 0; i < els.length; i++) {
        els[i].classList.remove("btn-active");
    }
}
// Bind events to buttons
document.getElementById("moveOn").onclick = moveOn;
document.getElementById("moveOff").onclick = moveOff;
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