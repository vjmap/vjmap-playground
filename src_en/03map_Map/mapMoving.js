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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/mapMoving
        // --Map pan--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
        	mapid: env.exampleMapId, // map ID
        	mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div is dark
        })
        if (res.error) {
        	// If open failed
        	message.error(res.error)
        }
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
        	container: 'map', // DIV container ID
        	style: svc.rasterStyle(), // style
        	center: prj.toLngLat(prj.getMapExtent().center()), // set map center
        	zoom: 2, // set zoom level
        	renderWorldCopies: false // do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        
        // UI
        const { useRef } = React
        const App = () => {
        	const xValueInput = useRef(null);
        	const yValueInput = useRef(null);
        	const centerInput = useRef(null);
        
        	const moveMap = () => {
        		let px = xValueInput.current.value;
        		let py = yValueInput.current.value;
        		map.panBy([px, py]);  // pan by pixel x, y
        	}
        	const panMap = () => {
        		let coord = centerInput.current.value;
        		coord = coord.split(",");
        		// Pan to point
        		map.panTo(map.toLngLat([+coord[0], +coord[1]]));
        	}
        	return (
        		<div>
        			<div className="input-card w270">
        				<div className="input-item border">
        					Pan X (px): <input type="text" ref={xValueInput} defaultValue="50" placeholder="50"
        								  className="inp"/>
        				</div>
        				<div className="input-item border">
        					Pan Y (px): <input type="text" ref={yValueInput} defaultValue="100" placeholder="100"
        								  className="inp"/>
        				</div>
        				<div className="input-item">
        					<button id="moving_btn" className="btn btn-full mr0" onClick={moveMap}>Pan</button>
        				</div>
        				<div className="input-item border">
        					Map center:
        					<input type="text" ref={centerInput} defaultValue="587562246, 3103865690"
        						   placeholder="587562246, 3103865690" className="inp"/>
        				</div>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0" onClick={panMap}>Pan</button>
        				</div>
        			</div>
        		</div>
        	);
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        
        
        /**
          * Move a geo point to a pixel position on the map
          * @param {Map} map - Map instance
          * @param {Array} geopt - CAD coordinate [x, y]
          * @param {Array} pixel - Target pixel [x, y]
          */
        function movePtToPixel(map, geopt, pixelPoint) {
        	let lngLat = map.toLngLat(geopt)
        	// Project to pixel
        	const point = map.project(lngLat);
        
        	// Offset
        	const offsetX = pixelPoint[0] - point.x;
        	const offsetY = pixelPoint[1] - point.y;
        
        	// Current center
        	const center = map.getCenter();
        
        	// Center to pixel
        	const centerPoint = map.project(center);
        	// New center pixel
        	const newCenterPoint = {
        		x: centerPoint.x - offsetX,
        		y: centerPoint.y - offsetY
        	};
        
        	// Unproject to lng/lat
        	const newCenter = map.unproject(newCenterPoint);
        	map.setCenter(newCenter)
        }
        
        // To move a CAD coordinate to a pixel (e.g. map top-left to screen top-left):
        // let drawBounds = await svc.cmdGetDrawBounds();
        // movePtToPixel(map, drawBounds.leftTop(), [0,0])
        
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