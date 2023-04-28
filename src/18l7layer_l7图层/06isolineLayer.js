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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/l7layer/06isolineLayer
        // --等值线图层--
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: [ 102.597971, 23.110479 ],
            zoom: 13.34, // 中心点
            pitch: 60,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
        
        
        let mousePositionControl = new vjmap.MousePositionControl({
            showZoom: true,
            showLatLng: true
        });
        map.addControl(mousePositionControl, "bottom-left");
        
        await map.onLoad();
        
        // 下面增加l7的库，L7的用法，可参考L7官方地址 https://l7.antv.vision/zh
        if (typeof L7 !== "object") {
            // 如果没有deck环境
            await vjmap.addScript({
                src: "../../js/l7.js"
            });
        
        }
        // 下面生成l7的场景
        const scene = new vjmap.Scene(L7, map);
        
        scene.on('loaded', () => {
            fetch('https://gw.alipayobjects.com/os/rmsportal/ZVfOvhVCzwBkISNsuKCc.json')
                .then(res => res.json())
                .then(data => {
                    console.log(data)
                    const layer = new L7.LineLayer({})
                        .source(data)
                        .size('ELEV', h => {
                            return [ h % 50 === 0 ? 1.0 : 0.5, (h - 1300) * 0.2 ];
                        })
                        .shape('line')
                        .scale('ELEV', {
                            type: 'quantize'
                        })
                        .color('ELEV', [
                            '#094D4A',
                            '#146968',
                            '#1D7F7E',
                            '#289899',
                            '#34B6B7',
                            '#4AC5AF',
                            '#5FD3A6',
                            '#7BE39E',
                            '#A1EDB8',
                            '#CEF8D6'
                        ]);
                    scene.addLayer(layer);
                });
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