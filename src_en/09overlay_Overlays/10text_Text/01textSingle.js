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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/text/01textSingle
        // --Add text marker-- Basic DOM text marker; use symbol layer for many texts for performance
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
        map.fitMapBounds();
        
        let mapBounds = map.getGeoBounds();
        await map.onLoad();
        
        
        let marker = new vjmap.Marker();
        marker.setLngLat(map.getCenter()).addTo(map);
        
        let text = new vjmap.Text({
            text: "ABC",
            anchor: "top",
            draggable: true,
            offset: [0, 0], // x,y pixel offset
            style:{     // custom style
                'cursor': 'pointer',
                'opacity': 1,
                'padding': '12px',
                'border-radius': '4px',
                'background-color': '#0ff',
                'border-width': 0,
                'box-shadow': '0px 2px 6px 0px rgba(97,113,166,0.2)',
                'text-align': 'center',
                'font-size': '14px',
                'color': '#F33'
            }
        });
        text.setLngLat(map.getCenter()).addTo(map);
        // Set custom properties
        let customAttr = { "item": "test"};
        text.customAttr = customAttr;
        text.on('dragstart', (e) => {
            console.log("dragstart", e);
        });
        text.on('click', (e) => {
            // get custom attribute
            let txt = e.target;
            console.log("click", txt.customAttr.item);
        });
        text.on('mouseover', (e) => {
            console.log("mouseover", e);
        });
        text.on('mouseleave', (e) => {
            console.log("mouseleave", e);
        });
        text.on('dblclick', (e) => {
            console.log("dblclick", e);
        });
        text.on('contextmenu', (e) => {
            console.log("contextmenu", e);
        });
        text.on('mousedown', (e) => {
            console.log("mousedown", e);
        });
        text.on('mouseup', (e) => {
            console.log("mouseup", e);
        });
        
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