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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/09modelroadway
        // --道路单线变双线--
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
        let mapGeoBounds = map.getGeoBounds();
        
        // 道路模型
        class RoadwayLine {
            constructor(lines, showOldLine, expandDist, joints, removeNodeJoin) {
                this.models = {}
                for(let k = 0; k < lines.length; k++) {
                    let line = new vjgeo.models.Polyline(false, lines[k]);
                    line.data.color = 0x525B5F
                    if (showOldLine) {
                        // 显示原来的线
                        this.models['line' + k] = line;
                    }
        
                    let expanded = vjgeo.model.expandPaths(line, expandDist, joints);
                    expanded.data = {
                        color: 0x00FFFF
                    }
                    this.models['expanded' + k] = expanded;
        
        
                    for(let n = 0; n < k; n++) {
                        if (this.models['expanded' + n]) {
                            // 合并 2 个模型，形成一个联合。每个模型都将相应地修改.
                            vjgeo.model.combineUnion(this.models['expanded' + n], this.models['expanded' + k]);
                            // 把合并后成模型生成一个新的模型，用于和以后的进行合并运算
                            this.models['expanded' + k] = {
                                models: {
                                    ['expanded' + n]: this.models['expanded' + n],
                                    ['expanded' + k]: this.models['expanded' + k],
                                }
                            }
                            // 此模型已合并成新模型了，得删除了
                            delete this.models['expanded' + n];
                        }
                    }
        
                }
                if (removeNodeJoin) {
                    // 如果要移动线段首尾节点的连接头
                    vjgeo.model.walk(this, {
                        onPath: (wp) => {
                            if (wp.pathContext.type === 'arc') {
                                // 获取圆弧的中点
                                //  如果是180度
                                if (vjmap.isZero(Math.abs(wp.pathContext.endAngle - wp.pathContext.startAngle) - 180)) {
                                    let middle = wp.pathContext.origin;
                                    let isStartOrEndPoint = false;
                                    for (let k = 0; k < lines.length; k++) {
                                        // 第一个点
                                        if (vjgeo.measure.isPointEqual(middle, lines[k][0], 0.1)) {
                                            isStartOrEndPoint = true;
                                            break
                                        }
                                        // 最后一个点
                                        if (vjgeo.measure.isPointEqual(middle, lines[k][lines[k].length - 1], 0.1)) {
                                            isStartOrEndPoint = true;
                                            break
                                        }
                                    }
                                    if (isStartOrEndPoint) {
                                        // 如果是线的始点或终点的圆弧，则删除。中间生成的不用删除
                                        delete wp.modelContext.paths[wp.pathId]
                                    }
                                }
                            }
                        }
                    });
                }
            }
        
        }
        
        // ui的数据参数
        const metaParam = [
            { label: "显示原来的线", name: "showOldLine", type: "bool", value: true },
            { label: "线往外扩展距离", name: "expandDist", type: "range", min: 20, max: 400, value: 100 },
            { label: "连接头形状", name: "joints", type: "select", value:0, values: [0,1,2] },
            { label: "移动线段两端连接头", name: "removeNodeJoin", type: "bool", value: true },
            { label: "重新随机生成新的数据", name: "randomData", type: "bool", value: false },
            { label: "重新线条数", name: "randomLineCount",  type: "range", min: 1, max: 20, value: 8 },
            { label: "每条线随机的最大点数", name: "randomPoints", type: "range", min: 2, max: 10, value: 5 },
        ]
        let lines = [];
        const createModel = (props) => {
            lines.length = 0;
            if (props.randomData || lines.length == 0) {
                for(let i = 0; i < props.randomLineCount; i++) {
                    const points = mapGeoBounds.randomPoints(2, props.randomPoints).map(p => [p.x, p.y]);
                    lines.push(points);
                }
            }
        
            let args = metaParam.map(m => props[m.name])
            return new RoadwayLine(lines, ...args);
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