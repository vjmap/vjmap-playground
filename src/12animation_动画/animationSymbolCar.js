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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationSymbolCar
        // --图标路径动画--
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
        let geoLineDatas = [];
        let geoPointDatas = [];
        
        for(let i = 0; i < 10; i++) {
            const path = mapBounds.randomPoints(2, 4);
            // 线
            geoLineDatas.push({
                points: map.toLngLat(path),
                properties: {
                    name: "line" + (i + 1),
                    color: vjmap.randomColor(),
                    type: "line"
                }
            })
        
            // 点
            // 获取角度
            const angle = vjmap.geoPoint(path[1]).angleTo(vjmap.geoPoint(path[0]));
            geoPointDatas.push({
                point: map.toLngLat(path[0]),
                properties: {
                    name:  `ID:${i + 1}`,
                    bearing: vjmap.radToDeg(-angle),
                    path: path
                }
            });
        }
        
        let polylines = new vjmap.Polyline({
            data: geoLineDatas,
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            lineWidth: 20,
            lineOpacity: 0.4,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polylines.addTo(map);
        
        // 图标
        await map.loadImageEx("car", env.assetsPath + "images/car.png");
        const symbols = new vjmap.Symbol({
            data: geoPointDatas,
            iconImage: "car",
            iconRotate: ['get', 'bearing'],
            iconAllowOverlap: true,
            iconRotationAlignment: 'map'
        });
        
        symbols.addTo(map);
        
        const initData = vjmap.cloneDeep(symbols.getData());
        let lastValue = 0;
        vjmap.createAnimation({
            from: 0,
            to: 1,
            repeatType: "reverse",// 交替反转动画
            repeat: Infinity,
            duration: 5000,
            ease:vjmap.linear, //线性
            onUpdate: latest => {
                // 是否反转动画了,反转动画需要把车的方向改了
                let isReverse = lastValue > latest;
                lastValue = latest;
                const data = symbols.getData();
                for(let i = 0 ; i < data.features.length; i++) {
                    const value = latest;
                    const prop = initData.features[i].properties;
                    const path = vjmap.interpolatePointsByRatio(prop.path, value);
                    if (path.length > 1) {
                        let start = path[path.length - 2];
                        let end = path[path.length - 1];
                        let angle = 0;
                        if (isReverse) {
                            angle = vjmap.geoPoint(start).angleTo(vjmap.geoPoint(end));
                        } else {
                            angle = vjmap.geoPoint(end).angleTo(vjmap.geoPoint(start));
                        }
                        // 更改方位
                        data.features[i].properties.bearing = vjmap.radToDeg(-angle);
        
                        // 更新坐标
                        const geojson = vjmap.createPointGeoJson(map.toLngLat(end));
                        if (geojson.features[0] && geojson.features[0].geometry) {
                            data.features[i].geometry.coordinates = geojson.features[0].geometry.coordinates;
                        }
                    }
                }
                symbols.setData(data);
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