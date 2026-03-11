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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/contextmenu/01contextmenuMap
        // --Map context menu--
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
// Create geo projection from map bounds
let prj = new vjmap.GeoProjection(res.bounds);

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterStyle(), // style, raster style here
    center: prj.toLngLat(prj.getMapExtent().center()), // set map center
    zoom: 2, // set map zoom level
    renderWorldCopies: false
});


// Attach service and projection
map.attach(svc, prj);
let mapBounds = map.getGeoBounds(); // get map geo bounds

let isAllowShowMenu = true;// control whether menu is shown
// checked icon; can also specify src path
const checkIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAANpJREFUOE9jZKAQMFKon2FgDKjZHVHf4rqiEeR6kl1QuzOyn+E/4/lmj2WLSDagekdkASMjg1aL+/I0WNgR7YLaHRG2/xgZYlrdV6QjBzzRBtTsijzzl4nVvd1l0VucBtTsjlz5/z/jt1a3ZYnIimp2RZ7//+9fQ6vHyo3o0Q53Qc32CAcGpv88DIxMxQyMDB9aXJcHghTX7IxcyMjAeLTZfdksbGkGqxdqdkUuZ2BgkPjPyDCFgeG/W6srqr+JCoPqXZG9jAwM9iyszy0aHA/8wZViiQ7EYWwAAPShQBF/1IlVAAAAAElFTkSuQmCC";
map.setMenu(event => {
    if (!isAllowShowMenu) return;

    return new vjmap.ContextMenu({
        event: event.originalEvent,
        theme: "dark", //light
        width: "250px",
        items: [
            {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">Context menu demo</span>`},
            {type: 'multi', items: [
                    {label: 'Full extent', onClick: () => { map.fitMapBounds(); }},
                    {label: 'Reset bearing', onClick: () => { map.setBearing(0); }},
                    {label: 'Reset pitch', onClick: () => { map.setPitch(0); }},
                ]},
            {label: 'Get coordinates at this location', onClick: () => {
                    let point = map.fromLngLat(event.lngLat);
                    message.info({content: `Current coordinates: x: ${point.x}, y: ${point.y}`, key: "info", duration: 3});
                }},
            {type: 'seperator'},
            {type: 'submenu', label: 'Map zoom', items: [
                    {label: 'Zoom in', onClick: () => { map.setZoom(map.getZoom() + 1)}},
                    {label: 'Zoom out', onClick: () => { map.setZoom(map.getZoom() - 1)}, enabled: map.getZoom() - 1 > 0},
                    {label: 'Zoom to min', onClick: () => { map.setZoom(0)}},
                    {label: 'Fly to here', onClick: () => {
                            map.flyTo({
                                center: event.lngLat,
                                pitch: 60,
                                zoom: 5
                            })
                        }}
                ]},
            {type: 'hovermenu', label: 'Map settings', items: [
                    {
                        label: 'Double-click to zoom',
                        icon: map.doubleClickZoom.isEnabled() ? checkIcon : "",
                        onClick: () => {
                            if (map.doubleClickZoom.isEnabled()) {
                                map.doubleClickZoom.disable()
                            } else {
                                map.doubleClickZoom.enable()
                            }
                        }
                    },
                    {
                        label: 'Allow rotation',
                        icon: map.dragRotate.isEnabled() ? checkIcon : "",
                        onClick: () => {
                            if (map.dragRotate.isEnabled()) {
                                map.dragRotate.disable();
                            } else {
                                map.dragRotate.enable();
                            }
                        }
                    },
                    {
                        label: 'Allow pitch',
                        icon: map.getMaxPitch() != 0 ? checkIcon : "",
                        onClick: () => {
                            if (map.getMaxPitch() == 0) {
                                map.setMaxPitch(85)
                            } else {
                                map.setMaxPitch(0)
                            }
                        }
                    }
                ]}
        ]
    });
})

// UI
const App = () => {
    return (
        <div>
            <div className="info w160">
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => isAllowShowMenu = true}>Enable context menu</button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => isAllowShowMenu = false}>Disable context menu</button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => map.setMenu()}>Destroy menu</button>
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