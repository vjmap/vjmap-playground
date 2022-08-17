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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/03drawInput
        // --绘制坐标可直接输入或鼠标拾取--
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
        
        let styleId;
        let preCoord; // 上一点的坐标点
        let curCoord; // 当前的坐标点
        const drawLine = async () => {
            await vjmap.Draw.actionDrawLineSting(map, {
                statusChange: e => {
                    if (e.isStart) {
                        // 开始绘制, 这时可以把输入坐标的UI界面显示出来
                        styleId = e.styleId;
                    } else if (e.isEnd) {
                        // 结束绘制, 这时可以把输入坐标的UI界面关闭
                    }
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    const co = map.fromLngLat(e.feature.coordinates[e.feature.coordinates.length - 1]);
                    curCoord = co;
                    if (e.feature.coordinates.length > 1) {
                        preCoord = map.fromLngLat(e.feature.coordinates[e.feature.coordinates.length - 2]);
                    }
                    // 在ui界面响应这事件
                    map.fire("draw_updatecoordinate", {
                        preCoord,
                        curCoord,
                        styleId
                    })
                }
            })
        }
        
        
        drawLine()
        
        const inputCoord = (x, y) => {
            // 只需给此样式id发送一个输入点击事件，把要输入的坐标值传过去就可以了
            map.fire("draw.input.click", {
                lngLat: map.toLngLat([x, y]),
                styleId: styleId
            })
        }
        
        const calcCoord = (dist, angle) => {
            if (!dist || !preCoord) return
            let x = preCoord.x + dist * Math.cos(angle * Math.PI / 180.0);
            let y = preCoord.y + dist * Math.sin(angle * Math.PI / 180.0);
            // 只需给此样式id发送一个输入点击事件，把要输入的坐标值传过去就可以了
            map.fire("draw.input.click", {
                lngLat: map.toLngLat([x, y]),
                styleId: styleId
            })
        }
        
        // UI界面
        const { useRef } = React
        const App = () => {
        
            const lastX = useRef(null);
            const lastY = useRef(null);
            const geoX = useRef(null);
            const geoY = useRef(null);
            const dist = useRef(null);
            const angle = useRef(null);
        
            map.on("draw_updatecoordinate", ({ preCoord,  curCoord,  styleId}) => {
                geoX.current.value = curCoord.x
                geoY.current.value = curCoord.y
                if (preCoord) {
                    lastX.current.value = preCoord.x
                    lastY.current.value = preCoord.y
        
                    dist.current.value = curCoord.distanceTo(preCoord)
                    angle.current.value = curCoord.angleTo(preCoord) * 180 / Math.PI
                }
            })
            return (
                <div>
                    <div className="input-card w270">
                        <div className="input-item border">
                            前一点坐标X：<input type="text" ref={lastX} defaultValue="0" readOnly
                                          className="inp"/>
                        </div>
                        <div className="input-item border">
                            前一点坐标Y：<input type="text" ref={lastY} defaultValue="0" readOnly
                                          className="inp"/>
                        </div>
        
                        <div className="input-item border">
                            坐标X：<input type="text" ref={geoX} defaultValue="0"
                                       className="inp"/>
                        </div>
                        <div className="input-item border">
                            坐标Y：<input type="text" ref={geoY} defaultValue="0"
                                       className="inp"/>
                        </div>
                        <div className="input-item">
                            <button id="moving_btn" className="btn btn-full mr0" onClick={() => inputCoord(+geoX.current.value, +geoY.current.value)}>直接输入坐标</button>
                        </div>
                        <div className="input-item border">
                            距离：
                            <input type="text" ref={dist} defaultValue="0" className="inp"/>
                        </div>
                        <div className="input-item border">
                            方位：
                            <input type="text" ref={angle} defaultValue="0" className="inp"/>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => calcCoord(+dist.current.value, +angle.current.value)}>根据距离方向生成坐标</button>
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