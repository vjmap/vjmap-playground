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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/text/02scalesymboltext
        // --能缩放的符号文本--这是基本symbol的文本,能缩放
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: 'sys_hello', // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: {
                backcolor: 0
            }
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
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds();
        
        const geoDatas = []
        for(let i = 0; i < 10; i++) {
            let pt = map.toLngLat(mapBounds.randomPoint());
            const data = {
                point: pt,
                properties: {
                    index: i,
                    text: 'text' + i, // 这个用来记录原来的文本内容
                    color: vjmap.randomColor()
                },
            }
            geoDatas.push(data);
        }
        
        let fontHeight =  8;
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            textField: ['get', 'text'],
            textFont: ['Arial Unicode MS Regular'],
            // 文字大小，这些用表达式，表达式的作用是根据缩放级别，会自动缩放文字大小
            textSize:  [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0, ["*", fontHeight, ["^", 2, 0]],
                24, ["*", fontHeight, ["^", 2, 24]]
            ],
            textColor: ['get', 'color'],
            textOffset: [0, -0.5],
            textAnchor: 'top',
            textRotationAlignment: "map",
            textMaxWidth: 10000000, //不自动换行
            iconAllowOverlap: true,
            textAllowOverlap: true
        });
        symbols.addTo(map);
        
        // 改变值
        let count = 0;
        const changeStatData = async () => {
            count++
            for(let i = 0; i < geoDatas.length; i++) {
                let text = geoDatas[i].properties.text; // 获取原来文本的内容
                geoDatas[i].properties.text = `text${i}(${count})`;
            }
            symbols.setData(geoDatas) ;// 改变数据
        }
        await changeStatData();
        setInterval(async () => {
            await changeStatData();
        }, 5000); //五秒刷新一次
        
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