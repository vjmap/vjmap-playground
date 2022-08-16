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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerMultiLayer
        // --threejs多个图层--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            pitch: 60,
            antialias:true,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        const center = map.getCenter();
        const len = mapBounds.width() / 20;
        
        if (typeof vjThree !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/plugins/vjthree.min.js"
            },{
                src: "../../js/plugins/vjthree.min.css"
            }])
        }
        
        const threeContext = map.createThreeJsContext({
            defaultLights: true,
            enableSelectingObjects: true,
            enableTooltips: true,
            multiLayer: true // 这将创建一个默认的自定义层来管理单个更新
        });
        
        const colors = ['red', 'green', 'blue'];
        for(let i = 0; i < 3; i++) {
            const layerId = "custom_layer_" + i;
            const pt = map.toLngLat(mapBounds.randomPoint());
            map.addLayer(new vjmap.ThreeLayer({
                id: layerId,
                context: threeContext
            }));
            const sphere = threeContext.sphere({
                color: colors[i],
                radius: prj.toMeter(len),
                units: "meters",
                material: 'MeshToonMaterial'
            }).setCoords([...pt, len]);
            threeContext.add(sphere, layerId);
        }
        
        const setLayerVisibility = (idx, visible) => {
            const layerId = "custom_layer_" + idx;
            map.setLayoutProperty(layerId, 'visibility', visible ? "": 'none');
            threeContext.toggleLayer(layerId, visible);
            // 可以设置图层在哪些级别显示
            threeContext.setLayerZoomRange(layerId, 0, 3 + i);
        }
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>设置</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => setLayerVisibility(0, true)}>图层一开</button>
                                <button className="btn" onClick={() => setLayerVisibility(0, false)}>图层一关</button>
                                <button className="btn" onClick={() => setLayerVisibility(1, true)}>图层二开</button>
                                <button className="btn" onClick={() => setLayerVisibility(1, false)}>图层二关</button>
                                <button className="btn" onClick={() => setLayerVisibility(2, true)}>图层三开</button>
                                <button className="btn" onClick={() => setLayerVisibility(2, false)}>图层三关</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'))
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