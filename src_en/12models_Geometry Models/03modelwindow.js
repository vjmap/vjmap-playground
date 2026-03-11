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
        // --Window model--
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
        
        
        // Draw semicircles by column count and current column
        function Bows(columns, column) {
            this.paths = {};
            let offset = (columns % 2) / 2;	// 0 for even, 0.5 for odd
            for (let i = 1; i < columns / 2; i++) {
                let arc = new vjgeo.paths.Arc([0, 0], (i - offset) * column, 0, 180);
                this.paths["bow" + i] = arc;
            }
        }
        
        // Draw each segment on the dome
        function Spines(spines, innerRadius, outerRadius) {
            this.paths = {};
            if (innerRadius === outerRadius) innerRadius = 0;
            for (let i = 1; i < spines; i++) {
                // Position by inner/outer radius, then rotate by angle
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
                // Each semicircle on the dome
                bows: new Bows(columns, column),
                // Each line segment on the dome
                spines: new Spines(columns + (+extra), columns % 2 ? column / 2 : column, radius)
            };
            if (split && columns > 3 && columns % 2 === 0) {
                this.paths.split = new vjgeo.paths.Line([0, 0], [0, column]);
            }
        }
        
        function MyWindow(width, columns, extra, split, spacing, fillet) {
            let radius = width / 2;
            let column = (width + spacing) / columns;
            // Draw dome
            let dome = new vjgeo.models.Dome(width, radius);
        
            let wireframe = new Wireframe(columns, column, extra, radius, split);
            // Expand model outward by spacing to form double lines
            let frame = vjgeo.model.expandPaths(wireframe, spacing / 2);
            this.models = {
                dome: dome,
                frame: frame
            };
            // Clip the expanded model to the dome (remove parts outside dome)
            vjgeo.model.combineSubtraction(dome, frame);
            // Simplify clipped data, remove redundant points
            vjgeo.model.simplify(this);
            // Find all joints of this model and apply fillets
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
            // Draw a rounded rectangle first
            let cell = new vjgeo.models.RoundRectangle(column, row, fillet);
            // Grid layout for rectangles
            let grid = vjgeo.layout.cloneToGrid(cell, columns, rows, spacing);
            // Center grid horizontally only
            vjgeo.model.center(grid, true, false);
            // Move grid down by height so top is at 0,0
            grid.origin[1] = -height;
        
            this.models = {
                // Top arch part
                arch: new MyWindow(width, columns, extra, split, spacing, fillet),
                grid: grid
            };
        
            if (outerFrame) {
                // Draw outer frame
                let frame = new vjgeo.models.Dome(width + 2 * outerFrameWidth, height + width / 2 + 2 * outerFrameWidth);
                frame.origin = [0, -height - outerFrameWidth];
                this.models.frame = frame;
            }
        }
        
        // UI data parameters
        const metaParam = [
            { label: "Width", name: "width", type: "range", min: 12, max: 500, value: 200 },
            { label: "Height", name: "gridHeight", type: "range", min: 12, max: 500, value: 200 },
            { label: "Rows", name: "rows", type: "range", min: 1, max: 10, value: 4 },
            { label: "Columns", name: "columns", type: "range", min: 1, max: 10, value: 6 },
            { label: "Extra wedge", name: "extraWedge", type: "bool", value: false },
            { label: "Split dome", name: "splitDome", type: "bool", value: false },
            { label: "Spacing", name: "spacing", type: "range", min: 0.5, max: 10, value: 2, step: 0.5 },
            { label: "Fillet", name: "fillet", type: "range", min: 0, max: 10, value: 1, step: 0.5 },
            { label: "Show outer frame", name: "outerFrame", type: "bool", value: true },
            { label: "Outer frame width", name: "outerframeWidth", type: "range", min: 1, max: 20, value: 6 },
            { label: "Clone rows", name: "cloneRows", type: "range", min: 1, max: 20, value: 2 },
            { label: "Clone cols", name: "cloneCols", type: "range", min: 1, max: 20, value: 4 }
        ]
        const createModel = (props) => {
            let models = new MyWindowGrid(...metaParam.map(m => props[m.name]));
            models.data = {
                ...models.data,
                color: 0x00FFFF
            }
            return vjgeo.layout.cloneToGrid(models, props.cloneCols, props.cloneRows, props.width / 2)
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