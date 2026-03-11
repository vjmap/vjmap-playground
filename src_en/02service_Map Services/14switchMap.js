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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/14switchMap
        // --Switch map [same map object]--Switch by map id; map object stays the same
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        // Demo: switch map and load overlays for that map
        const mapPolygons = {} ; // Map id -> polygons
        
        const mapids = ["sys_zp", "sys_hello", "sys_world", "sys_cad2000"]
        let curIdx = 1;
        let curMapId = mapids[0]
        const switchMap = async () => {
            curMapId = mapids[curIdx++ % mapids.length]
            await map.switchMap({
                mapid: curMapId,
                style: vjmap.openMapDarkStyle()
            });
            // Load overlays for this map
            showMapPolygons();
        }
        
        
        // Draw a polygon
        const drawPolygon = async () => {
            let drawPoly = await vjmap.Draw.actionDrawPolygon(map, {
            });
            if (drawPoly.cancel) {
                return ;// Cancelled
            }
            let polygon = new vjmap.Polygon({
                data: drawPoly.features[0].geometry.coordinates,
                fillColor: '#0f0',
                fillOpacity: 0.6,
                fillOutlineColor: "#f00",
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygon.addTo(map);
        
            // Store polygon for this map id
            mapPolygons[curMapId] = mapPolygons[curMapId] || [];
            mapPolygons[curMapId].push(polygon);
        }
        
        
        // Show polygons for current map
        const showMapPolygons = () => {
            if (!mapPolygons[curMapId]) return
            for(let polygon of mapPolygons[curMapId]) {
                polygon.addTo(map);
            }
        }
        
        // Clear polygons
        const clearPolygon = () => {
            if (!mapPolygons[curMapId]) return
            for(let polygon of mapPolygons[curMapId]) {
                polygon.remove();
            }
        }
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Map switch</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => switchMap() }>Switch map</button>
                        <button className="btn" onClick={ () => drawPolygon() }>Draw polygon</button>
                        <button className="btn" onClick={ () => clearPolygon() }>Clear polygons</button>
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