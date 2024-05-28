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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/contextmenu/02contextmenuOverlay
        // --覆盖物图层右键菜单--
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
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        await map.onLoad();
        
        // 下面加很多多边形做测试,在多边形上右键时将弹出多边形的右键菜单，否则弹出地图的右键菜单
        let mapBounds = map.getGeoBounds(0.6);
        
        let len = mapBounds.width() / 50;
        let polygons = []
        for(let i = 0; i < 200; i++) {
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
        
        
        // 默认情况下显示的是地图菜单，因为这里的key是空，如果多次设置setMenu时，根据key值排序倒序，空值会在最后面
        map.setMenu(event => {
            return new vjmap.ContextMenu({
                event: event.originalEvent,
                theme: "dark", //light
                width: "250px",
                items: [
                    {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">我是地图的右键菜单</span>`},
                    {
                        label: '全图范围显示',
                        onClick: () => {
                            map.setBearing(0);
                            map.setPitch(0);
                            map.fitMapBounds();
                        }
                    },
                    {
                        label: '获取此位置的坐标',
                        onClick: () => {
                            let point = map.fromLngLat(event.lngLat);
                            message.info({content: `当前坐标为 x: ${point.x}, y: ${point.y}`, key: "info", duration: 3});
                        }
                    }
                ]
            });
        })
        
        // 设置点击一个覆盖物时弹出菜单,key值可以自定义设置。如果函数返回空时，将触发上面的地图右键菜单。如果函数不返回空，则会弹出此函数的菜单
        map.setMenu(event => {
            let features = map.queryRenderedFeatures(event.point, {
                layers: [polygon.layerId]
            });
            if (features.length == 0) {
                // 如果点击位置没有上面多边形图层的实体，则将回空，这样将会弹出上面的默认地图菜单
                return null;
            }
            // 如果点击位置有上面多边形图层的实体，则弹出此图层的自定义右键菜单
            return new vjmap.ContextMenu({
                event: event.originalEvent,
                theme: "dark", //light
                width: "250px",
                items: [
                    {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">我是多边形图层的右键菜单</span>`},
                    {
                        label: '查看选择的多边形信息',
                        onClick: () => {
                            message.info({content: `当前多边形ID: ${features[0].properties.id}, 当前多边形颜色: ${features[0].properties.color}`, key: "info", duration: 3});
                        }
                    },
                    {
                        label: '删除',
                        onClick: () => {
                            let data = polygon.getData();
                            data.features = data.features.filter(f => f.id != features[0].properties.id);
                            polygon.setData(data);
                        }
                    }
                ]
            });
        }, "overlay")
        
        
        
        // 绘图控件右键菜单
        const draw = new vjmap.Draw.Tool();
        map.addControl(draw, 'top-right');
        
        map.on("draw.simpleselect.contextmenu", function (e) {
            // 如果不是此draw对象的事件，则不用管
            if (e.styleId != draw.options.styleId) return;
            let feature = e.event.featureTarget
            if (!feature) return
            //if (draw.getMode() != "simple_select") return
            let selectFeatureId = feature.properties.id
            // 需要选中的才能右键
            let selectIds = draw.getSelectedIds() || []
            if (selectIds.indexOf(selectFeatureId)== -1) return
            let event = e.event.originalEvent
            // 阻止地图默认右键菜单触发
            event.preventDefault();
            event.stopPropagation();
        
            return new vjmap.ContextMenu({
                event: event,
                theme: "dark", //light
                width: "250px",
                items: [
                    {
                        label: "删除",
                        onClick: () => {
                            draw.delete(selectFeatureId)
                        }
                    }
                ]
            });
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