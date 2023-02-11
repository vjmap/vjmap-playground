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
        // --缩放地图适应屏幕范围--
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 获取地图绘制的数据范围
        let drawBounds = vjmap.GeoBounds.fromString(res.drawBounds); // 或者通过 svc.currentMapParam().drawBounds
        map.fitMapBounds(drawBounds);
        
        // 自适应屏幕
        const fitScreen = () => {
            map.fitMapBounds(drawBounds);
        }
        
        // 水平方向铺满屏幕
        const fitScreenByWidth = () => {
            let [w, h] = map.getCanvasSize(); // 获取屏幕宽高
            let boundsWidth = drawBounds.width();// 宽取原来的
            let boundsHeight = drawBounds.width() * h / w;
            let fitBounds = vjmap.GeoBounds.fromCenterWH(drawBounds.center(), boundsWidth, boundsHeight);
            map.fitMapBounds(fitBounds);
        }
        
        // 竖直方向铺满屏幕
        const fitScreenByHeight = () => {
            let [w, h] = map.getCanvasSize(); // 获取屏幕宽高
            let boundsHeight = drawBounds.height();// 高取原来的
            let boundsWidth = drawBounds.height() * w / h;
            let fitBounds = vjmap.GeoBounds.fromCenterWH(drawBounds.center(), boundsWidth, boundsHeight);
            map.fitMapBounds(fitBounds);
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>主题色：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={fitScreen}>自适应屏幕</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={fitScreenByWidth}>水平方向铺满屏幕</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={fitScreenByHeight}>竖直方向铺满屏幕</button>
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