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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/02olvector
        // --加载唯杰地图CAD矢量瓦片--使用openlayer来加载唯杰地图服务提供的CAD矢量瓦片
        
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
        // 获取地图范围
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        
        //自定义投影参数
        let cadProjection = new ol.proj.Projection({
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
        
        // 增加一个矢量瓦片图层
        let layer = new ol.layer.VectorTile({
            // 增加一个瓦片数据源
            source: new ol.source.VectorTile({
                projection: cadProjection,
                format: new ol.format.MVT(),
                url: svc.vectorTileUrl() // 唯杰地图服务提供的cad的矢量瓦片服务地址
            }),
            style: createVjMapVectorStyle(ol.style.Style, ol.style.Fill, ol.style.Stroke, ol.style.Circle)
        });
        // 在地图中增加上面的瓦片图层
        map.addLayer(layer);
        
        // 创建样式
        function createVjMapVectorStyle(Style, Fill, Stroke, Circle) {
            let fill = new Fill({color: ''});
            let stroke = new Stroke({color: '', width: 1});
            let polygon = new Style({fill: fill});
            let image = new Circle({
                radius: 1,
                fill: new Fill({color: '', }),
            })
            let strokedPolygon = new Style({fill: fill, stroke: stroke});
            let line = new Style({stroke: stroke});
            let circle = new Style({image: image});
        
            let styles = [];
            return function(feature, resolution) {
                let length = 0;
                let geom = feature.getGeometry().getType();
                // 获取颜色属性
                let color = vjmap.entColorToHtmlColor(feature.getProperties().color, svc.currentMapParam().darkMode, feature.getProperties().alpha);
                if (geom == 'Polygon' || geom == 'MultiPolygon') {
                    // 多边形
                    fill.setColor(color);
                    stroke.setColor(color);
                    styles[length++] = strokedPolygon;
                } else if (geom == 'LineString' || geom == 'MultiLineString' ) {
                    // 线
                    stroke.setColor(color);
                    let width = feature.getProperties().linewidth;
                    if (width > 0) stroke.setWidth(width > 0 ? width : 1);
                    styles[length++] = line;
                } else if (geom == 'Point' || geom == 'MultiPoint') {
                    // 点
                    image.getFill().setColor(color);
                    styles[length++] = circle;
                } else {
                    console.log(geom)
                }
                styles.length = length;
                return styles;
            };
        }
        
        map.on('click', (e) => message.info({content: `您点击的坐标为： ${JSON.stringify(e.coordinate)}`, key: "info", duration: 3}));
        // 鼠标悬浮时高亮实体，如果需要点击或hover时选择高亮实体，用下面的代码
        const enableHighlightLayer = () => {
            let selection = {};
            // 选择的样式
            const selectedStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(200,20,20,0.8)',
                    width: 2,
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(200,20,20,0.4)',
                }),
                image: new ol.style.Circle({
                    radius: 3,
                    fill: new ol.style.Fill({color: 'rgba(200,20,20,0.4)'}),
                })
            });
        
            // Selection
            const selectionLayer = new ol.layer.VectorTile({
                map: map,
                renderMode: 'vector',
                projection: cadProjection,
                source: layer.getSource(),
                style: function (feature) {
                    if (feature.getId() in selection) {
                        return selectedStyle;
                    }
                },
            });
            map.on(['pointermove'], function (event) {
                layer.getFeatures(event.pixel).then(function (features) {
                    if (!features.length) {
                        selection = {};
                        selectionLayer.changed();
                        return;
                    }
                    const feature = features[0];
                    if (!feature) {
                        return;
                    }
                    const fid = feature.getId();
                    // add selected feature to lookup
                    selection[fid] = feature;
                    selectionLayer.changed();
        
                    let content = `feature: ${fid}; layer: ${feature.getProperties().layer}; type: ${feature.getProperties().type}`
                    message.info({ content, key: "info", duration: 3});
                });
            });
        }
        enableHighlightLayer();
        
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