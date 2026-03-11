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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05yfrommap
        // --Modify or add/delete on existing drawing [Preview then export DWG]--Modify or add/delete on current drawing, preview then export DWG
        const createDwgDoc = () => {
        	let doc = new vjmap.DbDocument();
        
        	// Data source
        	doc.from = "symbolsbase/v1";
        	// Clear source drawing data and use as template
        	doc.isClearFromDb = true;
        	// Filter entities to display by expression
        	doc.pickExpr = "gOutReturn := if((gInFeatureType == 'AcDbPolyline'), 1, 0);"
        	let entitys = [];
        
        	// Clone a hatch and change color
        	let hatch = new vjmap.DbHatch();
        	hatch.cloneObjectId = "426"
        	hatch.color = 0x00FF00;
        	entitys.push(hatch)
        
        	// Clone a line with linetype and change coordinates
        	let line = {
        		cloneObjectId: "40D",
        		points: [
        			[ 587621282.9992019, 3103825727.070341],
        			[ 587624787.2905588,3103825630.4953823]
        		]
        	}
        	entitys.push(line)
        
        	// Clone a line with linetype and change coordinates
        	let line2 = {
        		cloneObjectId: "40D",
        		points: [
        			[ 587621476.1491191, 3103823478.2534466],
        			[ 587625270.1653521, 3103823354.085643]
        		]
        	}
        	entitys.push(line2)
        
        	// Clone a curve with linetype and change coordinates
        	let curve = {
        		cloneObjectId: "40E",
        		fitPoints: [
        			[587626704.9933093,	3103822140.000448],
        			[587629077.9780077,	3103823147.1393027],
        			[587631395.7770153,	3103822222.778984],
        			[587633327.2761885,	3103823409.271333]
        		]
        	}
        	entitys.push(curve);
        
        	// Add a new line
        	let newLine = new vjmap.DbLine({
        		start: [ 587614797.4495885,
        			3103826738.684679],
        		end: [587619532.0491413,
        			3103826678.753039]
        	});
        	entitys.push(newLine);
        	doc.entitys = entitys;
        	return doc;
        }
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        // Set initial extent (exact value does not matter); export DWG will compute real extent from entity coordinates.
        let mapBounds = '[-10000,-10000,10000,10000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        mapExtent = mapExtent.square(); // Make square
        
        svc.setCurrentMapParam({
        	darkMode: true, // No map opened yet; set dark mode
        	bounds: mapExtent.toString()
        })
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map instance
        let map = new vjmap.Map({
        	container: 'map', // container ID
        	style: {
        		version: svc.styleVersion(),
        		glyphs: svc.glyphsUrl(),
        		sources: {},
        		layers: []
        	}, // Vector tile style
        	center: [0,0], // Center
        	zoom: 2,
        	renderWorldCopies: false
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        
        // Create geometry data
        const createGeomData = async (map, doc) => {
        	let svc = map.getService();
        	let res = await svc.cmdCreateEntitiesGeomData({
        		filedoc: JSON.stringify(doc)
        	});
        	if (res.metadata && res.metadata.mapBounds) {
        		// Update map extent from returned metadata
        		map.updateMapExtent(res.metadata.mapBounds);
        	}
        	const features = [];
        	if (res && res.result && res.result.length > 0) {
        		for (let ent of res.result) {
        			if (ent.geom && ent.geom.geometries) {
        				let clr = map.entColorToHtmlColor(ent.color); // Entity color to HTML
        				for (let g = 0; g < ent.geom.geometries.length; g++) {
        					let featureAttr = {};
        					// Distinguish line vs polygon for composite entity
        					if (ent.isPolygon) {
        						featureAttr.color = clr; // Fill (polygon only)
        						featureAttr.noneOutline = true; // No outline (polygon only)
        					} else {
        						featureAttr.color = clr; // Color
        						featureAttr.line_width = ent.lineWidth; // Line width
        					}
        					features.push({
        						id: vjmap.RandomID(10),
        						type: "Feature",
        						properties: {
        							objectid: ent.objectid + "_" + g,
        							opacity: ent.alpha / 255,
        							...featureAttr,
        						},
        						geometry: ent.geom.geometries[g],
        					});
        				}
        			}
        		}
        	}
        	return {
        		type: "FeatureCollection",
        		features: features,
        	};
        };
        
        const doc = await createDwgDoc();
        const createMap = async () => {
        	let geojson = await createGeomData(map, doc);
        	const opts = vjmap.Draw.defaultOptions();
        	// Change default style: point radius 1, no stroke (default 5)
        	let pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-point-stroke-inactive");
        	if (pointIdx >= 0) {
        		opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 0
        	}
        	pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-inactive");
        	if (pointIdx >= 0) {
        		opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 1
        	}
        	map.getDrawLayer(opts).set(geojson);
        }
        await createMap();
        
        const exportDwgOpen = async () => {
        	const mapid = 'exportdwgmap';
        	let res = await svc.updateMap({
        		mapid: mapid,
        		filedoc: JSON.stringify(doc),
        		mapopenway: vjmap.MapOpenWay.Memory,
        		style: {
        			backcolor: 0 // Use 0xFFFFFF if div background is light
        		}
        	})
        	if (res.error) {
        		message.error(res.error)
        	} else{
        		window.open(`https://vjmap.com/app/cloud/#/map/${res.mapid}?version=${res.version}&mapopenway=Memory&vector=false`)
        	}
        }
        
        // UI
        const App = () => {
        	return (
        		<div>
        			<div className="info w260">
        				<h4>Actions:</h4>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0" onClick={exportDwgOpen}>Export as DWG and open</button>
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