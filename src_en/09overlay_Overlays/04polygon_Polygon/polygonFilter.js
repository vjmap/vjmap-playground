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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polygon/polygonFilter
        // --Polygon filter--
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
        let mapBounds = map.getGeoBounds(0.6);
        
        let len = mapBounds.width() / 100;
        let polygons = []
        for(let i = 0; i < 1000; i++) {
            const isSquare = vjmap.randInt(0, 1);
            const pts = []
            const p1 = mapBounds.randomPoint();
            const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
            const p3 = vjmap.geoPoint([p1.x + len, p1.y + len]);
            pts.push(p1, p2, p3);
            if (isSquare) {
                pts.push(vjmap.geoPoint([p1.x + len, p1.y]));
            }
            polygons.push({
                points: map.toLngLat(pts),
                properties: {
                    name: "polygon" + (i + 1),
                    color: vjmap.randomColor(),
                    type: isSquare ? "square": "triangle"
                }
            })
        }
        
        
        let polygon = new vjmap.Polygon({
            data: polygons,
            // red on hover, otherwise use 'color' from properties
            fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', ['get', 'color']],
            fillOpacity: 0.8,
            fillOutlineColor: "#f00",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polygon.addTo(map);
        polygon.clickLayer(e => message.info(`Clicked ${e.features[0].id} , name ${e.features[0].properties.name}, color ${e.features[0].properties.color} polygon`))
        polygon.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3><h4>Color: ${f.properties.color}<h4><h4>Shape: ${f.properties.type === "square" ? "square": "Triangle"}<h4>`, { anchor: 'bottom' });
        
        const filterTriangle = () => {
            polygon.setFilter(['all',
                ['==', 'type', 'triangle']]);
        }
        
        const filterSquareRedYellow = () => {
            polygon.setFilter(['all',
                ['!=', 'type', 'triangle'],
                ['in', 'color', '#0000ff','#00ff00']])
        }
        
        const cancelFilter = () => {
            polygon.setFilter(null);
        }
        
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Filter</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => filterTriangle() }>Triangle</button>
                        <button className="btn" onClick={ () => filterSquareRedYellow() }>Blue/green square</button>
                        <button className="btn" onClick={ () => cancelFilter() }>All</button>
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