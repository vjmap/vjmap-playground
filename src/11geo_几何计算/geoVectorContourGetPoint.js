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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/geo/geoVectorContourGetPoint
        // --自动采集等值线上的点和高程值--等值线本身没有高程值，只能通过等值线注记获取到高程值，再采集等值线上的点
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: 'sys_contour', // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
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
        await map.onLoad();
        // 使地图全部可见
        // map.fitMapBounds();
        
        
        // 获取指定图层和指定类型中的所有对象, isQueryGeojsonData 是否查询时获取geojson数据
        const getQueryEntities = async (layers, types, isQueryGeojsonData)=> {
            // 实体类型ID和名称映射
            const { entTypeIdMap } = await svc.getConstData();
            const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
            // 通过图层名称来查找图层id
            const getLayerIdByName = name => svc.getMapLayers().findIndex(layer => layer.name === name);
        
            let condtions = []
            // 图层的sql条件
            if (layers && layers.length > 0) {
                let layersIndexArr = layers.map(y => `layerindex='${getLayerIdByName(y)}'`);
                let layerCondtion = layersIndexArr.join(" or ");
                condtions.push(layerCondtion);
            }
        
            // 实体类型的sql条件
            if (types && types.length > 0) {
                let typeNames = types.map(t => `name='${getTypeNameById(t)}'`);
                let typeCondtion = typeNames.join(" or ");
                condtions.push(typeCondtion);
            }
        
            let query = await svc.conditionQueryFeature({
                condition: condtions.join(" and "), // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                fields: "",
                geom: true,
                includegeom: isQueryGeojsonData,
                realgeom: true,
                limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
            })
            if (query.error) {
                message.error(query.error);
                return;
            } else {
                return query.result; // 返回结果
            }
        }
        
        const getContourPoints = async () => {
            // 查询"等值线注记"和"等值线"图层上面的所有文字 (文字可以是多行文字，单行文字，属性文字，属性定义文字)
            let allNoteTexts = await getQueryEntities(["等值线注记", "等值线"], ["AcDbText", "AcDbMText", "AcDbAttributeDefinition", "AcDbAttribute"]);
            // 获取每个文字的外包矩形
            allNoteTexts.forEach(t => {
                t.bounds = map.getEnvelopBounds(t.envelop).scale(2); //并把外包矩形放大1.5倍，方便以后与等值线相交
                t.bounsCoordiantes = t.bounds.toPointArray().map(e => vjmap.geoPoint(e)); // 把外包矩形转成线段坐标
                t.bounsCoordiantes.push(t.bounsCoordiantes[0]); // 加上第一个点形成一个闭合的矩形
            });
        
            console.log(allNoteTexts)
        
            // 查询 "等值线" 图层上面的所有 曲线实体 ”AcDbSpline“ 其实中可能是 AcDbLine、AcDb2dPolyline、AcDb3dPolyline、AcDbSpline
            let allContours = await getQueryEntities(["等值线"], ["AcDbSpline"], true);
            // 获取所有等值线的坐标，有些是多边形，有些是多段线，全部转化为线坐标数组
            let contours = [];
            for(let c of allContours) {
                let coordinates;
                if (c.geom.geometries && c.geom.geometries[0].type == "Polygon") {
                    coordinates = map.fromLngLat(c.geom.geometries[0].coordinates[0]);
                    coordinates.push(coordinates[0]) ;// 闭合
                } else if (c.geom.geometries && c.geom.geometries[0].type == "LineString") {
                    coordinates = map.fromLngLat(c.geom.geometries[0].coordinates);
                }
                if (coordinates) {
                    contours.push({
                        name: c.name,
                        objectid: c.objectid,
                        bounds: map.getEnvelopBounds(c.envelop),
                        coordinates: coordinates,
                        lineLength: vjmap.Math2D.lineDist(coordinates) // 线的总长度
                    });
                }
            }
            console.log(contours);
        
            // 所有等值线与等值线文字注记相交判断，以获取等值线的高程值
            for(let c of contours) {
                for(let t of allNoteTexts) {
                    // 先通过外包矩形来判断是否相交
                    if (!(c.bounds.isIntersect(t.bounds) || c.bounds.isContains(t.bounds))) {
                        // 如果没有相交或包含，则不进行下面的求是否相交了，提高效率
                        continue;
                    }
                    let isIntersect = false;
                    for (let k = 0; k < c.coordinates.length - 1; k++) {
                        for(let m = 0; m < t.bounsCoordiantes.length - 1; m++) {
                            let res = vjmap.segmentIntersect(c.coordinates[k].x, c.coordinates[k].y, c.coordinates[k + 1].x, c.coordinates[k + 1].y,  t.bounsCoordiantes[m].x, t.bounsCoordiantes[m].y, t.bounsCoordiantes[m + 1].x, t.bounsCoordiantes[m + 1].y);
                            if (res.status) { // 交点res.x, res.y
                                isIntersect = true;
                                break;
                            }
                        }
                        if (isIntersect) break;
                    }
                    if (isIntersect) {
                        // 如果相交了
                        let elevation = +t.text; // 把文本值改成高程值
                        if (typeof elevation == 'number' && !isNaN(elevation)) {
                            c.elevation = elevation;
                            break;
                        }
                    }
                }
            }
            console.log(contours);
        
            // 有些等值线是没有和文字相交的。这时候只能找最近有高程值的等值线做为他的高程值
            // 思路为遍历所有没有高程值的等值线，首末点与哪个有值的等值线近，就把那个值做为这条线的等值线的值
            for(let c of contours) {
                if (typeof c.elevation == "number") continue; // 有高程值了
                let findResults = [];
                for(let n of contours) {
                    if (typeof n.elevation != "number") continue; // 没有高程值的不找
                    // 首末点与首末点与一一求距离
                    findResults.push({
                        elevation: n.elevation,
                        dist: c.coordinates[0].distanceTo(n.coordinates[0])
                    });
                    findResults.push({
                        elevation: n.elevation,
                        dist: c.coordinates[c.coordinates.length - 1].distanceTo(n.coordinates[0])
                    });
                    findResults.push({
                        elevation: n.elevation,
                        dist: c.coordinates[0].distanceTo(n.coordinates[n.coordinates.length - 1])
                    });
                    findResults.push({
                        elevation: n.elevation,
                        dist: c.coordinates[c.coordinates.length - 1].distanceTo(n.coordinates[n.coordinates.length - 1])
                    });
                }
                if (findResults.length == 0) continue;
                // 距离排序，拿最近的那个的高程值
                findResults = findResults.sort((a, b) => a.dist - b.dist);
                c.elevation = findResults[0].elevation;
            }
        
            // 对有等值线根据距离去采集每个点
            let spaceLength = mapExtent.width() / 100 ;// 每隔多少采集一个点，这里默认为图的宽度的1/50
            let pointDatas = [];
            for(let c of contours) {
                if (typeof c.elevation != "number") continue; // 没有高程值了
                let len = 0;
                for(len = 0; len < c.lineLength; len += spaceLength) {
                    let ratio = len / c.lineLength; // 获取此长度占线段长度的比例
                    // 通过比例插值获取在线段中的坐标值
                    let pts = vjmap.interpolatePointsByRatio(c.coordinates, ratio);
                    let pt = c.coordinates[0];
                    if (pts.length > 0) {
                        // 取结果的最后那个
                        pt = pts[pts.length - 1];
                    }
                    pointDatas.push({
                        point: vjmap.geoPoint(pt),
                        objectid: c.objectid,
                        elevation: c.elevation
                    })
                }
                if (!vjmap.isZero(len, c.lineLength)) {
                    // 如果最后那个点不是线的最后的点，还要加最后的点加上了
                    pointDatas.push({
                        point: c.coordinates[c.coordinates.length -1],
                        objectid: c.objectid,
                        elevation: c.elevation
                    })
                }
            }
        
            // 图标
            await map.loadImageEx("stretchTextBackImg", env.assetsPath + "images/textback.png", {
                // 可以水平拉伸的两列像素设置：(除了两边和中间两角形的部分，其他两部分都能拉伸)
                //-可以拉伸x:7和x:32之间的像素
                //-可以拉伸x:42和x:62之间的像素。
                stretchX: [
                    [7, 32],
                    [42, 62]
                ],
                // 可以垂直拉伸的一行像素设置：
                // y:3和y:19之间的像素可以拉伸
                stretchY: [[3, 19]],
                //图像的这一部分可以包含文本（[x1，y1，x2，y2]）：
                content: [7, 3, 62, 19]
            });
        
            let symbols;
            const showDataInMap = (datas)=> {
                let geoDatas = []
                for(let i = 0; i < datas.length; i++) {
                    const pt = datas[i].point;
                    const data = {
                        point: map.toLngLat(pt),
                        properties: {
                            text:  datas[i].elevation,
                            textColor: "#00ffff",
                            objectid: datas[i].objectid
                        }
                    }
                    geoDatas.push(data);
                }
                if (symbols) {
                    symbols.remove();// 如果有先删除了
                }
                symbols = new vjmap.Symbol({
                    data: geoDatas,
                    iconImage: "stretchTextBackImg",
                    iconAnchor: "bottom",
                    iconOpacity: 0.5,
                    iconOffset: [-2, -10],
                    textTranslate: [-2, -6],
                    textAnchor: "bottom",
                    textField: ['get', 'text'],
                    textFont: ['Arial Unicode MS Regular'],
                    textSize: 18,
                    textColor: ['get', 'textColor'],
                    iconTextFit: "both",
                    iconAllowOverlap: false,
                    textAllowOverlap: false
                });
                symbols.addTo(map);
            }
        
            showDataInMap(pointDatas);
            return {
                pointDatas,
                symbols
            };
        }
        
        let contourPoints;
        let drawSymbols;
        const autoGetContourPoints = async () => {
            if (contourPoints) return; // 如果之前绘制过
            let res = await getContourPoints();
            contourPoints = res.pointDatas;
            drawSymbols = res.symbols;
        }
        const createContours = async () => {
            if (!contourPoints) return;
            let dataBounds = await svc.cmdGetDrawBounds(); // 获取地图有数据的范围区域
            let extent = map.toLngLat(dataBounds).toArray();
        // 如果要根据数据范围自动生成此范围，则无需传此参数
            let pt1 = extent[0];
            let pt2 = extent[1];
            extent = [pt1[0], pt1[1], pt2[0], pt2[1]];
        
            let dataMinValue = Math.min.apply(null, contourPoints.map(item => item.elevation)); // 数据最小值
            let dataMaxValue = Math.max.apply(null, contourPoints.map(item => item.elevation)); // 数据最大值
            let dataset = {
                "type" : "FeatureCollection",
                "features" : []
            };
        
        // 区间颜色值
            let colors = ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf","#fee08b",
                "#fdae61", "#f46d43", "#d73027", "#a50026"];
        
            for (let i = 0; i < contourPoints.length; i++) {
                let feature={
                    "type" : "Feature",
                    "properties" : {
                        "value" : contourPoints[i].elevation
                    },
                    "geometry" : {
                        "type" : "Point",
                        "coordinates" : map.toLngLat(contourPoints[i].point)
                    }
                };
                dataset.features.push(feature);
            }
        
            let contoursSize = 100; // 【值越大，等值线越密】等值面分级区间数，可以自行设置
            let variog;
            let curModel = 'exponential'; // 当前模型方法名
            let curAlpha = 0.1; // 当前alpha值
            const createContour = async (dataset, contoursSize, propField, colors, dataMinValue, dataMaxValue, maxHeight, model) => {
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
                    model: curModel || 'exponential', // 'exponential','gaussian','spherical'，三选一，默认exponential
                    sigma2: 0, // sigma2是σ²，对应高斯过程的方差参数，也就是这组数据z的距离，方差参数σ²的似然性反映了高斯过程中的误差，并应手动设置。一般设置为 0 ，其他数值设了可能会出空白图
                    alpha: curAlpha || 100, // [如果绘制不出来，修改此值，可以把此值改小] Alpha α对应方差函数的先验值，此参数可能控制钻孔扩散范围,越小范围越大,少量点效果明显，但点多了且分布均匀以后改变该数字即基本无效果了，默认设置为100
                    extent: map.fromLngLat(vjmap.GeoBounds.fromArray(extent)).toArray() // 如果要根据数据范围自动生成此范围，则无需传此参数
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
            let contour = await createContour(dataset, contoursSize, "value" /*geojson的哪个属性值用于计算*/, colors, dataMinValue, dataMaxValue, maxHeight);
            contour.features.forEach(f => {
                f.properties.formatValue = Math.round(f.properties.value) // 多加一个用于格式化的注记的值
            })
        
            let polyline = new vjmap.Polyline({
                data: contour,
                lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00ffff', ['get', 'color']],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polyline.addTo(map);
            polyline.clickPopup(f => `<h3>值: ${f.properties.value.toFixed(2)}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        
        }
        
        const showContourPoints = () => {
            if (drawSymbols) {
                drawSymbols.show();
            }
        }
        
        const hideContourPoints = () => {
            if (drawSymbols) {
                drawSymbols.hide();
            }
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "180px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => autoGetContourPoints()}>自动采集等值线上的点
                            </button>
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => createContours()}>根据采集的点生成等值线
                            </button>
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => hideContourPoints()}>隐藏采集点
                            </button>
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => showContourPoints()}>显示采集点
                            </button>
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