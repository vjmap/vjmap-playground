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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/05fourparamrotatecad
        // --互联网地图旋转叠加至CAD图[CAD为底图]--
        let initZoom = 8;
        let style = {
            backcolor: 0, // div为深色背景颜色时，这里也传深色背景样式
            clipbounds: Math.pow(2, initZoom) // 只传值，不传范围，表示之前的范围放大多少倍
        }
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: "sys_zp",
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style:  style
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: initZoom,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        await map.onLoad();
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        // 如果需要手动拾取对应点，请至唯杰地图云端管理平台 https://vjmap.com/app/cloud/#/ 点击图打开后，在更多功能，选择 与互联网地图四参数叠加
        
        // cad上面的点坐标
        let cadPoints = [
            vjmap.geoPoint([587464448.8435847, 3104003685.208651,]),
            vjmap.geoPoint([587761927.7224838, 3104005967.655292]),
            vjmap.geoPoint([587463688.0280377, 3103796743.3798513]),
            vjmap.geoPoint([587760406.0913897, 3103793700.1176634])
        ];
        
        
        // 在互联网图上面拾取的与上面的点一一对应的坐标(wgs84坐标)
        let webPoints = [
            vjmap.geoPoint([116.4849310885225,  39.960672361810566]),
            vjmap.geoPoint([116.48571466352934, 39.96016690545824]),
            vjmap.geoPoint([116.48440741215745, 39.96016393217476]),
            vjmap.geoPoint([116.48517547082753, 39.95968523181088])
        ]
        
        // 通过坐标参数求出四参数
        let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
        let param = vjmap.coordTransfromGetFourParamter(cadPoints, epsg3857Points, false); // 这里考虑旋转
        let fourparam = [param.dx, param.dy, param.scale, param.rotate]
        // 如果旋转，需要把地图旋转一个角度，使互联网地图是正的
        map.setBearing(vjmap.radToDeg(param.rotate)) ;
        // 增加高德地图底图
        const addGaodeMap = async (isRoadway) => {
            let b = map.getMapExtent();
            const tileUrl = svc.webMapUrl({
                tileCrs: "gcj02",
                tileUrl: isRoadway ? [
                        "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                    ] :
                    /* 如果用影像 */
                    [
                        "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                        "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                    ],
                tileSize: 256,
                tileRetina: 1,
                // @ts-ignore
                tileMaxZoom: 18,
                tileShards: "1,2,3,4",
                tileToken: "",
                tileFlipY: false,
                mapbounds: JSON.stringify([b.min.x,b.min.y,b.max.x,b.max.y]),
                srs: "EPSG:3857",
                // 如果图x只有6位，没有带系。需要在坐标转换前平移下带系  https://blog.csdn.net/thinkpang/article/details/124172626
                fourParameterBefore: fourparam
            })
        
            map.addSource('web-gaode-source', {
                'type': 'raster',
                'tiles': [
                    tileUrl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': 'web-gaode-layer',
                    'type': 'raster',
                    'source': 'web-gaode-source',
                    'paint': { "raster-opacity": 1 }
                }
            );
            let layers = map.getStyle().layers
            // 把这个图层放至所有图层的最下面
            map.moveLayer('web-gaode-layer', layers[0].id)
        }
        
        const removeMapLayer = ()=> {
            // 删除source及source下面的所有图层
            map.removeSourceEx(['web-gaode-source'])
        }
        
        
        addGaodeMap(true);
        
        // 增加对应点
        cadPoints.forEach(pt => {
            new vjmap.Marker({color: "#f00"}).setLngLat(map.toLngLat(pt)).addTo(map);
        });
        webPoints.forEach(pt => {
            // 先转成墨卡托
            let co3857 = vjmap.transform.convert(
                [pt.x, pt.y],
                vjmap.transform.CRSTypes.EPSG4326,
                vjmap.transform.CRSTypes.EPSG3857
            );
            // 再调用四参数反算求出cad的坐标
            let coCad = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(co3857), param)
            new vjmap.Marker({color: "#0f0"}).setLngLat(map.toLngLat(coCad)).addTo(map);
        });
        
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