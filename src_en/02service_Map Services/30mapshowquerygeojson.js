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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/30mapshowquerygeojson
        // --Query part of map and draw on front-end--Get render data by bounds or condition, draw as GeoJSON on front-end
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        let mapid = env.exampleMapId;
        // Get original map metadata
        let metadata = await svc.metadata(mapid, "v1");
        let mapBounds = vjmap.GeoBounds.fromString(metadata.bounds);
        // Create geometric projection from map extent
        let prj = new vjmap.GeoProjection(mapBounds);
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterBlankStyle(0, 24), // style
            center: prj.toLngLat(mapBounds.center()), // Set map center
            zoom: 2, // Set map zoom level
            renderWorldCopies: false // Do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        
        await map.onLoad()
        let style = await svc.createStyle({
            backcolor: 0xFFFFFF // light theme
        }, mapid)
        // Query all entities in a bounds
        let res = await svc.conditionQueryFeature({
            mapid: mapid,
            version: "v1",
            layer: style.stylename,
            condition: ``,
            bounds: [587685118.956964,3103929741.304815,587740977.733287,3103995128.931217],
            geom: true,
            includegeom: true,
            isContains: false,
            realgeom: true,
            fields: "",
            limit: 100000 // Large limit to get all; default 100
        })
        
        
        const features = [];
        if (res && res.result && res.result.length > 0) {
            for (let ent of res.result) {
                if (ent.geom && ent.geom.geometries) {
                    let clr = map.entColorToHtmlColor(ent.color); // Entity color to HTML color
                    for (let g = 0; g < ent.geom.geometries.length; g++) {
                        let featureAttr = {};
                        if (ent.isPolygon) {
                            featureAttr.color = clr; // Fill color (polygon only)
                            featureAttr.noneOutline = true; // No polygon outline (polygon only)
                        } else {
                            featureAttr.color = clr; // color
                            featureAttr.line_width = ent.lineWidth < 0 ? 1: ent.lineWidth; // line width
                        }
                        features.push({
                            id: vjmap.RandomID(10),
                            type: "Feature",
                            properties: {
                                objectid: ent.objectid + "_" + g,
                                opacity: ent.alpha / 255,
                                ...featureAttr,
                            },
                            geometry: ent.geom.geometries[g],
                        });
                    }
                }
            }
        }
        let geojson =  {
            type: "FeatureCollection",
            features: features,
        };
        const opts = vjmap.Draw.defaultOptions();
        // Change default style: point radius 1, no stroke (default 5)
        let pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-point-stroke-inactive");
        if (pointIdx >= 0) {
            opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 0
        }
        pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-inactive");
        if (pointIdx >= 0) {
            opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 1
        }
        map.getDrawLayer(opts).set(geojson);
        
        // Fit to current data extent
        let dataExtent = vjmap.GeoBounds.fromDataExtent(geojson)
        map.fitBounds(dataExtent.toArray() ,{
            padding: 50,
            duration: 0 // No animation
        });
        
        
        // Add mouse position
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
        
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