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
        // --交互式绘制椭圆(弧)--
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
        
        
        
        // UI界面
        const App = () => {
            return (
                <div className="info" style={{width:"60px", right: "5px"}}>
                    <div className="input-item">
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseFill()}>绘制填充椭圆</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseEdge()}>绘制椭圆</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseFillArc()}>绘制填充椭圆弧</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseArc()}>绘制椭圆弧</button>
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