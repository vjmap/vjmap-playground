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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/getMapCenter
        // --得到地图中心点--
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
        
        // UI界面
        const { useState, useEffect } = React;
        const App = () => {
        	const [zoomText, setZoomText] = useState();
        	const [centerText, setCenterText] = useState();
        	const logMapinfo = (e) => {
        		let z = map.getZoom(); // 获取地图的缩放级别
        		let c = map.getCenter(); // 获取地图的中心点
        		let center = map.fromLngLat(c);
        		setZoomText(z.toFixed(2)) ; // 更改UI
        		setCenterText(center.x.toFixed(6) + ', ' + center.y.toFixed(6)) // 更改UI
        	}
        	useEffect(() => {
        		// 只初始化执行
        		logMapinfo(); // 第一次时输出当时值
        		// 响应地图缩放完成后事件
        		map.on('zoomend', logMapinfo);
        		// 响应地图移动完成后事件
        		map.on('moveend', logMapinfo);
        		return ()=> {
        			// 退出时移除事件
        			map.off('zoomend', logMapinfo);
        			map.off('moveend', logMapinfo);
        		}
        	}, []);
        	return (
        		<div className="info">
        			<h4>获取地图中心点和缩放级别</h4>
        			<p>当前级别：<span id="map-zoom">{zoomText}</span></p>
        			<p>当前中心点：<span id="map-center">{centerText}</span></p>
        		</div>
        	);
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
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