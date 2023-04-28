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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/09baiduCadLayerFourparam
        // --百度地图SDK公共点加载CAD图--
        // 代码演示中不方便修改html源文件，用动态加载百度SDK的方法加载。实际中只需要html中script中包含百度地图sdk脚本即可
        // <script src="http://api.map.baidu.com/api?type=webgl&v=1.0&ak=G1LFyjrNGIkns5OfpZnrCGAKxpycPLwb">
        function LoadBaiduMapScript() {
            const AK = 'G1LFyjrNGIkns5OfpZnrCGAKxpycPLwb';
            const BMapURL = "https://api.map.baidu.com/api?type=webgl&v=1.0&ak="+ AK +"&s=1&callback=onBMapCallback";
            return new Promise((resolve, reject) => {
                // 如果已加载直接返回        
                if(typeof BMapGL !== "undefined") {
                    resolve(BMapGL);
                    return true;
                }
                // 百度地图异步加载回调处理  
                window.onBMapCallback = function () {
                    resolve(BMapGL);
                };
                // 插入script脚本   
                let scriptNode = document.createElement("script");
                scriptNode.setAttribute("type", "text/javascript");
                scriptNode.setAttribute("src", BMapURL);
                document.body.appendChild(scriptNode);
            });
        }
        await LoadBaiduMapScript();
        
        var map = new BMapGL.Map("map", {
            maxZoom: 24
        });
        var point = new BMapGL.Point(116.49749690241316, 39.96795950710483);
        map.centerAndZoom(point, 17);
        map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
        
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
            vjmap.geoPoint([587464448.8435846, 3104003685.208661,]),
            vjmap.geoPoint([587761927.7224838, 3104005967.655292]),
            vjmap.geoPoint([587463688.0280377, 3103796743.3798513]),
            vjmap.geoPoint([587760406.0913897, 3103793700.1176634])
        ];
        
        
        // 在互联网图上面拾取的与上面的点一一对应的坐标(百度坐标)
        let webPoints = [
            vjmap.geoPoint([116.49738632967344,39.969244215079016]),
            vjmap.geoPoint([116.50000171663382,39.96753915494187]),
            vjmap.geoPoint([116.49843968869915,39.96613594214925]),
            vjmap.geoPoint([116.49581440721418,39.967790723887404])
        ]
        
        // 通过坐标参数求出四参数
        let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.transform.convert(w, vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.EPSG3857)));
        let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , false); // 这里考虑旋转
        let fourparam = [param.dx, param.dy, param.scale, param.rotate]
        
        // wms图层地址
        const getCadWmsUrl = (transparent) => {
            let wmsUrl = svc.wmsTileUrl({
                mapid: mapId, // 地图id
                layers: layer, // 图层名称
                bbox: '', // bbox这里不需要
                srs: "EPSG:3857", //
                fourParameter: fourparam,
                transparent: transparent,
                backgroundColor: 'rgba(240, 255, 255)' // 不透明时有效
            })
            return wmsUrl
        }
        
        
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let cadPrj = new vjmap.GeoProjection(mapBounds);
        
        
        // cad图坐标转web wgs84坐标
        const cadToWebCoordinate = point => {
            // 通过四参数反算，由cad得到3857坐标
            let epsgPoint = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(point), param)
            // 3857转4326
            return vjmap.Projection.mercator2LngLat(epsgPoint);
        }
        
        // 调用百度的sdk，从wgs84坐标转百度坐标
        const wgs84ToBd09 = async pointArr => {
            return new Promise((resolve, reject) => {
                let translateCallback = function (data){
                    if (data.status === 0) {
                        resolve(data.points)
                    } else {
                        reject(data)
                    }
                }
                let convertor = new BMapGL.Convertor();
                convertor.translate(pointArr, COORDINATES_WGS84, COORDINATES_BD09,  translateCallback)
            })
        }
        // 百度坐标转web wgs84坐标转cad图坐标
        const webTocadCoordinate = point => {
            // 百度转3857
            let co = vjmap.transform.convert(point, vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.EPSG3857)
            // 3857通过四参数转cad
            return vjmap.coordTransfromByFourParamter(vjmap.geoPoint(co), param)
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
                return cadToWebCoordinate(cadPoint); // 把cad的坐标转成当前地图的经纬度坐标
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
        
        function addGeoJsonData(map, data) {
            var region = data;
        
            // https://lbsyun.baidu.com/index.php?title=jspopularGL/guide/geoJsonLayer
        
            var label = new BMapGL.Label();
            label.setStyle({
                color: 'blue',
                borderRadius: '5px',
                borderColor: '#ccc',
                padding: '10px',
                fontSize: '16px',
                fontFamily: '微软雅黑',
                transform: 'translateX(-50%) translateY(calc(-100% - 10px))'
            });
        
            function popup(e) {
                if (e.features && e.features.length > 0) {
                    var overlay = e.features[0];
                    // 重置数据的样式
                    resetGeoLayer();
                    if (overlay.toString() === 'Polygon') {
                        overlay.setFillColor('yellow');
                    }
                    if (overlay.toString() === 'Polyline') {
                        overlay.setStrokeColor('yellow');
                    }
        
                    label.setPosition(e.latLng);
                    label.setContent(`<h4 style='margin:0 0 5px 0;'>${overlay.properties.name}</h4>
            <p style='margin:0;line-height:1.5;font-size:13px;text-indent:2em'>
            objectid：${overlay.properties.objectid}
            </p></div>`);
                    map.addOverlay(label);
                }
            }
        
            var cadLayer = new BMapGL.GeoJSONLayer('cad-child', {
                reference: 'WGS84',
                dataSource: region,
                level: -10,
                polygonStyle: function (properties) {
                    var index = properties.join || 0;
                    return {
                        fillColor: properties.color
                    }
                },
                polylineStyle: function (properties) {
                    return {
                        strokeColor: properties.color
                    }
                },
                markerStyle: function (properties) {
                    return {
                        icon: new BMapGL.Icon("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAAMSURBVBhXY2BgYAAAAAQAAVzN/2kAAAAASUVORK5CYII=", new BMapGL.Size(1, 1))
                    }
                }
            });
            cadLayer.addEventListener('click', function (e) {
                if (e.features) {
                    popup(e);
        
                } else {
                    resetGeoLayer();
                    map.removeOverlay(label);
        
                }
        
            });
            map.addGeoJSONLayer(cadLayer, {
                maxZoom: 24
            });
            function resetGeoLayer() {
                cadLayer && cadLayer.resetStyle();
            }
            return cadLayer;
        }
        
        
        let wmsLayer;
        const addWmsLayer = async (transparent)=> {
            removeWmsLayer();
            // tileUrlTemplate 包含OGC标准的WMS地图服务的GetMap接口的参数
            wmsLayer = BMapGL.XYZLayer({
                useThumbData: true,
                transparentPng: false,
                tileUrlTemplate: getCadWmsUrl(transparent) + '&BBOX=[b] '
            });
            map.addTileLayer(wmsLayer);
            wmsLayer.setZIndexTop();
        
            if (!transparent) {
                // 如果不透明，加一个掩膜层，把旁边的空白图片不显示
                let boundary = [[587455886.1376927,3104009909.769687],[587774984.5609306,3104009909.769687],[587774984.5609306,3103786792.3276925],[587455796.0465667,3103786792.3276925],[587455886.1376927,3104009909.769687 ]];
                let b = boundary.map(b => cadToWebCoordinate(b));
                //boundary = await wgs84ToBd09(b);
                boundary = b.map(p => vjmap.transform.convert(p, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.BD09))
                b = boundary.map(p => p[0] + ", " + p[1]).join(';');
                wmsLayer.addBoundary(b); // 添加掩膜
            }
        
        }
        
        const removeWmsLayer = ()=> {
            if (!wmsLayer) return;
            map.removeTileLayer(wmsLayer);
            wmsLayer = null;
        }
        
        let cadGeoJsonLayer;
        const addGeoJsonLayer = async ()=> {
            if (cadGeoJsonLayer) return;
            let geom = await queryData(svc, cadPrj);
            cadGeoJsonLayer = addGeoJsonData(map, geom);
        }
        
        const removeGeoJsonLayer = ()=> {
            if (!cadGeoJsonLayer) return;
            map.removeGeoJSONLayer(cadGeoJsonLayer);
            cadGeoJsonLayer = null;
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