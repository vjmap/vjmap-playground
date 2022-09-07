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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zinsertoutmapsymbol
        // --插入外部图形符号或图形--把外部图形的元素插入至当前图形中
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
        	mapid: 'sys_hello', // 地图ID
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
        	renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        // 先增加一个空GeoJSON数据源和图层至地图中，以后只要修改数据源就可以了
        const addGeojsonSourceLayerToMap = () => {
        	let sourceId = "symbol_source_" + vjmap.RandomID()
        	map.addGeoJSONSource(sourceId, {
        		type: "FeatureCollection",
        		features: []
        	});
        
        	// 填充图层
        	map.addFillLayer(sourceId + "-layer-polygons", sourceId, {
        		source: sourceId,
        		// 颜色分为两个状态，一个是选择高亮的颜色，一个是默认颜色
        		fillColor: ['case', ['to-boolean', ['feature-state', 'selected']], '#57FFC9', ['get', 'color']],
        		fillAntialias: true,
        		fillOutlineColor: ['get', 'color'],
        		fillOpacity: ["get", "alpha"],
        		filter: ['!=', ['get', 'isline'], true]
        	})
        
        	// 填充边框图层
        	map.addLineLayer(sourceId + "-layer-polygons-border", sourceId, {
        		source: sourceId,
        		lineOpacity: ["get", "alpha"],
        		// 颜色分为两个状态，一个是选择高亮的颜色，一个是默认颜色
        		lineColor:  ['case', ['to-boolean', ['feature-state', 'selected']], '#57FFC9', ['get', 'color']],
        		filter: ['!=', ['get', 'isline'], true]
        	})
        
        	// 线图层
        	map.addLineLayer(sourceId + "-layer-lines", sourceId, {
        		source: sourceId,
        		lineCap: "round",
        		lineWidth: ['get', 'lineWidth'],
        		lineOpacity: ["get", "alpha"],
        		// 颜色分为两个状态，一个是选择高亮的颜色，一个是默认颜色
        		lineColor: ['case', ['to-boolean', ['feature-state', 'selected']], '#57FFC9', ['get', 'color']],
        		filter: ['==', ['get', 'isline'], true]
        	})
        
        	// 点符号图层
        	map.addSymbolLayer(sourceId + "-layer-points", sourceId, {
        		source: sourceId,
        		iconOpacity: ["get", "alpha"],
        		// 颜色分为两个状态，一个是选择高亮的颜色，一个是默认颜色
        		iconColor: ['case', ['to-boolean', ['feature-state', 'selected']], '#57FFC9', ['get', 'color']]
        	})
        
        	let layerIds = map.layersBySource(sourceId);
        
        	// 清空高亮选择的实体
        	const clearSelected = ()=> {
        		map.removeFeatureState({
        			source: sourceId
        		})
        		// 触发一个取消点击的事件
        		map.fire(sourceId + "_click", {
        			symbolId: ""
        		})
        	}
        
        	// 对每个图层增加一个点击事件，点击的时候，能选择整个符号
        	const selectLayer = e => {
        		if (map.isInteracting()) return; // 如果地图正在交互操作，不执行
        		// 先把之前选择的清空
        		clearSelected();
        		if (!e || !e.features || e.features.length === 0) return;
        		let selFeature = e.features[0];
        		// 得到选择的的符号id
        		let symbolId = selFeature.properties.symbolId;
        		// 把所有数据源的同一符号的所有实体都设置成选择状态
        		let data = getData();
        		data.features.forEach(d => {
        			if (d.properties.symbolId === symbolId) {
        				map.setFeatureState({
        					source: selFeature.source,
        					id: d.id
        				}, {
        					selected: true
        				})
        			}
        		})
        		// 触发一个取消点击的事件, 把符号id传上
        		map.fire(sourceId + "_click", {
        			symbolId: symbolId,
        			selFeature: selFeature,
        			event: e
        		})
        	}
        	for(let layerId of layerIds) {
        		// 给每个图层加个点击事件，点击上面的元素时高亮显示
        		map.on("click", layerId, selectLayer)
        	}
        	const unSelectLayer = event => {
        		if (map.isInteracting()) return; // 如果地图正在交互操作，不执行
        		// 如果点击上面图层之外的地方，需要把之前选择高亮的实体清空
        		if (map.queryRenderedFeatures(event.point).filter(feature => feature.source === sourceId).length === 0) {
        			// 把之前选择的清空
        			clearSelected();
        		}
        	}
        	// 响应地图的事件
        	map.on("click", unSelectLayer);
        	// 修改数据源
        	const setData = (newData, isAppend = true) => {
        		// 得到原来的数据源
        		let data = getData();
        		if (isAppend) {
        			data.features = [...data.features, ...newData.features]
        		} else {
        			data.features = [...newData.features]
        		}
        		map.setData(sourceId, data);
        	}
        
        	const getData = () => {
        		return map.getSourceData(sourceId)
        	}
        	// 全部清空
        	const clear = ()=> {
        		for(let layerId of layerIds) {
        			map.off("click", layerId, selectLayer)
        		}
        		map.on("off", unSelectLayer);
        		map.removeSourceEx(sourceId)
        	}
        	return {
        		sourceId,
        		setData,
        		getData,
        		clear
        	}
        }
        let { sourceId, setData, getData} = addGeojsonSourceLayerToMap();
        
        // 查询数据 queryParam 查询条件； propData 属性数据
        let globalIndex = 0;
        const getQueryGeomData = async (queryParam, propData = {})=> {
        	let res = await svc.conditionQueryFeature({
        		fields: "",
        		includegeom: true, // 是否返回几何数据,为了性能问题，realgeom为false时，如果返回条数大于1.只会返回每个实体的外包矩形，如果条数为1的话，会返回此实体的真实geojson；realgeom为true时每条都会返回实体的geojson
        		realgeom: true,
        		limit: 10000, //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
        		...queryParam
        	})
        	const features = []
        	if (res && res.result && res.result.length > 0) {
        		for (let ent of res.result) {
        			if (ent.geom && ent.geom.geometries) {
        				let clr = map.entColorToHtmlColor(ent.color); // 实体颜色转html颜色
        				for (let g = 0; g < ent.geom.geometries.length; g++) {
        					features.push({
        						id: globalIndex++,
        						type: "Feature",
        						properties: {
        							objectid: ent.objectid + "_" + g,
        							color: clr,
        							alpha: ent.alpha / 255,
        							lineWidth: 1,
        							name: ent.name,
        							isline: ent.isline,
        							layerindex: ent.layerindex,
        							...propData // 把额外的属性数据加上
        						},
        						geometry: ent.geom.geometries[g]
        					})
        				}
        			}
        		}
        	}
        	return {
        		type: "FeatureCollection",
        		features: features
        	};
        }
        
        // 获取一个geojson的外包矩形
        const getGeoJsonBounds = (data) => {
        	let pts = []
        	vjmap.transform.convert(data, (pt) => {
        		pts.push(vjmap.geoPoint(pt));
        		return pt; // 只求范围，不做转化，返回原来的
        	});
        	let bounds = new vjmap.GeoBounds();
        	bounds.update(pts);
        	return bounds;
        }
        
        // data geojson数据；basePt基点，destPt要移动至的位置；scale 缩放倍数，angle旋转角度
        const transformGeoJsonData = (data, basePt, destPt, scale = 1.0, angle = 0.0) => {
        	return vjmap.transform.convert(data, (pt) => {
        		let point = map.fromLngLat(vjmap.geoPoint(pt));
        		point.transform(basePt, destPt, scale, angle);
        		return map.toLngLat(point) ;
        	});
        }
        
        
        const createOutSymbol = async () => {
        	let symbolMapId = "sys_symbols";
        	let symbolMapVer = "v1";
        	let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true)
        	// 获取到的数据，如果条件不变，建议加上缓存，不要每次去后台获取，这里演示就直接每次去获取了
        	let data = await getQueryGeomData({
        		mapid: symbolMapId,
        		version: symbolMapVer,
        		layer: styleName,
        		condition: 'layerindex=2', // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
        	}, {
        		symbolId: vjmap.RandomID(),
        		lineWidth: 3,
        		color: vjmap.randomColor() /*颜色可以覆盖之前的*/
        	});
        	// 获取数据范围
        	let dataBounds = getGeoJsonBounds(data);
        	//  随机放地图一个点
        	let pt = map.getGeoBounds(0.6).randomPoint();
        	let drawData = transformGeoJsonData(vjmap.cloneDeep(data), map.fromLngLat(dataBounds.center()), pt, vjmap.randInt(1, 10) / 10.0)
        	setData(drawData)
        }
        
        const interactionCreateOutSymbol = async () => {
        	message.info("请移动鼠标将要绘制的符号移动至指定位置点击进行绘制")
        	let symbolMapId = "sys_symbols";
        	let symbolMapVer = "v1";
        	let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true)
        	// 获取到的数据，如果条件不变，建议加上缓存，不要每次去后台获取，这里演示就直接每次去获取了
        	let data = await getQueryGeomData({
        		mapid: symbolMapId,
        		version: symbolMapVer,
        		layer: styleName,
        		condition: 'layerindex=1', // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
        	}, {
        		symbolId: vjmap.RandomID()
        	});
        	// 获取数据范围
        	let dataBounds = getGeoJsonBounds(data);
        	let geoDataBounds = map.fromLngLat(dataBounds);
        
        	// 设置地图正在交互
        	map.setIsInteracting(true);
        
        	let oldData = vjmap.cloneDeep(getData()); // 复制下以前的数据
        
        	// 如果取消操作
        	const cancelDraw = ()=> {
        		setData(oldData, false) ; // 先清空，用老的数据还原
        		map.setIsInteracting(false);
        	}
        	let drawDestPt = await vjmap.Draw.actionDrawPoint(map, {
        		updatecoordinate: (e) => {
        			setData(oldData, false) ; // 先清空，用老的数据还原
        			if (!e.lnglat) return;
        			const co = map.fromLngLat(e.lnglat);
        			let drawData = transformGeoJsonData(vjmap.cloneDeep(data), geoDataBounds.center(), co)
        			setData(drawData, true); // 在之前的数据上加上新的数据
        		}
        	});
        	if (drawDestPt.cancel) {
        		cancelDraw();
        		return ;// 取消操作
        	}
        	// 已经获取了要绘制到哪的目的地坐标
        	let destPt = map.fromLngLat(drawDestPt.features[0].geometry.coordinates);
        
        	// 下面获取缩放系数
        	// 可以做一条辅助线显示
        	let tempLine = new vjmap.Polyline({
        		data: map.toLngLat([destPt, destPt]),
        		lineColor: 'yellow',
        		lineWidth: 1,
        		lineDasharray:[2,2]
        	});
        	tempLine.addTo(map);
        
        	let drawScalePoint = await vjmap.Draw.actionDrawPoint(map, {
        		updatecoordinate: (e) => {
        			setData(oldData, false) ; // 先清空，用老的数据还原
        			if (!e.lnglat) return;
        			const co = map.fromLngLat(e.lnglat);
        			let dist = co.distanceTo(destPt);
        			let scale = dist / (geoDataBounds.width() / 2.0);
        			let drawData = transformGeoJsonData(vjmap.cloneDeep(data), geoDataBounds.center(), destPt, scale)
        			setData(drawData, true); // 在之前的数据上加上新的数据
        			// 修改临时线坐标
        			tempLine.setData(map.toLngLat([destPt, co]))
        		}
        	});
        
        	if (drawScalePoint.cancel) {
        		cancelDraw();
        		tempLine.remove(); // 绘制完成，删除
        		return ;// 取消操作
        	}
        	// 已经获取了缩放系数
        	let scalePt = map.fromLngLat(drawScalePoint.features[0].geometry.coordinates);
        	let dist = scalePt.distanceTo(destPt);
        	let scale = dist / (geoDataBounds.width() / 2.0);
        	if (scale < 0.0001) scale = 0.1;
        
        	tempLine.setData(map.toLngLat([destPt, destPt]))
        	// 下面获取旋转系数
        	let drawRotatePoint = await vjmap.Draw.actionDrawPoint(map, {
        		updatecoordinate: (e) => {
        			setData(oldData, false) ; // 先清空，用老的数据还原
        			if (!e.lnglat) return;
        			const co = map.fromLngLat(e.lnglat);
        			let angle = co.angleTo(destPt) * 180.0 / Math.PI;
        			let drawData = transformGeoJsonData(vjmap.cloneDeep(data), geoDataBounds.center(), destPt, scale, angle)
        			setData(drawData, true); // 在之前的数据上加上新的数据
        			// 修改临时线坐标
        			tempLine.setData(map.toLngLat([destPt, co]))
        		}
        	});
        	tempLine.remove(); // 绘制完成，删除
        	if (drawRotatePoint.cancel) {
        		cancelDraw();
        		return ;// 取消操作
        	}
        	map.setIsInteracting(false);
        }
        
        let hasInsertOutMap;
        const insertOutMap = async () => {
        	if (hasInsertOutMap) return ;// 已经加载过了，不要重复加载了
        	hasInsertOutMap = true;
        	let symbolMapId = "sys_hello";
        	let symbolMapVer = "v1";
        	let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true)
        	// 获取到的数据，如果条件不变，建议加上缓存，不要每次去后台获取，这里演示就直接每次去获取了
        
        	// 允许10级别下面一个像素的误差 对查询返回的GeoJSON几何数据简化墨托卡距离，默认为零，不简化。例如允许10级别以上一个像素级别的误差
        	let tol = map.pixelToGeoLength(1, 10);
        	tol = vjmap.Projection.EQUATORIAL_SEMIPERIMETER * 2 * tol / prj.getMapExtent().width()
        
        	let data = await getQueryGeomData({
        		mapid: symbolMapId,
        		version: symbolMapVer,
        		layer: styleName,
        		condition: '', // 不写条件，表示获取所有的 ；只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
        		simplifyTolerance: tol , // 可以不填容差，这样不会对数据进行简化，数据量会大，但是绘制的精确
        	}, {
        		symbolId: vjmap.RandomID()
        	});
        	// 获取数据范围
        	let dataBounds = getGeoJsonBounds(data);
        	//  默认放地图中心点吧
        	let pt = map.fromLngLat(map.getCenter());
        	// 缩放成0.8倍
        	let drawData = transformGeoJsonData(vjmap.cloneDeep(data), map.fromLngLat(dataBounds.center()), pt, 0.8)
        	setData(drawData)
        }
        
        // 响应上面抛出的图层点击事件，做UI提示
        map.on(sourceId + "_click",  e=> {
        	if (e.symbolId) {
        		message.info("点击了符号:" + e.symbolId)
        	}
        });
        // UI界面
        const App = () => {
        	return (
        		<div className="input-card">
        			<h4>插入外部图形符号</h4>
        			<div className="input-item">
        				<button className="btn" onClick={ () => createOutSymbol() }>直接创建外部图形符号</button>
        				<button className="btn" onClick={ () => interactionCreateOutSymbol() }>交互式创建外部图形符号</button>
        				<button className="btn" onClick={ () => insertOutMap() }>插入外部图形</button>
        			</div>
        		</div>
        	);
        }
        
        ReactDOM.render(<App/>, document.getElementById('ui'));
        
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