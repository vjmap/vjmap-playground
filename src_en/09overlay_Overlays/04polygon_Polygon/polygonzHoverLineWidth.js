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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polygon/polygonzHoverLineWidth
        // --Polygon hover line width--
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
            style: svc.rasterStyle(), // style, raster here
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        //map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds(0.3);
        
        let len = mapBounds.width() / 40;
        let polygonDatas = []
        for(let i = 0; i < 50; i++) {
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x - len, p1.y - len]);
            const p3 = vjmap.geoPoint([p1.x - len, p1.y + len]);
            const p4 = vjmap.geoPoint([p1.x + len, p1.y + len]);
            const p5 = vjmap.geoPoint([p1.x + len, p1.y - len]);
            polygonDatas.push({
                points: map.toLngLat([p2, p3, p4, p5, p2]),
                properties: {
                    id: i + 1,
                    name: "polygon" + (i + 1),
                    color: vjmap.randomColor()
                }
            })
        }
        
        
        let polygon = new vjmap.Polygon({
            data: polygonDatas,
            fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillOpacity: 0.5,
            fillOutlineColor: "#ff0",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polygon.addTo(map);
        polygon.hoverFeatureState(e => {
            if (e.features) {
                // When over polygon, show line-width highlight
                // Get original data from source by id. Cannot use geometry directly because one GeoJSON feature may be split into multiple tiles; store coordinates in a property and read from it here if needed
                let featureData = map.getSourceData(e.features[0].source).features.filter(f => f.id === e.features[0].id);
                showHideWidthHoverPolyline(true, featureData[0].geometry.coordinates[0])
            }
        }, () => {
            // When not over polygon, hide line-width highlight
            showHideWidthHoverPolyline(false)
        })
        let hoverWidthPolyline;
        // show/hide highlight line
        const showHideWidthHoverPolyline = (visible, coords) => {
            if (visible) {
                if (hoverWidthPolyline) {
                    hoverWidthPolyline.setData(coords) // update coords only
                    return;// already added
                }
                // first time create
                hoverWidthPolyline= new vjmap.Polyline({
                    data: coords,
                    lineWidth: 5,
                    lineColor: "#ff0"
                })
                hoverWidthPolyline.addTo(map);
        
            } else {
                if (!hoverWidthPolyline) return;// already removed
                hoverWidthPolyline.setData([]); // clear data
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