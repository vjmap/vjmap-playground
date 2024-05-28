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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/08drawEllipse
        // --自定义交互式绘制--
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
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.4);
        
        const cancelDraw = ()=> {
            // 给地图发送ESC键消息即可取消，模拟按ESC键
            map.fire("keyup", {keyCode:27})
        }
        
        const drawEllipse = async (isFill, isSetAngle) => {
            let centerPt = await vjmap.Draw.actionDrawPoint(map, {
            });
            if (centerPt.cancel) {
                return ;// 取消操作
            }
            let center = map.fromLngLat(centerPt.features[0].geometry.coordinates);
        
            let ellipse;
            if (isFill) {
                ellipse = new vjmap.EllipseFill({
                    center: center,
                    majorAxisRadius: 0,
                    minorAxisRadius: 0,
                    fillColor: 'green',
                    fillOpacity: 0.8,
                    fillOutlineColor: "#f00"
                });
            } else {
                ellipse = new vjmap.EllipseEdge({
                    center: center,
                    majorAxisRadius: 0,
                    minorAxisRadius: 0,
                    lineColor: 'red',
                    lineWidth: 3
                });
            }
            ellipse.addTo(map);
        
        
            let ellipseMajorAxisPt = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    const co = map.fromLngLat(e.lnglat);
                    ellipse.setMinorAxisRadius(center.distanceTo(co));
                    ellipse.setMajorAxisRadius(center.distanceTo(co));
                }
            });
            if (ellipseMajorAxisPt.cancel) {
                ellipse.remove()
                return ;// 取消操作
            }
        
            let ellipseMinorAxisPt = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    const co = map.fromLngLat(e.lnglat);
                    ellipse.setMinorAxisRadius(center.distanceTo(co));
                }
            });
            if (ellipseMinorAxisPt.cancel) {
                ellipse.remove()
                return ;// 取消操作
            }
        
            if (isSetAngle) {
                let ellipseStartPt = await vjmap.Draw.actionDrawPoint(map, {
                    updatecoordinate: (e) => {
                        if (!e.lnglat) return;
                        const co = map.fromLngLat(e.lnglat);
                        ellipse.setStartAngle(vjmap.radiansToDegrees(co.angleTo(center)));
                    }
                });
                if (ellipseStartPt.cancel) {
                    ellipse.remove()
                    return ;// 取消操作
                }
        
                let ellipseEndPt = await vjmap.Draw.actionDrawPoint(map, {
                    updatecoordinate: (e) => {
                        if (!e.lnglat) return;
                        const co = map.fromLngLat(e.lnglat);
                        ellipse.setEndAngle(vjmap.radiansToDegrees(co.angleTo(center)));
                    }
                });
                if (ellipseEndPt.cancel) {
                    ellipse.remove()
                    return ;// 取消操作
                }
            }
        
        
        // 下面指定旋转角度
        // 先获取所有椭圆的点，然后围绕椭圆圆心旋转一定角度
        // 获取之前椭圆的点
            let data = ellipse.getData();
            let ellipseRotatePt = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    // 然后围绕椭圆圆心旋转一定角度
                    const co = map.fromLngLat(e.lnglat);
                    let angle = co.angleTo(center);
                    let newData = vjmap.cloneDeep(data);
                    let coordinates;
                    if (isFill) {
                        coordinates = newData.features[0].geometry.coordinates[0];
                    } else {
                        coordinates = newData.features[0].geometry.coordinates;
                    }
                    for(let i = 0; i < coordinates.length; i++) {
                        let pt = map.fromLngLat(coordinates[i]);
                        pt = pt.roateAround(angle, center);
                        pt = map.toLngLat(pt);
                        coordinates[i] = pt;//修改原来的值
                    }
                    ellipse.setData(newData);
                }
            });
            if (ellipseRotatePt.cancel) {
                ellipse.remove()
                return ;// 取消操作
            }
        
        
        }
        
        // 绘制填充椭圆
        const drawEllipseFill = ()=> {
            drawEllipse(true)
        }
        // 绘制椭圆
        const drawEllipseEdge = ()=> {
            drawEllipse(false)
        }
        
        // drawEllipseFillArc
        const drawEllipseFillArc = ()=> {
            drawEllipse(true, true)
        }
        // 绘制椭圆弧
        const drawEllipseArc = ()=> {
            drawEllipse(false, true)
        }
        
        /**
         * 计算点B在射线上的最近点
         * @param {Object} A - 射线的初始点，包含x和y属性
         * @param {number} theta - 射线的角度，以弧度为单位
         * @param {Object} B - 目标点，包含x和y属性
         * @returns {Object} 射线上离B最近的点，包含x和y属性
         */
        function closestPointOnRay(A, theta, B) {
            // 射线的方向向量
            const d = {
                x: Math.cos(theta),
                y: Math.sin(theta)
            };
        
            // 向量 AB
            const AB = {
                x: B.x - A.x,
                y: B.y - A.y
            };
        
            // 投影长度 (AB在d上的投影)
            const projectionLength = (AB.x * d.x + AB.y * d.y) / (d.x * d.x + d.y * d.y);
        
            // 如果投影长度为负，表示最近点是射线的起点A
            if (projectionLength < 0) {
                return { x: A.x, y: A.y };
            }
        
            // 最近点的坐标
            const closestPoint = {
                x: A.x + projectionLength * d.x,
                y: A.y + projectionLength * d.y
            };
        
            return closestPoint;
        }
        
        
        const drawAngleLine = async () => {
            const lineAngle = 30;//线角度为30度
        
            // 先绘制第一个点
            let firstPoint = await vjmap.Draw.actionDrawPoint(map);
            if (firstPoint.cancel) {
                return ;// 取消操作
            }
            // 获取绘制的点的坐标
            let point = map.fromLngLat(firstPoint.features[0].geometry.coordinates);
            let co1 = [point.x, point.y];
            let co2 = [point.x, point.y];
            let drawLine = new vjmap.Polyline({
                data: map.toLngLat([co1, co2]),
                lineColor: "yellow",
                lineWidth: 2
            });
            drawLine.addTo(map);
        
            // 可以把第一个点加入捕捉点中
            let snapObj = {}
            snapObj.features = []
            snapObj.features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: map.toLngLat(point)
                }
            })
        
            // 绘制第二个点
            let secondPoint = await vjmap.Draw.actionDrawPoint(map, {
                api: {
                    getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    const co = map.fromLngLat(e.lnglat);
                    let closeedPoint = closestPointOnRay(point, vjmap.degToRad(lineAngle), co);
                    // 修改临时线坐标
                    drawLine.setData(map.toLngLat([point, closeedPoint]))
                }
            })
            if (secondPoint.cancel) {
                drawLine.remove(); // 移除
                return ;// 取消操作
            }
        }
        
        
        // 先绘制一条线，以后的线按前一条线的指定角度进行绘制
        const drawIncAngleLine = async () => {
            let angle = 30;//角度
        
            let isDrawing = false;
            let line = await vjmap.Draw.actionDrawLineSting(map, {
                api: {
                    // getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    isDrawing = true;
        
                    if (e.state.line.coordinates.length >= 3) {
                        // 当第三点及以上时需根据指定角度来绘制
                        let points = map.fromLngLat(e.state.line.coordinates);
                        let startPoint = points[points.length - 3];
                        let endPoint = points[points.length - 2];
        
                        // 获取前两个点组成的线的角度
                        let lineAngle = vjmap.geoPoint(startPoint).angleTo(vjmap.geoPoint(endPoint))
                        const co = map.fromLngLat(e.lnglat);
                        // 在之前的线上偏移设置的角度
                        let closedPoint = closestPointOnRay(endPoint, lineAngle + vjmap.degToRad(angle), co);
                        e.state.line.coordinates[ e.state.line.coordinates.length - 1] = map.toLngLat(closedPoint)
        
                        if (e.isClick) {
                            // 如果是点击时，需要设置为计算出的坐标
                            let closedLngLat = map.toLngLat(closedPoint)
                            e.state.snappedLng = closedLngLat[0];
                            e.state.snappedLat = closedLngLat[1]
                        }
                    }
        
                },
                contextMenu: (e) => {
                    new vjmap.ContextMenu({
                        event: e.event.originalEvent,
                        theme: "dark", //light
                        width: "250px",
                        items: [
                            {
                                label: '确认',
                                onClick: () => {
                                    // 给地图发送Enter键消息即可取消，模拟按Enter键
                                    map.fire("keyup", { keyCode: 13 })
                                    setPopupText("", map);
                                }
                            },
                            {
                                label: '取消',
                                onClick: () => {
                                    // 给地图发送ESC键消息即可取消，模拟按ESC键
                                    map.fire("keyup", { keyCode: 27 })
                                    setPopupText("", map);
                                }
                            }, {
                                label: '删除上一个点',
                                onClick: () => {
                                    // 给地图发送退格键Backspace消息即可删除上一个点，模拟按Backspace键
                                    map.fire("keyup", { keyCode: 8 })
                                }
                            }, {
                                label: '结束',
                                onClick: () => {
                                    // 给地图发送ESC键消息即可取消，模拟按ESC键
                                    map.fire("keyup", { keyCode: 27 })
                                    isDrawing = false;
                                    setPopupText("", map);
                                }
                            }
                        ]
                    });
        
                }
            });
        
            if (line.cancel) {
                return // 取消操作
            }
        
            let color = vjmap.randomColor();
            let polyline = new vjmap.Polyline({
                data: line.features[0].geometry.coordinates,
                lineColor: color,
                lineWidth: 2
            });
            polyline.addTo(map);
        }
        // UI界面
        const App = () => {
            return (
                <div className="info" style={{width:"60px", right: "5px"}}>
                    <div className="input-item">
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseFill()}>绘制填充椭圆</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseEdge()}>绘制椭圆</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseFillArc()}>绘制填充椭圆弧</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseArc()}>绘制椭圆弧</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawAngleLine()}>绘制指定角的线</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawIncAngleLine()}>绘制有夹角的线</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => cancelDraw()}>取消绘制</button>
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