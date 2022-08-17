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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/circle/circleGeojson
        // --圆符号--
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
        
        let mapBounds = map.getGeoBounds();
        await map.onLoad();
        
        
        // 创建为"ids"的geojson数据源
        map.addGeoJSONSource('ids');
        // 创建关联"ids"的图层id为 'ids-circle'的圆图层
        map.addCircleLayer('ids-circle', 'ids', {
            // 根据hover不同的状态设置不同的颜色值
            circleColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', '#FFA0FD'],
            // 根据hover不同的状态设置不同的宽度值
            circleStrokeWidth: ['case', ['to-boolean', ['feature-state', 'hover']], 2, 1],
        });
        // 设置图层的圆的半径
        map.setCircleRadius(['ids-circle'], 12);
        // 设置鼠标位于此图层上时，鼠标改变为 'pointer‘ 形状
        map.hoverPointer(['ids-circle']);
        // 设置可以改变此图层的 hover state,用于根据hover不同的状态设置不同的值
        map.hoverFeatureState('ids-circle');
        
        // 随机生成一些geojson的点
        let data = mapBounds.randomGeoJsonPointCollection(1000);
        // 设置数据源数据
        map.setData('ids', map.toLngLat(data))
        setInterval(() => {
            data = mapBounds.randomGeoJsonPointCollection(Math.floor(Math.random() * 1000));
            // 模拟更新数据
            map.setData('ids', map.toLngLat(data))
        }, 5000)
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