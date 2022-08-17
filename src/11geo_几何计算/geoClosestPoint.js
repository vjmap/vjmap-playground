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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoClosestPoint
        // --求最近点--
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
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.6);
        
        let geoDatas = [];
        const lines = [];
        for(let i = 0; i < 20; i++) {
            const points = mapBounds.randomPoints(2, 3);
            geoDatas.push({
                points: map.toLngLat(points),
                properties: {
                    name: "line" + (i + 1),
                    color: vjmap.randomColor(),
                    selected: false
                }
            });
            lines.push(points);
        }
        let polylines = new vjmap.Polyline({
            data: geoDatas,
            lineColor: ['get', 'color'],
            lineWidth: ['case', ['to-boolean', ['get', 'selected']], 5, 2],
        });
        polylines.addTo(map);
        
        // marker
        let marker1 = new vjmap.Marker({
            color: "blue"
        });
        marker1.setLngLat(map.getCenter()).addTo(map);
        let marker2 = new vjmap.Marker({
            color: "red",
            draggable: true
        });
        marker2.setLngLat(map.getCenter()).addTo(map);
        
        let curIndex = -1;
        
        const updateIntersect = lngLat => {
            // 经纬度转几何坐标
            const coord = map.fromLngLat(lngLat);
            // 计算与所有线的最近点
            const res = vjmap.closestPointOnPolylines(coord, lines);
            // 设置交点的marker的位置
            marker1.setLngLat(map.toLngLat(res.closestPoint));
            if (curIndex !== -1) {
                // 取消之前高亮的线
                geoDatas[curIndex].properties.selected = false;
            }
            // 设置现在高亮的线
            geoDatas[res.closestIndex].properties.selected = true;
            curIndex = res.closestIndex;
            // 更新数据
            polylines.setData(geoDatas);
        }
        marker2.on("dragend", e => {
            const lngLat = e.target.getLngLat();
            updateIntersect(lngLat);
        })
        // 一开始就求最近点
        updateIntersect(marker2.getLngLat());
        
        message.info("移动红色标注来实时计算最近点!")
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