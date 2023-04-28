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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/07dwgloadmodel
        // --CAD图加载几何模型--
        // 注: 此示例中引用了vjgeo库。此库是对几何模型做了一定程度的封装，方便其他工程共用
        // vjgeo库可在 html 中引入`vjgeo.min.js`即可,或npm install vjgeo`通过`import vjgeo from 'vjgeo'`引入
        // 几何模型帮助文档 https://vjmap.com/guide/geomodel.html
        // 几何模型API文档 https://vjmap.com/docs/geomodel/
        // 注: 此示例中引用了vjcommon库。此库是对唯杰地图常用的功能做了一定程度的封装，方便其他工程共用
        // vjcommon库可在 html 中引入`vjcommon.min.js`即可,或npm install vjcommon`通过`import vjcommon from 'vjcommon'`引入
        // vjcommon库是开源的。开源地址 https://github.com/vjmap/vjmap-common
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: "sys_hello", // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
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
        
        await map.onLoad();
        
        const createGeoModel = async () => {
            let star = new vjgeo.models.Star(vjmap.randInt(6, 12),50,15,2);
            star.data.isFill = vjmap.randInt(0, 2) == 0; // 随机是否填充
            star.data.colorIndex = vjmap.randInt(0, 7); // 随机生成一个颜色索引
            vjgeo.model.move(star, [200, 0]);
            let cloneCount = vjmap.randInt(4, 15);
            let model = vjgeo.layout.cloneToRadial(star, cloneCount, 360 / cloneCount);
            let dwgDoc = vjgeo.exporter.toDWG(model);
            await addDwgDocToMap(dwgDoc);
        }
        
        const loadSymbolGeoModel = async () => {
            let symbolMapId = "sys_symbols";
            let symbolMapVer = "v1";
            let svc = map.getService();
            let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true);
            // 获取到的数据，如果条件不变，建议加上缓存，不要每次去后台获取，这里演示就直接每次去获取了
            let data = await vjcommon.queryMapData(
                map,
                {
                    mapid: symbolMapId,
                    version: symbolMapVer,
                    layer: styleName,
                    coordType: 1, // 几何坐标
                    condition: "layerindex=2", // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                }
            );
            // 把查询的geojson转成几何模型
            let symbol = vjgeo.importer.fromGeoJsonData(data);
            // 获取符号的范围
            let extent = vjgeo.measure.modelExtents(symbol)
            // 对模型进行网格布局
            let model = vjgeo.layout.cloneToGrid(symbol, 3, 2, extent.width / 2);
            let dwgDoc = vjgeo.exporter.toDWG(model);
            await addDwgDocToMap(dwgDoc);
        }
        
        const addDwgDocToMap = async (doc) => {
            let dwgDoc = new vjmap.DbDocument();
            dwgDoc.entitys = doc.entitys
            let geojson = await map.createDbGeomData(dwgDoc);
            let result = await vjcommon.interactiveCreateGeom(geojson, map);
            if (!(result && result.feature && result.feature.features)) return;
            let mapJson = map.getDrawLayer().getAll();
            mapJson.features.push(...result.feature.features);
            map.getDrawLayer().set(mapJson);
        }
        
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>操作：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={createGeoModel}>创建径向布局几何模型</button>
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={loadSymbolGeoModel}>加载DWG符号创建模型</button>
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