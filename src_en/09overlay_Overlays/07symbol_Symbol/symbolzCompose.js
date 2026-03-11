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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolzCompose
        // --Composite symbol text--
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
            zoom: 2, // set zoom level,
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        map.fitMapBounds();
        await map.onLoad();
        
        // icon
        for(let i = 1; i <= 2; i++) {
            await map.loadImageEx("sensortext" + i, env.assetsPath + `images/sensortext${i}.png`, {
                // Horizontal stretch: two columns (except corners); x:7-15 and x:54-62
                stretchX: [
                    [7, 15],
                    [54, 62]
                ],
                // Vertical stretch: row between y:3 and y:19
                stretchY: [[3, 19]],
                // Content area for text [x1, y1, x2, y2]:
                content: [7, 3, 62, 19]
            });
        }
        
        const mapBounds = map.getGeoBounds(0.6);
        const geoDatas = []
        for(let i = 0; i < 1000; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name:  `ID:${i + 1}`,
                    icon: i < 10 ? 'sensortext1': 'sensortext2'
                }
            }
            geoDatas.push(data);
            //new vjmap.Marker().setLngLat(map.toLngLat(pt)).addTo(map);
        }
        const symbolTexts = new vjmap.Symbol({
            data: geoDatas,
            iconImage: ['get', 'icon'],
            textField: ['get', 'name'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 18,
            textColor: '#FFFFFF',
            iconTextFit: "both",
            iconAllowOverlap: false,
            textAllowOverlap: false,
            iconOffset: [0, -58],
            textTranslate: [0, -58],
            textTranslateAnchor: "viewport",
            iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        symbolTexts.addTo(map);
        
        symbolTexts.clickLayer(e => message.info(`Clicked ${e.features[0].id} , name ${e.features[0].properties.name}, icon ${e.features[0].properties.icon}`))
        symbolTexts.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Icon: ${f.properties.icon}`, { anchor: 'bottom' });
        
        
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