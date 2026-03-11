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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/08drawEllipse
        // --Custom interactive draw--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // if open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster here
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set zoom level
            pitch: 0, // pitch angle
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.4);
        
        const cancelDraw = ()=> {
            // send ESC to cancel
            map.fire("keyup", {keyCode:27})
        }
        
        const drawEllipse = async (isFill, isSetAngle) => {
            let centerPt = await vjmap.Draw.actionDrawPoint(map, {
            });
            if (centerPt.cancel) {
                return ;// cancelled
            }
            let center = map.fromLngLat(centerPt.features[0].geometry.coordinates);
        
            let ellipse;
            if (isFill) {
                ellipse = new vjmap.EllipseFill({
                    center: center,
                    majorAxisRadius: 0,
                    minorAxisRadius: 0,
                    fillColor: 'green',
                    fillOpacity: 0.8,
                    fillOutlineColor: "#f00"
                });
            } else {
                ellipse = new vjmap.EllipseEdge({
                    center: center,
                    majorAxisRadius: 0,
                    minorAxisRadius: 0,
                    lineColor: 'red',
                    lineWidth: 3
                });
            }
            ellipse.addTo(map);
        
        
            let ellipseMajorAxisPt = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    const co = map.fromLngLat(e.lnglat);
                    ellipse.setMinorAxisRadius(center.distanceTo(co));
                    ellipse.setMajorAxisRadius(center.distanceTo(co));
                }
            });
            if (ellipseMajorAxisPt.cancel) {
                ellipse.remove()
                return ;// cancelled
            }
        
            let ellipseMinorAxisPt = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    const co = map.fromLngLat(e.lnglat);
                    ellipse.setMinorAxisRadius(center.distanceTo(co));
                }
            });
            if (ellipseMinorAxisPt.cancel) {
                ellipse.remove()
                return ;// cancelled
            }
        
            if (isSetAngle) {
                let ellipseStartPt = await vjmap.Draw.actionDrawPoint(map, {
                    updatecoordinate: (e) => {
                        if (!e.lnglat) return;
                        const co = map.fromLngLat(e.lnglat);
                        ellipse.setStartAngle(vjmap.radiansToDegrees(co.angleTo(center)));
                    }
                });
                if (ellipseStartPt.cancel) {
                    ellipse.remove()
                    return ;// cancelled
                }
        
                let ellipseEndPt = await vjmap.Draw.actionDrawPoint(map, {
                    updatecoordinate: (e) => {
                        if (!e.lnglat) return;
                        const co = map.fromLngLat(e.lnglat);
                        ellipse.setEndAngle(vjmap.radiansToDegrees(co.angleTo(center)));
                    }
                });
                if (ellipseEndPt.cancel) {
                    ellipse.remove()
                    return ;// cancelled
                }
            }
        
        
        // set rotation angle: get ellipse points, rotate around center
        // get previous ellipse points
            let data = ellipse.getData();
            let ellipseRotatePt = await vjmap.Draw.actionDrawPoint(map, {
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    // rotate around ellipse center
                    const co = map.fromLngLat(e.lnglat);
                    let angle = co.angleTo(center);
                    let newData = vjmap.cloneDeep(data);
                    let coordinates;
                    if (isFill) {
                        coordinates = newData.features[0].geometry.coordinates[0];
                    } else {
                        coordinates = newData.features[0].geometry.coordinates;
                    }
                    for(let i = 0; i < coordinates.length; i++) {
                        let pt = map.fromLngLat(coordinates[i]);
                        pt = pt.roateAround(angle, center);
                        pt = map.toLngLat(pt);
                        coordinates[i] = pt;// update
                    }
                    ellipse.setData(newData);
                }
            });
            if (ellipseRotatePt.cancel) {
                ellipse.remove()
                return ;// cancelled
            }
        
        
        }
        
        // Draw filled ellipse
        const drawEllipseFill = ()=> {
            drawEllipse(true)
        }
        // Draw ellipse
        const drawEllipseEdge = ()=> {
            drawEllipse(false)
        }
        
        // drawEllipseFillArc
        const drawEllipseFillArc = ()=> {
            drawEllipse(true, true)
        }
        // Draw ellipse arc
        const drawEllipseArc = ()=> {
            drawEllipse(false, true)
        }
        
        /**
         * Closest point on ray to point B
         * @param {Object} A - ray origin (x, y)
         * @param {number} theta - ray angle in radians
         * @param {Object} B - target point (x, y)
         * @returns {Object} closest point on ray to B (x, y)
         */
        function closestPointOnRay(A, theta, B) {
            // ray direction vector
            const d = {
                x: Math.cos(theta),
                y: Math.sin(theta)
            };
        
            // vector AB
            const AB = {
                x: B.x - A.x,
                y: B.y - A.y
            };
        
            // projection length (AB onto d)
            const projectionLength = (AB.x * d.x + AB.y * d.y) / (d.x * d.x + d.y * d.y);
        
            // if negative, closest is ray origin A
            if (projectionLength < 0) {
                return { x: A.x, y: A.y };
            }
        
            // closest point
            const closestPoint = {
                x: A.x + projectionLength * d.x,
                y: A.y + projectionLength * d.y
            };
        
            return closestPoint;
        }
        
        
        const drawAngleLine = async () => {
            const lineAngle = 30;// line angle 30 degrees
        
            // draw first point
            let firstPoint = await vjmap.Draw.actionDrawPoint(map);
            if (firstPoint.cancel) {
                return ;// cancelled
            }
            // get drawn point coordinates
            let point = map.fromLngLat(firstPoint.features[0].geometry.coordinates);
            let co1 = [point.x, point.y];
            let co2 = [point.x, point.y];
            let drawLine = new vjmap.Polyline({
                data: map.toLngLat([co1, co2]),
                lineColor: "yellow",
                lineWidth: 2
            });
            drawLine.addTo(map);
        
            // add first point to snap
            let snapObj = {}
            snapObj.features = []
            snapObj.features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: map.toLngLat(point)
                }
            })
        
            // draw second point
            let secondPoint = await vjmap.Draw.actionDrawPoint(map, {
                api: {
                    getSnapFeatures: snapObj // snap data assigned to features property
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    const co = map.fromLngLat(e.lnglat);
                    let closeedPoint = closestPointOnRay(point, vjmap.degToRad(lineAngle), co);
                    // update temp line
                    drawLine.setData(map.toLngLat([point, closeedPoint]))
                }
            })
            if (secondPoint.cancel) {
                drawLine.remove(); // remove
                return ;// cancelled
            }
        }
        
        
        // Draw first line, then subsequent lines at given angle to previous
        const drawIncAngleLine = async () => {
            let angle = 30;// angle in degrees
        
            let isDrawing = false;
            let line = await vjmap.Draw.actionDrawLineSting(map, {
                api: {
                    // getSnapFeatures: snapObj // snap data assigned to features property
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    isDrawing = true;
        
                    if (e.state.line.coordinates.length >= 3) {
                        // from 3rd point onward, constrain to angle
                        let points = map.fromLngLat(e.state.line.coordinates);
                        let startPoint = points[points.length - 3];
                        let endPoint = points[points.length - 2];
        
                        // angle of line from previous two points
                        let lineAngle = vjmap.geoPoint(startPoint).angleTo(vjmap.geoPoint(endPoint))
                        const co = map.fromLngLat(e.lnglat);
                        // offset by given angle from previous segment
                        let closedPoint = closestPointOnRay(endPoint, lineAngle + vjmap.degToRad(angle), co);
                        e.state.line.coordinates[ e.state.line.coordinates.length - 1] = map.toLngLat(closedPoint)
        
                        if (e.isClick) {
                            // on click, use computed coordinates
                            let closedLngLat = map.toLngLat(closedPoint)
                            e.state.snappedLng = closedLngLat[0];
                            e.state.snappedLat = closedLngLat[1]
                        }
                    }
        
                },
                contextMenu: (e) => {
                    new vjmap.ContextMenu({
                        event: e.event.originalEvent,
                        theme: "dark", //light
                        width: "250px",
                        items: [
                            {
                                label: 'OK',
                                onClick: () => {
                                    map.fire("keyup", { keyCode: 13 })
                                    setPopupText("", map);
                                }
                            },
                            {
                                label: 'Cancel',
                                onClick: () => {
                                    map.fire("keyup", { keyCode: 27 })
                                    setPopupText("", map);
                                }
                            }, {
                                label: 'Delete last point',
                                onClick: () => {
                                    map.fire("keyup", { keyCode: 8 })
                                }
                            }, {
                                label: 'Finish',
                                onClick: () => {
                                    map.fire("keyup", { keyCode: 27 })
                                    isDrawing = false;
                                    setPopupText("", map);
                                }
                            }
                        ]
                    });
        
                }
            });
        
            if (line.cancel) {
                return // cancelled
            }
        
            let color = vjmap.randomColor();
            let polyline = new vjmap.Polyline({
                data: line.features[0].geometry.coordinates,
                lineColor: color,
                lineWidth: 2
            });
            polyline.addTo(map);
        }
        // UI
        const App = () => {
            return (
                <div className="info" style={{width:"60px", right: "5px"}}>
                    <div className="input-item">
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseFill()}>Draw filled ellipse</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseEdge()}>Draw ellipse</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseFillArc()}>Draw filled ellipse arc</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawEllipseArc()}>Draw ellipse arc</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawAngleLine()}>Draw line at angle</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => drawIncAngleLine()}>Draw line at offset angle</button>
                        <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => cancelDraw()}>Cancel draw</button>
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