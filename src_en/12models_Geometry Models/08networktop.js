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
        // --Network topology--
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
        
        // Network node
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
                    // vjmap.DbText attributes
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
        
        // Network link line
        class NetLinkLine {
            constructor(name, fontHeight, startNodePosition, endNodePostion, nodeRadius, angle, curCount, arrowSize, arrowPos) {
                let linkPath;
                if (curCount == 0) {
                    // Single link between start and end: use straight line
                    linkPath = new vjgeo.paths.Line(startNodePosition, endNodePostion);
                } else {
                    // Multiple links: build an arc
                    // Chord midpoint
                    let chordMid = [(startNodePosition[0] + endNodePostion[0]) / 2.0, (startNodePosition[1] + endNodePostion[1]) / 2.0];
                    let deg = angle * Math.floor((curCount + 1) / 2) * (curCount % 2 == 1 ? - 1 : 1); // Alternate by parity
                    let rad = vjgeo.angle.toRadians(deg);
                    // Hypotenuse length
                    let len = Math.abs(vjgeo.measure.pointDistance(startNodePosition, endNodePostion) / 2.0 / Math.cos(rad));
                    deg += vjgeo.angle.ofPointInDegrees(startNodePosition, endNodePostion);
                    rad = vjgeo.angle.toRadians(deg);
                    let polarPoint = vjgeo.point.fromPolar(rad, len); // Offset via polar
                    // Arc midpoint
                    let arcMidPoint = vjgeo.point.add(startNodePosition, polarPoint);
                    // Three points define the arc
                    linkPath = new vjgeo.paths.Arc(startNodePosition, arcMidPoint, endNodePostion);
                }
                // Intersect with node circles and remove segment inside circle
                let nodePositions = [startNodePosition, endNodePostion];
                // Clip at both start and end nodes
                for(let pos of nodePositions) {
                    let nodeCircle = new vjgeo.paths.Circle(pos, nodeRadius);
                    let arcIntersection = vjgeo.path.intersection(linkPath, nodeCircle);
                    if (arcIntersection && arcIntersection.intersectionPoints) {
                        // If there is an intersection
                        let newPath = vjgeo.path.breakAtPoint(linkPath, arcIntersection.intersectionPoints[0]);
                        let newPathMid = vjgeo.point.middle(newPath);
                        let distanceToCenter = vjgeo.measure.pointDistance(newPathMid, pos);
                        if (distanceToCenter > nodeRadius) {
                            // If new midpoint is outside circle, keep this segment
                            linkPath = newPath;
                        }
                    }
                }
                // Draw arrow
                // Arrow position
                let arrowPos1 =  vjgeo.point.middle(linkPath, arrowPos / 100);
                let arrowPos2 =  vjgeo.point.middle(linkPath, (arrowPos - arrowSize) / 100);
                // linkPath direction may be ambiguous; determine it
                let arrowAngle = vjgeo.angle.ofPointInDegrees(arrowPos2, arrowPos1);
                let nodeAngle = vjgeo.angle.ofPointInDegrees(startNodePosition, endNodePostion);
        
                // Check if reversed
                let arrowMidPos1 = vjgeo.point.middle(linkPath, 50 / 100);
                let arrowMidPos2 = vjgeo.point.middle(linkPath, 49 / 100);
                if (Math.abs(vjgeo.angle.ofPointInDegrees(arrowMidPos2, arrowMidPos1) - nodeAngle) > 60) {
                    // Reversed
                    arrowPos1 =  vjgeo.point.middle(linkPath, 1.0 - arrowPos / 100);
                    arrowPos2 =  vjgeo.point.middle(linkPath, 1.0 - (arrowPos - arrowSize) / 100);
                    arrowAngle = vjgeo.angle.ofPointInDegrees(arrowPos2, arrowPos1);
                }
                let arrowLen = vjgeo.measure.pointDistance(arrowPos1, arrowPos2);
                let arowPos3 = vjgeo.point.add(arrowPos2, vjgeo.point.fromPolar(vjgeo.angle.toRadians(arrowAngle + 90), arrowLen / 3));
                let arowPos4 = vjgeo.point.add(arrowPos2, vjgeo.point.fromPolar(vjgeo.angle.toRadians(arrowAngle - 90), arrowLen / 3));
                let arrowPath = new vjgeo.models.Polyline([arrowPos1, arowPos3, arowPos4, arrowPos1]);
                arrowPath.data.isFill = true;
        
                // Label
                let textAngle = vjgeo.angle.noRevolutions(arrowAngle);
                if (textAngle > 90 && textAngle < 270) textAngle = textAngle + 180; // Keep text upright
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
        
        // Network topology
        class NetTopo {
            constructor(data, nodeRadius, nodeFontHeight, isNodeFill, linkFontHeight, linkAngle, arrowSize, arrowPos) {
                this.models = {};
                let nodePosition = {}
                for(let node of data.nodes) {
                    this.models['node' + node.name] = new NetNode(node.position, nodeRadius, node.name, nodeFontHeight, isNodeFill)
                    nodePosition[node.name] = node.position;
                }
                let nodeLinkCounts = {}; // Count links per node pair
                for(let link of data.links) {
                    let key = [link.startNode,link.endNode].sort().join(",");
                    let count = nodeLinkCounts[key] || 0;
                    nodeLinkCounts[key] = count + 1;
                    this.models['link' + link.name] = new NetLinkLine(link.name, linkFontHeight,
                        nodePosition[link.startNode], nodePosition[link.endNode], nodeRadius, linkAngle, count, arrowSize, arrowPos)
                }
            }
        }
        // UI data parameters
        const metaParam = [
            { label: "Node radius", name: "nodeRadius", type: "range", min: 2, max: 40, value: 10 },
            { label: "Node font height", name: "nodeFontHeight", type: "range", min: 2, max: 40, value: 10 },
            { label: "Node fill", name: "isNodeFill", type: "bool", value: false },
            { label: "Link font height", name: "linkFontHeight", type: "range", min: 2, max: 40, value: 10 },
            { label: "Link bulge", name: "linkAngle", type: "range", min: 10, max: 50, value: 20 },
            { label: "Link arrow size", name: "arrowSize", type: "range", min: 5, max: 40, value: 10 },
            { label: "Link arrow position", name: "arrowPos", type: "range", min: 5, max: 99, value: 50 }
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