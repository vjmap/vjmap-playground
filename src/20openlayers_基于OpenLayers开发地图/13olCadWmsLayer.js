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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/13olCadWmsLayer
        // --互联网地图自动叠加CAD图[互联网图为底图]--
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
                center: vjmap.Projection.lngLat2Mercator([106.166187,  29.44102]),
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
            srs: "EPSG:3857", //
            crs: cadEpsg
        })
        function getQueryStringArgs(url) {
            let theRequest = {};
            let idx = url.indexOf("?");
            if (idx != -1) {
                let str = url.substr(idx + 1);
                let strs = str.split("&");
                for (let i = 0; i < strs.length; i++) {
                    let items = strs[i].split("=");
                    theRequest[items[0]] = items[1];
                }
            }
            return theRequest;
        }
        
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        // cad图坐标转web wgs84坐标
        const cadToWebCoordinate = async point => {
            let co = await svc.cmdTransform(cadEpsg, "EPSG:4326", point);
            return co[0]
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
                url: wmsUrl.substr(0, wmsUrl.indexOf("?")),
                params: {...getQueryStringArgs(wmsUrl),'TILED': true}
            }),
        }))
        
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