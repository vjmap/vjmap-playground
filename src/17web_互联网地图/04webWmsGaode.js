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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/04webWmsGaode
        // --高德地图与CAD图叠加[高德地图为底图]--高德地图与CAD图叠加，以高德地图为坐标系
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 根据地图范围建立经纬度投影坐标系
        let prj = new vjmap.LnglatProjection();
        
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {
                    // 道路
                    gaodeRoadSource: {
                        type: 'raster',
                        tiles: ["https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"],
                    },
                    // 影像无文字注记
                    gaodeImgSource: {
                        type: 'raster',
                        tiles:  [
                            "https://webst02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                        ],
                    },
                    // 影像文字注记
                    gaodeImgSourceLabel: {
                        type: 'raster',
                        tiles:  [
                            "https://webst02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                        ],
                    }
                },
                layers: [{
                    id: 'gaodeRoad',
                    type: 'raster',
                    source: 'gaodeRoadSource',
                },{
                    id: 'gaodeImg',
                    type: 'raster',
                    source: 'gaodeImgSource',
                    layout: {
                        visibility: "none"
                    }
                },{
                    id: 'gaodeImgLabel',
                    type: 'raster',
                    source: 'gaodeImgSourceLabel',
                    layout: {
                        visibility: "none"
                    }
                }]
            },
            center: [0, 0],
            zoom: 12,
            pitch: 0,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        await map.onLoad();
        
        
        // 先打开cad图
        let mapId = "sys_cadcesium";
        let res = await svc.openMap({
            mapid: mapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapLightStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        let layer = res.layer;//图层样式名
        
        let cadEpsg = "EPSG:4544";// cad图的espg代号
        // 增加cad的wms图层
        let wmsUrl = svc.wmsTileUrl({
            mapid: mapId, // 地图id
            layers: layer, // 图层名称
            srs: "EPSG:3857",
            crs: cadEpsg,
            webMapType: "GCJ02" // 底图是高德地图，所以要选GCJ02,如果是天地图，可以不用填此项
        })
        map.addSource('wms-test-source', {
            'type': 'raster',
            'tiles': [
                wmsUrl
            ],
            'tileSize': 256
        });
        map.addLayer({
                'id': 'wms-test-layer',
                'type': 'raster',
                'source': 'wms-test-source',
                'paint': { "raster-opacity": 1 }
            }
        );
        
        // 加载proj4库
        if (typeof proj4 !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/proj4.min.js"
            }])
        }
        
        // 下面的参数内容请去 https://epsg.io/ 上面查询
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
        proj4.defs("EPSG:4544", "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs");
        
        // cad图坐标转web wgs84坐标，再转火星坐标（高德)
        const cadToWebCoordinate = point => {
            let co = proj4(cadEpsg, "EPSG:4326", vjmap.geoPoint(point).toArray());
            // 把wgs84转成高德坐标坐标
            return vjmap.transform.convert(co, vjmap.transform.CRSTypes.WGS84, vjmap.transform.CRSTypes.GCJ02);
        }
        // 火星坐标（高德)转web wgs84坐标转cad图坐标
        const webTocadCoordinate = point => {
            let co = vjmap.transform.convert(point, vjmap.transform.CRSTypes.GCJ02, vjmap.transform.CRSTypes.WGS84)
            return proj4("EPSG:4326", cadEpsg, co);
        }
        // 根据cad图的中心点，计算wgs84的中心点坐标
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let cadCenter = mapBounds.center();
        let webCenter = cadToWebCoordinate(cadCenter);
        // 把cad图的中点设置为地图的中心点
        map.setCenter(webCenter)
        
        let cadPrj = new vjmap.GeoProjection(mapBounds);
        
        // 点击CAD图上面的元素时有高亮状态（鼠标点击地图元素上时，会高亮)
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        }, null, null, (curResult, zoom, x, y) => {
            // 结果回调,需要把查到的CAD坐标，转成互联网的坐标再进行绘制
            if (!(curResult && curResult.result && curResult.result.length > 0)) return;//没有查询到
            let queryResult = svc.processQueryResult(curResult, pt => {
                // 查询到的每个点进行坐标处理回调
                let cadPoint = cadPrj.fromMercator(pt);// 转成cad的坐标
                return cadToWebCoordinate(cadPoint); // 把cad的坐标转成当前地图的经纬度坐标
            }); // 把当前地图范围和结果进行处理
            return queryResult;
        }, (lngLat) => {
            // 进入查询前回调，可用来修改查询的参数，如坐标等
            // 通过点击的经纬度，转换为cad的坐标，再去查询数据
            let coCad = webTocadCoordinate([lngLat.lng, lngLat.lat])
            // 当前CAD图一个像素表示多少几何长度，如果输入了此值，则为此值为主，否则，根据输入的zoom值后台自动计算. */
            // 因为获取的级别是互联网地图的级别，这些查询要用的是cad的级别，所以需要传入CAD图一个像素表示多少几何长度
            let coCad1 = webTocadCoordinate(map.unproject([500, 500]));//500，500点的像素转成lngLat,再转成cad坐标
            let coCad2 = webTocadCoordinate(map.unproject([501, 500]));//501，500点的像素转成lngLat,再转成cad坐标，比上个点多一个像素值
            let pixelToGeoLength = Math.abs(coCad2[0] - coCad1[0]); // 当前CAD图一个像素表示多少几何长度
            return {
                x: coCad[0],
                y: coCad[1],
                pixelToGeoLength
            }
        })
        
        
        const name = "myhighlight";
        const highlightColor = "#00ff00"; //
        const hoverColor = "#ff00ff"; // 悬浮色
        const color = [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            hoverColor,
            highlightColor
        ]
        const addSourceLayer = () => {
            //  数据源
            map.addGeoJSONSource(`${name}-source`, {
                type: "FeatureCollection",
                features: []
            });
        
            map.addCircleLayer(`${name}-point-layer`, `${name}-source`, {
                circleColor: color,
                circleRadius: 3,
                circleOpacity: 0.6,
                filter: [
                    "==",
                    ["geometry-type"],
                    "Point"
                ]
            });
        
        
            map.addLineLayer(`${name}-line-layer`, `${name}-source`, {
                lineJoin: "round",
                lineCap: "round",
                lineColor: color,
                lineWidth: 5,
                lineOpacity: 0.6,
                filter: [
                    "==",
                    ["geometry-type"],
                    "LineString"
                ]
            });
        
        
            map.addFillLayer(`${name}-fill-layer`, `${name}-source`, {
                fillColor: color,
                fillOpacity: 0.6,
                filter: [
                    "==",
                    ["geometry-type"],
                    "Polygon"
                ]
            })
        
        }
        const clear = () => {
            if (map.getSource(`${name}-source`)) {
                map.getSource(`${name}-source`).setData({
                    type: "FeatureCollection",
                    features: []
                });
            }
        };
        
        // 高亮CAD中的图层数据
        const highlightCadLayer = async () => {
            let res = await svc.conditionQueryFeature({
                condition: `layerindex = 1`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                fields: "",
                includegeom: true, // 是否返回几何数据,为了性能问题，realgeom为false时，如果返回条数大于1.只会返回每个实体的外包矩形，如果条数为1的话，会返回此实体的真实geojson；realgeom为true时每条都会返回实体的geojson
                realgeom: true,
                limit: 100000 //设置很大,不传的话，默认只能取100条
            }, pt => {
                // 查询到的每个点进行坐标处理回调
                let cadPoint = cadPrj.fromMercator(pt);// 转成cad的坐标
                return cadToWebCoordinate(cadPoint); // 把cad的坐标转成当前地图的经纬度坐标
            })
        
            if (res && res.result && res.result.length > 0) {
                if (!map.getSource(`${name}-source`)) {
                    addSourceLayer();// 第一次初始化
                }
        
                const features = []
                if (res && res.result && res.result.length > 0) {
                    for (let ent of res.result) {
                        if (ent.geom && ent.geom.geometries) {
                            let clr = map.entColorToHtmlColor(ent.color);
                            for (let g = 0; g < ent.geom.geometries.length; g++) {
                                features.push({
                                    id: ent.id,
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
                }
                let geom = {
                    type: "FeatureCollection",
                    features: features
                };
        
                if (geom.features.length > 0) {
                    map.getSource(`${name}-source`).setData(geom);
                } else {
                    clear();
                }
            } else {
                clear();
            }
            map.triggerRepaint();
        };
        
        let hoverId;
        map.hoverLayer([`${name}-point-layer`, `${name}-line-layer`, `${name}-fill-layer`], (cb) => {
            if (!(cb && cb.features && cb.features.length > 0)) {
                if (hoverId) {
                    map.setFeatureState({
                        source: `${name}-source`,
                        id: hoverId
                    }, {
                        hover: false
                    })
                }
                hoverId = null;
                return;
            }
            hoverId = cb.features[0].id;
            map.setFeatureState({
                source: `${name}-source`,
                id: hoverId
            }, {
                hover: true
            })
        })
        
        
        // 取消高亮CAD图层数据
        const unHightlightCadLayer = () => {
            clear();
            map.triggerRepaint();
        }
        
        
        
        const roadMap = () => {
            map.showSource("gaodeRoadSource")
            map.hideSource("gaodeImgSource")
            map.hideSource("gaodeImgSourceLabel")
        }
        
        const imageMap = () => {
            map.showSource("gaodeImgSource")
            map.showSource("gaodeImgSourceLabel")
            map.hideSource("gaodeRoadSource")
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "185px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => highlightCadLayer()}>高亮CAD中的图层数据
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => unHightlightCadLayer()}>取消高亮CAD图层数据
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => roadMap()}>切换至道路地图
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => imageMap()}>切换至影像地图
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