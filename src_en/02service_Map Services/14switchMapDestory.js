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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/14switchMapDestory
        // --Switch map [map object changes, same div]--Destroy map then create new map attached to same div
        
        // Map ids to switch
        const mapids = ["sys_zp", "sys_hello", "sys_world", "sys_cad2000"]
        let curMapIdIndex = 0;
        /**
         * Create map instance
         * @param serviceUrl Service URL
         * @param mapId Map ID
         * @param mapOpenWay Open mode, default vjmap.MapOpenWay.GeomRender
         * @param isRaster true = raster, false = vector
         * @return {Promise<Map>}
         */
        async function newMap(serviceUrl, mapId, mapOpenWay = vjmap.MapOpenWay.GeomRender, isRaster = true) {
            // Map service
            let svc = new vjmap.Service(serviceUrl, env.accessToken)
            // Open map
            let res = await svc.openMap({
                mapid: mapids[curMapIdIndex], // Map ID
                mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
                style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
            })
            if (res.error) {
                // If open failed
                throw Error(res.error)
            }
            // Get map extent
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // Create projection from extent
            let prj = new vjmap.GeoProjection(mapExtent);
        
            // Memory mode => raster only
            if (mapOpenWay === vjmap.MapOpenWay.Memory) {
                isRaster = true;
            }
            // Map style
            let style = isRaster ? svc.rasterStyle() :	svc.vectorStyle();
            // Map instance
            let map = new vjmap.Map({
                container: 'map', // DIV container ID
                style: style, // Raster style
                center: prj.toLngLat(mapExtent.center()), // Center
                zoom: 2, // Initial zoom
                renderWorldCopies: false // Do not show world copies
            });
        
            // Attach service and projection
            map.attach(svc, prj);
            // Fit map to full extent
            map.fitMapBounds();
        
        
            // Enable click-to-highlight
            if (isRaster) {
                map.enableLayerClickHighlight(svc, e => {
                    if (!e) return;
                    let content = `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`
                    e && map.logInfo(content);
                })
            } else {
                // Hover highlight (highlights when mouse is over map element)
                map.enableVectorLayerHoverHighlight((event, feature, layer) => {
                    if (!feature) return;
                    // Click-highlight entity callback
                    let content = `event: ${event}; feature: ${feature.id}; layer: ${layer}`
                    map.logInfo(content)
                })
            }
        
            await map.onLoad();
            map.logInfo("Map loaded", "success")
        
            // Add data layers for testing
            await addDataLayer(map);
        
            return map;
        }
        
        // Add data layers for testing
        const addDataLayer = async (map) => {
            // Navigation control
            map.addControl(new vjmap.NavigationControl());
            // Mouse position control
            map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
            let bounds = map.getGeoBounds(); // Get map bounds
            // Add markers
            for(let n = 0; n < 3; n++) {
                let marker = new vjmap.Marker({
                    color: vjmap.randomColor(),
                    draggable: true
                }).setLngLat(map.toLngLat(bounds.randomPoint()))
                marker.addTo(map);
            }
        
            // Add a popup at random position
            let popupPoint = bounds.randomPoint();
            let popup = new vjmap.Popup({ closeOnClick: false })
                .setLngLat(map.toLngLat(popupPoint))
                .setHTML(`<h2><p style="color:#f00">Popup</p></h2>`)
                .addTo(map);
        
            // Create polyline with three random lines
            let polylineData = [];
            for(let i = 0; i < 3; i++) {
                const points = bounds.randomPoints(2, 4);
                polylineData.push({
                    points: map.toLngLat(points),
                    properties: {
                        name: `Line ${i+1}`,
                        color: vjmap.randomColor()
                    }
                });
            }
        
            // Create polyline layer
            let polylines = new vjmap.Polyline({
                data: polylineData,
                lineColor: ['get', 'color'],
                lineWidth: 3,
                lineOpacity: 0.8,
                isHoverPointer: true
            });
            polylines.addTo(map);
        
            // Click handler
            polylines.clickLayer(e => {
                map.logInfo(`Clicked: ${e.features[0].properties.name}`);
            });
        
        
            for (let i = 0; i < 4; i++) {
                // await map.loadImageEx("icon" + i, env.assetsPath + `images/sensor${i + 1}.png`);
                await map.loadImageEx("icon" + i, `https://vjmap.com/../../assets/images/sensor${i + 1}.png`);
            }
        
            const geoDatas = []
            for (let i = 0; i < 10; i++) {
                const pt = bounds.randomPoint();
                const data = {
                    point: map.toLngLat(pt),
                    properties: {
                        name: `ID:${i + 1}`,
                        icon: "icon" + vjmap.randInt(0, 3)
                    }
                }
                geoDatas.push(data);
            }
        
            const symbols = new vjmap.Symbol({
                data: geoDatas,
                // Icon name from geojson 'icon' property
                iconImage: ['get', 'icon'],
                // Below zoom 2 use icon1; above use property icon name
                //iconImage: ["step", ["zoom"], "icon1", 2, ['get', 'icon']],
                iconOffset: [0, -12],
                // Hover opacity 0.8, default 1.0
                iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 1.0],
                textField: ['get', 'name'],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 14,
                textColor: '#FFA0FD',
                textOffset: [0, 0.5],
                textAnchor: 'top',
                iconAllowOverlap: false,
                textAllowOverlap: false,
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            symbols.addTo(map);
            symbols.clickLayer(e => {
                if (e.defaultPrevented) return;
                map.logInfo(`Clicked symbol ${e.features[0].id}, name: ${e.features[0].properties.name}`)
                e.preventDefault();
            })
        
        
            let geoDatas2 = [];
            for(let i = 1;  i <= 2; i++) {
                let mapBounds = map.getGeoBounds(i / 10.0);
                let points = mapBounds.toPointArray();
                points.push(points[0]); // Close ring
                geoDatas2.push({
                    points: map.toLngLat(points),
                    id: i,
                    properties: {
                        lineWidth: 8 + i * 2,
                        name: `Ring ${i}`
                    }
                });
            }
        
            let arrowAnimateLine = vjmap.createArrowAnimateLineLayer(map, geoDatas2, {
                arrowFillColor: vjmap.randomColor(),
                arrowStrokeColor: "#fff",
                arrowStrokeWidth: 6,
                canvasWidth: 128,
                canvasHeight: 32,
                arrowWidth: 16,
                frameCount: 4,
                lineWidth: ['get', 'lineWidth'],
                lineOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            arrowAnimateLine.polyline.clickLayer(e => map.logInfo(`Clicked ${e.features[0].id}, name: ${e.features[0].properties.name}`))
            arrowAnimateLine.polyline.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });
        
            // Get draw layer
            const draw = map.getDrawLayer();
        
            // Add initial polygon
            draw.set(vjmap.createPolygonGeoJson(map.toLngLat(bounds.randomPoints(3, 3))));
        
        }
        
        
        
        // Create map
        let map = await newMap(env.serviceUrl, env.exampleMapId, vjmap.MapOpenWay.GeomRender, true)
        
        
        setInterval(async () => {
            map.logInfo("Destroying map")
            map.destory();
            curMapIdIndex = (curMapIdIndex + 1) % mapids.length;
            // Create new map instance
            map = await newMap(env.serviceUrl, env.exampleMapId, vjmap.MapOpenWay.GeomRender, true)
        }, 10000)
        
        
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