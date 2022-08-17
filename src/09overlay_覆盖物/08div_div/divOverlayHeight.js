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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/div/divOverlayHeight
        // --一个有高度的div覆盖物--
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
            center: [5.8276, 0.95622], // 设置地图中心点
            zoom: 3, // 设置地图缩放级别,
            pitch: 65, // 倾斜角度
            bearing: 60, // 方位角
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        let mapBounds = map.getGeoBounds(0.05);
        const randHeight = ()=> map.pixelToHeight(vjmap.randInt(50, 60), 2);//生成级别2下50-60像素的高度值
        
        
        const createDivOverlay = ps => {
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
                bounds: ps, // 四个点的位置
                element: image, // DIV 元素
                width: imageWidth,// DIV 宽
                height: imageHeight
            })
            divOverlay.addTo(map);
        }
        
        let height1 = randHeight();
        const points1 = [
            [mapBounds.min.x, mapBounds.min.y, 0],
            [mapBounds.min.x, mapBounds.min.y, height1],
            [mapBounds.min.x, mapBounds.max.y, height1],
            [mapBounds.min.x, mapBounds.max.y, 0],
        ]
        createDivOverlay(points1)
        
        
        let height2 = randHeight();
        const points2 = [
            [mapBounds.min.x, mapBounds.min.y, height2],
            [mapBounds.min.x, mapBounds.max.y, height2],
            [mapBounds.max.x, mapBounds.max.y, height2],
            [mapBounds.max.x, mapBounds.min.y, height2],
        ]
        createDivOverlay(points2)
        
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