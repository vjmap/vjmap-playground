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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolpath
        // --符号运动路径动画--
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 4,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        // map.fitMapBounds();
        
        await map.onLoad()
        
        // 加载图标
        await map.loadImageEx("man", env.assetsPath + `images/man.png`);
        await map.loadImageEx("girl", env.assetsPath + `images/girl.png`);
        
        
        const mapBounds = map.getGeoBounds(0.6);
        
        const pointCount = 1000;
        const geojson = {
            type: 'FeatureCollection',
            features: []
        }
        let dateUpdateTime = new Date()
        for (let i = 0; i < pointCount; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                type: "Feature",
                id: i,
                properties: {
                    name: `ID:${i + 1}`,
                    icon: i % 2 == 0 ? "man" : "girl",
                    prePoint: [pt.x, pt.y],
                    curPoint: [pt.x, pt.y],
                    dateUpdateTime: dateUpdateTime // 记录下数据更新时间
                },
                geometry: {
                    type: "Point",
                    coordinates: map.toLngLat(pt)
                }
            }
            geojson.features.push(data);
        }
        
        const symbols = new vjmap.Symbol({
            data: geojson,
            // 图标名来源于geojson属性中的icon字段
            iconImage: ['get', 'icon'],
            // 二级以下全部用icon1图标，二级以上用自己属性中的图标名
            //iconImage: ["step", ["zoom"], "icon1", 2, ['get', 'icon']],
            iconOffset: [0, -20],
            // 鼠标hover时设置透明度0.8,不悬浮1.0
            iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 1.0],
            textField: ['get', 'name'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 14,
            textColor: '#FFA0FD',
            textOffset: [0, 0.5],
            textAnchor: 'top',
            iconAllowOverlap: true,
            textAllowOverlap: true,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        symbols.addTo(map);
        symbols.clickLayer(e => {
            if (e.defaultPrevented) return; //  如果事件之前阻止了，则不再执行了
            if (map.logInfo) map.logInfo(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，的图标`)
            e.preventDefault(); // 阻止之后的事件执行
        })
        
        
        // 数据几秒一变化
        let dataChangePeriod = 1000; // 测试数据一秒一变化
        
        let isUseMakerDebug = true; // 是否使用marker调试位置
        let marker1 = [], marker2 = []
        // 模拟下次变化的数据
        const mockNextData = () => {
            let features = geojson.features;
            let dateUpdateTime = new Date()
            for (let i = 0; i < features.length; i++) {
                // 当前的坐标
                const pt = features[i].properties.curPoint;
                features[i].properties.prePoint = [pt[0], pt[1]]; // 把上一个点保存下
                // 模拟新的位置
                let mockMoveDist = mapBounds.width() / 30; // 模拟移动的距离
                pt[0] += mockMoveDist * Math.random() * (Math.random() > 0.5 ? 1 : -1);
                pt[1] += mockMoveDist * Math.random() * (Math.random() > 0.5 ? 1 : -1);
                features[i].properties.curPoint = [pt[0], pt[1]]; // 下一次移动的位置
                features[i].properties.dateUpdateTime = dateUpdateTime// 记录下数据更新时间
        
                if (isUseMakerDebug) {
                    if (i == 0) {
                        // 调试第一条数据
                        if (!marker1[i]) {
                            let clr = vjmap.randomColor()
                            marker1[i] = new vjmap.Marker().setLngLat([0, 0])
                            marker1[i].setColor(clr)
                            marker1[i].addTo(map);
                            marker1[i].getElement().style.opacity = 0.5
                            marker2[i] = new vjmap.Marker().setLngLat([0, 0])
                            marker2[i].setColor(clr)
                            marker2[i].addTo(map)
                        }
                        marker1[i].setLngLat(map.toLngLat(features[i].properties.prePoint))
                        marker2[i].setLngLat(map.toLngLat(features[i].properties.curPoint))
                    }
                }
            }
        }
        
        // 启动定时器模拟数据变化
        setInterval(mockNextData, dataChangePeriod)
        
        
        let isSetDataing = false; // 是否正在设置数据中
        let isWaitSourceLoaded = false; // 是否正在等待数据源加载完成
        // 当数据变化时
        map.on('data', async (event) => {
            // 如果当前symbol的数据变化了
            if (event.sourceId === symbols.sourceId) {
                if (isWaitSourceLoaded) return;
                isWaitSourceLoaded = true;
                // 等待数据变化是否完成
                await waitSourceLoaded();
                isWaitSourceLoaded = false;
                // 如果完成了，设置为数据完成标识
                isSetDataing = false;
            }
        });
        
        // 等待数据源加载完成
        const waitSourceLoaded = async () => {
            return new Promise((resolve) => {
                let tid = setInterval(() => {
                    // 如果数据源加载已完成
                    if (map.isSourceLoaded(symbols.sourceId)) {
                        // 清除定时器，返回
                        clearInterval(tid)
                        resolve();
                    }
                }, 20)
            })
        }
        
        vjmap.createAnimation({
            from: 0,
            to: 1,
            repeat: Infinity,
            duration: dataChangePeriod,
            ease: vjmap.linear, //线性
            onUpdate: latest => {
                if (isSetDataing) {
                    // 如果正在设置数据，则退出
                    return;
                }
                // 设置正在设置数据中的标识
                isSetDataing = true;
                let curTime = new Date()
                for (let i = 0; i < geojson.features.length; i++) {
                    const prop = geojson.features[i].properties;
                    let ratio = (curTime - prop.dateUpdateTime) / dataChangePeriod ; // 用 当前过去的时间 / 数据更新周期 计算出当前路径的比例
                    if (ratio >= 1) {
                        ratio = 1;
                    }
                    const path = vjmap.interpolatePointsByRatio([prop.prePoint, prop.curPoint], ratio);
                    let pt = prop.prePoint;
                    if (path.length > 0 ) {
                        pt = path[path.length - 1]
                    }
                    // 更新坐标
                    geojson.features[i].geometry.coordinates = map.toLngLat(pt);
                }
                map.setData(symbols.sourceId, geojson)
            }
        })
        
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