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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/setMapVisibleBounds
        // --Show only a region of the map--
        // JS code
        // Create service with url and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
        	mapid: env.exampleMapId, // Map ID (ensure exists; upload to create new)
        	mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
        	style: vjmap.openMapDarkStyle()
        })
        
        if (res.error) {
        	// On open error
        	message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let rasterStyle = svc.rasterStyle();
        // Hide layer initially
        let rasterLayer = rasterStyle.layers[0];
        rasterLayer.layout.visibility = "none";
        let map = new vjmap.Map({
        	container: 'map', // Container ID
        	style: rasterStyle, // Raster style
        	center: prj.toLngLat(mapExtent.center()), // Center
        	zoom: 2, // Zoom
        	renderWorldCopies: false // No world copies
        });
        
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        
        map.enableLayerClickHighlight(svc, e => {
        	if (!e) return;
        })
        
        const showVisibleBounds = (bounds, curBackColor = "#022B4F") => {
        	let holePolygon = []
        	let mapBounds = map.getGeoBounds(1);
        	const maskPath = [];
        	maskPath.push([mapBounds.min.x, mapBounds.min.y]);
        	maskPath.push([mapBounds.max.x, mapBounds.min.y]);
        	maskPath.push([mapBounds.max.x, mapBounds.max.y]);
        	maskPath.push([mapBounds.min.x, mapBounds.max.y]);
        	holePolygon.push(maskPath)
        
        	holePolygon.push(...bounds)
        
        
        	let polygon = new vjmap.Polygon({
        		data: map.toLngLat(holePolygon),
        		fillColor: curBackColor,
        		fillOpacity: 1,
        		fillOutlineColor: curBackColor,
        		isHoverPointer: false,
        		isHoverFeatureState: false
        	});
        	polygon.addTo(map);
        
        	return polygon;
        }
        
        let mapBounds2 = map.getGeoBounds(0.2);
        const points = mapBounds2.toPointArray();
        const w = mapBounds2.width() / 1.5;
        // Four small rects from four corners for four holes
        let holePolygon = []
        for(let p of points) {
        	const path = [];
        	path.push(...vjmap.GeoBounds.fromCenterWH(p, w).toPointArray());
        	holePolygon.push(path)
        }
        let maskPolygon = showVisibleBounds(holePolygon)
        
        setTimeout(() => {
        	// Show layer again
        	map.show(rasterLayer.id);
        	// Or: same effect
        	//map.setLayoutProperty(rasterLayer.id, "visibility", "visible");
        	// If click highlight on, move mask above
        	map.moveLayer(maskPolygon.getLayerId())
        }, 500)
        
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