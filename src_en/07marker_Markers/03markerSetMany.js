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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/03markerSetMany
        // --Bind multiple point markers on map--
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
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set map zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        // Pick a point on map
        const pickPoint = async (markerOptions)=> {
            let marker;
            let actionPoint = await vjmap.Draw.actionDrawPoint(map, {
                /* To snap to CAD: api: { getSnapFeatures: snapObj }, assign to snapObj.features */
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    if (!marker) {
                        // First time
                        marker = new vjmap.createMarker(markerOptions);
                        marker.setLngLat(e.lnglat);
                        marker.addTo(map);
                    } else {
                        // Update position
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
                                    map.fire("keyup", {keyCode:27})
                                }
                            }
                        ]
                    });
        
                }
            });
            if (actionPoint.cancel) {
                if (marker) marker.remove();
                return null;
            }
            return marker;
        }
        
        let allMarkers = []; // All sensor data
        let sensorId = 1;
        const bindPosition = async (index, props) => {
            map.fire("keyup", { keyCode: 27 }) // Cancel any ongoing action
            // Custom image by index
            let customImage = env.assetsPath + `images/sensor${index}.png`
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage =
                `url("${customImage}")`;
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.backgroundSize = '100%';
            let markerOptions = {
                element: el
            }
            let marker;
            if (!props) {
                // Pick position on map
                marker = await pickPoint(markerOptions);
                if (!marker) return;
                marker.data = {
                    type: index, // Type
                    sensorId: sensorId++ // Sensor ID
                }
            } else {
                marker = vjmap.createMarker(markerOptions);
                marker.setLngLat(map.toLngLat(props.position));
                marker.data = {...props.data}
                marker.addTo(map);
                sensorId = marker.data.sensorId + 1
            }
        
            // Draggable
            marker.setDraggable(true);
            marker.on("mouseup", () => {
                message.info(`Sensor ${marker.data.type}, id ${marker.data.sensorId}`)
            })
            allMarkers.push(marker);
        }
        
        
        const saveMarkers = () => {
            let json = [];
            for(let m of allMarkers) {
                let pos = map.fromLngLat(m.getLngLat());
                json.push({
                    position: [pos.x, pos.y] , // Point
                    data: m.data // Props
                })
            }
            localStorage.setItem("marker_sensor", JSON.stringify(json, null, 0));
            message.info("Saved");
        }
        
        const loadMarkers = () => {
            let data = localStorage.getItem("marker_sensor");
            if (!data) return
            let json = JSON.parse(data);
            map.removeMarkers(); // Clear existing
            for(let m = 0; m < json.length; m++) {
                bindPosition(json[m].data.type, json[m])
            }
        }
        
        const createTableExportDwg = async ()=> {
            let sensors = [];
            for(let m of allMarkers) {
                let pos = map.fromLngLat(m.getLngLat());
                sensors.push({
                    position: [pos.x, pos.y] , // Point
                    data: m.data // Props
                })
            }
            if (sensors.length == 0) {
                message.error("No sensor data on map yet")
                return
            }
            message.info("Pick table position on map")
            let drawRect = await vjmap.Draw.actionDrawRectangle(map, {
            });
            if (drawRect.cancel) {
                return ;// Cancelled
            }
            let co = drawRect.features[0].geometry.coordinates[0];
            co = map.fromLngLat(co);
            let tableBounds = vjmap.GeoBounds.fromDataExtent(co);
            let tableHeight = tableBounds.height();
            let doc = new vjmap.DbDocument();
            let param = svc.currentMapParam();
            doc.from = `${param.mapid}/${param.version}`;
            doc.entitys = [];
            let data = [
                ["Statistics"], // Title row
                ["ID", "Type", "Position"] // Header
            ]
            for(let sensor of sensors) {
                let item = [];
                item.push(sensor.data.sensorId);
                item.push(sensor.data.type);
                item.push({
                    text: `${sensor.position[0].toFixed(2)},${sensor.position[1].toFixed(2)}`,
                    contentColor: 0xFF0000,
                    textHeight: tableHeight / sensors.length / 10
                })
                data.push(item)
            }
            let table = new vjmap.DbTable({
                position: tableBounds.leftTop().toArray(), // Table position
                width: tableBounds.width(), // Table width
                height: tableHeight, // Table height
                data
            })
            doc.entitys.push(table);
        
            let res = await svc.updateMap({
                mapid: vjmap.getTempMapId(1), // Temp map expiry in minutes; default 30
                filedoc: JSON.stringify(doc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // Use 0xFFFFFF for light background
                }
            })
            if (res.error) {
                message.error(res.error)
            }
        
            let url = `https://vjmap.com/app/cloud/#/map/${res.mapid}?mapopenway=Memory&version=${res.version}`;
            window.open(url);
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="input-card">
                        <h4>Bind data points on map</h4>
                        <div>
                            <div className="input-item">
                                <button className="btn" onClick={() => bindPosition(1)}>Bind sensor 1</button>
                                <button className="btn" onClick={() => bindPosition(2)}>Bind sensor 2</button>
                                <button className="btn" onClick={() => bindPosition(3)}>Bind sensor 3</button>
                                <button className="btn" onClick={() => saveMarkers()}>Save sensor data</button>
                                <button className="btn" onClick={() => loadMarkers()}>Load sensor data</button>
                                <button className="btn" onClick={() => createTableExportDwg()}>Export table to DWG</button>
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