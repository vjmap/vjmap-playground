const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/fillextrusion/fillextrusion
        // --Extrusion polygon--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set map zoom level,
            pitch: 60, // pitch angle
            antialias: true, // antialias
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        
        await map.loadImageEx("buildtexture", env.assetsPath + "images/buildtexture.png");
        await map.loadImageEx("buildtexture2", env.assetsPath + "images/buildtexture2.png");
        const mapBounds = map.getGeoBounds(0.6);
        let len1 = mapBounds.width() / 100;
        let len2 = mapBounds.width() / 200;
        let len3 = mapBounds.width() / 300;
        let geoDatas = [];
        let geoPatternDatas = []
        for (let i = 0; i < 100; i++) {
            const c = mapBounds.randomPoint();
            const radius = vjmap.randInt(len1, len2);
            let startAngle = 0;
            let endAngle = 360;
            if (i % 2 === 0) {
                // Even index: generate arc
                startAngle = vjmap.randInt(0, 360);
                endAngle = vjmap.randInt(0, 360);
            }
            const cirleArcPath = vjmap.getCirclePolygonCoordinates(c, radius, 360, startAngle, endAngle);
            geoPatternDatas.push({
                points: map.toLngLat(cirleArcPath),
                properties: {
                    name: "circle" + (i + 1),
                    color: vjmap.randomColor(),
                    type: "circle",
                    pattern: i % 2 === 0 ? "buildtexture" : "buildtexture2",
                    baseHeight: vjmap.randInt(1000000, 1200000),
                    height: vjmap.randInt(1500000, 2000000)
                }
            })
        }
        
        for (let i = 0; i < 100; i++) {
            const c = mapBounds.randomPoint();
            const majorAxis = vjmap.randInt(len1, len2);
            const minorAxis = vjmap.randInt(len2, len3);
            let startAngle = 0;
            let endAngle = 360;
            if (i % 2 === 0) {
                // Even index: generate arc
                startAngle = vjmap.randInt(0, 360);
                endAngle = vjmap.randInt(0, 360);
            }
            const ellipseArcPath = vjmap.getEllipsePolygonCoordinates(c, majorAxis, minorAxis, 360, startAngle, endAngle);
            geoDatas.push({
                points: map.toLngLat(ellipseArcPath),
                properties: {
                    name: "ellipse" + (i + 1),
                    color: vjmap.randomColor(),
                    type: "ellipse",
                    baseHeight: 0,
                    height: vjmap.randInt(1000000, 2000000)
                }
            })
        }
        
        for (let i = 0; i < 100; i++) {
            const isSquare = vjmap.randInt(0, 1);
            const pts = []
            const len = vjmap.randInt(len1, len3);
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
            const p3 = vjmap.geoPoint([p1.x + len, p1.y + len]);
            pts.push(p1, p2, p3);
            if (isSquare) {
                pts.push(vjmap.geoPoint([p1.x + len, p1.y]));
            }
            geoDatas.push({
                points: map.toLngLat(pts),
                properties: {
                    name: isSquare ? "square" : "triangle" + (i + 1),
                    color: vjmap.randomColor(),
                    type: isSquare ? "square" : "triangle",
                    baseHeight: 0,
                    height: vjmap.randInt(1000000, 2000000)
                }
            })
        }
        
        for (let i = 0; i < 100; i++) {
            const pts = []
            const p1 = mapBounds.randomPoint().toArray();
            const p2 = [p1[0] + vjmap.randInt(len2, len3), p1[1] + vjmap.randInt(len2, len3)];
            const p3 = [p2[0] + vjmap.randInt(len2, len3), p2[1] - vjmap.randInt(len2, len3)];
            // Convert curve points to Bezier curve params
            const c = vjmap.polylineToBezierCurve([p1, p2, p3]);
            // Discretize Bezier to polyline
            const curvePath = vjmap.bezierCurveToPolyline(c);
            geoDatas.push({
                points: map.toLngLat(curvePath),
                properties: {
                    name: "curve" + (i + 1),
                    color: vjmap.randomColor(),
                    type: "curve",
                    baseHeight: 0,
                    height: vjmap.randInt(1000000, 2000000)
                }
            })
        }
        
        let fillExtrusions = new vjmap.FillExtrusion({
            data: geoDatas,
            // When hover use red; otherwise use 'color' from properties
            fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillExtrusionOpacity: 1,
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'baseHeight'],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        fillExtrusions.addTo(map);
        fillExtrusions.clickLayer(e => message.info(`You clicked #${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}, type: ${e.features[0].properties.type}`))
        fillExtrusions.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        
        let fillPatternExtrusions = new vjmap.FillExtrusion({
            data: geoPatternDatas,
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'baseHeight'],
            fillExtrusionPattern: ["get", "pattern"], // Pattern image width/height must be power of 2 (2, 4, 8, ..., 512)
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        fillPatternExtrusions.addTo(map);
        fillPatternExtrusions.clickLayer(e => message.info(`You clicked pattern #${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}, type: ${e.features[0].properties.type}`))
        fillPatternExtrusions.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        
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