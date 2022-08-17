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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoWebWorkerIntersect
        // --求线段交点(WebWorker实现)--
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
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.vectorStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            pitch: 60,
            renderWorldCopies: false, // 不显示多屏地图
            doubleClickZoom: false // 不启用双击缩放
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        await map.onLoad()
        let mapBounds = map.getGeoBounds(0.4); // 得到地图地理范围
        
        // 用户自己加几条数据
        let userGeoData =  mapBounds.randomGeoJsonLineCollection(20, 5);
        // 把线画上
        let polylines = new vjmap.Polyline({
            data: map.toLngLat(userGeoData),
            lineColor: '#0ff',
            lineWidth: 3,
            lineOpacity: 0.6
        });
        polylines.addTo(map);
        
        let geoDatas = vjmap.cloneDeep(userGeoData);
        
        // 把地图上的数据加上
        const getMapData = () => {
            // 查询矢量图层上所有的线图层
            let features = map.queryRenderedFeatures({layers: ['vector-layer-lines']})
            let mapGeoDatas = {
                type: "FeatureCollection",
                features: features.map(f => {
                    return {
                        id: f.id,
                        type: f.type,
                        properties: f.properties,
                        geometry: f.geometry
                    }
                })
            }
            let mapDatas = map.fromLngLat(mapGeoDatas);
            // 地图数据和用户自定义数据一起合并了
            geoDatas.features = [...userGeoData.features, ...mapDatas.features]
        }
        getMapData();
        // 因为地图缩放或平移，矢量瓦片数据会发生变化，需要重新获取下
        map.on("zoomend", e => getMapData());
        map.on("moveend", e => getMapData());
        
        
        // 生成一条要相交的直线
        let startPoint = mapBounds.randomPoint();
        let endPoint = mapBounds.randomPoint();
        let intersectLine = new vjmap.Polyline({
            data: map.toLngLat([startPoint, endPoint]),
            lineColor: '#f00',
            lineWidth: 8
        });
        intersectLine.addTo(map);
        
        // 让相交线动起来
        const moveLine =  (newStartPoint, newEndPoint) => {
            let data = map.getSourceData(intersectLine.sourceId);
            let geoData = map.fromLngLat(data);
            // 开始点插值函数
            let mapProgressToValueStart = vjmap.interpolate(
                [0, 1],
                [geoData.features[0].geometry.coordinates[0], [newStartPoint.x, newStartPoint.y]]
            )
            // 终点插值函数
            let mapProgressToValueEnd = vjmap.interpolate(
                [0, 1],
                [geoData.features[0].geometry.coordinates[1], [newEndPoint.x, newEndPoint.y]]
            )
            vjmap.createAnimation({
                from: 0,
                to: 1,
                duration: 5000,
                ease:vjmap.linear, //线性
                onUpdate: latest => {
                    let beginPoint = mapProgressToValueStart(latest)
                    let endPoint = mapProgressToValueEnd(latest)
                    // 修改坐标
                    data.features[0].geometry.coordinates = map.toLngLat([beginPoint, endPoint])
                    map.setData(intersectLine.sourceId, data)
                },
                onComplete: (e) => {
                    map.fire("moveLineFinish"); // 发送线移动完成事件
                }
            })
        }
        
        moveLine(mapBounds.randomPoint(), mapBounds.randomPoint());
        // 响应线移动完成事件，完成后又开始向新的点移动
        map.on("moveLineFinish", ()=> moveLine(mapBounds.randomPoint(), mapBounds.randomPoint()));
        
        // 下面用symbol来显示交点
        await map.loadImageEx("symbol", env.assetsPath + "images/sensor1.png");
        const intersectSymbols = new vjmap.Symbol({
            data: [],
            iconImage: "symbol",
            iconAnchor: "bottom",
            iconOpacity: 0.7,
            iconAllowOverlap: true
        });
        intersectSymbols.addTo(map);
        
        
        // 下面这相交函数会在webworker中计算，不会阻塞主线程
        const getIntersects = (startPoint, endPoint, allLineGeoJson)=> {
            let intersectPoints = []
            for(let i = 0; i < allLineGeoJson.features.length; i++) {
                for(let k = 0; k < allLineGeoJson.features[i].geometry.coordinates.length - 1; k++) {
                    // 多段线的每条直线都与判断是否相交
                    let co1 = allLineGeoJson.features[i].geometry.coordinates[k];
                    let co2 = allLineGeoJson.features[i].geometry.coordinates[k + 1];
                    //  如果引用了vjmap库，则可以直接调用这个库里面的函数
                    //let res = vjmap.segmentIntersect(startPoint[0], startPoint[1], endPoint[0], endPoint[1],  co1[0], co1[1], co2[0], co2[1]);
        
                    // 这里只引用了intersectFunc这一个函数，没有引入vjmap整个库
                    let res = intersectFunc(startPoint[0], startPoint[1], endPoint[0], endPoint[1],  co1[0], co1[1], co2[0], co2[1]);
                    if (res.status) {
                        // 如果相交了，要交点存起来
                        intersectPoints.push([res.x, res.y])
                    }
                }
            }
            return intersectPoints;
        }
        
        /* 如果要用vjmap库中其他的函数，获取库脚本的内容
        let script = await vjmap.httpHelper.get("../../js/vjmap/vjmap.min.js", undefined, {
            raw: true
        })*/
        
        // 启动webworker计算相交函数
        let intersect = vjmap.WorkerProxy(getIntersects, {
            // vjmap: script.data, //脚本内容, 如果要用vjmap库中其他的函数，可以获取库脚本的内容 ，把脚本内容传给webworker
            intersectFunc: vjmap.segmentIntersect // 把主进程库的相交函数做为上下文传进去，这个方法是不用引入vjmap整个库，只用里面的某个函数，但是这个函数不能调用其他函数，如果调用了其他函数会报错，这时只有用上面注释的那个办法，把整个vjmap库都导入进webworker
        });
        // 用webworker计算相交点
        const calcIntersect = async ()=> {
            // 获取线的坐标
            let coordinates = map.fromLngLat(map.getSourceData(intersectLine.sourceId)).features[0].geometry.coordinates;
            // 启动webworker计算相交点
            let intersectPoints = await intersect(coordinates[0], coordinates[1], geoDatas)
            intersectSymbols.setData(map.toLngLat(intersectPoints)); //修改数据
            map.fire("calcIntersectFinish"); // 发送线移动完成事件
        }
        map.on("calcIntersectFinish", async ()=> setTimeout(async ()=> await calcIntersect(), 15))
        calcIntersect();
        
        // 如果要停止webworker
        //intersect.worker.terminate()
        
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