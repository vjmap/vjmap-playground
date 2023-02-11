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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/28wmsZMultimap2
        // --WMS叠加多个图形(坐标系不变)--通过wms服务，把多个图形通过栅格瓦片叠加到一起
        /*
        事先给定一个要叠加的整个图的范围，WMS叠加后，坐标系不会发生变化
        优点：坐标系不会发生变化，叠加之前绘制的图元叠加后不会发生变化
        缺点: 需要事先给一个整个图的范围
        */
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        svc.setCurrentMapParam({
            darkMode: true // 由于没有打开过图，所以主动设置黑色模式
        })
        // 获取所有图的最大范围
        const getMapIdsMaxBounds = async (mapIds) => {
            let bounds = new vjmap.GeoBounds()
            for(let mid of mapIds) {
                let meta = await svc.metadata(mid);
                // 更新范围，求出最大的图形范围
                bounds.updateByBounds(vjmap.GeoBounds.fromString(meta.bounds));
            }
            // 可以把整个的范围再放大点
            bounds = bounds.scale(2); // 假如放大两倍（范围大点没事，不能小于以后要叠加的地图范围，否则导致看不到了)
            return bounds;
        }
        // 先得设置一个要叠加的图形的所有范围，确保以后叠加的图的范围不要超过这个范围。这个范围可以设置大点没有关系
        // 可以直接把范围事先写好
        // let mapBounds = '[-82357.33885898918,-89333.58929316388,152716.4032620259,76055.438220678]'
        //  let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        // 也可以通过代码把要叠加的地图范围整个的范围获取到
        let mapExtent = await getMapIdsMaxBounds(['sys_hello', 'sys_world', 'sys_topo']);
        mapExtent = mapExtent.square(); // 要转成正方形
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
        
        //map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        const addWmsLayer = async (maps) => {
            let mapIds = [];
            let layers = [];
            let versions = [];
            for(let m of maps) {
                let mid = m.mapid;
                mapIds.push(mid);
                versions.push(m.version);
                let meta = await svc.metadata(mid);
        
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
                    layeron: layerIndexs ? `{"*": "(${layerIndexs.join(",")})"}` : undefined,
                    clipbounds: mapExtent.toArray() // 样式时要传入一开始的全图的地图范围
                }, mid);
                layers.push(style.stylename)
            }
        
            let wmsurl = svc.wmsTileUrl({
                mapid: mapIds,
                layers: layers,
                version: versions, // 都用最新版本
                mapbounds: mapExtent.toString() // 要传入一开始的全图的地图范围
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
        
        
        await addWmsLayer([
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
        
        const addMarker = ()=> {
            new vjmap.Marker().setLngLat(map.toLngLat([725.3178740000039,18969.19101399999])).addTo(map)
        }
        addMarker();
        
        const switchWmsMap1 = async ()=> {
            map.removeSourceEx('wms-maps-source'); // 把之前增加的wms数据源和相关的图层都先删除了。
            // 增加新的wms图层
            await addWmsLayer([
                {
                    mapid: "sys_hello",
                    version: "_", //表示使用最新版本
                },
                {
                    mapid: "sys_topo",
                    version: "_" //表示使用最新版本
                }
            ]);
            addMarker();
        }
        
        const switchWmsMap2 = async ()=> {
            map.removeSourceEx('wms-maps-source'); // 把之前增加的wms数据源和相关的图层都先删除了。
            // 增加新的wms图层
            await addWmsLayer([
                {
                    mapid: "sys_hello",
                    version: "_" //表示使用最新版本
                },
                {
                    mapid: "sys_world",
                    version: "_" //表示使用最新版本
                }
            ]);
            addMarker();
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>切换叠加的图：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmsMap1}>切换图1</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmsMap2}>切换图2</button>
                        </div>
        
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        
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