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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/text/02scalesymboltext
        // --Scalable symbol text-- Basic symbol text with scale
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: 'sys_hello', // map ID (ensure it exists; upload new map to create)
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: {
                backcolor: 0
            }
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create projection
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds();
        
        const geoDatas = []
        for(let i = 0; i < 10; i++) {
            let pt = map.toLngLat(mapBounds.randomPoint());
            const data = {
                point: pt,
                properties: {
                    index: i,
                    text: 'text' + i, // Store original text content
                    color: vjmap.randomColor()
                },
            }
            geoDatas.push(data);
        }
        
        let fontHeight =  8;
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            textField: ['get', 'text'],
            textFont: ['Arial Unicode MS Regular'],
            // Text size via expressions; size scales with zoom level
            textSize:  [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0, ["*", fontHeight, ["^", 2, 0]],
                24, ["*", fontHeight, ["^", 2, 24]]
            ],
            textColor: ['get', 'color'],
            textOffset: [0, -0.5],
            textAnchor: 'top',
            textRotationAlignment: "map",
            textMaxWidth: 10000000, // no auto wrap
            iconAllowOverlap: true,
            textAllowOverlap: true
        });
        symbols.addTo(map);
        
        // change value
        let count = 0;
        const changeStatData = async () => {
            count++
            for(let i = 0; i < geoDatas.length; i++) {
                let text = geoDatas[i].properties.text; // Get original text content
                geoDatas[i].properties.text = `text${i}(${count})`;
            }
            symbols.setData(geoDatas) ;// update data
        }
        await changeStatData();
        setInterval(async () => {
            await changeStatData();
        }, 5000); // refresh every 5s
        
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