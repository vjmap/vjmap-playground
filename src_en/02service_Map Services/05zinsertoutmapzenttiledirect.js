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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zinsertoutmapzenttiledirect
        // --Load external map entity tile layer by coordinate--Insert external map elements at coordinates (tile load, backend render)
        // Note: This example uses vjcommon. Add vjcommon.min.js in HTML or: npm install vjcommon, import vjcommon from 'vjcommon'
        // vjcommon is open source: https://github.com/vjmap/vjmap-common
        
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
            style: svc.rasterStyle(), // style, raster here
            center: prj.toLngLat(mapExtent.center()), // Set map center
            renderWorldCopies: false // Do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds();
        
        // Add a symbol at position
        let templateMapId = "sys_symbols";
        let templateMapIdVer = "v1";
        
        let doc = new vjmap.DbDocument();
        // Data source
        doc.from = `${templateMapId}/${templateMapIdVer}`;
        // Clear source map data
        doc.isClearFromDb = true;
        let entitys = [];
        let blockIds = ["25B"] // Open in memory mode to get objectid
        for(let bid of blockIds) {
            let point  = mapBounds.randomPoint().toArray();
            entitys.push(new vjmap.DbBlockReference({
                cloneObjectId: bid,
                position: point,
                matrix: [
                    {
                        op: "scale",
                        scale: 1, // Scale factor
                        origin: point // Base point
                    }
                ],
            }))
        }
        
        let lineIds = ["40D"] // Open in memory mode to get objectid
        for(let lnid of lineIds) {
            let points = [];
            // Generate three points for the line
            for(let i = 0; i < 3; i++) {
                points.push( mapBounds.randomPoint().toArray())
            }
            entitys.push(new vjmap.DbBlockReference({
                cloneObjectId: lnid,
                points: points,
                //linetypeScale: 100, // Linetype scale
            }))
        }
        
        doc.entitys = entitys
        let svcNew = svc.clone(); // Clone service URL and token
        // js code
        
        let resNew = await svcNew.updateMap({
            mapid: vjmap.getTempMapId(), // Temp map expiry in minutes when not viewed; default 30
            filedoc: JSON.stringify(doc),
            mapopenway: vjmap.MapOpenWay.Memory, // GeomRender looks better but slower
            deleteOldVersion: true, // Delete previous versions
            style: {
                backcolor: 0, // Use 0xFFFFFF if div background is light
                clipbounds: map.getGeoBounds(1.0).toArray()
            }
        })
        
        let tiles = svcNew.rasterTileUrl(resNew);
        map.addRasterSource("mapDrawSource", {
            type: "raster",
            tiles: [tiles],
            tileSize: 256
        });
        map.addRasterLayer("mapDrawLayer", "mapDrawSource");
        
        let mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "top-left");
        
        
        // If drawing on blank map, use the following code:
        /*
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let templateMapId = "sys_symbols";
        let templateMapIdVer = "v1";
        let doc = new vjmap.DbDocument();
        doc.from = `${templateMapId}/${templateMapIdVer}`;
        doc.isClearFromDb = true;
        let entitys = [];
        let blockIds = ["25B"] // Open in memory mode to get objectid
        for(let bid of blockIds) {
            let point  = [vjmap.randInt(0, 1000), vjmap.randInt(-100, 100)]; // Random point
            entitys.push(new vjmap.DbBlockReference({
                cloneObjectId: bid,
                position: point,
                matrix: [{ op: "scale", scale: 0.1, origin: point }]
            }))
        }
        let lineIds = ["40D"] // Open in memory mode to get objectid
        for(let lnid of lineIds) {
            let points = [];
            for(let i = 0; i < 3; i++) {
                points.push([vjmap.randInt(0, 1000), vjmap.randInt(-100, 100)]);
            }
            entitys.push(new vjmap.DbPolyline({ cloneObjectId: lnid, points: points }))
        }
        doc.entitys = entitys
        let mapid = `ns_temp_30_` + svc.strMd5(JSON.stringify(doc)) // Generate filename from content
        let res = await svc.updateMap({
            mapid: mapid, // Temp map expiry in minutes; default 30
            filedoc: JSON.stringify(doc),
            mapopenway: vjmap.MapOpenWay.Memory,
            style: { backcolor: 0 } // Use 0xFFFFFF if div background is light
        })
        if (res.error) message.error(res.error);
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let map = new vjmap.Map({
            container: 'map',
            style: svc.rasterStyle(),
            center: prj.toLngLat(mapExtent.center()),
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        await map.onLoad();
        let mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "top-left");
        */
        
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