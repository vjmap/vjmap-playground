const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/svg/svgOverlayEvent
        // --SVG事件--
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
        await map.onLoad();
        
        
        let mapBounds = map.getGeoBounds();
        let len = mapBounds.width() / 5;
        let svgOverlay = new vjmap.SvgOverlay({
            maxZoom: 5, // 第5级时全部不显示了
            maxPitch: 60 // 倾角超过60度就不显示了
        });
        svgOverlay.addTo(map);
        
        // 增加一个渐变色
        svgOverlay.addElement(`
                  <defs>
                    <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                      <stop offset="0%" style="stop-color:${vjmap.randomColor()};stop-opacity:0.8" />
                      <stop offset="100%" style="stop-color:${vjmap.randomColor()};stop-opacity:1" />
                    </radialGradient>
                  </defs>
                `)
        
        const getStyle = (style = {}) => {
            return Object.keys(style).map(key => `${key}:${style[key]}`).join(";")
        }
        const svgCircleHtml = (id, point, r, style) => {
            return ` <circle id="${id}" ${vjmap.SvgOverlay.attr_cx_cy_r(point.x, point.y, r)} style="${getStyle(style)}"/>`
        }
        
        const addCircle = ()=> {
            let id = "circle" + vjmap.RandomID();
            return svgOverlay.addElement({
                html: svgCircleHtml(id, mapBounds.randomPoint(), len / 4, {fill: "url(#grad1)", stroke: vjmap.randomColor(), "stroke-width": 3, cursor: "pointer"}),
                event: svgParentElement => {
                    // 事件回调
                    let ele = svgParentElement.getElementById(id);
                    if (!ele) return;
                    ele.addEventListener("mouseover", e => ele.style.opacity = 0.6);
                    ele.addEventListener("mouseout", e => ele.style.opacity = 1.0);
                    ele.addEventListener("click", e => message.info("点击了圆" + id));
                }
            })
        }
        
        for(let i = 0; i < 10; i++) {
            addCircle();
        }
        
        
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