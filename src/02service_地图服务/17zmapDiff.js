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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/17zmapDiff
        // --比较地图不同处--查找出不同图或不同版本之间地图的修改新增删除部分
        
        // 在id为"map”的div下面创建一个一样大的不同的div，用于新的对图对象的容器id
        const createNewMapDivIds = ()=> {
            // 先清空之前的
            let parentDiv = document.getElementById("map");
            parentDiv.style.display = "flex";
            parentDiv.style.justifyContent = "space-between"
            let newMapDiv1 = document.createElement("div");
            newMapDiv1.id = vjmap.RandomID(6);
            newMapDiv1.style.flex = "1";
            parentDiv.appendChild(newMapDiv1);
        
            let newMapDiv2 = document.createElement("div");
            newMapDiv2.id = vjmap.RandomID(6);
            newMapDiv2.style.flex = "1";
            parentDiv.appendChild(newMapDiv2);
            return [newMapDiv1.id, newMapDiv2.id];
        }
        
        let service = new vjmap.Service(env.serviceUrl, env.accessToken)
        const createCadMap = async (containerId, mapid, version, style)=> {
            // 地图服务对象
            let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
            // 打开地图
            let res = await svc.openMap({
                mapid: mapid, // 地图ID
                version: version, // 版本号
                mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
                style: style
            })
            if (res.error) {
                // 如果打开出错
                message.error(res.error)
            }
            // 获取地图范围
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // 根据地图范围建立几何投影坐标系
            let prj = new vjmap.GeoProjection(mapExtent);
        
            let center = prj.toLngLat(mapExtent.center());
            // 地图对象
            let map = new vjmap.Map({
                container: containerId, // DIV容器ID
                style: svc.rasterStyle(), // 样式，这里是栅格样式
                center: center, // 设置地图中心点
                zoom: 1, // 设置地图缩放级别
                renderWorldCopies: false // 不显示多屏地图
            });
        
            // 关联服务对象和投影对象
            map.attach(svc, prj);
            // 根据地图本身范围缩放地图至全图显示
            map.fitMapBounds();
        
            return map;
        }
        
        let newMapIds = createNewMapDivIds();
        
        let mapId1 = env.exampleMapId;
        let mapId2 = env.exampleMapId;
        
        const map1 = await createCadMap(newMapIds[0], mapId1, "", vjmap.openMapDarkStyle())
        const map2 = await createCadMap(newMapIds[1], mapId2,"", {
            name: "styleCloseWz", // 样式名
            backcolor: 0, // 后台打开地图的背景色
            layeroff: [3,10,24] // 把3,10,24图层关闭了
        })
        let cancelCB = vjmap.syncMaps(map1, map2); // 返回取消同步的回调函数
        
        // 地图比较不同
        let diff = await service.cmdMapDiff({
            // 要比较图1的图名称
            mapid1: mapId1,
            // 要比较图1的图版本，如为空，表示是最新版本
            version1: "",
            // 要比较图1的图层样式名称，可为空。为空的用默认的
            layer1: map1.getService().currentMapParam().layer,
            // 要比较图2的图名称，图名称可以和mapid1不一样
            mapid2: mapId2,
            // 要比较图2的图版本，如为空，表示是最新版本
            version2: "",
            // 要比较图2的图层样式名称，可为空。为空的用默认的
            layer2: map2.getService().currentMapParam().layer
        })
        
        if (diff.error) {
            cancelCB();
            message.error(diff.error);
            return;
        }
        
        const drawPolygons = (map, points, color) => {
            if (points.length === 0) return;
            points.forEach(p => p.push(p[0])) ;// 闭合
            let polygons = points.map(p => {
                return {
                    points: map.toLngLat(p),
                    properties: {
                        color: color
                    }
                }
            })
            vjmap.createAntPathAnimateLineLayer(map, polygons, {
                fillColor1: color,
                fillColor2: "#0ffb",
                canvasWidth: 128,
                canvasHeight: 32,
                frameCount: 4,
                lineWidth: 4,
                lineOpacity: 0.8
            });
        }
        if (diff.modify.length === 0) {
            message.info("完全相同，没有找到不同处");
            return;
        }
        // 修改的部分
        drawPolygons(map2, diff.modify, "#f00");
        // 新增部分
        drawPolygons(map2, diff.new, "#0f0");
        // 删除部分
        drawPolygons(map1, diff.del, "#00f");
        
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