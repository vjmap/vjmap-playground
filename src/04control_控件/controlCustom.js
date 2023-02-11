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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/control/controlCustom
        // --自定义缩放级别控件--
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
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        
        // 自定义显示缩放级的控件
        class CustomShowZoomControl {
            constructor(options = {}) {
                this.style = options.style || {};// 样式
            }
            _insertControl() {
                this.container = document.createElement("div");
                this.container.classList.add("vjmapgis-ctrl");
        
                this.container.style.border = this.style.border || "1px";
                this.container.style.backgroundColor = this.style.backgroundColor || "#A0CFFF";
        
                this.panel = document.createElement("div");
                this._zoomend();
                this.container.appendChild(this.panel);
            }
            _zoomend() {
                let strZoom = `当前级别: ${this.map.getZoom().toFixed(2)}`
                this.panel.innerHTML = strZoom;
            }
            onAdd(map) {
                this.map = map;
                this._insertControl();
                this.map.on("zoomend", this._zoomend.bind(this));
                return this.container;
            }
        
            onRemove() {
                this.map.off("zoomend", this._zoomend.bind(this));
                this.container.parentNode.removeChild(this.container);
            }
        
            getDefaultPosition() {
                return "bottom-left";
            }
        }
        
        let control = new CustomShowZoomControl({style: {border : "1px"}})
        map.addControl(control);
        
        
        // [测试代码]过一分钟后移除（测试移除能否成功)
        setTimeout(() => map.removeControl(control), 60 * 1000)
        
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