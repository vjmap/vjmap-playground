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
        // --地图上下文菜单--
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
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        let mapBounds = map.getGeoBounds(); // 得到地图地理范围
        
        let isAllowShowMenu = true;//可以设置菜单是否显示
        // 选中的图标，也可以直接指定src路径
        const checkIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAANpJREFUOE9jZKAQMFKon2FgDKjZHVHf4rqiEeR6kl1QuzOyn+E/4/lmj2WLSDagekdkASMjg1aL+/I0WNgR7YLaHRG2/xgZYlrdV6QjBzzRBtTsijzzl4nVvd1l0VucBtTsjlz5/z/jt1a3ZYnIimp2RZ7//+9fQ6vHyo3o0Q53Qc32CAcGpv88DIxMxQyMDB9aXJcHghTX7IxcyMjAeLTZfdksbGkGqxdqdkUuZ2BgkPjPyDCFgeG/W6srqr+JCoPqXZG9jAwM9iyszy0aHA/8wZViiQ7EYWwAAPShQBF/1IlVAAAAAElFTkSuQmCC";
        map.setMenu(event => {
            if (!isAllowShowMenu) return;
        
            return new vjmap.ContextMenu({
                event: event.originalEvent,
                theme: "dark", //light
                width: "250px",
                items: [
                    {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">菜单右键功能演示</span>`},
                    {type: 'multi', items: [
                            {label: '全图', onClick: () => { map.fitMapBounds(); }},
                            {label: '不旋转', onClick: () => { map.setBearing(0); }},
                            {label: '不倾斜', onClick: () => { map.setPitch(0); }},
                        ]},
                    {label: '获取此位置的坐标', onClick: () => {
                            let point = map.fromLngLat(event.lngLat);
                            message.info({content: `当前坐标为 x: ${point.x}, y: ${point.y}`, key: "info", duration: 3});
                        }},
                    {type: 'seperator'},
                    {type: 'submenu', label: '地图缩放', items: [
                            {label: '放大一级', onClick: () => { map.setZoom(map.getZoom() + 1)}},
                            {label: '缩小一级', onClick: () => { map.setZoom(map.getZoom() - 1)}, enabled: map.getZoom() - 1 > 0},
                            {label: '缩小至最小级', onClick: () => { map.setZoom(0)}},
                            {label: '飞行至此位置', onClick: () => {
                                    map.flyTo({
                                        center: event.lngLat,
                                        pitch: 60,
                                        zoom: 5
                                    })
                                }}
                        ]},
                    {type: 'hovermenu', label: '地图设置', items: [
                            {
                                label: '双击鼠标进行缩放',
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
                                label: '允许地图旋转',
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
                                label: '允许地图倾斜',
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
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w160">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => isAllowShowMenu = true}>允许弹出右键菜单</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => isAllowShowMenu = false}>不允许弹出右键菜单</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => map.setMenu()}>销毁菜单</button>
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