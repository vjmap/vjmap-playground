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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/09olcomposemap
        // --CAD图处理组合--对多个cad图进行图层开关裁剪旋转缩放处理后合并成一个新的cad图
        
        // openlayers 官网地址 https://openlayers.org/
        // openlayers 源码地址 https://github.com/openlayers/openlayers
        if (typeof ol !== "object") {
            // 如果没有openlayer环境
            await vjmap.addScript([{
                src: "../../js/ol7.1.0/ol.js"
            },{
                src: "../../js/ol7.1.0/ol.css"
            }]);
        }
        // 地图服务对象，调用唯杰地图服务打开地图，获取地图的元数据
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        // 组合成新的图,将sys_world图进行一定的处理后，再与sys_hello进行合成，生成新的地图文件名
        let rsp = await svc.composeNewMap([
            {
                mapid: "sys_world", // 地图id
                // 下面的参数可以根据实际需要来设置，可以对图层，范围，坐标转换来进行处理
                layers: ["经纬度标注","COUNTRY"], // 要显示的图层名称列表
                //clipbounds: [10201.981489534268, 9040.030491346213, 26501.267379,  4445.465999], // 要显示的范围
                //fourParameter: [0,0,1,0] // 对地图进行四参数转换计算
            },
            {
                mapid: "sys_hello"
            }
        ])
        if (!rsp.status) {
            message.error(rsp.error)
        }
        // 返回结果为
        /*
        {
            "fileid": "pec9c5f73f1d",
            "mapdependencies": "sys_world||sys_hello",
            "mapfrom": "sys_world&&v1&&&&0&&&&&&&&&&00A0&&10||sys_hello&&v1&&&&0&&&&&&&&&&&&2",
            "status": true
        }
         */
        let res = await svc.openMap({
            mapid: "newComposeHelloWord", // 取个新的地图名称
            fileid: rsp.fileid,
            //mapdependencies: rsp.mapdependencies, // 把返回值做为参数传递打开, 如果需要创建协同图形，请把此项打开
            //mapfrom: rsp.mapfrom, // 把返回值做为参数传递打开, 如果需要创建协同图形，请把此项打开
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style:  vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        
        // 获取地图范围
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        
        //自定义投影参数
        let cadProjection = new ol.proj.Projection({
            // extent用于确定缩放级别
            extent: mapBounds.toArray(),
            units: 'm'
        });
        // 设置每级的分辨率
        let resolutions= [];
        for(let i = 0; i < 25; i++) {
            resolutions.push(mapBounds.width() / (512 * Math.pow(2, i - 1)))
        }
        // 增加自定义的cad的坐标系
        ol.proj.addProjection(cadProjection);
        
        // 创建openlayer的地图对象
        let map = new ol.Map({
            target: 'map', // div的id
            view: new ol.View({
                center: mapBounds.center().toArray(),  // 地图中心点
                projection: cadProjection, // 刚自定义的cad的坐标系
                resolutions:resolutions, // 分辨率
                zoom: 2 // 初始缩放级别
            })
        });
        
        // 增加一个瓦片图层
        let layer = new ol.layer.Tile({
            // 增加一个瓦片数据源
            source: new ol.source.TileImage({
                url: svc.rasterTileUrl() // 唯杰地图服务提供的cad的栅格瓦片服务地址
            })
        });
        // 在地图中增加上面的瓦片图层
        map.addLayer(layer);
        
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