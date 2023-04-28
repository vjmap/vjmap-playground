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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/13olfourparamrotatecad
        // --CAD图与互联网地图旋转叠加[CAD为底图]--
        
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
        // 获取地图范围
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapBounds);
        let center = mapBounds.center();
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
                zoom: 9 // 初始缩放级别
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
        map.getView().setRotation(-param.rotate) ;
        
        // 增加高德地图底图
        let gdlayer;
        const addGaodeMap = async (isRoadway) => {
            let b = mapBounds;
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
        
        // 增加一个瓦片图层
            gdlayer = new ol.layer.Tile({
                // 增加一个瓦片数据源
                source: new ol.source.TileImage({
                    url: tileUrl
                })
            });
            gdlayer.setZIndex(-1);
        // 在地图中增加上面的瓦片图层
            map.addLayer(gdlayer);
        }
        
        const removeMapLayer = ()=> {
            // 删除source及source下面的所有图层
            map.removeLayr(gdlayer);
        }
        
        
        addGaodeMap(true);
        
        
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