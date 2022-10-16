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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/10olfindtextdrawbounds
        // --查询图中所有文字并绘制边框--
        
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
        let mapPrj = new vjmap.GeoProjection(mapBounds);
        
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
        
        // 增加一个瓦片图层
        let layer = new ol.layer.Tile({
            // 增加一个瓦片数据源
            source: new ol.source.TileImage({
                url: svc.rasterTileUrl() // 唯杰地图服务提供的cad的栅格瓦片服务地址
            })
        });
        // 在地图中增加上面的瓦片图层
        map.addLayer(layer);
        
        map.on('click', (e) => message.info({content: `您点击的坐标为： ${JSON.stringify(e.coordinate)}`, key: "info", duration: 3}));
        
        
        // 实体类型ID和名称映射
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        const queryTextAndDrawBounds = async () => {
            let queryTextEntTypeId = getTypeNameById("AcDbText"); // 单行文字
            let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // 多行文字
            let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // 属性定义文字
            let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // 属性文字
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                fields: "",
                limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
            }, pt => {
                // 查询到的每个点进行坐标处理回调
                return mapPrj.fromMercator(pt);// 转成cad的坐标
            })
            if (query.error) {
                message.error(query.error)
            } else {
                message.info(`查询到符合的记数条数：${query.recordCount}`)
        
                if (query.recordCount > 0) {
                    let features = [];
                    for(var i = 0; i < query.recordCount; i++) {
                        let bounds = vjmap.getEnvelopBounds(query.result[i].envelop, mapPrj);
                        let clr = vjmap.entColorToHtmlColor(query.result[i].color); // 实体颜色转html颜色(
        
                        features.push({
                            type: "Feature",
                            properties: {
                                name: "objectid:" + query.result[i].objectid,
                                color: clr
                            },
                            geometry: {
                                'type': 'Polygon',
                                'coordinates': [
                                    bounds.toPointArray(),
                                ],
                            }
                        })
                    }
        
                    if (!vectorSource) {
                        // 如果之前没有高亮矢量图层
                        addHighLightLayer();
                    }
                    vectorSource.clear();
                    let geojsonObject = {
                        'type': 'FeatureCollection',
                        'features': features
                    }
                    // 修改矢量数据源数据
                    vectorSource.addFeatures( new ol.format.GeoJSON().readFeatures(geojsonObject, {dataProjection: cadProjection}))
                }
            }
        }
        
        let vectorSource;
        const addHighLightLayer = ()=> {
            // 选择高亮的geojson数据
            const geojsonObject = {
                'type': 'FeatureCollection',
                'features': [
                ],
            };
            vectorSource = new ol.source.Vector({
                projection: cadProjection, // 刚自定义的cad的坐标系
                features: new ol.format.GeoJSON().readFeatures(geojsonObject, {dataProjection: cadProjection}),
            });
        
            const styles = {
                'Polygon': new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: "#FF48AA",
                        width: 2,
                    }),
                    fill: new ol.style.Fill({
                        color: "#FF48AA40"
                    }),
                })
            };
        
            const styleFunction = function (feature) {
                return styles[feature.getGeometry().getType()];
            };
        
            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: styleFunction,
            });
            map.addLayer(vectorLayer);
        }
        
        const App = () => {
            const handleClick = async () => {
                queryTextAndDrawBounds()
            };
            return (
                <div>
                    <div className="info ">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={handleClick}>请点击此按钮查询所有文字并绘制边框</button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        
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