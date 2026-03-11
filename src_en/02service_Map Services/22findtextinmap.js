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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findtextinmap
        // --Find and locate text in related drawings--Find and locate text in related drawings
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        
        message.info({
            content: `Click any text on the map; if similar text exists in related drawings, it will locate to that position`,
            key: "textclick",
            duration: 3
        })
        
        // Map IDs to search for text
        let findTextMapIds = ['sys_zp', 'sys_webwms'];
        let mapIdTextInfo = {};
        // On map element click: find similar text in other maps and locate
        map.enableLayerClickHighlight(svc, async (e) => {
            if (!e) return;
        
            // If clicked on text (single-line, multiline, block, attribute)
            if (e.name === "AcDbText" || e.name === "AcDbMText" || e.name === "AcDbAttributeDefinition" || e.name === "AcDbAttribute") {
                let text = e.text; // get text content
                let curMapId = map.getService().currentMapParam().mapid;
                // Find similar text in other maps and jump to that position
                let findText = findTextInMaps(text, curMapId)
                if (!findText) {
                    message.info({
                        content: `No similar text found in other maps, try another: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                        key: "textclick",
                        duration: 3
                    })
                    return
                }
                console.log(findText)
                await map.switchMap({
                    mapid: findText.mapId,
                    style: vjmap.openMapDarkStyle()
                });
        
                // Locate to text position in that map
                let bounds = map.getEnvelopBounds(findText.text.envelop);
                map.fitBounds(map.toLngLat(bounds))
                await flashPos(bounds)
        
            }
        })
        
        // Get text info for each map
        const queryMapText = async (mapId) => {
            let style = await svc.createStyle({ backcolor: 0 }, mapId)
            let query = await svc.conditionQueryFeature({
                mapid: mapId,
                layer: style.stylename,
                // Query all text (single-line, multiline, block, attribute); see docs for CAD entity types
                condition: `name='12' or name='13' or name='26' or name='27'`,
                fields: "objectid,name,text,envelop",
                limit: 100000 // get all
            })
            if (query.error) {
                message.error(query.error)
            } else {
                mapIdTextInfo[mapId] = query.result
            }
        }
        // Get text bounds and content from backend
        for(let m of findTextMapIds) {
            await queryMapText(m)
        }
        
        // Find similar text in other maps
        const findTextInMaps =  (text, curMapID)=> {
            for(let m = 0; m < findTextMapIds.length; m++) {
                let mid = findTextMapIds[m];
                if (mid=== curMapID) continue;
                let texts = mapIdTextInfo[mid];
                if (!texts) continue;// no text in map
                for(let t = 0; t < texts.length; t++) {
                    // Similarity: any char of text appears in target
                    let r = text.split("").findIndex(a => a && texts[t].text.indexOf(a) >= 0)
                    if (r >= 0) return {
                        mapId: mid,
                        text: texts[t]
                    }
                }
            }
            return null;
        }
        
        
        const flashPos = (bounds) => {
            return new Promise((resolve => {
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