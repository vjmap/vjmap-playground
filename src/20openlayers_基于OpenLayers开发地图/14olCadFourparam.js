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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/14olCadFourparam
        // --互联网地图公共点叠加CAD图[互联网图为底图]--
        
        if (typeof ol !== "object") {
            // 如果没有openlayer环境
            await vjmap.addScript([{
                src: "../../js/ol7.1.0/ol.js"
            },{
                src: "../../js/ol7.1.0/ol.css"
            }]);
        }
        const layers = [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
            })
        ];
        const map = new ol.Map({
            layers: layers,
            target: 'map',
            view: new ol.View({
                center: vjmap.Projection.lngLat2Mercator([116.4849310885225,  39.960672361810566]),
                zoom: 16,
            }),
        });
        
        // 地图服务对象
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
        let layer = res.layer;//图层样式名
        
        
        // cad上面的点坐标
        let cadPoints = [
            vjmap.geoPoint([587464448.8435847, 3104003685.208651,]),
            vjmap.geoPoint([587761927.7224838, 3104005967.655292]),
            vjmap.geoPoint([587463688.0280377, 3103796743.3798513]),
            vjmap.geoPoint([587760406.0913897, 3103793700.1176634])
        ];
        
        
        // 在互联网图上面拾取的与上面的点一一对应的坐标(wgs84坐标)
        let webPoints = [
            vjmap.geoPoint([116.48476281710168, 39.96200739703454]),
            vjmap.geoPoint([116.48746772021137, 39.96022062215167]),
            vjmap.geoPoint([116.48585059441585, 39.9588451134361]),
            vjmap.geoPoint([116.48317418949145, 39.960515760972356])
        ]
        
        
        // 通过坐标参数求出四参数
        let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
        let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , false); // 这里考虑旋转
        let fourparam = [param.dx, param.dy, param.scale, param.rotate]
        
        // wms图层地址
        const getCadWmsUrl = (transparent) => {
            let wmsUrl = svc.wmsTileUrl({
                mapid: mapId, // 地图id
                layers: layer, // 图层名称
                bbox: '', // bbox这里不需要
                fourParameter: fourparam,
                transparent: transparent,
                backgroundColor: 'rgba(240, 255, 255)' // 不透明时有效
            })
            return wmsUrl
        }
        
        function getQueryStringArgs(url) {
            let theRequest = {};
            let idx = url.indexOf("?");
            if (idx != -1) {
                let str = url.substr(idx + 1);
                let strs = str.split("&");
                for (let i = 0; i < strs.length; i++) {
                    let items = strs[i].split("=");
                    theRequest[items[0]] = items[1];
                }
            }
            return theRequest;
        }
        
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let cadPrj = new vjmap.GeoProjection(mapBounds);
        
        
        // cad图坐标转3857坐标
        const cadToWebCoordinate = point => {
            // 再调用四参数反算求出web的坐标
            return vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(point), param)
        }
        // 3857转cad图坐标
        const webToCadCoordinate = point => {
            return vjmap.coordTransfromByFourParamter(vjmap.geoPoint(point), param)
        }
        let VisibleBounds = mapBounds.scale(0.4);
        let pt1 =  cadToWebCoordinate([VisibleBounds.min.x, VisibleBounds.min.y])
        let pt2 =  cadToWebCoordinate([VisibleBounds.min.x, VisibleBounds.max.y])
        let pt3 =  cadToWebCoordinate([VisibleBounds.max.x, VisibleBounds.max.y])
        let pt4 =  cadToWebCoordinate([VisibleBounds.max.x, VisibleBounds.min.y])
        // 计算出cad的范围
        let bounds = vjmap.GeoBounds.fromDataExtent([pt1, pt2, pt3, pt4])
        
        
        let wmsLayer;
        const addWmsLayer = async (transparent)=> {
            removeWmsLayer();
            let wmsUrl = getCadWmsUrl(transparent);
            wmsLayer = new ol.layer.Tile({
                // 范围
                extent: bounds.toArray(),
                source: new ol.source.TileWMS({
                    url: wmsUrl.substr(0, wmsUrl.indexOf("?")),
                    params: {...getQueryStringArgs(wmsUrl),'TILED': true}
                }),
            });
            // 在openlayer中增加wms图层
            map.addLayer(wmsLayer);
        }
        
        const removeWmsLayer = ()=> {
            if (!wmsLayer) return;
            map.removeLayer(wmsLayer);
            wmsLayer = null;
        }
        
        let cadGeoJsonLayer;
        let cadGeoJsonData
        const addGeoJsonLayer = async ()=> {
            if (cadGeoJsonLayer) return;
            if (!cadGeoJsonData) {
                cadGeoJsonData = await queryData(svc, cadPrj);
            }
            cadGeoJsonLayer = addGeoJsonData(map, cadGeoJsonData);
        }
        
        const removeGeoJsonLayer = ()=> {
            if (!cadGeoJsonLayer) return;
            map.removeLayer(cadGeoJsonLayer);
            cadGeoJsonLayer = null;
        }
        
        function addGeoJsonData(map, data) {
        
            const image = new ol.style.Circle({
                radius: 3,
                fill: null,
                stroke: new ol.style.Stroke({color: 'yellow', width: 1}),
            });
        
            const styles = {
                'Point': new ol.style.Style({
                    image: image,
                }),
                'LineString': new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'green',
                        width: 1,
                    }),
                }),
                'Polygon': new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'red',
                    }),
                })
            };
        
            const styleFunction = function (feature) {
                let style = styles[feature.getGeometry().getType()];
                const color = feature.get('color');
                if (style.getFill()) {
                    style.getFill().setColor(color);
                }
                if (style.getStroke()) {
                    style.getStroke().setColor(color);
                }
                return style;
            };
        
            const vectorSource = new ol.source.Vector({
                features: new ol.format.GeoJSON().readFeatures(data),
            });
        
        
            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: styleFunction,
            });
        
            map.addLayer(vectorLayer);
            return vectorLayer;
        }
        
        async function queryData(svc, cadPrj) {
            message.info("获取数据中，请稍候......")
            let res = await svc.conditionQueryFeature({
                condition: `1 == 1`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                fields: "",
                includegeom: true, // 是否返回几何数据,为了性能问题，realgeom为false时，如果返回条数大于1.只会返回每个实体的外包矩形，如果条数为1的话，会返回此实体的真实geojson；realgeom为true时每条都会返回实体的geojson
                realgeom: true,
                limit: 100000 //设置很大,不传的话，默认只能取100条
            }, pt => {
                // 查询到的每个点进行坐标处理回调
                let cadPoint = cadPrj.fromMercator(pt);// 转成cad的坐标
                let webPoint = cadToWebCoordinate(cadPoint); // 把cad的坐标转成当前地图的墨卡托坐标
                return [webPoint.x, webPoint.y];
            })
        
            if (res && res.result && res.result.length > 0) {
        
                let idx = 0;
                let features = [];
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = vjmap.entColorToHtmlColor(ent.color);
                        for (let g = 0; g < ent.geom.geometries.length; g++) {
                            features.push({
                                id: idx++,
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
                    }
                }
        
                let geom = {
                    type: "FeatureCollection",
                    features: features
                };
        
                return geom;
            }
        }
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "230px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => addWmsLayer(true)}>加载CAD的透明WMS图层
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => addWmsLayer(false)}>加载CAD的不透明WMS图层
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removeWmsLayer()}>移除CAD的WMS图层
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => addGeoJsonLayer()}>加载CAD的GeoJSON图层
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removeGeoJsonLayer()}>移除CAD的GeoJSON图层
                            </button>
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