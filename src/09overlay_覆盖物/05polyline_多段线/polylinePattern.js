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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polyline/polylinePattern
        // --线型填充图案动画--封装的功能更强的箭头动画请参考动画中的箭头动画
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
        
        let mapBounds = map.getGeoBounds(0.3);
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const routePath = [];
        // 随机加几个地图范围内的点
        routePath.push(mapBounds.min);
        routePath.push(mapBounds.center());
        routePath.push(vjmap.geoPoint([mapBounds.max.x, mapBounds.min.y]));
        routePath.push(mapBounds.max);
        routePath.push(vjmap.geoPoint([mapBounds.min.x, mapBounds.max.y]));
        
        
        
        // 创建动画图集
        const createArrow = (w, h, offset, arrowLen, strokeClr = "#fff", fillClr = "#0f0", lineWidth = 4) => {
            let canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            let context = canvas.getContext('2d');
            context.clearRect(0, 0, w, h);
            context.beginPath();
            context.strokeStyle = strokeClr;
            if (fillClr) context.fillStyle = fillClr;// 如果fillClr为空，则为透明色
            context.fillRect(0, 0, w, h)
            let lw = lineWidth;
            context.lineWidth = lineWidth;
            context.moveTo(offset + lw, 2 + lineWidth);
            context.lineTo(offset + arrowLen - lw, h / 2);
            context.lineTo(offset + lw, h - 4 - lineWidth);
            context.stroke();
            return context.getImageData(
                0,
                0,
                w,
                h
            );
        }
        
        for (let i = 0; i < 4; i++) {
            map.addImage('arrow' + i, createArrow(64, 32, i * 16, 16), { pixelRatio: 1 });
        }
        
        map.addGeoJSONSource('lines', {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                id: 0,
                geometry: {
                    type: "LineString",
                    coordinates: map.toLngLat(routePath)
                }
            }]
        });
        map.addLineLayer("lineLayer", "lines", {
            lineWidth: 16,
            linePattern: 'arrow0'
        });
        
        let cnt = 0;
        setInterval(() => {
            let idx = (cnt++) % 4
            map.setPaintProperty("lineLayer", "line-pattern", 'arrow' + idx)
        }, 200)
        
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