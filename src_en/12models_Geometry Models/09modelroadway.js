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
        // --Road single line to double line--
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
        let mapGeoBounds = map.getGeoBounds();
        
        // Roadway model
        class RoadwayLine {
            constructor(lines, showOldLine, expandDist, joints, removeNodeJoin) {
                this.models = {}
                for(let k = 0; k < lines.length; k++) {
                    let line = new vjgeo.models.Polyline(false, lines[k]);
                    line.data.color = 0x525B5F
                    if (showOldLine) {
                        // Show original line
                        this.models['line' + k] = line;
                    }
        
                    let expanded = vjgeo.model.expandPaths(line, expandDist, joints);
                    expanded.data = {
                        color: 0x00FFFF
                    }
                    this.models['expanded' + k] = expanded;
        
        
                    for(let n = 0; n < k; n++) {
                        if (this.models['expanded' + n]) {
                            // Union two models; each is modified accordingly
                            vjgeo.model.combineUnion(this.models['expanded' + n], this.models['expanded' + k]);
                            // New combined model for further unions
                            this.models['expanded' + k] = {
                                models: {
                                    ['expanded' + n]: this.models['expanded' + n],
                                    ['expanded' + k]: this.models['expanded' + k],
                                }
                            }
                            // Old model merged; remove it
                            delete this.models['expanded' + n];
                        }
                    }
        
                }
                if (removeNodeJoin) {
                    // Remove joint arcs at segment start/end nodes
                    vjgeo.model.walk(this, {
                        onPath: (wp) => {
                            if (wp.pathContext.type === 'arc') {
                                // Arc center
                                // If 180 degrees
                                if (vjmap.isZero(Math.abs(wp.pathContext.endAngle - wp.pathContext.startAngle) - 180)) {
                                    let middle = wp.pathContext.origin;
                                    let isStartOrEndPoint = false;
                                    for (let k = 0; k < lines.length; k++) {
                                        // First point
                                        if (vjgeo.measure.isPointEqual(middle, lines[k][0], 0.1)) {
                                            isStartOrEndPoint = true;
                                            break
                                        }
                                        // Last point
                                        if (vjgeo.measure.isPointEqual(middle, lines[k][lines[k].length - 1], 0.1)) {
                                            isStartOrEndPoint = true;
                                            break
                                        }
                                    }
                                    if (isStartOrEndPoint) {
                                        // Remove arc at line start or end; keep arcs in the middle
                                        delete wp.modelContext.paths[wp.pathId]
                                    }
                                }
                            }
                        }
                    });
                }
            }
        
        }
        
        // UI data parameters
        const metaParam = [
            { label: "Show original line", name: "showOldLine", type: "bool", value: true },
            { label: "Expand distance", name: "expandDist", type: "range", min: 20, max: 400, value: 100 },
            { label: "Joint shape", name: "joints", type: "select", value:0, values: [0,1,2] },
            { label: "Remove segment end joints", name: "removeNodeJoin", type: "bool", value: true },
            { label: "Randomize data", name: "randomData", type: "bool", value: false },
            { label: "Random line count", name: "randomLineCount",  type: "range", min: 1, max: 20, value: 8 },
            { label: "Max points per line", name: "randomPoints", type: "range", min: 2, max: 10, value: 5 },
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
            map.getDrawLayer().set(map.toLngLat(json));
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
            // geojson.features = [...addAxis(), ...geojson.features]; // Add coordinate axes
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
                // Debounce for performance
                updateData(value);
            }, 1000);
        };
        let uiJson = [
            {
                label: "Draw mode",
                name: "drawtype",
                control: "Combo",
                value: "",
                values: ["Create DWG return GeoJSON", "Frontend GeoJSON draw", "Create DWG and open for view"]
            },
            ...metaParam
        ]
        showUI(uiJson, onChangeDebounce);
        // Trigger once on init
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