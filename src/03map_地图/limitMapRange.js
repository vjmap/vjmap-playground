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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/limitMapRange
        // --限制地图显示范围--
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
        
        // 限制的范围
        const mapClipBounds = map.getGeoBounds(0.2);
        // UI界面
        const { useState, useEffect } = React
        const App = () => {
        	const [rightTopPoint, setRightTopPoint] = useState(); // 右上角坐标
        	const [leftBtmPoint, setLeftBtmPoint] = useState(); // 左下角坐标
        	const [isLock, setIsLock] = useState(false);
        
        	const getBoundingBox = () => {
        		// 得到地图当前范围
        		let lnglatBounds = map.getBounds();
        		let nePoint = map.fromLngLat(lnglatBounds.getNorthEast());
        		let swPoint = map.fromLngLat(lnglatBounds.getSouthWest());
        		setLeftBtmPoint(nePoint.toString());
        		setRightTopPoint(swPoint.toString())
        	}
        	const lockMapBounds = () => {
        		// 先缩放至指定范围
        		let southWest = map.toLngLat(mapClipBounds.min);
        		let northEast = map.toLngLat(mapClipBounds.max);
        		let bounds = new vjmap.LngLatBounds(southWest, northEast);
        		map.fitBounds(bounds);
        		setTimeout(() => {
        			// 限制范围
        			bounds = map.setMaxBounds(map.getBounds());
        			setIsLock(true);
        			message.info("设置成功")
        		},500)
        	}
        	const unLockMapBounds = () => {
        		// 取消限制
        		map.setMaxBounds();
        		setIsLock(false);
        	}
        	useEffect(() => {
        		// 只初始化执行
        		getBoundingBox(); // 第一次时输出当时值
        		// 响应地图移动完成后事件
        		map.on('moveend', getBoundingBox);
        		return ()=> {
        			// 退出时移除事件
        			map.off('moveend', getBoundingBox);
        		}
        	}, []);
        	return (
        		<div>
        			<div className="input-card">
        				<h4>限制地图显示范围</h4>
        				<div className="input-item">
        					<button id="limit-map-btn" className={isLock ? "btn btn-active" : "btn"} onClick={lockMapBounds}>限制地图显示范围</button>
        					<button id="clear-map-btn" className={!isLock ? "btn btn-active" : "btn"} onClick={unLockMapBounds}>取消地图显示限制</button>
        				</div>
        
        			</div>
        			<div className="info">
        				<h4>当前地图显示范围</h4>
        				<p>右上角坐标：<span id="ne" className="lnglat">{rightTopPoint}</span></p>
        				<p>左下角坐标：<span id="sw" className="lnglat">{leftBtmPoint}</span></p>
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