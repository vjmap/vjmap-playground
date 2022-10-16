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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoVectorContour
        // --等值线(面)分析--根据坐标和属性数据生成数据等值线或等值面
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: "sys_world", // 地图ID
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
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center:  prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        map.doubleClickZoom.disable(); // 禁止地图双击放大
        let mapBounds = map.getGeoBounds(0.4);
        await map.onLoad();
        
        // 增加鼠标位置
        const mousePositionControl = new vjmap.MousePositionControl({
            labelFormat: (lng, lat, x, y)=> {
                return  `lng:${lng.toFixed(6 )},lat:${lat.toFixed(6)};`;
            }
        });
        map.addControl(mousePositionControl, "bottom-left");
        
        map.setRasterOpacity(svc.rasterLayerId(), 0.4);
        
        //生成测试数据
        let extent;
        // 如果要根据数据范围自动生成此范围，则无需传此参数
        // 这里做测试，选取了图上的两个点的值，不同的图点坐标不一样，请自行修改
        let pt1 = map.toLngLat([ 2271.3403719999988, 17638.89665600001]);
        let pt2 = map.toLngLat([27137.83253228557, 2828.6776779999927]);
        extent = [pt1[0], pt1[1], pt2[0], pt2[1]];
        
        let dataMinValue = 10; // 数据最小值
        let dataMaxValue = 500; // 数据最大值
        let dataset = {
            "type" : "FeatureCollection",
            "features" : []
        };
        
        // 区间颜色值
        let colors = ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf","#fee08b",
            "#fdae61", "#f46d43", "#d73027", "#a50026"];
        
        for (let i = 0; i < 100; i++) {
            let feature={
                "type" : "Feature",
                "properties" : {
                    "value" : vjmap.randInt(dataMinValue, dataMaxValue) // 在最大值最小值范围内随机生成一个测试数据
                },
                "geometry" : {
                    "type" : "Point",
                    "coordinates" : map.toLngLat(mapBounds.randomPoint())
                }
            };
            dataset.features.push(feature);
        }
        
        let contoursSize = 20; // 【值越大，等值线越密】等值面分级区间数，这里设置为20，可以自行设置
        let variog;
        const createContour = async (dataset, contoursSize, propField, colors, dataMinValue, dataMaxValue, maxHeight, model) => {
            let contours = [];
            for(let i = 0; i < contoursSize; i++) {
                contours.push(dataMinValue + (dataMaxValue - dataMinValue) * i /  (contoursSize - 1));
            }
        
            let interpolateInput = [], interpolateOutput = [];
            for(let i = 0; i < colors.length; i++) {
                interpolateInput.push(i / (colors.length - 1)); // 插值输入值，这里输入0-1之间的比例
                interpolateOutput.push(colors[i]) // 插值输出值，这里输入0-1之间的比例对应的颜色值
            }
        
            // 启动webworker计算函数
            let createContourWorker = vjmap.WorkerProxy(vjmap.vectorContour);
            let { grid, contour, variogram } = await createContourWorker(dataset, propField, contours, {
                model: model || 'exponential', // 'exponential','gaussian','spherical'，三选一，默认exponential
                sigma2:0, // sigma2是σ²，对应高斯过程的方差参数，也就是这组数据z的距离，方差参数σ²的似然性反映了高斯过程中的误差，并应手动设置。一般设置为 0 ，其他数值设了可能会出空白图
                alpha:100, // [如果点数少，建议把此值改小] Alpha α对应方差函数的先验值，此参数可能控制钻孔扩散范围,越小范围越大,少量点效果明显，但点多了且分布均匀以后改变该数字即基本无效果了，默认设置为100
                extent: extent // 如果要根据数据范围自动生成此范围，则无需传此参数
            }, []);
            variog = variogram;
        
            // 根据比例插值颜色
            const mapProgressToValues = value => vjmap.interpolate(
                interpolateInput,
                interpolateOutput,
                { ease: vjmap.linear }
            )(value)
        
            // 把原数据的颜色也设置下，绘制marker需要
            dataset.features.forEach(f => f.properties.color = mapProgressToValues((f.properties.value - dataMinValue) / (dataMaxValue - dataMinValue)))
        
            let h = maxHeight; // 设置最大值要拉伸的高度
            for(let i = 0; i < contour.features.length; i++) {
                let prop = contour.features[i].properties;
                let r = (prop.value - dataMinValue) / (dataMaxValue - dataMinValue);
                prop.color = mapProgressToValues(r); // 插值出颜色值
                prop.height = h * r; // 插值出要拉伸的高度值
            }
            return contour;
        }
        
        
        let maxHeight = map.pixelToHeight(100, map.getZoom()); // 设置最大值要拉伸的高度
        let contour = await createContour(dataset, contoursSize, "value" /*geojson的哪个属性值用于计算*/, colors, dataMinValue, dataMaxValue, maxHeight);
        contour.features.forEach(f => {
            f.properties.formatValue = Math.round(f.properties.value) // 多加一个用于格式化的注记的值
        })
        
        let markers = null;
        const addMarkers = ()=> {
            if (markers) return;
            markers = dataset.features.map(f => {
                // 再随机生成不同样式的
                let _marker = new vjmap.DiffusedApertureMarker({
                    lngLat: f.geometry.coordinates,
                    text: f.properties.value.toFixed(0)
                }, {
                    // 可以给不同的属性，如宽度，颜色，字体
                    width: 10,
                    colors: [f.properties.color, vjmap.randomColor()],
                    textFontSize: 14,
                    textColor: f.properties.color
                }).createMarker();
                _marker.addTo(map)
                return _marker
            })
        }
        const removeMarkers = ()=> {
            if (!markers) return;
            for(let i = markers.length - 1; i >= 0; i--) {
                markers[i].remove();
            }
            markers = null;
        }
        
        let symbols = null;
        const addSymbols = async ()=> {
            if (symbols) return;
            // 增加一个文字背景图片，背景色和地图背景色一样
            await map.addImageData("imgMaskText", `<svg viewBox="0 0 1024 1024" width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0L0 1024 1024 1024 1024 0z"  fill="#022B4F"></path>
                    </svg>`, 30, 15);
            symbols = new vjmap.Symbol({
                data: contour,
                iconImage: "imgMaskText",
                symbolSpacing: 250, // 符号空格,默认250像素
                textField:  [
                    'format',
                    ["to-string", ['round', ['get', 'value']]], // 把值取整显示，如果要小数点用这个 ['number-format',['get', 'value'], { 'min-fraction-digits': 1, 'max-fraction-digits': 1 }],
                    {}
                ],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 14,
                textColor: '#00ffff',
                symbolPlacement: "line",
                textAnchor: 'center',
                textRotationAlignment: "map",
                iconAllowOverlap: false,
                textAllowOverlap: false
            });
            symbols.addTo(map);
        }
        
        const removeSymbols = ()=> {
            if (!symbols) return;
            symbols.remove();
            symbols = null;
        }
        
        let polyline = null;
        const addPolyline = ()=> {
            if (polyline) return;
            polyline = new vjmap.Polyline({
                data: contour,
                lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00ffff', ['get', 'color']],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polyline.addTo(map);
            polyline.clickPopup(f => `<h3>值: ${f.properties.value.toFixed(2)}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        
        }
        const removePolyline = ()=> {
            if (!polyline) return;
            polyline.remove();
            polyline = null;
        }
        
        let polygon = null;
        const addPolygon = ()=> {
            if (polygon) return;
            polygon = new vjmap.Polygon({
                data: contour,
                fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00ffff', ['get', 'color']],
                fillOpacity: 0.9,
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygon.addTo(map);
            polygon.clickPopup(f => `<h3>值: ${f.properties.value.toFixed(2)}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        }
        const removePolygon = ()=> {
            if (!polygon) return;
            polygon.remove();
            polygon = null;
        }
        
        let fillExtrusions = null;
        const addFillExtrusion = ()=> {
            if (fillExtrusions) return;
            fillExtrusions = new vjmap.FillExtrusion({
                data: contour,
                fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00ffff', ['get', 'color']],
                fillExtrusionOpacity: 0.9,
                fillExtrusionHeight: ['get', 'height'],
                fillExtrusionBase:0,
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            fillExtrusions.addTo(map);
            fillExtrusions.clickPopup(f => `<h3>值: ${f.properties.value.toFixed(2)}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        }
        const removeFillExtrusion = ()=> {
            if (!fillExtrusions) return;
            fillExtrusions.remove();
            fillExtrusions = null;
        }
        
        const mockDataChange = async ()=> {
            dataset.features.forEach(f => f.properties.value = vjmap.randInt(dataMinValue, dataMaxValue));
            contour = await createContour(dataset, contoursSize, "value" /*geojson的哪个属性值用于计算*/, colors, dataMinValue, dataMaxValue, maxHeight);
            contour.features.forEach(f => {
                f.properties.formatValue = Math.round(f.properties.value) // 多加一个用于格式化的注记的值
            })
            if (markers) {
                removeMarkers();
                addMarkers();
            }
            if (polyline) {
                polyline.setData(contour)
            }
            if (symbols) {
                symbols.setData(contour)
            }
            if (polygon) {
                polygon.setData(contour)
            }
            if (fillExtrusions) {
                fillExtrusions.setData(contour)
            }
        }
        
        addMarkers();
        addPolyline();
        addSymbols();
        
        // 鼠标双击时，预测当前双击点的值
        map.on("dblclick", e => {
            let pt = e.lngLat;
            let { alg } = vjmap.vectorContour();
            if (typeof variog.model != 'function')  variog.model = alg[`model_${variog.model}`]
            let result = alg.core.predict(pt.lng, pt.lat, variog);
            message.info('当前点击的值为：' + result);
        })
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => addMarkers()}>绘制原始点
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removeMarkers()}>隐藏原始点
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => addPolyline()}>绘制等值线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removePolyline()}>隐藏等值线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => addPolygon()}>绘制等值面
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removePolygon()}>隐藏等值面
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => addFillExtrusion()}>绘制等值面拉伸
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removeFillExtrusion()}>隐藏等值面拉伸
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removeSymbols()}>隐藏等值线标注
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => addSymbols()}>绘制等值线标注
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => mockDataChange()}>模拟值变化
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