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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolCustomText
        // --创建自定义图标--
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
        const mapBounds = map.getGeoBounds(0.6);
        
        const createImage = (index) => {
            // 创建 Canvas 元素
            let canvas = document.createElement('canvas');
            canvas.width = 200; // 设定宽度
            canvas.height = 50; // 设定高度
        
            let ctx = canvas.getContext('2d');
        
            ctx.font = '20px Arial';
        
            let text = 'Index:' + index;
            let textWidth = ctx.measureText(text).width;
        
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        
            ctx.fillStyle = 'yellow';
            ctx.fillRect(0, 0, textWidth, 50);
        
            ctx.fillStyle = 'red';
            ctx.fillText(text, 0, 20);
        
            let imageData = ctx.getImageData(0, 0, textWidth, 25);
            map.addImage('icon_' + index, imageData);
        }
        const geoDatas = []
        for(let i = 0; i < 100; i++) {
            const pt = mapBounds.randomPoint();
            createImage(i);
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name:  `ID:${i + 1}`,
                    icon: 'icon_' + i
                }
            }
            geoDatas.push(data);
        }
        
        
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            iconImage: ["get", "icon"],
            iconOffset: [0, 0],
            iconAllowOverlap: true
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