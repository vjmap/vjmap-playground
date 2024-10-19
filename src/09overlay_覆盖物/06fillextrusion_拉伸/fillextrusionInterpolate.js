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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/fillextrusion/fillextrusionInterpolate
        // --拉伸多边形指定级别显示--超过一定级别才显示拉伸效果
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
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.6);
        let height = mapBounds.width() / 50;
        let len1 = mapBounds.width() / 100;
        let len2 = mapBounds.width() / 200;
        let len3 = mapBounds.width() / 300;
        let geoDatas = [];
        const h1 = prj.toMeter(height);
        const h2 = prj.toMeter(height * 2);
        for(let i = 0; i < 100; i++) {
            const c = mapBounds.randomPoint();
            const radius = vjmap.randInt(len1, len2);
            const cirlePath = vjmap.getCirclePolygonCoordinates(c, radius);
            geoDatas.push({
                points: map.toLngLat(cirlePath),
                properties: {
                    name: "circle" + (i + 1),
                    color1: vjmap.randomColor(),
                    color2: vjmap.randomColor(),
                    type: "circle",
                    baseHeight: 0,
                    height: vjmap.randInt(h1, h2)
                }
            })
        }
        
        const gradColor = [
            "interpolate",
            ["linear"],
            ['get', 'height'],
            h1,
            'red',
            h2,
            'green',
        ];
        let fillExtrusions = new vjmap.FillExtrusion({
            data: geoDatas,
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', gradColor],
            fillExtrusionOpacity: 0.8,
            // 超过三级才显示高度
            fillExtrusionHeight:[
                "interpolate", ["linear"], ["zoom"],
                3, 0,
                3.05, ['get', 'height']
            ],
            fillExtrusionBase: ['get', 'baseHeight'],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        fillExtrusions.addTo(map);
        fillExtrusions.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，颜色为 ${e.features[0].properties.color} 的 ${e.features[0].properties.type}`))
        fillExtrusions.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        map.flyTo({center: [0, 0], zoom: 4, speed: 0.2});
        
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