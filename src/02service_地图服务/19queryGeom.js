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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/19queryGeom
        // --后台查询实体数据[几何渲染]--几何数据渲染模式下，在后台通过条件查询实体数据
        // 把div背景改成浅色
        document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: sys_world,
            mapopenway: vjmap.MapOpenWay.GeomRender // 以几何数据渲染方式打开
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
            e && message.info(`type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`);
        })
        window.map = map;
        
        const { Button } = antd
        const App = () => {
            const handleClick = async () => {
                // 通过查询几何数据库，查询图层为'网格线'，范围在图的右边的所有"多段线"
                // 不建议使用exprQueryFeature进行查询。推荐使用conditionQueryFeature查询，效率高。可参考示例 条件查询定位闪烁实体
                let query = await svc.exprQueryFeature({
                    expr: `gOutReturn := if((gInFeatureType == 'AcDbPolyline' and  gInLayerName == '网格线' and gInExtendMinX >= ${center.x} ), 1, 0);`,
                    fields: "name,objectid,layername"
                })
                if (query.error) {
                    message.error(query.error)
                } else {
                    message.info(`查询到符合的记数条数：${query.recordCount}`)
                }
            };
            return (
                <Button type="primary" onClick={handleClick}>请点击此按钮查询几何数据库，查询图层为'网格线'，范围在图的右边的所有"多段线"</Button>
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