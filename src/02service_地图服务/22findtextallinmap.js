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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findtextallinmap
        // --获取图中所有文字并高亮--
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
        
        
        let polygonLayer;
        const getAllTexts = async ()=> {
            if (polygonLayer) return; // 如果绘制过了，不绘制了
            // 实体类型ID和名称映射
            const { entTypeIdMap } = await svc.getConstData();
            const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
            let polygons = [];
            let queryTextEntTypeId = getTypeNameById("AcDbText"); // 单行文字
            let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // 多行文字
            let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // 属性定义文字
            let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // 属性文字
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                fields: "",
                geom: true,
                limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
            })
            if (query.error) {
                message.error(query.error);
                return;
            } else {
                if (query.recordCount > 0) {
                    for(let i = 0; i < query.recordCount; i++) {
                        let bounds = map.getEnvelopBounds(query.result[i].envelop);
                        let clr = vjmap.entColorToHtmlColor(query.result[i].color); // 实体颜色转html颜色(
                        polygons.push({
                            points: map.toLngLat(bounds.toPointArray()),
                            properties: {
                                name: query.result[i].objectid,
                                color: clr,
                                text: query.result[i].text
                            }
                        });
                    }
                }
            }
            polygonLayer = new vjmap.Polygon({
                data: polygons,
                fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', '#f0f'],
                fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 0.4],
                fillOutlineColor: ['get', 'color'],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygonLayer.addTo(map);
            polygonLayer.hoverFeatureState(e => {
                if (e.features) {
                    message.info({
                        content: `名称为 ${e.features[0].properties.name}，值为 ${e.features[0].properties.text} 的文字`,
                        key: "info",
                        duration: 5
                    })
                }
            })
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "180px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => getAllTexts()}>获取图中所有文字并高亮
                            </button>
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