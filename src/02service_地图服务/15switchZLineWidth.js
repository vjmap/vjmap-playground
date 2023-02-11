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
        // --切换线宽是否显示--
        // js代码
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: 'sys_hello',
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
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
            // 如果获取到了默认线宽的设置
            message.info(svc.currentMapParam().lineWidthDisplay ? '默认线宽显示已开' :  '默认线宽显示已关' )
        }
        const switchToShowLineWidth = async () => {
            await updateLineWeightStyle([1]) // 所有级别都显示线宽
        }
        
        const switchToHideLineWidth = async () => {
            await updateLineWeightStyle([0]) // 所有级别都不显示线宽
        }
        
        const switchToZoomLineWidth = async () => {
            await updateLineWeightStyle([0, 0, 1]) // 前两级不显示线宽，后面的级别都显示线宽
        }
        
        
        const updateLineWeightStyle = async (lineWeight) => {
            await map.updateStyle(svc, {
                name: "lineWidth",
                backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF,//深色为黑色，浅色为白色
                lineweight: lineWeight
            });
        }
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>设置：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToShowLineWidth}>显示线宽</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToHideLineWidth}>不显示线宽</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToZoomLineWidth}>线宽随缩放级别改变</button>
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