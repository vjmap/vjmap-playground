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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/04modelbridge
        // --Bridge model--
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
        
        
        // Bridge
        class Bridge {
            constructor(width, height, count, side, topRim, bottomRim, drop, baluster) {
                let span = width - 2 * side;
                let balusters = count - 1;
                let open = span - balusters * baluster;
                let archWidth = open / count;
        
                this.paths = {
                    // Arc at bottom of bridge
                    bottom: new vjgeo.paths.Arc([width - side, 0], [width / 2, (height - bottomRim) * drop], [side, 0])
                };
        
                this.models = {
                    // Bridge border
                    rect: new vjgeo.models.Polyline(false, [[side, 0], [0, 0], [0, height], [width, height], [width, 0], [width - side, 0]]),
                    rimBottom: {
                        paths: {
                            // Large circle; later intersect with pier space inside bridge
                            bottom: new vjgeo.paths.Circle(this.paths.bottom.origin, this.paths.bottom.radius + bottomRim)
                        },
                        data: {
                            isFill: true, // Pier fill
                            colorIndex: 3 // Color
                        }
                    },
                    arches: {
                        models: {}
                    }
                };
        
                // Draw each pier
                for (let i = 0; i < count; i++) {
                    let p = [side + archWidth / 2 + i * (archWidth + baluster), 0];
                    this.models.arches.models['arch' + i] = vjgeo.model.move(new vjgeo.models.Dome(archWidth, height - topRim, archWidth / 2), p);
                }
        
                // Boolean subtract: keep pier parts only
                vjgeo.model.combineSubtraction(this.models.arches, this.models.rimBottom);
        
                // Move model center to origin on x
                this.origin = [-width / 2, 0];
            }
        }
        
        // UI data parameters
        const metaParam = [
            { name: "width", type: "range", min: 10, max: 500, value: 300 },
            { name: "height", type: "range", min: 10, max: 500, value: 125 },
            { name: "count", type: "range", min: 2, max: 40, value: 15 },
            { name: "side", type: "range", min: 0, max: 20, value: 13 },
            { name: "top rim", type: "range", min: 0.1, max: 20, value: 12 },
            { name: "bottom rim", type: "range", min: 0.1, max: 20, value: 7 },
            { name: "drop", type: "range", min: 0.1, max: 1, value: 0.8, step: 0.1 },
            { name: "baluster", type: "range", min: 0.1, max: 20, value: 4, step: 0.1 }
        ]
        const createModel = (props) => {
            let models = new Bridge(...metaParam.map(m => props[m.name]));
            models.data = {
                ...models.data,
                color: 0x00FFFF
            }
            return models
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