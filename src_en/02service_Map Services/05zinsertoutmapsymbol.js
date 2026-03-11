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
        // --Insert external symbol or graphic--Insert elements from external graphic into current map
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
        	mapid: 'sys_hello', // Map ID
        	mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
        	style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
        	// If open failed
        	message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geometric projection from map extent
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
        	container: 'map', // DIV container ID
        	style: svc.rasterStyle(), // raster style
        	center: prj.toLngLat(mapExtent.center()), // Set map center
        	renderWorldCopies: false // Do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        // Add empty GeoJSON source and layer first; then update source data as needed
        const addGeojsonSourceLayerToMap = () => {
        	let sourceId = "symbol_source_" + vjmap.RandomID()
        	map.addGeoJSONSource(sourceId, {
        		type: "FeatureCollection",
        		features: []
        	});
        
        	// Fill layer
        	map.addFillLayer(sourceId + "-layer-polygons", sourceId, {
        		source: sourceId,
        		// Two states: selected highlight color and default color
        		fillColor: ['case', ['to-boolean', ['feature-state', 'selected']], '#57FFC9', ['get', 'color']],
        		fillAntialias: true,
        		fillOutlineColor: ['get', 'color'],
        		fillOpacity: ["get", "alpha"],
        		filter: ['!=', ['get', 'isline'], true]
        	})
        
        	// Fill border layer
        	map.addLineLayer(sourceId + "-layer-polygons-border", sourceId, {
        		source: sourceId,
        		lineOpacity: ["get", "alpha"],
        		lineColor:  ['case', ['to-boolean', ['feature-state', 'selected']], '#57FFC9', ['get', 'color']],
        		filter: ['!=', ['get', 'isline'], true]
        	})
        
        	// Line layer
        	map.addLineLayer(sourceId + "-layer-lines", sourceId, {
        		source: sourceId,
        		lineCap: "round",
        		lineWidth: ['get', 'lineWidth'],
        		lineOpacity: ["get", "alpha"],
        		lineColor: ['case', ['to-boolean', ['feature-state', 'selected']], '#57FFC9', ['get', 'color']],
        		filter: ['==', ['get', 'isline'], true]
        	})
        
        	// Point symbol layer
        	map.addSymbolLayer(sourceId + "-layer-points", sourceId, {
        		source: sourceId,
        		iconOpacity: ["get", "alpha"],
        		iconColor: ['case', ['to-boolean', ['feature-state', 'selected']], '#57FFC9', ['get', 'color']]
        	})
        
        	let layerIds = map.layersBySource(sourceId);
        
        	// Clear selected highlight
        	const clearSelected = ()=> {
        		map.removeFeatureState({
        			source: sourceId
        		})
        		map.fire(sourceId + "_click", {
        			symbolId: ""
        		})
        	}
        
        	// Click handler per layer to select whole symbol
        	const selectLayer = e => {
        		if (map.isInteracting()) return; // Skip if map is interacting
        		clearSelected();
        		if (!e || !e.features || e.features.length === 0) return;
        		let selFeature = e.features[0];
        		let symbolId = selFeature.properties.symbolId;
        		// Set all features of same symbol to selected
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
        		map.fire(sourceId + "_click", {
        			symbolId: symbolId,
        			selFeature: selFeature,
        			event: e
        		})
        	}
        	for(let layerId of layerIds) {
        		map.on("click", layerId, selectLayer)
        	}
        	const unSelectLayer = event => {
        		if (map.isInteracting()) return;
        		if (map.queryRenderedFeatures(event.point).filter(feature => feature.source === sourceId).length === 0) {
        			clearSelected();
        		}
        	}
        	map.on("click", unSelectLayer);
        	const setData = (newData, isAppend = true) => {
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
        	// Clear all
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
        
        // queryParam: query condition; propData: property data
        let globalIndex = 0;
        const getQueryGeomData = async (queryParam, propData = {})=> {
        	let res = await svc.conditionQueryFeature({
        		fields: "",
        		includegeom: true, // Include geometry; when realgeom false, >1 returns bbox only, 1 returns full geojson
        		realgeom: true,
        		limit: 10000, // Large limit to get all; default 100
        		...queryParam
        	})
        	const features = []
        	if (res && res.result && res.result.length > 0) {
        		for (let ent of res.result) {
        			if (ent.geom && ent.geom.geometries) {
        				let clr = map.entColorToHtmlColor(ent.color); // Entity color to HTML
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
        							...propData // Extra property data
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
        
        // Get GeoJSON bounding box
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
        
        
        const createOutSymbol = async () => {
        	let symbolMapId = "sys_symbols";
        	let symbolMapVer = "v1";
        	let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true)
        	let data = await getQueryGeomData({
        		mapid: symbolMapId,
        		version: symbolMapVer,
        		layer: styleName,
        		condition: 'layerindex=2', // WHERE condition; see server condition/expression query docs
        	}, {
        		symbolId: vjmap.RandomID(),
        		lineWidth: 3,
        		color: vjmap.randomColor()
        	});
        	let dataBounds = getGeoJsonBounds(data);
        	let pt = map.getGeoBounds(0.6).randomPoint();
        	let drawData = transformGeoJsonData(vjmap.cloneDeep(data), map.fromLngLat(dataBounds.center()), pt, vjmap.randInt(1, 10) / 10.0)
        	setData(drawData)
        }
        
        const interactionCreateOutSymbol = async () => {
        	message.info("Move mouse to desired position and click to draw symbol")
        	let symbolMapId = "sys_symbols";
        	let symbolMapVer = "v1";
        	let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true)
        	let data = await getQueryGeomData({
        		mapid: symbolMapId,
        		version: symbolMapVer,
        		layer: styleName,
        		condition: 'layerindex=1',
        	}, {
        		symbolId: vjmap.RandomID()
        	});
        	let dataBounds = getGeoJsonBounds(data);
        	let geoDataBounds = map.fromLngLat(dataBounds);
        
        	map.setIsInteracting(true);
        
        	let oldData = vjmap.cloneDeep(getData());
        
        	const cancelDraw = ()=> {
        		setData(oldData, false);
        		map.setIsInteracting(false);
        	}
        	let drawDestPt = await vjmap.Draw.actionDrawPoint(map, {
        		updatecoordinate: (e) => {
        			setData(oldData, false);
        			if (!e.lnglat) return;
        			const co = map.fromLngLat(e.lnglat);
        			let drawData = transformGeoJsonData(vjmap.cloneDeep(data), geoDataBounds.center(), co)
        			setData(drawData, true);
        		}
        	});
        	if (drawDestPt.cancel) {
        		cancelDraw();
        		return;
        	}
        	let destPt = map.fromLngLat(drawDestPt.features[0].geometry.coordinates);
        
        	// Get scale factor; optional helper line
        	let tempLine = new vjmap.Polyline({
        		data: map.toLngLat([destPt, destPt]),
        		lineColor: 'yellow',
        		lineWidth: 1,
        		lineDasharray:[2,2]
        	});
        	tempLine.addTo(map);
        
        	let drawScalePoint = await vjmap.Draw.actionDrawPoint(map, {
        		updatecoordinate: (e) => {
        			setData(oldData, false);
        			if (!e.lnglat) return;
        			const co = map.fromLngLat(e.lnglat);
        			let dist = co.distanceTo(destPt);
        			let scale = dist / (geoDataBounds.width() / 2.0);
        			let drawData = transformGeoJsonData(vjmap.cloneDeep(data), geoDataBounds.center(), destPt, scale)
        			setData(drawData, true);
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
        			setData(oldData, false);
        			if (!e.lnglat) return;
        			const co = map.fromLngLat(e.lnglat);
        			let angle = co.angleTo(destPt) * 180.0 / Math.PI;
        			let drawData = transformGeoJsonData(vjmap.cloneDeep(data), geoDataBounds.center(), destPt, scale, angle)
        			setData(drawData, true);
        			tempLine.setData(map.toLngLat([destPt, co]))
        		}
        	});
        	tempLine.remove();
        	if (drawRotatePoint.cancel) {
        		cancelDraw();
        		return;
        	}
        	map.setIsInteracting(false);
        }
        
        let hasInsertOutMap;
        const insertOutMap = async () => {
        	if (hasInsertOutMap) return; // Already loaded
        	hasInsertOutMap = true;
        	let symbolMapId = "sys_hello";
        	let symbolMapVer = "v1";
        	let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true)
        
        	let tol = map.pixelToGeoLength(1, 10);
        	tol = vjmap.Projection.EQUATORIAL_SEMIPERIMETER * 2 * tol / prj.getMapExtent().width()
        
        	let data = await getQueryGeomData({
        		mapid: symbolMapId,
        		version: symbolMapVer,
        		layer: styleName,
        		condition: '', // Empty = get all
        		simplifyTolerance: tol,
        	}, {
        		symbolId: vjmap.RandomID()
        	});
        	let dataBounds = getGeoJsonBounds(data);
        	let pt = map.fromLngLat(map.getCenter());
        	let drawData = transformGeoJsonData(vjmap.cloneDeep(data), map.fromLngLat(dataBounds.center()), pt, 0.8)
        	setData(drawData)
        }
        
        map.on(sourceId + "_click",  e=> {
        	if (e.symbolId) {
        		message.info("Clicked symbol: " + e.symbolId)
        	}
        });
        const App = () => {
        	return (
        		<div className="input-card">
        			<h4>Insert external symbol</h4>
        			<div className="input-item">
        				<button className="btn" onClick={ () => createOutSymbol() }>Create external symbol</button>
        				<button className="btn" onClick={ () => interactionCreateOutSymbol() }>Interactive create external symbol</button>
        				<button className="btn" onClick={ () => insertOutMap() }>Insert external graphic</button>
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