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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/mapcoordinate
        // --地图坐标转换--
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
        
        const addStyle = cssStyle => {
            let style = `<style>${cssStyle }</style>`;
            let ele = document.createElement('div');
            ele.innerHTML = style;
            document.getElementsByTagName('head')[0].appendChild(ele.firstElementChild)
        }
        // 增加一个popup自定义的样式
        addStyle(`
        .custom-popup .vjmapgis-popup-content {
        background-color: #A0FFA0;
        }
        .custom-popup .vjmapgis-popup-tip {
        border-top-color: #A0FFA0;
        }
        `)
        // 跟随鼠标动的弹框
        const div = window.document.createElement('div');
        div.innerHTML = '坐标：';
        const popup = new vjmap.Popup({
            className: "custom-popup",
            closeOnClick: false,
            closeButton: false
        })
            //.setHTML("Hello VJMap!")
            .setDOMContent(div)
            .trackPointer()
            .addTo(map);
        
        
        // 响应地图鼠标移动事件，获取鼠标的实时坐标:
        map.on("mousemove", e => {
            let html = '';
            html += `CAD坐标: `
            let cadPoint = map.fromLngLat(e.lngLat);
            html += `<br/>${cadPoint.toString()}`;
        
            // 经纬度坐标只用来绘图底层用 范围(-180,180)
            html += `<br/>LngLat坐标: `
            let lngLat = map.toLngLat(cadPoint);  // 这里直接用 e.lngLat 是一样的。只是演示CAD坐标到经纬度的转换
            html += `<br/>${lngLat[0].toFixed(6)},${lngLat[1].toFixed(6)}`;
        
            // 设备坐标，也就是屏幕的像素坐标
            html += `<br/>屏幕坐标: `
            let pixelPoint = map.project(lngLat); // 反过来通过屏幕坐标求经纬度用 map.unproject()
            html += `<br/>${pixelPoint.x.toFixed(0)},${pixelPoint.y.toFixed(0)}`;
        
            popup.setHTML(html)
        })
        
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