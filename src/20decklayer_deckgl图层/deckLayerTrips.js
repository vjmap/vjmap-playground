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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerTrips
        // --deck路径流动图层--
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
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        // 限制地图范围为全图范围，防止多屏地图显示
        map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
        
        const mapBounds = map.getGeoBounds(0.6);
        
        // 下面增加deck的图层
        if (typeof deck !== "object") {
            // 如果没有deck环境
            await vjmap.addScript({
                src: "../../js/deck.gl.min.js"
            });
        
        }
        let geoDatas = []
        const data = [];
        const now = Date.now();
        for(let i = 0; i < 20; i++) {
            const points = map.toLngLat(mapBounds.randomPoints(3, 3));
            const color = [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)];
            data.push({
                id: i + 1,
                color,
                "waypoints": [
                    {
                        "coordinates": points[0],
                        "timestamp": now
                    },
                    {
                        "coordinates": points[1],
                        "timestamp": now + 1000
                    },
                    {
                        "coordinates": points[2],
                        "timestamp": now + 2000
                    }
                ]
            })
            geoDatas.push({
                points: points,
                properties: {
                    color
                }
            });
        };
        
        // 创建线路
        let lines = new vjmap.Polyline({
            data: geoDatas,
            lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            lineWidth: 10,
            lineOpacity: 0.1,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        lines.addTo(map);
        
        // 创建trip
        const deckLayer = new vjmap.DeckLayer({
            id: 'deck',
            type: deck.TripsLayer,
            data,
            getPath: d => d.waypoints.map(p => p.coordinates),
            // deduct start timestamp from each data point to avoid overflow
            getTimestamps: d => d.waypoints.map(p => p.timestamp -now),
            getColor: d => d.color,
            opacity: 0.8,
            widthMinPixels: 5,
            rounded: true,
            fadeTrail: true,
            trailLength: 200,
            currentTime: 0,
            pickable: true,
            autoHighlight: true,
            onClick: ({object}) => {
                message.info(`您点击了 Deck图层中的 第 ${object.id} 个对象`)
            }
        });
        map.addLayer(deckLayer);
        
        
        // 创建动画
        vjmap.createAnimation({
            from: 0,
            to: 2000, // 总共的时间
            repeat: Infinity,
            duration: 4000,
            ease:vjmap.linear, //线性
            onUpdate: latest => {
                // 修改当时时间属性
                deckLayer.setProps({currentTime: latest})
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