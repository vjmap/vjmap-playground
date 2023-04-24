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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polyline/00polylineSingle
        // --单个多段线--
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
        let mapBounds = map.getGeoBounds(0.3);
        const routePath = [];
        routePath.push(mapBounds.min);
        routePath.push(mapBounds.center());
        routePath.push(vjmap.geoPoint([mapBounds.max.x, mapBounds.min.y]));
        routePath.push(mapBounds.max);
        routePath.push(vjmap.geoPoint([mapBounds.min.x, mapBounds.max.y]));
        
        let polyline = new vjmap.Polyline({
            data: map.toLngLat(routePath),
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', 'yellow'],
            lineWidth: 3,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polyline.addTo(map);
        
        let scale = 0.3;
        const changeCoordinate = () => {
            scale -= 0.05;
            if (scale <= 0) scale = 0.3;
            // 通过setData来改变坐标
            let mapBounds = map.getGeoBounds(scale);
            const newPath = [];
            newPath.push(mapBounds.min);
            newPath.push(mapBounds.center());
            newPath.push(vjmap.geoPoint([mapBounds.max.x, mapBounds.min.y]));
            newPath.push(mapBounds.max);
            newPath.push(vjmap.geoPoint([mapBounds.min.x, mapBounds.max.y]));
            polyline.setData(map.toLngLat(newPath));
        }
        
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>数据</h4>
                    <div className="input-item">
                        <button className="btn" onClick={() => changeCoordinate()}>改变坐标</button>
                    </div>
                </div>
            );
        }
        
        ReactDOM.render(<App />, document.getElementById('ui'));
        
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