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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/03olselectHighlight
        // --选择高亮实体--在openlayer点击鼠标高亮实体
        
        // openlayers 官网地址 https://openlayers.org/
        // openlayers 源码地址 https://github.com/openlayers/openlayers
        if (typeof ol !== "object") {
            // 如果没有openlayer环境
            await vjmap.addScript([{
                src: "../../js/ol7.1.0/ol.js"
            },{
                src: "../../js/ol7.1.0/ol.css"
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
        // 获取所有图层
        const cadLayers = svc.getMapLayers();
        // 获取地图范围
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let mapPrj = new vjmap.GeoProjection(mapBounds);
        
        //自定义投影参数
        let cadProjection = new ol.proj.Projection({
            code: "cad",
            // extent用于确定缩放级别
            extent: mapBounds.toArray(),
            units: 'm'
        });
        // 设置每级的分辨率
        let resolutions= [];
        for(let i = 0; i < 25; i++) {
            resolutions.push(mapBounds.width() / (512 * Math.pow(2, i - 1)))
        }
        // 增加自定义的cad的坐标系
        ol.proj.addProjection(cadProjection);
        
        // 创建openlayer的地图对象
        let map = new ol.Map({
            target: 'map', // div的id
            view: new ol.View({
                center: mapBounds.center().toArray(),  // 地图中心点
                projection: cadProjection, // 刚自定义的cad的坐标系
                resolutions:resolutions, // 分辨率
                zoom: 2// 初始缩放级别
            })
        });
        
        // 增加一个瓦片图层
        let layer = new ol.layer.Tile({
            // 增加一个瓦片数据源
            source: new ol.source.TileImage({
                url: svc.rasterTileUrl() // 唯杰地图服务提供的cad的栅格瓦片服务地址
            })
        });
        // 在地图中增加上面的瓦片图层
        map.addLayer(layer);
        
        map.on('click', async (e) => {
            await highlight_ent(e.coordinate);
        });
        
        // 选择高亮的geojson数据
        const geojsonObject = {
            'type': 'FeatureCollection',
            'features': [
            ],
        };
        
        const vectorSource = new ol.source.Vector({
            projection: cadProjection, // 刚自定义的cad的坐标系
            features: new ol.format.GeoJSON().readFeatures(geojsonObject, {dataProjection: cadProjection}),
        });
        
        const highlightColor = svc.currentMapParam().darkMode ? "#57FFC9" : "#11F";
        const image = new ol.style.Circle({
            radius: 3,
            fill: null,
            stroke: new ol.style.Stroke({color: highlightColor, width: 1}),
        });
        
        const styles = {
            'Point': new ol.style.Style({
                image: image,
            }),
            'LineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: highlightColor,
                    width: 2,
                }),
            }),
            'MultiLineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: highlightColor,
                    width: 2,
                }),
            }),
            'MultiPoint': new ol.style.Style({
                image: image,
            }),
            'MultiPolygon': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: highlightColor,
                    width: 2,
                }),
                fill: new ol.style.Fill({
                    color: highlightColor,
                }),
            }),
            'Polygon': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: highlightColor,
                    width: 2,
                }),
                fill: new ol.style.Fill({
                    color: highlightColor,
                }),
            }),
            'Circle': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: highlightColor,
                    width: 2,
                }),
                fill: new ol.style.Fill({
                    color: highlightColor,
                }),
            }),
        };
        
        const styleFunction = function (feature) {
            return styles[feature.getGeometry().getType()];
        };
        
        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: styleFunction,
        });
        map.addLayer(vectorLayer);
        
        
        
        const highlight_ent = async co => {
            vectorSource.clear();
            let res = await svc.pointQueryFeature({
                x: co[0],
                y: co[1],
                zoom: map.getView().getZoom(),
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
                geojsonObject.features = features;
                if (geojsonObject.features.length > 0) {
                    vectorSource.addFeatures( new ol.format.GeoJSON().readFeatures(geojsonObject, {dataProjection: cadProjection}))
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