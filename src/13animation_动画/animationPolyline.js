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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationPolyline
        // --多段线拉伸动画--
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
            pitch: 60, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.6);
        let len = mapBounds.width() / 200;
        let geoDatas = [];
        
        
        for(let i = 0; i < 10; i++) {
            const path = mapBounds.randomPoints(3, 5);
            geoDatas.push({
                points: [],
                properties: {
                    name: "line" + (i + 1),
                    color: vjmap.randomColor(),
                    type: "line",
                    baseHeight: 0,
                    height: vjmap.randInt(1000000, 2000000),
                    path:  path, // 把生成的路径先存起来，下面用于动画
                    offset: len
                }
            })
        }
        
        let fillExtrusions = new vjmap.FillExtrusion({
            data: geoDatas,
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillExtrusionOpacity: 0.8,
            fillExtrusionHeight:['get', 'height'],
            fillExtrusionBase: ['get', 'baseHeight'],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        fillExtrusions.addTo(map);
        
        const initData = vjmap.cloneDeep(fillExtrusions.getData());
        
        // 由多段线转成多边形
        const polylineToPolygon = (path, offset) => {
            return vjmap.polylineMarginToPolygon(path, {offset: len});
        }
        vjmap.createAnimation({
            from: 0,
            to: 1,
            repeatType: "reverse",// 交替反转动画
            repeat: Infinity,
            duration: 5000,
            ease:vjmap.linear, //线性
            onUpdate: latest => {
                const data = fillExtrusions.getData();
                for(let i = 0 ; i < data.features.length; i++) {
                    const value = latest;
                    const prop = initData.features[i].properties;
                    const path = vjmap.interpolatePointsByRatio(prop.path, value);
                    if (path.length > 1) {
                        const polyPath = polylineToPolygon(path, {offset: prop.offset});
                        const geojson = vjmap.createPolygonGeoJson(map.toLngLat(polyPath));
                        if (geojson.features[0] && geojson.features[0].geometry) {
                            data.features[i].geometry.coordinates = geojson.features[0].geometry.coordinates;
                        }
                    }
                }
                fillExtrusions.setData(data);
                // 弄个灯光效果
                map.setLight({
                    color: '#FFE9FE',
                    intensity: latest
                });
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