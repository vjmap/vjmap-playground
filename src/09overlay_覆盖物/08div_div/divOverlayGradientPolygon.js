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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/div/divOverlayGradientPolygon
        // --div覆盖物绘制渐变多边形--
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
        
        // 根据一个指定的范围，把范围内的地理坐标点转为svg点坐标，svgWidth为svg的宽，高会根据范围同比例自动计算
        function toSvgPath(svgWidth, points, bounds, isClose) {
            if (!bounds) {
                // 如果没有bounds，则根据点序列成一个新的范围
                bounds = vjmap.GeoBounds.fromDataExtent(points);
            }
            const svgHeight = bounds.height() * svgWidth / bounds.width();
            const xRadio = svgWidth / bounds.width();
            const yRadio = svgHeight / bounds.height();
            const coords = points.map(e => [(e[0] - bounds.min.x) * xRadio, svgHeight - (e[1] - bounds.min.y) * yRadio]);
            let path = `M ${coords[0][0]} ${coords[0][1]}`;
            const toPath = coords.slice(1).reduce((c, a) => c + ` L ${a[0]} ${a[1]}`, "");
            path = path + toPath + (isClose ? " Z" : "")
            return {
                path,
                coords,
                bounds,
                svgWidth,
                svgHeight
            }
        }
        
        const mapBounds = map.getGeoBounds(0.1);
        const randPoint = mapBounds.randomPoint();
        const points = [[mapBounds.min.x, mapBounds.min.y], [mapBounds.min.x, mapBounds.max.y], [randPoint.x, randPoint.y], [mapBounds.max.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.min.y]]
        const markers = []
        // 增加个覆盖物用来对比位置
        for(let c = 0; c <  points.length; c++) {
            const marker = new vjmap.Marker();
            marker.setLngLat(map.toLngLat(points[c])).addTo(map);
            markers.push(marker);
        }
        
        
        const width = 2000;
        const svgPath = toSvgPath(width, points);
        const height = svgPath.svgHeight;
        const div = document.createElement( "div" );
        div.innerHTML = `
                        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <radialGradient r="0.5" cy="0.5" cx="0.5" id="grad1">
                                   <stop stop-color="#ff0000" offset="0"></stop>
                                   <stop stop-color="#ffff00" offset="1"></stop>
                                </radialGradient>
                                <path d="${svgPath.path}" fill="url(#grad1)" xmlns="http://www.w3.org/2000/svg" />
                            </g>
                        </svg>
                    `;
        div.style.pointerEvents = "none"
        div.style.width = width + "px";
        div.style.height = height + "px";
        div.style.opacity = '0.8';
        div.style.zIndex = '-1';
        div.style.position = "absolute";// 有多个divoverlay时，一定要加定位，否则会导致其他绘制不对
        
        const svgBounds = svgPath.bounds;
        const divOverlay = new vjmap.DivOverlay({
            bounds: [[svgBounds.min.x, svgBounds.min.y], [svgBounds.min.x, svgBounds.max.y], [svgBounds.max.x, svgBounds.max.y], [svgBounds.max.x, svgBounds.min.y]],
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