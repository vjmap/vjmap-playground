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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findcircledrawbounds
        // --查找范围内圆并绘制边框--查找图形中的范围内的所有圆根据外包矩形绘制边框
        // 把div背景改成浅色
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
        
        // 实体类型ID和名称映射
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        const queryCircleAndDrawBounds = async () => {
            let queryEntTypeId = getTypeNameById("AcDbCircle");
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryEntTypeId}'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                bounds:[587498538.4551579,3103826144.0635295, 587696451.4441276, 3103979855.1575785],//也可以不设置范围，不设置范围则不对范围进行判断
                fields: "",
                limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
            })
            if (query.error) {
                message.error(query.error)
            } else {
                message.info(`查询到符合的记数条数：${query.recordCount}`)
        
                if (query.recordCount > 0) {
                    let polygons = []
                    for(var i = 0; i < query.recordCount; i++) {
                        let bounds = map.getEnvelopBounds(query.result[i].envelop);
                        let clr = map.entColorToHtmlColor(query.result[i].color); // 实体颜色转html颜色(
                        polygons.push({
                            points: map.toLngLat(bounds.toPointArray()),
                            properties: {
                                name: "objectid:" + query.result[i].objectid,
                                color: clr
                            }
                        });
        
        
                    }
                    let polygon = new vjmap.Polygon({
                        data: polygons,
                        fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', '#f00'],
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
                        return `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`
                    }, { anchor: 'bottom' });
                }
            }
        }
        const { Button } = antd
        const App = () => {
            const handleClick = async () => {
                queryCircleAndDrawBounds()
            };
            return (
                <Button type="primary" onClick={handleClick}>请点击此按钮查询图中所有圆并绘制边框"</Button>
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