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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22hightselentity
        // --高亮选择的实体--绘制矩形高亮矩形内选择的实体
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
            pitch: 0,
            //minZoom: initZoom - 3,//可以设置一个最小级别
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        
        const name = "myhighlight";
        const highlightColor = "#FF8957";
        const addSourceLayer = () => {
            //  数据源
            map.addGeoJSONSource(`${name}-source`, {
                type: "FeatureCollection",
                features: []
            });
        
            map.addLineLayer(`${name}-line-layer`, `${name}-source`, {
                lineJoin: "round",
                lineCap: "round",
                lineColor: highlightColor,
                lineWidth: 3,
                lineOpacity: 0.8,
                filter: [
                    "==",
                    ["geometry-type"],
                    "LineString"
                ]
            });
        
        
            map.addFillLayer(`${name}-fill-layer`, `${name}-source`, {
                fillColor: highlightColor,
                fillOpacity: 1.0,
                filter: [
                    "==",
                    ["geometry-type"],
                    "Polygon"
                ]
            })
        
        }
        const clear = () => {
            if (map.getSource(`${name}-source`)) {
                map.getSource(`${name}-source`).setData({
                    type: "FeatureCollection",
                    features: []
                });
            }
        };
        
        
        const highlight_ent = async bounds => {
        
            let res = await svc.conditionQueryFeature({
                condition: ``, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                bounds:bounds,//查找此范围内的实体
                fields: "",
                includegeom: true, // 是否返回几何数据,为了性能问题，realgeom为false时，如果返回条数大于1.只会返回每个实体的外包矩形，如果条数为1的话，会返回此实体的真实geojson；realgeom为true时每条都会返回实体的geojson
                realgeom: true,
                isContains: true,//矩形包含才行,false是相交关系
                limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
            })
        
            if (res && res.result && res.result.length > 0) {
                if (!map.getSource(`${name}-source`)) {
                    addSourceLayer();// 第一次初始化
                }
        
                const geom = {
                    geometries: [],
                    type: "GeometryCollection"
                }
        
                for(let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        geom.geometries.push(...ent.geom.geometries)
                    }
                }
                if (geom.geometries.length > 0) {
                    map.getSource(`${name}-source`).setData(geom);
                } else {
                    clear();
                }
            } else {
                clear();
            }
            map.triggerRepaint();
        };
        
        const drawHighlight = async () => {
            let drawRect = await vjmap.Draw.actionDrawRectangle(map, {
            });
            if (drawRect.cancel) {
                return ;// 取消操作
            }
            let co = drawRect.features[0].geometry.coordinates[0];
            co = map.fromLngLat(co);
            highlight_ent([co[0].x, co[0].y, co[2].x, co[1].y]);
        }
        
        const clearHighlight  = () => {
            clear();
            map.triggerRepaint();
        }
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>绘制矩形高亮实体</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => drawHighlight() }>点击绘制矩形高亮实体</button>
                        <button className="btn" onClick={ () => clearHighlight() }>取消高亮实体</button>
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