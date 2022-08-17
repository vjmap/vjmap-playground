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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polygon/polygonzHoverLineWidth
        // --多边形高亮时显示线宽--
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
        //map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds(0.3);
        
        let len = mapBounds.width() / 40;
        let polygonDatas = []
        for(let i = 0; i < 50; i++) {
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x - len, p1.y - len]);
            const p3 = vjmap.geoPoint([p1.x - len, p1.y + len]);
            const p4 = vjmap.geoPoint([p1.x + len, p1.y + len]);
            const p5 = vjmap.geoPoint([p1.x + len, p1.y - len]);
            polygonDatas.push({
                points: map.toLngLat([p2, p3, p4, p5, p2]),
                properties: {
                    id: i + 1,
                    name: "polygon" + (i + 1),
                    color: vjmap.randomColor()
                }
            })
        }
        
        
        let polygon = new vjmap.Polygon({
            data: polygonDatas,
            fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillOpacity: 0.5,
            fillOutlineColor: "#ff0",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polygon.addTo(map);
        polygon.hoverFeatureState(e => {
            if (e.features) {
                // 在多边形上面时，显示有线宽的高亮线
                // 通过id获取数据源中的原始数据。不能直接通过geometry来获取，因为一个geojson数据会拆分成多个瓦片数据，如果不想查的话，可以把坐标数据放进属性字段时，这里通过属性字段获取
                let featureData = map.getSourceData(e.features[0].source).features.filter(f => f.id === e.features[0].id);
                showHideWidthHoverPolyline(true, featureData[0].geometry.coordinates[0])
            }
        }, () => {
            // 不在多边形上面时，隐藏有线宽的高亮线
            showHideWidthHoverPolyline(false)
        })
        let hoverWidthPolyline;
        // 显示隐藏高亮线
        const showHideWidthHoverPolyline = (visible, coords) => {
            if (visible) {
                if (hoverWidthPolyline) {
                    hoverWidthPolyline.setData(coords) // 只修改坐标
                    return;//如果已经在了
                }
                // 第一次生成
                hoverWidthPolyline= new vjmap.Polyline({
                    data: coords,
                    lineWidth: 5,
                    lineColor: "#ff0"
                })
                hoverWidthPolyline.addTo(map);
        
            } else {
                if (!hoverWidthPolyline) return;//如果已经不在了
                hoverWidthPolyline.setData([]); // 清空数据
            }
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