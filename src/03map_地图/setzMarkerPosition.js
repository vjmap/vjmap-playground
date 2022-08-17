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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/setzMarkerPosition
        // --地图上绑定数据位置点--
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
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        // 在地图上拾取一个点
        const pickPoint = async ()=> {
            let marker;
            let actionPoint = await vjmap.Draw.actionDrawPoint(map, {
                /* 如果需要捕捉cad图上面的点
                 api: {
                    getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                 },
                 */
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    if (!marker) {
                        // 如果第一次新增
                        marker = new vjmap.Marker();
                        marker.setLngLat(e.lnglat);
                        marker.addTo(map);
                    } else {
                        // 更新坐标
                        marker.setLngLat(e.lnglat);
                    }
                },
                contextMenu: (e) => {
                    // 点击右键弹出菜单
                    new vjmap.ContextMenu({
                        event: e.event.originalEvent,
                        theme: "dark", //light
                        width: "250px",
                        items: [
                            {
                                label: '取消',
                                onClick: () => {
                                    // 给地图发送ESC键消息即可取消，模拟按ESC键
                                    map.fire("keyup", {keyCode:27})
                                }
                            }
                        ]
                    });
        
                }
            });
            if (actionPoint.cancel) {
                // 如果是按ESC键取消了
                if (marker) marker.remove();
                return null;
            }
            // 获取当得到的点坐标，然后转成CAD地理坐标
            // let co = map.fromLngLat(actionPoint.features[0].geometry.coordinates);
            //message.info(`您获取的点坐标为: ${co.x}, ${co.y}`)
            return marker;
        }
        
        // 绑定位置
        let posMarker;
        const bindPositon = async () => {
            removeMarker();
            posMarker = await pickPoint();
            if (!posMarker) return;
            // 获取当得到的点坐标，然后转成CAD地理坐标
            let co = map.fromLngLat(posMarker.getLngLat());
            document.querySelector("#text").innerText = `绑定的点坐标为: ${co.x}, ${co.y}`;
        
            // 可以拖动来改变位置
            posMarker.setDraggable(true);
            posMarker.on("dragend", markerDragend);
        }
        
        // 解绑位置
        const unBindPositon = () => {
            removeMarker();
            document.querySelector("#text").innerText = `未绑定`;
        }
        // 拖动完成事件
        const markerDragend = e => {
            if (!posMarker) return;
            // 获取当得到的点坐标，然后转成CAD地理坐标
            let co = map.fromLngLat(posMarker.getLngLat());
            document.querySelector("#text").innerText = `绑定的点坐标为: ${co.x}, ${co.y}`;
        }
        const removeMarker = ()=> {
            if (posMarker) {
                posMarker.remove();
            }
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info">
                        <h4>请点击绑定位置试试</h4>
                        <p><span id="text">未绑定</span></p>
                    </div>
                    <div className="input-card">
                        <h4>地图上绑定数据位置点</h4>
                        <div>
                            <div className="input-item">
                                <button id="clickOn" className="btn" onClick={() => bindPositon()}>绑定位置</button>
                                <button id="clickOff" className="btn" onClick={() => unBindPositon()}>解绑位置</button>
                            </div>
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