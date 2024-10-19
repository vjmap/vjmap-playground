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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/02threeLayerWall
        // --立体光墙--
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
            zoom: 3,
            pitch: 80,
            antialias: true,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.5);
        
        
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
        
        let query = await svc.conditionQueryFeature({
            condition: `objectid='4AB'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
            // 查询所有文字(包括单行文本，多行文本、块注记文字，属性文字) 具体类型数字参考文档"服务端条件查询和表达式查询-支持的cad实体类型"
            // condition: `name='12' or name='13' or name='26' or name='27'`,
            fields: ""
        })
        if (query.error) {
            message.error(query.error)
        } else {
            if (query.recordCount > 0) {
                let points = query.result[0].points; // 得到点坐标序列
                let pts = points.split(";").map(p => vjmap.GeoPoint.fromString(p));
                // 闭合
                pts.push(pts[0]);
                threeContext.wall(pts)
            }
        }
        
        let walls = []
        const drawWalls = async () => {
            // 开始绘制一个多边形
            let drawPoly = await vjmap.Draw.actionDrawPolygon(map, {
            });
            if (drawPoly.cancel) {
                return ;// 取消操作
            }
            let pts = map.fromLngLat(drawPoly.features[0].geometry.coordinates);
            pts = pts[0].map(e => [e.x, e.y])
            let wall = threeContext.wall(pts, {
                color1: 0xFF00FF,
                color2: 0xFFFF00
            })
            walls.push(wall)
        }
        
        const removeWalls = () => {
            for(let w of walls) {
                w.stop();
                threeContext.remove(w);
            }
            walls = []
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>设置</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => drawWalls()}>绘制光墙</button>
                                <button className="btn" onClick={() => removeWalls()}>移除绘制的光墙</button>
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