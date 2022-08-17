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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/map/eventDragCircle
        // --一个可拖动的圆符号--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle()
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
            center: prj.toLngLat(mapExtent.center()),
            zoom: 1,
            pitch: 60,
            antialias: true,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const geojson = {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [0, 0]
                    }
                }
            ]
        };
        
        const onMove = (e) => {
            const coords = e.lngLat;
            map.getCanvas().style.cursor  = 'grabbing';
            geojson.features[0].geometry.coordinates = [coords.lng, coords.lat];
            map.setData("point", geojson);
        }
        
        const onUp = (e) => {
            const coords = map.fromLngLat(e.lngLat);
        
            let msg = {
                content: `${coords.x}, ${coords.y}`,
                key: "message",
                duration: 5
            }
            message.info(msg);
        
            map.getCanvas().style.cursor  = '';
        
            // 取消绑定事件
            map.off('mousemove', onMove);
            map.off('touchmove', onMove);
        }
        
        map.addGeoJSONSource("point", geojson);
        map.addCircleLayer("circle", "point", {
            circleRadius: 20,
            circleColor: '#ffff00'
        })
        
        
        map.on('mouseenter', 'circle', () => {
            map.setCircleColor("circle", '#ff00ff');
            map.getCanvas().style.cursor  = 'move';
        });
        
        map.on('mouseleave', 'circle', () => {
            map.setCircleColor("circle", '#ffff00');
            map.getCanvas().style.cursor  = '';
        });
        
        map.on('mousedown', 'circle', (e) => {
            e.preventDefault();
            map.getCanvas().style.cursor  = 'grab';
            map.on('mousemove', onMove);
            map.once('mouseup', onUp);
        });
        
        map.on('touchstart', 'circle', (e) => {
            if (e.points.length !== 1) return;
            e.preventDefault();
            map.on('touchmove', onMove);
            map.once('touchend', onUp);
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