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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/12mapStyleFront
        // --Modify front-end render data [vector tiles]--Change render by editing vector tile style on front-end
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.vectorStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
        
        const customColorCaseExpr = [] ; // Custom color expression
        const customOpacityCaseExpr = [] ; // Custom opacity expression
        const customLineWidthCaseExpr = [] ; // Custom line width expression
        const updateStyle = () => {
            let newStyle = svc.vectorStyle({
                customColorCaseExpr,
                customOpacityCaseExpr,
                customLineWidthCaseExpr
            });
            let curStyle = map.getStyle();
            // Replace current layer styles with new style by layer id
            for(let i = 0; i < curStyle.layers.length; i++) {
                let idx = newStyle.layers.findIndex(layer => layer.id === curStyle.layers[i].id);
                if (idx >= 0) {
                    let oldFilter = curStyle.layers[i].filter; // Keep layer filter
                    curStyle.layers[i] = newStyle.layers[idx];
                    if(oldFilter) curStyle.layers[i].filter = oldFilter; // Restore filter
                }
            }
            map.setStyle(curStyle);
        }
        
        // Entity type ID to name mapping
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] === name) {
                    return +id; // To number
                }
            }
        }
        
        // Get layer id by layer name
        const getLayerIdByName = name => {
            return svc.getMapLayers().findIndex(layer => layer.name === name)
        }
        
        
        // Add entity type condition (any of the types), e.g. ['AcDbPolyline','AcDbText']
        const conditionFeatureType = featureTypes => {
            if (!Array.isArray(featureTypes)) featureTypes = [featureTypes];
            featureTypes = featureTypes.map(t => getTypeNameById(t)); // Type name to value (vector tiles use value)
            let cond = featureTypes.map(featureType => ['==', ['get', 'type'], featureType]);
            return [
                "any",
                ...cond // Any type match
            ]
        }
        
        // Add entity layer condition (any of the layers), e.g. ['Layer1','Layer2']
        const conditionLayers = (layers, inputIsIndex) => {
            if (!Array.isArray(layers)) layers = [layers];// convert to array first, then use array uniformly
            if (!inputIsIndex) {
                // If input is layer name instead of index, convert to layer index
                layers = layers.map(layer => getLayerIdByName(layer)); // convert layer name to index; in vector tiles layers are represented by index
            }
            return [
                "match",
                ['get', 'layer'],
                layers,
                true,
                false
            ]
        }
        
        // Add entity id condition (any of the ids), e.g. [28, 29]
        const conditionFeatureIds = featureIds => {
            if (!Array.isArray(featureIds)) featureIds = [featureIds];// convert to array first, then use array uniformly
            return [
                "match",
                ["id"],
                featureIds,
                true,
                false
            ]
        }
        
        // Add entity object color condition (any of the colors), e.g. ["#ff0000","#0000ff"]
        const conditionColors = colors => {
            if (!Array.isArray(colors)) colors = [colors];// convert to array first, then use array uniformly
            let cond = colors.map(color => ['==',['get', 'color'], color]);
            return [
                "any", // can also use match
                ...cond // any one match satisfies
            ]
        }
        
        const setLayerTextColors = async ()=> {
            let types = ["AcDbText", "AcDbMText", "AcDbAttributeDefinition", "AcDbAttribute"];
            let layer = "WZ";
            let color = "#ff0000";
            customColorCaseExpr.push(
                ["all",
                    conditionFeatureType(types), // type
                    conditionLayers(layer) // layer
                ], // condition
                color // value when condition is met
            );
            updateStyle();
        }
        
        const setObjectsVisible = async () => {
            // get all vector layer ids
            let layers = svc.vectorStyle().layers.map(layer => layer.id);
            let featureId = [28, 29]; // use enableVectorLayerHoverHighlight to see feature id on hover
            map.setFilterEx(layers, ["!", conditionFeatureIds(featureId)]);// negate, i.e. filter out these ids
        }
        
        const setLineWidth = async () => {
            // Color condition
            let condition = conditionColors("#ffff00");
        
            // Modify color
            customColorCaseExpr.push(
                condition, // condition
                "#00ffff" // value when condition is met
            );
        
            // Modify opacity
            customOpacityCaseExpr.push(
                condition, // condition
                0.6 // value when condition is met (opacity 0-1)
            );
        
            // Modify line width
            customLineWidthCaseExpr.push(
                condition, // condition
                10 // value when condition is met
            );
            updateStyle();
        }
        
        
        // Clone all current vector layers
        const cloneVectorLayer = options => {
            let vectorStyle = svc.vectorStyle();
            let vectorLayerIds = vectorStyle.layers.map(layer => layer.id);
            let curStyle = map.getStyle();
            let newLayers = [];
            let newId = vjmap.RandomID();
            for(let i = 0; i < curStyle.layers.length; i++) {
                if (vectorLayerIds.includes(curStyle.layers[i].id)) {
                    let layer = {
                        ...curStyle.layers[i],
                        id: curStyle.layers[i].id + "_" + newId,
                        ...options
                    }
                    newLayers.push(layer)
                }
            }
            return newLayers;
        }
        
        const setZoomLayer = async () => {
            message.info('Please zoom the map and switch levels; layer content varies by level')
            // Level 1: show layers 19,24
            // Level 2: show layers 19,24,5
            // Level 3: show layers 1,19,24,5,22
            // Other levels: show all
        
            let style = map.getStyle();
            // Set previous vector layers to level 4 and above
            let vectorStyle = svc.vectorStyle();
            let vectorLayerIds = vectorStyle.layers.map(layer => layer.id);
            for(let i = 0; i < style.layers.length; i++) {
                if (vectorLayerIds.includes(style.layers[i].id)) {
                    style.layers[i].minzoom = 3; // level 3 and above to see all layers
                }
            }
        
            // Level 1: layers 19,24
            let layersZoom1 = cloneVectorLayer({
                filter: conditionLayers([19, 24], true),
                maxzoom: 1
            })
            style.layers.push(...layersZoom1);
        
            // Level 2: layers 19,24,5
            let layersZoom2 = cloneVectorLayer({
                filter: conditionLayers([19, 24, 5], true),
                minzoom: 1,
                maxzoom: 2
            })
            style.layers.push(...layersZoom2);
        
            // Level 3: layers 1,19,24,5,22
            let layersZoom3 = cloneVectorLayer({
                filter: conditionLayers([1,19,24,5,22], true),
                minzoom: 2,
                maxzoom: 3
            })
            style.layers.push(...layersZoom3);
        
            map.setStyle(style);
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "185px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setLayerTextColors()}>Set title layer text to red
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setObjectsVisible()}>Hide compass
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setLineWidth()}>Yellow line: transparent and thicker
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setZoomLayer()}>Different layers at different zoom levels
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App/>, document.getElementById('ui'));
        
        
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