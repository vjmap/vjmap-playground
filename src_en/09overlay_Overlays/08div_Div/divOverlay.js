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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/div/divOverlay
        // --Div overlay image--
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
            zoom: 9, // set map zoom level,
            pitch: 30, // pitch angle
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.001);
        const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
        const points = [[mapBounds.min.x, mapBounds.min.y], [mapBounds.min.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.min.y]]
        const markers = []
        // Add four markers to adjust position
        for(let c = 0; c <  colors.length; c++) {
            const marker = new vjmap.Marker({
                color: colors[c],
                draggable: true
            });
            marker.setLngLat(map.toLngLat(points[c])).addTo(map);
            marker.on('drag', e => {
                updateBounds();
            });
            markers.push(marker);
        }
        
        const imageWidth = 1280; // image width
        const imageHeight = 905; // image height
        const image = document.createElement( "img" );
        image.style.position = "absolute"; // with multiple div overlays, position is required for correct draw
        image.style.left = '0px';
        image.style.top = '0px';
        image.style.width = imageWidth + "px";
        image.style.height = imageHeight + "px";
        image.style.opacity = '0.8';
        image.style.zIndex = '-1';
        image.src = env.assetsPath + "images/park.jpg"
        image.style.pointerEvents = "none"
        
        // Add a DIV image overlay
        const divOverlay = new vjmap.DivOverlay({
            bounds: points, // four corner positions
            element: image, // DIV element
            width: imageWidth,// DIV width
            height: imageHeight,// DIV height
            minZoom: 5, // min zoom to show (optional)
            maxZoom: 15 // max zoom to show (optional)
        })
        divOverlay.addTo(map);
        
        const updateBounds = () => {
            // Update position
            divOverlay.updateBounds([map.fromLngLat(markers[0].getLngLat()), map.fromLngLat(markers[1].getLngLat()), map.fromLngLat(markers[2].getLngLat()), map.fromLngLat(markers[3].getLngLat())])
        }
        message.info("Drag the four points to adjust image position");
        
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