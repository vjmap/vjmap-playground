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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/circle/circleLayerMany
        // --批量绘制圆--
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
        map.fitMapBounds();
        await map.onLoad();
        const mapBounds = map.getGeoBounds(0.6);
        let geoDatas = []
        for(let i = 0; i < 500; i++) {
            const c = mapBounds.randomPoint();
            geoDatas.push(c)
        }
        
        let circles = new vjmap.Circle({
            data: map.toLngLat(geoDatas),
            circleColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', '#FFA0FD'],
            circleRadius: 8,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        circles.addTo(map);
        
        // 如果要给每个圆赋属性，如颜色或半径, 可用如下方法
        let geoDatas2 = []
        for(let i = 0; i < 500; i++) {
            const c = mapBounds.randomPoint();
            let data = {
                point: map.toLngLat(c),
                properties: {
                    id:i,
                    name: 'circle'+i,
                    color: vjmap.randomColor(),
                    radius: vjmap.randInt(3, 12)
                }
            }
            geoDatas2.push(data)
        }
        
        let circles2 = new vjmap.Circle({
            data: geoDatas2,
            circleColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            circleRadius: ['get', 'radius'],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        circles2.addTo(map);
        
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