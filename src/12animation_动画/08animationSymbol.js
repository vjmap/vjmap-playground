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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/08animationSymbol
        // --点符号人行走动画[加载图片创建]--
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
        
        const loadUrlImage = (src) => {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.src = src;
                image.onload = () => {
                    resolve(image)
                }
                image.onerror = ()=> {
                    reject(`load image ${src} error`)
                }
            })
        }
        let img = await loadUrlImage(env.assetsPath + "images/walk.png");
        
        // 从动画帧图片集中创建动画图片集
        let animateImages = vjmap.createAnimateImages({
            fromImage: img, // 来源的图片
            spriteWidth: 146, // 每帧子图片的宽,因为这个图片总宽为292，每行有2个子图片，所以为292/2=146
            spriteHeight: 345,// 每帧子图片的高,因为这个图片总宽为690，每列有2个子图片，所以为690/2=345
            canvasWidth: 40, // 可以每帧的图片缩放至这个宽度
            canvasHeight: 95 // 同比例进行缩放 345 * 40 / 146
        });
        let animateSymbol = vjmap.createAnimateSymbolLayer(map, map.toLngLat(geoDatas), {
            animateImages,
            iconAllowOverlap: true,
            iconAnchor: "bottom",
            iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
            isHoverPointer: true,
            isHoverFeatureState: true,
            speed: 1,
        });
        animateSymbol.symbol.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}`))
        animateSymbol.symbol.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
        
        let speed = 1.0;
        let isWalking = false;
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
            }
            else if (action === "setData") {
                if (isWalking) return;
                isWalking = true;
                animateSymbol.startAnimation();
                // 更新坐标
                let oldDatas= vjmap.cloneDeep(map.fromLngLat(map.getSourceData(animateSymbol.sourceId)));
                let interpolateList = []
                for(let i = 0; i < oldDatas.features.length; i++) {
                    let co = oldDatas.features[i].geometry.coordinates;
                    // 新的坐标,随机走几个像素
                    let moveX =  map.pixelToGeoLength(vjmap.randInt(50, 200), map.getZoom()) ;
                    let moveY =  map.pixelToGeoLength(vjmap.randInt(50, 200), map.getZoom())  ;
                    let newCo = [co[0] + moveX, co[1] ];
                    let mapProgressToValues = vjmap.interpolate(
                        [0, 1],
                        [co, newCo]
                    )
                    interpolateList.push(mapProgressToValues)
                }
                // 走路的动画
                vjmap.createAnimation({
                    from: 0,
                    to: 1,
                    duration: 5000,
                    ease:vjmap.linear, //线性
                    onUpdate: latest => {
                        for(let i = 0; i < oldDatas.features.length; i++) {
                            oldDatas.features[i].geometry.coordinates = interpolateList[i](latest) // 根据之前保存的插值函数和当前比例计算出当前的坐标点
                        }
                        // 修改坐标
                        animateSymbol.updateData(map.toLngLat(oldDatas))
                    },
                    onComplete: (e) => {
                        animateSymbol.stopAnimation();// 走路完成，停止动画
                        isWalking = false;
                    },
                    onStop: () => {
                        animateSymbol.stopAnimation();// 走路完成，停止动画
                        isWalking = false;
                    }
                })
            }
            else if (action === "remove") {
                // 删除
                animateSymbol.remove()
                animateSymbol = null;
            }
            // 更新图片请参考动画线图层或填充图层的示例，用法一样
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
                                    onClick={() => changeAnimateSymbol("setData")}>开始行走
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