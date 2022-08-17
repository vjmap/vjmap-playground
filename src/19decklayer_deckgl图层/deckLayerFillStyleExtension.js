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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerFillStyleExtension
        // --deck填充图案图层--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 3, // 设置地图缩放级别
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        // 限制地图范围为全图范围，防止多屏地图显示
        map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
        
        const mapBounds = map.getGeoBounds(0.6);
        
        // 下面增加deck的图层
        if (typeof deck !== "object") {
            // 如果没有deck环境
            await vjmap.addScript([{
                src: "../../js/deck.gl.min.js"
            }]);
        
        }
        
        let len = mapBounds.width() / 50;
        let polygons = []
        for(let i = 0; i < 200; i++) {
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
            const p3 = vjmap.geoPoint([p1.x + len, p1.y + len]);
            const p4 = vjmap.geoPoint([p1.x + len, p1.y]);
            polygons.push({
                // 部分三角形，部分四边形
                points: map.toLngLat(i % 5 ===  0 ? [p1, p2, p4] : [p1, p2, p3, p4]),
                properties: {
                    name: "polygon" + (i + 1),
                    color: vjmap.randomColor()
                }
            })
        }
        
        
        const patterns = ['dots', 'hatch-1x', 'hatch-2x', 'hatch-cross'];
        const deckLayer = new vjmap.DeckLayer({
            id: 'deck',
            type: deck.GeoJsonLayer,
            data: vjmap.createPolygonGeoJson(polygons),
        
            stroked: true,
            filled: true,
            lineWidthMinPixels: 2,
            getLineColor: [60, 60, 60],
            getFillColor: [60, 180, 240],
        
            // props added by FillStyleExtension
            fillPatternMask: true,
            fillPatternAtlas: env.assetsPath + 'data/pattern.png',
            fillPatternMapping: env.assetsPath + 'data/pattern.json',
            getFillPattern: (f, {index}) => patterns[index % 4],
            getFillPatternScale: 500,
            getFillPatternOffset: [0, 0],
        
            // Define extensions
            extensions: [new deck.FillStyleExtension({pattern: true})]
        });
        map.addLayer(deckLayer);
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