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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/02circlelayouthatch
        // --填充圆模型相交裁剪--
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
        
        class GridCircle {
            constructor(filterRadius, spacing, radius) {
                this.filterRadius = filterRadius;
                this.spacing = spacing;
                this.radius = radius;
                this.paths = {};
                this.models = {};
                // 创建最外面的大圆
                this.outerCircle = new vjgeo.paths.Circle([0, 0], radius);
                // 创建里面的一个小圆
                let innerCircle =new vjgeo.paths.Circle([0, 0], filterRadius);
                let count = Math.round(radius * 2 / (2 * filterRadius * (1 + spacing / 100)));
                count += 4 - count % 4  + 1; // 确保小圆中心在正中间
                // 使用砖块布局复制多个小圆
                let circleBrick = vjgeo.layout.cloneToBrick(innerCircle, count, count, (2 * filterRadius) * spacing / 100);
                let modelExtent = vjgeo.measure.modelExtents(circleBrick);
                // 把所以小圆的中心点置为圆点位置
                vjgeo.model.moveRelative(circleBrick, [-modelExtent.center[0], -modelExtent.center[1]])
        
                // this.paths = {"id": this.outerCircle};
                let offset = circleBrick.origin
                for (let id in circleBrick.models) {
                    let circle = circleBrick.models[id];
                    let circleOrigin = vjgeo.point.add(offset, circle.origin)
                    let idx = 0;
                    for(let p in circle.paths) {
                        let path = circle.paths[p];
                        // 通过遍历模型树，获取此模型的绝对基点位置
                        path.origin = vjgeo.point.add(path.origin, circleOrigin);
                        // 与大圆一个个去相关判断
                        this.checkCircle(id + "_" + idx++, path);
                    }
                }
                // 增加直线标注
                this.addDim();
            }
            checkCircle (id, circle) {
                // 大圆圆心与小圆的圆心位置
                let distanceToCenter = vjgeo.measure.pointDistance([0, 0], circle.origin);
        
                if (vjgeo.round(distanceToCenter + circle.radius) <= this.radius) {
                    // 如果整个小圆都在大圆内
                    this.paths[id] = circle;
                }
                else if (vjgeo.round(distanceToCenter - circle.radius) > this.radius) {
                    // 如果整个小圆都在大圆外
                }
                else {
                    // 如果有相交
                    let arcIntersection = vjgeo.path.intersection(circle, this.outerCircle);
                    if (arcIntersection && arcIntersection.path1Angles.length == 2) {
                        // 相交的小圆部分
                        let filterArc = new vjgeo.paths.Arc(circle.origin, circle.radius, arcIntersection.path1Angles[1], arcIntersection.path1Angles[0]);
                        this.paths[id] = filterArc;
                        // 相关的大圆部分
                        let outerArc = new vjgeo.paths.Arc([0, 0], this.radius, arcIntersection.path2Angles[0], arcIntersection.path2Angles[1]);
                        this.paths[id + '_outCircle'] = outerArc;
                    }
                }
            }
            addDim() {
                // 增加直径标注 vjmap.DbDiametricDimension
                let dim = new vjgeo.models.DbEntity("DbDiametricDimension", [
                    {
                        point: [-this.radius, 0],
                        attr: "chordPoint" // 圆上1点
                    },
                    {
                        point: [this.radius, 0],
                        attr: "farChordPoint" // 圆上2点
                    }
                ], {
                    dimScale: 50,
                    textColor: 255,
                    arrowColor: 0x00FF00,
                    lineColor: 0xFF0000,
                    leaderLength: this.radius / 5 // 引线长度
                });
                this.models.dim = dim;
            }
        }
        
        // ui的数据参数
        const metaParam = [
            { label: "小圆半径", name: "filterRadius", type: "range", min: 1, max: 20, value: 6 },
            { label: "间隔半径比例", name: "spacing", type: "range", min: 10, max: 100, value: 30 },
            { label: "大圆半径", name: "radius", type: "range", min: 20, max: 200, value: 100 }
        ]
        const createModel = (props) => {
            return new GridCircle(props.filterRadius, props.spacing, props.radius);
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
            //geojson.features = [...addAxis(), ...geojson.features]; // 增加坐标轴
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