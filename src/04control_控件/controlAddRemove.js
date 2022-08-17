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
        // --地图控件增加与移除--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false, // 不显示多屏地图
            locale: {
                'FullscreenControl.Enter': '进入全屏',
                'FullscreenControl.Exit': '退出全屏',
                'NavigationControl.ZoomIn': '放大',
                'NavigationControl.ZoomOut': '缩小',
                'NavigationControl.ResetBearing': '方位角复位',
                'ScaleControl.Meters': '米', // 如果制图单位不是米，请修改。如制图单位是毫米，可改成毫米，如果没有制图单位，可为空
                'ScaleControl.Kilometers': '千米',// 如果制图单位不是米，请修改。如制图单位是毫米，可改成米，如果没有制图单位，可写为k
            }
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
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
                // 全屏的时候需要设置下背景色，因为canvas默认是透明色，全屏会导致为黑色
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
        
        // UI界面
        const App = () => {
            return (
                <div className="info" style={{minWidth: "120px"}}>
                    <div className="input-item">
                        <label className="chbox">
                            <input type="checkbox" onClick={showHideScaleControl}/>比例尺
                        </label>
                    </div>
                    <div className="input-item">
                        <label className="chbox">
                            <input type="checkbox" onClick={showHideNavigationControl}/>导航条
                        </label>
                    </div>
                    <div className="input-item">
                        <label className="chbox">
                            <input type="checkbox" onClick={showHideFullScreenControl}/>全屏
                        </label>
                    </div>
                    <div className="input-item">
                        <label className="chbox">
                            <input type="checkbox" onClick={showHideMousePositionControl}/>鼠标位置
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