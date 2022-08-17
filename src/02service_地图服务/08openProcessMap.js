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
        // --图形处理合成新的图形--通过将图形列表处理后，再合成一个新的图形
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 组合成新的图,将sys_world图进行一定的处理后，再与sys_hello进行合成，生成新的地图文件名
        let rsp = await svc.composeNewMap([
            {
                mapid: "sys_world", // 地图id
                layers: ["经纬度标注","COUNTRY"], // 要显示的图层名称列表
                clipbounds: [10201.981489534268, 9040.030491346213, 26501.267379,  4445.465999], // 要显示的范围
                fourParameter: [0,0,2,0] // 对地图进行四参数转换计算
            },
            {
                mapid: "sys_hello"
            }
        ])
        if (!rsp.status) {
            message.error(rsp.error)
        }
        // 返回结果为
        /*
        {
            "fileid": "pd1ddd8e2296",
            "mapdependencies": "sys_world||sys_hello",
            "mapfrom": "sys_world&&v1&&[20201.981489534268,9040.030491346213,31308.49673394777,19968.8414918491]&&0&&[-196.98,19477.19,0.290252,-1.397]&&&&&&&&00A0||sys_hello&&v5&&&&0&&&&&&&&&&",
            "status": true
        }
         */
        let res = await svc.openMap({
            mapid: "compose_helloword", // 取个新的地图名称
            ...rsp, // 把返回值做为参数传递打开
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style:  vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
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