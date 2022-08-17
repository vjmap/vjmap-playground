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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29customselhoverstyle
        // --自定义选择高亮样式--点击选择实体时高亮效果
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        
        // 点击有高亮状态（鼠标点击地图元素上时，会高亮)
        let entBoundsPolyline;
        const drawBounds = (bounds) => {
            if (entBoundsPolyline) {
                entBoundsPolyline.remove();
                entBoundsPolyline = null;
            }
            if (!bounds) return;
            const routePath = [];
            routePath.push(bounds.min);
            routePath.push(vjmap.geoPoint([bounds.max.x, bounds.min.y]));
            routePath.push(bounds.max);
            routePath.push(vjmap.geoPoint([bounds.min.x, bounds.max.y]));
            routePath.push(bounds.min);
            let geoLineDatas = [];
            geoLineDatas.push({
                points: map.toLngLat(routePath),
                properties: {
                    opacity: 1.0
                }
            })
        
            entBoundsPolyline = new vjmap.Polyline({
                data: geoLineDatas,
                lineColor: 'yellow',
                lineWidth: 3,
                lineOpacity: ['get', 'opacity'],
                isHoverPointer: false,
                isHoverFeatureState: false
            });
            entBoundsPolyline.addTo(map);
        }
        map.enableLayerClickHighlight(svc, e => {
            drawBounds(e ? map.getEnvelopBounds(e.envelop) : null);
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        }, "#0000" /* 设置"#0000"时，默认高亮效果关闭 */, null, (res) => {
            if (res && res.result && res.result.length >= 1 && res.result[0].isline) {
                return res;//如果是线，则原数据还回
            }
            return null;//否则返回空
        })
        
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