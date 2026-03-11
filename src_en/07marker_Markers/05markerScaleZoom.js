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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/05markerScaleZoom
        // --Point marker scales with zoom--
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
        
        await map.onLoad();
        // Mouse position control
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        const mapBounds = map.getGeoBounds(0.4);
        
        for(let i = 0; i < 5; i++) {
            let point = mapBounds.randomPoint(); // Random point
            let markerEle = new vjmap.BreathingApertureMarker({
                lngLat: map.toLngLat(point),
                text: "vjmap"
            }, {
                width: 200,
                colors: [vjmap.randomColor(), vjmap.randomColor()],
                textColor: "#f00"
            })
            let marker = markerEle.createMarker({
                scaleMaxZoom: 3 // Max zoom for scale; below 3 div scales down, above 3 keeps size
            })
            marker.setAnimation("MAP_ANIMATION_DROP") // Drop animation
            marker.addTo(map);
        
        // Equivalent to above
            /*
            let markerEle = new vjmap.BreathingApertureMarker({
                lngLat: map.toLngLat(point),
                text: "vjmap"
            }, {
                width: 200,
                colors: [vjmap.randomColor(), vjmap.randomColor()],
                textColor: "#f00"
            })
        
            let marker = new vjmap.Marker({
                element: markerEle,
                color: vjmap.randomColor()
            });
            marker.setLngLat(markerEle.getLngLat()); // Coordinate
            marker.setScaleMaxZoom(3); // Max zoom for scale; below 3 div scales, above 3 keeps size
            marker.setAnimation("MAP_ANIMATION_BOUNCE") // Bounce
            marker.addTo(map);
            */
        }
        message.info("Zoom map: below zoom 3 div scales down, above 3 keeps size")
        
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