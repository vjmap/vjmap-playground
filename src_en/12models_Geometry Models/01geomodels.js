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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/01geomodels
        // --Common built-in geometry models-- SDK-wrapped built-in geometry models
        // Note: This example uses the vjgeo library, which wraps geometry models for reuse across projects.
        // Include vjgeo via html script `vjgeo.min.js`, or npm install vjgeo and `import vjgeo from 'vjgeo'`
        // Geometry model guide https://vjmap.com/guide/geomodel.html
        // Geometry model API https://vjmap.com/docs/geomodel/
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        const mapBounds = "[-10000,-10000,10000,10000]";
        const mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        // Create coordinate system
        const prj = new vjmap.GeoProjection(mapExtent);
        // New map instance
        let map = new vjmap.Map({
            container: "map", // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: [],
            },
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            renderWorldCopies: false,
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        await map.onLoad();
        
        // Clear previous map data
        const clearMapData = () => {
            svc.setCurrentMapParam({
                darkMode: true, // Set dark mode when no map has been opened yet
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
            geojson.features = [...addAxis(), ...geojson.features]; // Add coordinate axes
            map.getDrawLayer().set(geojson);
            map.fitMapBounds();
        }
        
        const openGeojsonMap = async (doc) => {
            clearMapData();
            let dwgDoc = new vjmap.DbDocument();
            dwgDoc.entitys = doc.entitys
            // JS code
            let res = await svc.updateMap({
                // Get a temporary map id (temp maps are for quick view only, auto-deleted when expired)
                mapid: vjmap.getTempMapId(1), // Temp map expiry in minutes when not viewed; default 30
                filedoc: JSON.stringify(dwgDoc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // If div background is light, set to 0xFFFFFF
                }
            })
            if (res.error) {
                message.error(res.error)
            }
            await map.switchMap(res);
            // Click to highlight (map elements highlight on click)
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
            geojson.features = [...addAxis(), ...geojson.features]; // Add coordinate axes
            map.getDrawLayer().set(geojson);
            map.fitMapBounds();
        }
        
        // Add coordinate axes (centered at 0,0)
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
                        color: "#123B5F",
                        opacity: 0.1
                    },
                    geometry: {
                        coordinates: map.toLngLat(line),
                        type: "LineString"
                    }
                }
            })
        }
        
        let curModelName;
        const createModel = (props) => {
            if (!curModelName) return;
            // Get model parameters passed in
            let params = [];
            for(let i = 0; i < Object.keys(props).length; i++) {
                let key = 'index' + i;
                if (!(key in props)) break;
                params.push(props[key]);
            }
            let model = new vjgeo.models[curModelName](...params);
        
            model.data = {
                ...model.data,
                colorIndex: props.colorIndex, // Or set color directly, e.g. color: 0x00FFFF
                isFill: props.isFill
            }
            // Output created JS code to console for easy copy
            let code = `let model = new vjgeo.models.${curModelName}(${params.map(p => JSON.stringify(p, null, 0)).join(",")});
        model.data = {
            ...model.data,
            colorIndex: ${props.colorIndex},
            isFill: ${props.isFill}
        }
                        `;
            console.log(code)
            return model;
        }
        
        const updateData = props => {
            let model = createModel(props)
            if (props.drawtype == "Frontend GeoJSON draw") {
                let json = vjgeo.exporter.toDWG(model, {isGeoJson: true});
                setGeojsonData(json)
            } else if (props.drawtype == "Create DWG and open for view") {
                let dwgDoc = vjgeo.exporter.toDWG(model);
                openGeojsonMap(dwgDoc)
            } else {
                let dwgDoc = vjgeo.exporter.toDWG(model);
                setDwgDocData(dwgDoc)
            }
        }
        
        const drawJson = [{
            label: "Draw mode",
            name: "drawtype",
            control: "Combo",
            value: "",
            values: ["Create DWG return GeoJSON", "Frontend GeoJSON draw", "Create DWG and open for view"]
        },{
            label: "Color",
            name: "colorIndex",
            control: "Combo",
            value: 7,
            values: [0, 1,2,3,4,5,6,7,8,9,10,11,12,50,100,150,200,255] // 0-255 (sample indices)
        },{
            label: "Fill",
            name: "isFill",
            control: "Checkbox",
            value: false
        }]
        let uiElement;
        function showUI(ui, onChangeCb) {
            if (uiElement) {
                vjgui.remove(uiElement);
            } else {
                vjgui.init();
            }
        
            uiElement = vjgui.createElement("div", "sidebar .sidebar", "", {left: "auto", right: "20px"})
            vjgui.add(uiElement)
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
                // Debounce for performance
                updateData(value);
            }, 1000);
        };
        
        
        const draw = (name) => {
            curModelName = name;
            const param = vjgeo.models[name].metaParameters;
            let uiJson = [
                ...drawJson
            ]
            for(let k = 0; k < param.length; k++) {
                let p = param[k];
                let itemJson = {
                    ...p,
                    label: p.title,
                    type: p.type,
                    value: p.value
                }
                if (p.type == "select") {
                    itemJson.value = p.value[0];
                    itemJson.values = p.value;
                }
                itemJson.name = "index" + k
                uiJson.push(itemJson);
            }
            showUI(uiJson, onChangeDebounce);
            // Trigger once on init
            let values = {}
            for(let item of uiJson) {
                values[item.name] = item.value
            }
            updateData(values);
        }
        
        draw("Star"); // Init
        
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
        let models = [];
        for (let modelType in vjgeo.models) models.push(modelType);
        models.sort();
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Built-in models</h4>
                    <div id="btns">
                        <div className="input-item">
                            {
                                models.map(item=> <button className="btn" onClick={() => draw(item)}>{item}</button>                                )
                            }
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