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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zfrommapmodify
        // --Modify or add/delete on existing data [Change original]--Get original data and modify it.
        // Note: This sample is for server-side modification of the original; for front-end only display use draw layer (no change to original, faster).
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        let mapid = "basketballCourt";
        let version = ""; // Latest version
        // Open map
        let res = await svc.openMap({
        	mapid: mapid, // Map ID (ensure it exists; upload new drawing to create)
        	mapopenway: version, // Open with geometry rendering
        	style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
        	message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map instance
        let map = new vjmap.Map({
        	container: 'map', // container ID
        	style: svc.rasterStyle(), // Raster tile style
        	center: prj.toLngLat(mapExtent.center()), // Center
        	zoom: 2,
        	renderWorldCopies: false
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        
        // isModify false: create three segments; true: modify three segments
        const createDoc = async (isModify) => {
        	let version = svc.currentMapParam().version; // Current latest version
        	let curDrawLayerName = 'mynewlayer' ; // Layer for drawn entities
        	// Query whether the three segments drawn before exist in the map
        	// Filter by layer and entity type; use xdata to identify which segment
        	let query = await svc.exprQueryFeature({
        		// Expression query for block entities (condition query turns blocks into discrete geometry)
        		/// To query a specific block name: expr: `gOutReturn := if((gInFeatureType == 'AcDbBlockReference' and gInAttrs4 == 'BlockName'), 1, 0);`,
        		expr: `gOutReturn := if((gInFeatureType == 'AcDbPolyline' and gInLayerName == '${curDrawLayerName}'), 1, 0);`,
        		fields: "", // Empty = all fields
        		geom: false, // Memory mode
        		useCache: true,
        		limit: 1000000 // Large limit to find all
        	})
        	if (query.error) {
        		message.error(query.error)
        		return
        	}
        
        	let lineObjectIds = new Map(); // Line index -> objectid in original map
        	if (query.result) {
        		for(let i = 0; i < query.result.length; i++) {
        			let item = query.result[i];
        			let objectid = item.objectid; // Entity objectid (unique)
        			let xdata = item.xdata; // Entity extended data
        			if (xdata != "") xdata = JSON.parse(xdata);
        			if (xdata && xdata["1000"]) xdata = JSON.parse(xdata["1000"]);
        			if (xdata && xdata.lineIndex !== undefined) {
        				// Line index in xdata
        				lineObjectIds.set(xdata.lineIndex, objectid);
        			}
        		}
        	}
        
        	let doc = new vjmap.DbDocument();
        	// Data source
        	doc.from = `${mapid}/${version}`;
        
        	let lineCount = 3; // Total number of lines
        
        	// Add layer in CAD drawing
        	let cadLayer1 = new vjmap.DbLayer();
        	cadLayer1.name = curDrawLayerName;
        	cadLayer1.color = 7;
        	doc.layers = doc.layers || [];
        	doc.layers.push(cadLayer1);
        
        	let entities = []
        	if (!isModify) {
        		// Create
        		for(let n = 0; n < lineCount; n++) {
        			if (lineObjectIds.has(n)) continue; // Already exists, skip
        			// Line xdata: store line index
        			let extData = {
        				lineIndex: n
        			}
        			entities.push(new vjmap.DbPolyline({
        				points: mapExtent.randomPoints(2, 4).map(p => [p.x, p.y]), // Random points
        				colorIndex: n + 1,
        				layer: curDrawLayerName, // Place entity on this layer
        				xdata: { key: JSON.stringify(extData, null, 0)} // xdata: "1000"=value, "1001"=key
        			}))
        		}
        	} else {
        		// Modify
        		for(let n = 0; n < lineCount; n++) {
        			if (!lineObjectIds.has(n)) continue; // Not found, skip
        			let objectid = lineObjectIds.get(n); // objectid means modify this entity
        			let isDelete = vjmap.randInt(0, 3) == 0; // Demo: either modify coords or delete
        			if (isDelete) {
        				entities.push(new vjmap.DbPolyline({
        					objectid: objectid,
        					delete: true // Delete
        				}))
        			}
        			else {
        				entities.push(new vjmap.DbPolyline({
        					objectid: objectid,
        					points: mapExtent.randomPoints().map(p => [p.x, p.y]), // Random points for new coords
        				}))
        			}
        		}
        	}
        	doc.entitys = entities
        	// Zoom to extent after create
        	doc.isZoomExtents = true;
        	return doc;
        }
        
        
        
        
        
        // Clear previous map data
        const clearMapData = () => {
        	svc.setCurrentMapParam({
        		darkMode: true, // No map opened yet; set dark mode
        		bounds: mapExtent.toString()
        	})
        	map.disableLayerClickHighlight();
        	map.removeDrawLayer();
        	let sources = map.getStyle().sources;
        	for(let source in sources) {
        		map.removeSourceEx(source);
        	}
        }
        
        
        // Create DWG map
        const createDwgMap = async (doc) => {
        	if (doc.entitys && doc.entitys.length == 0) return;
        	// Clear previous draw first
        	clearMapData();
        	let res = await svc.updateMap({
        		mapid: mapid,
        		filedoc:JSON.stringify(doc),
        		mapopenway: vjmap.MapOpenWay.Memory,
        		style: {
        			backcolor: 0 // Use 0xFFFFFF if div background is light
        		}
        	})
        	if (res.error) {
        		message.error(res.error)
        	}
        	await map.switchMap(res);
        }
        
        const createLines = async () => {
        	let doc = await createDoc(false);
        	await createDwgMap(doc)
        }
        
        const modifyLines = async () => {
        	let doc = await createDoc(true);
        	await createDwgMap(doc)
        }
        
        // UI
        const App = () => {
        	return (
        		<div>
        			<div className="info" style={{width: '430px'}}>
        				<div className="input-item">
        					<button className="btn btn-full mr0" onClick={createLines}>Create three segments</button>
        					<button className="btn btn-full mr0" onClick={modifyLines}>Modify three segments</button>
        				</div>
        			</div>
        		</div>
        	);
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
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