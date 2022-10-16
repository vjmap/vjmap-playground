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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/maptalks/01maptalksraster
        // --加载唯杰地图CAD栅格瓦片--使用maptalks来加载唯杰地图服务提供的CAD栅格瓦片
        
        // maptalks 官网地址 https://maptalks.org/
        // maptalks 源码地址 https://github.com/maptalks/maptalks.js
        if (typeof L !== "object") {
            // 如果没有maptalks环境
            await vjmap.addScript([{
                src: "../../js/maptalks1.0rc14/maptalks.min.js"
            },{
                src: "../../js/maptalks1.0rc14/maptalks.css"
            }]);
        }
        
        // 地图服务对象，调用唯杰地图服务打开地图，获取地图的元数据
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let mapId = "sys_zp";
        let res = await svc.openMap({
            mapid: mapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        // 设置每级的分辨率
        let resolutions= [];
        for(let i = 0; i < 25; i++) {
            resolutions.push(mapBounds.width() / (512 * Math.pow(2, i - 1)))
        }
        
        // 创建maptalks的地图对象
        let map = new maptalks.Map('map', {
            center: mapBounds.center().toArray(), // 初始化中心点
            zoom:  1, // 初始化级别
            zoomControl: true,
            attribution: false,
            // 定义基于CAD地图范围的空间坐标系
            spatialReference : {
                projection : 'identity',
                resolutions : resolutions,
                fullExtent : {
                    'top': mapBounds.max.y,
                    'left': mapBounds.min.x,
                    'bottom': mapBounds.min.y,
                    'right': mapBounds.max.x
                }
            }
        });
        
        // 创建一个瓦片图层
        let layer = new maptalks.TileLayer('base', {
            tileSystem: [1, -1, mapBounds.min.x, mapBounds.max.y],
            urlTemplate: svc.rasterTileUrl(), // 唯杰地图服务提供的cad的栅格瓦片服务地址
            repeatWorld: false
        });
        map.addLayer(layer);
        
        map.on('click', (e) => console.log(message.info(`您点击的坐标为： ${e.coordinate.x}, ${e.coordinate.y}`)));
        
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