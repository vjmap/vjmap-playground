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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/06animationFillBubble
        // --填充气泡动画效果[Canvas绘制]--
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
        let mapBounds2 = map.getGeoBounds(0.2);
        const points = mapBounds2.toPointArray();
        const w = mapBounds2.width() / 2;
        // 里面根据四个顶点，生成四个小的矩形，用于生成四个小孔
        for(let i = 0; i < points.length; i++) {
            const path = [];
            path.push(...vjmap.GeoBounds.fromCenterWH(points[i], w).toPointArray());
            geoDatas.push({
                points: map.toLngLat(path),
                id: i,
                properties: {
                    lineWidth: 4 + i * 2,
                    name: `${i + 1}个`
                }
            });
        }
        
        
        //  通过绘制canvas，创建动画图片集
        let createImagesOptions = {
            canvasWidth: 64,
            canvasHeight: 64,
            frameCount: 4,
            directionReverse: true,
            fillColor: "", // 背景透明
            bubbleCountMin: 1, // 气泡的最小个数
            bubbleCountMax: 4, // 气泡的最大个数
            bubbleRadiusMin: 8, // 气泡的最小半径
            bubbleRadiusMax: 16, // 气泡的最大半径
            yAxis: true, // 动画方向改成向Y方向移动
            draw: (context, width, height, opts) => {
                // 绘制图片回调，只需绘制第一帧的内容 context为canvas上下文，width,height为图片宽高，opts为上面传入的选项值
                // 填充背景色
                if (opts.fillColor) {
                    context.fillStyle = opts.fillColor;
                    context.fillRect(0, 0, width, height );
                }
                // 下面绘制气泡
                let bubbleCount = vjmap.randInt(opts.bubbleCountMin, opts.bubbleCountMax);
                for(let b = 0; b < bubbleCount; b++) {
                    let r = vjmap.randInt(opts.bubbleRadiusMin, opts.bubbleRadiusMax);
                    let x  = vjmap.randInt(r, width - r);
                    let y = vjmap.randInt(r, height - r);
                    let gradient = context.createRadialGradient(x, y, 0, x, y, r);
                    gradient.addColorStop(0, vjmap.randomColor() + "aa"); // 后面加个透明度
                    gradient.addColorStop(1, vjmap.randomColor() + "aa");
                    context.beginPath();
                    context.fillStyle = gradient;
                    context.arc(x, y, r, 0, 2 * Math.PI)
                    context.fill()
                }
        
            }
        };
        let animateImages = vjmap.createAnimateImages(createImagesOptions);
        let animateFill = vjmap.createAnimateFillLayer(map, geoDatas, {
            animateImages,
            fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
            isHoverPointer: true,
            isHoverFeatureState: true,
            speed: 1,
        });
        animateFill.polygon.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}`))
        animateFill.polygon.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
        
        let speed = 1.0;
        let dirReverse = false;
        let oldData = vjmap.cloneDeep(geoDatas);
        let bSetData = false;
        const changeAnimateFill = (action) => {
            if (!animateFill) return;
            if (action === "stopAnimation") {
                // 停止动画
                animateFill.stopAnimation();
            } else if (action === "startAnimation") {
                // 停止动画
                animateFill.startAnimation();
            } else if (action === "setSpeedFaster") {
                // 速度变快
                speed *= 2;
                animateFill.setSpeed(speed);
            } else if (action === "setSpeedSlower") {
                // 速度变慢
                speed /= 2;
                animateFill.setSpeed(speed);
            } else if (action === "directionReverse") {
                // 方向反向
                dirReverse = !dirReverse;
                createImagesOptions = {
                    ...createImagesOptions,
                    directionReverse: dirReverse
                }
                animateFill.updateImages(vjmap.createAnimateImages(createImagesOptions));
            } else if (action === "setColor") {
                // 设置颜色
                createImagesOptions = {
                    ...createImagesOptions,
                    fillColor:  vjmap.randInt(0, 5) === 0 ? "" : vjmap.randomColor(), // 为空的话，表示是透明，不绘制
                    bubbleCountMin: vjmap.randInt(1, 4), // 气泡的最小个数
                    bubbleCountMax: vjmap.randInt(4, 8), // 气泡的最大个数
                    bubbleRadiusMin: vjmap.randInt(4, 8), // 气泡的最小半径
                    bubbleRadiusMax: vjmap.randInt(8, 16), // 气泡的最大半径
                }
                animateFill.updateImages(vjmap.createAnimateImages(createImagesOptions));
            } else if (action === "setData") {
                let data = vjmap.cloneDeep(oldData);
                bSetData = !bSetData;
                for(let i = 0; i < data.length; i++) {
                    // 取前四个坐标
                    data[i].points = bSetData ? data[i].points.slice(0, 3) : data[i].points.slice(0, 4)
                }
                // 随机删除一个
                data.splice(vjmap.randInt(0, data.length - 1), 1)
        
                // 修改坐标
                animateFill.updateData(data)
            } else if (action === "remove") {
                // 删除
                animateFill.remove()
                animateFill = null;
            }
        }
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateFill("stopAnimation")}>停止动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateFill("startAnimation")}>开始动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateFill("setSpeedFaster")}>速度变快
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateFill("setSpeedSlower")}>速度变慢
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateFill("directionReverse")}>方向反向
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateFill("setColor")}>修改颜色
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateFill("setData")}>修改坐标
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => changeAnimateFill("remove")}>删除
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