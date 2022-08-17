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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationCircleRing
        // --动画圆环--
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
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        let len1 = mapBounds.width() / 10;
        let len2 = mapBounds.width() / 50;
        let len = mapBounds.width() / 100;
        let geoDatas = [];
        
        // 计算圆弧的path
        const calcCircleRingPath = (center, radiusOut, radiusIn, startAngle, endAngle) => {
            const cirleArcPathOut = vjmap.getCirclePolygonCoordinates(center, radiusOut, 36, startAngle, endAngle, false);
            const cirleArcPathInner = vjmap.getCirclePolygonCoordinates(center, radiusIn, 36, startAngle, endAngle, false);
            // 两个圆弧点相连接，并且闭合
            return [...cirleArcPathOut, ...cirleArcPathInner.reverse(), cirleArcPathOut[0]];
        }
        for(let i = 0; i < 10; i++) {
            const c = mapBounds.randomPoint();
            const radius = vjmap.randInt(len1, len2);
            let startAngle = vjmap.randInt(0, 360);
            let endAngle = vjmap.randInt(0, 360);
            const circleRingPath  = calcCircleRingPath(c, radius, radius - len, startAngle, endAngle);
            geoDatas.push({
                points: map.toLngLat(circleRingPath),
                properties: {
                    name: "circle" + (i + 1),
                    color: vjmap.randomColor(),
                    color2: vjmap.randomColor(),
                    type: "circle",
                    center: c,
                    radiusOut: radius,
                    radiusIn: radius - len,
                    startAngle,
                    endAngle
                }
            })
        }
        
        let circleRings = new vjmap.Polygon({
            data: geoDatas,
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillOpacity: 0.8,
            fillOutlineColor: "#f00",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        circleRings.addTo(map);
        
        const initData = vjmap.cloneDeep(circleRings.getData());
        
        // 插值函数，定义三个不同的keyframes用于插值计算中间值
        const mapProgressToValues = idx => vjmap.interpolate(
            [0, 0.5, 1],
            [
                { color: initData.features[idx].properties.color, angle: 0 },
                { color: initData.features[idx].properties.color2, angle: 180 },
                { color: initData.features[idx].properties.color, angle: 360 }
            ], {
                ease: vjmap.linear
            }
        )
        vjmap.createAnimation({
            from: 0,
            to: 1,
            repeat: Infinity,
            duration: 2000,
            ease:vjmap.linear, //线性
            onUpdate: latest => {
                const data = circleRings.getData();
                for(let i = 0 ; i < data.features.length; i++) {
                    const value = mapProgressToValues(i)(latest)
                    const prop = initData.features[i].properties;
                    const angle = value.angle;
                    const startAngle = (prop.startAngle + angle);
                    const endAngle = (prop.endAngle + angle);
                    const circleRingPath  = map.toLngLat(calcCircleRingPath(prop.center, prop.radiusOut, prop.radiusIn, startAngle, endAngle));
                    data.features[i].properties.color = value.color;
                    const geojson = vjmap.createPolygonGeoJson(circleRingPath);
                    data.features[i].geometry.coordinates = geojson.features[0].geometry.coordinates;
                }
                circleRings.setData(data);
            }
        })
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