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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zinsertoutmapzentdirect
        // --Load external map entities by coordinate--Insert external map elements at given coordinates (load as GeoJSON, front-end draw)
        // Note: This example uses vjcommon library for common vjmap features. Add vjcommon.min.js in HTML or: npm install vjcommon, import vjcommon from 'vjcommon'
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
        
        const draw = map.getDrawLayer();
        // Add a symbol at position
        let pos = mapBounds.randomPoint() // Random point
        
        let templateMapId = "sys_symbols";
        let templateMapIdVer = "v1";
        // Get layerindex and objectid: open sys_symbols in cloud platform, click entity, see property panel
        let createEntPromise = []
        let param = {
            mapid: templateMapId,  // Symbol source map id
            version: templateMapIdVer,  // Symbol source map version
            condition: 'layerindex=2', // Condition to filter symbol
            position: pos, // Draw position
            // scaleValue: 1, // Scale
            // angleValue: 0, // Rotation angle
        };
        
        let res1 = vjcommon.createOutSymbol(map, draw, {}, {
            disableScale: true, // Disable interactive scale
            disableRotate: true,// Disable interactive rotate
            keepGeoSize: true, // Keep original symbol size
            // unCombineFeature: true // Do not auto-combine into new entity
        }, null, param);
        createEntPromise.push(res1);
        
        // Create a line at position
        let linePoints = [];
        // Generate three points for the line
        for(let i = 0; i < 3; i++) {
            linePoints.push( mapBounds.randomPoint())
        }
        
        param = {
            mapid: templateMapId,  // Symbol source map id
            version: templateMapIdVer,  // Symbol source map version
            // linetypeScale: 100, // Linetype scale
            objectid: '40D', // Linetype line objectid
            coordinates: linePoints // Coordinates
        };
        let res2 = vjcommon.createLineTypePolyline(map, draw, {}, {
            // "color": "#ff0000",// color
            //"line_width": 1, // line width
        },null, param);
        createEntPromise.push(res2);
        
        // Create a curve at position
        let curvePoints = [];
        // Generate three points for the line
        for(let i = 0; i < 3; i++) {
            curvePoints.push( mapBounds.randomPoint())
        }
        
        param = {
            mapid: templateMapId,  // Symbol source map id
            version: templateMapIdVer,  // Symbol source map version
            // linetypeScale: 100, // Linetype scale
            objectid: '40E', // Linetype line objectid
            coordinates: curvePoints, // Coordinates
            isCurve: true, // Is curve; template should also be curve entity
            curveUseControlPoints: false, // false = fitPoints; true = controlPoints
        };
        let res3 = vjcommon.createLineTypePolyline(map, draw, {}, {
            // "color": "#ff0000",// color
            //"line_width": 1, // line width
        },null, param);
        createEntPromise.push(res3);
        
        
        // Create fill symbol at position
        let fillPoints = [];
        // Random three points
        for(let i = 0; i < 3; i++) {
            fillPoints.push( mapBounds.randomPoint())
        }
        
        param = {
            mapid: templateMapId,  // Symbol source map id
            version: templateMapIdVer,  // Symbol source map version
            objectid: '426', // Hatch objectid
            // patternScale: 400, // Fill pattern scale
            coordinates: fillPoints // Coordinates
        };
        let res4 = vjcommon.createHatch(map, draw, {}, {
            // "color": "#ff0000",// color
        },null, param);
        createEntPromise.push(res4);
        
        // When all created
        await Promise.all(createEntPromise);
        
        draw.changeMode('static');  // Edit mode simple_select
        
        
        /*
         // Add leader note to map: draw a leader in CAD as template, then clone into map
         let pos1 = mapBounds.randomPoint()
         let tempId = "cee2f5f808ee"
         let dbEnt = new vjmap.DbMLeader()
         dbEnt.cloneFromDb = tempId + "/v1"
         dbEnt.cloneObjectId = "222" // Leader objectid: open in cloud platform to view
         dbEnt.contents = "190.00"
         dbEnt.matrix = [{ op: "translation", vector: [pos1.x - 2098.7074, pos1.y - 1483.1797] }] // [2098.7074,1483.1797] original leader position
         dbEnt.textRotation = Math.PI / 2
         let data = await vjcommon.createGeomData(map, [dbEnt], null, null, null, { mapid: tempId, version: "v1" }, undefined);
         vjcommon.addFeaturesToDraw(data, draw);
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