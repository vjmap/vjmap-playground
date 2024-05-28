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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/20queryMemory
        // --后台查询实体数据[内存渲染]--直接在后台以内存方式打开已上传的CAD的DWG格式的图模式下，在后台通过条件查询实体数据
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.Memory, // 以内存渲染方式打开
            style: vjmap.openMapDarkStyle()
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
        
        
        
        let blockNames = ["M_F13", "_AXISO"]; // 要查找的块名称列表 块名称可通过在云端管理平台中点击块实体，右侧属性中的blockname
        const handleQuery= async () => {
            let query = await svc.exprQueryFeature({
                // expr: `gOutReturn := if((gInFeatureType == 'AcDbPolyline' and  gInLayerName == '网格线' and gInExtendMinX >= ${center.x} ), 1, 0);`,
                // 过滤出所有块对象实体
                expr: `gOutReturn := if((gInFeatureType == 'AcDbBlockReference'), 1, 0);`,
                fields: "objectid,blockname,envelop",
                useCache: true,
                limit: 1000000 // 数量大些，相当于查找所有的
            })
            if (query.error) {
                message.error(query.error)
            } else {
                // 根据要过滤的块名称过滤结果
                let findBlockName = new Set(blockNames);
                let polygons = []
                let blockColors = {}; // 要绘制的块的颜色
                for(let i = 0; i < query.result.length; i++) {
                    let blockname = query.result[i].blockname;
        
                    if (!findBlockName.has(blockname)) {
                        // 如果不在要找的里面
                        continue
                    }
        
                    let bounds = map.getEnvelopBounds(query.result[i].envelop);
                    let clr = blockColors[blockname];
                    if (!clr) {
                        clr = vjmap.randomColor(); //没有随机生成一个颜色
                        blockColors[blockname] = clr;
                    }
                    polygons.push({
                        points: map.toLngLat(bounds.toPointArray()),
                        properties: {
                            name: "objectid:" + query.result[i].objectid,
                            blockname: blockname,
                            color: clr
                        }
                    });
                }
                message.info(`查询到符合的记数条数：${query.recordCount}`)
        
                // 绘制查找出来的块
                let polygon = new vjmap.Polygon({
                    data: polygons,
                    fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', ['get', 'color']],
                    fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 0.5],
                    // 如果一开始不显示这个多边形，可以把透明度设置为0,鼠标移上去才会显示多边形
                    // fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 0.0],
                    fillOutlineColor: ['get', 'color'],
                    isHoverPointer: true,
                    isHoverFeatureState: true
                });
                polygon.addTo(map);
                polygon.clickLayer(e => message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，颜色为 ${e.features[0].properties.color} 的多边形`))
                polygon.hoverPopup((f, popup) => {
                    let bounds = vjmap.GeoBounds.fromDataExtent(f);
                    popup.setLngLat([bounds.center().x, bounds.max.y]);//可以在此调整popup位置，如设置到此实体的上部中间
                    return `<h3>ID: ${f.properties.name}</h3>块名称: ${f.properties.blockname}`
                }, { anchor: 'bottom' });
            }
        };
        
        const { Button } = antd
        const App = () => {
            return (
                <Button type="primary" onClick={handleQuery}>请点击此按钮查询图中指定的所有块对象实体</Button>
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