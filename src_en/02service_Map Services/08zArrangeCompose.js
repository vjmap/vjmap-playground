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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/08zArrangeCompose
        // --Arrange and compose maps into new map--Arrange multiple maps into one new map
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Compose the four maps in 2x2 layout
        let mapIds = ['sys_zp', 'sys_world', 'sys_stats', "sys_topo"];
        // New map extent assumed 0,0,20000,20000
        const newMapLength = 20000;
        // Get metadata and bounds for each map
        const col = 2;
        const cellMapColLength = newMapLength / col;
        const cellMapRowLength = newMapLength / Math.ceil( mapIds.length / col);
        
        
        let newMapParams = []; // New map params
        let mapFourParam = {}; // Four-param per map for coordinate transform into new map
        let addMarkers = []; // Center point of each map to draw in new map
        for(let i = 0; i < mapIds.length; i++) {
            let metadata = await svc.metadata(mapIds[i]);
            let bounds = vjmap.GeoBounds.fromString(metadata.bounds);
            bounds = bounds.scale(+metadata.initViewScale * 1.1); // Slightly larger than initial view
            // Four-param: match source top-left/bottom-right to dest; need at least 2 points
            let srcPoints = [
                bounds.min,
                bounds.max
            ];
        
            const curRow = Math.floor(i / col);
            const curCol = i % col;
            let destMin = [cellMapColLength * curCol, newMapLength - cellMapRowLength * (curRow + 1)];
            let destMax = [cellMapColLength * (curCol + 1), newMapLength - cellMapRowLength * curRow];
            // Dest extent may not be square; use minimum square centered on rectangle center
            let newBounds = new vjmap.GeoBounds(vjmap.geoPoint(destMin), vjmap.geoPoint(destMax));
            const c = newBounds.center();
            let w = newBounds.width() < newBounds.height() ? newBounds.width() : newBounds.height();
            // Dest points corresponding to source points
            let destPoints = [
                vjmap.geoPoint([c.x - w / 2.0, c.y - w / 2.0]),
                vjmap.geoPoint([c.x + w / 2.0, c.y + w / 2.0])
            ]
        
        
            // Solve four-param from point pairs (no rotation)
            let fourparam = vjmap.coordTransfromGetFourParamter(srcPoints, destPoints, true);
        
            newMapParams.push({
                mapid: mapIds[i],
                fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate]  // (dx, dy, scale, rotate)
            })
        
            // Store each map center to draw in new map (for testing transform)
            mapFourParam[mapIds[i]] = fourparam;
            addMarkers.push({
                mapid: [mapIds[i]],
                point: bounds.center()
            })
        }
        
        let rsp = await svc.composeNewMap(newMapParams)
        if (!rsp.status) {
            message.error(rsp.error)
        }
        let res = await svc.updateMap({
            mapid: "composearrange", // New map name
            fileid: rsp.fileid, // Pass return value to open; add ...rsp for collaborative map
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style:  vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        await map.onLoad();
        
        
        // Draw each map center in the new coordinate system
        for(let m of addMarkers) {
            let fourParam = mapFourParam[m.mapid];
            let newPoint = vjmap.coordTransfromByFourParamter(m.point, fourParam);
            new vjmap.Marker({color: vjmap.randomColor()})
                .setLngLat(map.toLngLat(newPoint))
                .addTo(map);
        }
        
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
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