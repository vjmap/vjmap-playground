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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findblockmodifyclr
        // --查找图中块并修改颜色动画线--查找图形中的所有块或组实体，并根据状态修改块的颜色和响应事件
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: 'sys_topo', // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 自定义矢量样式，增加状态值，设置两个状态，一个报警状态（红色），一个正常状态(绿色)
        let customColorCaseExpr = [['==', ['feature-state', 'status'], 'alarm'], '#ff0000', ['==', ['feature-state', 'status'], 'normal'], '#00ff00'];
        
        let vectorStyle = svc.vectorStyle({
            customColorCaseExpr
        });
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: vectorStyle, // 样式，这里是矢量样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        // 获取块实体id与实体objectid映射关系 , 查询的数据可以缓存起来，不要每次去后台查询
        const getFeatureIdObjectIdMap = async () => {
            let blocks = {} // 块信息
            let featureIdBlock = {} // 实体id与块id对应关系
            let query = await svc.conditionQueryFeature({
                // 实体id
                // 块objectid命名规则:块id_引用的块定义id1_引用的块定义id2(可能有多个)_实体id_#;
                // 表格命名规则:objectid命名规则:块id_引用的块定义id1_引用的块定义id2(可能有多个)_实体id_@;
                // 组objectid命名规则:$实体id_实体内元素索引$组id;
                condition: `objectid like '%#%' or objectid like '%$%' `,
                // 只获取id,objectid,和外包矩形
                fields: "id,objectid,envelop",
                limit: 100000 //设置很大，相当于把所有的都查出来。不传的话，默认只能取100条
            })
            if (query.error) {
                message.error(query.error)
            } else {
                if (query.recordCount > 0) {
                    for(let i = 0; i < query.result.length; i++) {
                        let item = query.result[i];
                        let bounds = map.getEnvelopBounds(item.envelop);
                        let objectId = item.objectid;
                        let blockId;
                        if (objectId.indexOf("_") > 0) {
                            // 块
                            let ids = objectId.split("_");
                            blockId = ids[0];
                        } else if (objectId.indexOf("$") > 0) {
                            // 组
                            let ids = objectId.split("$");
                            blockId = ids[0];
                        } else {
                            continue;
                        }
        
                        blocks[blockId] = blocks[blockId] || {};
                        blocks[blockId].childrens = blocks[blockId].childrens || []
                        blocks[blockId].childrens.push(item.id);
                        blocks[blockId].bounds = blocks[blockId].bounds || new vjmap.GeoBounds();
                        blocks[blockId].bounds.updateByBounds(bounds); // 更新包围盒
                        featureIdBlock[item.id] = blocks[blockId];
                    }
                }
            }
            return {
                blocks,
                featureIdBlock
            }
        }
        let { blocks, featureIdBlock } = await getFeatureIdObjectIdMap();
        
        // 模拟一些块实体的状态发生变化，然后修改此块的颜色
        const mockStatusChange = () => {
            for(let block in blocks) {
                let status = vjmap.randInt(0, 1) == 0 ? "normal" : "alarm";
                let sourceLayers = ['polygons', 'lines', 'points'];
                // vector source下面的所有图层
                for (let sourceLayer of sourceLayers) {
                    // 块下面的所有feature id
                    for(let id of blocks[block].childrens) {
                        map.setFeatureState({
                                source: "vector-source",
                                sourceLayer: sourceLayer,
                                id: id
                            },
                            {
                                status: status
                            })
                    }
                }
            }
        }
        setInterval(() => mockStatusChange(), 5000)
        
        // 放至块上面时，hover高亮的事件，还有点击事件
        // 思路为把每个块的外包矩形获取到，先弄个透明的多边形，放上去改变透明色，响应事件
        // 这里做为示例实现了两种不同的高亮效果，一种是用整个块的范围矩形做为一个高亮效果，另外一种是改变整个块的实体颜色做为高亮效果
        let polygons = []
        let idx = 0;
        for(let block in blocks) {
            polygons.push({
                points: map.toLngLat(blocks[block].bounds.toPointArray()),
                properties: {
                    name: block,
                    isHoverPolygon: (idx++ % 2) === 0 // 两种不同的高亮效果 取一种做为示例
                }
            })
        }
        let fillOpacityHover = ['case', ['==', ['get', 'isHoverPolygon'], true], 0.1, 0.0]
        let polygon = new vjmap.Polygon({
            data: polygons,
            fillColor: '#00F6F7',
            // 没hover透明度设置为不可见，hover时才设置透明度
            fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], fillOpacityHover, 0],
            fillOutlineColor: "#00F6F7",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polygon.addTo(map);
        polygon.clickLayer(e => message.info(`您点击了名称 ${e.features[0].properties.name} 的块`))
        polygon.hoverPopup((f, popup) => {
            let bounds = vjmap.GeoBounds.fromDataExtent(f);
            popup.setLngLat([bounds.center().x, bounds.max.y]);//可以在此调整popup位置，如设置到此实体的上部中间
            return `<h3>块ID: ${f.properties.name}</h3>`
        }, { anchor: 'bottom' });
        
        // 如果是第二种高亮效果，需要把高亮块里面的所有实体改成高亮颜色
        const setBlockHighlight = (blockId, isHightLight) => {
            let sourceLayers = ['polygons', 'lines', 'points'];
            // vector source下面的所有图层
            for (let sourceLayer of sourceLayers) {
                // 块下面的所有feature id
                for(let id of blocks[blockId].childrens) {
                    map.setFeatureState({
                            source: "vector-source",
                            sourceLayer: sourceLayer,
                            id: id
                        },
                        {
                            hover: isHightLight
                        })
                }
            }
        }
        let highlightBlockId = '';
        polygon.hoverLayer(e => {
            if (e && e.features && e.features.length > 0) {
                // 得到块名称
                highlightBlockId = e.features[0].properties.name;
                setBlockHighlight(highlightBlockId, true)
            } else {
                // 取消之前的高亮实体
                setBlockHighlight(highlightBlockId, false)
            }
        });
        
        
        // 让图中的所有颜色为黄色的直线动起来
        // 先把之前矢量图层绘制的所有线加个过滤条件，只绘制非直线类型的，如果根据需要也可以根据其他条件过滤，如图层等
        // 直线类型为1 https://vjmap.com/guide/svrStyleVar.html，
        let condition = [
            'all',
            ['has', 'type'],
            ['==', ['get', 'type'], 1],
            ['==', ['get', 'color'], '#ffff00']
        ]
        map.setFilter('vector-layer-lines', ["!", condition]);
        
        // 增加要绘制动画的直线图层
        let layers = vectorStyle.layers;
        // 找到之前的直线图层设置
        let lineLayer = layers.find(layer => layer.id === "vector-layer-lines")
        // 找到了，修改下属性，加个新的动画线图层
        let animateLineLayer = {
            ...lineLayer, // 复制原来的属性
            id: "vector-layer-animate-lines", // 新的id
            filter: condition // 过滤条件，所有的直线类型
        }
        map.addLayer(animateLineLayer);
        
        
        let antPathImages = vjmap.createAntPathAnimateImages({
            canvasWidth: 128,
            canvasHeight: 4,
            fillColor1: "#f0f",
            fillColor2: "#0ff"
        });
        let anim;
        const startAnimation = () => {
            if (anim) {
                // 存在了，则开始动画
                anim.startAnimation();
            } else {
                // 创建新的动画
                anim = vjmap.animateVectorLayer(map, animateLineLayer.id, {
                    animateImages: antPathImages
                }, 0)
            }
        }
        startAnimation();
        
        const stopAnimation = () => {
            if (!anim) return
            anim.stopAnimation();
        }
        
        const removeAnimation = () => {
            if (!anim) return
            anim.remove();
            anim = null
        }
        
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>动画控制</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => startAnimation()}>开始线条流动动画</button>
                        <button className="btn" onClick={ () => stopAnimation() }>结束动画</button>
                        <button className="btn" onClick={ () => removeAnimation() }>移除动画</button>
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