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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/04webWms
        // --天地图与CAD图叠加[天地图为底图]--天地图与CAD图叠加，以天地图为坐标系
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
        let cadMapId = "sys_cad2000"
        let style = await svc.createStyle({
            backcolor: 0xFFFFFF // 浅色主题
        }, cadMapId)
        let wmsurl = svc.wmsTileUrl({
            mapid: cadMapId,
            version:"v1",
            layers: style.stylename,
            srs: "EPSG:3857", // 底图是天地图坐标系
            crs: "EPSG:4548", // cad图是2000坐标  可通过前两位获取 vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
            // 如果是自定义的投影，也可以直接写proj表达式，如 （中央经线100-东偏10000-北偏-2000000）
            // crs: encodeURIComponent("+proj=tmerc +lat_0=0 +lon_0=100 +k=1 +x_0=10000 +y_0=-2000000 +ellps=GRS80 +units=m +no_defs")
            // crs也可以一个prj投影文件WKT的内容, 如 crs: encodeURIComponent(`PROJCS["CGCS2000 / 3-degree Gauss-Kruger CM 111E",GEOGCS["China Geodetic Coordinate System 2000",DATUM["China_2000",SPHEROID["CGCS2000",6378300,300,AUTHORITY["EPSG","1024"]],AUTHORITY["EPSG","1043"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.018,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4490"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",112.1],PARAMETER["scale_factor",1],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","4546"]]`)
            // 如果是投影prj文件WKT字符串，在前端也需要转换坐标，可以把投影prj文件WKT字符转为proj4字符，再用prj4进行坐标转换。方法为 await svc.cmdPrjWktToPrj4(`PROJCS["CGCS2000 / 3-degree Gauss-Kruger CM 111E",GEOGCS["China Geodetic Coordinate System 2000",DATUM["China_2000",SPHEROID["CGCS2000",6378300,300,AUTHORITY["EPSG","1024"]],AUTHORITY["EPSG","1043"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.018,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4490"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",112.1],PARAMETER["scale_factor",1],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","4546"]]`);
            // fourParameter: "-39000000,0,1,0"// 此图坐标前面没有加带系，需要加上带系的偏移量，用四参数调节位置
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