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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/div/divOverlayHeight
        // --Div overlay with height--
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
            center: [5.8276, 0.95622], // set map center
            zoom: 3, // set map zoom level,
            pitch: 65, // pitch angle
            bearing: 60, // bearing
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        let mapBounds = map.getGeoBounds(0.05);
        const randHeight = ()=> map.pixelToHeight(vjmap.randInt(50, 60), 2);// height in pixels (50-60) at zoom level 2
        
        
        const createDivOverlay = ps => {
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
                bounds: ps, // four corner positions
                element: image, // DIV element
                width: imageWidth,// DIV width
                height: imageHeight
            })
            divOverlay.addTo(map);
        }
        
        let height1 = randHeight();
        const points1 = [
            [mapBounds.min.x, mapBounds.min.y, 0],
            [mapBounds.min.x, mapBounds.min.y, height1],
            [mapBounds.min.x, mapBounds.max.y, height1],
            [mapBounds.min.x, mapBounds.max.y, 0],
        ]
        createDivOverlay(points1)
        
        
        let height2 = randHeight();
        const points2 = [
            [mapBounds.min.x, mapBounds.min.y, height2],
            [mapBounds.min.x, mapBounds.max.y, height2],
            [mapBounds.max.x, mapBounds.max.y, height2],
            [mapBounds.max.x, mapBounds.min.y, height2],
        ]
        createDivOverlay(points2)
        
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