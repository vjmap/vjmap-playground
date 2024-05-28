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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zgmodifymap
        // --在线编辑图形[不改变原图]--基于现在的图形，在上面进行修改或新增删除，不会对原DWG图进行修改，只会通过修改样式来对前端显示进行修改，效率高
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
        	mapid: env.exampleMapId,
        	mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
        	style: {
        		name: "myCustomStyle",
        		backcolor: 0
        	}
        })
        if (res.error) {
        	message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
        	container: 'map', // container ID
        	style: svc.rasterStyle(), //
        	center: prj.toLngLat(center),
        	zoom: 2,
        	renderWorldCopies: false
        });
        map.attach(svc, prj);
        await map.onLoad();
        
        let draw = map.getDrawLayer();
        
        
        // 需要不可见的实体id数组
        const hideObjectIds = new Set();
        
        // 更改样式
        let expression = "" ;// 表达式数组
        let curStyle = {};
        const updateStyle = (style) => {
        	curStyle = {
        		backcolor: 0,
        		expression: expression,
        		...style
        	}
        	map.updateStyle(svc, {
        		name: "myCustomStyle_temp", // 临时样式图层，用来临时修改，保持的时候，会把此样式的数据复制到myCustomStyle 样式
        		...curStyle
        	})
        }
        
        
        // 修改是否显示
        const modifyVisible = (visible) => {
        	let result = "";
        	if (visible !== undefined) {
        		result += `gOutVisible:=${visible ? 1 : 0};`;
        	}
        	return result;
        }
        
        // 增加实体对象id判断条件,只要满足任何一种类型即可,如 ['283','285']
        const conditionObjectIds = objectIds => {
        	if (!Array.isArray(objectIds)) objectIds = [objectIds];// 先转成数组，再统一用数组去算吧
        	let strObjectIds = objectIds.join("||");
        	return `gInObjectId  in  '${strObjectIds}'`
        }
        
        
        const setObjectsVisible = async () => {
        	// objectId
        	if (hideObjectIds.size == 0) {
        		expression = '';
        		await updateStyle();
        	} else {
        		let condition = conditionObjectIds(Array.from(hideObjectIds));
        		let value1 = modifyVisible(false); // 0级以上都不可见
        		expression = `if(${condition}) {${value1} } `;
        		await updateStyle();
        	}
        }
        
        let styles = svc.currentMapParam().styles;
        let mapStyle = styles.find(style => style.name == "myCustomStyle");
        if (mapStyle) {
        	let expr = mapStyle.expression; // 获取之前的表达式
        	// 找出之前样式中隐藏的实体id数组
        	expr = expr.replace("if(gInObjectId  in  '", "");
        	expr = expr.replace("') {gOutVisible:=0; }", "");
        	expr.split("||").forEach(id => hideObjectIds.add(id));
        	await setObjectsVisible();
        }
        
        // 选择实体
        const selectFeatures = async (entityTypes) => {
        	// 在地图上拾取点
        	let drawPoint = await vjmap.Draw.actionDrawPoint(map, {
        		contextMenu: (e) => {
        			// 给地图发送Enter键消息即可取消，模拟按Enter键
        			map.fire("keyup", {keyCode:13})
        		}
        	});
        	if (drawPoint.cancel) {
        		return;
        	}
        	let co = map.fromLngLat(drawPoint.features[0].geometry.coordinates);
        	let svc = map.getService();
        	let query = await svc.pointQueryFeature({
        		zoom: map.getZoom(),
        		x: co.x,
        		y: co.y,
        		condition: entityTypes ? entityTypes.map(e => `name=${e}`).join(' or ') : undefined,
        		limit: 1
        	});
        	if (!(query.result &&  query.result.length > 0)) {
        		message.error("没查找到合适的实体")
        		return;
        	}
        
        	return query.result[0];
        }
        
        
        // 创建一个几何对象
        let globalIndex = 0;
        const createGeomData = async (entities = [], docMapBounds = null, environment = null, linetypes = null, dbFrom = null)=> {
        	let doc = new vjmap.DbDocument();
        	if (environment) {
        		doc.environment = environment;// 文档环境
        	}
        	if (linetypes) {
        		doc.linetypes = linetypes;// 线型定义
        	}
        	let param = map.getService().currentMapParam();
        	if (!docMapBounds) {
        		// 如果文档范围为空，则使用当前地图
        		if (!dbFrom) {
        			doc.from = `${param.mapid}/${param.version}`; // 从当前图
        		} else {
        			doc.from = `${dbFrom.mapid}/${dbFrom.version}`; // 从指定的图
        		}
        		doc.pickEntitys = entities.map(e => e.objectid);
        	}
        	doc.appendEntity(entities);
        
        	let res = await svc.cmdCreateEntitiesGeomData({
        		filedoc: JSON.stringify(doc),
        		mapBounds: docMapBounds ? docMapBounds : param.bounds.toArray() // 如果没有输入文档范围，则使用当前地图的范围
        	})
        	const features = []
        	if (res && res.result && res.result.length > 0) {
        		for (let ent of res.result) {
        			if (ent.geom && ent.geom.geometries) {
        				let clr = map.entColorToHtmlColor(ent.color); // 实体颜色转html颜色
        				for (let g = 0; g < ent.geom.geometries.length; g++) {
        					let featureAttr = {};
        					// 因为要组合成一个组合实体，所以线和多边形的颜色得区分
        					if (ent.isPolygon) {
        						featureAttr.fillColor = clr; // 填充色，只对多边形有效
        						featureAttr.noneOutline = true; // 不显示多边形边框，只对多边形有效
        					} else {
        						featureAttr.color = clr; // 颜色
        						featureAttr.line_width = ent.lineWidth; // 线宽
        					}
        					features.push({
        						id: globalIndex++,
        						type: "Feature",
        						properties: {
        							objectid: ent.objectid + "_" + g,
        							opacity: ent.alpha / 255,
        							...featureAttr
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
        
        // 增加绘图对象，并组合成一个实体
        const addFeatures = (data, drawLayer) => {
        	let addFeatureIds = []
        	data.features.forEach(feature => {
        		addFeatureIds.push(...drawLayer.add(feature));
        	});
        	// 先选中此实体
        	drawLayer.changeMode("simple_select", {featureIds: addFeatureIds});
        	// 然后组合成一个
        	drawLayer.combineFeatures();
        	return addFeatureIds.length
        }
        
        // 选择文字修改内容
        const modifyTextContent = async () => {
        	// 查询所有文字(包括单行文本，多行文本) 具体类型数字参考文档"服务端条件查询和表达式查询-支持的cad实体类型"
        	let result = await selectFeatures(["12", "13"]);
        	if (!result) return;
        	let content = prompt("请输入要修改的文字内容",result.text);
        	if (content == "") return ;// 没有改变
        
        	let dbEnt;
        	if (result.name == "AcDbText") {
        		dbEnt = new vjmap.DbText()
        		dbEnt.text = content;
        		dbEnt.objectid = result.objectid;
        	} else if (result.name == "AcDbMText") {
        		dbEnt = new vjmap.DbMText()
        		dbEnt.contents = content;
        		dbEnt.objectid = result.objectid;
        	}
        
        	if (dbEnt) {
        		let data = await createGeomData([dbEnt]);
        		if (addFeatures(data, draw) > 0 ) {
        			// 把选择的隐藏了
        			hideObjectIds.add(result.objectid);
        			await setObjectsVisible();
        		}
        	}
        
        }
        
        // 选择线段修改颜色
        const modifyLineCoordinate = async () => {
        	// 查询所有线段
        	let result = await selectFeatures(["1","2", "3", "4", "5"]);
        	if (!result) return;
        
        	let dbEnt;
        	if (result.name == "AcDbPolyline" || result.name == "AcDb2dPolyline" || result.name == "AcDb3dPolyline") {
        		dbEnt = {};
        		dbEnt.objectid = result.objectid; // 表示要修改此实体
        		dbEnt.color = map.htmlColorToEntColor(vjmap.randomColor());
        		// 如果要修改坐标，请用下面的代码，此示例演示还是用以前的坐标数据
        		dbEnt.points = result.points.split(";").map(p => {
        			let pt = p.split(",");
        			return [+pt[0], +pt[1]];
        		});
        
        	} else if (result.name == "AcDbLine") {
        		dbEnt = new vjmap.DbLine();
        		dbEnt.objectid = result.objectid; // 表示要修改此实体
        		dbEnt.color = map.htmlColorToEntColor(vjmap.randomColor());
        		// 如果要修改坐标，请用下面的代码，此示例演示还是用以前的坐标数据
        		let points = result.points.split(";").map(p => {
        			let pt = p.split(",");
        			return [+pt[0], +pt[1]];
        		});
        		dbEnt.start  = points[0];
        		dbEnt.end = points[1];
        	} else if (result.name == "AcDbSpline") {
        		dbEnt = new vjmap.DbSpline();
        		dbEnt.objectid = result.objectid; // 表示要修改此实体
        		dbEnt.color = map.htmlColorToEntColor(vjmap.randomColor());
        		// 如果要修改坐标，请用下面的代码，此示例演示还是用以前的坐标数据
        		let points = result.points.split(";").map(p => {
        			let pt = p.split(",");
        			return [+pt[0], +pt[1]];
        		});
        		if (result.isFit == 1) {
        			// 拟合点
        			dbEnt.fitPoints = points;
        		} else {
        			// 控制点
        			dbEnt.controlPoints = points;
        		}
        	}
        
        	if (dbEnt) {
        		let data = await createGeomData([dbEnt]);
        		if (addFeatures(data, draw) > 0 ) {
        			// 把选择的隐藏了
        			hideObjectIds.add(result.objectid);
        			await setObjectsVisible();
        		}
        	}
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
        
        // 交互式创建箭头
        const createArrow = async () => {
        	let linetype = new vjmap.DbLineType();
        	linetype.name = "my_arrow_dash";
        	linetype.comments = "虚线";
        
        	linetype.style = [
        		{
        			"method": "numDashes",  //组成线型的笔画数目
        			"parameter": 4
        		},
        		{
        			"method": "patternLength",// 线型总长度
        			"parameter": 1.0
        		},
        		{
        			"method": "dashLengthAt", //0.5个单位的划线
        			"parameter": [0, 0.5]
        		},
        		{
        			"method": "dashLengthAt",//0.25个单位的空格
        			"parameter": [1, -0.2]
        		},
        		{
        			"method": "dashLengthAt",//0.1个单位的划线 (如果是一个点的话，则输入0即可）
        			"parameter": [2, 0.1]
        		},
        		{
        			"method": "dashLengthAt",//0.25个单位的空格
        			"parameter": [3, -0.2]
        		}
        	]
        	let entities = [];
        	let docBounds = [0, -100, 200, 100];// 文档坐标范围，可以根据需要自己定。保证下面绘制的实体在此范围内
        	let points = [[10, 60], [150, 20], [140, 40], [190, 0], [140, -40], [150, -20], [10, -40], [10, 60]];
        	let polyline = new vjmap.DbPolyline();
        	polyline.lineWidth = 50;
        	polyline.points = points;
        	polyline.linetype = "my_arrow_dash";//线型名称是上面定义的
        	polyline.linetypeScale = 30; // 线型比例放大30倍
        	polyline.color = map.htmlColorToEntColor(vjmap.randomColor());
        
        	let fillColor = vjmap.randomColor();
        	let hatch = new vjmap.DbHatch();
        	hatch.pattern = "SOLID";
        	hatch.color = map.htmlColorToEntColor(fillColor);
        	hatch.points = points;
        	hatch.alpha = 100;
        
        	let text = new vjmap.DbText({
        		position: [100, 70],
        		contents: "箭头",
        		color: map.htmlColorToEntColor(fillColor),
        		horizontalMode: 4,
        		height: 20
        	});
        
        	entities.push(polyline, hatch, text);
        	let linetypes = [linetype] ; //要创建的线型
        	let tempDraw = map.createDrawLayer() ;// 创建一个临时的绘图图层
        
        	// 取消操作
        	const cancelDraw = ()=> {
        		if (tempDraw) map.removeDrawLayer(tempDraw); // 把临时图层删除了
        		map.setIsInteracting(false);
        	}
        
        	try {
        		let data = await createGeomData(entities, docBounds, { "LWDISPLAY": true}, linetypes); // 显示线宽
        
        		// 获取数据范围
        		let dataBounds = getGeoJsonBounds(data);
        		//  先获取地图的中心点
        		let basePt = map.fromLngLat(map.getCenter());
        		// 要生成的像素大小
        		let length = map.pixelToGeoLength(100, map.getZoom());
        		let dataGeoBounds = map.fromLngLat(dataBounds);
        		let scalex = length / dataGeoBounds.width(); // 缩放的比例
        		let scaley = length / dataGeoBounds.height(); // 缩放的比例
        		let dblScale = Math.min(scalex, scaley);
        		let drawData = transformGeoJsonData(vjmap.cloneDeep(data), map.fromLngLat(dataBounds.center()), basePt, dblScale);
        		let geoDataBounds = map.fromLngLat(getGeoJsonBounds(drawData)); // 获取当前绘制的数据几何范围
        		let geoCenter = geoDataBounds.center(); // 获取当前绘制的数据几何中心点
        		// 把数据增加至临时绘图层
        		addFeatures(drawData, tempDraw);
        
        		message.info("请移动鼠标将要绘制的符号移动至指定位置点击进行绘制")
        
        		// 设置地图正在交互
        		map.setIsInteracting(true);
        
        		let oldData = vjmap.cloneDeep(tempDraw.getAll()); // 复制下以前的数据
        
        
        		let drawDestPt = await vjmap.Draw.actionDrawPoint(map, {
        			updatecoordinate: (e) => {
        				if (!e.lnglat) return;
        				tempDraw.deleteAll();
        				const co = map.fromLngLat(e.lnglat);
        				let drawData = transformGeoJsonData(vjmap.cloneDeep(oldData), geoCenter, co);
        				tempDraw.set(drawData); // 设置成新的数据
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
        				tempDraw.deleteAll();
        				if (!e.lnglat) return;
        				const co = map.fromLngLat(e.lnglat);
        				let dist = co.distanceTo(destPt);
        				let scale = dist / (geoDataBounds.width() / 2.0);
        				let drawData = transformGeoJsonData(vjmap.cloneDeep(oldData), geoCenter, destPt, scale)
        				tempDraw.set(drawData); // 设置成新的数据
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
        				tempDraw.deleteAll();
        				if (!e.lnglat) return;
        				const co = map.fromLngLat(e.lnglat);
        				let angle = co.angleTo(destPt) * 180.0 / Math.PI;
        				let drawData = transformGeoJsonData(vjmap.cloneDeep(oldData), geoDataBounds.center(), destPt, scale, angle)
        				tempDraw.set(drawData); // 设置成新的数据
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
        
        		// 把临时绘图层的数据加至当前地图绘制图层中
        		let drawFeatures = tempDraw.getAll();
        		map.removeDrawLayer(tempDraw);
        		draw.add(drawFeatures) ;// 加至地图当前绘制的图层中
        	} catch (e) {
        		cancelDraw();
        	}
        
        }
        
        // 创建有线型的线段
        const createLineTypePolyline = async () => {
        	// 先交互式绘制线段
        	let drawLine = await vjmap.Draw.actionDrawLineSting(map);
        	if (drawLine.cancel) {
        		return; // 取消了
        	}
        	let coordinate = map.fromLngLat(drawLine.features[0].geometry.coordinates);
        	let dbEnt = new vjmap.DbPolyline();
        	dbEnt.objectid = '40D'; // 表示要修改此实体 sys_symbols图中的objectid
        	dbEnt.color = vjmap.htmlColorToEntColor(vjmap.randomColor());
        	dbEnt.linetypeScale = 100; // 填充比例
        	// 如果要修改坐标，请用下面的代码，此示例演示还是用以前的坐标数据
        	dbEnt.points = coordinate.map(p => {
        		return [p.x, p.y];
        	});
        
        	if (dbEnt) {
        		let data = await createGeomData([dbEnt], null, null, null, {
        			mapid: 'sys_symbols', // 上面的要修改的实体，来源于此图id
        			version: 'v1'
        		});
        		addFeatures(data, draw);
        	}
        };
        
        const throttle = (method,delay,duration) => {
        	let timer=null;
        	let begin=new Date();
        	return function(){
        		let context=this, args=arguments;
        		let current=new Date();
        		clearTimeout(timer);
        		if(current-begin>=duration){
        			method.apply(context,args);
        			begin=current;
        		}else{
        			timer=setTimeout(function(){
        				method.apply(context,args);
        			},delay);
        		}
        	}
        }
        
        const createLineTypeCurve = async () => {
        	// 先交互式绘制线段
        	let color = vjmap.htmlColorToEntColor(vjmap.randomColor());
        	const createCurve = async (coordinate, color) => {
        		let dbEnt = {}; // 也可以直接赋属性也行不要new对象,只不过没有参数提示了
        		dbEnt.objectid = '40E'; // 表示要修改此实体 sys_symbols图中的objectid
        		dbEnt.color = color;
        		dbEnt.linetypeScale = 100; // 线型比例
        		// 如果要修改坐标，请用下面的代码，此示例演示还是用以前的坐标数据
        		dbEnt.fitPoints = coordinate.map(p => {
        			return [p.x, p.y];
        		}); // 拟合点 用fitPoints; 控制点 用 controlPoints
        
        		if (dbEnt) {
        			return await createGeomData([dbEnt], null, null, null, {
        				mapid: 'sys_symbols',// 上面的要修改的实体，来源于此图id
        				version: 'v1'
        			});
        		}
        	}
        
        	let tempDraw = map.createDrawLayer() ;// 创建一个临时的绘图图层
        	let drawLine = await vjmap.Draw.actionDrawLineSting(map, {
        			updatecoordinate: throttle(async (e) => {
        				let coordinate = map.fromLngLat(e.feature.coordinates);
        				let data = await createCurve(coordinate, color);
        				if (tempDraw) tempDraw.set(data);
        			}, 200, 300)
        		}
        	);
        	map.removeDrawLayer(tempDraw); // 把临时图层删除了
        	tempDraw = null;
        	if (drawLine.cancel) {
        		return; // 取消了
        	}
        	let coordinate = map.fromLngLat(drawLine.features[0].geometry.coordinates);
        	let data = await createCurve(coordinate, color);
        	if (data) {
        		addFeatures(data, draw);
        	}
        };
        
        const createHatch = async () => {
        	let drawPolygon = await vjmap.Draw.actionDrawPolygon(map);
        	if (drawPolygon.cancel) {
        		return; // 取消了
        	}
        	let coordinate = map.fromLngLat(drawPolygon.features[0].geometry.coordinates[0]);
        	let dbEnt = new vjmap.DbHatch();
        	dbEnt.objectid = '42F'; // 表示要修改此实体 sys_symbols图中的objectid
        	dbEnt.color = vjmap.htmlColorToEntColor(vjmap.randomColor());
        	dbEnt.patternScale = 400; // 填充比例
        	// 如果要修改坐标，请用下面的代码，此示例演示还是用以前的坐标数据
        	dbEnt.points = coordinate.map(p => {
        		return [p.x, p.y];
        	});
        
        	if (dbEnt) {
        		let data = await createGeomData([dbEnt], null, null, null, {
        			mapid: 'sys_symbols',// 上面的要修改的实体，来源于此图id
        			version: 'v1'
        		});
        		addFeatures(data, draw);
        	}
        }
        
        // 选择实体进行删除
        const selectDelete = async () => {
        	let result = await selectFeatures();
        	if (!result) return;
        	// 把选择的隐藏了
        	hideObjectIds.add(result.objectid);
        	await setObjectsVisible();
        }
        
        // 编辑模式
        const switchEditMode = () => {
        	draw.changeMode("simple_select")
        }
        
        // 浏览模式
        const switchBrowerMode = () => {
        	draw.changeMode('static');
        }
        
        // 还原成默认数据
        const resetData = () => {
        	// 先把隐藏的全部可见
        	hideObjectIds.clear();
        	setObjectsVisible();
        	// 把前端绘制的清空了
        	draw.deleteAll();
        }
        
        // 保存数据
        const saveData = async ()=> {
        	let svc = map.getService();
        	let curParam = svc.currentMapParam() || {};
        	await map.updateStyle(svc, {
        		name: "myCustomStyle", // 保持的时候，把临时图层样式数据复制到myCustomStyle 样式
        		...curStyle
        	})
        	let entsJson = draw.getAll();
        	// 转成地理坐标
        	entsJson = map.fromLngLat(entsJson);
        
        	// 用地图的mapid和版本号做为key值，把数据保存起来，这里演示只是做数据保存到了唯台后台,实际中请保存至自己的后台数据库中
        	let key = `map_custom_style_drawdata_${curParam.mapid}_${curParam.version}`;
        	await svc.saveCustomData(key, entsJson);
        	message.info('保存成功')
        }
        
        
        // 加载数据
        const loadData = async ()=> {
        	let svc = map.getService();
        	// 用地图的mapid和版本号做为key值, 这里演示只是从localStorage去加载,实际中请从后台去请求数据加载
        	let curParam = svc.currentMapParam() || {};
        	let key = `map_custom_style_drawdata_${curParam.mapid}_${curParam.version}`;
        	let res = await svc.getCustomData(key);
        	if (res.data) {
        		draw.set(map.toLngLat(res.data));
        	}
        }
        loadData() ;// 一开始上来就加载原来的数据
        
        // 与绘图有关的更多操作请参考 https://vjmap.com/demo/#/demo/map/draw/02drawCustomToolbar
        // UI界面
        const App = () => {
        	return (
        		<div>
        			<div className="info" style={{width: "185px", right: "10px"}}>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => modifyTextContent()}>选择文字修改内容
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => modifyLineCoordinate()}>选择线段修改颜色
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => createArrow()}>交互式创建箭头
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => createLineTypePolyline()}>创建有线型的线段
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => createLineTypeCurve()}>创建有线型的曲线
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => createHatch()}>创建填充符号区域
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => selectDelete()}>选择实体进行删除
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => switchEditMode() }>编辑模式
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => switchBrowerMode()}>浏览模式
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => resetData()}>还原成默认数据
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => saveData()}>保持修改后的数据
        					</button>
        				</div>
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