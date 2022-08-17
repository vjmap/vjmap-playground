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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationPolylineFlow
        // --线流动动画--
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
            pitch: 60, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.6);
        let geoLineDatas = [];
        let geoFlowLineDatas = [];
        
        let speed = mapBounds.width() / 10; // 假设速度为走完这段距离需要10秒
        
        for(let i = 0; i < 50; i++) {
            const path = mapBounds.randomPoints(2, 4);
            // 路径线
            geoLineDatas.push({
                points: map.toLngLat(path),
                properties: {
                    name: "line" + (i + 1),
                    color: vjmap.randomColor(),
                    length: vjmap.Math2D.lineDist(path), // 线的总长度
                }
            })
            // 动画线
            geoFlowLineDatas.push({
                points: [],
                properties: {
                    name: "flow_line" + (i + 1),
                    coordinates: path,// 把要全部绘制的点先保存起来
                    color: vjmap.randomColor()
                }
            })
        }
        
        let polylines = new vjmap.Polyline({
            data: geoLineDatas,
            lineColor: ['get', 'color'],
            lineWidth: 2
        });
        polylines.addTo(map);
        
        let flowPolylines = new vjmap.Polyline({
            data: geoFlowLineDatas,
            lineColor: ['get', 'color'],
            lineWidth: 2
        });
        flowPolylines.addTo(map);
        
        
        let startTime = new Date();
        let timeEqualMockCount = geoFlowLineDatas.length / 2;// 前一半的线，时间相等模拟，后一半的线模拟速度相等
        vjmap.createAnimation({
            from: 0,
            to: 1,
            repeat: Infinity,
            duration: 5000,
            ease:vjmap.linear, //线性
            onUpdate: latest => {
                let flowData = flowPolylines.getData();
                // 前一半的线，时间相等模拟
                for(let i = 0; i < timeEqualMockCount; i++) {
                    // 获取原来的全部点坐标
                    let coordinates = flowData.features[i].properties.coordinates;
                    const path = vjmap.interpolatePointsByRatio(coordinates, latest);
                    flowData.features[i].geometry.coordinates = map.toLngLat(path);
                }
                // 后一半的线，速度相等模拟
                let time = (new Date() - startTime) / 1000.0; // 总耗时时间(秒)
                for(let i = timeEqualMockCount; i < flowData.features.length; i++) {
                    let coordinates = flowData.features[i].properties.coordinates;
                    // 根据速度和时间，求出距离
                    let dist = time * speed;
                    dist = dist % flowData.features[i].properties.length;// 当前长度，取余，超过了，重新开始
                    let ratio = dist / flowData.features[i].properties.length;
                    const path = vjmap.interpolatePointsByRatio(coordinates, ratio);
                    flowData.features[i].geometry.coordinates = map.toLngLat(path);
                }
                flowPolylines.setData(flowData);
            }
        })
        
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => polylines.hide()}>隐藏路径线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => polylines.show()}>显示路径线
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