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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polygon/polygonMulti
        // --Polygon with hole--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // if open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster here
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        map.fitMapBounds();
        await map.onLoad();
        let holePolygon =  []
        let mapBounds = map.getGeoBounds(0.4);
        const routePath = [];
        routePath.push([mapBounds.min.x, mapBounds.min.y]);
        routePath.push([mapBounds.max.x, mapBounds.min.y]);
        routePath.push([mapBounds.max.x, mapBounds.max.y]);
        routePath.push([mapBounds.min.x, mapBounds.max.y]);
        holePolygon.push(routePath)
        
        let mapBounds2 = map.getGeoBounds(0.2);
        const routePath2 = [];
        routePath2.push([mapBounds2.min.x, mapBounds2.min.y]);
        routePath2.push([mapBounds2.max.x, mapBounds2.min.y]);
        routePath2.push([mapBounds2.max.x, mapBounds2.max.y]);
        routePath2.push([mapBounds2.min.x, mapBounds2.max.y]);
        holePolygon.push(routePath2)
        
        
        let polygon = new vjmap.Polygon({
            data: map.toLngLat(holePolygon),
            fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', 'yellow'],
            fillOpacity: 0.8,
            fillOutlineColor: "#f00",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polygon.addTo(map);
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