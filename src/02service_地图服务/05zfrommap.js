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
        // --在现有图形上修改或新增删除[改变原图]--基于现在的图形，在上面进行修改或新增删除，会对原DWG图进行修改
        	// js代码
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let doc = new vjmap.DbDocument();
        /** 来源于哪个图，会在此图的上面进行修改或新增删除，格式如 形式为 mapid/version,如 exam/v1 . */
        doc.from = "basketballCourt/v1";
        
        // 修改或删除实体是通过传递 `objectid` 实体句柄，如果没有 `objectid` 则表示新增
        let modifyEnts = [
        	/*修改*/
        	new vjmap.DbCircle({
        		objectid: "71",// 实体句柄，如传了实体句柄，是表示修改或删除此实体.
        		colorIndex: 2
        	}),
        	/*删除*/
        	new vjmap.DbText({
        		objectid: "73",// 实体句柄，如传了实体句柄，是表示修改或删除此实体.
        		delete: true // 表示删除
        	}),
        	/*新增(没有传 objectid )*/
        	new vjmap.DbMText({
        		location: [14, -2],
        		contents: "篮球场",
        		colorIndex: 4,
        		attachment: 2,
        		textHeight: 3
        	})
        ]
        doc.appendEntity(modifyEnts);
        
        // js代码
        let res = await svc.updateMap({
        	// 获取一个临时的图id(临时图形只会用临时查看，过期会自动删除)
        	mapid: vjmap.getTempMapId(1), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
        	filedoc: JSON.stringify(doc),
        	mapopenway: vjmap.MapOpenWay.Memory,
        	style: {
        		backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
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