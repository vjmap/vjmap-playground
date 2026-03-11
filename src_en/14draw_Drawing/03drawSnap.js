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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/03drawSnap
        // --Snap to map coordinates--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // if open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style vectorStyle
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set zoom level
            pitch: 0, // pitch angle
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        
        let snapObj = {}; // snap entities, assign via features
        const draw = new vjmap.Draw.Tool({
            api: {
                getSnapFeatures: snapObj // snap data assigned to features property
            }
        });
        map.addControl(draw, 'top-right');
        
        // Get snap points
        if (map.hasVectorLayer()) {
            // vector style: get snap points from rendered features
            snapObj.features = map.queryRenderedFeatures({layers: ['vector-layer-lines']})
        } else {
            // raster style: get coordinate data from server
            // query all coordinate data; see https://vjmap.com/guide/svrStyleVar.html
            let res = await svc.conditionQueryFeature({ fields:"s3", condition:"s3 != ''", limit: 100000})
            res = res.result.map(e => e.s3.split(";"))
            snapObj.features = []
            for(let item of res) {
                let coordinates = []
                for(let pt of item) {
                    const p = pt.split(",")
                    if (p.length >= 2) {
                        coordinates.push(map.toLngLat([+p[0], +p[1]]))
                    }
                }
                if (coordinates.length == 1) {
                    snapObj.features.push({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: coordinates[0]
                        }
                    })
                }
                else if (coordinates.length > 1) {
                    snapObj.features.push({
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: coordinates
                        }
                    })
                }
        
            }
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