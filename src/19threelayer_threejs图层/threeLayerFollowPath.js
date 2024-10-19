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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerFollowPath
        // --threejs模型路径动画--
        // !!! 下面中的`vjthree`库已弃用，请用最新的[唯杰地图3D库] https://vjmap.com/map3d/
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
            zoom: 4,
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
            enableSelectingFeatures: true,
            enableSelectingObjects: true, // 将此更改为 false 以禁用 3D 对象选择
            enableDraggingObjects: true, // 将此更改为 false 以禁用 3D 对象在选择后拖动和移动
            enableRotatingObjects: true, // 将此更改为 false 以禁用选择后的 3D 对象旋转
            enableTooltips: true // 将此更改为 false 以禁用填充挤出和 3D 模型的默认工具提示
        });
        const options = {
            obj: env.assetsPath + 'data/soldier.glb',
            type: 'gltf',
            scale: 500000,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 }, //default rotation
            anchor: 'center'
        }
        let soldier, line;
        let selectedObject;
        let origin = [center.lng, center.lat, 0];
        
        // 选择改变
        const onSelectedChange = e => {
            let selected = e.detail.selected;
            console.log("onSelectedChange: " + selected);
            if (selected) {
                selectedObject = e.detail;
                message.info("按“Shift”拖动或按“Alt”旋转");
            }
            threeContext.update();
        }
        
        const createLabelIcon = (text) => {
            let popup = document.createElement('div');
            popup.innerHTML = '<span title="' + text + '" style="font-size: 30px;color: yellow;">&#9762;</span>';
            return popup;
        }
        threeContext.loadObj(options, function (model) {
            soldier = model.setCoords(origin);
            model.addLabel(createLabelIcon("Status: Radioactive"), true);
            model.addTooltip("This is a custom tooltip", true);
            threeContext.add(soldier);
        
            // Listening to the events
            soldier.addEventListener('SelectedChange', onSelectedChange, false);
            soldier.addEventListener('Wireframed', e => console.log("Wireframed", e), false);
            soldier.addEventListener('IsPlayingChanged', e => console.log("IsPlayingChanged", e), false);
            soldier.addEventListener('ObjectDragged', e => console.log("ObjectDragged", e), false);
            soldier.addEventListener('ObjectMouseOver', e => console.log("ObjectMouseOver", e), false);
            soldier.addEventListener('ObjectMouseOut', e => console.log("ObjectMouseOut", e), false);
            soldier.addEventListener('ObjectChanged', e => console.log("ObjectChanged", e), false);
        })
        map.addLayer(new vjmap.ThreeLayer({context: threeContext}));
        map.on('click', function (e) {
            const pt = [e.lngLat.lng, e.lngLat.lat, 0];
            travelPath(pt);
        })
        
        
        const setWireframe = (bWireframe) => {
            if (selectedObject) {
                selectedObject.wireframe = bWireframe;
                threeContext.update();
                map.repaint = true;
            } else {
                message.info("请先选择模型")
            }
        }
        
        const objectPlay = bPlay => {
            if (selectedObject) {
                if (bPlay) {
                    if (!selectedObject.isPlaying) {
                        selectedObject.playAnimation( { animation: 1, duration: 5000 });
                    }
                } else {
                    if (selectedObject.isPlaying) {
                        selectedObject.stop();
                    }
                }
            }  else {
                message.info("请先选择模型")
            }
        }
        
        const travelPath = (destination) => {
            const path = [origin, destination];
            let duration = 5000;
            const options = {
                animation: 1,
                path,
                duration: duration
            }
        
            // start the soldier animation with above options, and remove the line when animation ends
            soldier.followPath(
                options,
                () => {
                    threeContext.remove(line);
                }
            );
            soldier.playAnimation(options);
        
            // create and add line object
            line = threeContext.line({
                geometry: path,
                width: 5,
                color: 'steelblue'
            })
        
            threeContext.add(line);
        
            // set destination as the new origin, for the next trip
            origin = destination;
        
        }
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>设置</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => objectPlay(true)}>运行</button>
                                <button className="btn" onClick={() => objectPlay(false)}>停止</button>
                                <button className="btn" onClick={() => setWireframe(true)}>线宽模式</button>
                                <button className="btn" onClick={() => setWireframe(false)}>非线宽模式</button>
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