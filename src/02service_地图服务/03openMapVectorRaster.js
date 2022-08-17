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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/03openMapVectorRaster
        // --栅格矢量瓦片同时显示--有些图层用栅格瓦片显示，有些图层用矢量瓦片显示。
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
        
        // 把”道路“图层做为矢量图层，其他图层做为栅格图层显示
        // 可以把需要在前端对绘制进行的数据进行矢量绘制，对不变的数据进行栅格绘制，这样性能和灵活性能兼顾
        let layers = svc.currentMapParam().layers;
        let layerIndex = layers.findIndex(layer => layer.name === "道路")
        
        // 栅格
        let rStyle = await svc.createStyle({
            ...vjmap.openMapDarkStyle(),
            layeroff: [layerIndex] // 要关闭显示的图层，在栅格样式中，需要把道路图层隐藏了
        })
        // 创建栅格样式
        let rasterStyle = svc.rasterStyle(svc.rasterTileUrl({
            layer: rStyle.stylename
        }));
        
        // 矢量
        let vStyle = await svc.createStyle({
            ...vjmap.openMapDarkStyle(),
            layeron: [layerIndex] // 要显示的图层，在矢量样式中，需要把道路图层显示了，其他的关闭
        })
        // 创建矢量样式
        let vectorStyle = svc.vectorStyle(svc.vectorTileUrl({
            layer: vStyle.stylename
        }));
        
        
        // 栅格瓦片和矢量瓦片合并到一起
        let style = vjmap.cloneDeep(rasterStyle);
        style.sources = {...rasterStyle.sources, ...vectorStyle.sources};
        style.layers = [...rasterStyle.layers, ...vectorStyle.layers];
        
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
        
        // 下面把矢量图层的线图层用蚂蚁线动起来
        let styles = vectorStyle.layers;
        let lineLayerId = styles.filter(s => s.type === "line" && s['source-layer'] === 'lines')[0].id
        let antPathImages = vjmap.createAntPathAnimateImages({
            canvasWidth: 32,
            canvasHeight: 2,
            fillColor1: "#f0f",
            fillColor2: "#0ff"
        });
        let animLineLayer = vjmap.animateVectorLayer(map, lineLayerId, {
            animateImages: antPathImages
        }, 0)
        
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