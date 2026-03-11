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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/11stats
        // --Service performance stats (real-time)--Replace CAD text with real-time data from template
        // js code
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: "sys_stats", // Map ID (ensure it exists; upload new drawing to create)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: {
                backcolor: 0,
                // Hide variable text by expression; variable text is yellow in this map, so filter yellow
                expression: "gOutVisible := (gInColorRed == 255 and gInColorGreen == 255 and gInColorBlue == 0) ? 0 : 1;"
            }
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map instance
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // Raster tile style
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        
        // Entity type ID to name mapping
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        // Query all variable text by condition
        let queryEntTypeId = getTypeNameById("AcDbMText");
        let query = await svc.conditionQueryFeature({
            // Filter text, yellow color
            condition: `name='${queryEntTypeId}' and color = -16711681`, // SQL WHERE only; see docs "Server condition query"
            fields: "",
            limit: 100000 // Large limit to get all; default 100
        })
        
        const geoDatas = []
        for(let i = 0; i < query.result.length; i++) {
            let item = query.result[i];
            let bounds = map.getEnvelopBounds(item.envelop);
            // Use text center as symbol point
            let pt = map.toLngLat(bounds.center());
            const data = {
                point: pt,
                properties: {
                    index: item.objectid,
                    text: item.text, // Original text
                    val: item.text // New text value
                },
            }
            geoDatas.push(data);
        }
        
        let fontHeight =  10;
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            textField: ['get', 'val'],
            textFont: ['Arial Unicode MS Regular'],
            // Text size by zoom (expression auto-scales with zoom)
            textSize:  [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0, ["*", fontHeight, ["^", 2, 0]],
                24, ["*", fontHeight, ["^", 2, 24]]
            ],
            textColor: '#FFFF00',
            textOffset: [0, -0.5],
            textAnchor: 'top',
            textRotationAlignment: "map",
            textMaxWidth: 10000000, // No auto wrap
            iconAllowOverlap: true,
            textAllowOverlap: true
        });
        symbols.addTo(map);
        
        // Fetch performance data from backend and update values
        const changeStatData = async () => {
            let { data } = await vjmap.httpHelper.get(svc.baseUrl() + "_stats");
            for(let i = 0; i < geoDatas.length; i++) {
                let text = geoDatas[i].properties.text; // Original text
                // Look up data by this key
                let val = "";
                if (text === "status") {
                    val = data['gin.status.200']['count'];
                } else {
                    val = data['gin.latency'][text];
                    if (text !== "count") {
                        val = parseInt(val / 1000000); // Time: ns to ms
                    }
                }
                geoDatas[i].properties.val = val;
            }
            symbols.setData(geoDatas) ; // Update data
        }
        await changeStatData();
        setInterval(async () => {
            await changeStatData();
        }, 5000); // Refresh every 5 seconds
        
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