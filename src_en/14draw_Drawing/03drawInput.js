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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/03drawInput
        // --Draw by direct coordinate input or mouse pick--
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
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        //map.fitMapBounds();
        await map.onLoad();
        
        let styleId;
        let preCoord; // previous point
        let curCoord; // current point
        const drawLine = async () => {
            await vjmap.Draw.actionDrawLineSting(map, {
                statusChange: e => {
                    if (e.isStart) {
                        // start drawing, show coordinate input UI
                        styleId = e.styleId;
                    } else if (e.isEnd) {
                        // end drawing, hide coordinate input UI
                    }
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    const co = map.fromLngLat(e.feature.coordinates[e.feature.coordinates.length - 1]);
                    curCoord = co;
                    if (e.feature.coordinates.length > 1) {
                        preCoord = map.fromLngLat(e.feature.coordinates[e.feature.coordinates.length - 2]);
                    }
                    // fire event for UI
                    map.fire("draw_updatecoordinate", {
                        preCoord,
                        curCoord,
                        styleId
                    })
                }
            })
        }
        
        
        drawLine()
        
        const inputCoord = (x, y) => {
            // send input click event with coordinates to this style id
            map.fire("draw.input.click", {
                lngLat: map.toLngLat([x, y]),
                styleId: styleId
            })
        }
        
        const calcCoord = (dist, angle) => {
            if (!dist || !preCoord) return
            let x = preCoord.x + dist * Math.cos(angle * Math.PI / 180.0);
            let y = preCoord.y + dist * Math.sin(angle * Math.PI / 180.0);
            // send input click event with coordinates to this style id
            map.fire("draw.input.click", {
                lngLat: map.toLngLat([x, y]),
                styleId: styleId
            })
        }
        
        // UI
        const { useRef } = React
        const App = () => {
        
            const lastX = useRef(null);
            const lastY = useRef(null);
            const geoX = useRef(null);
            const geoY = useRef(null);
            const dist = useRef(null);
            const angle = useRef(null);
        
            map.on("draw_updatecoordinate", ({ preCoord,  curCoord,  styleId}) => {
                geoX.current.value = curCoord.x
                geoY.current.value = curCoord.y
                if (preCoord) {
                    lastX.current.value = preCoord.x
                    lastY.current.value = preCoord.y
        
                    dist.current.value = curCoord.distanceTo(preCoord)
                    angle.current.value = curCoord.angleTo(preCoord) * 180 / Math.PI
                }
            })
            return (
                <div>
                    <div className="input-card w270">
                        <div className="input-item border">
                            Previous X: <input type="text" ref={lastX} defaultValue="0" readOnly
                                          className="inp"/>
                        </div>
                        <div className="input-item border">
                            Previous Y: <input type="text" ref={lastY} defaultValue="0" readOnly
                                          className="inp"/>
                        </div>
        
                        <div className="input-item border">
                            X: <input type="text" ref={geoX} defaultValue="0"
                                       className="inp"/>
                        </div>
                        <div className="input-item border">
                            Y: <input type="text" ref={geoY} defaultValue="0"
                                       className="inp"/>
                        </div>
                        <div className="input-item">
                            <button id="moving_btn" className="btn btn-full mr0" onClick={() => inputCoord(+geoX.current.value, +geoY.current.value)}>Input coordinates</button>
                        </div>
                        <div className="input-item border">
                            Distance:
                            <input type="text" ref={dist} defaultValue="0" className="inp"/>
                        </div>
                        <div className="input-item border">
                            Bearing:
                            <input type="text" ref={angle} defaultValue="0" className="inp"/>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => calcCoord(+dist.current.value, +angle.current.value)}>Generate coords from distance & bearing</button>
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