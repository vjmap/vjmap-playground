const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polygon/03polygonMany
        // --批量绘制多边形--
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
        let mapBounds = map.getGeoBounds(0.6);
        
        let len = mapBounds.width() / 100;
        let polygons = []
        for(let i = 0; i < 2000; i++) {
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
            const p3 = vjmap.geoPoint([p1.x + len, p1.y]);
            polygons.push({
                points: map.toLngLat([p1, p2, p3]),
                properties: {
                    name: "polygon" + (i + 1),
                    color: vjmap.randomColor()
                }
            })
        }
        
        
        let polygon = new vjmap.Polygon({
            data: polygons,
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillOpacity: 0.8,
            fillOutlineColor: "#f00",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polygon.addTo(map);
        polygon.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，颜色为 ${e.features[0].properties.color} 的多边形`))
        polygon.clickPopup(f => {
            return `<h3>点击事件</h3><h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`
        }, { anchor: 'top', closeOnClick: false , closeOnMove: true});
        
        // 悬浮在多边形上面时显示信息框
        // 方案一，直接用hoverPopup，如果多边形没有重叠时可以用这个。有重叠时因为响应不了mouseout事件，所以会导致只会在重叠的第一个显示
        //polygon.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        // 方案二，用hoverFeatureState事件。这个能解决多边形重叠的问题。代码量稍多点
        let popup;
        polygon.hoverFeatureState((e) => {
            // 通过当前的点查询实体
            let features = map.queryRenderedFeatures(e.point, {
                layers: [polygon.layerId]
            });
            // 如果在多边形上面时
            if (features) {
                let isNew = false;
                if (!popup) {
                    // 第一次时创建
                    isNew = true;
                    popup = new vjmap.Popup({ closeButton: false });
                }
                popup.setLngLat(e.lngLat);
                const f = features[0];
                popup.setHTML(`<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`);
                if(isNew) popup.addTo(map);
            }
        }, () => {
            // 不在多边形上面时
            if (popup) {
                popup.remove();
                popup = null;
            }
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