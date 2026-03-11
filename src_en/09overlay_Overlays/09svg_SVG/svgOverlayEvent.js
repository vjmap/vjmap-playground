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
        // --SVG events--
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID (ensure it exists; upload new drawing to create)
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        await map.onLoad();
        
        
        let mapBounds = map.getGeoBounds();
        let len = mapBounds.width() / 5;
        let svgOverlay = new vjmap.SvgOverlay({
            maxZoom: 5, // hidden above this zoom
            maxPitch: 60 // hidden when pitch over 60 degrees
        });
        svgOverlay.addTo(map);
        
        // Add gradient
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
                    // Event callback
                    let ele = svgParentElement.getElementById(id);
                    if (!ele) return;
                    ele.addEventListener("mouseover", e => ele.style.opacity = 0.6);
                    ele.addEventListener("mouseout", e => ele.style.opacity = 1.0);
                    ele.addEventListener("click", e => message.info("Clicked circle " + id));
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