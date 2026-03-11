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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/control/controlAddRemove
        // --Add and remove map controls--
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
            renderWorldCopies: false, // do not show multi-world copies
            locale: {
                'FullscreenControl.Enter': 'Enter fullscreen',
                'FullscreenControl.Exit': 'Exit fullscreen',
                'NavigationControl.ZoomIn': 'Zoom in',
                'NavigationControl.ZoomOut': 'Zoom out',
                'NavigationControl.ResetBearing': 'Reset bearing',
                'ScaleControl.Meters': 'm', // change if map unit is not meters, e.g. mm; empty if no unit
                'ScaleControl.Kilometers': 'km'// change if map unit is not meters, e.g. mm for m; 'k' if no unit
            }
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        
        let scaleControl = null;
        const showHideScaleControl = () => {
            if (!scaleControl) {
                scaleControl = new vjmap.ScaleControl();
                map.addControl(scaleControl, "bottom-left");
            } else {
                map.removeControl(scaleControl);
                scaleControl = null;
            }
        }
        
        let navigationControl = null;
        const showHideNavigationControl = () => {
            if (!navigationControl) {
                navigationControl = new vjmap.NavigationControl();
                map.addControl(navigationControl, "top-right");
            } else {
                map.removeControl(navigationControl);
                navigationControl = null;
            }
        }
        let fullScreenControl = null;
        const showHideFullScreenControl = () => {
            if (!fullScreenControl) {
                fullScreenControl = new vjmap.FullscreenControl();
                map.addControl(fullScreenControl, "bottom-right");
                // Set background for fullscreen; canvas is transparent by default
                map.getContainer().style.background="#022B4F"
            } else {
                map.removeControl(fullScreenControl);
                fullScreenControl = null;
            }
        }
        
        let mousePositionControl = null;
        const showHideMousePositionControl = () => {
            if (!mousePositionControl) {
                mousePositionControl = new vjmap.MousePositionControl();
                map.addControl(mousePositionControl, "top-left");
            } else {
                map.removeControl(mousePositionControl);
                mousePositionControl = null;
            }
        }
        
        // UI
        const App = () => {
            return (
                <div className="info" style={{minWidth: "120px"}}>
                    <div className="input-item">
                        <label className="chbox">
                            <input type="checkbox" onClick={showHideScaleControl}/>Scale bar
                        </label>
                    </div>
                    <div className="input-item">
                        <label className="chbox">
                            <input type="checkbox" onClick={showHideNavigationControl}/>Navigation
                        </label>
                    </div>
                    <div className="input-item">
                        <label className="chbox">
                            <input type="checkbox" onClick={showHideFullScreenControl}/>Fullscreen
                        </label>
                    </div>
                    <div className="input-item">
                        <label className="chbox">
                            <input type="checkbox" onClick={showHideMousePositionControl}/>Mouse position
                        </label>
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