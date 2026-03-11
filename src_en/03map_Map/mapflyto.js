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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/mapflyto
        // --Fly to map position--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div is dark
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 2, // set zoom level
            renderWorldCopies: false // do not show world copies
        });
        
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        
        await map.onLoad();
        
        // fly with default options to null island
        //map.flyTo({center: [0, 0], zoom: 9});
        // using flyTo options
        map.flyTo({
            essential: true, // animation is essential and not reduced by performance
            center: [0, 0],
            zoom: 9,
            pitch: 60,
            bearing: 30,
            speed: 0.2,
            curve: 1,
            easing(t) {
                return t;
            }
        });
        
        map.on('moveend', ({ originalEvent }) => {
            if (originalEvent) {
                console.log('usermoveend');
            } else {
                console.log('flyend');
            }
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