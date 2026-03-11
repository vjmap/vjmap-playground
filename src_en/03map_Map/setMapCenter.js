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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/setMapCenter
        // --Set map center and zoom level--
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
        
        // Enable click to highlight
        map.enableLayerClickHighlight(svc, e => {
        	e && message.info({content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`, key: "info", duration: 5});
        })
        
        const { useRef } = React
        // UI
        const App = () => {
        	const inputCoord = useRef(null); // coord input ref
        	const inputZoom = useRef(null); // zoom input ref
        	const setZoomAndCenter = () => {
        		let coord = inputCoord.current.value;
        		let zoom = inputZoom.current.value;
        		coord = coord.split(",");
        		// Set map center
        		map.setCenter(map.toLngLat([+coord[0], +coord[1]]));
        		// Set zoom level
        		map.setZoom(+zoom); // + coerces to number
        	}
        	return (
        		<div className="input-card w300">
        			<h4>Set map center and zoom level</h4>
        			<div className="input-item border">
        				Map center: <input type="text" ref={inputCoord} defaultValue="587562246, 3103865690"
        							 placeholder="587562246, 3103865690" className="inp"/>
        			</div>
        			<div className="input-item border">
        				Zoom level: <input type="text" ref={inputZoom} defaultValue="5" placeholder="5" className="inp"/>
        			</div>
        			<div className="input-item">
        				<button id="random-center-zoom-btn" className="btn btn-full mr0"
        						onClick={setZoomAndCenter}>Set
        				</button>
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