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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/03markerSetMany
        // --地图上绑定多个点标注记--
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
        const pickPoint = async (markerOptions)=> {
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
                        marker = new vjmap.createMarker(markerOptions);
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
        
        let allMarkers = []; // 所有的传感器数据
        let sensorId = 1;
        const bindPosition = async (index, props) => {
            // 根据索引使用自定义的图像地址
            let customImage = env.assetsPath + `images/sensor${index}.png`
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage =
                `url("${customImage}")`;
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.backgroundSize = '100%';
            let markerOptions = {
                element: el
            }
            let marker;
            if (!props) {
                // 如果没有位置，则人为指定
                marker = await pickPoint(markerOptions);
                if (!marker) return;
                marker.data = {
                    type: index, // 分类类型
                    sensorId: sensorId++ // 传感器ID
                }
            } else {
                marker = vjmap.createMarker(markerOptions);
                marker.setLngLat(map.toLngLat(props.position));
                marker.data = {...props.data}
                marker.addTo(map);
                sensorId = marker.data.sensorId + 1
            }
        
            // 可以拖动来改变位置
            marker.setDraggable(true);
            marker.on("mouseup", () => {
                message.info(`您点击的是 传感器${marker.data.type}, id为${marker.data.sensorId}`)
            })
            allMarkers.push(marker);
        }
        
        
        const saveMarkers = () => {
            let json = [];
            for(let m of allMarkers) {
                let pos = map.fromLngLat(m.getLngLat());
                json.push({
                    position: [pos.x, pos.y] , // 点数据
                    data: m.data // 属性数据
                })
            }
            // 示例为了演示把数据保存到了本地缓存，实际中需保存至自己的业务后台数据库中
            localStorage.setItem("marker_sensor", JSON.stringify(json, null, 0));
            message.info("保存成功");
        }
        
        const loadMarkers = () => {
            let data = localStorage.getItem("marker_sensor");
            if (!data) return
            let json = JSON.parse(data);
            map.removeMarkers() ;// 清空之前的
            for(let m = 0; m < json.length; m++) {
                bindPosition(json[m].data.type, json[m])
            }
        }
        
        const createTableExportDwg = async ()=> {
            let sensors = [];
            for(let m of allMarkers) {
                let pos = map.fromLngLat(m.getLngLat());
                sensors.push({
                    position: [pos.x, pos.y] , // 点数据
                    data: m.data // 属性数据
                })
            }
            if (sensors.length == 0) {
                message.error("图上还没有传感器数据呢")
                return
            }
            message.info("请在图上指定统计表格的位置")
            let drawRect = await vjmap.Draw.actionDrawRectangle(map, {
            });
            if (drawRect.cancel) {
                return ;// 取消操作
            }
            let co = drawRect.features[0].geometry.coordinates[0];
            co = map.fromLngLat(co);
            let tableBounds = vjmap.GeoBounds.fromDataExtent(co);
            let tableHeight = tableBounds.height();
            let doc = new vjmap.DbDocument();
            let param = svc.currentMapParam();
            doc.from = `${param.mapid}/${param.version}`;
            doc.entitys = [];
            let data = [
                ["统计信息"], // 第一行为标题
                ["ID", "类别", "位置"] // 第二行为表头
            ]
            // 数据项
            for(let sensor of sensors) {
                let item = [];
                item.push(sensor.data.sensorId);
                item.push(sensor.data.type);
                // 也可以指定颜色
                item.push({
                    text: `${sensor.position[0].toFixed(2)},${sensor.position[1].toFixed(2)}`,
                    contentColor: 0xFF0000,
                    textHeight: tableHeight / sensors.length / 10
                })
                data.push(item)
            }
            let table = new vjmap.DbTable({
                position: tableBounds.leftTop().toArray(), // 表格位置
                width: tableBounds.width(), // 表格宽
                height: tableHeight, // 表格高
                data
            })
            doc.entitys.push(table);
        
            // js代码
            let res = await svc.updateMap({
                // 获取一个临时的图id(临时图形只会用临时查看，过期会自动删除)
                mapid: vjmap.getTempMapId(1), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
                filedoc: JSON.stringify(doc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
                }
            })
            if (res.error) {
                message.error(res.error)
            }
        
            let url = `https://vjmap.com/app/cloud/#/map/${res.mapid}?mapopenway=Memory&version=${res.version}`;
            window.open(url);
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>地图上绑定数据位置点</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => bindPosition(1)}>绑定传感器一位置</button>
                                <button className="btn" onClick={() => bindPosition(2)}>绑定传感器二位置</button>
                                <button className="btn" onClick={() => bindPosition(3)}>绑定传感器三位置</button>
                                <button className="btn" onClick={() => saveMarkers()}>保存传感器数据</button>
                                <button className="btn" onClick={() => loadMarkers()}>加载传感器数据</button>
                                <button className="btn" onClick={() => createTableExportDwg()}>生成统计表格并导出DWG</button>
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