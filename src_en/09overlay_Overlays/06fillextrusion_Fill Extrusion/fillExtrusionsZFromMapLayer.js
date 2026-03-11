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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/fillextrusion/fillExtrusionsZFromMapLayer
        // --Extrude polylines from map layer--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), //
            center: prj.toLngLat(center),
            zoom: 2,
            pitch: 60,
            antialias: true, // antialias
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6)
        let len = mapBounds.width() / 1000;
        let geoDatas = [];
        
        // Convert polyline to polygon
        const polylineToPolygon = (path, len) => {
            return vjmap.polylineMarginToPolygon(path, {offset: len});
        }
        // Entity type ID to name mapping
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        
        const queryLayerFeatures = async () => {
            let queryEntTypeId1 = getTypeNameById("AcDbPolyline");
            let queryEntTypeId2 = getTypeNameById("AcDbLine");
            let query = await svc.conditionQueryFeature({
                condition: `(name='${queryEntTypeId1}' or name='${queryEntTypeId2}') and layerindex =21`, // SQL WHERE condition; see "server condition/expression query" docs for fields
                fields: "",
                limit: 100000 // large limit to fetch all; default is 100
            })
            if (query.error) {
                message.error(query.error)
            } else {
                message.info(`Query matched count: ${query.recordCount}`)
        
                if (query.recordCount > 0) {
                    for(var i = 0; i < query.result.length; i++) {
                        let points = query.result[i].points;// get all line coordinates
                        let geoPoints = points.split(";").map(p => vjmap.GeoPoint.fromString(p))
                        let polygon = polylineToPolygon(geoPoints, len)
                        geoDatas.push({
                            points: map.toLngLat(polygon),
                            properties: {
                                name: "line" + (i + 1),
                                color: vjmap.randomColor(),
                                baseHeight: 0,
                                points: points,
                                geoPoints: geoPoints,
                                polygon: polygon,
                                height:map.pixelToHeight(10, 1) // 10px height at zoom level 1
                            }
                        })
                    }
                }
            }
        }
        
        
        await queryLayerFeatures()
        let fillExtrusions = new vjmap.FillExtrusion({
            data: geoDatas,
            // When hover use red; otherwise use 'color' from properties
            fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillExtrusionOpacity: 0.8,
            fillExtrusionHeight:['get', 'height'],
            fillExtrusionBase: ['get', 'baseHeight'],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        fillExtrusions.addTo(map);
        fillExtrusions.clickLayer(e => console.log(e.features[0]))
        
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