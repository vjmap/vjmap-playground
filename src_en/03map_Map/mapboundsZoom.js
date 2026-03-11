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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/mapboundsZoom
        // --Fit map to screen bounds--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div is dark
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // New map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Get map draw bounds
        let drawBounds = vjmap.GeoBounds.fromString(res.drawBounds); // or svc.currentMapParam().drawBounds
        map.fitMapBounds(drawBounds);
        
        // Fit to screen
        const fitScreen = () => {
            map.fitMapBounds(drawBounds);
        }
        
        // Fit width to screen
        const fitScreenByWidth = () => {
            let [w, h] = map.getCanvasSize(); // get canvas size
            let boundsWidth = drawBounds.width();
            let boundsHeight = drawBounds.width() * h / w;
            let fitBounds = vjmap.GeoBounds.fromCenterWH(drawBounds.center(), boundsWidth, boundsHeight);
            map.fitMapBounds(fitBounds);
        }
        
        // Fit height to screen
        const fitScreenByHeight = () => {
            let [w, h] = map.getCanvasSize(); // get canvas size
            let boundsHeight = drawBounds.height();
            let boundsWidth = drawBounds.height() * w / h;
            let fitBounds = vjmap.GeoBounds.fromCenterWH(drawBounds.center(), boundsWidth, boundsHeight);
            map.fitMapBounds(fitBounds);
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>Fit to screen:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={fitScreen}>Fit to screen</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={fitScreenByWidth}>Fit width</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={fitScreenByHeight}>Fit height</button>
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