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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/05animationTraffic
        // --交通路况动画图层--
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
        for(let i = 1;  i <= 10; i++) {
            let mapBounds = map.getGeoBounds(i / 30.0);
            let points = mapBounds.toPointArray();
            points.push(points[0]); // 闭合
            geoDatas.push({
                points: map.toLngLat(points),
                id: i,
                properties: {
                    lineWidth: 4 + i * 1,
                    name: `${i}环`,
                    status: i < 3 ? "red" : (vjmap.randInt(0, 1) === 0 ? "yellow" : "green")
                }
            });
        }
        
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
        
        // 如果每条线路单独绘制，线路多的话效率会很低，所以需要把相同特殊的路线先创建出来，然后同样的路线批量绘制。这样性能会很好。
        const createTrafficRoute = async (color, speed) => {
            let img = await loadUrlImage(env.assetsPath + `images/${color}.png`);
            // 通过加载图片，来创建动画图片集
            let createImagesOptions = {
                canvasWidth: img.width,
                canvasHeight: img.height * 3,
                frameCount: 4,
                fillColor: "#1E5AA4",
                draw: (context, width, height, opts) => {
                    // 绘制图片回调，只需绘制第一帧的内容 context为canvas上下文，width,height为图片宽高，opts为上面传入的选项值
                    // 填充背景色
                    if (opts.fillColor) {
                        context.fillStyle = opts.fillColor;
                        context.fillRect(0, 0, width, height );
                    }
                    // 图片居中显示
                    context.drawImage(img, 0, 0, img.width, img.height, 0, height / 2.0 - img.height / 2.0, width, img.height)
                }
            };
            let animateImages = vjmap.createAnimateImages(createImagesOptions);
            // 数据先设置为空，后面根据不同的路况数据，再根据数据内容
            let animateLine = vjmap.createAnimateLineLayer(map, [], {
                animateImages,
                lineWidth: ['get', 'lineWidth'],
                lineOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
                isHoverPointer: true,
                isHoverFeatureState: true,
                speed
            });
            animateLine.polyline.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}`))
            animateLine.polyline.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
            return animateLine;
        }
        let greenRoute = await createTrafficRoute("green", 4); // 绿色线路
        let yellowRoute = await createTrafficRoute("yellow", 1); // 黄色线路
        let redRoute = await createTrafficRoute("red", 0.5); //红色线路
        
        // 设置数据
        const setRouteData = ()=> {
            greenRoute.updateData(geoDatas.filter(d => d.properties.status === "green"));
            yellowRoute.updateData(geoDatas.filter(d => d.properties.status === "yellow"));
            redRoute.updateData(geoDatas.filter(d => d.properties.status === "red"));
        }
        setRouteData();
        
        // 模拟路况数据变化
        setInterval(()=> {
            geoDatas.forEach(d => d.properties.status = vjmap.randInt(0, 2) === 0 ? "red" : (vjmap.randInt(0, 1) === 0 ? "yellow" : "green"));
            setRouteData();
        }, 3000)
        
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