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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/01webOsm
        // --OSM map--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Create lnglat projection by map bounds
        let prj = new vjmap.LnglatProjection();
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: ["https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                    }
                },
                layers: [{
                    id: 'osm',
                    type: 'raster',
                    source: 'osm',
                }]
            },
            center: prj.toLngLat([116.39, 39.90]),
            zoom: 10,
            pitch: 0,
            renderWorldCopies: false // Do not show multi-screen map
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent by map bounds
        //map.fitMapBounds();
        await map.onLoad();
        
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