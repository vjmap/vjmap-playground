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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/map/eventMapClick
        // --Map click and mouse events--
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
                <h4>Try operating on the map with your mouse</h4>
                <p><span id="text">Unbound</span></p>
            </div>
            <div className="input-card">
                <h4>Map click events</h4>
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
function showInfoClick(e){
    let pt = map.fromLngLat(e.lngLat); // Convert to map geometric coordinates
    let text = 'You single-clicked the map at [ '+pt.x+','+pt.y+' ]!'
    document.querySelector("#text").innerText = text;
}
function showInfoDbClick(e){
    let pt = map.fromLngLat(e.lngLat); // Convert to map geometric coordinates
    let text = 'You double-clicked the map at [ '+pt.x+','+pt.y+' ]!'
    document.querySelector("#text").innerText = text;
}
function showInfoMove(){
    let text = 'You moved your mouse!'
    document.querySelector("#text").innerText = text;
}
// Bind events
function clickOn(e){
    let el = e.target;
    removeClass("btn");
    el.classList.add("btn-active");
    message.info("Events bound!");
    document.querySelector("#text").innerText = "Bound";
    map.on('click', showInfoClick);
    map.on('dblclick', showInfoDbClick);
    map.on('mousemove', showInfoMove);
}
// Unbind events
function clickOff(){
    removeClass("btn");
    message.info("Events unbound!");
    document.querySelector("#text").innerText = "Unbound";
    map.off('click', showInfoClick);
    map.off('dblclick', showInfoDbClick);
    map.off('mousemove', showInfoMove);
}

function removeClass(el){
    let els = document.getElementsByClassName(el);
    for (let i = 0; i < els.length; i++) {
        els[i].classList.remove("btn-active");
    }
}

// Bind events to buttons
document.getElementById("clickOn").onclick = clickOn;
document.getElementById("clickOff").onclick = clickOff;

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