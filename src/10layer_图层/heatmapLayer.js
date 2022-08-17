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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/layer/heatmapLayer
        // --热力图层--
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
        await map.onLoad();
        const mapBounds = map.getGeoBounds(0.6);
        let geoDatas = []
        for(let i = 0; i < 1000; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point:  map.toLngLat(pt),
                properties: {
                   value: vjmap.randInt(0, 100)
                }
            }
            geoDatas.push(data)
        }
        
        let heatmapLayer = new vjmap.Heatmap({
            data: geoDatas,
            // heatmapWeight：表示一个点对热力图权重的贡献，在贡献越大的地方热力图显示应该越明显
            heatmapWeight:  [
                'interpolate',
                ['linear'],
                ['get', 'value'],
                0, // 因为上面用了0,100，最小和最大值，把这两个最小和最大值归化到0,1区间
                0,
                100,
                1
            ],
            // heatmapRadius：热力图的一个点计算权重的时候计算的点的半径，单位为像素，默认为30
            heatmapRadius: [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, //0级别
                10, //半径10
                9, // 9级别 (其余级别，线性插值)
                50 // 半径50
            ],
            // heatmapColor：热力图的颜色，设置在各个热力图的数值上是什么颜色
            heatmapColor: [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(33,102,172,0)',
                0.2,
                'rgb(103,169,207)',
                0.4,
                'rgb(209,229,240)',
                0.6,
                'rgb(253,219,199)',
                0.8,
                'rgb(239,138,98)',
                1,
                'rgb(178,24,43)'
            ],
            //heatmapIntensity：热力图强度，有点类似于heatmapWeight属性，但是该属性是设置整体上热力图的强度
            heatmapIntensity: [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                1,
                9,
                3
            ],
            //heatmapOpacity：热力图的透明度
            heatmapOpacity: [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                1,
                9,
                0
            ]
        });
        heatmapLayer.addTo(map);
        
        
        // 点击查询热力图层
        map.on('click', heatmapLayer.layerId, (e) => {
            message.info({content:`影响此点热力值的要素有: ${e.features.length} 个`, duration: 2, key: "info"});
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