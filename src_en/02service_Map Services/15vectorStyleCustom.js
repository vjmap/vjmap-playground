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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/15vectorStyleCustom
        // --Custom vector tile rendering--Custom vector tile drawing
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            }, // Vector tile style
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        await map.onLoad();
        const layers = svc.getMapLayers();
        const prefix = "my";
        const sourceId = prefix + "-source";
        map.addVectorSource(sourceId, svc.vectorTileUrl(), {
            maxzoom: 25,
            minzoom: 0
        });
        
        const mapParam = svc.currentMapParam();
        const darkMode = mapParam && mapParam.darkMode;
        // Invert color
        const darkColor = [
            "case",
            ["==", ["get", "color"], "#000000"],
            "#FFFFFF",
            ["get", "color"]
        ];
        const color = [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "rgba(0,0,255,255)",
            darkMode ? darkColor : ["get", "color"]
        ];
        
        // Point symbol layer
        map.addSymbolLayer(prefix + "-layer-points", sourceId, {
            source: sourceId,
            sourceLayer: "points",
            textColor: color
        })
        
        // Line layer
        map.addLineLayer(prefix + "-layer-lines", sourceId, {
            source: sourceId,
            sourceLayer: "lines",
            lineCap: "round",
            lineColor: color,
            lineWidth: [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                3,
                ["get", "linewidth"]
            ]
        })
        
        // Fill border layer
        map.addLineLayer(prefix + "-layer-polygons-border", sourceId, {
            source: sourceId,
            sourceLayer: "polygons",
            lineColor: color
        })
        
        // Fill layer
        map.addFillLayer(prefix + "-layer-polygons", sourceId, {
            source: sourceId,
            sourceLayer: "polygons",
            fillColor: color,
            fillAntialias: true,
            fillOutlineColor: color,
            fillOpacity: [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.5,
                ["get", "alpha"]
            ]
        })
        
        // Entity type ID to name mapping
        const { entTypeIdMap } = await svc.getConstData();
        // Hover highlight
        map.enableVectorLayerHoverHighlight((event, feature, layer) => {
            // Click-highlight entity callback
            const prop = feature.properties;
            let content = `event: ${event}; feature: ${feature.id}; layer: ${layers[prop.layer].name}; type: ${entTypeIdMap[prop.type]}`
            message.info({ content, key: "info", duration: 5});
        }, prefix)
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