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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/28wmsVector
        // --WMS overlay vector--Overlay two maps via WMS vector tiles
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        svc.setCurrentMapParam({
            darkMode: true // Set dark mode when no map opened yet
        })
        // Get map bounds and create map
        let mapBounds = '[-10000,-10000,80000,80000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },// vector tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        // Get map metadata for layer style
        // Layer 1
        let cadMapId = "sys_hello"
        let style = await svc.createStyle({
            backcolor: 0 // dark theme
        }, cadMapId)
        let wmsurl = svc.wmsTileUrl({
            mapid: cadMapId,
            version:"v1",
            layers: style.stylename,
            mapbounds: mapBounds,
            mvt: true
        })
        let vstyle = svc.vectorStyle(wmsurl, 0, 24, "wms")
        let sourceName = Object.keys(vstyle.sources)[0]
        map.addSource(sourceName, vstyle.sources[sourceName]);
        for(let layer of vstyle.layers) {
            map.addLayer(layer)
        }
        
        // Layer 2
        let cadMapId2 = "sys_world"
        let style2 = await svc.createStyle({
            backcolor: 0 // dark theme
        }, cadMapId2)
        let wmsurl2 = svc.wmsTileUrl({
            mapid: cadMapId2,
            version:"v1",
            layers: style2.stylename,
            mapbounds: mapBounds,
            fourParameter: "-35000,0,1,0",// four-parameter to adjust position
            mvt: true
        })
        let vstyle2 = svc.vectorStyle(wmsurl2, 0, 24, "wms2")
        let sourceName2 = Object.keys(vstyle2.sources)[0]
        map.addSource(sourceName2, vstyle2.sources[sourceName2]);
        for(let layer of vstyle2.layers) {
            map.addLayer(layer)
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