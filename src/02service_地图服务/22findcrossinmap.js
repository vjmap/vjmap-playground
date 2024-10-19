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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findcrossinmap
        // --线与图求交点--绘制一条线与图中的实体求交点
        // 把div背景改成浅色
        // js代码
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
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        // 不双击放大
        map.doubleClickZoom.disable();
        
        // 绘制一条线，把相交的点都绘制出来
        const queryIntersections = async () => {
            // 先清空所有绘制的marker
            map.removeMarkers();
            let line = await vjmap.Draw.actionDrawLineSting(map);
            if (line.cancel) {
                return
            }
            let coords = map.fromLngLat(line.features[0].geometry.coordinates).map(pt => pt.toArray())
            // 条件查询
            let query = await svc.conditionQueryFeature({
                //AcDbLine AcDbPolyline AcDb2dPolyline AcDb3dPolyline AcDbSpline https://vjmap.com/guide/svrStyleVar.html#%E6%94%AF%E6%8C%81%E7%9A%84cad%E5%AE%9E%E4%BD%93%E7%B1%BB%E5%9E%8B
                condition: `name='1' or name='2' or name='3' or name='4' or name='5'`,
                bounds: coords, // 交线的坐标
                isGetIntersections: true,// 要获取返回的交点
                includegeom: true,
                fields: "objectid,intersections",
                limit: 100000
            })
            if (query.error) {
                message.error(query.error)
            } else {
                message.info(`查询到符合的记数条数：${query.recordCount}`)
        
        
                if (query.recordCount > 0) {
                    for (let i = 0; i < query.recordCount; i++) {
                        let intersections = query.result[i].intersections;
                        if (!intersections) continue
                        // intersections 中 以 [ 开头的表示交点线 [[ 表示交点是多线 没有的话表示是点
                        // 因为我们不用区别是线，还是多线，还是点，所以都这些标识都去了
                        intersections = intersections.replace("[[", "")
                        intersections = intersections.replace("]]", "")
                        intersections = intersections.replace("[", "")
                        intersections = intersections.replace("]", "")
                        let pts = intersections.split(";");
                        let clr = vjmap.randomColor();
                        pts.forEach(pt => {
                            if (!pt) return;
                            let p = vjmap.GeoPoint.fromString(pt)
                            new vjmap.Marker({color: clr}).setLngLat(map.toLngLat(p)).addTo(map);
                        })
        
                    }
                }
            }
        }
        
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>操作：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={queryIntersections}>绘制线与图求交点</button>
                        </div>
        
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