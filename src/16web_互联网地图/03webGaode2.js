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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/03webGaode2
        // --高德地图(地图数据后端转发获取)--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 根据地图范围建立经纬度投影坐标系
        let prj = new vjmap.LnglatProjection();
        // 高德
        const tileUrl = svc.webMapUrl({
            tileCrs: "gcj02",
            tileUrl: "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
            tileSize: 256,
            tileRetina: 1,
            tileShards: "1,2,3,4",
            tileToken: "",
            tileFlipY: false
        })
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {
                    gaode: {
                        type: 'raster',
                        tiles: [tileUrl],
                    }
                },
                layers: [{
                    id: 'gaode',
                    type: 'raster',
                    source: 'gaode',
                }]
            },
            center: prj.toLngLat([116.3912, 39.9073]),
            zoom: 10,
            maxZoom: 18,
            pitch: 0,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        // 高德的坐标
        const gaoDeCoord = [116.397442,39.909188];
        // 把高德坐标转成wgs84坐标
        const co = vjmap.transform.convert(gaoDeCoord, vjmap.transform.CRSTypes.GCJ02, vjmap.transform.CRSTypes.WGS84)
        const marker = new vjmap.Marker({color: "red"})
        marker.setLngLat(co).addTo(map)
        
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