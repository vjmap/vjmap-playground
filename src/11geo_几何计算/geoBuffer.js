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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoBuffer
        // --缓冲区计算--
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
        // 导航条控件
        map.addControl(new vjmap.NavigationControl());
        // 鼠标移动显示坐标位置控件
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
        const mapBounds = map.getGeoBounds(0.6);
        for(let i = 0; i < 100; i ++) {
            let marker = new vjmap.Marker();
            marker.setLngLat(map.toLngLat(mapBounds.randomPoint()));
            marker.addTo(map);
        }
        
        message.info("请绘制一个缓冲区，缓冲区内的标记Marker将变红色")
        
        let drawCircle = await vjmap.Draw.actionDrawCircle(map);
        if (drawCircle.cancel) {
            return
        }
        
        let feature = drawCircle.features[0];
        let polygon = new vjmap.Polygon({
            data: feature.geometry.coordinates[0],
            fillColor: 'yellow',
            fillOpacity: 0.3,
            fillOutlineColor: "#f00"
        });
        polygon.addTo(map);
        
        let center = map.fromLngLat(feature.properties.center);
        let circlePoint = map.fromLngLat(feature.geometry.coordinates[0][0]);
        let radius = center.distanceTo(circlePoint);
        // 遍历所有的点
        let markers = map.getMarkers();
        for (let m of markers) {
            let pt = map.fromLngLat(m.getLngLat());
            if (center.distanceTo(pt) <= radius) {
                m.setColor("red");
            }
        }
        
        
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