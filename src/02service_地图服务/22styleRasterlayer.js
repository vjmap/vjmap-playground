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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22styleRasterlayer
        // --自定义后台栅格样式--通过表达式来控制后台栅格样式
        // js代码
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: sys_world,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        })
        window.map = map;
        
        document.body.style.background = "#022B4F"
        // 更改样式
        const updateStyle = () => {
            map.updateStyle(svc, {
                name: "style1",
                layeron: "",
                layeroff: [1],
                clipbounds: "",
                backcolor: 0,
                expression: "var color := gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);"
            })
        }
        
        updateStyle();
        map.on("load", () => updateStyle())
        
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