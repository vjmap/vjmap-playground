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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/02drawAsync
        // --异步方式绘制图形--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        map.doubleClickZoom.disable(); // 禁止双击放大
        await map.onLoad();
        
        let options = {
            /* 如果需要捕捉cad图上面的点
             api: {
                getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
             },
             */
            contextMenu: (e) => {
                // 点击右键弹出菜单
                new vjmap.ContextMenu({
                    event: e.event.originalEvent,
                    theme: "dark", //light
                    width: "250px",
                    items: [
                        {
                            label: '确认',
                            onClick: () => {
                                // 给地图发送Enter键消息即可取消，模拟按Enter键
                                map.fire("keyup", {keyCode: 13})
                            }
                        },
                        {
                            label: '取消',
                            onClick: () => {
                                // 给地图发送ESC键消息即可取消，模拟按ESC键
                                map.fire("keyup", {keyCode: 27})
                            }
                        }
                    ]
                });
            }
        }
        // 绘制一个点
        const doActionPoint = async () => {
            let point = await vjmap.Draw.actionDrawPoint(map, options);
            if (point.cancel) return;// 如果取消了
            // 获取坐标
            let coordinates = point.features[0].geometry.coordinates;
            // 获取地图默认的draw图层，也可以是自定义的draw图层
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // 把坐标和要赋值的id及相关属性生成一个feature，加进draw对象中
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                properties: {
                    "color_inactive": "#00ffff",
                    "color_static": "#00ffff",
                    "radius_inactive": 5,
                    "radius_static": 5
                }
            });
        }
        
        // 绘制一条线
        const doActionLine = async () => {
            let line = await vjmap.Draw.actionDrawLineSting(map, options);
            if (line.cancel) return;// 如果取消了
            // 获取坐标
            let coordinates = line.features[0].geometry.coordinates;
            // 获取地图默认的draw图层，也可以是自定义的draw图层
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // 把坐标和要赋值的id及相关属性生成一个feature，加进draw对象中
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "line_width": 1
                }
            });
        }
        
        // 绘制多边形
        const doActionPolygon = async () => {
            let poly = await vjmap.Draw.actionDrawPolygon(map, options);
            if (poly.cancel) return;// 如果取消了
            // 获取坐标
            let coordinates = poly.features[0].geometry.coordinates;
            // 获取地图默认的draw图层，也可以是自定义的draw图层
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // 把坐标和要赋值的id及相关属性生成一个feature，加进draw对象中
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "opacity": 1,
                    "outlineColor": "#ff0000",
                    "line_width": 1,
                    "line_opacity": 1
                }
            });
        }
        
        // 绘制拉伸多边形
        const doActionFillExtrusion = async () => {
            let fill = await vjmap.Draw.actionDrawPolygon(map, options);
            if (fill.cancel) return;// 如果取消了
            // 获取坐标
            let coordinates = fill.features[0].geometry.coordinates;
            // 获取地图默认的draw图层，也可以是自定义的draw图层
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // 把坐标和要赋值的id及相关属性生成一个feature，加进draw对象中
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                },
                properties: {
                    "color": "#00ffff",
                    "opacity": 1,
                    "outlineColor": "#ff0000",
                    "line_width": 1,
                    "line_opacity": 1,
                    "extrusionHeight": map.geoLengthToHeight(mapExtent.width() / 10)
                }
            });
        }
        
        // 绘制圆
        const doActionCircle = async () => {
            let circle = await vjmap.Draw.actionDrawCircle(map, options);
            if (circle.cancel) return;// 如果取消了
            // 获取坐标
            let coordinates = circle.features[0].geometry.coordinates;
            // 获取地图默认的draw图层，也可以是自定义的draw图层
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // 把坐标和要赋值的id及相关属性生成一个feature，加进draw对象中
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates[0]
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "line_width": 1
                }
            });
        }
        
        // 绘制矩形
        const doActionRectangle = async () => {
            let rect = await vjmap.Draw.actionDrawRectangle(map, options);
            if (rect.cancel) return;// 如果取消了
            // 获取坐标
            let coordinates = rect.features[0].geometry.coordinates;
            // 获取地图默认的draw图层，也可以是自定义的draw图层
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // 把坐标和要赋值的id及相关属性生成一个feature，加进draw对象中
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates[0]
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "line_width": 1
                }
            });
        }
        
        // 绘制斜矩形
        const doActionSlantRectangle = async () => {
            let srect = await vjmap.Draw.actionDrawSlantRectangle(map, options);
            if (srect.cancel) return;// 如果取消了
            // 获取坐标
            let coordinates = srect.features[0].geometry.coordinates;
            // 获取地图默认的draw图层，也可以是自定义的draw图层
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // 把坐标和要赋值的id及相关属性生成一个feature，加进draw对象中
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates[0]
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "line_width": 1
                }
            });
        }
        
        const doActionSelect = async () => {
            // 按shift键可拉框选择或点击多选
            let draw = map.getDrawLayer();
            let sel = await vjmap.Draw.actionSelect(map, draw, options);
            if (sel.cancel) return;
            map.logInfo(`共选择了 ${sel.features.length} 个`)
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "40px", right: "10px"}}>
                        <h4>绘图类型：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionPoint()}>点
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionLine()}>线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionPolygon()}>多边形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionFillExtrusion()}>拉伸多边形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionCircle()}>圆
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionRectangle()}>矩形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionSlantRectangle()}>斜矩形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionSelect()}>选择
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App/>, document.getElementById('ui'));
        
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