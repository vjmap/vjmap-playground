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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbol
        // --Symbol icon--
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
        
        for (let i = 0; i < 4; i++) {
            await map.loadImageEx("icon" + i, env.assetsPath + `images/sensor${i + 1}.png`);
        }
        
        const mapBounds = map.getGeoBounds(0.6);
        const geoDatas = []
        for (let i = 0; i < 50; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name: `ID:${i + 1}`,
                    icon: "icon" + vjmap.randInt(0, 3)
                }
            }
            geoDatas.push(data);
        }
        
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            // Icon name from geojson properties.icon
            iconImage: ['get', 'icon'],
            // Use icon1 below zoom 2, otherwise use icon from properties
            //iconImage: ["step", ["zoom"], "icon1", 2, ['get', 'icon']],
            iconOffset: [0, -12],
            // opacity 0.8 on hover, 1.0 otherwise
            iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 1.0],
            textField: ['get', 'name'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 14,
            textColor: '#FFA0FD',
            textOffset: [0, 0.5],
            textAnchor: 'top',
            iconAllowOverlap: false,
            textAllowOverlap: false,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        symbols.addTo(map);
        symbols.clickLayer(e => {
            if (e.defaultPrevented) return; // skip if default prevented
            message.info(`Clicked ${e.features[0].id} , name ${e.features[0].properties.name}, icon`)
            e.preventDefault(); // Prevent subsequent event handling
        })
        
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