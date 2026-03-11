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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/marker/01eventMarkerOne
        // --Marker events--
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
            <div className="info">
                Click the overlay to try
                <h4><span id="text">Not bound</span></h4>
            </div>
            <div className="input-card">
                <h4>Overlay click event</h4>
                <div>
                    <div className="input-item">
                        <button id="clickOn" className="btn">Bind event</button>
                        <button id="clickOff" className="btn">Unbind event</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
ReactDOM.render(<App />, document.getElementById('ui'));

// Events
let marker = null;
map.on("load", addMarder);

function addMarder() {
    marker && marker.remove();
    marker = new vjmap.Marker({
        draggable: true,    // Allow drag
    }).setLngLat(map.getCenter());
    marker.addTo(map);
}
function showInfoM() {
    let pt = map.fromLngLat(marker.getLngLat());
    let text = 'Clicked overlay at [ ' + pt.toString(2) + ' ]!'
    showLog(text);
}

function showInfoOver() {
    showLog("Mouse entered overlay!");
}
function showInfoOut() {
    showLog("Mouse left overlay!");
}
function dragFun(){
    showLog("Dragged overlay!");
}
function startDragFun(){
    showLog("Started dragging overlay...");
}
function endDragFun(){
    showLog("Finished dragging overlay!");
}
function dblclick() {
    showLog("Double-clicked overlay");
}
function clickOn(e) {
    let el = e.target;
    marker.on('drag', dragFun);
    marker.on('dragstart', startDragFun);
    marker.on('dragend', endDragFun);
    marker.on('click', showInfoM);
    marker.on('mouseover', showInfoOver);
    marker.on('mouseleave', showInfoOut);
    marker.on('dblclick', dblclick);
    showLog("Bound", "Event bound!");
}
function clickOff(e) {
    marker.off('drag', dragFun);
    marker.off('dragstart', startDragFun);
    marker.off('dragend', endDragFun);
    marker.off('click', showInfoM);
    marker.off('mouseover', showInfoOver);
    marker.off('mouseleave', showInfoOut);
    marker.off('dblclick', dblclick);
    showLog("Not bound", "Event unbound!");
}
// Bind button events
document.getElementById("clickOn").onclick = clickOn;
document.getElementById("clickOff").onclick = clickOff;

function showLog(text, alertText) {
    document.querySelector("#text").innerText = text;
    removeClass("btn");
    alertText && message.info(alertText);
}

function removeClass(el){
    let els = document.getElementsByClassName(el);
    for (let i = 0; i < els.length; i++) {
        els[i].classList.remove("btn-active");
    }
}

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