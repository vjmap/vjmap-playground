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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/08networktop
        // --网络拓扑图--
        // 注: 此示例中引用了vjgeo库。此库是对几何模型做了一定程度的封装，方便其他工程共用
        // vjgeo库可在 html 中引入`vjgeo.min.js`即可,或npm install vjgeo`通过`import vjgeo from 'vjgeo'`引入
        // 几何模型帮助文档 https://vjmap.com/guide/geomodel.html
        // 几何模型API文档 https://vjmap.com/docs/geomodel/
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        const mapBounds = "[-10000,-10000,10000,10000]";
        const mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        // 建立坐标系
        const prj = new vjmap.GeoProjection(mapExtent);
        // 新建地图对象
        let map = new vjmap.Map({
            container: "map", // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: [],
            },
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false,
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        await map.onLoad();
        
        // 网络节点
        class NetNode {
            constructor(position, radius, name, fontHeight, isFill) {
                let circle = new vjgeo.paths.Circle(position, radius);
                if (isFill) {
                    circle.data = {
                        isFill: true,
                        color: 0x732BF5
                    }
                }
                let text = new vjgeo.models.Text(name, position, fontHeight, 0, false, {
                    // vjmap.DbText的属性
                    horizontalMode: vjmap.DbTextHorzMode.kTextMid,
                    verticalMode: vjmap.DbTextVertMode.kTextVertMid
                });
                text.data = {
                    ...text.data,
                    colorIndex: 2
                }
                this.paths = {
                    circle
                }
                this.models = {
                    text
                }
            }
        }
        
        // 网络连接线
        class NetLinkLine {
            constructor(name, fontHeight, startNodePosition, endNodePostion, nodeRadius, angle, curCount, arrowSize, arrowPos) {
                let linkPath;
                if (curCount == 0) {
                    // 开始节点和末节点只有一条连线，这时候直接用直接相连就可以了
                    linkPath = new vjgeo.paths.Line(startNodePosition, endNodePostion);
                } else {
                    // 开始节点和末节点有多条时需构造出一条弧线
                    // 先求弦的中间坐标
                    let chordMid = [(startNodePosition[0] + endNodePostion[0]) / 2.0, (startNodePosition[1] + endNodePostion[1]) / 2.0];
                    let deg = angle * Math.floor((curCount + 1) / 2) * (curCount % 2 == 1 ? - 1 : 1); // 按奇偶对称排列
                    let rad = vjgeo.angle.toRadians(deg);
                    // 求斜边长
                    let len = Math.abs(vjgeo.measure.pointDistance(startNodePosition, endNodePostion) / 2.0 / Math.cos(rad));
                    deg += vjgeo.angle.ofPointInDegrees(startNodePosition, endNodePostion);
                    rad = vjgeo.angle.toRadians(deg);
                    let polarPoint = vjgeo.point.fromPolar(rad, len); // 通过极坐标获取增量坐标
                    // 获取圆弧上中点了
                    let arcMidPoint = vjgeo.point.add(startNodePosition, polarPoint);
                    // 下面三点确定圆弧了
                    linkPath = new vjgeo.paths.Arc(startNodePosition, arcMidPoint, endNodePostion);
                }
                // 求节点的圆求交，把在圆那里的那段删除了
                let nodePositions = [startNodePosition, endNodePostion];
                // 开始始点和终止节点都要相交裁剪
                for(let pos of nodePositions) {
                    let nodeCircle = new vjgeo.paths.Circle(pos, nodeRadius);
                    let arcIntersection = vjgeo.path.intersection(linkPath, nodeCircle);
                    if (arcIntersection && arcIntersection.intersectionPoints) {
                        // 如果有交点
                        let newPath = vjgeo.path.breakAtPoint(linkPath, arcIntersection.intersectionPoints[0]);
                        let newPathMid = vjgeo.point.middle(newPath);
                        let distanceToCenter = vjgeo.measure.pointDistance(newPathMid, pos);
                        if (distanceToCenter > nodeRadius) {
                            // 如果新的中点不在圆内，则取这段
                            linkPath = newPath;
                        }
                    }
                }
                // 画箭头
                // 先求箭头位置
                let arrowPos1 =  vjgeo.point.middle(linkPath, arrowPos / 100);
                let arrowPos2 =  vjgeo.point.middle(linkPath, (arrowPos - arrowSize) / 100);
                // linkPath方向有可能不确定，需要确定下方向
                let arrowAngle = vjgeo.angle.ofPointInDegrees(arrowPos2, arrowPos1);
                let nodeAngle = vjgeo.angle.ofPointInDegrees(startNodePosition, endNodePostion);
        
                // 判断是否反向
                let arrowMidPos1 = vjgeo.point.middle(linkPath, 50 / 100);
                let arrowMidPos2 = vjgeo.point.middle(linkPath, 49 / 100);
                if (Math.abs(vjgeo.angle.ofPointInDegrees(arrowMidPos2, arrowMidPos1) - nodeAngle) > 60) {
                    // 反向
                    arrowPos1 =  vjgeo.point.middle(linkPath, 1.0 - arrowPos / 100);
                    arrowPos2 =  vjgeo.point.middle(linkPath, 1.0 - (arrowPos - arrowSize) / 100);
                    arrowAngle = vjgeo.angle.ofPointInDegrees(arrowPos2, arrowPos1);
                }
                let arrowLen = vjgeo.measure.pointDistance(arrowPos1, arrowPos2);
                let arowPos3 = vjgeo.point.add(arrowPos2, vjgeo.point.fromPolar(vjgeo.angle.toRadians(arrowAngle + 90), arrowLen / 3));
                let arowPos4 = vjgeo.point.add(arrowPos2, vjgeo.point.fromPolar(vjgeo.angle.toRadians(arrowAngle - 90), arrowLen / 3));
                let arrowPath = new vjgeo.models.Polyline([arrowPos1, arowPos3, arowPos4, arrowPos1]);
                arrowPath.data.isFill = true;
        
                // 名称
                let textAngle = vjgeo.angle.noRevolutions(arrowAngle);
                if (textAngle > 90 && textAngle < 270) textAngle = textAngle + 180; // 保证文件角度不要倒过来
                let text = new vjgeo.models.Text(name, arrowPos1, fontHeight, vjgeo.angle.toRadians(textAngle), false);
                text.data = {
                    ...text.data,
                    colorIndex: vjgeo.exporter.colors.lime
                }
                this.paths = {
                    linkPath
                }
                this.models = {
                    arrowPath,
                    text
                }
            }
        }
        
        // 网络拓扑图
        class NetTopo {
            constructor(data, nodeRadius, nodeFontHeight, isNodeFill, linkFontHeight, linkAngle, arrowSize, arrowPos) {
                this.models = {};
                let nodePosition = {}
                for(let node of data.nodes) {
                    this.models['node' + node.name] = new NetNode(node.position, nodeRadius, node.name, nodeFontHeight, isNodeFill)
                    nodePosition[node.name] = node.position;
                }
                let nodeLinkCounts = {}; // 记录节点连接数
                for(let link of data.links) {
                    let key = [link.startNode,link.endNode].sort().join(",");
                    let count = nodeLinkCounts[key] || 0;
                    nodeLinkCounts[key] = count + 1;
                    this.models['link' + link.name] = new NetLinkLine(link.name, linkFontHeight,
                        nodePosition[link.startNode], nodePosition[link.endNode], nodeRadius, linkAngle, count, arrowSize, arrowPos)
                }
            }
        }
        // ui的数据参数
        const metaParam = [
            { label: "节点半径", name: "nodeRadius", type: "range", min: 2, max: 40, value: 10 },
            { label: "节点字体高", name: "nodeFontHeight", type: "range", min: 2, max: 40, value: 10 },
            { label: "节点是否填充", name: "isNodeFill", type: "bool", value: false },
            { label: "连线字体高", name: "linkFontHeight", type: "range", min: 2, max: 40, value: 10 },
            { label: "连线线凸度", name: "linkAngle", type: "range", min: 10, max: 50, value: 20 },
            { label: "连线箭头大小", name: "arrowSize", type: "range", min: 5, max: 40, value: 10 },
            { label: "连线箭头位置", name: "arrowPos", type: "range", min: 5, max: 99, value: 50 }
        ]
        const createModel = (props) => {
            let data = {
                nodes: [
                    { name: "1", position: [0, 0]},
                    { name: "2", position: [100, 50]},
                    { name: "3", position: [100, -50]},
                    { name: "4", position: [200, 0]},
                    { name: "5", position: [300, 0]},
                ],
                links: [
                    { name: "A", startNode: "1", endNode: "2"},
                    { name: "B", startNode: "1", endNode: "3"},
                    { name: "C", startNode: "3", endNode: "2"},
                    { name: "D", startNode: "2", endNode: "3"},
                    { name: "E", startNode: "2", endNode: "4"},
                    { name: "F", startNode: "2", endNode: "4"},
                    { name: "G", startNode: "2", endNode: "4"},
                    { name: "H", startNode: "3", endNode: "4"},
                    { name: "I", startNode: "4", endNode: "5"}
                ]
            }
            let args = metaParam.map(m => props[m.name])
            return new NetTopo(data, ...args);
        }
        
        // 清空之前的地图数据
        const clearMapData = () => {
            svc.setCurrentMapParam({
                darkMode: true, // 由于没有打开过图，所以主动设置黑色模式
                bounds: mapExtent.toString()
            })
            map.disableLayerClickHighlight();
            map.removeDrawLayer();
            let sources = map.getStyle().sources;
            for(let source in sources) {
                map.removeSourceEx(source);
            }
        }
        
        const setGeojsonData = (json)=> {
            clearMapData();
            let bounds = vjmap.getGeoBounds(json).square().scale(3);
            map.updateMapExtent(bounds.toArray())
            map.getDrawLayer().set(map.toLngLat(json));
            map.fitMapBounds();
        }
        
        const openGeojsonMap = async (doc) => {
            clearMapData();
            let dwgDoc = new vjmap.DbDocument();
            dwgDoc.entitys = doc.entitys
            // js代码
            let res = await svc.updateMap({
                // 获取一个临时的图id(临时图形只会用临时查看，过期会自动删除)
                mapid: vjmap.getTempMapId(1), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
                filedoc: JSON.stringify(dwgDoc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
                }
            })
            if (res.error) {
                message.error(res.error)
            }
            await map.switchMap(res);
            // 点击有高亮状态（鼠标点击地图元素上时，会高亮)
            map.enableLayerClickHighlight(svc, e => {
                if (!e) return;
                let msg = {
                    content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                    key: "layerclick",
                    duration: 5
                }
                e && message.info(msg);
            })
        }
        
        const setDwgDocData = async (doc) => {
            clearMapData();
            let dwgDoc = new vjmap.DbDocument();
            dwgDoc.entitys = doc.entitys
            let geojson = await map.createDbGeomData(dwgDoc, true, true, {renderAccuracy: 0.005});
            // geojson.features = [...addAxis(), ...geojson.features]; // 增加坐标轴
            map.getDrawLayer().set(geojson);
            map.fitMapBounds();
        }
        
        // 增加坐标轴(以坐标0,0为中心)
        const addAxis = ()=> {
            let bounds = map.getGeoBounds(1.0);
            if (!bounds.contains(vjmap.geoPoint([0, 0]))) return [];
            let lines = [
                [[bounds.min.x, 0],[bounds.max.x, 0]],
                [[0, bounds.min.y],[0, bounds.max.y]]
            ]
            return lines.map(line => {
                return {
                    id: vjmap.RandomID(10),
                    type: "Feature",
                    properties: {
                        color: "#123B5F"
                    },
                    geometry: {
                        coordinates: map.toLngLat(line),
                        type: "LineString"
                    }
                }
            })
        }
        
        
        const updateData = props => {
            let model = createModel(props)
            if (props.drawtype == "前端geojson绘制") {
                let json = vjgeo.exporter.toDWG(model, {isGeoJson: true});
                setGeojsonData(json)
            } else if (props.drawtype == "创建DWG直接打开查看") {
                let dwgDoc = vjgeo.exporter.toDWG(model);
                openGeojsonMap(dwgDoc)
            } else {
                let dwgDoc = vjgeo.exporter.toDWG(model);
                setDwgDocData(dwgDoc)
            }
        }
        
        
        function showUI(ui, onChangeCb) {
            vjgui.init();
            let element = vjgui.createElement("div", "sidebar .sidebar", "", {left: "auto", right: "20px"})
            vjgui.add(element)
            let sidebar = new vjgui.Inspector();
            let value = {}
            for(let item of ui) {
                if (!item.control && item.type) {
                    if (item.type == "range") {
                        item.control = "Slider";
                        if (!item.step) item.step = 1;
                    }
                    else if (item.type == "select") item.control = "Combo";
                    else if (item.type == "bool") item.control = "Checkbox";
                    else item.control = "String";
                }
                item.label = item.label || item.name;
                value[item.name] =  sidebar["add" + item.control](item.label, item.value, item)
            }
        
            sidebar.appendTo("#sidebar");
            sidebar.onchange = function(name,value,widget) {
                let u = ui.find(n => n.label == name)
                if (!u) return;
                if (u.step == 1) {
                    widget.setValue(Math.floor(value), false);
                    u.value = Math.floor(value)
                } else {
                    u.value = value
                }
                let values = {}
                for(let item of ui) {
                    values[item.name] = item.value
                }
                if (onChangeCb) onChangeCb(values)
            };
        }
        let tmId;
        const onChangeDebounce = (value) => {
            if (tmId) clearTimeout(tmId);
            tmId = setTimeout(() => {
                // 提高性能
                updateData(value);
            }, 1000);
        };
        let uiJson = [
            {
                label: "绘制方式",
                name: "drawtype",
                control: "Combo",
                value: "",
                values: ["创建DWG返回Geojson", "前端geojson绘制", "创建DWG直接打开查看"]
            },
            ...metaParam
        ]
        showUI(uiJson, onChangeDebounce);
        // 初始化时主动触发一次
        let values = {}
        for(let item of uiJson) {
            values[item.name] = item.value
        }
        updateData(values);
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
        
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