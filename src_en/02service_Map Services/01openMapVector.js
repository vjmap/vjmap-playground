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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/01openMapVector
        // --Open map [Vector tiles]--Open uploaded CAD DWG map with vector tiles
        // js code
        // Create map service instance with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure this ID exists; you can upload a new drawing to create one)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map instance
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.vectorStyle(), // Vector tile style
            center: prj.toLngLat(mapExtent.center()), // Center point
            zoom: 2,
            renderWorldCopies: false,
            antialias: true
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        // Get all layers
        const layers = svc.getMapLayers();
        // Entity type ID to name mapping
        const { entTypeIdMap } = await svc.getConstData();
        // Enable hover highlight (elements highlight when mouse is over them)
        map.enableVectorLayerHoverHighlight((event, feature, layer) => {
            // Callback when entity is highlighted on click
            const prop = feature.properties;
            let content = `event: ${event}; feature: ${feature.id}; layer: ${layers[prop.layer].name}; type: ${entTypeIdMap[prop.type]}`
            message.info({ content, key: "info", duration: 5});
        })
        
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