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
        // --获取服务支持的所有矢量字体--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), //svc.rasterBlankStyle(0, 24), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        await map.onLoad();
        // 获取服务所支持的所有矢量字体
        let { fonts } = await svc.getFontsCapacity();
        const popup = new vjmap.Popup({ closeOnClick: false, closeButton: true, anchor: "bottom" });
        popup.setHTML('服务所支持的所有矢量字体有:<br/>' + fonts.join("; "))
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
                    name:  `标注ID:${i + 1}, 字体名: ${fonts[i]}`,
                    font: fonts[i]
                }
            }
            geoDatas.push(data);
            fontExpr.push(fonts[i]);
            fontExpr.push(["literal", [fonts[i]]]);
        }
        fontExpr.push(["literal", ['Arial Unicode MS Regular', 'Open Sans Regular']]);
        // 图标
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