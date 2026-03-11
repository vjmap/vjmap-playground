const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polyline/polylineAnimate
        // --Path animation--
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
        map.fitMapBounds();
        
        let mapBounds = map.getGeoBounds(0.3);
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const routePath = [];
        // random points within map bounds
        routePath.push(mapBounds.min);
        routePath.push(mapBounds.center());
        routePath.push(vjmap.geoPoint([mapBounds.max.x, mapBounds.min.y]));
        routePath.push(mapBounds.max);
        routePath.push(vjmap.geoPoint([mapBounds.min.x, mapBounds.max.y]));
        routePath.push(mapBounds.min);
        
        // car icon
        await map.loadImageEx("carIcon", env.assetsPath + "images/car.png");
        // route line
        let routeLine = new vjmap.PolylineArrow({
            path: map.toLngLat(routePath),
            lineWidth: 10,
            showDir: true,
            lineColor: '#009EFF'
        });
        routeLine.addTo(map);
        
        // real-time animation track
        let realRoute = new vjmap.PolylineArrow({
            path: map.toLngLat(routePath),
            lineWidth: 10,
            showDir: true,
            showBorder: true,
            borderColor: "#f00",
            lineColor: '#FF9900'
        });
        realRoute.addTo(map);
        
        // car source and layer
        map.addGeoJSONSource("carSource");
        map.addSymbolLayer("carAnimate", "carSource", {
            iconImage: 'carIcon',
            iconSize: 0.5,
            iconRotate: ['get', 'bearing'],
            iconRotationAlignment: 'map',
            iconAllowOverlap: true,
            iconIgnorePlacement: true
        })
        
        // line animation
        let curFps = 10;
        
        // position marker
        // create default
        let markerEle = new vjmap.RotatingTextBorderMarker({
            lngLat: [0,0],
            text: ""
        }, {})
        markerEle.setMarkersWidth(240);
        let marker;
        
        const anim = realRoute.animate(100, curFps, true, status => console.log(status), (status, context) => {
            if (status !== vjmap.FrameAnimationStatus.Run) return
            // per-frame callback to update car position
            // get angle
            const angle = vjmap.geoPoint(context.endPnt).angleTo(vjmap.geoPoint(context.startPnt));
            // generate new data
            const carGeoJson = vjmap.createPointGeoJson({
                point: context.endPnt,
                properties: { bearing: vjmap.radToDeg(-angle)}
            });
            // update car data
            map.setData("carSource", carGeoJson); // update position
        
            // update marker coords and display
            const co = map.fromLngLat(context.endPnt);
            const text = `Current coord:${parseInt(co.x)},${parseInt(co.x)}`;
            markerEle.setMarkersText(text);
            if (!marker) {
                // create on first time
                marker = markerEle.createMarker();
                marker.setLngLat(context.endPnt);
                marker.addTo(map);
                marker.setOffset([0, -50])
            } else {
                marker.setLngLat(context.endPnt);
            }
        })
        
        // remove animation
        const removeAnim = ()=> {
            // stop first
            anim.stop();
            routeLine.remove(); // remove route line
            realRoute.remove();// remove animation line
            map.removeSourceEx("carSource"); // remove car source and layer
            if (marker) marker.remove(); // remove marker
        }
        
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Animation</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => anim.start() }>Start</button>
                        <button className="btn" onClick={ () => anim.pause() }>Pause</button>
                        <button className="btn" onClick={ () => { curFps *= 2; anim.changeFps(curFps)} }>Faster</button>
                        <button className="btn" onClick={ () => { curFps /= 2; anim.changeFps(curFps)} }>Slower</button>
                        <button className="btn" onClick={ () => anim.stop() }>Stop</button>
                        <button className="btn" onClick={ () => removeAnim() }>Remove</button>
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