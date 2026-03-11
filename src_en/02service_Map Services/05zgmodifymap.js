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
        // --Online edit graphic [original unchanged]--Modify/add/delete on current graphic; no change to source DWG; only style updates for display
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
        	mapid: env.exampleMapId,
        	mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
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
        
        
        const hideObjectIds = new Set();
        
        let expression = "";
        let curStyle = {};
        const updateStyle = (style) => {
        	curStyle = {
        		backcolor: 0,
        		expression: expression,
        		...style
        	}
        	map.updateStyle(svc, {
        		name: "myCustomStyle_temp", // Temp style for edits; on save, copy to myCustomStyle
        		...curStyle
        	})
        }
        
        
        const modifyVisible = (visible) => {
        	let result = "";
        	if (visible !== undefined) {
        		result += `gOutVisible:=${visible ? 1 : 0};`;
        	}
        	return result;
        }
        
        // Entity objectid condition; match any of given types e.g. ['283','285']
        const conditionObjectIds = objectIds => {
        	if (!Array.isArray(objectIds)) objectIds = [objectIds];
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
        		let value1 = modifyVisible(false);
        		expression = `if(${condition}) {${value1} } `;
        		await updateStyle();
        	}
        }
        
        let styles = svc.currentMapParam().styles;
        let mapStyle = styles.find(style => style.name == "myCustomStyle");
        if (mapStyle) {
        	let expr = mapStyle.expression;
        	expr = expr.replace("if(gInObjectId  in  '", "");
        	expr = expr.replace("') {gOutVisible:=0; }", "");
        	expr.split("||").forEach(id => hideObjectIds.add(id));
        	await setObjectsVisible();
        }
        
        // Select entity
        const selectFeatures = async (entityTypes) => {
        	let drawPoint = await vjmap.Draw.actionDrawPoint(map, {
        		contextMenu: (e) => {
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
        		message.error("No matching entity found")
        		return;
        	}
        
        	return query.result[0];
        }
        
        
        let globalIndex = 0;
        const createGeomData = async (entities = [], docMapBounds = null, environment = null, linetypes = null, dbFrom = null)=> {
        	let doc = new vjmap.DbDocument();
        	if (environment) {
        		doc.environment = environment;
        	}
        	if (linetypes) {
        		doc.linetypes = linetypes;
        	}
        	let param = map.getService().currentMapParam();
        	if (!docMapBounds) {
        		if (!dbFrom) {
        			doc.from = `${param.mapid}/${param.version}`;
        		} else {
        			doc.from = `${dbFrom.mapid}/${dbFrom.version}`;
        		}
        		doc.pickEntitys = entities.map(e => e.objectid);
        	}
        	doc.appendEntity(entities);
        
        	let res = await svc.cmdCreateEntitiesGeomData({
        		filedoc: JSON.stringify(doc),
        		mapBounds: docMapBounds ? docMapBounds : param.bounds.toArray()
        	})
        	const features = []
        	if (res && res.result && res.result.length > 0) {
        		for (let ent of res.result) {
        			if (ent.geom && ent.geom.geometries) {
        				let clr = map.entColorToHtmlColor(ent.color);
        				for (let g = 0; g < ent.geom.geometries.length; g++) {
        					let featureAttr = {};
        					if (ent.isPolygon) {
        						featureAttr.fillColor = clr;
        						featureAttr.noneOutline = true;
        					} else {
        						featureAttr.color = clr;
        						featureAttr.line_width = ent.lineWidth;
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
        
        // Add draw features and combine into one entity
        const addFeatures = (data, drawLayer) => {
        	let addFeatureIds = []
        	data.features.forEach(feature => {
        		addFeatureIds.push(...drawLayer.add(feature));
        	});
        	drawLayer.changeMode("simple_select", {featureIds: addFeatureIds});
        	drawLayer.combineFeatures();
        	return addFeatureIds.length
        }
        
        // Select text and modify content
        const modifyTextContent = async () => {
        	let result = await selectFeatures(["12", "13"]);
        	if (!result) return;
        	let content = prompt("Enter text to modify", result.text);
        	if (content == "") return;
        
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
        			hideObjectIds.add(result.objectid);
        			await setObjectsVisible();
        		}
        	}
        
        }
        
        // Select line and modify color
        const modifyLineCoordinate = async () => {
        	let result = await selectFeatures(["1","2", "3", "4", "5"]);
        	if (!result) return;
        
        	let dbEnt;
        	if (result.name == "AcDbPolyline" || result.name == "AcDb2dPolyline" || result.name == "AcDb3dPolyline") {
        		dbEnt = {};
        		dbEnt.objectid = result.objectid;
        		dbEnt.color = map.htmlColorToEntColor(vjmap.randomColor());
        		dbEnt.points = result.points.split(";").map(p => {
        			let pt = p.split(",");
        			return [+pt[0], +pt[1]];
        		});
        
        	} else if (result.name == "AcDbLine") {
        		dbEnt = new vjmap.DbLine();
        		dbEnt.objectid = result.objectid;
        		dbEnt.color = map.htmlColorToEntColor(vjmap.randomColor());
        		let points = result.points.split(";").map(p => {
        			let pt = p.split(",");
        			return [+pt[0], +pt[1]];
        		});
        		dbEnt.start  = points[0];
        		dbEnt.end = points[1];
        	} else if (result.name == "AcDbSpline") {
        		dbEnt = new vjmap.DbSpline();
        		dbEnt.objectid = result.objectid;
        		dbEnt.color = map.htmlColorToEntColor(vjmap.randomColor());
        		let points = result.points.split(";").map(p => {
        			let pt = p.split(",");
        			return [+pt[0], +pt[1]];
        		});
        		if (result.isFit == 1) {
        			dbEnt.fitPoints = points;
        		} else {
        			dbEnt.controlPoints = points;
        		}
        	}
        
        	if (dbEnt) {
        		let data = await createGeomData([dbEnt]);
        		if (addFeatures(data, draw) > 0 ) {
        			hideObjectIds.add(result.objectid);
        			await setObjectsVisible();
        		}
        	}
        }
        
        
        const getGeoJsonBounds = (data) => {
        	let pts = []
        	vjmap.transform.convert(data, (pt) => {
        		pts.push(vjmap.geoPoint(pt));
        		return pt;
        	});
        	let bounds = new vjmap.GeoBounds();
        	bounds.update(pts);
        	return bounds;
        }
        
        // data: GeoJSON; basePt: base point; destPt: destination; scale: scale factor; angle: rotation
        const transformGeoJsonData = (data, basePt, destPt, scale = 1.0, angle = 0.0) => {
        	return vjmap.transform.convert(data, (pt) => {
        		let point = map.fromLngLat(vjmap.geoPoint(pt));
        		point.transform(basePt, destPt, scale, angle);
        		return map.toLngLat(point) ;
        	});
        }
        
        // Interactive create arrow
        const createArrow = async () => {
        	let linetype = new vjmap.DbLineType();
        	linetype.name = "my_arrow_dash";
        	linetype.comments = "dashed";
        
        	linetype.style = [
        		{
        			"method": "numDashes",
        			"parameter": 4
        		},
        		{
        			"method": "patternLength",
        			"parameter": 1.0
        		},
        		{
        			"method": "dashLengthAt",
        			"parameter": [0, 0.5]
        		},
        		{
        			"method": "dashLengthAt",
        			"parameter": [1, -0.2]
        		},
        		{
        			"method": "dashLengthAt",
        			"parameter": [2, 0.1]
        		},
        		{
        			"method": "dashLengthAt",
        			"parameter": [3, -0.2]
        		}
        	]
        	let entities = [];
        	let docBounds = [0, -100, 200, 100];
        	let points = [[10, 60], [150, 20], [140, 40], [190, 0], [140, -40], [150, -20], [10, -40], [10, 60]];
        	let polyline = new vjmap.DbPolyline();
        	polyline.lineWidth = 50;
        	polyline.points = points;
        	polyline.linetype = "my_arrow_dash";
        	polyline.linetypeScale = 30;
        	polyline.color = map.htmlColorToEntColor(vjmap.randomColor());
        
        	let fillColor = vjmap.randomColor();
        	let hatch = new vjmap.DbHatch();
        	hatch.pattern = "SOLID";
        	hatch.color = map.htmlColorToEntColor(fillColor);
        	hatch.points = points;
        	hatch.alpha = 100;
        
        	let text = new vjmap.DbText({
        		position: [100, 70],
        		contents: "Arrow",
        		color: map.htmlColorToEntColor(fillColor),
        		horizontalMode: 4,
        		height: 20
        	});
        
        	entities.push(polyline, hatch, text);
        	let linetypes = [linetype];
        	let tempDraw = map.createDrawLayer();
        
        	const cancelDraw = ()=> {
        		if (tempDraw) map.removeDrawLayer(tempDraw);
        		map.setIsInteracting(false);
        	}
        
        	try {
        		let data = await createGeomData(entities, docBounds, { "LWDISPLAY": true}, linetypes);
        
        		let dataBounds = getGeoJsonBounds(data);
        		let basePt = map.fromLngLat(map.getCenter());
        		let length = map.pixelToGeoLength(100, map.getZoom());
        		let dataGeoBounds = map.fromLngLat(dataBounds);
        		let scalex = length / dataGeoBounds.width();
        		let scaley = length / dataGeoBounds.height();
        		let dblScale = Math.min(scalex, scaley);
        		let drawData = transformGeoJsonData(vjmap.cloneDeep(data), map.fromLngLat(dataBounds.center()), basePt, dblScale);
        		let geoDataBounds = map.fromLngLat(getGeoJsonBounds(drawData));
        		let geoCenter = geoDataBounds.center();
        		addFeatures(drawData, tempDraw);
        
        		message.info("Move mouse to desired position and click to draw")
        
        		map.setIsInteracting(true);
        
        		let oldData = vjmap.cloneDeep(tempDraw.getAll());
        
        
        		let drawDestPt = await vjmap.Draw.actionDrawPoint(map, {
        			updatecoordinate: (e) => {
        				if (!e.lnglat) return;
        				tempDraw.deleteAll();
        				const co = map.fromLngLat(e.lnglat);
        				let drawData = transformGeoJsonData(vjmap.cloneDeep(oldData), geoCenter, co);
        				tempDraw.set(drawData);
        			}
        		});
        		if (drawDestPt.cancel) {
        			cancelDraw();
        			return;
        		}
        		let destPt = map.fromLngLat(drawDestPt.features[0].geometry.coordinates);
        
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
        				tempDraw.set(drawData);
        				tempLine.setData(map.toLngLat([destPt, co]))
        			}
        		});
        
        		if (drawScalePoint.cancel) {
        			cancelDraw();
        			tempLine.remove();
        			return;
        		}
        		let scalePt = map.fromLngLat(drawScalePoint.features[0].geometry.coordinates);
        		let dist = scalePt.distanceTo(destPt);
        		let scale = dist / (geoDataBounds.width() / 2.0);
        		if (scale < 0.0001) scale = 0.1;
        
        		tempLine.setData(map.toLngLat([destPt, destPt]))
        		let drawRotatePoint = await vjmap.Draw.actionDrawPoint(map, {
        			updatecoordinate: (e) => {
        				tempDraw.deleteAll();
        				if (!e.lnglat) return;
        				const co = map.fromLngLat(e.lnglat);
        				let angle = co.angleTo(destPt) * 180.0 / Math.PI;
        				let drawData = transformGeoJsonData(vjmap.cloneDeep(oldData), geoDataBounds.center(), destPt, scale, angle)
        				tempDraw.set(drawData);
        				tempLine.setData(map.toLngLat([destPt, co]))
        			}
        		});
        		tempLine.remove();
        		if (drawRotatePoint.cancel) {
        			cancelDraw();
        			return;
        		}
        		map.setIsInteracting(false);
        
        		let drawFeatures = tempDraw.getAll();
        		map.removeDrawLayer(tempDraw);
        		draw.add(drawFeatures);
        	} catch (e) {
        		cancelDraw();
        	}
        
        }
        
        // Create line with linetype
        const createLineTypePolyline = async () => {
        	let drawLine = await vjmap.Draw.actionDrawLineSting(map);
        	if (drawLine.cancel) {
        		return;
        	}
        	let coordinate = map.fromLngLat(drawLine.features[0].geometry.coordinates);
        	let dbEnt = new vjmap.DbPolyline();
        	dbEnt.objectid = '40D'; // entity from sys_symbols
        	dbEnt.color = vjmap.htmlColorToEntColor(vjmap.randomColor());
        	dbEnt.linetypeScale = 100;
        	dbEnt.points = coordinate.map(p => {
        		return [p.x, p.y];
        	});
        
        	if (dbEnt) {
        		let data = await createGeomData([dbEnt], null, null, null, {
        			mapid: 'sys_symbols',
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
        	let color = vjmap.htmlColorToEntColor(vjmap.randomColor());
        	const createCurve = async (coordinate, color) => {
        		let dbEnt = {};
        		dbEnt.objectid = '40E'; // entity from sys_symbols
        		dbEnt.color = color;
        		dbEnt.linetypeScale = 100;
        		dbEnt.fitPoints = coordinate.map(p => {
        			return [p.x, p.y];
        		}); // fitPoints for fit; controlPoints for control
        
        		if (dbEnt) {
        			return await createGeomData([dbEnt], null, null, null, {
        				mapid: 'sys_symbols',
        				version: 'v1'
        			});
        		}
        	}
        
        	let tempDraw = map.createDrawLayer();
        	let drawLine = await vjmap.Draw.actionDrawLineSting(map, {
        			updatecoordinate: throttle(async (e) => {
        				let coordinate = map.fromLngLat(e.feature.coordinates);
        				let data = await createCurve(coordinate, color);
        				if (tempDraw) tempDraw.set(data);
        			}, 200, 300)
        		}
        	);
        	map.removeDrawLayer(tempDraw);
        	tempDraw = null;
        	if (drawLine.cancel) {
        		return;
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
        		return;
        	}
        	let coordinate = map.fromLngLat(drawPolygon.features[0].geometry.coordinates[0]);
        	let dbEnt = new vjmap.DbHatch();
        	dbEnt.objectid = '42F'; // entity from sys_symbols
        	dbEnt.color = vjmap.htmlColorToEntColor(vjmap.randomColor());
        	dbEnt.patternScale = 400;
        	dbEnt.points = coordinate.map(p => {
        		return [p.x, p.y];
        	});
        
        	if (dbEnt) {
        		let data = await createGeomData([dbEnt], null, null, null, {
        			mapid: 'sys_symbols',
        			version: 'v1'
        		});
        		addFeatures(data, draw);
        	}
        }
        
        // Select entity and delete
        const selectDelete = async () => {
        	let result = await selectFeatures();
        	if (!result) return;
        	hideObjectIds.add(result.objectid);
        	await setObjectsVisible();
        }
        
        // Edit mode
        const switchEditMode = () => {
        	draw.changeMode("simple_select")
        }
        
        // Browse mode
        const switchBrowerMode = () => {
        	draw.changeMode('static');
        }
        
        // Reset to default data
        const resetData = () => {
        	hideObjectIds.clear();
        	setObjectsVisible();
        	draw.deleteAll();
        }
        
        // Save data
        const saveData = async ()=> {
        	let svc = map.getService();
        	let curParam = svc.currentMapParam() || {};
        	await map.updateStyle(svc, {
        		name: "myCustomStyle",
        		...curStyle
        	})
        	let entsJson = draw.getAll();
        	entsJson = map.fromLngLat(entsJson);
        
        	let key = `map_custom_style_drawdata_${curParam.mapid}_${curParam.version}`;
        	await svc.saveCustomData(key, entsJson);
        	message.info('Save success')
        }
        
        
        // Load data
        const loadData = async ()=> {
        	let svc = map.getService();
        	let curParam = svc.currentMapParam() || {};
        	let key = `map_custom_style_drawdata_${curParam.mapid}_${curParam.version}`;
        	let res = await svc.getCustomData(key);
        	if (res.data) {
        		draw.set(map.toLngLat(res.data));
        	}
        }
        loadData();
        
        // UI
        const App = () => {
        	return (
        		<div>
        			<div className="info" style={{width: "185px", right: "10px"}}>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => modifyTextContent()}>Select text and modify content
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => modifyLineCoordinate()}>Select line and modify color
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => createArrow()}>Interactive create arrow
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => createLineTypePolyline()}>Create line with linetype
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => createLineTypeCurve()}>Create curve with linetype
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => createHatch()}>Create hatch symbol region
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => selectDelete()}>Select entity and delete
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => switchEditMode() }>Edit mode
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => switchBrowerMode()}>Browse mode
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => resetData()}>Reset to default data
        					</button>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0"
        							onClick={() => saveData()}>Save modified data
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