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
        // --Destroy map object--
        // See these demos for switching map:
        // https://vjmap.com/demo/#/demo/map/service/14switchMap
        // https://vjmap.com/demo/#/demo/map/service/14switchMapNew
        
        /**
         * Create map object
         * @param serviceUrl Service URL
         * @param mapId Map ID
         * @param mapOpenWay Open mode, default vjmap.MapOpenWay.GeomRender
         * @param isRaster true = raster, false = vector
         * @return {Promise<Map>}
         */
        async function newMap(serviceUrl, mapId, mapOpenWay = vjmap.MapOpenWay.GeomRender, isRaster = true) {
        	// Map service object
        	let svc = new vjmap.Service(serviceUrl, env.accessToken)
        	// Open map
        	let res = await svc.openMap({
        		mapid: env.exampleMapId, // map ID
        		mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            	style: vjmap.openMapDarkStyle() // use dark style when div is dark
        	})
        	if (res.error) {
        		// If open failed
        		throw Error(res.error)
        	}
        	// Get map bounds
        	let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        	// Create geo projection from map bounds
        	let prj = new vjmap.GeoProjection(mapExtent);
        
        	// Memory mode supports raster only
        	if (mapOpenWay === vjmap.MapOpenWay.Memory) {
        		isRaster = true;
        	}
        	// Map style
        	let style = isRaster ? svc.rasterStyle() :	svc.vectorStyle();
        	// Map object
        	let map = new vjmap.Map({
        		container: 'map', // DIV container ID
        		style: style, // style
        		center: prj.toLngLat(mapExtent.center()), // set map center
        		zoom: 2, // set zoom level
        		renderWorldCopies: false // do not show world copies
        	});
        
        	// Attach service and projection
        	map.attach(svc, prj);
        	// Fit map to full extent
        	map.fitMapBounds();
        
        	// Navigation control
        	map.addControl(new vjmap.NavigationControl());
        	// Mouse position control
        	map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        	// Enable click to highlight
        	if (isRaster) {
        		map.enableLayerClickHighlight(svc, e => {
        			if (!e) return;
        			let content = `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`
        			e && message.info({ content, key: "info", duration: 5});
        		})
        	} else {
        		// Hover highlight
        		map.enableVectorLayerHoverHighlight((event, feature, layer) => {
        			if (!feature) return;
        			let content = `event: ${event}; feature: ${feature.id}; layer: ${layer}`
        			message.info({ content, key: "info", duration: 5});
        		})
        	}
        
        	// Map load event
        	map.on("load",function(){
        		message.info("Map created successfully!");
        	});
        	return map;
        }
        
        // Create raster map
        let map = await newMap(env.serviceUrl, env.exampleMapId, vjmap.MapOpenWay.GeomRender, true)
        // UI
        const { useState } = React;
        const App = () => {
        	const [isCreate, setIsCreate] = useState(true);
        	// Create new map
        	const createMap = async e => {
        		if(map){
        			message.info("Map already created. Destroy it first!");
        			return;
        		}
        		map = await newMap(env.serviceUrl, env.exampleMapId, vjmap.MapOpenWay.GeomRender, false)
        		message.info("Vector map created successfully!");
        		setIsCreate(true);
        	}
        	// Destroy map object
        	const closeMap = () => {
        		map && map.destory();
        		message.info("Map destroyed");
        		map = null;
        		setIsCreate(false);
        	}
        	return (
        		<div className="input-card">
        			<h4>Create / Destroy map</h4>
        			<div id="btns">
        				<div className="input-item">
        					<button id="create-btn" className={isCreate ? "btn btn-active" : "btn"} onClick={createMap}>Create map</button>
        					<button id="destroy-btn" className={!isCreate ? "btn btn-active" : "btn"} onClick={closeMap}>Destroy map</button>
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