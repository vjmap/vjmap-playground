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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/control/controlMinimap
        // --小地图控件(鹰眼控件)--
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
            style: svc.rasterStyle(), //svc.rasterBlankStyle(0, 24), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        
        await map.onLoad();
        
        map.addControl(new vjmap.MiniMapControl({
            containerStyle: {
                background: "#31346a85",
                transform: "scale(0.6)",
                transformOrigin: "100% 0%"
                //'top-right'
                //transformOrigin: "100% 0%"
                //'top-left'
                //transformOrigin: "0% 0%"
                //'bottom-right'
                //transformOrigin: "100% 100%"
                //'bottom-left'
                //transformOrigin: "0% 100%"
            }
        }), 'top-right');
        
        
        /* 如果需要设置地图旋转角度，可用如下代码 */
        /*
        // 首先获取地图初始化的角度 ，也可以自定义
        let bearing = svc.currentMapParam().view.bearing
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), //svc.rasterBlankStyle(0, 24), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            bearing: bearing, // 设置方位角
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        
        await map.onLoad();
        
        let ctrl = new vjmap.MiniMapControl({
            containerStyle: {
                background: "#31346a85",
                transform: "scale(0.6)",
                transformOrigin: "100% 0%"
            }
        })
        
        map.addControl(ctrl, 'top-right');
        // 给鹰眼控件设置角度
        ctrl.getMap().setBearing(bearing)
        // 给地图设置角度
        map.setBearing(bearing)
        // 在鹰眼控件中移动后，强制把旋转角度设置回来
        ctrl.getMap().on("mouseup", () => map.setBearing(bearing));
        */
        
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