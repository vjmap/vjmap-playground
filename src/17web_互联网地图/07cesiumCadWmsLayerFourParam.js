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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/07cesiumCadWmsLayerFourParam
        // --Cesium中加载CAD图(WMS图层四参数叠加)--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        window.svc = svc
        // 打开地图
        let mapId = "sys_cadcesium";
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
        
        
        
        if (typeof Cesium !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/Cesium/Cesium.js"
            }, {
                src: "../../js/Cesium/Widgets/widgets.css"
            }])
        }
        
        let imageryProvider= new Cesium.UrlTemplateImageryProvider({
            url: "https://t1.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=3346bb6ad29b5013c5952cf1117b80e9",
        })
        
        let viewer = new Cesium.Viewer('map', {
            imageryProvider: imageryProvider,
            contextOptions: {
                webgl: {
                    alpha: true
                }
            },
            selectionIndicator: false,
            animation: false, //是否显示动画控件
            baseLayerPicker: false, //是否显示图层选择控件
            geocoder: false, //是否显示地名查找控件
            timeline: false, //是否显示时间线控件
            sceneModePicker: false, //是否显示投影方式控件
            navigationHelpButton: false, //是否显示帮助信息控件
            infoBox: false, //是否显示点击要素之后显示的信息
            fullscreenButton: false,
            shouldAnimate: true //动画播放
        });
        
        
        var layers = viewer.scene.imageryLayers;
        
        // 加一个高德注记图层
        layers.addImageryProvider(
            new Cesium.UrlTemplateImageryProvider({
                url: "https://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
            })
        );
        
        
        // cad上面的点坐标
        let cadPoints = [
            vjmap.geoPoint([595544.328982, 3252528.216226]),
            vjmap.geoPoint([627928.010946,3263082.764822]),
            vjmap.geoPoint([625319.1513109521,3246689.371984474]),
        ];
        
        // 在wgs84坐标系上面拾取的点（如天地图上面）与上面的点一一对应的坐标
        let webPoints = [
            vjmap.geoPoint([105.9842161763667,29.38665272938248]),
            vjmap.geoPoint([106.31897105133609, 29.478968581719126]),
            vjmap.geoPoint([106.29021011814865, 29.331372065225345])
        ]
        
        // wgs84转3857
        webPoints = webPoints.map(e => vjmap.geoPoint(vjmap.transform.convert([e.x, e.y],vjmap.transform.CRSTypes.WGS84, vjmap.transform.CRSTypes.EPSG3857)));
        
        // 通过坐标参数求出四参数 (由3857到cad的坐标转换参数)
        let fourparam = vjmap.coordTransfromGetFourParamter(webPoints, cadPoints, true); // 这里不需要考虑旋转
        
        // 增加cad的wms图层
        let wmsUrl = svc.wmsTileUrl({
            mapid: mapId, // 地图id
            layers: layer, // 图层名称
            bbox: '', // bbox这里不需要传，cesium会自动加上
            srs: "EPSG:4326", // cesium地图是wgs84
            crs: "EPSG:3857",
            fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate] // 参数为(平移x,平移y,缩放k,旋转弧度r)  如果是有带号的坐标系并且x坐标只有6位，还需加个平移量x的8位的前两位如此38，根据实际情况改成实际的值
        })
        layers.addImageryProvider(
            new Cesium.WebMapServiceImageryProvider({
                url: wmsUrl,
            })
        );
        
        
        // cad图坐标转web wgs84坐标
        const cadToWebCoordinate =  point => {
            // 先四参数反算得到3857的点，再转到4326
            let p = vjmap.coordTransfromByInvFourParamter(point, fourparam);
            return vjmap.Projection.mercator2LngLat(p);
        }
        // 转web wgs84坐标转cad图坐标
        const webTocadCoordinate =  point => {
            // 先4326转3857，再用四参数转cad
            let p = vjmap.Projection.lngLat2Mercator(point);
            return vjmap.coordTransfromByFourParamter(vjmap.geoPoint(p), fourparam);
        }
        // 根据cad图的中心点，计算wgs84的中心点坐标
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let cadCenter = mapBounds.center();
        let webCenter = cadToWebCoordinate(cadCenter);
        
        //设置初始位置
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(webCenter[0], webCenter[1], 30000)
        });
        
        // 如果需要在地图上查询cad的实体坐标，可通过svc.rectQueryFeature来实现，需要传入两个cad的点坐标范围
        // 可以通过 webTocadCoordinate 接口把wgs84的坐标转成 cad 的坐标去查询.
        
        
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