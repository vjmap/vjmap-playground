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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/04animationCanvas
        // --箭头线效果[Canvas绘制]--
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
                    lineWidth: 4 + i * 2,
                    name: `${i}环`
                }
            });
        }
        
        
        //  通过绘制canvas，创建动画图片集
        let createImagesOptions = {
            canvasWidth: 128,
            canvasHeight: 32,
            arrowWidth: 64,
            frameCount: 4,
            directionReverse: true,
            fillColor: "", // 背景透明
            gradientColor1: "#dbd410",
            gradientColor2: "#64fb8f",
            draw: (context, width, height, opts) => {
                // 绘制图片回调，只需绘制第一帧的内容 context为canvas上下文，width,height为图片宽高，opts为上面传入的选项值
                // 填充背景色
                if (opts.fillColor) {
                    context.fillStyle = opts.fillColor;
                    context.fillRect(0, 0, width, height );
                }
                // 下面绘制箭头
                let gradient = context.createLinearGradient(0, 0, width, 0);
                gradient.addColorStop(0, opts.gradientColor1);
                gradient.addColorStop(1, opts.gradientColor2);
        
                let arrowWidth = opts.arrowWidth || opts.canvasWidth / 2;
                context.beginPath();
                context.fillStyle = gradient;
                context.moveTo(2, height * 1 / 4);
                context.lineTo(2, height * 3 / 4);
                context.lineTo(arrowWidth * 3 / 4, height * 3 / 4);
                context.lineTo(arrowWidth * 3 / 4, height - 2);
                context.lineTo(arrowWidth, height / 2);
                context.lineTo(arrowWidth * 3 / 4, 2);
                context.lineTo(arrowWidth * 3 / 4, height * 1 / 4);
                context.lineTo(2, height * 1 / 4);
                context.fill()
            }
        };
        let animateImages = vjmap.createAnimateImages(createImagesOptions);
        let animateLine = vjmap.createAnimateLineLayer(map, geoDatas, {
            animateImages,
            lineWidth: ['get', 'lineWidth'],
            lineOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
            isHoverPointer: true,
            isHoverFeatureState: true,
            speed: 1,
        });
        animateLine.polyline.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}`))
        animateLine.polyline.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
        
        let speed = 1.0;
        let dirReverse = false;
        let oldData = vjmap.cloneDeep(geoDatas);
        let bSetData = false;
        const changeAnimateLine = (action) => {
            if (!animateLine) return;
            if (action === "stopAnimation") {
                // 停止动画
                animateLine.stopAnimation();
            } else if (action === "startAnimation") {
                // 停止动画
                animateLine.startAnimation();
            } else if (action === "setSpeedFaster") {
                // 速度变快
                speed *= 2;
                animateLine.setSpeed(speed);
            } else if (action === "setSpeedSlower") {
                // 速度变慢
                speed /= 2;
                animateLine.setSpeed(speed);
            } else if (action === "directionReverse") {
                // 方向反向
                dirReverse = !dirReverse;
                createImagesOptions = {
                    ...createImagesOptions,
                    directionReverse: dirReverse
                }
                animateLine.updateImages(vjmap.createAnimateImages(createImagesOptions));
            } else if (action === "setColor") {
                // 设置颜色
                createImagesOptions = {
                    ...createImagesOptions,
                    fillColor: vjmap.randInt(0, 5) === 0 ? "" : vjmap.randomColor(), // 为空的话，表示是透明，不绘制
                    gradientColor1:  vjmap.randomColor(),
                    gradientColor2:  vjmap.randomColor(),
                }
                animateLine.updateImages(vjmap.createAnimateImages(createImagesOptions));
            } else if (action === "setData") {
                let data = vjmap.cloneDeep(oldData);
                bSetData = !bSetData;
                for(let i = 0; i < data.length; i++) {
                    // 取前四个坐标
                    data[i].points = bSetData ? data[i].points.slice(0, 4) : data[i].points.slice(1, 5)
                }
                // 修改坐标
                animateLine.updateData(data)
            } else if (action === "remove") {
                // 删除
                animateLine.remove()
                animateLine = null;
            }
        }
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateLine("stopAnimation")}>停止动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateLine("startAnimation")}>开始动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateLine("setSpeedFaster")}>速度变快
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateLine("setSpeedSlower")}>速度变慢
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateLine("directionReverse")}>方向反向
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateLine("setColor")}>修改颜色
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateLine("setData")}>修改坐标
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateLine("remove")}>删除
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