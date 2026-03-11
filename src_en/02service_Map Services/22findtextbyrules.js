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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findtextbyrules
        // --Find related text by rules--Find related entities (e.g. text) by rule-based graphics
        // js code
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        
        
        const drawDatas = []; // Format: [{point: [x,y], text: "", color: "", objectid: "", bounds: []}
        
        // Icon
        await map.loadImageEx("stretchTextBackImg", env.assetsPath + "images/textback.png", {
            // Horizontal stretch: x 7-32 and 42-62
            stretchX: [
                [7, 32],
                [42, 62]
            ],
            // Vertical stretch: y 3-19
            stretchY: [[3, 19]],
            // Text content area [x1, y1, x2, y2]
            content: [7, 3, 62, 19]
        });
        
        
        
        const queryMapText = async () => {
            let query = await svc.conditionQueryFeature({
                // Query all text (single-line, multiline, block, attribute); see docs for CAD entity types
                condition: `(name='12' or name='13' or name='26' or name='27') and ((s4 like '%.%' or LENGTH(s4) <= 2) and s4 != "." )`, // string contains decimal
                fields: "",
                limit: 100000 // get all
            })
            if (query.error) {
                message.error(query.error)
            } else {
                query.result.forEach(rst => {
                    rst.geoBounds = vjmap.GeoBounds.fromString(rst.bounds); // get bounds
                    rst.position = vjmap.GeoPoint.fromString(rst.location); // get coordinate
                })
                return  query.result;
            }
        }
        // Get text info in map
        let mapAllText = await queryMapText();
        console.log(mapAllText);
        
        // Find all text that is "."
        const queryDotText = async () => {
            let query = await svc.conditionQueryFeature({
                condition: `(name='12' or name='13' or name='26' or name='27') and (s4 == "." ) `,
                fields: "",
                limit: 100000 // get all
            })
            if (query.error) {
                message.error(query.error)
            } else {
                query.result.forEach(rst => {
                    rst.geoBounds = vjmap.GeoBounds.fromString(rst.bounds); // get bounds
                })
                return  query.result;
            }
        }
        let mapDotTexts = await queryDotText();
        console.log(mapDotTexts);
        
        // Find nearest text matching rule next to each point
        mapDotTexts.forEach(r => {
            let texts = mapAllText.filter(t => "NaN" != parseFloat(t)) // all numbers
            let findTexts = texts.filter(t => t.position.distanceTo(r.geoBounds.center()) <= t.geoBounds.width() * 2) // match condition
            // Find nearest
            if (findTexts.length > 0) {
                findTexts = findTexts.sort((a, b) => a.position.distanceTo(r.geoBounds.center()) - b.position.distanceTo(r.geoBounds.center()) )
                drawDatas.push({
                    point: r.geoBounds.center(),
                    text: findTexts[0].text,
                    color: "#0f0",
                    objectid: findTexts[0].objectid,
                    bounds: findTexts[0].geoBounds
                })
            }
        
        })
        
        // Find all circles
        const queryCircles = async () => {
            let query = await svc.conditionQueryFeature({
                condition: `name='7'`,
                fields: "",
                limit: 100000 // get all
            })
            if (query.error) {
                message.error(query.error)
            } else {
                query.result.forEach(rst => {
                    rst.geoBounds = vjmap.GeoBounds.fromString(rst.bounds); // get bounds
                    /*
                    // Debug: output width and height
                    drawDatas.push({
                        point: rst.geoBounds.center(),
                        text: rst.geoBounds.width() + "," + rst.geoBounds.height(),
                        color: "#00f"
                    })*/
        
                })
                query.result =  query.result.filter(rst => vjmap.isZero(rst.geoBounds.width() - 4000, 1) && vjmap.isZero(rst.geoBounds.height() - 4000, 1))
                return  query.result;
            }
        }
        let mapCircles = await queryCircles();
        console.log(mapCircles);
        
        // Find text inside each circle
        mapCircles.forEach(r => {
            let findTexts = mapAllText.filter(t => r.geoBounds.contains(t.position)) // text inside circle
            // Find nearest
            if (findTexts.length > 0) {
                drawDatas.push({
                    point: r.geoBounds.center(),
                    text: findTexts[0].text,
                    color: "#f0f",
                    objectid: findTexts[0].objectid,
                    bounds: findTexts[0].geoBounds
                })
            }
        
        })
        
        console.log(drawDatas)
        // Show data on map
        let symbols;
        const showDataInMap = (datas)=> {
            let geoDatas = []
            for(let i = 0; i < datas.length; i++) {
                const pt = datas[i].point;
                const data = {
                    point: map.toLngLat(pt),
                    properties: {
                        text:  datas[i].text,
                        textColor: datas[i].color,
                        objectid: datas[i].objectid,
                        bounds: datas[i].bounds.toString()
                    }
                }
                geoDatas.push(data);
            }
            if (symbols) {
                symbols.remove();// Remove existing first
            }
            symbols = new vjmap.Symbol({
                data: geoDatas,
                iconImage: "stretchTextBackImg",
                iconAnchor: "bottom",
                iconOpacity: 0.5,
                iconOffset: [-2, -10],
                textTranslate: [-2, -6],
                textAnchor: "bottom",
                textField: ['get', 'text'],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 18,
                textColor: ['get', 'textColor'],
                iconTextFit: "both",
                iconAllowOverlap: true,
                textAllowOverlap: true
            });
            symbols.addTo(map);
            // Click text to locate
            symbols.clickLayer(e => {
                flashPos(e.features[0].properties.bounds)
            })
        }
        showDataInMap(drawDatas);
        
        // Flash entity at bounds
        const flashPos = (bounds) => {
            return new Promise((resolve => {
                bounds = vjmap.GeoBounds.fromString(bounds)
                const routePath = [];
                routePath.push(bounds.min);
                routePath.push(vjmap.geoPoint([bounds.max.x, bounds.min.y]));
                routePath.push(bounds.max);
                routePath.push(vjmap.geoPoint([bounds.min.x, bounds.max.y]));
                routePath.push(bounds.min);
                let geoLineDatas = [];
                geoLineDatas.push({
                    points: map.toLngLat(routePath),
                    properties: {
                        opacity: 1.0
                    }
                })
        
                let polylines = new vjmap.Polyline({
                    data: geoLineDatas,
                    lineColor: 'yellow',
                    lineWidth: 3,
                    lineOpacity: ['get', 'opacity'],
                    isHoverPointer: false,
                    isHoverFeatureState: false
                });
                polylines.addTo(map);
        
                vjmap.createAnimation({
                    from: 1,
                    to: 10,
                    duration: 1000,
                    onUpdate: (e) => {
                        const data = polylines.getData();
                        data.features[0].properties.opacity = parseInt(e) % 2 ? 1.0 : 0 ;
                        polylines.setData(data);
                    },
                    onStop: () => {
                        polylines.remove()
                        resolve({})
                    },
                    onComplete: () => {
                        polylines.remove()
                        resolve({})
                    }
                })
            }))
        }
        
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