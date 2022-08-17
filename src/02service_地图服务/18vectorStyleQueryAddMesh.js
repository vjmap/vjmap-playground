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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/18vectorStyleQueryAddMesh
        // --查询矢量数据并绘制物件--根据不同条件查询前端矢量数据并绘制相关物件
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
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },// 矢量瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            pitch: 60,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        // 限制地图范围为全图范围，防止多屏地图显示
        map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
        
        const len = mapExtent.width() / 80;
        // 获取所有图层
        const layers = svc.getMapLayers();
        const prefix = "my";
        // 矢量瓦片数据源
        const sourceId = prefix + "-source";
        map.addVectorSource(sourceId, svc.vectorTileUrl(), {
            maxzoom: 25,
            minzoom: 0
        });
        
        const mapParam = svc.currentMapParam();
        const darkMode = mapParam && mapParam.darkMode;
        // 反色设置
        const darkColor = [
            "case",
            ["==", ["get", "color"], "#000000"],
            "#FFFFFF",
            ["get", "color"]
        ];
        
        const color = [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "rgba(0,0,255,255)",
            darkMode ? darkColor : ["get", "color"]
        ];
        
        // 线图层
        map.addLineLayer(prefix + "-layer-lines", sourceId, {
            source: sourceId,
            sourceLayer: "lines",
            lineCap: "round",
            lineColor: color,
            lineWidth: [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                3,
                ["get", "linewidth"]
            ]
        })
        
        // 拉伸图层
        map.addFillExtrusionLayer(prefix + "-layer-polygons", sourceId, {
            source: sourceId,
            sourceLayer: "polygons",
            fillExtrusionColor: color,
            fillExtrusionBase: 0,
            fillExtrusionHeight: prj.toMeter(len)
        })
        
        // 实体类型ID和名称映射
        const { entTypeIdMap } = await svc.getConstData();
        // 有高亮状态（鼠标在地图元素上时，会高亮)
        map.enableVectorLayerHoverHighlight((event, feature, layer) => {
            // 点击高亮实体回调事件
            const prop = feature.properties;
            let content = `event: ${event}; feature: ${feature.id}; layer: ${layers[prop.layer].name}; type: ${entTypeIdMap[prop.type]}`
            message.info({ content, key: "info", duration: 5});
        }, prefix)
        
        // 下面增加deck的图层
        if (typeof deck !== "object") {
            // 如果没有deck环境
            await vjmap.addScript([{
                src: "../../js/deck.gl.min.js"
            },{
                src: "../../js/loaders.gl/core/dist/dist.min.js"
            },{
                src: "../../js/loaders.gl/obj/dist/dist.min.js"
            }]);
            // 注册加载
            loaders.registerLoaders([loaders.OBJLoader]);
        }
        
        // 等待数据源加载完成
        const waitSourceLoaded = () => {
            return new Promise((resolve, reject) => {
                const lister = ()=> {
                    if (map.getSource(sourceId) && map.isSourceLoaded(sourceId)) {
                        map.off("sourcedata", lister);
                        resolve({});
                    }
                };
                map.on("sourcedata", lister);
            });
        }
        
        await waitSourceLoaded();
        // 查询0图层实体类型为圆的所有实体
        const featureType = "AcDbCircle";
        const featureTypeIndex = Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === featureType); // 结果为7
        const features = map.querySourceFeatures(sourceId, {sourceLayer: "lines", filter: ["all", ["==", "layer", 22],["==", "type", +featureTypeIndex]]});
        // 得到查询到的实体的中心点
        const points = features.map(f => {
            const geom = f.geometry.coordinates;
            const pt = vjmap.GeoBounds.fromDataExtent(geom).center(); // 得到中心点
            return [pt.x, pt.y];
        });
        
        const data = [];
        for(let i = 0; i < points.length; i++) {
            data.push({
                id: i + 1,
                position: points[i],
                color: [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)],
                angle: vjmap.randInt(0, 360)
            })
        }
        
        const deckLayer = new vjmap.DeckLayer({
            id: 'scatterplot',
            type: deck.SimpleMeshLayer,
            data: data,
            getPosition: d => d.position,
            mesh: env.assetsPath + "data/Bulbasaur.obj",
            getColor: d => d.color,
            getOrientation: d => [0, d.angle, 90],
            sizeScale: 40000,
            autoHighlight: true,
            pickable: true,
            onClick: ({object}) => {
                message.info(`您点击了 Deck图层中的 第 ${object.id} 个对象`)
            }
        });
        map.addLayer(deckLayer);
        
        map.flyTo({center: [-61.59, 13.28], zoom: 4, pitch: 58, bearing: 112});
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