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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29customzhoverregion
        // --Custom highlight region--Draw regions and highlight on hover/events
        // js code
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geometric projection from map extent
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // raster style
            center: prj.toLngLat(mapExtent.center()), // Set map center
            zoom: 2, // Set map zoom level
            pitch: 0, // Pitch
            renderWorldCopies: false // Do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        // See https://vjmap.com/guide/draw.html
        // More examples: https://vjmap.com/demo/#/demo/map/draw/02drawCustomToolbar
        const opts = vjmap.Draw.defaultOptions();
        opts.isActionDrawMode = true; // Hide buttons, use own UI
        
        const draw = new vjmap.Draw.Tool(opts);
        map.addControl(draw, 'top-right');
        
        // Switch to edit mode
        const switchEditMode = () => {
            draw.changeMode("simple_select");
        }
        
        // Switch to browse mode
        const switchBrowerMode = () => {
            draw.changeMode('static');
        }
        
        // Draw highlight region
        const drawPolygon = ()=> {
            draw.changeMode("draw_polygon");
        }
        
        // Delete region
        const deletePolygon = ()=> {
            draw.trash();
        }
        
        // Save data
        const saveData = async ()=> {
            let entsJson = draw.getAll();
            entsJson = map.fromLngLat(entsJson);
        
            let svc = map.getService();
            let curParam = svc.currentMapParam() || {};
            let key = `map_drawdata_${curParam.mapid}_${curParam.version}`;
            await svc.saveCustomData(key, entsJson);
            message.info('Save success')
        }
        
        // Load data
        const loadData = async ()=> {
            try {
                let svc = map.getService();
                let curParam = svc.currentMapParam() || {};
                let key = `map_drawdata_${curParam.mapid}_${curParam.version}`;
                let res = await svc.getCustomData(key);
                if (res.data) {
                    draw.set(map.toLngLat(res.data));
                    message.info("Load success")
                }
            } catch (e) {
                console.error(e)
            }
        
        }
        
        
        // After create, set color and let user enter content
        map.on("draw.create", function (e) {
        
            for (let i = 0; i < e.features.length; i++) {
                let id = e.features[i].id;
                if (!draw.get(id)) continue;
                draw.setFeatureProperty(id, "hoverPointer", true); // Allow highlight in browse mode
        
                let text = prompt("Enter property content:");
                draw.setFeatureProperty(id, "content", text);
        
                let color = vjmap.randomColor();
                draw.setFeatureProperty(id, "color", color); // color
                draw.setFeatureProperty(id, "hover_color", vjmap.randomColor());  // hover color
                draw.setFeatureProperty(id, "hover_opacity", 0.8); // hover opacity
            }
        });
        
        const popup = new vjmap.Popup({
            closeButton: false
        });
        // In browse mode, show popup on hover
        map.on("draw.static.mouseenter", e => {
            if (e.event.featureTarget) {
                popup.setLngLat(e.event.lngLat);
                popup.setHTML(JSON.stringify(e.event.featureTarget.properties, null, 4));
                popup.addTo(map);
            }
        });
        
        map.on("draw.static.mouseleave", e => {
            if (popup) popup.remove();
        });
        
        map.on("draw.static.click", e => {
            if (e.event.featureTarget) {
                message.info(`Clicked entity id: ${e.event.featureTarget.properties.id}, content: ${e.event.featureTarget.properties.content}`)
            }
        });
        
        
        // Load data first, then switch to browse mode
        await loadData();
        switchBrowerMode();
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "120px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => switchEditMode()}>Switch to edit mode
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => switchBrowerMode()}>Switch to browse mode
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => drawPolygon()}>Draw highlight region
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => deletePolygon()}>Delete region
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => saveData()}>Save data
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