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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/26getFontsCapacity
        // --Get all vector fonts supported by service--
        // Map service
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Create geometric projection from map extent
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // raster style
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 2, // set map zoom level
            renderWorldCopies: false // do not show world copies
        });
        
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        // Get all vector fonts supported by service
        let { fonts } = await svc.getFontsCapacity();
        const popup = new vjmap.Popup({ closeOnClick: false, closeButton: true, anchor: "bottom" });
        popup.setHTML('All vector fonts supported by service:<br/>' + fonts.join("; "))
            .setLngLat(map.getCenter())
            .addTo(map);
        
        
        
        const mapBounds = map.getGeoBounds(0.6);
        const geoDatas = []
        let fontExpr = ["match", ["get", "font"]];
        for(let i = 0; i < fonts.length; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name:  `Label ID:${i + 1}, Font: ${fonts[i]}`,
                    font: fonts[i]
                }
            }
            geoDatas.push(data);
            fontExpr.push(fonts[i]);
            fontExpr.push(["literal", [fonts[i]]]);
        }
        fontExpr.push(["literal", ['Arial Unicode MS Regular', 'Open Sans Regular']]);
        // Icon
        await map.loadImageEx("customMarker", env.assetsPath + "images/sensor4.png");
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            iconImage: "customMarker",
            iconOffset: [0, -34],
            textField: ['get', 'name'],
            textFont: fontExpr,
            textSize: 14,
            textColor: '#FFA0FD',
            textOffset: [0, 0.5],
            textAnchor: 'top',
            iconAllowOverlap: true,
            textAllowOverlap: true
        });
        symbols.addTo(map);
        
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