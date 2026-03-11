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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22hightselentitypoly
        // --Polygon select entities--Draw polygon to highlight entities in the selected area
        // Set div background to light
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
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
            pitch: 0,
            //minZoom: initZoom - 3,// can set a minimum zoom
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        
        const name = "myhighlight";
        const highlightColor = "#FF8957";
        const addSourceLayer = () => {
            // Data source
            map.addGeoJSONSource(`${name}-source`, {
                type: "FeatureCollection",
                features: []
            });
        
            map.addLineLayer(`${name}-line-layer`, `${name}-source`, {
                lineJoin: "round",
                lineCap: "round",
                lineColor: highlightColor,
                lineWidth: 3,
                lineOpacity: 0.8,
                filter: [
                    "==",
                    ["geometry-type"],
                    "LineString"
                ]
            });
        
        
            map.addFillLayer(`${name}-fill-layer`, `${name}-source`, {
                fillColor: highlightColor,
                fillOpacity: 1.0,
                filter: [
                    "==",
                    ["geometry-type"],
                    "Polygon"
                ]
            })
        
        }
        const clear = () => {
            if (map.getSource(`${name}-source`)) {
                map.getSource(`${name}-source`).setData({
                    type: "FeatureCollection",
                    features: []
                });
            }
        };
        
        
        const highlight_ent = async (bounds,isContains) => {
        
            let res = await svc.conditionQueryFeature({
                condition: ``, // WHERE condition only; see docs "Server condition/expression query"
                bounds:bounds,// find entities in this bounds
                fields: "",
                includegeom: true, // whether to return geometry; when realgeom false, >1 returns bbox only, 1 returns real geojson; realgeom true returns geojson per entity
                realgeom: true,
                isContains: isContains,// true=contained only, false=intersect
                limit: 100000 // large limit to get all; default 100
            })
        
            if (res && res.result && res.result.length > 0) {
                if (!map.getSource(`${name}-source`)) {
                    addSourceLayer();// first-time init
                }
        
                const geom = {
                    geometries: [],
                    type: "GeometryCollection"
                }
        
                for(let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        geom.geometries.push(...ent.geom.geometries)
                    }
                }
                if (geom.geometries.length > 0) {
                    map.getSource(`${name}-source`).setData(geom);
                } else {
                    clear();
                }
            } else {
                clear();
            }
            map.triggerRepaint();
        };
        
        const drawHighlight = async (isContains) => {
            let polygon = await vjmap.Draw.actionDrawPolygon(map);
            if (polygon.cancel) {
                return
            }
            let coords = map.fromLngLat(polygon.features[0].geometry.coordinates[0]).map(pt => pt.toArray())
            highlight_ent(coords, isContains);
        }
        
        const clearHighlight  = () => {
            clear();
            map.triggerRepaint();
        }
        
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Polygon select entities</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => drawHighlight(true) }>Draw polygon to select entities (contain)</button>
                        <button className="btn" onClick={ () => drawHighlight(false) }>Draw polygon to select entities (intersect)</button>
                        <button className="btn" onClick={ () => clearHighlight() }>Clear highlight</button>
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