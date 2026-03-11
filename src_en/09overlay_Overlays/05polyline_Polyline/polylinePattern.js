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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polyline/polylinePattern
        // --Line pattern fill animation-- see arrow animation demo for more
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
        
        let mapBounds = map.getGeoBounds(0.3);
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const routePath = [];
        // random points within map bounds
        routePath.push(mapBounds.min);
        routePath.push(mapBounds.center());
        routePath.push(vjmap.geoPoint([mapBounds.max.x, mapBounds.min.y]));
        routePath.push(mapBounds.max);
        routePath.push(vjmap.geoPoint([mapBounds.min.x, mapBounds.max.y]));
        
        
        
        // create animation atlas
        const createArrow = (w, h, offset, arrowLen, strokeClr = "#fff", fillClr = "#0f0", lineWidth = 4) => {
            let canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            let context = canvas.getContext('2d');
            context.clearRect(0, 0, w, h);
            context.beginPath();
            context.strokeStyle = strokeClr;
            if (fillClr) context.fillStyle = fillClr;// transparent if fillClr empty
            context.fillRect(0, 0, w, h)
            let lw = lineWidth;
            context.lineWidth = lineWidth;
            context.moveTo(offset + lw, 2 + lineWidth);
            context.lineTo(offset + arrowLen - lw, h / 2);
            context.lineTo(offset + lw, h - 4 - lineWidth);
            context.stroke();
            return context.getImageData(
                0,
                0,
                w,
                h
            );
        }
        
        for (let i = 0; i < 4; i++) {
            map.addImage('arrow' + i, createArrow(64, 32, i * 16, 16), { pixelRatio: 1 });
        }
        
        map.addGeoJSONSource('lines', {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                id: 0,
                geometry: {
                    type: "LineString",
                    coordinates: map.toLngLat(routePath)
                }
            }]
        });
        map.addLineLayer("lineLayer", "lines", {
            lineWidth: 16,
            linePattern: 'arrow0'
        });
        
        let cnt = 0;
        setInterval(() => {
            let idx = (cnt++) % 4
            map.setPaintProperty("lineLayer", "line-pattern", 'arrow' + idx)
        }, 200)
        
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