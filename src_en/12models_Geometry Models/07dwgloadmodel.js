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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/models/07dwgloadmodel
        // --Load geometry model from CAD map--
        // Note: This example uses the vjgeo library, which wraps geometry models for reuse across projects.
        // Include vjgeo via html script `vjgeo.min.js`, or npm install vjgeo and `import vjgeo from 'vjgeo'`
        // Geometry model guide https://vjmap.com/guide/geomodel.html
        // Geometry model API https://vjmap.com/docs/geomodel/
        // Note: This example uses the vjcommon library for common vjmap utilities.
        // Include vjcommon via html script `vjcommon.min.js`, or npm install vjcommon and `import vjcommon from 'vjcommon'`
        // vjcommon is open source: https://github.com/vjmap/vjmap-common
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: "sys_hello", // Map ID (ensure it exists; upload a new drawing to create one)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        // New map instance
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // Raster tile style
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        // Fit map in view
        map.fitMapBounds();
        
        await map.onLoad();
        
        const createGeoModel = async () => {
            let star = new vjgeo.models.Star(vjmap.randInt(6, 12),50,15,2);
            star.data.isFill = vjmap.randInt(0, 2) == 0; // Random fill
            star.data.colorIndex = vjmap.randInt(0, 7); // Random color index
            vjgeo.model.move(star, [200, 0]);
            let cloneCount = vjmap.randInt(4, 15);
            let model = vjgeo.layout.cloneToRadial(star, cloneCount, 360 / cloneCount);
            let dwgDoc = vjgeo.exporter.toDWG(model);
            await addDwgDocToMap(dwgDoc);
        }
        
        const loadSymbolGeoModel = async () => {
            let symbolMapId = "sys_symbols";
            let symbolMapVer = "v1";
            let svc = map.getService();
            let styleName = await svc.getStyleLayerName(symbolMapId, symbolMapVer, true);
            // Fetched data: if condition unchanged, consider caching instead of fetching every time; here we fetch each time for demo
            let data = await vjcommon.queryMapData(
                map,
                {
                    mapid: symbolMapId,
                    version: symbolMapVer,
                    layer: styleName,
                    coordType: 1, // Geometry coordinates
                    condition: "layerindex=2", // SQL WHERE clause only; see docs "Server condition query and expression query"
                }
            );
            // Convert queried GeoJSON to geometry model
            let symbol = vjgeo.importer.fromGeoJsonData(data);
            // Get symbol extent
            let extent = vjgeo.measure.modelExtents(symbol)
            // Grid layout for model
            let model = vjgeo.layout.cloneToGrid(symbol, 3, 2, extent.width / 2);
            let dwgDoc = vjgeo.exporter.toDWG(model);
            await addDwgDocToMap(dwgDoc);
        }
        
        const addDwgDocToMap = async (doc) => {
            let dwgDoc = new vjmap.DbDocument();
            dwgDoc.entitys = doc.entitys
            let geojson = await map.createDbGeomData(dwgDoc);
            let result = await vjcommon.interactiveCreateGeom(geojson, map);
            if (!(result && result.feature && result.feature.features)) return;
            let mapJson = map.getDrawLayer().getAll();
            mapJson.features.push(...result.feature.features);
            map.getDrawLayer().set(mapJson);
        }
        
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <h4>Actions:</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={createGeoModel}>Create radial layout geometry model</button>
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={loadSymbolGeoModel}>Load DWG symbols and create model</button>
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