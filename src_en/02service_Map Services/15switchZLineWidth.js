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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/15switchZLineWidth
        // --Toggle line width display--
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: 'sys_hello',
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle()
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        await map.onLoad();
        
        
        if (svc.currentMapParam().lineWidthDisplay !== undefined) {
            message.info(svc.currentMapParam().lineWidthDisplay ? 'Default line width display is on' : 'Default line width display is off')
        }
        const switchToShowLineWidth = async () => {
            await updateLineWeightStyle([1]) // Show line width at all zoom levels
        }
        
        const switchToHideLineWidth = async () => {
            await updateLineWeightStyle([0]) // Hide line width at all levels
        }
        
        const switchToZoomLineWidth = async () => {
            await updateLineWeightStyle([0, 0, 1]) // Hide at first two levels, show at rest
        }
        
        
        const updateLineWeightStyle = async (lineWeight) => {
            await map.updateStyle(svc, {
                name: "lineWidth",
                backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF, // Dark=black, light=white
                lineweight: lineWeight
            });
        }
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>Settings:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToShowLineWidth}>Show line width</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToHideLineWidth}>Hide line width</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToZoomLineWidth}>Line width by zoom level</button>
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