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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/text/03scalezpolygontext
        // --Scalable text polygon-- Backend creates text entities and returns polygon data for frontend draw
        // Note: This example uses vjcommon library for shared map utilities
        // Include vjcommon.min.js or npm install vjcommon
        // vjcommon is open source: https://github.com/vjmap/vjmap-common
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: 'sys_hello', // map ID (ensure it exists; upload new map to create)
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: {
                backcolor: 0
            }
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create projection
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds();
        
        
        const draw = map.getDrawLayer();
        
        let desiredCadHeight = mapBounds.height() / 60; // cad font height
        let pixelHeight = desiredCadHeight / map.pixelToGeoLength(1, map.getZoom());
        
        
        for(let i = 0; i < 10; i++) {
            let param = {
                text: 'text' + i,
                height: pixelHeight, // initial text pixel height
                disableScale: true, // no scale
                disableRotate: true, // no rotate
                scaleValue: 1.0,
                position: mapBounds.randomPoint()
            }
            vjcommon.drawText(map, draw, {}, {
                "color": vjmap.randomColor(),// color
                ...param
            });
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