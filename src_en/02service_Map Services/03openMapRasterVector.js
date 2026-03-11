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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/03openMapRasterVector
        // --Raster/vector tile switch--Show raster at low zoom, vector at high zoom
        // js code
        // Create map service instance with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geometric projection from map extent
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create raster tiles: min zoom 0, max display zoom 4 (zoom 1-4 use raster)
        let rasterStyle = svc.rasterStyle(undefined, 0, 4);
        // Create vector tiles: min zoom 3, max 22 (zoom 3+ use vector; overlap at 3 avoids stutter when switching)
        let vectorStyle = svc.vectorStyle(undefined, 3, 24);
        let style = vjmap.cloneDeep(rasterStyle);
        style.sources = {...rasterStyle.sources, ...vectorStyle.sources};
        style.layers = [...rasterStyle.layers, ...vectorStyle.layers];
        
        /* Optional: set vector tile layer opacity to 0.5 below zoom 4
         for(let i = 0; i < vectorStyle.layers.length; i++) {
            let layer = vectorStyle.layers[i];
            let opacityName = layer.type === "line" ? 'line-opacity' : (layer.type === "fill" ? 'fill-opacity' : 'circle-opacity')
            let opacity = layer.paint[opacityName] || 1.0
            layer.paint[opacityName] = [
                "step", ["zoom"],
                0.5, // opacity when zoom < 4
                4,
                opacity // opacity when zoom >= 4
            ]
        }
         */
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: style, // Raster style
            center: prj.toLngLat(mapExtent.center()), // Map center
            zoom: 2, // Initial zoom
            renderWorldCopies: false // Do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        
        await map.onLoad();
        
        // Mouse position control
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
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