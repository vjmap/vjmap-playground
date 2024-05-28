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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/03modelwindow
        // --窗户模型--
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
        
        
        // 根据设置的列数及当前的的列绘制半圆
        function Bows(columns, column) {
            this.paths = {};
            let offset = (columns % 2) / 2;	// 0是偶数，0.5为奇数
            for (let i = 1; i < columns / 2; i++) {
                let arc = new vjgeo.paths.Arc([0, 0], (i - offset) * column, 0, 180);
                this.paths["bow" + i] = arc;
            }
        }
        
        // 绘制圆顶上面的每条线段
        function Spines(spines, innerRadius, outerRadius) {
            this.paths = {};
            if (innerRadius === outerRadius) innerRadius = 0;
            for (let i = 1; i < spines; i++) {
                // 根据内外半径确定坐标，再根据角度旋转
                let a = (180 / spines) * i;
                let line = new vjgeo.paths.Line([innerRadius, 0], [outerRadius, 0]);
                vjgeo.path.rotate(line, a);
                this.paths["spine" + i] = line;
            }
        }
        
        function Wireframe(columns, column, extra, radius, split) {
            this.paths = {
                bottom: new vjgeo.paths.Line([-radius, 0], [radius, 0])
            };
            this.models = {
                // 圆顶上的每个半圆部分
                bows: new Bows(columns, column),
                // 圆顶上的每条线部分
                spines: new Spines(columns + (+extra), columns % 2 ? column / 2 : column, radius)
            };
            if (split && columns > 3 && columns % 2 === 0) {
                this.paths.split = new vjgeo.paths.Line([0, 0], [0, column]);
            }
        }
        
        function MyWindow(width, columns, extra, split, spacing, fillet) {
            let radius = width / 2;
            let column = (width + spacing) / columns;
            // 绘制圆顶
            let dome = new vjgeo.models.Dome(width, radius);
        
            let wireframe = new Wireframe(columns, column, extra, radius, split);
            // 根据间距向外扩展模型，变成双线
            let frame = vjgeo.model.expandPaths(wireframe, spacing / 2);
            this.models = {
                dome: dome,
                frame: frame
            };
            // 把扩展后的模型出圆顶外的部分裁剪掉
            vjgeo.model.combineSubtraction(dome, frame);
            // 对裁剪后的数据进行简化处理，把冗余点剔除了
            vjgeo.model.simplify(this);
            // 相找此模型的所有连接处的点，把连接处改成圆角
            let chains = vjgeo.model.findChains(this);
            chains.forEach(function (chain, i) {
                let fillets = vjgeo.chain.fillet(chain, fillet);
                if (!fillets) return;
                frame.models["fillets" + i] = fillets;
            });
        }
        
        function MyWindowGrid(width, height, rows, columns, extra, split, spacing, fillet, outerFrame, outerFrameWidth) {
            let column = (width - (columns - 1) * spacing) / columns;
            let row = (height - (rows) * spacing + spacing / 2) / rows;
            // 先绘制一个有倒角的矩形
            let cell = new vjgeo.models.RoundRectangle(column, row, fillet);
            // 对矩形进行网格布局绘制
            let grid = vjgeo.layout.cloneToGrid(cell, columns, rows, spacing);
            // 网格先只水平居中
            vjgeo.model.center(grid, true, false);
            // 网格往下移动一个高度值，值上面的在0,0位置
            grid.origin[1] = -height;
        
            this.models = {
                // 绘制上面的部分
                arch: new MyWindow(width, columns, extra, split, spacing, fillet),
                grid: grid
            };
        
            if (outerFrame) {
                // 绘制外边框
                let frame = new vjgeo.models.Dome(width + 2 * outerFrameWidth, height + width / 2 + 2 * outerFrameWidth);
                frame.origin = [0, -height - outerFrameWidth];
                this.models.frame = frame;
            }
        }
        
        // ui的数据参数
        const metaParam = [
            { label: "宽", name: "width", type: "range", min: 12, max: 500, value: 200 },
            { label: "高", name: "gridHeight", type: "range", min: 12, max: 500, value: 200 },
            { label: "行数", name: "rows", type: "range", min: 1, max: 10, value: 4 },
            { label: "列数", name: "columns", type: "range", min: 1, max: 10, value: 6 },
            { label: "增加楔块", name: "extraWedge", type: "bool", value: false },
            { label: "拆分圆顶", name: "splitDome", type: "bool", value: false },
            { label: "间距", name: "spacing", type: "range", min: 0.5, max: 10, value: 2, step: 0.5 },
            { label: "圆角", name: "fillet", type: "range", min: 0, max: 10, value: 1, step: 0.5 },
            { label: "显示外框", name: "outerFrame", type: "bool", value: true },
            { label: "外框宽", name: "outerframeWidth", type: "range", min: 1, max: 20, value: 6 },
            { label: "克隆行数", name: "cloneRows", type: "range", min: 1, max: 20, value: 2 },
            { label: "克隆列数", name: "cloneCols", type: "range", min: 1, max: 20, value: 4 }
        ]
        const createModel = (props) => {
            let models = new MyWindowGrid(...metaParam.map(m => props[m.name]));
            models.data = {
                ...models.data,
                color: 0x00FFFF
            }
            return vjgeo.layout.cloneToGrid(models, props.cloneCols, props.cloneRows, props.width / 2)
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