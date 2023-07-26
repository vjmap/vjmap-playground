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
        let dataBounds = await svc.cmdGetDrawBounds(); // 获取地图有数据的范围区域
        let isClipContour = false; // 是否裁剪等值线
        let clipBounds = dataBounds.scale(0.5); // 默认用原来的范围一半做为裁剪范围。可自定义范围可用 vjmap.GeoBounds.fromArray([x1,y1,x2,y2]))
        
        // 如果要一开始不显示边界，可以用下面的设置。默认用小于范围一点点的范围去裁剪等值线
        //isClipContour = true; // 是否裁剪等值线
        //clipBounds = dataBounds.scale(0.9999);
        
        let extent = map.toLngLat(dataBounds).toArray();
        // 如果要根据数据范围自动生成此范围，则无需传此参数
        let pt1 = extent[0];
        let pt2 = extent[1];
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
        
        /* 如果是自定义数据，可参考下面的示例代码
        let list = [
            { name: '1', coordinateX:  4983.743653922847, coordinateY: 15416.30519881966, value: 671.139 },
            { name: '2', coordinateX: 20940.3830161238, coordinateY: 15275.718067875001, value: 926.95 },
            { name: '3', coordinateX: 8287.541231118597, coordinateY: 8597.829348010353, value: 760.66 },
            { name: '4', coordinateX: 18550.40179006735, coordinateY: 3958.454026841191, value: 866.43 },
            { name: '5', coordinateX:  24455.06128973639, coordinateY: 9019.590740843836, value: 723.51 }
        ];
        dataset.features = [];
        for (let i = 0; i < list.length; i++) {
            if (i == 0) {
                dataMinValue = list[i].value;
                dataMaxValue = list[i].value;
            } else {
                if (list[i].value < dataMinValue) dataMinValue = list[i].value;
                if (list[i].value > dataMaxValue) dataMaxValue = list[i].value;
            }
            let feature={
                "type" : "Feature",
                "properties" : {
                    "value" : list[i].value // 在最大值最小值范围内随机生成一个测试数据
                },
                "geometry" : {
                    "type" : "Point",
                    "coordinates" : map.toLngLat([list[i].coordinateX,list[i].coordinateY])
                }
            };
            dataset.features.push(feature);
        }
        */
        
        let contoursSize = 20; // 【值越大，等值线越密】等值面分级区间数，这里设置为20，可以自行设置
        let variog;
        let curModel = 'exponential'; // 当前模型方法名
        let curAlpha = 100; // 当前alpha值
        const createContour = async (dataset, contoursSize, propField, colors, dataMinValue, dataMaxValue, maxHeight, model, alpha) => {
            let contours = [];
            for(let i = 0; i < contoursSize; i++) {
                contours.push(dataMinValue + (dataMaxValue - dataMinValue) * i /  (contoursSize - 1));
            }
            if (dataMinValue >= 10 && dataMaxValue > 100) {
                // 等值线的值按10取整
                for(let i = 0; i < contours.length; i++) {
                    contours[i] = (parseInt(contours[i]/10) * 10);
                }
            }
        
            let interpolateInput = [], interpolateOutput = [];
            for(let i = 0; i < colors.length; i++) {
                interpolateInput.push(i / (colors.length - 1)); // 插值输入值，这里输入0-1之间的比例
                interpolateOutput.push(colors[i]) // 插值输出值，这里输入0-1之间的比例对应的颜色值
            }
        
            // 启动webworker计算函数
            let createContourWorker = vjmap.WorkerProxy(vjmap.vectorContour);
            let { grid, contour, variogram } = await createContourWorker(map.fromLngLat(dataset), propField, contours, {
                model: model || 'exponential', // 'exponential','gaussian','spherical'，三选一，默认exponential
                sigma2:0, // sigma2是σ²，对应高斯过程的方差参数，也就是这组数据z的距离，方差参数σ²的似然性反映了高斯过程中的误差，并应手动设置。一般设置为 0 ，其他数值设了可能会出空白图
                alpha: alpha || 100, // [如果绘制不出来，修改此值，可以把此值改小] Alpha α对应方差函数的先验值，此参数可能控制钻孔扩散范围,越小范围越大,少量点效果明显，但点多了且分布均匀以后改变该数字即基本无效果了，默认设置为100
                extent: map.fromLngLat(vjmap.GeoBounds.fromArray(extent)).toArray(), // 如果要根据数据范围自动生成此范围，则无需传此参数
                width: 500 // 生成等值线宽度参数。像素长度。默认200。宽度值越大，绘制越精确，但也会导致速度变慢，内存占用越多
            }, []);
            contour = map.toLngLat(contour);
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
        let contour = await createContour(dataset, contoursSize, "value" /*geojson的哪个属性值用于计算*/, colors, dataMinValue, dataMaxValue, maxHeight, curModel, curAlpha);
        contour.features.forEach(f => {
            f.properties.formatValue = Math.round(f.properties.value) // 多加一个用于格式化的注记的值
        })
        
        let markers = null;
        const addMarkers = ()=> {
            if (markers) return;
            markers = dataset.features.map(f => {
                if (isClipContour && !clipBounds.contains(map.fromLngLat(f.geometry.coordinates))) {
                    // 如果是裁剪等值线，则超出范围的marker不进行绘制
                    return null;
                }
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
                if (markers[i]) markers[i].remove();
            }
            markers = null;
        }
        
        let symbols = null;
        const addSymbols = async ()=> {
            if (symbols) return;
            let contourData = contour;
            if (isClipContour) contourData = clipContours(contour, clipBounds);
        
            // 增加一个文字背景图片，背景色和地图背景色一样
            await map.addImageData("imgMaskText", `<svg viewBox="0 0 1024 1024" width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0L0 1024 1024 1024 1024 0z"  fill="#022B4F"></path>
                    </svg>`, 30, 15);
            symbols = new vjmap.Symbol({
                data: contourData,
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
            let contourData = contour;
            if (isClipContour) contourData = clipContours(contour, clipBounds);
            polyline = new vjmap.Polyline({
                data: contourData,
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
            removeSymbols();
        }
        const drawPolyline = () => {
            addPolyline();
            removeSymbols();
            addSymbols();
        }
        
        let polygon = null;
        const addPolygon = ()=> {
            if (polygon) return;
            let contourData = contour;
            if (isClipContour) contourData = clipContoursPolygon(contour, clipBounds);
            polygon = new vjmap.Polygon({
                data: contourData,
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
            removeSymbols();
        }
        
        const drawPolygon = () => {
            addPolygon();
            removeSymbols();
            addSymbols();
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
            removeSymbols();
        }
        
        const drawFillExtrusion = ()=> {
            addFillExtrusion();
            removeSymbols();
            addSymbols();
        }
        
        let clipPolyline = null;
        const addClipPolyline = () => {
            if (clipPolyline) return;
            let points = clipBounds.toPointArray();
            points.push(points[0]);
            clipPolyline = new vjmap.Polyline({
                data: map.toLngLat(points),
                lineWidth: 2,
                lineColor: 'red'
            });
            clipPolyline.addTo(map);
        }
        const removeClipPolyline = ()=> {
            if (!clipPolyline) return;
            clipPolyline.remove();
            clipPolyline = null;
        }
        
        
        
        const refresh = async ()=> {
            contour = await createContour(dataset, contoursSize, "value" /*geojson的哪个属性值用于计算*/, colors, dataMinValue, dataMaxValue, maxHeight, curModel, curAlpha);
            contour.features.forEach(f => {
                f.properties.formatValue = Math.round(f.properties.value) // 多加一个用于格式化的注记的值
            })
            setNoClipContour();
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
        
        const mockDataChange = async ()=> {
            dataset.features.forEach(f => f.properties.value = vjmap.randInt(dataMinValue, dataMaxValue));
            refresh();
        }
        
        // 要裁剪的多段线数组和要裁剪的范围
        const clipContours = (polylineData, clipBounds) => {
            let data = {
                type: 'FeatureCollection',
                features: []
            }
            for(let k = 0; k < polylineData.features.length; k++) {
                // 遍历每一个子多边形
                for(let n = 0; n < polylineData.features[k].geometry.coordinates.length; n++) {
                    let coordinates = map.fromLngLat(polylineData.features[k].geometry.coordinates[n]);
                    // 一段一段的与范围去裁剪
                    let clipCoordinates = [];
                    let clipSubCoordinates = [];
                    for(let j = 1; j < coordinates.length; j++) {
                        let p1 = vjmap.geoPoint(coordinates[j - 1]);
                        let p2 = vjmap.geoPoint(coordinates[j]);
                        let res = vjmap.clipSegment(p1, p2, clipBounds);
                        if (res === false) {
                            // 在范围外，之前的线段弄个单独一条线段，后面的重新做为一条新的线段
                            if (clipSubCoordinates.length > 0) {
                                clipCoordinates.push(map.toLngLat(clipSubCoordinates));
                                clipSubCoordinates = [];
                            }
                            continue;
                        }
                        let pt1 = [res[0].x, res[0].y];
                        let pt2 = [res[1].x, res[1].y];
                        clipSubCoordinates.push(pt1, pt2);
                    }
                    if (clipSubCoordinates.length > 0) {
                        clipCoordinates.push(map.toLngLat(clipSubCoordinates));
                    }
                    if (clipCoordinates.length > 0) {
                        for(let i = 0; i < clipCoordinates.length; i++) {
                            let feature = vjmap.cloneDeep(polylineData.features[k]);
                            feature.geometry.type = "LineString" ;// 由多边形改成多段线
                            feature.geometry.coordinates = clipCoordinates[i];
                            data.features.push(feature);
                        }
                    }
                }
            }
            return data
        }
        
        // 要裁剪的多边形和要裁剪的范围
        const clipContoursPolygon = (polygonData, clipBounds) => {
            let data = {
                type: 'FeatureCollection',
                features: []
            }
            for (let k = 0; k < polygonData.features.length; k++) {
                // 遍历每一个子多边形
                for (let n = 0; n < polygonData.features[k].geometry.coordinates.length; n++) {
                    let feature = vjmap.cloneDeep(polygonData.features[k]);
                    feature.geometry.coordinates = []
                    let coordinates = map.fromLngLat(polygonData.features[k].geometry.coordinates[n]);
                    let clipCoordinates = vjmap.clipPolygon(coordinates, clipBounds)
                    if (clipCoordinates.length > 2) {
                        clipCoordinates.push(clipCoordinates[0]); //闭合
                        feature.geometry.coordinates.push(map.toLngLat(clipCoordinates));
                        feature.properties.area = vjmap.calcPolygonArea(clipCoordinates)
                        data.features.push(feature)
                    }
                }
            }
            // 按面积大小排下序。有时候裁剪后会导致一些面积大的覆盖之前面积小的，导致小的看不见
            data.features = data.features.sort((a, b) => b.properties.area - a.properties.area)
            return data
        }
        
        
        const setClipContour = () => {
            isClipContour = true;
            removeMarkers();
            addMarkers();
            removePolyline();
            removePolygon();
            addPolyline();
            removeSymbols();
            addSymbols();
            addClipPolyline();
        }
        
        const setNoClipContour = () => {
            if (!isClipContour) {
                return
            }
            isClipContour = false;
            removeMarkers();
            addMarkers();
            removePolyline();
            addPolyline();
            removeSymbols();
            addSymbols();
            removeClipPolyline();
        }
        
        const setClipContourPolygon = () => {
            isClipContour = true;
            removeMarkers();
            addMarkers();
            removePolyline();
            removePolygon();
            addPolygon();
            removeSymbols();
            addSymbols();
            addClipPolyline();
        }
        
        const setNoClipContourPolygon = () => {
            isClipContour = false;
            removeMarkers();
            addMarkers();
            removePolyline();
            removePolygon();
            addPolygon();
            removeSymbols();
            addSymbols();
            removeClipPolyline();
        }
        
        addMarkers();
        addPolyline();
        addSymbols();
        
        // 鼠标双击时，预测当前双击点的值
        map.on("dblclick", e => {
            let pt = map.fromLngLat(e.lngLat);
            let { alg } = vjmap.vectorContour();
            if (typeof variog.model != 'function')  variog.model = alg[`model_${variog.model}`]
            let result = alg.core.predict(pt.x, pt.y, variog);
            message.info('当前点击的值为：' + result);
        })
        
        /*
        // 根据离散点的值进行训练，然后预测新的点的值
        // 获取算法本身对象
        let { alg } = vjmap.vectorContour();
        let am = alg.core;
        // 生成测试数据
        function generateTestData(n){
           let x = [], y = [], t = [];
        
           for (let i = 0; i < n; i++){
               x[i] = (-180)+Math.random()*360;
               y[i] = (-90)+Math.random()*180;
               t[i] = (x[i] > 0) ? 100 : 0;
           }
           return [t,x,y];
        }
        // 生成100个随机数据
        let data = generateTestData(100);
        // 训练得到模型
        let variogram = am.train(data[0],data[1],data[2],"exponential", 0, 10);
        
        if (variogram) {
           // 预测新的点的值 80为要预测点的坐标x 60为要预测点的坐标y
           let predictValue = am.predict(80, 60, variogram);
           console.log(predictValue)
        }
        */
        
        // UI界面
        const { useState } = React;
        const { Slider, Select, InputNumber} = antd;
        const App = () => {
            const [inputValue, setInputValue] = useState(100);
            let timeId = 0;
            const onChange = (value) => {
                setInputValue(value);
                if (timeId) {
                    clearTimeout(timeId)
                }
                timeId = setTimeout(() => { curAlpha = value; refresh(); }, 2000)
            };
            const handleModelChange = (value) => {
                curModel = value;
                refresh();
            }
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
                                    onClick={() => drawPolyline()}>绘制等值线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removePolyline()}>隐藏等值线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => drawPolygon()}>绘制等值面
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => removePolygon()}>隐藏等值面
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => drawFillExtrusion()}>绘制等值面拉伸
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
                                    onClick={() => setClipContour()}>裁剪等值线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setNoClipContour()}>不裁剪等值线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setClipContourPolygon()}>裁剪等值面
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setNoClipContourPolygon()}>不裁剪等值面
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => mockDataChange()}>模拟值变化
                            </button>
                        </div>
                        <div>
                            模型方法:
                            <Select
                                defaultValue="exponential"
                                style={{ width: 120 }}
                                onChange={handleModelChange}
                                options={[
                                    { value: 'exponential', label: 'exponential' },
                                    { value: 'spherical', label: 'spherical' },
                                    //{ value: 'gaussian', label: 'gaussian' },
                                ]}
                            />
                        </div>
                        <div>
                            Alpha值：<Slider step={0.01}  value={inputValue}
                                            onChange={onChange} />
                            <InputNumber
                                min={0}
                                max={100}
                                style={{ margin: '0 16px' }}
                                step={0.01}
                                value={inputValue}
                                onChange={onChange}
                            />
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