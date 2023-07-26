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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zinsertoutmapzenttiledirect
        // --通过坐标加载外部图实体瓦片图层--把外部图形的元素通过坐标指定插入至当前图形中(以瓦片形式加载，后端绘制）
        // 注: 此示例中引用了vjcommon库。此库是对唯杰地图常用的功能做了一定程度的封装，方便其他工程共用
        // vjcommon库可在 html 中引入`vjcommon.min.js`即可,或npm install vjcommon`通过`import vjcommon from 'vjcommon'`引入
        // vjcommon库是开源的。开源地址 https://github.com/vjmap/vjmap-common
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: 'sys_hello', // 地图ID
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
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds();
        
        // 在指定位置加一个符号
        let templateMapId = "sys_symbols";
        let templateMapIdVer = "v1";
        
        let doc = new vjmap.DbDocument();
        // 数据来源
        doc.from = `${templateMapId}/${templateMapIdVer}`;
        // 把来源图的数据最后都清空
        doc.isClearFromDb = true;
        let entitys = [];
        let blockIds = ["25B"] // 以内存模式打开，看objectid值
        for(let bid of blockIds) {
            let point  = mapBounds.randomPoint().toArray();
            entitys.push(new vjmap.DbBlockReference({
                cloneObjectId: bid,
                position: point,
                matrix: [
                    {
                        op: "scale",
                        scale: 1, // 放大倍数
                        origin: point // 基点
                    }
                ],
            }))
        }
        
        let lineIds = ["40D"] // 以内存模式打开，看objectid值
        for(let lnid of lineIds) {
            let points = [];
            // 给这条线段随机生成三个点
            for(let i = 0; i < 3; i++) {
                points.push( mapBounds.randomPoint().toArray())
            }
            entitys.push(new vjmap.DbBlockReference({
                cloneObjectId: lnid,
                points: points,
                //linetypeScale: 100, // 线型比例
            }))
        }
        
        doc.entitys = entitys
        let svcNew = svc.clone(); // 复制服务对象的地址和token
        // js代码
        
        let resNew = await svcNew.updateMap({
            mapid: vjmap.getTempMapId(), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
            filedoc: doc.toDoc(),
            mapopenway: vjmap.MapOpenWay.Memory, //  vjmap.MapOpenWay.GeomRender 效果好些，但是会慢些
            deleteOldVersion: true, // 把之前的版本都删除了
            style: {
                backcolor: 0, // 如果div背景色是浅色，则设置为oxFFFFFF
                clipbounds: map.getGeoBounds(1.0).toArray()
            }
        })
        
        let tiles = svcNew.rasterTileUrl(resNew);
        map.addRasterSource("mapDrawSource", {
            type: "raster",
            tiles: [tiles],
            tileSize: 256
        });
        map.addRasterLayer("mapDrawLayer", "mapDrawSource");
        
        let mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "top-left");
        
        
        // 如果是基于空白图绘制，可用如下代码
        /*
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        // 在指定位置加一个符号
        let templateMapId = "sys_symbols";
        let templateMapIdVer = "v1";
        
        let doc = new vjmap.DbDocument();
        // 数据来源
        doc.from = `${templateMapId}/${templateMapIdVer}`;
        // 把来源图的数据最后都清空
        doc.isClearFromDb = true;
        let entitys = [];
        let blockIds = ["25B"] // 以内存模式打开，看objectid值
        
        for(let bid of blockIds) {
            let point  = [vjmap.randInt(0, 1000), vjmap.randInt(-100, 100)]; //  随机点位置
            entitys.push(new vjmap.DbBlockReference({
                cloneObjectId: bid,
                position: point,
        
                matrix: [
                    {
                        op: "scale",
                        scale: 0.1, // 放大总数
                        origin: point // 基点
                    }
                ],
            }))
        }
        
        let lineIds = ["40D"] // 以内存模式打开，看objectid值
        for(let lnid of lineIds) {
            let points = [];
            // 给这条线段随机生成三个点
            for(let i = 0; i < 3; i++) {
                points.push([vjmap.randInt(0, 1000), vjmap.randInt(-100, 100)]); //  随机点位置)
            }
            entitys.push(new vjmap.DbPolyline({
                cloneObjectId: lnid,
                points: points,
                // linetypeScale: 5,
            }))
        }
        
        doc.entitys = entitys
        
        // js代码
        
        let mapid = `ns_temp_30_` + svc.strMd5(doc.toDoc()) // 根据文件内容生成一个文件名
        let res = await svc.updateMap({
            mapid: mapid, // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
            filedoc: doc.toDoc(),
            mapopenway: vjmap.MapOpenWay.Memory, //  vjmap.MapOpenWay.GeomRender 效果好些，但是会慢些
            style: {
                backcolor: 0, // 如果div背景色是浅色，则设置为oxFFFFFF
            }
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
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        let mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "top-left");
        */
        
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