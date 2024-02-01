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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/07cesiumCadWmsLayer
        // --Cesium中加载CAD图(WMS图层自动叠加)--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
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
        // 加载proj4库，用于坐标转换
        if (typeof proj4 !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/proj4.min.js"
            }])
        }
        
        // 下面的参数内容请去 https://epsg.io/ 上面查询
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
        proj4.defs("EPSG:4544", "+proj=tmerc +lat_0=0 +lon_0=105 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs");
        
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
        
        let cadEpsg = "EPSG:4544" ;// cad图的espg代号
        // 增加cad的wms图层
        let wmsUrl = svc.wmsTileUrl({
            mapid: mapId, // 地图id
            layers: layer, // 图层名称
            bbox: '', // bbox这里不需要传，cesium会自动加上
            srs: "EPSG:4326", // cesium地图是wgs84
            crs: cadEpsg,
            // fourParameter: "-38000000,0,1,0" // 参数为(平移x,平移y,缩放k,旋转弧度r)  如果是有带号的坐标系并且x坐标只有6位，还需加个平移量x的8位的前两位如此38，根据实际情况改成实际的值
        })
        layers.addImageryProvider(
            new Cesium.WebMapServiceImageryProvider({
                url: wmsUrl,
            })
        );
        
        // cad图坐标转web wgs84坐标
        const cadToWebCoordinate =  point => {
            let co = proj4(cadEpsg, "EPSG:4326", point);
            return [co.x, co.y]
        }
        // 转web wgs84坐标转cad图坐标
        const webTocadCoordinate =  point => {
            let co = proj4("EPSG:4326", cadEpsg, point);
            return [co.x, co.y]
        }
        // 根据cad图的中心点，计算wgs84的中心点坐标
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let cadCenter = mapBounds.center();
        let webCenter =  cadToWebCoordinate(cadCenter);
        
        //设置初始位置
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(webCenter[0], webCenter[1], 30000)
        });
        
        // 点击拾取CAD图
        let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(async (movement) => {
            console.log(movement.position);
            var ray = viewer.scene.camera.getPickRay(movement.position);
            var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            // let cartesian = viewer.scene.pickPosition(movement.position);
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            let longitude = Cesium.Math.toDegrees(cartographic.longitude);
            let latitude = Cesium.Math.toDegrees(cartographic.latitude);
        
            let cadpoint = proj4("EPSG:4326", cadEpsg, [longitude, latitude]);
            console.log(cadpoint);
            let pixelToGeoLength = getPixelGeoLength();
            console.log(pixelToGeoLength, mapId, layer);
            const res = await svc.pointQueryFeature({
                pixelToGeoLength: pixelToGeoLength,
                x: cadpoint[0],
                y: cadpoint[1],
                geom: true,
                mapid: mapId, // 这里需要传要查询的地图id
                layer: layer
            });
            console.log(res);
            if (res && res.recordCount
                > 0 && res.result.length > 0) {
                message.info(res.result[0].name + "," + res.result[0].objectid)
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        
        function getPixelGeoLength() {
            let scene = viewer.scene;
            // 获取画布的大小
            var width = scene.canvas.clientWidth;
            var height = scene.canvas.clientHeight;
            //获取画布中心两个像素的坐标（默认地图渲染在画布中心位置）
            var left = scene.camera.getPickRay(new Cesium.Cartesian2((width / 2) | 0, (height - 1) / 2));
            var right = scene.camera.getPickRay(new Cesium.Cartesian2(1 + (width / 2) | 0, (height - 1) / 2));
        
            var globe = scene.globe;
            var leftPosition = globe.pick(left, scene);
            var rightPosition = globe.pick(right, scene);
            let leftCartographic = Cesium.Cartographic.fromCartesian(leftPosition);
            let leftLng = Cesium.Math.toDegrees(leftCartographic.longitude);
            let leftLat = Cesium.Math.toDegrees(leftCartographic.latitude);
            let rightCartographic = Cesium.Cartographic.fromCartesian(rightPosition);
            let rightLng = Cesium.Math.toDegrees(rightCartographic.longitude);
            let rightLat = Cesium.Math.toDegrees(rightCartographic.latitude);
            console.log(leftLng, leftLat);
            if (!Cesium.defined(leftPosition) || !Cesium.defined(rightPosition)) {
                return;
            }
        
            let leftPoint = proj4("EPSG:4326", cadEpsg, [leftLng, leftLat]);
            let rightPoint = proj4("EPSG:4326", cadEpsg, [rightLng, rightLat]);
            return Math.sqrt(Math.pow(leftPoint[0] - rightPoint[0], 2) + Math.pow(leftPoint[1] - rightPoint[1], 2));
        }
        // 如果需要在地图上查询cad的实体坐标，可通过svc.rectQueryFeature来实现，需要传入两个cad的点坐标范围
        // 可以通过 webTocadCoordinate 接口把wgs84的坐标转成 cad 的坐标去查询.
        
        
        // 如果是自定义坐标系，可以用如下代码
        /*
        // --Cesium中加载CAD图(WMS图层自动叠加)--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let mapId = "c84193cc2603";
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
        // 加载proj4库，用于坐标转换
        if (typeof proj4 !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/proj4.min.js"
            }])
        }
        let imageryProvider = new Cesium.UrlTemplateImageryProvider({
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
        
        
        let epsgCode = "+proj=tmerc +lat_0=0 +lon_0=113.283333 +k=1 +x_0=39980 +y_0=-2329620 +ellps=GRS80 +units=m +no_defs"
        
        // 自定义一个epsg坐标系
        proj4.defs("EPSG:900888", epsgCode);
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
        // 增加cad的wms图层
        let wmsUrl = svc.wmsTileUrl({
            mapid: mapId, // 地图id
            layers: layer, // 图层名称
            bbox: '', // bbox这里不需要传，cesium会自动加上
            srs: "EPSG:4326", // cesium地图是wgs84
            crs: epsgCode,
            // fourParameter: "-38000000,0,1,0" // 参数为(平移x,平移y,缩放k,旋转弧度r)  如果是有带号的坐标系并且x坐标只有6位，还需加个平移量x的8位的前两位如此38，根据实际情况改成实际的值
        })
        layers.addImageryProvider(
            new Cesium.WebMapServiceImageryProvider({
                url: wmsUrl,
            })
        );
        
        
        // cad图坐标转web wgs84坐标
        const cadToWebCoordinate =  point => {
            return proj4("EPSG:900888", "EPSG:4326", point);
        }
        // 转web wgs84坐标转cad图坐标
        const webTocadCoordinate =  point => {
            return proj4("EPSG:4326", "EPSG:900888", point);
        }
        // 根据cad图的中心点，计算wgs84的中心点坐标
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let cadCenter = mapBounds.center();
        let webCenter = cadToWebCoordinate([cadCenter.x, cadCenter.y]);
        
        //设置初始位置
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(webCenter[0], webCenter[1], 30000)
        });
        
        // 如果需要在地图上查询cad的实体坐标，可通过svc.rectQueryFeature来实现，需要传入两个cad的点坐标范围
        // 可以通过 webTocadCoordinate 接口把wgs84的坐标转成 cad 的坐标去查询.
        
         */
        
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