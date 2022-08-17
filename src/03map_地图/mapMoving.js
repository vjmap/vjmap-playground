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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/mapMoving
        // --地图的平移--
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
        const { useRef } = React
        const App = () => {
        	const xValueInput = useRef(null);
        	const yValueInput = useRef(null);
        	const centerInput = useRef(null);
        
        	const moveMap = () => {
        		let px = xValueInput.current.value;
        		let py = yValueInput.current.value;
        		map.panBy([px, py]);  // x 和 y 像素坐标。用于平移地图
        	}
        	const panMap = () => {
        		let coord = centerInput.current.value;
        		coord = coord.split(",");
        		// 平移地图至指定点
        		map.panTo(map.toLngLat([+coord[0], +coord[1]]));
        	}
        	return (
        		<div>
        			<div className="input-card w270">
        				<div className="input-item border">
        					平移像素X值：<input type="text" ref={xValueInput} defaultValue="50" placeholder="50"
        								  className="inp"/>
        				</div>
        				<div className="input-item border">
        					平移像素Y值：<input type="text" ref={yValueInput} defaultValue="100" placeholder="100"
        								  className="inp"/>
        				</div>
        				<div className="input-item">
        					<button id="moving_btn" className="btn btn-full mr0" onClick={moveMap}>平移</button>
        				</div>
        				<div className="input-item border">
        					地图中心点：
        					<input type="text" ref={centerInput} defaultValue="587562246, 3103865690"
        						   placeholder="587562246, 3103865690" className="inp"/>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0" onClick={panMap}>平移</button>
        				</div>
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