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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/decklayer/deckLayerCoutour
        // --deck等值线图层--
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
            zoom: 12, // 设置地图缩放级别
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        // 限制地图范围为全图范围，防止多屏地图显示
        map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
        
        const mapBounds = map.getGeoBounds(0.0006);
        
        // 下面增加deck的图层
        if (typeof deck !== "object") {
            // 如果没有deck环境
            await vjmap.addScript([{
                src: "../../js/deck.gl.min.js"
            }]);
        
        }
        
        const data = [];
        for(let i = 0; i < 2000; i++) {
            data.push({
                id: i + 1,
                coordinates: map.toLngLat(mapBounds.randomPoint()),
                weight: vjmap.randInt(1,50)
            })
        }
        
        const popup = new vjmap.Popup({ closeButton: false });
        const deckLayer = new vjmap.DeckLayer({
            id: 'deck',
            type: deck.ContourLayer,
            data,
        
            // aggregation: 'SUM',
            cellSize: 200,
            contours: [
                {threshold: 1, color: [255, 0, 0], strokeWidth: 2, zIndex: 1},
                {threshold: [3, 10], color: [55, 0, 55], zIndex: 0},
                {threshold: 5, color: [0, 255, 0], strokeWidth: 6, zIndex: 2},
                {threshold: 15, color: [0, 0, 255], strokeWidth: 4, zIndex: 3}
            ],
            getPosition: d => d.coordinates,
            getWeight: d => d.weight,
            // gpuAggregation: true,
            // zOffset: 0.005,
        
            /* props inherited from Layer class */
        
            // autoHighlight: false,
            // coordinateOrigin: [0, 0, 0],
            // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
            // highlightColor: [0, 0, 128, 128],
            // modelMatrix: null,
            // opacity: 1,
            pickable: true,
            // visible: true,
            // wrapLongitude: false,
            onHover: ({object, x, y}) => {
                if (object) {
                    popup.setLngLat(map.unproject([x, y]));
                    popup.setHTML(`threshold: ${object.contour.threshold}`);
                    popup.addTo(map);
                } else {
                    popup.remove();
                }
            }
        });
        map.addLayer(deckLayer);
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