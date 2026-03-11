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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/setzMarkerPosition
        // --Bind data point on map--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div is dark
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
            style: svc.rasterStyle(), // style
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set zoom level
            renderWorldCopies: false // do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        //map.fitMapBounds();
        await map.onLoad();
        
        // Pick a point on map
        const pickPoint = async ()=> {
            let marker;
            let actionPoint = await vjmap.Draw.actionDrawPoint(map, {
                /* To snap to CAD points:
                 api: {
                    getSnapFeatures: snapObj
                 },
                 */
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    if (!marker) {
                        // First add
                        marker = new vjmap.Marker();
                        marker.setLngLat(e.lnglat);
                        marker.addTo(map);
                    } else {
                        // Update coordinate
                        marker.setLngLat(e.lnglat);
                    }
                },
                contextMenu: (e) => {
                    // Right-click menu
                    new vjmap.ContextMenu({
                        event: e.event.originalEvent,
                        theme: "dark", //light
                        width: "250px",
                        items: [
                            {
                                label: 'Cancel',
                                onClick: () => {
                                    // Send ESC to cancel (simulate ESC key)
                                    map.fire("keyup", {keyCode:27})
                                }
                            }
                        ]
                    });
        
                }
            });
            if (actionPoint.cancel) {
                // If cancelled by ESC
                if (marker) marker.remove();
                return null;
            }
            // Get point and convert to CAD geo coordinate
            // let co = map.fromLngLat(actionPoint.features[0].geometry.coordinates);
            //message.info(`Point: ${co.x}, ${co.y}`)
            return marker;
        }
        
        // Bind position
        let posMarker;
        const bindPositon = async () => {
            removeMarker();
            posMarker = await pickPoint();
            if (!posMarker) return;
            // Get point and convert to CAD geo coordinate
            let co = map.fromLngLat(posMarker.getLngLat());
            document.querySelector("#text").innerText = `Bound point: ${co.x}, ${co.y}`;
        
            // Draggable to change position
            posMarker.setDraggable(true);
            posMarker.on("dragend", markerDragend);
        }
        
        // Unbind position
        const unBindPositon = () => {
            removeMarker();
            document.querySelector("#text").innerText = `Unbound`;
        }
        // Drag end event
        const markerDragend = e => {
            if (!posMarker) return;
            // Get point and convert to CAD geo coordinate
            let co = map.fromLngLat(posMarker.getLngLat());
            document.querySelector("#text").innerText = `Bound point: ${co.x}, ${co.y}`;
        }
        const removeMarker = ()=> {
            if (posMarker) {
                posMarker.remove();
            }
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info">
                        <h4>Click to bind position</h4>
                        <p><span id="text">Unbound</span></p>
                    </div>
                    <div className="input-card">
                        <h4>Bind data point on map</h4>
                        <div>
                            <div className="input-item">
                                <button id="clickOn" className="btn" onClick={() => bindPositon()}>Bind position</button>
                                <button id="clickOff" className="btn" onClick={() => unBindPositon()}>Unbind position</button>
                            </div>
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