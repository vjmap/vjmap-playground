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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/01animationArrow
        // --箭头动画图层--
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
            renderWorldCopies: false, // 不显示多屏地图
            doubleClickZoom: false
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        let geoDatas = [];
        for(let i = 1;  i <= 5; i++) {
            let mapBounds = map.getGeoBounds(i / 20.0);
            let points = mapBounds.toPointArray();
            points.push(points[0]); // 闭合
            geoDatas.push({
                points: map.toLngLat(points),
                id: i,
                properties: {
                    lineWidth: 8 + i * 2,
                    name: `${i}环`
                }
            });
        }
        
        let arrowAnimateLine = vjmap.createArrowAnimateLineLayer(map, geoDatas, {
            arrowFillColor: "#22B14C",
            arrowStrokeColor: "#fff",
            arrowStrokeWidth: 6,
            canvasWidth: 128,
            canvasHeight: 32,
            arrowWidth: 16,
            frameCount: 4,
            lineWidth: ['get', 'lineWidth'],
            lineOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        arrowAnimateLine.polyline.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}`))
        arrowAnimateLine.polyline.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
        
        let speed = 1.0;
        let dirReverse = false;
        let oldData = vjmap.cloneDeep(geoDatas);
        let bSetData = false;
        const changeArrowAnimateLine = (action) => {
            if (!arrowAnimateLine) return;
            if (action === "stopAnimation") {
                // 停止动画
                arrowAnimateLine.stopAnimation();
            } else if (action === "startAnimation") {
                // 停止动画
                arrowAnimateLine.startAnimation();
            } else if (action === "setSpeedFaster") {
                // 速度变快
                speed *= 2;
                arrowAnimateLine.setSpeed(speed);
            } else if (action === "setSpeedSlower") {
                // 速度变慢
                speed /= 2;
                arrowAnimateLine.setSpeed(speed);
            } else if (action === "directionReverse") {
                // 方向反向
                dirReverse = !dirReverse;
                arrowAnimateLine.updateImages(arrowAnimateLine.createAnimateImages({
                    directionReverse: dirReverse
                }));
            } else if (action === "setColor") {
                // 设置颜色
                arrowAnimateLine.updateImages(arrowAnimateLine.createAnimateImages({
                    arrowFillColor: vjmap.randomColor(),
                    arrowStrokeColor: vjmap.randomColor(),
                }));
            } else if (action === "setData") {
                let data = vjmap.cloneDeep(oldData);
                bSetData = !bSetData;
                for(let i = 0; i < data.length; i++) {
                    // 取前四个坐标
                    data[i].points = bSetData ? data[i].points.slice(0, 4) : data[i].points.slice(1, 5)
                }
                // 修改坐标
                arrowAnimateLine.updateData(data)
            } else if (action === "remove") {
                // 删除
                arrowAnimateLine.remove()
                arrowAnimateLine = null;
            }
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeArrowAnimateLine("stopAnimation")}>停止动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeArrowAnimateLine("startAnimation")}>开始动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeArrowAnimateLine("setSpeedFaster")}>速度变快
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeArrowAnimateLine("setSpeedSlower")}>速度变慢
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeArrowAnimateLine("directionReverse")}>方向反向
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeArrowAnimateLine("setColor")}>修改颜色
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeArrowAnimateLine("setData")}>修改坐标
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeArrowAnimateLine("remove")}>删除
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