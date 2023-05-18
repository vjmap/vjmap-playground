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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/04openMapSelectEntity
        // --矢量瓦片选择高亮整体实体--
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
        
        // let style = svc.vectorStyle(); // 默认的样式
        // 自定义的矢量样式
        let style = svc.vectorStyle({
            hoverColor: 'rgba(0,255,255,255)', // 自定义高亮时颜色
            hoverOpacity: 0.5, // 自定义 高亮时透明度
            hoverLineWidth: 3 // 自定义 高亮时线宽
        });
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: style,
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        await map.onLoad();
        
        // 得到实体的objectID，在几何模式打开的情况下objectid有可能是块，会分成多个实体，而实际中是同一个，这里获取的是cad实体的objectid
        const getEntityObjectId = (id) => {
            // id如 A0F$A10 或 380#26F&26C 这种格式，只要前面的一部分就是cad的实体objectid
            let objectId = "";
            let k = 0;
            // 判断一个字符是英文字符或数字
            const isAlphanumeric = (char) => {
                return /^[a-zA-Z0-9]+$/.test(char);
            }
            for(k = 0; k < id.length; k++) {
                if (isAlphanumeric(id[k])) {
                    objectId += id[k]
                } else {
                    break;
                }
            }
            return objectId;
        }
        
        // 先去后台查询实体id和objectid的所有关联关系
        let query = await svc.conditionQueryFeature({
            // 过滤出类型为文本，颜色为黄色的
            condition: `1=1`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
            fields: "id,objectid",
            limit: 10000000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
        })
        
        let featureIdObjectIdMap = {}; // 通过id查找objectid (1对1)
        let entityIdFeatureIdMap = {}; // 通过entityid查找id (因为一个实休如块有可能包含多个，1对多)
        for(let i = 0; i < query.result.length; i++) {
            let item = query.result[i];
            featureIdObjectIdMap[item.id] = item.objectid;
            let entityId = getEntityObjectId(item.objectid); // 获取整个实体的id
            let ids = entityIdFeatureIdMap[entityId];
            if (ids === undefined) {
                entityIdFeatureIdMap[entityId] = new Set();
            }
            entityIdFeatureIdMap[entityId].add(item.id);
        }
        
        let curHoverIds;
        
        const highlightEntity = (featureId) => {
            if (curHoverIds) {
                changeFeatureStatus(curHoverIds, {hover: false});
                curHoverIds = null;
            }
            // hover高亮实体回调事件
            if (featureId === null) {
                return;
            }
            let id = featureId;
            let objectId = featureIdObjectIdMap[id];
            let entityId = getEntityObjectId(objectId); // 获取整个实体的id
            // 获取同一个实体其他的feature id
            let ids = entityIdFeatureIdMap[entityId];
            if (ids.size > 0) {
                changeFeatureStatus(ids, {hover: true});
                curHoverIds = ids;
            }
            let content = `entityId: ${entityId}`
            message.info({ content, key: "info", duration: 5});
        }
        
        
        const changeFeatureStatus = (ids, state) => {
            if (!ids) return;
            let sourceLayers = ['polygons', 'lines', 'points'];
            // vector source下面的所有图层
            for (let sourceLayer of sourceLayers) {
                // 块下面的所有feature id
                for(let id of ids) {
                    map.setFeatureState({
                            source: "vector-source",
                            sourceLayer: sourceLayer,
                            id: id
                        },
                        state)
                }
            }
        }
        
        
        // 认鼠标悬浮高亮
        const hoverHighlight = (disable) => {
            if (!disable) clickHighlight(true); // 取消点击高亮
            map.disableVectorLayerHoverHighlight();
            if (disable) return;
            // 有高亮状态（鼠标在地图元素上时，会高亮)
            map.enableVectorLayerHoverHighlight((event, feature, layer) => {
                // hover高亮实体回调事件
                if (event == "mouseleave") {
                    highlightEntity(null);
                    return;
                }
                if (!feature) {
                    return;
                }
                let id = feature.id;
                highlightEntity(id);
            })
        }
        
        // 鼠标点击高亮
        const clickHighlight = (disable) => {
            if (!disable) hoverHighlight(true); // 取消悬浮高亮
            map.disableLayerClickHighlight();
            map.enableLayerClickHighlight(svc, e => {
                highlightEntity(null);
                if (!e) {
                    return;
                }
                let id = e.id;
                highlightEntity(id);
            }, "#0000" /*不绘制，只响应点击事件*/)
        }
        
        // 默认鼠标悬浮高亮
        hoverHighlight();
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "185px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => hoverHighlight()}>鼠标悬浮高亮
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => clickHighlight()}>鼠标点击高亮
                            </button>
                        </div>
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