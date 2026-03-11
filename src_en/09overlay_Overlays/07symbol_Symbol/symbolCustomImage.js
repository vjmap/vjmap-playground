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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolCustomImage
        // --Custom icon layer--
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
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), //svc.rasterBlankStyle(0, 24), // style, raster here
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 2, // set zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        map.fitMapBounds();
        
        await map.onLoad();
        const mapBounds = map.getGeoBounds(0.6);
        
        const geoDatas = []
        for(let i = 0; i < 100; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name:  `ID:${i + 1}`
                }
            }
            geoDatas.push(data);
        }
        
        const flashingSquare = {
            width: 16,
            height: 16,
            data: new Uint8Array(16 * 16 * 4),
        
            onAdd: function(map) {
                this.map = map;
            },
        
            render: function() {
                // redraw while on map
                this.map.triggerRepaint();
        
                this.preData = this.preData || 0;
                if (Date.now() - this.preData >= 1000) {
                    // update every 1s
                    const color = [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)];
                    const bytesPerPixel = 4;
                    for (let x = 0; x < this.width; x++) {
                        for (let y = 0; y < this.height; y++) {
                            const offset = (y * this.width + x) * bytesPerPixel;
                            this.data[offset + 0] = color[0];
                            this.data[offset + 1] = color[1];
                            this.data[offset + 2] = color[2];
                            this.data[offset + 3] = 200;
                        }
                    }
        
                    this.preData = Date.now();
        
                    // return true if image changed
                    return true;
                }
            }
        }
        
        map.addImage('flashing_square', flashingSquare);
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            iconImage: "flashing_square",
            iconOffset: [0, 0],
            iconAllowOverlap: true
        });
        symbols.addTo(map);
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