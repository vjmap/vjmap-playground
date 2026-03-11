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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/pixelToGeo
        // --Pixel and CAD geo coordinate conversion--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div is dark
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
            style: svc.rasterStyle(), // style
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 2, // set zoom level
            renderWorldCopies: false // do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        
        // UI
        const { useRef } = React
        const App = () => {
            const pixelX = useRef(null);
            const pixelY = useRef(null);
            const geoX = useRef(null);
            const geoY = useRef(null);
        
            // Pixel to geo
            const pixelToGeoPoint = () => {
                let px = +pixelX.current.value;
                let py = +pixelY.current.value;
                // Pixel to lnglat
                let lngLat = map.unproject([px, py]);
                // Lnglat to geo
                let geoPoint = map.fromLngLat(lngLat);
                geoX.current.value = geoPoint.x;
                geoY.current.value = geoPoint.y;
            }
            // Geo to pixel
            const geoPointToPixel = () => {
                let px = +geoX.current.value;
                let py = +geoY.current.value;
                // Geo to lnglat
                let lngLat = map.toLngLat([px, py]);
                // Lnglat to pixel
                let pixelPoint = map.project(lngLat);
                pixelX.current.value = Math.round(pixelPoint.x);
                pixelY.current.value = Math.round(pixelPoint.y);
            }
            return (
                <div>
                    <div className="input-card w270">
                        <div className="input-item border">
                            Pixel X: <input type="text" ref={pixelX} defaultValue="0"
                                        className="inp"/>
                        </div>
                        <div className="input-item border">
                            Pixel Y: <input type="text" ref={pixelY} defaultValue="0"
                                        className="inp"/>
                        </div>
                        <div className="input-item">
                            <button id="moving_btn" className="btn btn-full mr0" onClick={pixelToGeoPoint}>Pixel to geo</button>
                        </div>
                        <div className="input-item border">
                            CAD X:
                            <input type="text" ref={geoX} defaultValue="0" className="inp"/>
                        </div>
                        <div className="input-item border">
                            CAD Y:
                            <input type="text" ref={geoY} defaultValue="0" className="inp"/>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={geoPointToPixel}>Geo to pixel</button>
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