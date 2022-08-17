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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polygon/polygonFilter
        // --多边形条件过滤--
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
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds(0.6);
        
        let len = mapBounds.width() / 100;
        let polygons = []
        for(let i = 0; i < 1000; i++) {
            const isSquare = vjmap.randInt(0, 1);
            const pts = []
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
            const p3 = vjmap.geoPoint([p1.x + len, p1.y + len]);
            pts.push(p1, p2, p3);
            if (isSquare) {
                pts.push(vjmap.geoPoint([p1.x + len, p1.y]));
            }
            polygons.push({
                points: map.toLngLat(pts),
                properties: {
                    name: "polygon" + (i + 1),
                    color: vjmap.randomColor(),
                    type: isSquare ? "square": "triangle"
                }
            })
        }
        
        
        let polygon = new vjmap.Polygon({
            data: polygons,
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillOpacity: 0.8,
            fillOutlineColor: "#f00",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polygon.addTo(map);
        polygon.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，颜色为 ${e.features[0].properties.color} 的多边形`))
        polygon.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3><h4>Color: ${f.properties.color}<h4><h4>形状: ${f.properties.type === "square" ? "正方形": "三角形"}<h4>`, { anchor: 'bottom' });
        
        const filterTriangle = () => {
            polygon.setFilter(['all',
                ['==', 'type', 'triangle']]);
        }
        
        const filterSquareRedYellow = () => {
            polygon.setFilter(['all',
                ['!=', 'type', 'triangle'],
                ['in', 'color', '#0000ff','#00ff00']])
        }
        
        const cancelFilter = () => {
            polygon.setFilter(null);
        }
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>条件过滤</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => filterTriangle() }>三角形</button>
                        <button className="btn" onClick={ () => filterSquareRedYellow() }>蓝绿正方形</button>
                        <button className="btn" onClick={ () => cancelFilter() }>全部</button>
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