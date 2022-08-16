const { message } = antd; // 第三库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/05fourparam
        // --通过对应点叠加互联网图形--
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
        
        // 百度点坐标转wgs84坐标，如果不是百度图上，或高德上面拾取的，坐标类型应为 CRSTypes.GCJ02，天地图上拾取的，坐标类型应为 CRSTypes.WGS84
        // 把坐标数据都转成墨卡托3857
        let epsg3857Points = baiduPoints.map(e => vjmap.geoPoint(vjmap.transform.convert([e.x, e.y],vjmap.transform.CRSTypes.BD09, vjmap.transform.CRSTypes.EPSG3857)));
        
        // 通过坐标参数求出四参数 (由墨卡托3857到cad的坐标转换参数)
        let fourparam = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints, true); // 这里不需要考虑旋转
        
        let wmsurl = svc.wmsTileUrl({
            mapid: cadMapId,
            version:"v1",
            layers: style.stylename,
            srs: "", // 如果源坐标系和目标坐标系都设置为空的话，表示直接用四参数转
            crs: "", // 如果源坐标系和目标坐标系都设置为空的话，表示直接用四参数转
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
        
        // 把公共点标出来
        // epsg3857的点
        for (let pt of epsg3857Points) {
            let wgs84 = vjmap.Projection.mercator2LngLat(pt); // 墨卡托3857转经纬度wgs84
            let marker = new vjmap.Marker({
                color: "green"
            });
            marker.setLngLat(wgs84).addTo(map);
        }
        
        // cad的点
        for(let pt of cadPoints) {
            let marker = new vjmap.Marker({
                color: "red"
            });
            // cad的点，我们需要通过四参数反算出经纬度
            let p = vjmap.coordTransfromByInvFourParamter(pt, fourparam);
            let wgs84 = vjmap.Projection.mercator2LngLat(p); // 墨卡托3857转经纬度wgs84
            marker.setLngLat(wgs84).addTo(map);
        }
        
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