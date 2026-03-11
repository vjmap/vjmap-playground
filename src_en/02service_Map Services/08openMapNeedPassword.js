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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/08openMapNeedPassword
        // --Open password-protected map--Requires password or AccessKey to access
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        // Set password before open to avoid prompt: secretKey has full permission; do not expose it
        // let secretKey = 'xxxxxxx'; // Get from console: svc.pwdToSecretKey("your password");
        //svc.addSecretKey(secretKey);
        
        // Or set accessKey before open (accessKey has limited permission, can share with viewers)
        //svc.addAccessKey("akxxxxxxxxxxxxxxxx")
        
        // Open map
        let res = await svc.openMap({
            mapid: "sys_zp", // Use your password-protected map id
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle(), // Use dark style when div has dark background
            // If cbInputPassword not provided, default prompt is used
            cbInputPassword: async (param) => {
                if (param.tryPasswordCount > 3) return ''; // After 3 retries
                // Custom password input (e.g. your UI lib); vjgui used here as example
                return new Promise((resolve) => {
                    vjgui.init();
                    vjgui.prompt(`<span style="color: whitesmoke;">Enter password or AccessKey</span>`, e=>{
                        resolve(e)
                    }, {
                        value: "",
                        title: `Map ${param.mapid}`,
                        width: "200px",
                        height: "150px"
                    })
                })
        
            }
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map instance
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // Raster tile style
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        // Enable click highlight (element highlights when clicked)
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
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