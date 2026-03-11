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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerFollowPath
        // --Three.js model path animation--
        // !!! `vjthree` is deprecated; use latest [vjmap 3D] https://vjmap.com/map3d/
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(mapExtent.center()),
            zoom: 4,
            pitch: 60,
            antialias:true,
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        const center = map.getCenter();
        
        if (typeof vjThree !== "object") {
            // If no env
            await vjmap.addScript([{
                src: "../../js/plugins/vjthree.min.js"
            },{
                src: "../../js/plugins/vjthree.min.css"
            }])
        }
        
        const threeContext = map.createThreeJsContext({
            defaultLights: true,
            enableSelectingFeatures: true,
            enableSelectingObjects: true, // Set to false to disable 3D object selection
            enableDraggingObjects: true, // Set to false to disable drag/move after select
            enableRotatingObjects: true, // Set to false to disable 3D object rotation after select
            enableTooltips: true // Set to false to disable default tooltips
        });
        const options = {
            obj: env.assetsPath + 'data/soldier.glb',
            type: 'gltf',
            scale: 500000,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 }, //default rotation
            anchor: 'center'
        }
        let soldier, line;
        let selectedObject;
        let origin = [center.lng, center.lat, 0];
        
        // Selection change
        const onSelectedChange = e => {
            let selected = e.detail.selected;
            console.log("onSelectedChange: " + selected);
            if (selected) {
                selectedObject = e.detail;
                message.info("Hold“Shift”to drag or“Alt”to rotate");
            }
            threeContext.update();
        }
        
        const createLabelIcon = (text) => {
            let popup = document.createElement('div');
            popup.innerHTML = '<span title="' + text + '" style="font-size: 30px;color: yellow;">&#9762;</span>';
            return popup;
        }
        threeContext.loadObj(options, function (model) {
            soldier = model.setCoords(origin);
            model.addLabel(createLabelIcon("Status: Radioactive"), true);
            model.addTooltip("This is a custom tooltip", true);
            threeContext.add(soldier);
        
            // Listening to the events
            soldier.addEventListener('SelectedChange', onSelectedChange, false);
            soldier.addEventListener('Wireframed', e => console.log("Wireframed", e), false);
            soldier.addEventListener('IsPlayingChanged', e => console.log("IsPlayingChanged", e), false);
            soldier.addEventListener('ObjectDragged', e => console.log("ObjectDragged", e), false);
            soldier.addEventListener('ObjectMouseOver', e => console.log("ObjectMouseOver", e), false);
            soldier.addEventListener('ObjectMouseOut', e => console.log("ObjectMouseOut", e), false);
            soldier.addEventListener('ObjectChanged', e => console.log("ObjectChanged", e), false);
        })
        map.addLayer(new vjmap.ThreeLayer({context: threeContext}));
        map.on('click', function (e) {
            const pt = [e.lngLat.lng, e.lngLat.lat, 0];
            travelPath(pt);
        })
        
        
        const setWireframe = (bWireframe) => {
            if (selectedObject) {
                selectedObject.wireframe = bWireframe;
                threeContext.update();
                map.repaint = true;
            } else {
                message.info("Please select a model first")
            }
        }
        
        const objectPlay = bPlay => {
            if (selectedObject) {
                if (bPlay) {
                    if (!selectedObject.isPlaying) {
                        selectedObject.playAnimation( { animation: 1, duration: 5000 });
                    }
                } else {
                    if (selectedObject.isPlaying) {
                        selectedObject.stop();
                    }
                }
            }  else {
                message.info("Please select a model first")
            }
        }
        
        const travelPath = (destination) => {
            const path = [origin, destination];
            let duration = 5000;
            const options = {
                animation: 1,
                path,
                duration: duration
            }
        
            // start the soldier animation with above options, and remove the line when animation ends
            soldier.followPath(
                options,
                () => {
                    threeContext.remove(line);
                }
            );
            soldier.playAnimation(options);
        
            // create and add line object
            line = threeContext.line({
                geometry: path,
                width: 5,
                color: 'steelblue'
            })
        
            threeContext.add(line);
        
            // set destination as the new origin, for the next trip
            origin = destination;
        
        }
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>Settings</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => objectPlay(true)}>Run</button>
                                <button className="btn" onClick={() => objectPlay(false)}>Stop</button>
                                <button className="btn" onClick={() => setWireframe(true)}>Wireframe</button>
                                <button className="btn" onClick={() => setWireframe(false)}>Solid</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'))
        
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