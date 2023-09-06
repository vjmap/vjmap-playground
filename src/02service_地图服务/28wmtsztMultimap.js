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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/28wmtsztMultimap
        // --WMTS叠加多个图形(先有底图坐标系不变)--通过wmts服务，把多个图形通过栅格瓦片叠加到一起
        /*
        优点：代码简单，叠加图层后之前绘制的图元无需清空重校绘制
        缺点：一开始要确定好初始范围
        */
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let baseMapId =  "sys_world";
        let res = await svc.openMap({
            mapid: baseMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: {
                backcolor: 0, // div为深色背景颜色时，这里也传深色背景样式
                // 这个方案这个范围很关键，可以根据情况修改，范围并保证包括以下叠加的图的所有范围才可以
                clipbounds: Math.pow(2, 3) // 只传值，不传范围，表示之前的范围放大多少倍
            }
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围(这个方案的话，这个范围是整个图的最终范围了，不能再变了）
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        
        map.addControl(new vjmap.NavigationControl());
        let mousePosCtrl = new vjmap.MousePositionControl({showZoom: true});
        map.addControl(mousePosCtrl);
        
        const addWmtsLayer = async (maps) => {
            let mapIds = [];
            let versions = [];
            let metas = []
            for(let m of maps) {
                let mid = m.mapid;
                mapIds.push(mid);
                versions.push(m.version);
                let meta = await svc.metadata(mid);
                metas.push(meta);
            }
        
        
            for(let k = 0; k < maps.length; k++) {
                let m = maps[k];
                let mid = m.mapid;
                let meta = metas[k];
                let layerIndexs;
                if (m.layernames) {
                    // 如果有图层设置，需要把图层名称转换为图层索引
                    layerIndexs = [];
                    for(let i = 0; i < m.layernames.length; i++) {
                        let idx = meta.layers.findIndex(e => e.name === m.layernames[i] )
                        if (idx >= 0) layerIndexs.push(idx)
                    }
                }
                let style = await svc.createStyle({
                    name: "customStyle",
                    backcolor: svc.currentMapParam().darkMode ? 0 : 0xFFFFFF,
                    layeron: layerIndexs ? `{"*": "(${layerIndexs.join(",")})"}` : undefined,
                    clipbounds: mapExtent.toArray().toString() // 用全图的范围
                }, mid, m.version);
        
        
                let tiles = svc.rasterTileUrl({
                    mapid: mid,
                    version: (m.version == "_" || !m.version) ? undefined : m.version,
                    layer: style.stylename
                });
                map.addRasterSource("mapTileSource" + mid, {
                    type: "raster",
                    tiles: [tiles],
                    tileSize: 256
                });
                map.addRasterLayer("mapTileLayer" + mid, "mapTileSource" + mid);
            }
        
        }
        
        
        await addWmtsLayer([
            {
                mapid: "sys_hello",
                version: "_" //表示使用最新版本
            },
            {
                mapid: "sys_topo",
                version: "_" //表示使用最新版本
            }
        ]);
        
        const clear = () => {
            map.removeMarkers();
            map.removeControl(mousePosCtrl);
            // 坐标系变了，鼠标位置控件也得重新加下
            mousePosCtrl = new vjmap.MousePositionControl({showZoom: true});
            map.addControl(mousePosCtrl);
        }
        // 这个方案的话，覆盖物不要删除再增加了，因为地图范围没变
        const addMarker = ()=> {
            new vjmap.Marker().setLngLat(map.toLngLat([725.3178740000039,18969.19101399999])).addTo(map)
        }
        addMarker();
        
        const removeMapSource = () => {
            let sources = map.getStyle().sources;
            for(let source in sources) {
                if (source.indexOf("mapTileSource") != 0) continue;
                map.removeSourceEx(source);
            }
        }
        
        const switchWmtsMap1 = async ()=> {
            removeMapSource(); // 把之前增加的wmts数据源和相关的图层都先删除了。
            // 增加新的wmts图层
            await addWmtsLayer([
                {
                    mapid: "sys_hello",
                    version: "_", //表示使用最新版本
                }
            ]);
        
        }
        
        const switchWmtsMap2 = async ()=> {
            removeMapSource();
            // 增加新的wmts图层
            await addWmtsLayer([
                {
                    mapid: "sys_topo",
                    version: "_" //表示使用最新版本
                }
            ]);
        
        }
        
        const switchWmtsMap3 = async ()=> {
            removeMapSource();
            // 增加新的wmts图层
            await addWmtsLayer([
                {
                    mapid: "sys_world",
                    version: "_" //表示使用最新版本
                },
                {
                    mapid: "sys_topo",
                    version: "_" //表示使用最新版本
                }
            ]);
        
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>切换叠加的图：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmtsMap1}>切换图1</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmtsMap2}>切换图2</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchWmtsMap3}>全部显示</button>
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