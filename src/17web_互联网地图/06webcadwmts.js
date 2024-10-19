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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/06webcadwmts
        // --CAD图WMTS叠加[天地图为底图]--天地图与CAD图叠加，以天地图为坐标系,CAD做为WMTS层叠加
        // 注：这种叠加只适用于地理范围较小的图纸，否则会有较大偏差！！！
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
                        // 要使用影像请用这个地址
                        // tiles: ["https://t3.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"]
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
            center: prj.toLngLat([117.21242940465396, 39.196783504641644]),
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
        let cadMapId = "sys_cad2000";
        let cadEpsg = "EPSG:4548"; // cad图是2000坐标
        
        let isWgs84 = true; // 是否为wgs84 如果是高德地图请改成false
        
        // cad转web坐标，isWgs84是否为wgs84 4326坐标，如天地图；否的话为gcj02火星坐标,如高德地图
        const cad2webCoordinate = async (pt, isWgs84) => {
            // 通过坐标转换把转成wgs84 4326坐标
            let res = await svc.cmdTransform(cadEpsg,"EPSG:4326",pt); // 如果不想调服务转，也可以在前端用proj4库
            // 如果为火星坐标，还需要从4326转火星
            let webPt = res[0];// 返回的第1条结果
            if (isWgs84 === false) {
                webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
            }
            return webPt;
        }
        
        // web转cad坐标，isWgs84是否为wgs84 4326坐标，如天地图；否的话为gcj02火星坐标,如高德地图
        const web2cadCoordinate = async (pt, isWgs84) => {
            // (上面计算过程的逆过程), 如果为火星坐标，还需要从火星转4326，再通过坐标转换把wgs84 4326转成cad图坐标
            if (isWgs84 === false) {
                pt = vjmap.transform.convert(pt, vjmap.transform.CRSTypes.AMap, vjmap.transform.CRSTypes.EPSG4326);
            }
            // 通过坐标转换把cad epsg转成wgs84 4326坐标
            let res = await svc.cmdTransform("EPSG:4326",cadEpsg,vjmap.geoPoint(pt)); // 如果不想调服务转，也可以在前端用proj4库
            let cadPt = res[0];// 返回的第1条结果
            return cadPt
        }
        
        // 获取CAD图的范围，转成墨卡托坐标
        let metadata = await svc.metadata(cadMapId, "v1")
        let mapBounds = vjmap.GeoBounds.fromString(metadata.bounds);
        // 左上角
        let p1 = mapBounds.leftTop();
        // 右下角
        let p2 = mapBounds.rightBottom();
        let webp1 = await cad2webCoordinate(p1, isWgs84)
        let webp2 = await cad2webCoordinate(p2, isWgs84)
        // 转墨卡托
        let mctp1 = vjmap.Projection.lngLat2Mercator(webp1);
        let mctp2 = vjmap.Projection.lngLat2Mercator(webp2);
        
        // 墨卡托全球范围
        // 确保是个正方形（这里会有偏差）
        let delta = ((mctp1[1] - mctp2[1] ) +  (mctp2[0] - mctp1[0] )) / 2.0;
        mctp2[0] = mctp1[0] + delta;
        mctp2[1] = mctp1[1] - delta
        
        let earthBounds = vjmap.Projection.EARTH_BOUNDS;
        // 反算出cad在全球的范围
        let ratioX1 = (mctp1[0] - earthBounds[0]) / (earthBounds[2] - earthBounds[0])
        let ratioY1 = (mctp2[1] - earthBounds[1]) / (earthBounds[3] - earthBounds[1])
        let ratioX2 = (mctp2[0] - earthBounds[0]) / (earthBounds[2] - earthBounds[0])
        let ratioY2 = (mctp1[1] - earthBounds[1]) / (earthBounds[3] - earthBounds[1])
        
        let cadEarthBoundsX1 = (ratioX2 * p1.x - ratioX1 * p2.x) / (ratioX2 - ratioX1)
        let cadEarthBoundsX2 = (p1.x - cadEarthBoundsX1) / ratioX1 + cadEarthBoundsX1;
        let cadEarthBoundsY1 = (ratioY2 * p2.y - ratioY1 * p1.y) / (ratioY2 - ratioY1)
        let cadEarthBoundsY2 = (p2.y - cadEarthBoundsY1) / ratioY1 + cadEarthBoundsY1;
        
        let cadEarthBounds = vjmap.GeoBounds.fromArray([cadEarthBoundsX1, cadEarthBoundsY1, cadEarthBoundsX2, cadEarthBoundsY2])
        cadEarthBounds = cadEarthBounds.square()
        let style = await svc.createStyle({
            name: "cadEarthStyle",
            clipbounds: cadEarthBounds.toString() // 用新的全图的范围
        }, cadMapId, "v1");
        
        
        let tiles = svc.rasterTileUrl({
            mapid: cadMapId,
            version:"v1",
            layer: style.stylename
        });
        map.addRasterSource("mapTileSource", {
            type: "raster",
            tiles: [tiles],
            tileSize: 256
        });
        map.addRasterLayer("mapTileLayer", "mapTileSource");
        
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