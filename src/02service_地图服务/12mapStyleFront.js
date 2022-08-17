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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/12mapStyleFront
        // --修改前端渲染数据[矢量瓦片]--通过修改矢量瓦片的样式在前端修改渲染数据
        // js代码
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
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.vectorStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
        
        const customColorCaseExpr = [] ;// 自定义颜色表达式
        const customOpacityCaseExpr = [] ;// 自定义透明度表达式
        const customLineWidthCaseExpr = [] ;// 自定义线宽表达式
        const updateStyle = () => {
            let newStyle = svc.vectorStyle({
                customColorCaseExpr,
                customOpacityCaseExpr,
                customLineWidthCaseExpr
            });
            let curStyle = map.getStyle();
            // 用新的样式的图层id样式去替换当前图形的图层id样式
            for(let i = 0; i < curStyle.layers.length; i++) {
                let idx = newStyle.layers.findIndex(layer => layer.id === curStyle.layers[i].id);
                if (idx >= 0) {
                    let oldFilter = curStyle.layers[i].filter; // 过滤图层的信息得保留
                    curStyle.layers[i] = newStyle.layers[idx];
                    if(oldFilter) curStyle.layers[i].filter = oldFilter; // 还原过滤图层的信息
                }
            }
            map.setStyle(curStyle);
        }
        
        // 实体类型ID和名称映射
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] === name) {
                    return +id; //转成数字
                }
            }
        }
        
        // 通过图层名称来查找图层id
        const getLayerIdByName = name => {
            return svc.getMapLayers().findIndex(layer => layer.name === name)
        }
        
        
        // 增加实体类型判断条件,只要满足任何一种类型即可,如 ['AcDbPolyline','AcDbText']
        const conditionFeatureType = featureTypes => {
            if (!Array.isArray(featureTypes)) featureTypes = [featureTypes];// 先转成数组，再统一用数组去算吧
            // https://vjmap.com/guide/svrStyleVar.html
            featureTypes = featureTypes.map(t => getTypeNameById(t)); // 把类型名称转为值，在矢量瓦片中实体类型是用值来表示的
            let cond = featureTypes.map(featureType => ['==', ['get', 'type'], featureType]);
            return [
                "any",
                ...cond //  只要类型中一个满足即可
            ]
        }
        
        // 增加实体图层判断条件,只要满足任何一种类型即可,如 ['图层一','图层二']
        const conditionLayers = (layers, inputIsIndex) => {
            if (!Array.isArray(layers)) layers = [layers];// 先转成数组，再统一用数组去算吧
            if (!inputIsIndex) {
                // 如果输入的不是图层索引，是图层名称，则需要转成图层索引
                layers = layers.map(layer => getLayerIdByName(layer)); // 把图层名称转为图层索引，在矢量瓦片中图层是用索引来表示的
            }
            return [
                "match",
                ['get', 'layer'],
                layers,
                true,
                false
            ]
        }
        
        // 增加实体id判断条件,只要满足任何一种类型即可,如 [28, 29]
        const conditionFeatureIds = featureIds => {
            if (!Array.isArray(featureIds)) featureIds = [featureIds];// 先转成数组，再统一用数组去算吧
            return [
                "match",
                ["id"],
                featureIds,
                true,
                false
            ]
        }
        
        // 增加实体对象颜色判断条件,只要满足任何一种类型即可,如 ["#ff0000","#0000ff"]
        const conditionColors = colors => {
            if (!Array.isArray(colors)) colors = [colors];// 先转成数组，再统一用数组去算吧
            let cond = colors.map(color => ['==',['get', 'color'], color]);
            return [
                "any", // 也可以用match
                ...cond //  只要类型中一个满足即可
            ]
        }
        
        const setLayerTextColors = async ()=> {
            let types = ["AcDbText", "AcDbMText", "AcDbAttributeDefinition", "AcDbAttribute"];
            let layer = "WZ";
            let color = "#ff0000";
            customColorCaseExpr.push(
                ["all",
                    conditionFeatureType(types), // 类型
                    conditionLayers(layer) // 图层
                ], // 条件
                color // 满足条件要设置的值
            );
            updateStyle();
        }
        
        const setObjectsVisible = async () => {
            // 获取所有矢量图层id
            let layers = svc.vectorStyle().layers.map(layer => layer.id);
            let featureId = [28, 29]; // 可通过鼠标高亮enableVectorLayerHoverHighlight来查看feature id
            map.setFilterEx(layers, ["!", conditionFeatureIds(featureId)]);// 取反，相当于过滤掉这些id
        }
        
        const setLineWidth = async () => {
            // 颜色条件
            let condition = conditionColors("#ffff00");
        
            // 修改颜色
            customColorCaseExpr.push(
                condition, // 条件
                "#00ffff" // 满足条件要设置的值
            );
        
            // 修改透明度
            customOpacityCaseExpr.push(
                condition, // 条件
                0.6 // 满足条件要设置的值  透明度0-1
            );
        
            // 修改线宽
            customLineWidthCaseExpr.push(
                condition, // 条件
                10 // 满足条件要设置的值
            );
            updateStyle();
        }
        
        
        // 复制现在矢量图层的所有图层
        const cloneVectorLayer = options => {
            let vectorStyle = svc.vectorStyle();
            let vectorLayerIds = vectorStyle.layers.map(layer => layer.id);
            let curStyle = map.getStyle();
            let newLayers = [];
            let newId = vjmap.RandomID();
            for(let i = 0; i < curStyle.layers.length; i++) {
                if (vectorLayerIds.includes(curStyle.layers[i].id)) {
                    let layer = {
                        ...curStyle.layers[i],
                        id: curStyle.layers[i].id + "_" + newId,
                        ...options
                    }
                    newLayers.push(layer)
                }
            }
            return newLayers;
        }
        
        const setZoomLayer = async () => {
            message.info('请放大地图，切换不同的级别，看到的图层内容也不一样')
            // 1 级显示 19,24 图层
            // 2 级显示 19,24,5 图层
            // 3 级显示 1,19,24,5,22 图层
            // 其他级别全部显示
        
            let style = map.getStyle();
            // 把之前的矢量图层设置为4级以上
            let vectorStyle = svc.vectorStyle();
            let vectorLayerIds = vectorStyle.layers.map(layer => layer.id);
            for(let i = 0; i < style.layers.length; i++) {
                if (vectorLayerIds.includes(style.layers[i].id)) {
                    style.layers[i].minzoom = 3; // 设置为3级以上能看到全部图层
                }
            }
        
            // 1级显示19,24图层
            let layersZoom1 = cloneVectorLayer({
                filter: conditionLayers([19, 24], true),
                maxzoom: 1
            })
            style.layers.push(...layersZoom1);
        
            // 2级显示19,24,5图层
            let layersZoom2 = cloneVectorLayer({
                filter: conditionLayers([19, 24, 5], true),
                minzoom: 1,
                maxzoom: 2
            })
            style.layers.push(...layersZoom2);
        
            // 3级显示1,19,24,5,22图层
            let layersZoom3 = cloneVectorLayer({
                filter: conditionLayers([1,19,24,5,22], true),
                minzoom: 2,
                maxzoom: 3
            })
            style.layers.push(...layersZoom3);
        
            map.setStyle(style);
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "185px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setLayerTextColors()}>图签图层文本改成红色
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setObjectsVisible()}>隐藏指北针
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setLineWidth()}>黄色的线变色透明加粗
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setZoomLayer()}>不同级别显示不同的图层
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