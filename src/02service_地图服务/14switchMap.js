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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/14switchMap
        // --切换图形[地图对象不变]--通过图形id切换不同的图形，切换后地图对象map不会发生变化
        // js代码
        // js代码
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        // 演示切换图形，同时加载此图形相关的覆盖物
        const mapPolygons = {} ;// 记录此图形相关联的多边形
        
        const mapids = ["sys_zp", "sys_hello", "sys_world", "sys_cad2000"]
        let curIdx = 1;
        let curMapId = mapids[0]
        const switchMap = async () => {
            curMapId = mapids[curIdx++ % mapids.length]
            await map.switchMap({
                mapid: curMapId,
                style: vjmap.openMapDarkStyle()
            });
            // 同时加载此图形相关的覆盖物
            showMapPolygons();
        }
        
        
        // 开始绘制一个多边形
        const drawPolygon = async () => {
            // 开始绘制一个多边形
            let drawPoly = await vjmap.Draw.actionDrawPolygon(map, {
            });
            if (drawPoly.cancel) {
                return ;// 取消操作
            }
            let polygon = new vjmap.Polygon({
                data: drawPoly.features[0].geometry.coordinates,
                fillColor: '#0f0',
                fillOpacity: 0.6,
                fillOutlineColor: "#f00",
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygon.addTo(map);
        
            // 把此多边形保存进此图形id的数组中
            mapPolygons[curMapId] = mapPolygons[curMapId] || [];
            mapPolygons[curMapId].push(polygon);
        }
        
        
        // 显示与此图相关联的多边形
        const showMapPolygons = () => {
            if (!mapPolygons[curMapId]) return
            for(let polygon of mapPolygons[curMapId]) {
                polygon.addTo(map);
            }
        }
        
        // 清空多边形
        const clearPolygon = () => {
            if (!mapPolygons[curMapId]) return
            for(let polygon of mapPolygons[curMapId]) {
                polygon.remove();
            }
        }
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>图形切换</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => switchMap() }>请点击此按钮切换图形</button>
                        <button className="btn" onClick={ () => drawPolygon() }>绘制多边形</button>
                        <button className="btn" onClick={ () => clearPolygon() }>清空多边形</button>
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