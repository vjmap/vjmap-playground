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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolpath
        // --Symbol path animation--
        // Map service: url and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID (ensure it exists; upload new map to create)
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
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
            zoom: 4,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds (make map visible)
        // map.fitMapBounds();
        
        await map.onLoad()
        
        // load icons
        await map.loadImageEx("man", env.assetsPath + `images/man.png`);
        await map.loadImageEx("girl", env.assetsPath + `images/girl.png`);
        
        
        const mapBounds = map.getGeoBounds(0.6);
        
        const pointCount = 1000;
        const geojson = {
            type: 'FeatureCollection',
            features: []
        }
        let dateUpdateTime = new Date()
        for (let i = 0; i < pointCount; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                type: "Feature",
                id: i,
                properties: {
                    name: `ID:${i + 1}`,
                    icon: i % 2 == 0 ? "man" : "girl",
                    prePoint: [pt.x, pt.y],
                    curPoint: [pt.x, pt.y],
                    dateUpdateTime: dateUpdateTime // data update time
                },
                geometry: {
                    type: "Point",
                    coordinates: map.toLngLat(pt)
                }
            }
            geojson.features.push(data);
        }
        
        const symbols = new vjmap.Symbol({
            data: geojson,
            // Icon name from geojson properties.icon
            iconImage: ['get', 'icon'],
            // Use icon1 below zoom 2, otherwise use icon from properties
            //iconImage: ["step", ["zoom"], "icon1", 2, ['get', 'icon']],
            iconOffset: [0, -20],
            // opacity 0.8 on hover, 1.0 otherwise
            iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 1.0],
            textField: ['get', 'name'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 14,
            textColor: '#FFA0FD',
            textOffset: [0, 0.5],
            textAnchor: 'top',
            iconAllowOverlap: true,
            textAllowOverlap: true,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        symbols.addTo(map);
        symbols.clickLayer(e => {
            if (e.defaultPrevented) return; // skip if default prevented
            if (map.logInfo) map.logInfo(`Clicked ${e.features[0].id} , name ${e.features[0].properties.name}, icon`)
            e.preventDefault(); // Prevent subsequent event handling
        })
        
        
        // data change period
        let dataChangePeriod = 1000; // Data update every 1 second
        
        let isUseMakerDebug = true; // use marker for debug
        let marker1 = [], marker2 = []
        // Simulate next data change
        const mockNextData = () => {
            let features = geojson.features;
            let dateUpdateTime = new Date()
            for (let i = 0; i < features.length; i++) {
                // Current coordinate
                const pt = features[i].properties.curPoint;
                features[i].properties.prePoint = [pt[0], pt[1]]; // save previous point
                // Simulate new position
                let mockMoveDist = mapBounds.width() / 30; // Mock move distance
                pt[0] += mockMoveDist * Math.random() * (Math.random() > 0.5 ? 1 : -1);
                pt[1] += mockMoveDist * Math.random() * (Math.random() > 0.5 ? 1 : -1);
                features[i].properties.curPoint = [pt[0], pt[1]]; // Next move position
                features[i].properties.dateUpdateTime = dateUpdateTime// data update time
        
                if (isUseMakerDebug) {
                    if (i == 0) {
                        // debug first
                        if (!marker1[i]) {
                            let clr = vjmap.randomColor()
                            marker1[i] = new vjmap.Marker().setLngLat([0, 0])
                            marker1[i].setColor(clr)
                            marker1[i].addTo(map);
                            marker1[i].getElement().style.opacity = 0.5
                            marker2[i] = new vjmap.Marker().setLngLat([0, 0])
                            marker2[i].setColor(clr)
                            marker2[i].addTo(map)
                        }
                        marker1[i].setLngLat(map.toLngLat(features[i].properties.prePoint))
                        marker2[i].setLngLat(map.toLngLat(features[i].properties.curPoint))
                    }
                }
            }
        }
        
        // timer for mock updates
        setInterval(mockNextData, dataChangePeriod)
        
        
        let isSetDataing = false; // is setting data
        let isWaitSourceLoaded = false; // waiting for source
        // on data change
        map.on('data', async (event) => {
            // If current symbol data changed
            if (event.sourceId === symbols.sourceId) {
                if (isWaitSourceLoaded) return;
                isWaitSourceLoaded = true;
                // wait for update done
                await waitSourceLoaded();
                isWaitSourceLoaded = false;
                // set done flag
                isSetDataing = false;
            }
        });
        
        // wait for source load
        const waitSourceLoaded = async () => {
            return new Promise((resolve) => {
                let tid = setInterval(() => {
                    // if source loaded
                    if (map.isSourceLoaded(symbols.sourceId)) {
                        // clear timer, return
                        clearInterval(tid)
                        resolve();
                    }
                }, 20)
            })
        }
        
        vjmap.createAnimation({
            from: 0,
            to: 1,
            repeat: Infinity,
            duration: dataChangePeriod,
            ease: vjmap.linear, // linear
            onUpdate: latest => {
                if (isSetDataing) {
                    // exit if setting data
                    return;
                }
                // Set "setting data" flag
                isSetDataing = true;
                let curTime = new Date()
                for (let i = 0; i < geojson.features.length; i++) {
                    const prop = geojson.features[i].properties;
                    let ratio = (curTime - prop.dateUpdateTime) / dataChangePeriod ; // Path ratio: elapsed time / update period
                    if (ratio >= 1) {
                        ratio = 1;
                    }
                    const path = vjmap.interpolatePointsByRatio([prop.prePoint, prop.curPoint], ratio);
                    let pt = prop.prePoint;
                    if (path.length > 0 ) {
                        pt = path[path.length - 1]
                    }
                    // update coords
                    geojson.features[i].geometry.coordinates = map.toLngLat(pt);
                }
                map.setData(symbols.sourceId, geojson)
            }
        })
        
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