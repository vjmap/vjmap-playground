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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/08zArrangeCompose
        // --图形排列组合成新图形--将多个图排列组合成一个新的图形
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 将下面四个图按2行2列的排列方式，组合成新图
        let mapIds = ['sys_zp', 'sys_world', 'sys_stats', "sys_topo"];
        // 新的地图范围假设设置为0,0,20000,20000
        const newMapLength = 20000;
        // 先获取四个图的元数据，获取坐标范围
        const col = 2;
        const cellMapColLength = newMapLength / col;
        const cellMapRowLength = newMapLength / Math.ceil( mapIds.length / col);
        
        
        let newMapParams = [];// 新建地图参数
        let mapFourParam = {};//记录下每个地图的四参数，用于把地图的数据加进新地图中时的坐标转换
        let addMarkers = []; // 要增加的每个地图的中心点位置
        for(let i = 0; i < mapIds.length; i++) {
            let metadata = await svc.metadata(mapIds[i]);
            let bounds = vjmap.GeoBounds.fromString(metadata.bounds);
            bounds = bounds.scale(+metadata.initViewScale * 1.1); // 比初始视图比例稍大点就可以
            // 四参数，找一个图的左上角各右下角坐标与新的坐标下面的左上角和右下解坐标对应起来，来求解四参数(四参数最少要两个点)
            let srcPoints = [
                bounds.min,
                bounds.max
            ];
        
            const curRow = Math.floor(i / col);
            const curCol = i % col;
            let destMin = [cellMapColLength * curCol, newMapLength - cellMapRowLength * (curRow + 1)];
            let destMax = [cellMapColLength * (curCol + 1), newMapLength - cellMapRowLength * curRow];
            // 求的新范围可能不是正方形，得求出这个矩形的中心点的最小正方形
            let newBounds = new vjmap.GeoBounds(vjmap.geoPoint(destMin), vjmap.geoPoint(destMax));
            const c = newBounds.center();
            let w = newBounds.width() < newBounds.height() ? newBounds.width() : newBounds.height();
            // 另外坐标系上拾取的与上面的点一一对应的坐标
            let destPoints = [
                vjmap.geoPoint([c.x - w / 2.0, c.y - w / 2.0]),
                vjmap.geoPoint([c.x + w / 2.0, c.y + w / 2.0])
            ]
        
        
            // 通过坐标参数求出四参数，不用考虑旋转
            let fourparam = vjmap.coordTransfromGetFourParamter(srcPoints, destPoints, true);
        
            newMapParams.push({
                mapid: mapIds[i],
                fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate]  // 参数为(平移x,平移y,缩放k,旋转弧度r)
            })
        
            // 下面记录下每个地图的中心点，然后到时在新的地图中，把之前每个点的中心点绘制出来，用于测试坐标转换
            mapFourParam[mapIds[i]] = fourparam;
            addMarkers.push({
                mapid: [mapIds[i]],
                point: bounds.center()
            })
        }
        
        let rsp = await svc.composeNewMap(newMapParams)
        if (!rsp.status) {
            message.error(rsp.error)
        }
        let res = await svc.updateMap({
            mapid: "composearrange", // 取个新的地图名称
            fileid: rsp.fileid, // 把返回值做为参数传递打开，如果不要成为协同图形，只要fileid属性即可。如果要创建协同图形，把rsp的参数都加上即可。...rsp
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style:  vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        await map.onLoad();
        
        
        // 在新的坐标系下，把之前每个地图的中心点绘制出来
        for(let m of addMarkers) {
            let fourParam = mapFourParam[m.mapid];
            let newPoint = vjmap.coordTransfromByFourParamter(m.point, fourParam);
            new vjmap.Marker({color: vjmap.randomColor()})
                .setLngLat(map.toLngLat(newPoint))
                .addTo(map);
        }
        
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