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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/06wmsselentity
        // --叠加图形上点击选择CAD实体--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 根据地图范围建立经纬度投影坐标系
        let prj = new vjmap.LnglatProjection();
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: {
                version: svc.styleVersion(),
                sources: {
                    tdt1: {
                        type: 'raster',
                        tiles: ["https://t3.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                    },
                    tdt2: {
                        type: 'raster',
                        tiles: ["https://t3.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                    }
                },
                layers: [{
                    id: 'tdt1',
                    type: 'raster',
                    source: 'tdt1',
                },{
                    id: 'tdt2',
                    type: 'raster',
                    source: 'tdt2',
                }]
            },
            center: [113.27384341272153, 23.206602011277003],
            zoom: 15,
            pitch: 0,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        // 先获取地图元数据来获取图层样式
        let cadMapId = "sys_webwms"
        let style = await svc.createStyle({
            backcolor: 0xFFFFFF // 浅色主题
        }, cadMapId);
        
        // cad上面的点坐标
        let cadPoints = [
            vjmap.geoPoint([39760.07407, 237424.52134]),
            vjmap.geoPoint([39006.60468, 237808.49494749]),
            vjmap.geoPoint([38823.92918, 235003.98994]),
            vjmap.geoPoint([37885.55424, 235452.80893])
        ];
        
        // 在百度图上面拾取的与上面的点一一对应的坐标
        let baiduPoints = [
            vjmap.geoPoint([113.292983, 23.206979]),
            vjmap.geoPoint([113.285631, 23.210304]),
            vjmap.geoPoint([113.283897, 23.185047]),
            vjmap.geoPoint([113.274716, 23.188962])
        ]
        
        // 百度点坐标转wgs84坐标，如果不是百度图上，或高德上面拾取的，坐标类型应为 CRSTypes.GCJ02，天地图上拾取的，则不需要转换直接为wgs84坐标
        let wgs84Points = baiduPoints.map(e => vjmap.geoPoint(vjmap.transform.convert([e.x, e.y],vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.WGS84)));
        
        // 通过坐标参数求出四参数
        let fourparam = vjmap.coordTransfromGetFourParamter(wgs84Points, cadPoints, true); // 这里不需要考虑旋转
        
        let wmsurl = svc.wmsTileUrl({
            mapid: cadMapId,
            version:"v1",
            layers: style.stylename,
            srs: "EPSG:3857", // 底图是天地图坐标系
            crs: "EPSG:4326", // 因为四参数的输入是wgs84，需要先要把3857转4326
            fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate] // 转4326后，再调用四参数进行转换，转cad坐标
        })
        
        map.addSource('wms-test-source', {
            'type': 'raster',
            'tiles': [
                wmsurl
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
        
        // 下面实现点击cad实体功能高亮
        const name = "myhighlight";
        const highlightColor = "#FF8957";
        const addSourceLayer = () => {
            //  数据源
            map.addGeoJSONSource(`${name}-source`, {
                type: "FeatureCollection",
                features: []
            });
        
            map.addLineLayer(`${name}-line-layer`, `${name}-source`, {
                lineJoin: "round",
                lineCap: "round",
                lineColor: highlightColor,
                lineWidth: 3,
                lineOpacity: 0.8,
                filter: [
                    "==",
                    ["geometry-type"],
                    "LineString"
                ]
            });
        
        
            map.addFillLayer(`${name}-fill-layer`, `${name}-source`, {
                fillColor: highlightColor,
                fillOpacity: 1.0,
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
        
        
        // 得到cad图的元数据
        const metadata = await svc.metadata(cadMapId);
        // 建立坐标系
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(metadata.bounds);
        let cadPrj = new vjmap.GeoProjection(mapExtent);
        
        const click_highlight_evt = async e => {
            if (map.isInteracting()) return; //如果地图正在交互，如绘制操作，则不响应
            const co = vjmap.coordTransfromByFourParamter(map.fromLngLat(e.lngLat), fourparam); // 因为底图是wgs84经纬度坐标了，所以需要用四参数转成cad坐标，才能进行点查询
            // 计算在此级别下一个像素代表多少几何长度，因为cad采用的是 wms，此时没缩放级别的概念了
            let pixel = map.project(e.lngLat);
            pixel.x = pixel.x + 1 ;// 加一个像素
            let lngLat2 = map.unproject(pixel);//加一个像素后的经纬度
            // 转成cad坐标
            const co2 = vjmap.coordTransfromByFourParamter(map.fromLngLat(lngLat2), fourparam);
            // 求一像素多少几何长度
            const pixelToGeoLength = co2.x - co.x;
            // 点击高亮，可用下面这段代码
            const res = await svc.pointQueryFeature({
                pixelToGeoLength: pixelToGeoLength,
                x: co.x,
                y: co.y,
                geom: true,
                mapid: cadMapId, // 这里需要传要查询的地图id
                layer: style.stylename
            });
        
            if (res && res.result && res.result.length > 0) {
                if (!map.getSource(`${name}-source`)) {
                    addSourceLayer();// 第一次初始化
                }
        
                const geom = {
                    geometries: [],
                    type: "GeometryCollection"
                }
        
                for(let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let g = ent.geom.geometries;
                        for(let i = 0; i < g.length; i++) {
                            g[i].coordinates = vjmap.transform.convert(g[i].coordinates, data => {
                                //原始数据为cad图全图显示对应的经纬度坐标，不是现在的叠加的经纬度坐标
                                const cadPoint = cadPrj.fromLngLat(data); // 先要把之前的经纬度坐标转在cad的坐标
                                const pt = vjmap.coordTransfromByInvFourParamter(cadPoint, fourparam); // 通过四参数反算，由cad坐标求经纬度坐标
                                return [pt.x, pt.y];
                            });
                            geom.geometries.push(g[i])
                        }
        
                    }
                }
                if (geom.geometries.length > 0) {
                    map.getSource(`${name}-source`).setData(geom);
                } else {
                    clear();
                }
            } else {
                clear();
            }
            map.triggerRepaint();
        };
        map.on("click", click_highlight_evt);
        //map.off("click", click_highlight_evt); // 取消时用这个
        
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