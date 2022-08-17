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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/27wmsRaster
        // --WMS叠加栅格图形--通过wms服务，把两个图形通过栅格瓦片叠加到一起
        // 把div背景改成浅色
        document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: "sys_hello",
            mapopenway: vjmap.MapOpenWay.GeomRender // 以几何数据渲染方式打开
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
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        // 基于上面的底图，通过wms服务叠加其他图形
        // 先获取地图元数据来获取图层样式
        let cadMapId = "sys_world"; // 要叠加的图形id
        let style = await svc.createStyle({
            backcolor: 0xFFFFFF // 浅色主题
        }, cadMapId)
        
        let wmsurl = svc.wmsTileUrl({
            mapid: cadMapId,
            version:"v1",
            layers: style.stylename,
            mapbounds: res.bounds,
            fourParameter: "0,0,1,0" // 参数为(平移x,平移y,缩放k,旋转弧度r) 因为坐标与底图一样，所以不用偏移缩放和旋转
        })
        
        map.addSource('wms-test-source', {
            'type': 'raster',
            'tiles': [
                wmsurl
            ],
            'tileSize': 256
        });
        map.addLayer({
                'id': 'wms-test-layer',
                'type': 'raster',
                'source': 'wms-test-source',
                'paint': { "raster-opacity": 1 }
            }
        );
        
        
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