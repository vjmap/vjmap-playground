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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/limitMapRange
        // --Limit map display bounds--
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
        // Fit map to full extent
        map.fitMapBounds();
        
        // Clip bounds
        const mapClipBounds = map.getGeoBounds(0.2);
        // UI
        const { useState, useEffect } = React
        const App = () => {
        	const [rightTopPoint, setRightTopPoint] = useState(); // top-right
        	const [leftBtmPoint, setLeftBtmPoint] = useState(); // bottom-left
        	const [isLock, setIsLock] = useState(false);
        
        	const getBoundingBox = () => {
        		// Get current map bounds
        		let lnglatBounds = map.getBounds();
        		let nePoint = map.fromLngLat(lnglatBounds.getNorthEast());
        		let swPoint = map.fromLngLat(lnglatBounds.getSouthWest());
        		setLeftBtmPoint(nePoint.toString());
        		setRightTopPoint(swPoint.toString())
        	}
        	const lockMapBounds = () => {
        		// Fit to clip bounds first
        		let southWest = map.toLngLat(mapClipBounds.min);
        		let northEast = map.toLngLat(mapClipBounds.max);
        		let bounds = new vjmap.LngLatBounds(southWest, northEast);
        		map.fitBounds(bounds);
        		setTimeout(() => {
        			// Set max bounds
        			bounds = map.setMaxBounds(map.getBounds());
        			setIsLock(true);
        			message.info("Set successfully")
        		},500)
        	}
        	const unLockMapBounds = () => {
        		// Clear bounds limit
        		map.setMaxBounds();
        		setIsLock(false);
        	}
        	useEffect(() => {
        		getBoundingBox();
        		map.on('moveend', getBoundingBox);
        		return ()=> {
        			map.off('moveend', getBoundingBox);
        		}
        	}, []);
        	return (
        		<div>
        			<div className="input-card">
        				<h4>Limit map display bounds</h4>
        				<div className="input-item">
        					<button id="limit-map-btn" className={isLock ? "btn btn-active" : "btn"} onClick={lockMapBounds}>Limit map bounds</button>
        					<button id="clear-map-btn" className={!isLock ? "btn btn-active" : "btn"} onClick={unLockMapBounds}>Clear bounds limit</button>
        				</div>
        
        			</div>
        			<div className="info">
        				<h4>Current map bounds</h4>
        				<p>Top-right: <span id="ne" className="lnglat">{rightTopPoint}</span></p>
        				<p>Bottom-left: <span id="sw" className="lnglat">{leftBtmPoint}</span></p>
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