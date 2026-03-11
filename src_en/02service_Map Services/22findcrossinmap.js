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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findcrossinmap
        // --Line and map intersection--Draw a line and find intersections with map entities
        // Set div background to light
        // js code
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists; upload new drawing to create)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map bounds
        map.fitMapBounds();
        // Disable double-click zoom
        map.doubleClickZoom.disable();
        
        // Draw a line and draw all intersection points
        const queryIntersections = async () => {
            // Clear all markers first
            map.removeMarkers();
            let line = await vjmap.Draw.actionDrawLineSting(map);
            if (line.cancel) {
                return
            }
            let coords = map.fromLngLat(line.features[0].geometry.coordinates).map(pt => pt.toArray())
            // Condition query
            let query = await svc.conditionQueryFeature({
                //AcDbLine AcDbPolyline AcDb2dPolyline AcDb3dPolyline AcDbSpline https://vjmap.com/guide/svrStyleVar.html
                condition: `name='1' or name='2' or name='3' or name='4' or name='5'`,
                bounds: coords, // line coordinates
                isGetIntersections: true,// return intersections
                includegeom: true,
                fields: "objectid,intersections",
                limit: 100000
            })
            if (query.error) {
                message.error(query.error)
            } else {
                message.info(`Matched record count: ${query.recordCount}`)
        
        
                if (query.recordCount > 0) {
                    for (let i = 0; i < query.recordCount; i++) {
                        let intersections = query.result[i].intersections;
                        if (!intersections) continue
                        // In intersections, [ means line, [[ means multiline, else point
                        // We strip these markers since we don't distinguish line/multiline/point
                        intersections = intersections.replace("[[", "")
                        intersections = intersections.replace("]]", "")
                        intersections = intersections.replace("[", "")
                        intersections = intersections.replace("]", "")
                        let pts = intersections.split(";");
                        let clr = vjmap.randomColor();
                        pts.forEach(pt => {
                            if (!pt) return;
                            let p = vjmap.GeoPoint.fromString(pt)
                            new vjmap.Marker({color: clr}).setLngLat(map.toLngLat(p)).addTo(map);
                        })
        
                    }
                }
            }
        }
        
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>Actions:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={queryIntersections}>Draw line and find intersections with map</button>
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