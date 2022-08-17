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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoFindShortestPath
        // --求最短路径--
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
        map.fitMapBounds();
        
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.6);
        
        const lines = [];
        for(let i = 0; i < 30; i++) {
            const points = mapBounds.randomPoints(2, 3);
            lines.push(points);
        }
        // 两两求交，生成相交后的线
        const newLines = vjmap.multiLineSplit(lines);
        const geoDatas = newLines.map( e =>  {
            return {
                points: map.toLngLat(e),
                properties: {
                    color: vjmap.randomColor(),
                    selected: false
                }
            }
        })
        
        let polylines = new vjmap.Polyline({
            data: geoDatas,
            lineColor: ['get', 'color'],
            lineWidth: 2,
            lineOpacity: 1
        });
        polylines.addTo(map);
        
        // marker
        let marker1 = new vjmap.Marker({
            color: "blue",
            draggable: true
        });
        marker1.setLngLat(map.toLngLat(mapBounds.randomPoint())).addTo(map);
        let marker2 = new vjmap.Marker({
            color: "red",
            draggable: true
        });
        marker2.setLngLat(map.toLngLat(mapBounds.randomPoint())).addTo(map);
        
        marker1.on("dragend", e => {
            updateClosetPath(map.fromLngLat(marker1.getLngLat()), map.fromLngLat(marker2.getLngLat()));
        })
        marker2.on("dragend", e => {
            updateClosetPath(map.fromLngLat(marker1.getLngLat()), map.fromLngLat(marker2.getLngLat()));
        })
        let marker3, marker4;
        
        const allLines = [...newLines];
        // 下面根据两点计算最短路径
        const updateClosetPath = (startPoint, endPoint) => {
            const result = vjmap.findShortestPath(startPoint, endPoint, allLines.map(e => {
                return {
                    points: e
                }
            }));
            if (result.error) {
                message.error(result.error.message);
            } else {
                drawPath(result.route);
                updateMaker(result.startPoint.closestPoint, result.endPoint.closestPoint);
            }
        }
        
        let drawRoutePolyline;
        // 绘制路径
        const drawPath = (path) => {
            if (drawRoutePolyline) {
                drawRoutePolyline.remove();
            }
            drawRoutePolyline = new vjmap.Polyline({
                data: map.toLngLat(path),
                lineColor: "red",
                lineWidth: 5,
            });
            drawRoutePolyline.addTo(map);
        }
        
        const updateMaker = (pos1, pos2) => {
            pos1 = map.toLngLat(pos1);
            pos2 = map.toLngLat(pos2);
            if (!marker3) {
                marker3 = new vjmap.Marker({
                    color: "blue"
                });
                marker3.setLngLat(pos1);
                marker3.addTo(map);
                marker3.getElement().style.pointerEvents = "none";
                marker3.getElement().style.opacity = 0.2;
            } else {
                marker3.setLngLat(pos1);
            }
            if (!marker4) {
                marker4 = new vjmap.Marker({
                    color: "red"
                });
                marker4.setLngLat(pos2);
                marker4.addTo(map);
                marker4.getElement().style.pointerEvents = "none";
                marker4.getElement().style.opacity = 0.2;
            } else {
                marker4.setLngLat(pos2);
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