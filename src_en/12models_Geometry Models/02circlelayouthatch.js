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
        // --Filled circle model intersect and clip--
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
        
        class GridCircle {
            constructor(filterRadius, spacing, radius) {
                this.filterRadius = filterRadius;
                this.spacing = spacing;
                this.radius = radius;
                this.paths = {};
                this.models = {};
                // Create outer large circle
                this.outerCircle = new vjgeo.paths.Circle([0, 0], radius);
                // Create inner small circle
                let innerCircle =new vjgeo.paths.Circle([0, 0], filterRadius);
                let count = Math.round(radius * 2 / (2 * filterRadius * (1 + spacing / 100)));
                count += 4 - count % 4  + 1; // Ensure small circles are centered
                // Clone small circles in brick layout
                let circleBrick = vjgeo.layout.cloneToBrick(innerCircle, count, count, (2 * filterRadius) * spacing / 100);
                let modelExtent = vjgeo.measure.modelExtents(circleBrick);
                // Center all small circles at origin
                vjgeo.model.moveRelative(circleBrick, [-modelExtent.center[0], -modelExtent.center[1]])
        
                // this.paths = {"id": this.outerCircle};
                let offset = circleBrick.origin
                for (let id in circleBrick.models) {
                    let circle = circleBrick.models[id];
                    let circleOrigin = vjgeo.point.add(offset, circle.origin)
                    let idx = 0;
                    for(let p in circle.paths) {
                        let path = circle.paths[p];
                        // Get absolute base point of this model by traversing model tree
                        path.origin = vjgeo.point.add(path.origin, circleOrigin);
                        // Check against outer circle
                        this.checkCircle(id + "_" + idx++, path);
                    }
                }
                // Add line dimensions
                this.addDim();
            }
            checkCircle (id, circle) {
                // Distance from large circle center to small circle center
                let distanceToCenter = vjgeo.measure.pointDistance([0, 0], circle.origin);
        
                if (vjgeo.round(distanceToCenter + circle.radius) <= this.radius) {
                    // Small circle entirely inside large circle
                    this.paths[id] = circle;
                }
                else if (vjgeo.round(distanceToCenter - circle.radius) > this.radius) {
                    // Small circle entirely outside large circle
                }
                else {
                    // Intersecting
                    let arcIntersection = vjgeo.path.intersection(circle, this.outerCircle);
                    if (arcIntersection && arcIntersection.path1Angles.length == 2) {
                        // Intersecting arc of small circle
                        let filterArc = new vjgeo.paths.Arc(circle.origin, circle.radius, arcIntersection.path1Angles[1], arcIntersection.path1Angles[0]);
                        this.paths[id] = filterArc;
                        // Corresponding arc of large circle
                        let outerArc = new vjgeo.paths.Arc([0, 0], this.radius, arcIntersection.path2Angles[0], arcIntersection.path2Angles[1]);
                        this.paths[id + '_outCircle'] = outerArc;
                    }
                }
            }
            addDim() {
                // Add diameter dimension (vjmap.DbDiametricDimension)
                let dim = new vjgeo.models.DbEntity("DbDiametricDimension", [
                    {
                        point: [-this.radius, 0],
                        attr: "chordPoint" // First point on circle
                    },
                    {
                        point: [this.radius, 0],
                        attr: "farChordPoint" // Second point on circle
                    }
                ], {
                    dimScale: 50,
                    textColor: 255,
                    arrowColor: 0x00FF00,
                    lineColor: 0xFF0000,
                    leaderLength: this.radius / 5 // Leader length
                });
                this.models.dim = dim;
            }
        }
        
        // UI data parameters
        const metaParam = [
            { label: "Small circle radius", name: "filterRadius", type: "range", min: 1, max: 20, value: 6 },
            { label: "Spacing radius ratio", name: "spacing", type: "range", min: 10, max: 100, value: 30 },
            { label: "Large circle radius", name: "radius", type: "range", min: 20, max: 200, value: 100 }
        ]
        const createModel = (props) => {
            return new GridCircle(props.filterRadius, props.spacing, props.radius);
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
            //geojson.features = [...addAxis(), ...geojson.features]; // Add coordinate axes
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