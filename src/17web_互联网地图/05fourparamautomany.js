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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/05fourparamautomany
        // --在互联网地图上叠加多张CAD图--CAD图可自动叠加、指定公共点叠加
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
                    layout: {
                        visibility: "none"
                    }
                },{
                    id: 'gaodeImg',
                    type: 'raster',
                    source: 'gaodeImgSource'
                },{
                    id: 'gaodeImgLabel',
                    type: 'raster',
                    source: 'gaodeImgSourceLabel',
                }]
            },
            center: [0, 0],
            zoom: 11,
            pitch: 0,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        await map.onLoad();
        
        // 加载proj4库，实际项目中通过npm进行安装proj4
        if (typeof proj4 !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/proj4.min.js"
            }])
        }
        let isWebWgs84 = false; // 互联网地否是wgs84坐标。 true是wgs84坐标，如天地图。 false是火星坐标，如高德地图。此示例是高德地图
        // 要叠加的Cad地图参数
        let overCadMaps = [
            {
                mapid: "ca422a931980", // 自动叠加不写epsg会自动获取
                crsType: vjmap.transform.EpsgCrsTypes.Xian80 // 西安80坐标系
            },
            {
                mapid: "sys_cad2000",
                epsg: 4509, // 自动叠加直接指定图的epsg
                proj: "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs" // proj可不填 通过epsg自动获取, proj = vjmap.transform.getProjByEpsgCode(4509)
            },
            {
                mapid: "sys_zp", // 通过公共点叠加
                // 公共点，互联网上和cad图上对应点坐标
                points: {
                    "web": [
                        [111.27461919876993,39.48424837164032],
                        [111.35308796357572,39.45803376417072]
                    ],
                    "cad": [
                        [587464241.006472,3104004303.192057],
                        [ 587761241.006472,3103794303.192057]
                    ]
                }
            }
        ]
        
        for (let item of overCadMaps) {
            let mapid = item.mapid;
            let res = await svc.openMap({
                mapid: mapid, // 地图ID
                mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
                style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
            })
            if (res.error) {
                // 如果打开出错
                map.logInfo(res.error, "error")
                return;
            }
            item.layers = JSON.parse(res.layers); // 图层数据
            // 获取当前打开的参数保存
            item.openParam = {...svc.currentMapParam()}
        
            // 当前地图的坐标投影系
            item.projection = new vjmap.GeoProjection(item.openParam.bounds);
        
        
            if (item.points) {
                // 如果是通过公共点叠加
                // cad上面的点坐标
                let cadPoints = item.points.cad.map(e => vjmap.geoPoint(e));
        
                // 在互联网图上面拾取的与上面的点一一对应的坐标(wgs84坐标)
                let webPoints = item.points.web.map(e => vjmap.geoPoint(e))
        
                // 通过坐标参数求出四参数
                let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
                let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , true); // 这里不考虑旋转
                let fourparam = [param.dx, param.dy, param.scale, param.rotate]
                item.fourParam = param;
        
                // wms瓦片地址
                item.wmsUrl = svc.wmsTileUrl({
                    mapid: mapid,
                    version: item.openParam.version,
                    layers: item.openParam.layer,
                    fourParameter: fourparam
                })
        
                // cad转web坐标
                item.cadToWebPoint = (pt) => {
                    let pt3857 = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(pt), item.fourParam); // 需要四参数反算
                    let pt4326 = vjmap.Projection.mercator2LngLat(pt3857);
                    return vjmap.geoPoint(pt4326)
                }
        
                // web转cad坐标
                item.webToCadPoint = (pt) => {
                    let pt3857 = vjmap.Projection.lngLat2Mercator(pt)
                    let res = vjmap.coordTransfromByFourParamter(vjmap.geoPoint(pt3857), item.fourParam); // 需要四参数正算
                    return vjmap.geoPoint(res)
                }
        
            } else {
                // 如果是自动叠加
                let bounds = item.openParam.bounds;
                let proj = item.proj;
                if (!proj) {
                    if (item.crsType) {
                        // 有坐标系
                        let result = vjmap.transform.getEpsgCode(bounds.center().toArray(), item.crsType)
                        if (result.length > 0) {
                            proj = result[0].proj;
                            item.epsg = result[0].epsg
                        }
                    } else if (item.epsg) {
                        proj = vjmap.transform.getProjByEpsgCode(item.epsg)
                    }
                    item.proj = proj;
                }
        
                if (!proj) {
                    map.logInfo(mapid + " get proj string error", "error")
                    return
                }
                if (typeof item.epsg == "number") {
                    item.epsg = "EPSG:" + item.epsg
                }
        
                item.wmsUrl = svc.wmsTileUrl({
                    mapid: mapid, // 地图id
                    layers: item.openParam.layer, // 图层名称
                    srs: "EPSG:3857",
                    crs: item.epsg,
                    webMapType: isWebWgs84 ? undefined : "GCJ02" // 底图是高德地图，所以要选GCJ02,如果是天地图，可以不用填此项
                })
        
                proj4.defs(item.epsg, item.proj)
                // cad转web坐标
                item.cadToWebPoint = point => {
                    let co = proj4(item.epsg, "EPSG:4326", vjmap.geoPoint(point).toArray());
                    if (isWebWgs84) return co;// 如果底图是wgs84坐标，不就需要转火星了
                    // 把wgs84转成高德坐标坐标
                    let res = vjmap.transform.convert(co, vjmap.transform.CRSTypes.WGS84, vjmap.transform.CRSTypes.GCJ02);
                    return vjmap.geoPoint(res)
                }
                // web转cad坐标
                item.webToCadPoint = point => {
                    let co = point;
                    if (!isWebWgs84) {
                        // 如果底图不是wgs84坐标，还需要把火星转wgs84坐标
                        co = vjmap.transform.convert(point, vjmap.transform.CRSTypes.GCJ02, vjmap.transform.CRSTypes.WGS84)
                    }
                    let res = proj4("EPSG:4326", item.epsg, co);
                    return vjmap.geoPoint(res)
                }
            }
        
            // 判断点是否在当前地图范围内
            item.isPointInMapBounds = (pt, isWebPoint) => {
                if (!item.visible) return false;// 如果隐藏了
                if (isWebPoint) {
                    // 如果是web坐标
                    pt = item.webToCadPoint(pt)
                }
                if(Array.isArray(pt)) {
                    // 如果pt是[x,y]格式
                    pt = vjmap.geoPoint(pt)
                }
                return item.openParam.drawBounds.contains(pt)
            }
        
            item.visible = true; // 显示
        }
        
        
        for (let item of overCadMaps) {
            let mapid = item.mapid;
            let sourceId = 'wms-test-source-' + mapid;
            let layerId = 'wms-test-layer-' + mapid;
            item.sourceId = sourceId;
            item.layerId = layerId;
        
            // 增加cad的wms图层
            let wmsUrl = item.wmsUrl
            map.addSource(sourceId, {
                'type': 'raster',
                'tiles': [
                    wmsUrl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': layerId,
                    'type': 'raster',
                    'source': sourceId,
                    'paint': { "raster-opacity": 1 }
                }
            );
            // 把高亮图层调至最上面，防止点选高亮看不见
            let topLayerIds = ['highlight-line-layer', 'highlight-fill-layer'];
            for(let layerId of topLayerIds) {
                let idx = map.getStyle().layers.findIndex(item => item.id == layerId)
                if(idx >= 0) {
                    // 如果图层存在 把图层放最上面
                    map.moveLayer(layerId)
                }
            }
        }
        if (overCadMaps.length == 0) return;
        
        
        // 根据第一个cad图的中心点，计算wgs84的中心点坐标
        let mapBounds = overCadMaps[0].openParam.bounds;
        let cadCenter = mapBounds.center();
        let webCenter = overCadMaps[0].cadToWebPoint(cadCenter).toArray();
        // 把cad图的中点设置为地图的中心点
        map.setCenter(webCenter)
        
        // 点击CAD图上面的元素时有高亮状态（鼠标点击地图元素上时，会高亮)
        let curClickMapItem;
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
            if (!curClickMapItem) return; // 如果没有
            let queryResult = svc.processQueryResult(curResult, pt => {
                // 查询到的每个点进行坐标处理回调
                let cadPoint = curClickMapItem.projection.fromMercator(pt);// 转成cad的坐标
                return curClickMapItem.cadToWebPoint(cadPoint).toArray(); // 把cad的坐标转成当前地图的经纬度坐标
            }); // 把当前地图范围和结果进行处理
            return queryResult;
        }, (lngLat) => {
            // 进入查询前回调，可用来修改查询的参数，如坐标等
            // 先判断当前点在哪个图上
            curClickMapItem = overCadMaps.find(item => item.isPointInMapBounds([lngLat.lng, lngLat.lat], true));
            if (!curClickMapItem) return ; // 如果没有
            // 通过点击的经纬度，转换为cad的坐标，再去查询数据
            let coCad = curClickMapItem.webToCadPoint([lngLat.lng, lngLat.lat]).toArray()
            // 当前CAD图一个像素表示多少几何长度，如果输入了此值，则为此值为主，否则，根据输入的zoom值后台自动计算. */
            // 因为获取的级别是互联网地图的级别，这些查询要用的是cad的级别，所以需要传入CAD图一个像素表示多少几何长度
            let coCad1 = curClickMapItem.webToCadPoint(map.unproject([500, 500])).toArray();//500，500点的像素转成lngLat,再转成cad坐标
            let coCad2 = curClickMapItem.webToCadPoint(map.unproject([501, 500])).toArray();//501，500点的像素转成lngLat,再转成cad坐标，比上个点多一个像素值
            let pixelToGeoLength = Math.abs(coCad2[0] - coCad1[0]); // 当前CAD图一个像素表示多少几何长度
            return {
                x: coCad[0],
                y: coCad[1],
                pixelToGeoLength,
                mapid: curClickMapItem.mapid,
                version: curClickMapItem.openParam.version,
                layer: curClickMapItem.openParam.layer,
                geom: curClickMapItem.openParam.mapopenway == vjmap.MapOpenWay.GeomRender
            }
        })
        
        
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
        imageMap()
        
        // 定位到第几张图
        const fitMap = idx => {
            if (idx >= overCadMaps.length || idx < 0) return 0;
            let item = overCadMaps[idx];
            // 获取cad图的范围
            let mapBounds = item.openParam.bounds;
            let p1 = item.cadToWebPoint(mapBounds.min);
            let p2 = item.cadToWebPoint(mapBounds.max);
            let webBounds = vjmap.GeoBounds.fromDataExtent([p1, p2]);
            map.fitMapBounds(webBounds, {padding: 0})
        }
        
        // 显示隐藏第几张图
        const showHideMap = idx => {
            if (idx >= overCadMaps.length || idx < 0) return 0;
            let item = overCadMaps[idx];
            item.visible = !item.visible
            // 显示隐藏可控制数据源来进行显隐
            if (item.visible) {
                map.showSource(item.sourceId)
            } else {
                map.hideSource(item.sourceId)
            }
        }
        // 删除图
        const deleteMap = mapid => {
            let idx = overCadMaps.findIndex(item => item.mapid == mapid)
            if (idx < 0 ) return;
            let item = overCadMaps[idx];
            // 删除数据源和相关图层
            map.removeSourceEx(item.sourceId)
            // 从数组中进行删除
            overCadMaps.splice(idx, 1)
        }
        
        const showHideMapLayer = async (idx) => {
            if (idx >= overCadMaps.length || idx < 0) return ;
            let item = overCadMaps[idx];
            // let layerNames = ['0'];
            // // 把图层名称变成图层索引
            // let layerIndexs = layerNames.map(name => item.layers.find(layer => layer.name == name).index)
            //console.log("layerIndexs", layerIndexs, item.layers);
            let layerIndexs = [0, 1]; // 这里直接根据图层索引来切换，如果是要根据图层名称，用上面注释的代码进行转换下
            // 根据图层显隐创建新的样式
            let isHidden = item.layerIsHidden
            item.layerIsHidden = !item.layerIsHidden
            let style = await svc.createStyle({
                layeron: isHidden ? undefined : layerIndexs, // 要显示的图层
                backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF
            }, item.mapid)
        
            item.layer = style.stylename; // 新的样式名称
        
            // 移除之前的wms数据源
            map.removeSourceEx(item.sourceId)
        
            // 根据上面的图层开头生成的新的样式，创建新的wms地址加进地图中
            if (item.fourParam) {
                // wms瓦片地址
                let fourparam = [item.fourParam.dx, item.fourParam.dy, item.fourParam.scale, item.fourParam.rotate]
                item.wmsUrl = svc.wmsTileUrl({
                    mapid: item.mapid,
                    version: item.openParam.version,
                    layers: item.layer,
                    fourParameter: fourparam
                })
            } else {
                item.wmsUrl = svc.wmsTileUrl({
                    mapid: item.mapid, // 地图id
                    layers: item.layer, // 图层名称
                    srs: "EPSG:3857",
                    crs: item.epsg,
                    webMapType: isWebWgs84 ? undefined : "GCJ02" // 底图是高德地图，所以要选GCJ02,如果是天地图，可以不用填此项
                })
            }
            map.addSource(item.sourceId, {
                'type': 'raster',
                'tiles': [
                    item.wmsUrl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': item.layerId,
                    'type': 'raster',
                    'source': item.sourceId,
                    'paint': { "raster-opacity": 1 }
                }
            );
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "185px", right: "10px" }}>
        
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
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => fitMap(0)}>定位到第一张图
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => fitMap(1)}>定位到第二张图
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => fitMap(2)}>定位到第三张图
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showHideMap(0)}>显示/隐藏第一张图
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showHideMap(1)}>显示/隐藏第二张图
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showHideMap(2)}>显示/隐藏第三张图
                            </button>
                        </div>
        
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showHideMapLayer(0)}>显示/隐藏图一的图层数据
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showHideMapLayer(1)}>显示/隐藏图二的图层数据
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showHideMapLayer(2)}>显示/隐藏图三的图层数据
                            </button>
                        </div>
        
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => deleteMap("ca422a931980")}>删除图一
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => deleteMap("sys_cad2000")}>删除图二
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => deleteMap("sys_zp")}>删除图三
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