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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/12mapStyleBackend
        // --修改后端渲染数据[通过样式]--通过自定义样式表达式使后端渲染不同的数据样式
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
            style: svc.rasterStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        })
        // 更改样式
        const expressionList = [] ;// 表达式数组
        const updateStyle = (style) => {
            map.updateStyle(svc, {
                name: "customStyle2",
                backcolor: 0,
                expression: expressionList.join("\n"),
                ...style
            })
        }
        
        // 表达式语法和变量请参考
        // 服务端条件查询和表达式查询 https://vjmap.com/guide/svrStyleVar.html
        // 服务端渲染表达式语法 https://vjmap.com/guide/expr.html
        
        // 修改颜色  红color.r, 绿color.g, 蓝color.b, 透明度color.a,如果输入了级别的话，表示此级别及以上的设置
        const modifyColor = (color, zoom) => {
            let result = "";
            let z = Number.isInteger(zoom) ? `[${zoom + 1}]` : '';
            if ("r" in color) result += `gOutColorRed${z}:=${color.r};`;
            if ("g" in color) result += `gOutColorGreen${z}:=${color.g};`;
            if ("b" in color) result += `gOutColorBlue${z}:=${color.b};`;
            if ("a" in color) result += `gOutColorAlpha${z}:=${color.a};`;
            return result;
        }
        
        // 修改线宽,如果输入了级别的话，表示此级别及以上的设置
        const modifyLineWidth = (lw, zoom) => {
            let result = "";
            if (lw) {
                if (!Number.isInteger(zoom)) {
                    result += `gOutLineWidth:=${lw};`;
                } else {
                    result += `gOutLineWidth[${zoom + 1}]:=${lw};`;
                }
            }
            return result;
        }
        
        // 修改是否显示,如果输入了级别的话，表示此级别及以上的设置
        const modifyVisible = (visible, zoom) => {
            let result = "";
            if (visible !== undefined) {
                if (!Number.isInteger(zoom)) {
                    result += `gOutVisible:=${visible ? 1 : 0};`;
                } else {
                    result += `gOutVisible[${zoom + 1}]:=${visible ? 1 : 0};`;
                }
            }
            return result;
        }
        
        // 增加实体类型判断条件,只要满足任何一种类型即可,如 ['AcDbPolyline','AcDbText']
        const conditionFeatureType = featureTypes => {
            if (!Array.isArray(featureTypes)) featureTypes = [featureTypes];// 先转成数组，再统一用数组去算吧
            return featureTypes.map(featureType => `gInFeatureType=='${featureType}'`).join(" or ");
        }
        
        // 增加实体图层判断条件,只要满足任何一种类型即可,如 ['图层一','图层二']
        const conditionLayers = layers => {
            if (!Array.isArray(layers)) layers = [layers];// 先转成数组，再统一用数组去算吧
            return layers.map(layer => `gInLayerName=='${layer}'`).join(" or ");
        }
        
        // 增加实体对象id判断条件,只要满足任何一种类型即可,如 ['283','285']
        const conditionObjectIds = objectIds => {
            if (!Array.isArray(objectIds)) objectIds = [objectIds];// 先转成数组，再统一用数组去算吧
            let strObjectIds = objectIds.join("||");
            return `gInObjectId  in  '${strObjectIds}'`
        }
        // 增加实体对象颜色判断条件,只要满足任何一种类型即可,如 [{r:255,g:122,b:100},{r:100}]
        const conditionColors = colors => {
            if (!Array.isArray(colors)) colors = [colors];// 先转成数组，再统一用数组去算吧
            return colors.map(color => {
                let result = [];
                if ("r" in color) result.push(`gInColorRed==${color.r}`);
                if ("g" in color) result.push(`gInColorGreen==${color.g}`);
                if ("b" in color) result.push(`gInColorBlue==${color.b}`);
                if ("a" in color) result.push(`gInColorAlpha==${color.a}`);
                return `(${result.join(" and ")})`
            }).join(" or ");
        }
        
        // 增加实体对象范围判断条件,只要满足任何一种类型即可,如 [{width:10,height:20,tol: 0.01},{width:300,height:200}]
        const conditionBounds = bounds => {
            if (!Array.isArray(bounds)) bounds = [bounds];// 先转成数组，再统一用数组去算吧
            return bounds.map(bound => {
                let result = [];
                if ("width" in bound) result.push(`(abs(gInExtendMaxX-gInExtendMinX-${bound.width})<${bound.tol ? bound.tol: 0.001})`);
                if ("height" in bound) result.push(`(abs(gInExtendMaxY-gInExtendMinY-${bound.height})<${bound.tol ? bound.tol: 0.001})`);
                return `(${result.join(" and ")})`
            }).join(" or ");
        }
        
        const updateExpr = async expr => {
            if (expressionList.findIndex(e => e === expr) >= 0) return;//加过
            expressionList.push(expr);
            await updateStyle();// 更新样式
        }
        
        const setLayerTextColors = async ()=> {
            // 类型条件
            let condition1 = conditionFeatureType(["AcDbText", "AcDbMText", "AcDbAttributeDefinition", "AcDbAttribute"]);
            // 图层条件
            let condition2 = conditionLayers("WZ");
            let value = modifyColor({r: 255, g: 0, b: 0});
            let expr = `if((${condition1}) and (${condition2})) {${value}} `;
            await updateExpr(expr);
        }
        
        const setObjectsVisible = async () => {
            // objectId
            let condition = conditionObjectIds(["10D_10F__111_#", "10D_10F__110_#"]);
            let value1 = modifyVisible(false, 1); // 1-3级不可见
            let value2 = modifyVisible(true, 3); // 3级以上可见了
            let expr = `if(${condition}) {${value1} ${value2}} `;
            await updateExpr(expr);
        }
        
        const setLineWidth = async () => {
            // 颜色条件
            let condition = conditionColors([{r: 255, g: 255, b:0}]);
            let value1 = modifyLineWidth(5);
            let value2 = modifyColor({r: 0, g: 255, b: 255, a: 100});
            let expr = `if(${condition}) {${value1} ${value2}} `;
            await updateExpr(expr);
        }
        
        const setBoundsColors = async () => {
            // 范围条件
            let condition = conditionBounds({width: 4000, tol: 20});
            let value = modifyColor({r: 255, g: 0, b: 0});
            let expr = `if(${condition}) {${value}} `;
            await updateExpr(expr);
        }
        
        const setZoomLayer = async () => {
            message.info('请放大地图，切换不同的级别，看到的图层内容也不一样')
            let style = {
                // 不同级别下 layeroff 控制图层索引是否关闭图层, layeron 来控制图层索引是否打开图层
                layeron:`{
                                "*": "()",
                                "1": "(19,24)",
                                "2": "(19,24,5)",
                                "3-4": "(1,19,24,5,22)",
                                "5": "(1,19,24,5,22,15)",
                                "6-7": "(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,19,22,24)"
                            }`
            }
            await updateStyle(style);
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
                                    onClick={() => setObjectsVisible()}>隐藏指北针(3级后才可见)
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setLineWidth()}>黄色的线变色透明加粗
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setBoundsColors()}>指定半径的圆改成红色
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