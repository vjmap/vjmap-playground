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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/03openMapVectorRaster
        // --Raster and vector tiles together--Some layers as raster, some as vector.
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
        
        // Use "道路" (road) layer as vector, others as raster
        // Vector for front-end drawing; raster for static data to balance performance and flexibility
        let layers = svc.currentMapParam().layers;
        let layerIndex = layers.findIndex(layer => layer.name === "道路") // "道路" = road
        
        // Raster
        let rStyle = await svc.createStyle({
            ...vjmap.openMapDarkStyle(),
            layeroff: [layerIndex] // Layers to hide in raster (hide road layer)
        })
        // Create raster style
        let rasterStyle = svc.rasterStyle(svc.rasterTileUrl({
            layer: rStyle.stylename
        }));
        
        // Vector
        let vStyle = await svc.createStyle({
            ...vjmap.openMapDarkStyle(),
            layeron: [layerIndex] // Layers to show in vector (show road layer only)
        })
        // Create vector style
        let vectorStyle = svc.vectorStyle(svc.vectorTileUrl({
            layer: vStyle.stylename
        }));
        
        
        // Merge raster and vector tiles
        let style = vjmap.cloneDeep(rasterStyle);
        style.sources = {...rasterStyle.sources, ...vectorStyle.sources};
        style.layers = [...rasterStyle.layers, ...vectorStyle.layers];
        
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
        
        // Animate vector line layer with ant path
        let styles = vectorStyle.layers;
        let lineLayerId = styles.filter(s => s.type === "line" && s['source-layer'] === 'lines')[0].id
        let antPathImages = vjmap.createAntPathAnimateImages({
            canvasWidth: 32,
            canvasHeight: 2,
            fillColor1: "#f0f",
            fillColor2: "#0ff"
        });
        let animLineLayer = vjmap.animateVectorLayer(map, lineLayerId, {
            animateImages: antPathImages
        }, 0)
        
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