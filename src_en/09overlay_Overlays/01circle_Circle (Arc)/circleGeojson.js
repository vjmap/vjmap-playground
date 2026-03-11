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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/circle/circleGeojson
        // --Circle symbol--
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
        
        let mapBounds = map.getGeoBounds();
        await map.onLoad();
        
        
        // Create GeoJSON source "ids"
        map.addGeoJSONSource('ids');
        // Create circle layer 'ids-circle' linked to "ids"
        map.addCircleLayer('ids-circle', 'ids', {
            // Different color by hover state
            circleColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', '#FFA0FD'],
            // Different width by hover state
            circleStrokeWidth: ['case', ['to-boolean', ['feature-state', 'hover']], 2, 1],
        });
        // Set circle radius for layer
        map.setCircleRadius(['ids-circle'], 12);
        // Set pointer cursor on this layer
        map.hoverPointer(['ids-circle']);
        // Enable hover feature state for this layer
        map.hoverFeatureState('ids-circle');
        
        // Random GeoJSON points
        let data = mapBounds.randomGeoJsonPointCollection(1000);
        // Set source data
        map.setData('ids', map.toLngLat(data))
        setInterval(() => {
            data = mapBounds.randomGeoJsonPointCollection(Math.floor(Math.random() * 1000));
            // Simulate data update
            map.setData('ids', map.toLngLat(data))
        }, 5000)
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