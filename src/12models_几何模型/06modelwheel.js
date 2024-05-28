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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/06modelwheel
        // --车轮模型--
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
        
        
        function WheelWedge(Wheel, outerRadius, innerRadius, count) {
        
            this.paths = {};
            let ring = new vjgeo.models.Ring(outerRadius, innerRadius);
            //与圆环做布尔运算
            vjgeo.model.combine(ring, Wheel, false, true, true, false);
            let punch1 = {
                models: {
                    ring: ring,
                    Wheel: Wheel
                }
            };
        
            // 克隆并将其旋转一个轮子
            let origin = [0, 0];
            let punch2 = vjgeo.model.rotate(vjgeo.cloneObject(punch1), 360 / count, origin);
            // 做布尔运算
            vjgeo.model.combine(punch1, punch2, true, false, true, false);
            let wedgeAndRing = {
                models: {
                    punch1: punch1,
                    punch2: punch2
                }
            };
        
            let corner = [outerRadius, -outerRadius];
            let oneDegree = vjgeo.point.rotate(corner, 1, origin);
            let knife = new vjgeo.models.Polyline(true, [origin, corner, oneDegree]);
            vjgeo.model.combine(wedgeAndRing, knife, false, true, false, false);
            // 遍历模型
            vjgeo.model.walk(wedgeAndRing, {
                onPath:  (path) => {
                    let id = vjgeo.model.getSimilarPathId(this, path.pathId);
                    this.paths[id] = path.pathContext;
                }
            });
        }
        
        
        function FlaredWheels(outerRadius, innerRadius, count, WheelWidth, flareWidth, innerFillet, outerFillet, addRing) {
            let a = 360 / count;
            let halfWheelWidth = WheelWidth / 2;
            let halfFlareWidth = flareWidth / 2;
            let flareLine = new vjgeo.paths.Line([halfFlareWidth, 0], [halfFlareWidth, outerRadius]);
            let outerCircle = new vjgeo.paths.Circle([0, 0], outerRadius);
            let int = vjgeo.path.intersection(flareLine, outerCircle); // 求交
            let flareY = int.intersectionPoints[0][1];
            let points = [
                [halfWheelWidth, 0],
                [halfFlareWidth, flareY],
                [halfFlareWidth, outerRadius + 1],
                [-halfFlareWidth, outerRadius + 1],
                [-halfFlareWidth, flareY],
                [-halfWheelWidth, 0]
            ];
            let Wheel = new vjgeo.models.Polyline(true, points);
            let wedge = new WheelWedge(Wheel, outerRadius, innerRadius, count);
        
            if (innerFillet) {
                let innerFilletArc = vjgeo.path.fillet(wedge.paths.ShapeLine1, wedge.paths.ShapeLine5, innerFillet);
                if (innerFilletArc) {
                    wedge.paths.innerFillet = innerFilletArc;
                } else {
                    wedge.paths.innerFillet1 = vjgeo.path.fillet(wedge.paths.ShapeLine1, wedge.paths.Ring_inner, innerFillet);
                    wedge.paths.innerFillet2 = vjgeo.path.fillet(wedge.paths.ShapeLine5, wedge.paths.Ring_inner, innerFillet);
                }
            }
        
            if (outerFillet) {
                wedge.paths.outerFillet1 = vjgeo.path.fillet(wedge.paths.ShapeLine1, wedge.paths.Ring_outer, outerFillet);
                wedge.paths.outerFillet2 = vjgeo.path.fillet(wedge.paths.ShapeLine5, wedge.paths.Ring_outer, outerFillet);
            }
        
            this.models = {};
        
            for (let i = 0; i < count; i++) {
                let iwedge = vjgeo.cloneObject(wedge);
                this.models['wedge' + i] = vjgeo.model.rotate(iwedge, i * a, [0, 0]);
            }
        
            if (addRing) {
                let ringWidth = (WheelWidth + flareWidth) / 2;
                this.models.ring2 = new vjgeo.models.Ring(outerRadius + ringWidth, innerRadius - ringWidth);
            }
        }
        // ui的数据参数
        const metaParam = [
            { name: "outerRadius", type: "range", min: 2, max: 100, step: 1, value: 100 },
            { name: "innerRadius", type: "range", min: 1, max: 90, step: 1, value: 40 },
            { name: "WheelCount", type: "range", min: 1, max: 40, step: 1, value: 5 },
            { name: "WheelWidth", type: "range", min: 1, max: 50, step: 1, value: 9 },
            { name: "flareWidth", type: "range", min: 1, max: 50, step: 1, value: 40 },
            { name: "innerFillet", type: "range", min: 0, max: 20, step: .1, value: 10 },
            { name: "outerFillet", type: "range", min: 0, max: 20, step: .1, value: 10 },
            { name: "addRing", type: "bool", value: true }
        ]
        const createModel = (props) => {
            let models = new FlaredWheels(...metaParam.map(m => props[m.name]));
            models.data = {
                ...models.data,
                color: 0x00FFFF
            }
            return models
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
            let geojson = map.toLngLat(json);
            geojson.features = [...addAxis(), ...geojson.features]; // 增加坐标轴
            map.getDrawLayer().set(geojson);
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
            geojson.features = [...addAxis(), ...geojson.features]; // 增加坐标轴
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
                console.log(dwgDoc)
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