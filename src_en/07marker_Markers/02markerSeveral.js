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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/02markerSeveral
        // --Multiple point markers--
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
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 3, // set map zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit to map bounds
        map.fitMapBounds();
        
        let mapBounds = map.getGeoBounds(); // Get map geo bounds
        for(let i = 0; i < 5; i++) {
            let point = mapBounds.randomPoint(); // Random point in bounds
            // marker
            let marker = new vjmap.Marker({
                draggable: true,
                color: vjmap.randomColor()
            });
            marker.setLngLat(map.toLngLat(point))
            marker.addTo(map);
            // Set custom ext data
            marker.extData = {
                id: i,
                name: `marker:${i}`
            }
        
            if (i === 2) {
                // Drop animation
                setTimeout(() => {
                    marker.setAnimation("MAP_ANIMATION_DROP");
                }, 1000)
            }
        
            // Marker click event
            marker.getElement().addEventListener('click', (e) => {
                message.info(`index:${marker.extData.id}; name: ${marker.extData.name}`)
            });
        }
        
        // Get marker by id
        function getMarkerById(id) {
            let markers = map.getMarkers() || [];
            let findMarker = markers.find(m => m.extData && m.extData.id === id)
            if (!findMarker) {
                message.info("Marker already removed!");
            } else {
                // Bounce
                findMarker.setAnimation("MAP_ANIMATION_BOUNCE");
            }
        }
        
        // Remove by id
        function removeMarkerById(id) {
            let markers = map.getMarkers() || [];
            let findMarker = markers.find(m => m.extData && m.extData.id === id)
            if (!findMarker) {
                message.info("Marker already removed!");
            } else {
                // Cancel animation
                // findMarker.setAnimation("MAP_ANIMATION_NONE");
                findMarker.remove();
            }
        }
        const { useState } = React;
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Remove marker by ID</h4>
                    <div className="input-item">
                        <button className="btn btn-full mr0" onClick={()=>getMarkerById(2)}>Get marker ID 2</button>
                        <button className="btn btn-full mr0" onClick={()=>removeMarkerById(2)}>Remove marker ID 2</button>
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