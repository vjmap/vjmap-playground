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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationLineDashArray
        // --虚线路径动画--
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
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.6);
        
        const lines = mapBounds.randomGeoJsonLineCollection(3, 4);
        map.addGeoJSONSource('lines', map.toLngLat(lines));
        
        
        let dash = [3, 3]; // your input; dash you want to animate
        let speed = 0.5; // your input; speed rate
        let dashArraySeq = createDashArraySeq(dash, speed); // `dashArraySeq` contains dash arrays you can use
        
        function createDashArraySeq(dash, speed = 1) {
            let dashArraySeq = [dash];
            for (let i = speed, len = dash[0] + dash[1]; i < len; i += speed) {
                const arr = [];
                if (i <= len - dash[0]) {
                    arr.push(0, i, dash[0], dash[1] - i);
                } else {
                    const leftFillCnt = i - (len - dash[0]);
                    arr.push(leftFillCnt, dash[1], dash[0] - leftFillCnt, 0);
                }
                dashArraySeq.push(arr);
            }
            return dashArraySeq;
        }
        
        map.addLineLayer("lineLayer", "lines", {
            lineColor: "red",
            lineWidth: 5,
            lineOpacity: 0.8,
            lineDasharray: dashArraySeq[0]
        });
        
        let dashArrayIdx = 0;
        function animateLine(ts) {
            dashArrayIdx = (dashArrayIdx + 1) % dashArraySeq.length;
            map.setPaintProperty('lineLayer', 'line-dasharray', dashArraySeq[dashArrayIdx]);
            requestAnimationFrame(animateLine);
        }
        requestAnimationFrame(animateLine);
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