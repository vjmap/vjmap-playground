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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/08openProcessMap
        // --Compose new map from processed maps--Process a list of maps and compose into one new map
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Compose new map: process sys_world then merge with sys_hello to produce new map
        let rsp = await svc.composeNewMap([
            {
                mapid: "sys_world", // Map id
                // Optional: layers, clipbounds, fourParameter for processing
                //layers: ["latlon labels","COUNTRY"], // Layers to show
                //clipbounds: [10201.981489534268, 9040.030491346213, 26501.267379,  4445.465999], // Extent to show
                //fourParameter: [0,0,2,0] // Four-parameter transform
            },
            {
                mapid: "sys_hello"
            }
        ])
        if (!rsp.status) {
            message.error(rsp.error)
        }
        // Response example:
        /*
        {
            fileid: "pefbe7459b06",
            mapdependencies: "sys_world||sys_hello",
            mapfrom: "sys_world&&v1&&&&0&&&&&&&&&&&&10||sys_hello&&v1&&&&0&&&&&&&&&&&&2",
            status: true
        }
         */
        let res = await svc.openMap({
            mapid: "composeHelloWord", // New map name
            fileid: rsp.fileid,
            //mapdependencies: rsp.mapdependencies, // Pass to open; enable for collaborative map
            //mapfrom: rsp.mapfrom, // Pass to open; enable for collaborative map
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style:  vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        await map.onLoad();
        
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