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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/setMapVisibleBounds
        // --只显示地图的某个区域--
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
        	mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
        	mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
        	style: vjmap.openMapDarkStyle()
        })
        
        if (res.error) {
        	// 如果打开出错
        	message.error(res.error)
        }
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let rasterStyle = svc.rasterStyle();
        // 先把图层设置成隐藏
        let rasterLayer = rasterStyle.layers[0];
        rasterLayer.layout.visibility = "none";
        let map = new vjmap.Map({
        	container: 'map', // DIV容器ID
        	style: rasterStyle, // 样式，这里是栅格样式
        	center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
        	zoom: 2, // 设置地图缩放级别
        	renderWorldCopies: false // 不显示多屏地图
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        
        map.enableLayerClickHighlight(svc, e => {
        	if (!e) return;
        })
        
        const showVisibleBounds = (bounds, curBackColor = "#022B4F") => {
        	let holePolygon = []
        	let mapBounds = map.getGeoBounds(1);
        	const maskPath = [];
        	maskPath.push([mapBounds.min.x, mapBounds.min.y]);
        	maskPath.push([mapBounds.max.x, mapBounds.min.y]);
        	maskPath.push([mapBounds.max.x, mapBounds.max.y]);
        	maskPath.push([mapBounds.min.x, mapBounds.max.y]);
        	holePolygon.push(maskPath)
        
        	holePolygon.push(...bounds)
        
        
        	let polygon = new vjmap.Polygon({
        		data: map.toLngLat(holePolygon),
        		fillColor: curBackColor,
        		fillOpacity: 1,
        		fillOutlineColor: curBackColor,
        		isHoverPointer: false,
        		isHoverFeatureState: false
        	});
        	polygon.addTo(map);
        
        	return polygon;
        }
        
        let mapBounds2 = map.getGeoBounds(0.2);
        const points = mapBounds2.toPointArray();
        const w = mapBounds2.width() / 1.5;
        // 里面根据四个顶点，生成四个小的矩形，用于生成四个小孔
        let holePolygon = []
        for(let p of points) {
        	const path = [];
        	path.push(...vjmap.GeoBounds.fromCenterWH(p, w).toPointArray());
        	holePolygon.push(path)
        }
        let maskPolygon = showVisibleBounds(holePolygon)
        
        setTimeout(() => {
        	// 再把图层打开
        	map.show(rasterLayer.id);
        	// 或者用以下代码，效果一样
        	//map.setLayoutProperty(rasterLayer.id, "visibility", "visible");
        	// 如果有点击高亮的话，需要把遮盖图层放至图层上面
        	map.moveLayer(maskPolygon.getLayerId())
        }, 500)
        
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