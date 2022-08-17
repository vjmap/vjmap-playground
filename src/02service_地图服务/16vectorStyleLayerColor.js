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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/16vectorStyleLayerColor
        // --矢量数据图层颜色设置--根据不同的图层名称设置不同的颜色
        document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender // 以几何数据渲染方式打开
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },// 矢量瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        // 获取所有图层
        const layers = svc.getMapLayers();
        const prefix = "my";
        // 矢量瓦片数据源
        const sourceId = prefix + "-source";
        map.addVectorSource(sourceId, svc.vectorTileUrl(), {
            maxzoom: 25,
            minzoom: 0
        });
        
        const mapParam = svc.currentMapParam();
        const darkMode = mapParam && mapParam.darkMode;
        // 反色设置
        const darkColor = [
            "case",
            ["==", ["get", "color"], "#000000"],
            "#FFFFFF",
            ["get", "color"]
        ];
        
        // 根据实体图层设置不同的颜色
        const layerColorMap = {
            "PUB_TITLE": "#0000ff",
            "道路": "#C40076",
            "WZ": "#7900C4" ,
            "TEXT": "#003D7B" ,
        }
        
        // 建立颜色匹配样式
        const layerColorStyle = [
            "match",
            ["get", "layer"] // 获取图层
        ]
        
        for(let k in layerColorMap) {
            // 通过图层名称获取图层索引
            const idx = layers.findIndex(e => e.name === k);
            layerColorStyle.push([idx]);
            layerColorStyle.push(layerColorMap[k]);
        }
        layerColorStyle.push(["get", "color"]); // 默认颜色
        
        const color = [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "rgba(0,0,255,255)",
            darkMode ? darkColor : layerColorStyle
        ];
        
        // 点符号图层
        map.addSymbolLayer(prefix + "-layer-points", sourceId, {
            source: sourceId,
            sourceLayer: "points",
            textColor: color
        })
        
        // 线图层
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
        
        // 填充边框图层
        map.addLineLayer(prefix + "-layer-polygons-border", sourceId, {
            source: sourceId,
            sourceLayer: "polygons",
            lineColor: color
        })
        
        // 填充图层
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
        
        // 实体类型ID和名称映射
        const { entTypeIdMap } = await svc.getConstData();
        // 有高亮状态（鼠标在地图元素上时，会高亮)
        map.enableVectorLayerHoverHighlight((event, feature, layer) => {
            // 点击高亮实体回调事件
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