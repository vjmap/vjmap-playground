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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29changecoordsystem
        // --更改图的原有坐标系--
        // js代码
        document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let mapid = "sys_hello";
        // 得到原来图的元数据
        let metadata = await svc.metadata(mapid);
        let mapOldExtent = vjmap.GeoBounds.fromString(metadata.bounds);
        let mapExtent = mapOldExtent.scale(1.2) ;// 可以根据实际情况改变默认地图范围，此例子中是缩小，地图范围没有放大，就可以使用原来的范围, 这里使用1.2测试下范围变化
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象，先建一个空图
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        await map.onLoad();
        
        // 下面根据对应点求出四参数
        
        // 原来图上的两个点坐标（此处是矩形的左上角和右下角两个点)
        let oldPoints = [
            vjmap.geoPoint([725.3179,18969.191]),
            vjmap.geoPoint([28662.1131,1273.0363])
        ];
        
        // 新坐标系上，上面上个点对应的点坐标（例子中就是对图中的矩形左上角进行一个0.5倍的缩放,四个点为矩形的四个顶点)
        let newPoints = [
            vjmap.geoPoint([725.3179,18969.191]),
            vjmap.geoPoint([14693.7155,10121.1137])
        ]
        
        // 通过坐标参数求出四参数
        let fourparam = vjmap.coordTransfromGetFourParamter(newPoints, oldPoints, true); // 这里不需要考虑旋转
        // 结果为 {dx: -725.3179249499815, dy: -18969.191097071867, scale: 2.000000003236258, rotate: 0}
        // 其实为是把新坐标系按基点矩形左上角第一个点做一个偏移，再放大2倍，得到原来的坐标，不用四参数计算的，手动设置也可以
        
        
        // 基于上面的底图，通过wms服务叠加其他图形
        // 先获取地图元数据来获取图层样式
        let style = await svc.createStyle({
            backcolor: 0xFFFFFF // 浅色主题
        }, mapid)
        
        // 新坐标系下面的图层
        let wmsurl = svc.wmsTileUrl({
            mapid: mapid,
            version:"v1",
            layers: style.stylename,
            mapbounds: mapExtent, // 此范围必须是现在坐标系的范围
            fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate]  // 参数为(平移x,平移y,缩放k,旋转弧度r)
        })
        
        map.addSource('wms-new-source', {
            'type': 'raster',
            'tiles': [
                wmsurl
            ],
            'tileSize': 256
        });
        map.addLayer({
                'id': 'wms-new-layer',
                'type': 'raster',
                'source': 'wms-new-source',
                'paint': { "raster-opacity": 1 }
            }
        );
        
        
        // 下面叠加之前的图层
        let oldInvPoints = oldPoints.map(pt => {
            return vjmap.coordTransfromByInvFourParamter(pt, fourparam); // 需要通过四参数反算出新坐标系下对应原来点的坐标是多少
        })
        // 通过新坐标点和反算出的新坐标点对应的原来图中的坐标点计算新的四参数
        let fourparamOld = vjmap.coordTransfromGetFourParamter(newPoints, oldInvPoints, true);
        let wmsurlOld = svc.wmsTileUrl({
            mapid: mapid,
            version:"v1",
            layers: style.stylename,
            mapbounds: mapExtent, // 此范围必须是现在坐标系的范围
            fourParameter: [fourparamOld.dx, fourparamOld.dy, fourparamOld.scale, fourparamOld.rotate]  // 参数为(平移x,平移y,缩放k,旋转弧度r)
        })
        
        map.addSource('wms-old-source', {
            'type': 'raster',
            'tiles': [
                wmsurlOld
            ],
            'tileSize': 256
        });
        map.addLayer({
                'id': 'wms-old-layer',
                'type': 'raster',
                'source': 'wms-old-source',
                'paint': { "raster-opacity": 0.3 }
            }
        );
        
        // 把公共点标出来
        // 新的坐标系上面的点
        for(let pt of newPoints) {
            let marker = new vjmap.Marker({
                color: "green"
            });
            marker.setLngLat(map.toLngLat(pt)).addTo(map);
        }
        
        // 之前图上面的的点
        for(let pt of oldPoints) {
            let marker = new vjmap.Marker({
                color: "red"
            });
            // 在新坐标系上面加的点
            marker.setLngLat(map.toLngLat(pt)).addTo(map);
        
            // 如果要用原来图上的cad的点坐标，我们需要通过四参数反算出，再加上
            //let p = vjmap.coordTransfromByInvFourParamter(pt, fourparam);
            //marker.setLngLat(map.toLngLat([p.x, p.y])).addTo(map);
        }
        
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