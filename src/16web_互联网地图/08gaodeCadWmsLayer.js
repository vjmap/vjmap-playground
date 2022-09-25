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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/08gaodeCadWmsLayer
        // --高德SDK中加载CAD图(WMS图层)--
        
        if (typeof AMap !== "object") {
            // 如果没有amap环境
            await vjmap.addScript({
                // 注意,请次下面的key替换为自己在高德sdk中申请的key，否则会导致报错
                src: "https://webapi.amap.com/maps?v=1.4.15&key=5ef803514b9a411419dc3c82d6643e12"
            });
        
        }
        let map = new AMap.Map('map', {
            zoom: 15,
            center: [106.166187, 29.44102]
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
            crs: cadEpsg,
            webMapType: "GCJ02"
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
        
        let wms = new AMap.TileLayer.WMS({
            url: wmsUrl.substr(0, wmsUrl.indexOf("?")),
            blend: true,
            tileSize: 256,
            params: getQueryStringArgs(wmsUrl)
        });
        
        wms.setMap(map);
        
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