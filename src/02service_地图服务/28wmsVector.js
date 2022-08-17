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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/28wmsVector
        // --WMS叠加矢量图形--通过wms服务，把两个图形通过矢量瓦片叠加到一起
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        svc.setCurrentMapParam({
            darkMode: true // 由于没有打开过图，所以主动设置黑色模式
        })
        // 获取地图的范围，新建一个地图，设置传入地图的范围
        let mapBounds = '[-10000,-10000,80000,80000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },// 矢量瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        // 先获取地图元数据来获取图层样式
        // 图层1
        let cadMapId = "sys_hello"
        let style = await svc.createStyle({
            backcolor: 0 // 深色主题
        }, cadMapId)
        let wmsurl = svc.wmsTileUrl({
            mapid: cadMapId,
            version:"v1",
            layers: style.stylename,
            mapbounds: mapBounds,
            mvt: true
        })
        let vstyle = svc.vectorStyle(wmsurl, 0, 24, "wms")
        let sourceName = Object.keys(vstyle.sources)[0]
        map.addSource(sourceName, vstyle.sources[sourceName]);
        for(let layer of vstyle.layers) {
            map.addLayer(layer)
        }
        
        // 图层2
        let cadMapId2 = "sys_world"
        let style2 = await svc.createStyle({
            backcolor: 0 // 深色主题
        }, cadMapId2)
        let wmsurl2 = svc.wmsTileUrl({
            mapid: cadMapId2,
            version:"v1",
            layers: style2.stylename,
            mapbounds: mapBounds,
            fourParameter: "-35000,0,1,0",// 可以用四参数调节位置
            mvt: true
        })
        let vstyle2 = svc.vectorStyle(wmsurl2, 0, 24, "wms2")
        let sourceName2 = Object.keys(vstyle2.sources)[0]
        map.addSource(sourceName2, vstyle2.sources[sourceName2]);
        for(let layer of vstyle2.layers) {
            map.addLayer(layer)
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