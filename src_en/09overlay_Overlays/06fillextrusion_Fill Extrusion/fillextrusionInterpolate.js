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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/fillextrusion/fillextrusionInterpolate
        // --Extrusion polygon by zoom level--show extrusion only above certain zoom
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set map zoom level,
            pitch: 60, // pitch angle
            antialias: true, // antialias
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.6);
        let height = mapBounds.width() / 50;
        let len1 = mapBounds.width() / 100;
        let len2 = mapBounds.width() / 200;
        let len3 = mapBounds.width() / 300;
        let geoDatas = [];
        const h1 = prj.toMeter(height);
        const h2 = prj.toMeter(height * 2);
        for(let i = 0; i < 100; i++) {
            const c = mapBounds.randomPoint();
            const radius = vjmap.randInt(len1, len2);
            const cirlePath = vjmap.getCirclePolygonCoordinates(c, radius);
            geoDatas.push({
                points: map.toLngLat(cirlePath),
                properties: {
                    name: "circle" + (i + 1),
                    color1: vjmap.randomColor(),
                    color2: vjmap.randomColor(),
                    type: "circle",
                    baseHeight: 0,
                    height: vjmap.randInt(h1, h2)
                }
            })
        }
        
        const gradColor = [
            "interpolate",
            ["linear"],
            ['get', 'height'],
            h1,
            'red',
            h2,
            'green',
        ];
        let fillExtrusions = new vjmap.FillExtrusion({
            data: geoDatas,
            // When hover use red; otherwise use 'color' from properties
            fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', gradColor],
            fillExtrusionOpacity: 0.8,
            // Show height only above zoom level 3
            fillExtrusionHeight:[
                "interpolate", ["linear"], ["zoom"],
                3, 0,
                3.05, ['get', 'height']
            ],
            fillExtrusionBase: ['get', 'baseHeight'],
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        fillExtrusions.addTo(map);
        fillExtrusions.clickLayer(e => message.info(`You clicked #${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}, type: ${e.features[0].properties.type}`))
        fillExtrusions.hoverPopup(f => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`, { anchor: 'bottom' });
        map.flyTo({center: [0, 0], zoom: 4, speed: 0.2});
        
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