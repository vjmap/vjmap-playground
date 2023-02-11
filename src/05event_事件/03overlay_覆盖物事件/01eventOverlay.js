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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/overlay/01eventOverlay
        // --覆盖物多段线多边形事件--
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
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
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        
        await map.onLoad();
        let mapBounds = map.getGeoBounds(0.6);
        
        
        let polygon;
        const addTestPolygons = ()=> {
            let len = mapBounds.width() / 50;
            let polygons = []
            for(let i = 0; i < 200; i++) {
                const p1 = mapBounds.randomPoint();
                const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
                const p3 = vjmap.geoPoint([p1.x + len, p1.y]);
                polygons.push({
                    points: map.toLngLat([p1, p2, p3]),
                    properties: {
                        name: "polygon" + (i + 1),
                        color: vjmap.randomColor()
                    }
                })
            }
        
            polygon = new vjmap.Polygon({
                data: polygons,
                // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
                fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
                fillOpacity: 0.8,
                fillOutlineColor: "#f00",
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygon.addTo(map);
            polygon.clickLayer(e => {
                if (e.defaultPrevented) return; //  如果事件之前阻止了，则不再执行了
                message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，颜色为 ${e.features[0].properties.color} 的多边形`)
                e.preventDefault(); // 阻止之后的事件执行
            })
        }
        
        addTestPolygons();
        
        let polylines;
        const addTestPolygines = ()=> {
            let geoDatas = [];
            const lines = [];
            for(let i = 0; i < 20; i++) {
                const points = mapBounds.randomPoints(2, 3);
                geoDatas.push({
                    points: map.toLngLat(points),
                    properties: {
                        name: "line" + (i + 1),
                        color: vjmap.randomColor(),
                    }
                });
                lines.push(points);
            }
        
            polylines = new vjmap.Polyline({
                data: geoDatas,
                // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
                lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
                lineWidth: 10,
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polylines.addTo(map);
            polylines.clickLayer(e => {
                if (e.defaultPrevented) return; //  如果事件之前阻止了，则不再执行了
                message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，颜色为 ${e.features[0].properties.color} 的 多段线`)
                e.preventDefault(); // 阻止之后的事件执行
            })
            map.moveLayer(polylines.layerId, polygon.layerId); // 把多段线放到多边形下面
        }
        
        addTestPolygines();
        
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