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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zfrommap
        // --Modify or add/delete on existing drawing [Change original]--Modify or add/delete on current drawing; original DWG is modified
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let doc = new vjmap.DbDocument();
        /** Source map; modify/add/delete on top of it. Format: mapid/version, e.g. exam/v1 */
        doc.from = "basketballCourt/v1";
        
        // Modify or delete by passing entity `objectid` handle; omit `objectid` for add
        let modifyEnts = [
        	/* Modify */
        	new vjmap.DbCircle({
        		objectid: "71", // Entity handle; if provided, modify or delete this entity
        		colorIndex: 2
        	}),
        	/* Delete */
        	new vjmap.DbText({
        		objectid: "73", // Entity handle; if provided, modify or delete this entity
        		delete: true // Delete
        	}),
        	/* Add (no objectid) */
        	new vjmap.DbMText({
        		location: [14, -2],
        		contents: "Basketball court",
        		colorIndex: 4,
        		attachment: 2,
        		textHeight: 3
        	})
        ]
        doc.appendEntity(modifyEnts);
        
        // js code
        let res = await svc.updateMap({
        	// Get a temporary map id (temp maps are for preview only; expire and auto-delete)
        	mapid: vjmap.getTempMapId(1), // Temp map expiry in minutes when not viewed; default 30
        	filedoc: JSON.stringify(doc),
        	mapopenway: vjmap.MapOpenWay.Memory,
        	style: {
        		backcolor: 0 // Use 0xFFFFFF if div background is light
        	}
        })
        if (res.error) {
        	message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        var map = new vjmap.Map({
        	container: 'map', // container ID
        	style: svc.rasterStyle(),
        	center: prj.toLngLat(mapExtent.center()),
        	zoom: 2,
        	renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
        	e && message.info(`type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`);
        })
        
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