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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/text/01textSingle
        // --添加文本标记--这是基本dom的文本标记，如果数量多的文本，请用symbol来保证性能
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
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        
        let mapBounds = map.getGeoBounds();
        await map.onLoad();
        
        
        let marker = new vjmap.Marker();
        marker.setLngLat(map.getCenter()).addTo(map);
        
        let text = new vjmap.Text({
            text: "中国ABC",
            anchor: "top",
            draggable: true,
            offset: [0, 0], // x,y 方向像素偏移量
            style:{     // 自定义样式
                'cursor': 'pointer',
                'opacity': 1,
                'padding': '12px',
                'border-radius': '4px',
                'background-color': '#0ff',
                'border-width': 0,
                'box-shadow': '0px 2px 6px 0px rgba(97,113,166,0.2)',
                'text-align': 'center',
                'font-size': '14px',
                'color': '#F33'
            }
        });
        text.setLngLat(map.getCenter()).addTo(map);
        // 设置一些自定义的属性
        let customAttr = { "item": "test"};
        text.customAttr = customAttr;
        text.on('dragstart', (e) => {
            console.log("dragstart", e);
        });
        text.on('click', (e) => {
            // 获取自定义属性
            let txt = e.target;
            console.log("click", txt.customAttr.item);
        });
        text.on('mouseover', (e) => {
            console.log("mouseover", e);
        });
        text.on('mouseleave', (e) => {
            console.log("mouseleave", e);
        });
        text.on('dblclick', (e) => {
            console.log("dblclick", e);
        });
        text.on('contextmenu', (e) => {
            console.log("contextmenu", e);
        });
        text.on('mousedown', (e) => {
            console.log("mousedown", e);
        });
        text.on('mouseup', (e) => {
            console.log("mouseup", e);
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