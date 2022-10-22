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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/div/divOverlay
        // --div覆盖物绘制图片--
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
            zoom: 9, // 设置地图缩放级别,
            pitch: 30, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.001);
        const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
        const points = [[mapBounds.min.x, mapBounds.min.y], [mapBounds.min.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.min.y]]
        const markers = []
        // 增加四个覆盖物用来调节位置
        for(let c = 0; c <  colors.length; c++) {
            const marker = new vjmap.Marker({
                color: colors[c],
                draggable: true
            });
            marker.setLngLat(map.toLngLat(points[c])).addTo(map);
            marker.on('drag', e => {
                updateBounds();
            });
            markers.push(marker);
        }
        
        const imageWidth = 1280; // 图像宽
        const imageHeight = 905; // 图像高
        const image = document.createElement( "img" );
        image.style.position = "absolute"; // 有多个divoverlay时，一定要加定位，否则会导致其他绘制不对
        image.style.left = '0px';
        image.style.top = '0px';
        image.style.width = imageWidth + "px";
        image.style.height = imageHeight + "px";
        image.style.opacity = '0.8';
        image.style.zIndex = '-1';
        image.src = env.assetsPath + "images/park.jpg"
        image.style.pointerEvents = "none"
        
        // 增加一个DIV的Image覆盖物
        const divOverlay = new vjmap.DivOverlay({
            bounds: points, // 四个点的位置
            element: image, // DIV 元素
            width: imageWidth,// DIV 宽
            height: imageHeight,// DIV 高
            minZoom: 5, // 能显示的最小级别 （可以不填）
            maxZoom: 15 // 能显示的最大级别 （可以不填）
        })
        divOverlay.addTo(map);
        
        const updateBounds = () => {
            // 更新位置
            divOverlay.updateBounds([map.fromLngLat(markers[0].getLngLat()), map.fromLngLat(markers[1].getLngLat()), map.fromLngLat(markers[2].getLngLat()), map.fromLngLat(markers[3].getLngLat())])
        }
        message.info("拖动四个点来调节图片位置");
        
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