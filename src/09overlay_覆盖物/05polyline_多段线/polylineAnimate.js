const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polyline/polylineAnimate
        // --路径动画--
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
        map.fitMapBounds();
        
        let mapBounds = map.getGeoBounds(0.3);
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const routePath = [];
        // 随机加几个地图范围内的点
        routePath.push(mapBounds.min);
        routePath.push(mapBounds.center());
        routePath.push(vjmap.geoPoint([mapBounds.max.x, mapBounds.min.y]));
        routePath.push(mapBounds.max);
        routePath.push(vjmap.geoPoint([mapBounds.min.x, mapBounds.max.y]));
        routePath.push(mapBounds.min);
        
        // 车图标
        await map.loadImageEx("carIcon", env.assetsPath + "images/car.png");
        // 路径线
        let routeLine = new vjmap.PolylineArrow({
            path: map.toLngLat(routePath),
            lineWidth: 10,
            showDir: true,
            lineColor: '#009EFF'
        });
        routeLine.addTo(map);
        
        // 实时动画轨迹线
        let realRoute = new vjmap.PolylineArrow({
            path: map.toLngLat(routePath),
            lineWidth: 10,
            showDir: true,
            showBorder: true,
            borderColor: "#f00",
            lineColor: '#FF9900'
        });
        realRoute.addTo(map);
        
        // 车的数据源和图层
        map.addGeoJSONSource("carSource");
        map.addSymbolLayer("carAnimate", "carSource", {
            iconImage: 'carIcon',
            iconSize: 0.5,
            iconRotate: ['get', 'bearing'],
            iconRotationAlignment: 'map',
            iconAllowOverlap: true,
            iconIgnorePlacement: true
        })
        
        // 线动画
        let curFps = 10;
        
        // 显示位置提供框
        // 创建一个缺省的
        let markerEle = new vjmap.RotatingTextBorderMarker({
            lngLat: [0,0],
            text: ""
        }, {})
        markerEle.setMarkersWidth(240);
        let marker;
        
        const anim = realRoute.animate(100, curFps, true, status => console.log(status), (status, context) => {
            if (status !== vjmap.FrameAnimationStatus.Run) return
            // 动画每帧回调，在这里可以实时改变车的位置
            // 获取角度
            const angle = vjmap.geoPoint(context.endPnt).angleTo(vjmap.geoPoint(context.startPnt));
            // 生成新的数据
            const carGeoJson = vjmap.createPointGeoJson({
                point: context.endPnt,
                properties: { bearing: vjmap.radToDeg(-angle)}
            });
            // 更新车的数据
            map.setData("carSource", carGeoJson); // 更新位置
        
            // 修改位置提供框marker的坐标值和显示值
            const co = map.fromLngLat(context.endPnt);
            const text = `当前坐标:${parseInt(co.x)},${parseInt(co.x)}`;
            markerEle.setMarkersText(text);
            if (!marker) {
                // 第一次创建
                marker = markerEle.createMarker();
                marker.setLngLat(context.endPnt);
                marker.addTo(map);
                marker.setOffset([0, -50])
            } else {
                marker.setLngLat(context.endPnt);
            }
        })
        
        // 删除动画
        const removeAnim = ()=> {
            // 先停止
            anim.stop();
            routeLine.remove();// 路径线删除
            realRoute.remove();// 动画线删除
            map.removeSourceEx("carSource"); // 车数据源和图层都删除
            if (marker) marker.remove(); // 标识删除
        }
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>动画控制</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => anim.start() }>开始动画</button>
                        <button className="btn" onClick={ () => anim.pause() }>暂停动画</button>
                        <button className="btn" onClick={ () => { curFps *= 2; anim.changeFps(curFps)} }>速度变快</button>
                        <button className="btn" onClick={ () => { curFps /= 2; anim.changeFps(curFps)} }>速度变慢</button>
                        <button className="btn" onClick={ () => anim.stop() }>结束动画</button>
                        <button className="btn" onClick={ () => removeAnim() }>删除动画</button>
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