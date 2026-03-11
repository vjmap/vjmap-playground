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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/14switchMapDestory
        // --切换图形[地图对象改变，同个div]--先销毁地图，再用地图关联同一个div去创建
        
        // 要切换的mapid数组
        const mapids = ["sys_zp", "sys_hello", "sys_world", "sys_cad2000"]
        let curMapIdIndex = 0;
        /**
         * 创建地图对象
         * @param serviceUrl 服务地址接口
         * @param mapId 地图ID
         * @param mapOpenWay 打开方式，缺省vjmap.MapOpenWay.GeomRender
         * @param isRaster true为栅格，false为矢量
         * @return {Promise<Map>}
         */
        async function newMap(serviceUrl, mapId, mapOpenWay = vjmap.MapOpenWay.GeomRender, isRaster = true) {
            // 地图服务对象
            let svc = new vjmap.Service(serviceUrl, env.accessToken)
            // 打开地图
            let res = await svc.openMap({
                mapid: mapids[curMapIdIndex], // 地图ID
                mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
                style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
            })
            if (res.error) {
                // 如果打开出错
                throw Error(res.error)
            }
            // 获取地图范围
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // 根据地图范围建立几何投影坐标系
            let prj = new vjmap.GeoProjection(mapExtent);
        
            // 如果为内存方式打开，则只能为栅格方式
            if (mapOpenWay === vjmap.MapOpenWay.Memory) {
                isRaster = true;
            }
            // 地图样式
            let style = isRaster ? svc.rasterStyle() :	svc.vectorStyle();
            // 地图对象
            let map = new vjmap.Map({
                container: 'map', // DIV容器ID
                style: style, // 样式，这里是栅格样式
                center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
                zoom: 2, // 设置地图缩放级别
                renderWorldCopies: false // 不显示多屏地图
            });
        
            // 关联服务对象和投影对象
            map.attach(svc, prj);
            // 根据地图本身范围缩放地图至全图显示
            map.fitMapBounds();
        
        
            // 使地图能选择点击拾取高亮
            if (isRaster) {
                map.enableLayerClickHighlight(svc, e => {
                    if (!e) return;
                    let content = `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`
                    e && map.logInfo(content);
                })
            } else {
                // 有高亮状态（鼠标在地图元素上时，会高亮)
                map.enableVectorLayerHoverHighlight((event, feature, layer) => {
                    if (!feature) return;
                    // 点击高亮实体回调事件
                    let content = `event: ${event}; feature: ${feature.id}; layer: ${layer}`
                    map.logInfo(content)
                })
            }
        
            await map.onLoad();
            map.logInfo("地图加载完成", "success")
        
            // 给地图增加一些数据图层做为测试
            await addDataLayer(map);
        
            return map;
        }
        
        // 给地图增加一些数据图层做为测试
        const addDataLayer = async (map) => {
            // 导航条控件
            map.addControl(new vjmap.NavigationControl());
            // 鼠标移动显示坐标位置控件
            map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
            let bounds = map.getGeoBounds() ;// 获取地图范围
            // 增加marker
            for(let n = 0; n < 3; n++) {
                let marker = new vjmap.Marker({
                    color: vjmap.randomColor(),
                    draggable: true
                }).setLngLat(map.toLngLat(bounds.randomPoint()))
                marker.addTo(map);
            }
        
            // 增加一个随机位置的popup
            let popupPoint = bounds.randomPoint();
            let popup = new vjmap.Popup({ closeOnClick: false })
                .setLngLat(map.toLngLat(popupPoint))
                .setHTML(`<h2><p style="color:#f00">我是Popup</p></h2>`)
                .addTo(map);
        
            // 创建polyline对象，包含三条随机线
            let polylineData = [];
            for(let i = 0; i < 3; i++) {
                // 每条线有2-4个随机点
                const points = bounds.randomPoints(2, 4);
                polylineData.push({
                    points: map.toLngLat(points),
                    properties: {
                        name: `线 ${i+1}`,
                        color: vjmap.randomColor()
                    }
                });
            }
        
            // 创建polyline对象
            let polylines = new vjmap.Polyline({
                data: polylineData,
                lineColor: ['get', 'color'],
                lineWidth: 3,
                lineOpacity: 0.8,
                isHoverPointer: true
            });
            polylines.addTo(map);
        
            // 添加点击事件
            polylines.clickLayer(e => {
                map.logInfo(`您点击了: ${e.features[0].properties.name}`);
            });
        
        
            for (let i = 0; i < 4; i++) {
                // await map.loadImageEx("icon" + i, env.assetsPath + `images/sensor${i + 1}.png`);
                await map.loadImageEx("icon" + i, `https://vjmap.com/../../assets/images/sensor${i + 1}.png`);
            }
        
            const geoDatas = []
            for (let i = 0; i < 10; i++) {
                const pt = bounds.randomPoint();
                const data = {
                    point: map.toLngLat(pt),
                    properties: {
                        name: `ID:${i + 1}`,
                        icon: "icon" + vjmap.randInt(0, 3)
                    }
                }
                geoDatas.push(data);
            }
        
            const symbols = new vjmap.Symbol({
                data: geoDatas,
                // 图标名来源于geojson属性中的icon字段
                iconImage: ['get', 'icon'],
                // 二级以下全部用icon1图标，二级以上用自己属性中的图标名
                //iconImage: ["step", ["zoom"], "icon1", 2, ['get', 'icon']],
                iconOffset: [0, -12],
                // 鼠标hover时设置透明度0.8,不悬浮1.0
                iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 1.0],
                textField: ['get', 'name'],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 14,
                textColor: '#FFA0FD',
                textOffset: [0, 0.5],
                textAnchor: 'top',
                iconAllowOverlap: false,
                textAllowOverlap: false,
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            symbols.addTo(map);
            symbols.clickLayer(e => {
                if (e.defaultPrevented) return; //  如果事件之前阻止了，则不再执行了
                map.logInfo(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，的图标`)
                e.preventDefault(); // 阻止之后的事件执行
            })
        
        
            let geoDatas2 = [];
            for(let i = 1;  i <= 2; i++) {
                let mapBounds = map.getGeoBounds(i / 10.0);
                let points = mapBounds.toPointArray();
                points.push(points[0]); // 闭合
                geoDatas2.push({
                    points: map.toLngLat(points),
                    id: i,
                    properties: {
                        lineWidth: 8 + i * 2,
                        name: `${i}环`
                    }
                });
            }
        
            let arrowAnimateLine = vjmap.createArrowAnimateLineLayer(map, geoDatas2, {
                arrowFillColor: vjmap.randomColor(),
                arrowStrokeColor: "#fff",
                arrowStrokeWidth: 6,
                canvasWidth: 128,
                canvasHeight: 32,
                arrowWidth: 16,
                frameCount: 4,
                lineWidth: ['get', 'lineWidth'],
                lineOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            arrowAnimateLine.polyline.clickLayer(e => map.logInfo(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}`))
            arrowAnimateLine.polyline.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
        
            // 获取绘制图层
            const draw = map.getDrawLayer();
        
            // 初始加入一个多边形
            draw.set(vjmap.createPolygonGeoJson(map.toLngLat(bounds.randomPoints(3, 3))));
        
        }
        
        
        
        // 创建地图
        let map = await newMap(env.serviceUrl, env.exampleMapId, vjmap.MapOpenWay.GeomRender, true)
        
        
        setInterval(async () => {
            map.logInfo("销毁地图")
            map.destory(); // 销毁地图
            curMapIdIndex = (curMapIdIndex + 1) % mapids.length;
            // 再创建一个新的map对象
            map = await newMap(env.serviceUrl, env.exampleMapId, vjmap.MapOpenWay.GeomRender, true)
        }, 10000)
        
        
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