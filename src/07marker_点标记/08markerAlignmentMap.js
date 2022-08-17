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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/08markerAlignmentMap
        // --和地图对齐的点标记--当地图旋转或倾斜时，标记Marker和地图方向保持一致
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
            pitch: 60,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        
        await map.onLoad();
        const mapBounds = map.getGeoBounds(0.4);
        let geoDatas = [];
        let len1 = mapBounds.width() / 50;
        
        // 自定义点标记icon
        const createIconMarker = (lngLat, height) => {
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage =
                'url("../../assets/images/a7.png")';
            el.style.width = '256px';
            el.style.height = '256px';
            el.style.backgroundSize = '100%';
        
        
            let marker = new vjmap.Marker({
                element: el,
                anchor: 'center',
                pitchAlignment: "map", // 与地图对齐，缺省是"viewport"对齐
                rotationAlignment: "map",// 与地图对齐，缺省是"viewport"对齐
            }).setLngLat(lngLat);
            marker.setHeight(height); // 设置高度
            marker.setScaleMaxZoom(4); // 小于4级时，div将自动缩放
            marker.setRotation(vjmap.randInt(0, 180)) // 随机设置一个旋转角度
            marker.addTo(map);
        }
        
        for (let i = 0; i < 10; i++) {
            const pts = []
            const len = len1;
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x - len, p1.y - len]);
            const p3 = vjmap.geoPoint([p1.x - len, p1.y + len]);
            const p4 = vjmap.geoPoint([p1.x + len, p1.y + len]);
            const p5 = vjmap.geoPoint([p1.x + len, p1.y - len]);
            pts.push(p2, p3, p4, p5);
        
            let height = map.pixelToHeight(vjmap.randInt(100, 150), 2) ;// 在第2级有100-150个像素的高度
            geoDatas.push({
                points: map.toLngLat(pts),
                properties: {
                    name: "square",
                    color: vjmap.randomColor(),
                    baseHeight: 0,
                    height: height
                }
            })
        
            createIconMarker(map.toLngLat(p1), height);
        }
        
        
        let fillExtrusions = new vjmap.FillExtrusion({
            data: geoDatas,
            fillExtrusionColor: ['get', 'color'],
            fillExtrusionOpacity: 0.7,
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'baseHeight']
        });
        fillExtrusions.addTo(map);
        
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