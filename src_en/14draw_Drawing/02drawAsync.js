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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/02drawAsync
        // --Draw shapes asynchronously--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        map.doubleClickZoom.disable(); // disable double-click zoom
        await map.onLoad();
        
        let options = {
            /* To snap to CAD map points:
             api: {
                getSnapFeatures: snapObj // snap data assigned to features property
             },
             */
            contextMenu: (e) => {
                // right-click to show menu
                new vjmap.ContextMenu({
                    event: e.event.originalEvent,
                    theme: "dark", //light
                    width: "250px",
                    items: [
                        {
                            label: 'OK',
                            onClick: () => {
                                // send Enter to confirm
                                map.fire("keyup", {keyCode: 13})
                            }
                        },
                        {
                            label: 'Cancel',
                            onClick: () => {
                                // send ESC to cancel
                                map.fire("keyup", {keyCode: 27})
                            }
                        }
                    ]
                });
            }
        }
        // Draw a point
        const doActionPoint = async () => {
            let point = await vjmap.Draw.actionDrawPoint(map, options);
            if (point.cancel) return;// cancelled
            // get coordinates
            let coordinates = point.features[0].geometry.coordinates;
            // get map default draw layer, or custom draw layer
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // create feature from coordinates and id, add to draw
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                properties: {
                    "color_inactive": "#00ffff",
                    "color_static": "#00ffff",
                    "radius_inactive": 5,
                    "radius_static": 5
                }
            });
        }
        
        // Draw a line
        const doActionLine = async () => {
            let line = await vjmap.Draw.actionDrawLineSting(map, options);
            if (line.cancel) return;// cancelled
            // get coordinates
            let coordinates = line.features[0].geometry.coordinates;
            // get map default draw layer, or custom draw layer
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // create feature from coordinates and id, add to draw
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "line_width": 1
                }
            });
        }
        
        // Draw polygon
        const doActionPolygon = async () => {
            let poly = await vjmap.Draw.actionDrawPolygon(map, options);
            if (poly.cancel) return;// cancelled
            // get coordinates
            let coordinates = poly.features[0].geometry.coordinates;
            // get map default draw layer, or custom draw layer
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // create feature from coordinates and id, add to draw
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "opacity": 1,
                    "outlineColor": "#ff0000",
                    "line_width": 1,
                    "line_opacity": 1
                }
            });
        }
        
        // Draw fill extrusion polygon
        const doActionFillExtrusion = async () => {
            let fill = await vjmap.Draw.actionDrawPolygon(map, options);
            if (fill.cancel) return;// cancelled
            // get coordinates
            let coordinates = fill.features[0].geometry.coordinates;
            // get map default draw layer, or custom draw layer
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // create feature from coordinates and id, add to draw
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                },
                properties: {
                    "color": "#00ffff",
                    "opacity": 1,
                    "outlineColor": "#ff0000",
                    "line_width": 1,
                    "line_opacity": 1,
                    "extrusionHeight": map.geoLengthToHeight(mapExtent.width() / 10)
                }
            });
        }
        
        // Draw circle
        const doActionCircle = async () => {
            let circle = await vjmap.Draw.actionDrawCircle(map, options);
            if (circle.cancel) return;// cancelled
            // get coordinates
            let coordinates = circle.features[0].geometry.coordinates;
            // get map default draw layer, or custom draw layer
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // create feature from coordinates and id, add to draw
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates[0]
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "line_width": 1
                }
            });
        }
        
        // Draw rectangle
        const doActionRectangle = async () => {
            let rect = await vjmap.Draw.actionDrawRectangle(map, options);
            if (rect.cancel) return;// cancelled
            // get coordinates
            let coordinates = rect.features[0].geometry.coordinates;
            // get map default draw layer, or custom draw layer
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // create feature from coordinates and id, add to draw
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates[0]
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "line_width": 1
                }
            });
        }
        
        // Draw slant rectangle
        const doActionSlantRectangle = async () => {
            let srect = await vjmap.Draw.actionDrawSlantRectangle(map, options);
            if (srect.cancel) return;// cancelled
            // get coordinates
            let coordinates = srect.features[0].geometry.coordinates;
            // get map default draw layer, or custom draw layer
            let draw = map.getDrawLayer();
            let id = vjmap.RandomID(10)
            // create feature from coordinates and id, add to draw
            draw.add({
                id,
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates[0]
                },
                properties: {
                    "color": vjmap.randomColor(),
                    "line_width": 1
                }
            });
        }
        
        const doActionSelect = async () => {
            // hold Shift to box-select or click to multi-select
            let draw = map.getDrawLayer();
            let sel = await vjmap.Draw.actionSelect(map, draw, options);
            if (sel.cancel) return;
            map.logInfo(`Selected ${sel.features.length} item(s)`)
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "40px", right: "10px"}}>
                        <h4>Draw type:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionPoint()}>Point
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionLine()}>Line
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionPolygon()}>Polygon
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionFillExtrusion()}>Fill extrusion
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionCircle()}>Circle
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionRectangle()}>Rectangle
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionSlantRectangle()}>Slant rectangle
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => doActionSelect()}>Select
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