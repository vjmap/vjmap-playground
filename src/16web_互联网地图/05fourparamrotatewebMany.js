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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/05fourparamrotatewebMany
        // --多个CAD图旋转叠加至互联网地图[互联网地图为底图]--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 根据地图范围建立经纬度投影坐标系
        let prj = new vjmap.LnglatProjection();
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: {
                version: svc.styleVersion(),
                sources: {
                    tdt1: {
                        type: 'raster',
                        tiles: ["https://t3.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                        // 要使用影像请用这个地址
                        // tiles: ["https://t3.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"]
                    },
                    tdt2: {
                        type: 'raster',
                        tiles: ["https://t3.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                    }
                },
                layers: [{
                    id: 'tdt1',
                    type: 'raster',
                    source: 'tdt1',
                },{
                    id: 'tdt2',
                    type: 'raster',
                    source: 'tdt2',
                }]
            },
            center: prj.toLngLat([116.4849310885225,  39.960672361810566]),
            zoom: 16,
            pitch: 0,
            maxZoom: 24,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        
        const addCadLayer = async (mapId, version, cadPts, webPts)=> {
        // cad上面的点坐标
            let cadPoints = cadPts.map(e => vjmap.geoPoint(e));
        
        // 在互联网图上面拾取的与上面的点一一对应的坐标(wgs84坐标)
            let webPoints = webPts.map(e => vjmap.geoPoint(e))
        
        // 通过坐标参数求出四参数
            let epsg3857Points = webPoints.map(w => vjmap.geoPoint(vjmap.Projection.lngLat2Mercator(w)));
            let param = vjmap.coordTransfromGetFourParamter(epsg3857Points, cadPoints , false); // 这里考虑旋转
            let fourparam = [param.dx, param.dy, param.scale, param.rotate]
        
        // 先获取地图元数据来获取图层样式
            let cadMapId = mapId;
            let style = await svc.createStyle({
                backcolor: 0xFFFFFF // 浅色主题
            }, cadMapId)
            let wmsurl = svc.wmsTileUrl({
                mapid: cadMapId,
                version: version,
                layers: style.stylename,
                fourParameter: fourparam
            })
        
            let key = `${mapId}-${version}`;
            let sourceId = 'wms-test-source' + key;
            map.addSource(sourceId, {
                'type': 'raster',
                'tiles': [
                    wmsurl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': 'wms-test-layer' + key,
                    'type': 'raster',
                    'source': sourceId,
                    'paint': { "raster-opacity": 1 }
                }
            );
        
            // 把cad的几个对应点的坐标绘制到图上
            for(let cadPt of cadPoints) {
                let pt3857 = vjmap.coordTransfromByInvFourParamter(cadPt, param); // 需要四参数反算出互联网的墨卡托坐标
                let pt4326 = vjmap.Projection.mercator2LngLat(pt3857);
                new vjmap.Marker().setLngLat(pt4326).addTo(map);
            }
            // 如果是自动叠加的图，cad坐标转换到互联网地图思路为
            /*
            (1) 根据x坐标前两位还有哪个坐标系获取epsg。 如let epsg = vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg;
            (2)  通过坐标转换把epsg转成wgs84 4326坐标
                let res = await svc.cmdTransform("EPSG:xxxx","EPSG:4326",pt); // 如果不想调服务转，也可以在前端用proj4库
            (3) // 如果为高德地图火星坐标，还需要从4326转火星
                let webPt = res[0];// 返回的第1条结果
                if (isWgs84 === false) {
                    webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
                 }
             */
        
            return sourceId;
        }
        
        let sourceId1, sourceId2;
        
        const addCadMap1 = async () => {
            if (sourceId1) return;
            sourceId1 = await addCadLayer('sys_zp', 'v1', [
                [587464448.8435847, 3104003685.208651], // 坐标可通过在云端管理平台里面-》数据展示=>获取点 拾取坐标
                [587761927.7224838, 3104005967.655292],
                [587463688.0280377, 3103796743.3798513],
                [587760406.0913897, 3103793700.1176634]
            ], [
                [116.4849310885225,  39.9606723618105], // 坐标可通过 map.on("click", e=>console.log(e.lngLat))获取
                [116.48571466352934, 39.9601669054582],
                [116.48440741215745, 39.9601639321747],
                [116.48517547082753, 39.9596852318108]
            ])
        }
        
        const removeCadMap1 = async () => {
            if (!sourceId1) return;
            map.removeSourceEx(sourceId1); //移除此数据源和与此数据源相关的所有图层
            sourceId1 = null;
        }
        
        const addCadMap2 = async () => {
            if (sourceId2) return;
            sourceId2 = await addCadLayer('sys_world', 'v1', [
                [2371.9857148576993,17684.712620161758],
                [27147.25278, 17638.89665600001],
                [27261.514060999998, 2774.543744999999],
                [2271.3403719999988, 2828.677678]
            ], [
                [116.48471651179932, 39.961860646794605],
                [116.48547825916069, 39.96135079694321],
                [116.48500619037321, 39.96093140147377],
                [116.48416934116136, 39.961334350110604]
            ])
        }
        
        const removeCadMap2 = async () => {
            if (!sourceId2) return;
            map.removeSourceEx(sourceId2); //移除此数据源和与此数据源相关的所有图层
            sourceId2 = null;
        }
        
        addCadMap1();
        addCadMap2();
        
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>叠加CAD图</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => addCadMap1() }>叠加sys_zp</button>
                        <button className="btn" onClick={ () => removeCadMap1() }>不叠加sys_zp</button>
                        <button className="btn" onClick={ () => addCadMap2() }>叠加sys_world图</button>
                        <button className="btn" onClick={ () => removeCadMap2() }>不叠加sys_world图</button>
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