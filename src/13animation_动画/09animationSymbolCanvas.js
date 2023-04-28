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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/09animationSymbolCanvas
        // --点符号动画[画布每帧绘制生成动画]--
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
        let mapBounds = map.getGeoBounds(0.4);
        let geoDatas = mapBounds.randomGeoJsonPointCollection(50, 1, 1, (index)=> {
            return {
                id: index,
                name: `名称:${index}`
            }
        })
        
        
        let createImagesOptions = {
            canvasWidth: 40,
            canvasHeight: 40,
            frameCount: 10, // 总共十帧
            outerCircleFillStyle: vjmap.randomColor(), // 外部圆的填充样式颜色
            innerCircleStrokeStyle: vjmap.randomColor(), // 内部圆的边框样式颜色
            innerCircleFillStyle: vjmap.randomColor(), // 内部圆的填充样式颜色
            drawFrame: (context, canvasWidth, canvasHeight, frameCount, curFrame, options) => {
                // 每帧回调，需要根据每帧绘制不同的图片，生成动画
                let t = curFrame / frameCount;
                const radius = (canvasWidth / 2) * 0.3;
                const outerRadius = (canvasWidth / 2) * 0.7 * t + radius;
        
                context.clearRect(0, 0, canvasWidth, canvasHeight);
                context.beginPath();
                context.arc(
                    canvasWidth / 2,
                    canvasHeight / 2,
                    outerRadius,
                    0,
                    Math.PI * 2
                );
                let outerCircleFillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
                if (options.outerCircleFillStyle) {
                    let opacity = Math.floor((1 - t) * 256);
                    outerCircleFillStyle = options.outerCircleFillStyle + opacity.toString(16).padStart(2, '0')
                }
                context.fillStyle = outerCircleFillStyle;
                context.fill();
        
                // draw inner circle
                context.beginPath();
                context.arc(
                    canvasWidth / 2,
                    canvasHeight / 2,
                    radius,
                    0,
                    Math.PI * 2
                );
                context.fillStyle = options.innerCircleFillStyle || 'rgba(255, 100, 100, 1)';
                context.strokeStyle = options.innerCircleStrokeStyle || 'white';
                context.lineWidth = 2
                context.fill();
                context.stroke();
            }
        }
        let animateImages = vjmap.createAnimateImages(createImagesOptions);
        let animateSymbol = vjmap.createAnimateSymbolLayer(map, map.toLngLat(geoDatas), {
            animateImages,
            iconAllowOverlap: true,
            iconAnchor: "center",
            iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
            isHoverPointer: true,
            isHoverFeatureState: true,
            speed: 1,
        });
        animateSymbol.symbol.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}`))
        animateSymbol.symbol.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
        
        let speed = 1.0;
        
        const changeAnimateSymbol = (action) => {
            if (!animateSymbol) return;
            if (action === "stopAnimation") {
                // 停止动画
                animateSymbol.stopAnimation();
            } else if (action === "startAnimation") {
                // 停止动画
                animateSymbol.startAnimation();
            } else if (action === "setSpeedFaster") {
                // 速度变快
                speed *= 2;
                animateSymbol.setSpeed(speed);
            } else if (action === "setSpeedSlower") {
                // 速度变慢
                speed /= 2;
                animateSymbol.setSpeed(speed);
            }  else if (action === "setColor") {
                // 设置颜色
                createImagesOptions = {
                    ...createImagesOptions,
                    outerCircleFillStyle: vjmap.randomColor(), // 外部圆的填充样式颜色
                    innerCircleStrokeStyle: vjmap.randomColor(), // 内部圆的边框样式颜色
                    innerCircleFillStyle: vjmap.randomColor(), // 内部圆的填充样式颜色
                }
                animateSymbol.updateImages(vjmap.createAnimateImages(createImagesOptions));
            } else if (action === "setData") {
                let data = mapBounds.randomGeoJsonPointCollection(vjmap.randInt(20, 100), 1, 1, (index)=> {
                    return {
                        id: index,
                        name: `名称:${index}`
                    }
                })
                // 修改坐标
                animateSymbol.updateData(map.toLngLat(data))
            }else if (action === "remove") {
                // 删除
                animateSymbol.remove()
                animateSymbol = null;
            }
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateSymbol("stopAnimation")}>停止动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateSymbol("startAnimation")}>开始动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateSymbol("setSpeedFaster")}>速度变快
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateSymbol("setSpeedSlower")}>速度变慢
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateSymbol("setColor")}>修改颜色
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateSymbol("setData")}>修改坐标
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateSymbol("remove")}>删除
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