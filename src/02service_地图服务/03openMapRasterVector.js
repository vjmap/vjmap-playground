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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/03openMapRasterVector
        // --栅格矢量瓦片切换显示--低级别下显示栅格瓦片，高级别下显示矢量瓦片
        // js代码
        // 新建地图服务对象，传入服务地址和token
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
        // 创建栅格瓦片，设置最小级别为0,最大显示级别为4,表示1到4级为栅格
        let rasterStyle = svc.rasterStyle(undefined, 0, 4); // 设置最小级别为0,最大显示级别为4,表示1到4级为栅格
        // 创建矢量瓦片, 设置最小级别为3,最大显示级别为22,表示3级后为矢量（这里3级和栅格的3级是重合的，这样切换的时候没有卡顿的效果，如果直接为4级显示，会有一个卡顿）
        let vectorStyle = svc.vectorStyle(undefined, 3, 24); //设置最小级别为3,最大显示级别为22,表示3级后为矢量
        let style = vjmap.cloneDeep(rasterStyle);
        style.sources = {...rasterStyle.sources, ...vectorStyle.sources};
        style.layers = [...rasterStyle.layers, ...vectorStyle.layers];
        
        /* 可以把4级以下的矢量瓦片图层设置一个透明度0.5
         for(let i = 0; i < vectorStyle.layers.length; i++) {
            let layer = vectorStyle.layers[i];
            let opacityName = layer.type === "line" ? 'line-opacity' : (layer.type === "fill" ? 'fill-opacity' : 'circle-opacity')
            let opacity = layer.paint[opacityName] || 1.0
            layer.paint[opacityName] = [
                "step", ["zoom"],
                0.5, // 小于4级时的透明度
                4,
                opacity // 大于和等于4级时的透明度
            ]
        }
         */
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: style, // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        
        await map.onLoad();
        
        // 鼠标移动显示坐标位置控件
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
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