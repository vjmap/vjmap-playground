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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/maptalks/03maptalksselectHighlight
        // --选择高亮实体--在maptalks点击鼠标高亮实体
        
        // maptalks 官网地址 https://maptalks.org/
        // maptalks 源码地址 https://github.com/maptalks/maptalks.js
        if (typeof L !== "object") {
            // 如果没有maptalks环境
            await vjmap.addScript([{
                src: "../../js/maptalks1.0rc14/maptalks.min.js"
            },{
                src: "../../js/maptalks1.0rc14/maptalks.css"
            }]);
        }
        
        // 地图服务对象，调用唯杰地图服务打开地图，获取地图的元数据
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let mapId = "sys_zp";
        let res = await svc.openMap({
            mapid: mapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let mapPrj = new vjmap.GeoProjection(mapBounds);
        // 获取所有图层
        const cadLayers = svc.getMapLayers();
        
        // 设置每级的分辨率
        let resolutions= [];
        for(let i = 0; i < 25; i++) {
            resolutions.push(mapBounds.width() / (512 * Math.pow(2, i - 1)))
        }
        
        // 创建maptalks的地图对象
        let map = new maptalks.Map('map', {
            center: mapBounds.center().toArray(), // 初始化中心点
            zoom:  2, // 初始化级别
            zoomControl: true,
            attribution: false,
            // 定义基于CAD地图范围的空间坐标系
            spatialReference : {
                projection : 'identity',
                resolutions : resolutions,
                fullExtent : {
                    'top': mapBounds.max.y,
                    'left': mapBounds.min.x,
                    'bottom': mapBounds.min.y,
                    'right': mapBounds.max.x
                }
            }
        });
        
        // 创建一个瓦片图层
        let layer = new maptalks.TileLayer('base', {
            tileSystem: [1, -1, mapBounds.min.x, mapBounds.max.y],
            urlTemplate: svc.rasterTileUrl(), // 唯杰地图服务提供的cad的栅格瓦片服务地址
            repeatWorld: false
        });
        map.addLayer(layer);
        
        
        map.on('click', async (e) => {
            console.log(e)
            await highlight_ent([e.coordinate.x, e.coordinate.y]);
        });
        
        
        
        let highlightLayer; // 高亮图层
        const highlight_ent = async co => {
            if (highlightLayer) {
                map.removeLayer(highlightLayer);; // 先删除之前的高亮图层
                highlightLayer = null;
            }
            let res = await svc.pointQueryFeature({
                x: co[0],
                y: co[1],
                zoom: map.getZoom(),
                fields: ""
            }, pt => {
                // 查询到的每个点进行坐标处理回调
                return mapPrj.fromMercator(pt);// 转成cad的坐标
            })
            if (res && res.result && res.result.length > 0) {
                let features = [];
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = vjmap.entColorToHtmlColor(ent.color);
                        for (let g = 0; g < ent.geom.geometries.length; g++) {
                            features.push({
                                type: "Feature",
                                properties: {
                                    objectid: ent.objectid + "_" + g,
                                    color: clr,
                                    alpha: ent.alpha / 255,
                                    lineWidth: 1,
                                    name: ent.name,
                                    isline: ent.isline,
                                    layerindex: ent.layerindex
                                },
                                geometry: ent.geom.geometries[g]
                            })
                        }
                        // 选择提示
                        let content = `feature: ${ent.objectid}; layer: ${cadLayers[ent.layerindex].name}; type: ${ent.name}`
                        message.info({ content, key: "info", duration: 3});
                    }
                }
                let data = {
                    type: "FeatureCollection",
                    features: features
                }
                if (data.features.length > 0) {
                    highlightLayer = new maptalks.VectorLayer('vector')
                    map.addLayer(highlightLayer);
                    highlightLayer.setStyle([{
                        symbol: {
                            polygonFill: '#57FFC9',
                            polygonOpacity: 0.5,
                            lineColor: '#57FFC9',
                            lineWidth: 2
                        }
                    }])
                    data.features.forEach(ft => {
                        let geomerty = maptalks.GeoJSON.toGeometry(ft);
                        geomerty.addTo(highlightLayer);
                    })
                }
            }
        };
        
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