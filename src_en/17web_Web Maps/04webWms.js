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
        // --Tianditu and CAD overlay [Tianditu as base]-- Tianditu as CRS
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Create lnglat projection by map bounds
        let prj = new vjmap.LnglatProjection();
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: {
                version: svc.styleVersion(),
                sources: {
                    tdt1: {
                        type: 'raster',
                        tiles: ["https://t3.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                        // For imagery use this URL
                        // tiles: ["https://t3.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"]
                        maxzoom: 18,// Max zoom 18
                    },
                    tdt2: {
                        type: 'raster',
                        tiles: ["https://t3.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                        maxzoom: 18,// Max zoom 18
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
            maxZoom: 24, // Max map zoom 24
            renderWorldCopies: false // Do not show multi-screen map
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent by map bounds
        //map.fitMapBounds();
        await map.onLoad();
        // Get map metadata for layer style
        let cadMapId = "sys_cad2000"
        let style = await svc.createStyle({
            backcolor: 0xFFFFFF // Light theme
        }, cadMapId)
        let wmsurl = svc.wmsTileUrl({
            mapid: cadMapId,
            version:"v1",
            layers: style.stylename,
            srs: "EPSG:3857", // Base map is Tianditu CRS
            crs: "EPSG:4548", // CAD map is CGCS2000, get by first two digits: vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
            // For custom projection, use proj expression, e.g. (central meridian 100, east 10000, north -2000000)
            // crs: encodeURIComponent("+proj=tmerc +lat_0=0 +lon_0=100 +k=1 +x_0=10000 +y_0=-2000000 +ellps=GRS80 +units=m +no_defs")
            // crs can be WKT of prj file
            // fourParameter: "-39000000,0,1,0"// If coordinates have no belt prefix, add belt offset, use four-param to adjust
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