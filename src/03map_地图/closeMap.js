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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/closeMap
        // --销毁地图对象--
        // 切换地图可以参考以下两个示例
        // https://vjmap.com/demo/#/demo/map/service/14switchMap
        // https://vjmap.com/demo/#/demo/map/service/14switchMapNew
        
        /**
         * 创建地图对象
         * @param serviceUrl 服务地址接口
         * @param mapId 地图ID
         * @param mapOpenWay 打开方式，缺省vjmap.MapOpenWay.GeomRender
         * @param isRaster true为栅格，false为矢量
         * @return {Promise<Map>}
         */
        async function newMap(serviceUrl, mapId, mapOpenWay = vjmap.MapOpenWay.GeomRender, isRaster = true) {
        	// 地图服务对象
        	let svc = new vjmap.Service(serviceUrl, env.accessToken)
        	// 打开地图
        	let res = await svc.openMap({
        		mapid: env.exampleMapId, // 地图ID
        		mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            	style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        	})
        	if (res.error) {
        		// 如果打开出错
        		throw Error(res.error)
        	}
        	// 获取地图范围
        	let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        	// 根据地图范围建立几何投影坐标系
        	let prj = new vjmap.GeoProjection(mapExtent);
        
        	// 如果为内存方式打开，则只能为栅格方式
        	if (mapOpenWay === vjmap.MapOpenWay.Memory) {
        		isRaster = true;
        	}
        	// 地图样式
        	let style = isRaster ? svc.rasterStyle() :	svc.vectorStyle();
        	// 地图对象
        	let map = new vjmap.Map({
        		container: 'map', // DIV容器ID
        		style: style, // 样式，这里是栅格样式
        		center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
        		zoom: 2, // 设置地图缩放级别
        		renderWorldCopies: false // 不显示多屏地图
        	});
        
        	// 关联服务对象和投影对象
        	map.attach(svc, prj);
        	// 根据地图本身范围缩放地图至全图显示
        	map.fitMapBounds();
        
        	// 导航条控件
        	map.addControl(new vjmap.NavigationControl());
        	// 鼠标移动显示坐标位置控件
        	map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        	// 使地图能选择点击拾取高亮
        	if (isRaster) {
        		map.enableLayerClickHighlight(svc, e => {
        			if (!e) return;
        			let content = `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`
        			e && message.info({ content, key: "info", duration: 5});
        		})
        	} else {
        		// 有高亮状态（鼠标在地图元素上时，会高亮)
        		map.enableVectorLayerHoverHighlight((event, feature, layer) => {
        			if (!feature) return;
        			// 点击高亮实体回调事件
        			let content = `event: ${event}; feature: ${feature.id}; layer: ${layer}`
        			message.info({ content, key: "info", duration: 5});
        		})
        	}
        
        	// 地图加载完成事件
        	map.on("load",function(){
        		message.info("地图创建成功！");
        	});
        	return map;
        }
        
        // 创建栅格地图
        let map = await newMap(env.serviceUrl, env.exampleMapId, vjmap.MapOpenWay.GeomRender, true)
        // UI界面
        const { useState } = React;
        const App = () => {
        	const [isCreate, setIsCreate] = useState(true);
        	/*
        	* 创建新地图
        	*/
        	const createMap = async e => {
        		if(map){
        			message.info("地图已创建，请先销毁地图！");
        			return;
        		}
        		map = await newMap(env.serviceUrl, env.exampleMapId, vjmap.MapOpenWay.GeomRender, false)
        		message.info("地图矢量创建成功！");
        		setIsCreate(true);
        	}
        	/*
        	* 销毁新地图对象
        	*/
        	const closeMap = () => {
        		map && map.remove();
        		message.info("地图已销毁");
        		map = null;
        		setIsCreate(false);
        	}
        	return (
        		<div className="input-card">
        			<h4>创建、销毁地图</h4>
        			<div id="btns">
        				<div className="input-item">
        					<button id="create-btn" className={isCreate ? "btn btn-active" : "btn"} onClick={createMap}>创建地图</button>
        					<button id="destroy-btn" className={!isCreate ? "btn btn-active" : "btn"} onClick={closeMap}>销毁地图</button>
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