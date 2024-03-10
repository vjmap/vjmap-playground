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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/01createMapBlank
        // --根据数据建立空白地图对象--
        // 地图服务对象
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        // 数据点
        let points = [];
        for(let k = 0; k < 100; k++) {
        	// 随机生成一个点
        	let pt = [Math.random() * 200, Math.random() * 100]
        	points.push(vjmap.geoPoint(pt))
        }
        // 获取点的范围
        let dataExtent = vjmap.GeoBounds.fromDataExtent(points);
        dataExtent = dataExtent.square(); // 地图的范围需要正方形，地图范围需要正方形才可以
        let mapBounds = dataExtent.scale(4); // 把范围调点大，这个值可以根据情况自己定，以后加的点不要超过此范围即可
        
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapBounds);
        // 地图对象
        let map = new vjmap.Map({
        	container: 'map', // DIV容器ID
        	style: svc.rasterBlankStyle(0, 24), // 样式
        	center: prj.toLngLat(mapBounds.center()), // 设置地图中心点
        	zoom: 2, // 设置地图缩放级别
        	renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        
        for(let k = 0; k < 100; k++) {
        	let marker = new vjmap.Marker()
        	marker.setLngLat(map.toLngLat(points[k]));
        	marker.addTo(map);
        }
        
        
        // 适应至当前数据范围
        map.fitMapBounds(dataExtent ,{
        	duration: 0 // 取消动画过程
        });
        
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