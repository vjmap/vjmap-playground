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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29customentitylink
        // --自定义实体关联关系--可自己设置实体的关联关系，点击相关联的实体时，其他实体高亮显示
        // 注: 此示例中引用了vjcommon库。此库是对唯杰地图常用的功能做了一定程度的封装，方便其他工程共用
        // vjcommon库可在 html 中引入`vjcommon.min.js`即可,或npm install vjcommon`通过`import vjcommon from 'vjcommon'`引入
        // vjcommon库是开源的。开源地址 https://github.com/vjmap/vjmap-common
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
        
        await map.onLoad();
        let featureLinks = {};
        
        // 点击有高亮状态（鼠标点击地图元素上时，会高亮)
        map.enableLayerClickHighlight(svc, e => {
            vjcommon.clearHighlight(map);
            if (!e) return;
            let links = featureLinks[e.objectid] || [];
            let linkObjectIds = new Set(links);
            if (linkObjectIds.size == 0) {
                message.info(`没有实体与这个实体相关联呢`);
            } else {
                message.info(`有 ${linkObjectIds.size} 实体与这个实体相关联`);
                highLightObjectIds(Array.from(linkObjectIds))
            }
        })
        // 绑定关联实体
        const bindConnect = async () => {
            vjcommon.clearHighlight(map); // 清空之前选择高亮的
            // 进入选择实体状态
            message.info("请选择要关联的实体，点击右键结束")
            let srcFeature = await vjcommon.selectFeatures(map, true, true, true, true);
            message.info("请选择要与之关联的实体，点击右键结束")
            let destFeature = await vjcommon.selectFeatures(map, true, true, true, true);
            let srcObjectIds = srcFeature.map(feature => feature.properties.objectid);
            let destObjectIds = destFeature.map(feature => feature.properties.objectid);
            vjcommon.clearHighlight(map);
            srcObjectIds.forEach(id => {
                let links = featureLinks[id] || [];
                links.push(...destObjectIds); // 可以用set去重下
                featureLinks[id] = links;
        
                // 反向关联
                destObjectIds.map(destId => {
                    let destLinks = featureLinks[destId] || [];
                    destLinks.push(id); // 可以用set去重下
                    featureLinks[destId] = destLinks;
                })
            })
            message.info(`${srcObjectIds.length } 个实体  与 ${destObjectIds.length} 个实体已建立关联`);
        
        }
        
        // 定位关联实体
        const posToConnectObject = async () => {
            message.info(`请在图上点击一个实体查看相关联的实体`);
            // 因为之前map.enableLayerClickHighlight里实现了，所以这里不用写了
        }
        
        const highLightObjectIds = async (objectIds) => {
            let condition = objectIds.map(id => `objectid = '${id}'`).join(" or ")
            await vjcommon.getHighlightEntities(map, undefined, true, {
                condition
            }, false)
        }
        
        // 保存关联数据 实际中请保存至自己业务后台
        const saveData = async () => {
            let svc = map.getService();
            let curParam = svc.currentMapParam() || {};
            // 用地图的mapid和版本号做为key值，把数据保存起来，这里演示只是做数据保存到了唯台后台,实际中请保存至自己的后台数据库中
            let key = `map_highconnect_${curParam.mapid}_${curParam.version}`;
            await svc.saveCustomData(key, featureLinks);
            message.info('保存成功')
        }
        
        // 加载关联数据
        const loadData = async () => {
            try {
                let svc = map.getService();
                // 用地图的mapid和版本号做为key值, 这里演示只是从localStorage去加载,实际中请从后台去请求数据加载
                let curParam = svc.currentMapParam() || {};
                let key = `map_highconnect_${curParam.mapid}_${curParam.version}`;
                let res = await svc.getCustomData(key);
                if (res.data) {
                    featureLinks = res.data
                    message.info("加载数据成功")
                }
            } catch (e) {
                console.error(e)
            }
        }
        await loadData();
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>操作：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={bindConnect}>绑定关联实体</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => posToConnectObject(true)}>定位关联实体</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={saveData}>保存关联数据</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={loadData}>加载关联数据</button>
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