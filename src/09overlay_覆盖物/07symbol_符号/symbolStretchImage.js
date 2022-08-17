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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolStretchImage
        // --可拉伸的文本背景图片--
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
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        const geoDatas = []
        for(let i = 0; i < 1000; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name:  `ID:${i + 1}` + (i % 2 == 1 ? `\n索引:${i + 1}` : "")
                }
            }
            geoDatas.push(data);
        }
        // 图标
        await map.loadImageEx("stretchTextBackImg", env.assetsPath + "images/textback.png", {
            // 可以水平拉伸的两列像素设置：(除了两边和中间两角形的部分，其他两部分都能拉伸)
            //-可以拉伸x:7和x:32之间的像素
            //-可以拉伸x:42和x:62之间的像素。
            stretchX: [
                [7, 32],
                [42, 62]
            ],
            // 可以垂直拉伸的一行像素设置：
            // y:3和y:19之间的像素可以拉伸
            stretchY: [[3, 19]],
            //图像的这一部分可以包含文本（[x1，y1，x2，y2]）：
            content: [7, 3, 62, 19]
        });
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            iconImage: "stretchTextBackImg",
            textField: ['get', 'name'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 14,
            textColor: '#FFFFFF',
            iconTextFit: "both",
            iconAllowOverlap: false,
            textAllowOverlap: false
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