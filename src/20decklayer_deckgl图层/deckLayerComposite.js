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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerComposite
        // --复合图层[与deck图层叠加]--
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
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        let len = mapBounds.width() / 100;
        {
            // 增加vjmap中自己的多边形图层
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
            polygon.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        
        }
        // 下面增加deck的图层
        if (typeof deck !== "object") {
            // 如果没有deck环境
            await vjmap.addScript({
                src: "../../js/deck.gl.min.js"
            })
        }
        
        // 生成随机数据
        const data = [];
        for(let i = 0; i < 100; i++) {
            data.push({
                id: i + 1,
                position: map.toLngLat(mapBounds.randomPoint()),
                radius: vjmap.randInt(prj.toMeter(len / 2), prj.toMeter(len)),
                color: [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)]
            })
        }
        // 增加一个deck图层
        const popup = new vjmap.Popup({ closeButton: false })
        const deckLayer = new vjmap.DeckLayer({
            id: 'my-scatterplot',
            type: deck.ScatterplotLayer,
            data: data,
            wrapLongitude: false,
            getPosition: d => d.position,
            getRadius: d => d.radius,
            getFillColor: d => d.color,
            radiusUnits: "meters", // pixels
            autoHighlight: true,
            highlightColor: [255, 0, 0],
            pickable: true,
            onHover: ({object}) => {
                if (object) {
                    popup.setLngLat(object.position);
                    popup.setHTML(`id: ${object.id}`);
                    popup.addTo(map);
                } else {
                    popup.remove();
                }
            },
            onClick: ({object}) => {
                message.info(`您点击了 Deck图层中的 第 ${object.id} 个对象`)
            }
        });
        map.addLayer(deckLayer);
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