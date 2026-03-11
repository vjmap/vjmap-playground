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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/12mapStyleBackend
        // --Modify backend render data [by style]--Custom style expressions to change backend render output
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
            style: svc.rasterStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        })
        // Update style
        const expressionList = [] ; // Expression list
        const updateStyle = (style) => {
            map.updateStyle(svc, {
                name: "customStyle2",
                backcolor: 0,
                expression: expressionList.join("\n"),
                ...style
            })
        }
        
        // Expression syntax and variables: see server condition/expression query and server render expression docs
        
        // Modify color (r,g,b,a); if zoom provided, applies to that zoom and above
        const modifyColor = (color, zoom) => {
            let result = "";
            let z = Number.isInteger(zoom) ? `[${zoom + 1}]` : '';
            if ("r" in color) result += `gOutColorRed${z}:=${color.r};`;
            if ("g" in color) result += `gOutColorGreen${z}:=${color.g};`;
            if ("b" in color) result += `gOutColorBlue${z}:=${color.b};`;
            if ("a" in color) result += `gOutColorAlpha${z}:=${color.a};`;
            return result;
        }
        
        // Modify line width; if zoom provided, applies to that zoom and above
        const modifyLineWidth = (lw, zoom) => {
            let result = "";
            if (lw) {
                if (!Number.isInteger(zoom)) {
                    result += `gOutLineWidth:=${lw};`;
                } else {
                    result += `gOutLineWidth[${zoom + 1}]:=${lw};`;
                }
            }
            return result;
        }
        
        // Modify visibility; if zoom provided, applies to that zoom and above
        const modifyVisible = (visible, zoom) => {
            let result = "";
            if (visible !== undefined) {
                if (!Number.isInteger(zoom)) {
                    result += `gOutVisible:=${visible ? 1 : 0};`;
                } else {
                    result += `gOutVisible[${zoom + 1}]:=${visible ? 1 : 0};`;
                }
            }
            return result;
        }
        
        // Add entity type condition (any of the types), e.g. ['AcDbPolyline','AcDbText']
        const conditionFeatureType = featureTypes => {
            if (!Array.isArray(featureTypes)) featureTypes = [featureTypes];// convert to array first, then use array uniformly
            return featureTypes.map(featureType => `gInFeatureType=='${featureType}'`).join(" or ");
        }
        
        // Add entity layer condition (any of the layers), e.g. ['Layer1','Layer2']
        const conditionLayers = layers => {
            if (!Array.isArray(layers)) layers = [layers];// convert to array first, then use array uniformly
            return layers.map(layer => `gInLayerName=='${layer}'`).join(" or ");
        }
        
        // Add entity object id condition (any of the ids), e.g. ['283','285']
        const conditionObjectIds = objectIds => {
            if (!Array.isArray(objectIds)) objectIds = [objectIds];// convert to array first, then use array uniformly
            let strObjectIds = objectIds.join("||");
            return `gInObjectId  in  '${strObjectIds}'`
        }
        // Add entity object color condition (any of the colors), e.g. [{r:255,g:122,b:100},{r:100}]
        const conditionColors = colors => {
            if (!Array.isArray(colors)) colors = [colors];// convert to array first, then use array uniformly
            return colors.map(color => {
                let result = [];
                if ("r" in color) result.push(`gInColorRed==${color.r}`);
                if ("g" in color) result.push(`gInColorGreen==${color.g}`);
                if ("b" in color) result.push(`gInColorBlue==${color.b}`);
                if ("a" in color) result.push(`gInColorAlpha==${color.a}`);
                return `(${result.join(" and ")})`
            }).join(" or ");
        }
        
        // Add entity object bounds condition (any of the bounds), e.g. [{width:10,height:20,tol: 0.01},{width:300,height:200}]
        const conditionBounds = bounds => {
            if (!Array.isArray(bounds)) bounds = [bounds];// convert to array first, then use array uniformly
            return bounds.map(bound => {
                let result = [];
                if ("width" in bound) result.push(`(abs(gInExtendMaxX-gInExtendMinX-${bound.width})<${bound.tol ? bound.tol: 0.001})`);
                if ("height" in bound) result.push(`(abs(gInExtendMaxY-gInExtendMinY-${bound.height})<${bound.tol ? bound.tol: 0.001})`);
                return `(${result.join(" and ")})`
            }).join(" or ");
        }
        
        const updateExpr = async expr => {
            if (expressionList.findIndex(e => e === expr) >= 0) return;// already added
            expressionList.push(expr);
            await updateStyle();// update style
        }
        
        const setLayerTextColors = async ()=> {
            // Type condition
            let condition1 = conditionFeatureType(["AcDbText", "AcDbMText", "AcDbAttributeDefinition", "AcDbAttribute"]);
            // Layer condition
            let condition2 = conditionLayers("WZ");
            let value = modifyColor({r: 255, g: 0, b: 0});
            let expr = `if((${condition1}) and (${condition2})) {${value}} `;
            await updateExpr(expr);
        }
        
        const setObjectsVisible = async () => {
            // objectId
            let condition = conditionObjectIds(["10D_10F__111_#", "10D_10F__110_#"]);
            let value1 = modifyVisible(false, 1); // levels 1-3 invisible
            let value2 = modifyVisible(true, 3); // level 3 and above visible
            let expr = `if(${condition}) {${value1} ${value2}} `;
            await updateExpr(expr);
        }
        
        const setLineWidth = async () => {
            // Color condition
            let condition = conditionColors([{r: 255, g: 255, b:0}]);
            let value1 = modifyLineWidth(5);
            let value2 = modifyColor({r: 0, g: 255, b: 255, a: 100});
            let expr = `if(${condition}) {${value1} ${value2}} `;
            await updateExpr(expr);
        }
        
        const setBoundsColors = async () => {
            // Bounds condition
            let condition = conditionBounds({width: 4000, tol: 20});
            let value = modifyColor({r: 255, g: 0, b: 0});
            let expr = `if(${condition}) {${value}} `;
            await updateExpr(expr);
        }
        
        const setZoomLayer = async () => {
            message.info('Please zoom the map and switch levels; layer content varies by level')
            let style = {
                // At different zoom levels, layeroff controls which layer indices are off, layeron controls which are on
                layeron:`{
                                "*": "()",
                                "1": "(19,24)",
                                "2": "(19,24,5)",
                                "3-4": "(1,19,24,5,22)",
                                "5": "(1,19,24,5,22,15)",
                                "6-7": "(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,19,22,24)"
                            }`
            }
            await updateStyle(style);
        }
        
        // The above is expression syntax (efficient but requires learning); the same can be done with JS script. JS is easier but slightly slower.
        // Below is the JS script implementation
        /*
        // Modify color: color.r (red), color.g (green), color.b (blue), color.a (alpha); if zoom is provided, applies to that level and above
        const modifyColor = (color, zoom) => {
            let result = "";
            let z = Number.isInteger(zoom) ? `[${zoom + 1}]` : '';
            if ("r" in color) result += `gOutColorRed${z}=${color.r};`;
            if ("g" in color) result += `gOutColorGreen${z}=${color.g};`;
            if ("b" in color) result += `gOutColorBlue${z}=${color.b};`;
            if ("a" in color) result += `gOutColorAlpha${z}=${color.a};`;
            return result;
        }
        
        // Modify line width; if zoom provided, applies to that zoom and above
        const modifyLineWidth = (lw, zoom) => {
            let result = "";
            if (lw) {
                if (!Number.isInteger(zoom)) {
                    result += `gOutLineWidth=${lw};`;
                } else {
                    result += `gOutLineWidth[${zoom + 1}]=${lw};`;
                }
            }
            return result;
        }
        
        // Modify visibility; if zoom provided, applies to that zoom and above
        const modifyVisible = (visible, zoom) => {
            let result = "";
            if (visible !== undefined) {
                if (!Number.isInteger(zoom)) {
                    result += `gOutVisible=${visible ? 1 : 0};`;
                } else {
                    result += `gOutVisible[${zoom + 1}]=${visible ? 1 : 0};`;
                }
            }
            return result;
        }
        
        // Add entity type condition (any of the types), e.g. ['AcDbPolyline','AcDbText']
        const conditionFeatureType = featureTypes => {
            if (!Array.isArray(featureTypes)) featureTypes = [featureTypes];// convert to array first, then use array uniformly
            return featureTypes.map(featureType => `gInFeatureType=='${featureType}'`).join(" || ");
        }
        
        // Add entity layer condition (any of the layers), e.g. ['Layer1','Layer2']
        const conditionLayers = layers => {
            if (!Array.isArray(layers)) layers = [layers];// convert to array first, then use array uniformly
            return layers.map(layer => `gInLayerName=='${layer}'`).join(" || ");
        }
        
        // Add entity object id condition (any of the ids), e.g. ['283','285']
        const conditionObjectIds = objectIds => {
            if (!Array.isArray(objectIds)) objectIds = [objectIds];// convert to array first, then use array uniformly
            let strObjectIds = objectIds.join("||");
            return `'${strObjectIds}'.indexOf(gInObjectId) >= 0`
        }
        // Add entity object color condition (any of the colors), e.g. [{r:255,g:122,b:100},{r:100}]
        const conditionColors = colors => {
            if (!Array.isArray(colors)) colors = [colors];// convert to array first, then use array uniformly
            return colors.map(color => {
                let result = [];
                if ("r" in color) result.push(`gInColorRed==${color.r}`);
                if ("g" in color) result.push(`gInColorGreen==${color.g}`);
                if ("b" in color) result.push(`gInColorBlue==${color.b}`);
                if ("a" in color) result.push(`gInColorAlpha==${color.a}`);
                return `(${result.join(" && ")})`
            }).join(" || ");
        }
        
        // Add entity object bounds condition (any of the bounds), e.g. [{width:10,height:20,tol: 0.01},{width:300,height:200}]
        const conditionBounds = bounds => {
            if (!Array.isArray(bounds)) bounds = [bounds];// convert to array first, then use array uniformly
            return bounds.map(bound => {
                let result = [];
                if ("width" in bound) result.push(`(Math.abs(gInExtendMaxX-gInExtendMinX-${bound.width})<${bound.tol ? bound.tol: 0.001})`);
                if ("height" in bound) result.push(`(Math.abs(gInExtendMaxY-gInExtendMinY-${bound.height})<${bound.tol ? bound.tol: 0.001})`);
                return `(${result.join(" && ")})`
            }).join(" || ");
        }
        
        const updateExpr = async expr => {
            if (expressionList.findIndex(e => e === expr) >= 0) return;// already added
            expressionList.push(expr);
            await updateStyle();// update style
        }
        
        const setLayerTextColors = async ()=> {
            // Type condition
            let condition1 = conditionFeatureType(["AcDbText", "AcDbMText", "AcDbAttributeDefinition", "AcDbAttribute"]);
            // Layer condition
            let condition2 = conditionLayers("WZ");
            let value = modifyColor({r: 255, g: 0, b: 0});
            let expr = `if((${condition1}) && (${condition2})) {${value}} `;
            await updateExpr(expr);
        }
        
        const setObjectsVisible = async () => {
            // objectId
            let condition = conditionObjectIds(["10D_10F__111_#", "10D_10F__110_#"]);
            let value1 = modifyVisible(false, 1); // levels 1-3 invisible
            let value2 = modifyVisible(true, 3); // level 3 and above visible
            let expr = `if(${condition}) {${value1} ${value2}} `;
            await updateExpr(expr);
        }
        
        const setLineWidth = async () => {
            // Color condition
            let condition = conditionColors([{r: 255, g: 255, b:0}]);
            let value1 = modifyLineWidth(5);
            let value2 = modifyColor({r: 0, g: 255, b: 255, a: 100});
            let expr = `if(${condition}) {${value1} ${value2}} `;
            await updateExpr(expr);
        }
        
        const setBoundsColors = async () => {
            // Bounds condition
            let condition = conditionBounds({width: 4000, tol: 20});
            let value = modifyColor({r: 255, g: 0, b: 0});
            let expr = `if(${condition}) {${value}} `;
            await updateExpr(expr);
        }
        
        const setZoomLayer = async () => {
            message.info('Please zoom the map and switch levels; layer content varies by level')
            let style = {
                // At different zoom levels, layeroff controls which layer indices are off, layeron controls which are on
                layeron:`{
                                "*": "()",
                                "1": "(19,24)",
                                "2": "(19,24,5)",
                                "3-4": "(1,19,24,5,22)",
                                "5": "(1,19,24,5,22,15)",
                                "6-7": "(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,19,22,24)"
                            }`
            }
            await updateStyle(style);
        }
         */
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
                                    onClick={() => setObjectsVisible()}>Hide compass (visible from level 3)
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setLineWidth()}>Yellow line: transparent and thicker
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => setBoundsColors()}>Circles with given radius to red
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