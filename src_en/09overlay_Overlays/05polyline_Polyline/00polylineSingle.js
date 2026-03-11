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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polyline/00polylineSingle
        // --Single polyline--
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
        await map.onLoad();
        let mapBounds = map.getGeoBounds(0.3);
        const routePath = [];
        routePath.push(mapBounds.min);
        routePath.push(mapBounds.center());
        routePath.push(vjmap.geoPoint([mapBounds.max.x, mapBounds.min.y]));
        routePath.push(mapBounds.max);
        routePath.push(vjmap.geoPoint([mapBounds.min.x, mapBounds.max.y]));
        
        let polyline = new vjmap.Polyline({
            data: map.toLngLat(routePath),
            // red on hover, otherwise use 'color' from properties
            lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', 'yellow'],
            lineWidth: 3,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polyline.addTo(map);
        
        let scale = 0.3;
        const changeCoordinate = () => {
            scale -= 0.05;
            if (scale <= 0) scale = 0.3;
            // update coordinates via setData
            let mapBounds = map.getGeoBounds(scale);
            const newPath = [];
            newPath.push(mapBounds.min);
            newPath.push(mapBounds.center());
            newPath.push(vjmap.geoPoint([mapBounds.max.x, mapBounds.min.y]));
            newPath.push(mapBounds.max);
            newPath.push(vjmap.geoPoint([mapBounds.min.x, mapBounds.max.y]));
            polyline.setData(map.toLngLat(newPath));
        }
        
        
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Data</h4>
                    <div className="input-item">
                        <button className="btn" onClick={() => changeCoordinate()}>Change coordinates</button>
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