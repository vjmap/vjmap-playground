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
        // --Create blank map from data--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        // Data points
        let points = [];
        for(let k = 0; k < 100; k++) {
        	// Random point
        	let pt = [Math.random() * 200, Math.random() * 100]
        	points.push(vjmap.geoPoint(pt))
        }
        // Get point extent
        let dataExtent = vjmap.GeoBounds.fromDataExtent(points);
        dataExtent = dataExtent.square(); // map bounds must be square
        let mapBounds = dataExtent.scale(4); // scale extent; new points should stay within this
        
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapBounds);
        // Map object
        let map = new vjmap.Map({
        	container: 'map', // DIV container ID
        	style: svc.rasterBlankStyle(0, 24), // style
        	center: prj.toLngLat(mapBounds.center()), // set map center
        	zoom: 2, // set zoom level
        	renderWorldCopies: false // do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        
        for(let k = 0; k < 100; k++) {
        	let marker = new vjmap.Marker()
        	marker.setLngLat(map.toLngLat(points[k]));
        	marker.addTo(map);
        }
        
        
        // Fit to data extent
        map.fitMapBounds(dataExtent ,{
        	duration: 0 // no animation
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