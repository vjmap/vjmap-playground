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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/mapsync
        // --Map sync--
        
        // Under #"map” map div create asame-size div，as container for second map
        const createNewMapDivIds = ()=> {
            // Clear previous
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
        
        const createCadMap = async (containerId, mapid, version, style)=> {
            // Map service object
            let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
            // Open map
            let res = await svc.openMap({
                mapid: mapid, // map ID
                version: version, // version
                mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
                style: style
            })
            if (res.error) {
                // If open failed
                message.error(res.error)
            }
            // Get map bounds
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // Create geo projection from map bounds
            let prj = new vjmap.GeoProjection(mapExtent);
        
            let center = prj.toLngLat(mapExtent.center());
            // Map object
            let map = new vjmap.Map({
                container: containerId, // DIV container ID
                style: svc.rasterStyle(), // style
                center: center, // set map center
                zoom: 1, // set zoom level
                renderWorldCopies: false // do not show world copies
            });
        
            // Attach service and projection
            map.attach(svc, prj);
            // Fit map to full extent
            map.fitMapBounds();
        
            return map;
        }
        
        let newMapIds = createNewMapDivIds();
        const map1 = await createCadMap(newMapIds[0], env.exampleMapId, "", vjmap.openMapDarkStyle())
        const map2 = await createCadMap(newMapIds[1], env.exampleMapId,"", {
            name: "styleDark", // style name
            backcolor: 0, // background color when opening on server
            // Custom expression
            expression: "var color := gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);gOutColorAlpha[0] := 50;"
        })
        vjmap.syncMaps(map1, map2);
        
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