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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/07threeLayerflyline
        // --飞行线--
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
            zoom: 2,
            pitch: 60,
            antialias: true,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        let len = mapBounds.width() / 20;
        const center = map.getCenter();
        
        if (typeof vjThree !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/plugins/vjthree.min.js"
            }, {
                src: "../../js/plugins/vjthree.min.css"
            }])
        }
        
        const threeContext = map.createThreeJsContext({
            defaultLights: true,
            enableSelectingObjects: false
        });
        map.addLayer(new vjmap.ThreeLayer({ context: threeContext }));
        
        let flylines= []
        const addflylines= () => {
            if (flylines.length > 0) return;
            for(let i = 0; i < 10; i++) {
                let pt = mapExtent.randomPoint();
                let pt2 = mapExtent.randomPoint();
                let mesh = threeContext.flyline({
                    source: {
                        x: pt.x,
                        y: pt.y,
                        z: 0
                    },
                    target: {
                        x: (i % 2 == 0) ? pt.x : pt2.x,
                        y: (i % 2 == 0) ? pt.y : pt2.y,
                        z: (i % 2 == 0) ? 500000: 0,
                    },
                    count: 1000,
                    range: 500,
                    height: (i % 2 == 0) ? 0: 300000,
                    color: vjmap.randomColor(),
                    color2: vjmap.randomColor(),
                    speed: 1,
                    size: 3,
                    opacity: 1.0,
                });
                flylines.push(mesh)
            }
        
        }
        addflylines();
        
        let marker = new vjmap.Marker();
        marker.setLngLat(map.getCenter());
        marker.addTo(map);
        
        const removeflylines= () => {
            if (flylines.length == 0) return;
            for (let c of flylines) {
                c.stop();
                threeContext.remove(c)
            }
            flylines= []
        }
        
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>设置</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => removeflylines()}>移除</button>
                                <button className="btn" onClick={() => addflylines()}>添加</button>
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