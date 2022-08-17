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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/div/divOverlayRadar
        // --div覆盖物绘制雷达效果--
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
            zoom: 3, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.1);
        const points = [[mapBounds.min.x, mapBounds.min.y], [mapBounds.min.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.min.y]]
        const marker = new vjmap.Marker();
        marker.setLngLat(map.toLngLat(mapBounds.center()));
        marker.addTo(map);
        
        const width = 400;
        const height = 400;
        const div = document.createElement( "div" );
        div.innerHTML = `
                        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style="stop-color:rgb(0,255,0);stop-opacity:.8" />
                                    <stop offset="50%" style="stop-color:rgb(0,150,0);stop-opacity:.5" />
                                    <stop offset="100%" style="stop-color:rgb(0,30,0);stop-opacity:.1" />
                                </linearGradient>
                                <path d="M 373.20508075688775 300 A 200 200 0 0 0 200 0 L 200 200 Z" fill="url(#grad1)" xmlns="http://www.w3.org/2000/svg" />
                               <animateTransform attributeName="transform" begin="0s" dur="3s" type="rotate" from="0 200 200" to="360 200 200" repeatCount="indefinite" />
                            </g>
                        </svg>
                    `;
        div.style.pointerEvents = "none"
        div.style.width = width + "px";
        div.style.height = height + "px";
        div.style.opacity = '0.8';
        div.style.position = "absolute";// 有多个divoverlay时，一定要加定位，否则会导致其他绘制不对
        
        const divOverlay = new vjmap.DivOverlay({
            bounds: points,
            element: div,
            width: width,
            height: height,
            updateDivSize: true, // 如果svg需要放大，需要加此参数
            maxZoom: 6
        })
        divOverlay.addTo(map);
        
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