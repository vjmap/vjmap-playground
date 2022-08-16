const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/28wmsZMultimap
        // --WMS叠加多个图形--通过wms服务，把多个图形通过栅格瓦片叠加到一起
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        svc.setCurrentMapParam({
            darkMode: true // 由于没有打开过图，所以主动设置黑色模式
        })
        // 先随便设置一个范围吧。后面再更改
        let mapBounds = '[-10000,-10000,10000,10000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },// 矢量瓦片样式
            center: [0,0], // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        const addWmsLayer = async (maps) => {
            let mapIds = [];
            let layers = [];
            let versions = [];
            let bounds = new vjmap.GeoBounds()
            for(let m of maps) {
                let mid = m.mapid;
                mapIds.push(mid);
                versions.push(m.version);
                let meta = await svc.metadata(mid);
                // 更新范围，求出最大的图形范围
                bounds.updateByBounds(vjmap.GeoBounds.fromString(meta.bounds));
        
                let layerIndexs
                if (m.layernames) {
                    // 如果有图层设置，需要把图层名称转换为图层索引
                    layerIndexs = [];
                    for(let i = 0; i < m.layernames.length; i++) {
                        let idx = meta.layers.findIndex(e => e.name === m.layernames[i] )
                        if (idx >= 0) layerIndexs.push(idx)
                    }
                }
                let style = await svc.createStyle({
                    backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF,
                    layeron: layerIndexs ? `{"*": "(${layerIndexs.join(",")})"}` : undefined
                }, mid);
                layers.push(style.stylename)
            }
            // 把最大的图形范围做为地图的范围
            map.updateMapExtent(bounds);
        
            let wmsurl = svc.wmsTileUrl({
                mapid: mapIds,
                layers: layers,
                version: versions, // 都用最新版本
                mapbounds: bounds.toString() // 全图的范围
            })
        
            map.addSource('wms-maps-source', {
                'type': 'raster',
                'tiles': [
                    wmsurl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': 'wms-maps-layer',
                    'type': 'raster',
                    'source': 'wms-maps-source',
                    'paint': { "raster-opacity": 1 }
                }
            );
        }
        
        
        addWmsLayer([
            {
                mapid: "sys_hello",
                version: "_" //表示使用最新版本
            },
            {
                mapid: "sys_world",
                version: "_", //表示使用最新版本
                layernames: ["COUNTRY", "经纬度标注"] // 要显示的图层名称列表，如果为空，表示默认所有的
            },
            {
                mapid: "sys_topo",
                version: "_" //表示使用最新版本
            }
        ]);
        
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