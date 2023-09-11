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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/14olCadWmsLayer4326
        // --互联网地图4326自动叠加CAD图[互联网图为底图]--底图为4326的坐标系
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
                center: [106.166187, 29.44102],
                projection: 'EPSG:4326', // 底图设置是4326
                zoom: 15,
            }),
        });
        
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
        
        
        let cadEpsg = "EPSG:4544";// cad图的espg代号
        // 增加cad的wms图层
        let wmsUrl = svc.wmsTileUrl({
            mapid: mapId, // 地图id
            layers: layer, // 图层名称
            bbox: '', // bbox这里不需要
            srs: "EPSG:4326", // 底图坐标系是 4326，这里也设置为4326
            crs: cadEpsg
        })
        
        
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        // cad图坐标转web wgs84坐标
        const cadToWebCoordinate = async point => {
            let co = await svc.cmdTransform(cadEpsg, "EPSG:4326", point);
            return co[0]
        }
        // cad转wgs84经纬度
        let boundsMin = await cadToWebCoordinate(mapBounds.min);
        let boundsMax = await cadToWebCoordinate(mapBounds.max);
        
        // 在openlayer中增加wms图层
        map.addLayer(new ol.layer.Tile({
            // 范围
            extent: [boundsMin[0], boundsMin[1], boundsMax[0], boundsMax[1]],
            source: new ol.source.TileWMS({
                url: wmsUrl,
                params: { 'TILED': true },
                tileLoadFunction: function(image, src) {
                    // openlayers 4326 下 bbox的xy是反的了，所以这里一定要处理下，把xy正过来
                    let index = src.indexOf('?');
                    let params = new URLSearchParams(src.slice(index));
                    let bbox = params.get('BBOX').split(',');
                    params.set('BBOX', [bbox[1], bbox[0], bbox[3], bbox[2]].toString());
                    image.getImage().src = src.slice(0, index + 1) + params.toString();
                }
            }),
        }))
        
        
        // 如果是自定义坐标系，可以用以下的示例
        /*
        if (typeof ol !== "object") {
            // 如果没有openlayer环境
            await vjmap.addScript([{
                src: "../../js/ol7.1.0/ol.js"
            },{
                src: "../../js/ol7.1.0/ol.css"
            }]);
        }
        // 加载proj4库，用于坐标转换
        if (typeof proj4 !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/proj4.min.js"
            }])
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
                center: vjmap.Projection.lngLat2Mercator([113.26797190135004, 23.306017680608843]),
                zoom: 15,
            }),
        });
        
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
        
        let epsgCode = "+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs"
        // epsgcode也可以一个prj投影文件WKT的内容, 如 epsgCode = `PROJCS["CGCS2000 / 3-degree Gauss-Kruger CM 111E",GEOGCS["China Geodetic Coordinate System 2000",DATUM["China_2000",SPHEROID["CGCS2000",6378300,300,AUTHORITY["EPSG","1024"]],AUTHORITY["EPSG","1043"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.018,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4490"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",112.1],PARAMETER["scale_factor",1],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","4546"]]`
        // 如果是投影prj文件WKT字符串，在前端也需要转换坐标，可以把投影prj文件WKT字符转为proj4字符，再用prj4进行坐标转换。方法为 await svc.cmdPrjWktToPrj4(epsgCode);
        
        // 自定义一个epsg坐标系
        proj4.defs("EPSG:900888", epsgCode);
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
        
        let cadEpsg = encodeURIComponent(epsgCode);// cad图的espg代号
        // 增加cad的wms图层
        let wmsUrl = svc.wmsTileUrl({
            mapid: mapId, // 地图id
            layers: layer, // 图层名称
            bbox: '', // bbox这里不需要
            srs: "EPSG:3857", //
            crs: cadEpsg
        })
        
        
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        // cad图坐标转web wgs84坐标
        const cadToWebCoordinate = async point => {
            let co = proj4("EPSG:900888", "EPSG:4326", point);
            console.log(co)
            return co
        }
        // cad转wgs84经纬度
        let boundsMin = await cadToWebCoordinate(mapBounds.min);
        let boundsMax = await cadToWebCoordinate(mapBounds.max);
        // wgs84经纬度转墨卡托
        boundsMin = vjmap.Projection.lngLat2Mercator(boundsMin);
        boundsMax = vjmap.Projection.lngLat2Mercator(boundsMax);
        
        // 在openlayer中增加wms图层
        map.addLayer(new ol.layer.Tile({
            // 范围
            extent: [boundsMin[0], boundsMin[1], boundsMax[0], boundsMax[1]],
            source: new ol.source.TileWMS({
                url: wmsUrl,
                params: {'TILED': true}
            }),
        }))
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