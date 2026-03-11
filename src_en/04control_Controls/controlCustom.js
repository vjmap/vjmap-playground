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
        // --Custom zoom control--
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
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        
        // Custom control to display zoom level
        class CustomShowZoomControl {
            constructor(options = {}) {
                this.style = options.style || {};// style
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
                let strZoom = `Current zoom level: ${this.map.getZoom().toFixed(2)}`
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
        
        
        // [Test] Remove after 1 minute (test if removal works)
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