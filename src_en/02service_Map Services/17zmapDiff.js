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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/17zmapDiff
        // --Compare map differences--Find modified/added/deleted parts between maps or versions
        
        // Note: This example uses pixel-based comparison. For entity-level diff, see condition query examples.
        // https://vjmap.com/app/cloud/#/map/sys_zp?version=v1&mapopenway=GeomRender&vector=false
        // In cloud UI: Smart recognition -> Map compare
        
        // Create same-size divs under #map as containers for the two maps
        const createNewMapDivIds = ()=> {
            let parentDiv = document.getElementById("map");
            parentDiv.style.display = "flex";
            parentDiv.style.justifyContent = "space-between"
            let newMapDiv1 = document.createElement("div");
            newMapDiv1.id = vjmap.RandomID(6);
            newMapDiv1.style.flex = "1";
            parentDiv.appendChild(newMapDiv1);
        
            let newMapDiv2 = document.createElement("div");
            newMapDiv2.id = vjmap.RandomID(6);
            newMapDiv2.style.flex = "1";
            parentDiv.appendChild(newMapDiv2);
            return [newMapDiv1.id, newMapDiv2.id];
        }
        
        let service = new vjmap.Service(env.serviceUrl, env.accessToken)
        const createCadMap = async (containerId, mapid, version, style)=> {
            let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
            let res = await svc.openMap({
                mapid: mapid, // Map ID
                version: version, // Version (empty = latest)
                mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
                style: style
            })
            if (res.error) {
                message.error(res.error)
            }
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            let prj = new vjmap.GeoProjection(mapExtent);
        
            let center = prj.toLngLat(mapExtent.center());
            let map = new vjmap.Map({
                container: containerId, // Container ID
                style: svc.rasterStyle(), // Raster style
                center: center,
                zoom: 1,
                renderWorldCopies: false
            });
        
            map.attach(svc, prj);
            map.fitMapBounds();
        
            return map;
        }
        
        let newMapIds = createNewMapDivIds();
        
        let mapId1 = env.exampleMapId;
        let mapId2 = env.exampleMapId;
        
        const map1 = await createCadMap(newMapIds[0], mapId1, "", vjmap.openMapDarkStyle())
        const map2 = await createCadMap(newMapIds[1], mapId2,"", {
            name: "styleCloseWz", // Style name
            backcolor: 0, // Background color
            layeroff: [3,10,24] // Turn off layers 3, 10, 24
        })
        let cancelCB = vjmap.syncMaps(map1, map2); // Returns cancel-sync callback
        
        let diff = await service.cmdMapDiff({
            mapid1: mapId1,
            version1: "",
            layer1: map1.getService().currentMapParam().layer,
            mapid2: mapId2,
            version2: "",
            layer2: map2.getService().currentMapParam().layer
        })
        
        if (diff.error) {
            cancelCB();
            message.error(diff.error);
            return;
        }
        
        const drawPolygons = (map, points, color) => {
            if (points.length === 0) return;
            points.forEach(p => p.push(p[0])); // Close ring
            let polygons = points.map(p => {
                return {
                    points: map.toLngLat(p),
                    properties: {
                        color: color
                    }
                }
            })
            vjmap.createAntPathAnimateLineLayer(map, polygons, {
                fillColor1: color,
                fillColor2: "#0ffb",
                canvasWidth: 128,
                canvasHeight: 32,
                frameCount: 4,
                lineWidth: 4,
                lineOpacity: 0.8
            });
        }
        if (diff.modify.length === 0) {
            message.info("Maps are identical; no differences found.");
            return;
        }
        // Modified
        drawPolygons(map2, diff.modify, "#f00");
        // Added
        drawPolygons(map2, diff.new, "#0f0");
        // Deleted
        drawPolygons(map1, diff.del, "#00f");
        
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