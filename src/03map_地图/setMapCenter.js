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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/setMapCenter
        // --设置地图中心点和缩放级别--
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
        
        // 使地图能选择点击拾取高亮
        map.enableLayerClickHighlight(svc, e => {
        	e && message.info({content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`, key: "info", duration: 5});
        })
        
        const { useRef } = React
        // UI界面
        const App = () => {
        	const inputCoord = useRef(null); // 获取坐标 input DOM元素
        	const inputZoom = useRef(null); // 获取级别 input DOM元素
        	const setZoomAndCenter = () => {
        		let coord = inputCoord.current.value;
        		let zoom = inputZoom.current.value;
        		coord = coord.split(",");
        		// 设置地图中心点
        		map.setCenter(map.toLngLat([+coord[0], +coord[1]]));
        		// 设置地图缩放级别
        		map.setZoom(+zoom); // 如果该字符串前面加了个加号，这个数值就变成了number类型
        	}
        	return (
        		<div className="input-card w300">
        			<h4>设置地图中心点和缩放级别</h4>
        			<div className="input-item border">
        				地图中心点：<input type="text" ref={inputCoord} defaultValue="587562246, 3103865690"
        							 placeholder="587562246, 3103865690" className="inp"/>
        			</div>
        			<div className="input-item border">
        				缩放级别：<input type="text" ref={inputZoom} defaultValue="5" placeholder="5" className="inp"/>
        			</div>
        			<div className="input-item">
        				<button id="random-center-zoom-btn" className="btn btn-full mr0"
        						onClick={setZoomAndCenter}>设置
        				</button>
        			</div>
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