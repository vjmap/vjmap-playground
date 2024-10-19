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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/fillextrusion/fillextrusion
        // --拉伸多边形--
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
            zoom: 2, // 设置地图缩放级别,
            pitch: 60, // 倾斜角度
            antialias: true, // 反锯齿
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        
        await map.loadImageEx("buildtexture", env.assetsPath + "images/buildtexture.png");
        await map.loadImageEx("buildtexture2", env.assetsPath + "images/buildtexture2.png");
        const mapBounds = map.getGeoBounds(0.6);
        let len1 = mapBounds.width() / 100;
        let len2 = mapBounds.width() / 200;
        let len3 = mapBounds.width() / 300;
        let geoDatas = [];
        let geoPatternDatas = []
        for (let i = 0; i < 100; i++) {
            const c = mapBounds.randomPoint();
            const radius = vjmap.randInt(len1, len2);
            let startAngle = 0;
            let endAngle = 360;
            if (i % 2 === 0) {
                // 偶数生成圆弧
                startAngle = vjmap.randInt(0, 360);
                endAngle = vjmap.randInt(0, 360);
            }
            const cirleArcPath = vjmap.getCirclePolygonCoordinates(c, radius, 360, startAngle, endAngle);
            geoPatternDatas.push({
                points: map.toLngLat(cirleArcPath),
                properties: {
                    name: "circle" + (i + 1),
                    color: vjmap.randomColor(),
                    type: "circle",
                    pattern: i % 2 === 0 ? "buildtexture" : "buildtexture2",
                    baseHeight: vjmap.randInt(1000000, 1200000),
                    height: vjmap.randInt(1500000, 2000000)
                }
            })
        }
        
        for (let i = 0; i < 100; i++) {
            const c = mapBounds.randomPoint();
            const majorAxis = vjmap.randInt(len1, len2);
            const minorAxis = vjmap.randInt(len2, len3);
            let startAngle = 0;
            let endAngle = 360;
            if (i % 2 === 0) {
                // 偶数生成圆弧
                startAngle = vjmap.randInt(0, 360);
                endAngle = vjmap.randInt(0, 360);
            }
            const ellipseArcPath = vjmap.getEllipsePolygonCoordinates(c, majorAxis, minorAxis, 360, startAngle, endAngle);
            geoDatas.push({
                points: map.toLngLat(ellipseArcPath),
                properties: {
                    name: "ellipse" + (i + 1),
                    color: vjmap.randomColor(),
                    type: "ellipse",
                    baseHeight: 0,
                    height: vjmap.randInt(1000000, 2000000)
                }
            })
        }
        
        for (let i = 0; i < 100; i++) {
            const isSquare = vjmap.randInt(0, 1);
            const pts = []
            const len = vjmap.randInt(len1, len3);
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
            const p3 = vjmap.geoPoint([p1.x + len, p1.y + len]);
            pts.push(p1, p2, p3);
            if (isSquare) {
                pts.push(vjmap.geoPoint([p1.x + len, p1.y]));
            }
            geoDatas.push({
                points: map.toLngLat(pts),
                properties: {
                    name: isSquare ? "square" : "triangle" + (i + 1),
                    color: vjmap.randomColor(),
                    type: isSquare ? "square" : "triangle",
                    baseHeight: 0,
                    height: vjmap.randInt(1000000, 2000000)
                }
            })
        }
        
        for (let i = 0; i < 100; i++) {
            const pts = []
            const p1 = mapBounds.randomPoint().toArray();
            const p2 = [p1[0] + vjmap.randInt(len2, len3), p1[1] + vjmap.randInt(len2, len3)];
            const p3 = [p2[0] + vjmap.randInt(len2, len3), p2[1] - vjmap.randInt(len2, len3)];
            // 把曲线上的点转为贝塞尔曲线参数
            const c = vjmap.polylineToBezierCurve([p1, p2, p3]);
            // 据贝塞尔曲线参数离散成线
            const curvePath = vjmap.bezierCurveToPolyline(c);
            geoDatas.push({
                points: map.toLngLat(curvePath),
                properties: {
                    name: "curve" + (i + 1),
                    color: vjmap.randomColor(),
                    type: "curve",
                    baseHeight: 0,
                    height: vjmap.randInt(1000000, 2000000)
                }
            })
        }
        
        let fillExtrusions = new vjmap.FillExtrusion({
            data: geoDatas,
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillExtrusionOpacity: 1,
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'baseHeight'],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        fillExtrusions.addTo(map);
        fillExtrusions.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，颜色为 ${e.features[0].properties.color} 的 ${e.features[0].properties.type}`))
        fillExtrusions.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        
        let fillPatternExtrusions = new vjmap.FillExtrusion({
            data: geoPatternDatas,
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'baseHeight'],
            fillExtrusionPattern: ["get", "pattern"], // 填充图案图像宽度和高度必须是两倍（2、4、8、...、512）
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        fillPatternExtrusions.addTo(map);
        fillPatternExtrusions.clickLayer(e => message.info(`您点击了图案第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，颜色为 ${e.features[0].properties.color} 的 ${e.features[0].properties.type}`))
        fillPatternExtrusions.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        
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