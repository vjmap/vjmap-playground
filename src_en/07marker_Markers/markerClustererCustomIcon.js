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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/markerClustererCustomIcon
        // --Point cluster custom icon--
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
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 3, // set map zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit to map bounds
        map.fitMapBounds();
        await map.onLoad();
        
        let mapBounds = map.getGeoBounds(); // Get map bounds
        
        for(let i = 0; i < 5; i++) {
            await map.loadImageEx(`icon${i}`, env.assetsPath + `images/sensor${i + 1}.png`);
        }
        
        let geoJsonData = mapBounds.randomGeoJsonPointCollection(5000); // 5000 random points
        
        map.addSource('test-points', {
            type: 'geojson',
            data: map.toLngLat(geoJsonData),
            cluster: true,
            clusterMaxZoom: 10,
            clusterRadius: 60
        });
        
        // Add cluster layers
        let outerColors = [[1000, 'rgba(253, 156, 115, 0.6)'], [100, 'rgba(241, 211, 87, 0.6)'], [0, 'rgba(181, 226, 140, 0.6)']];
        
        outerColors.forEach(function (color, i) {
            map.addLayer({
                "id": "point-outer-cluster-" + i,
                "type": "circle",
                "source": "test-points",
                "paint": {
                    "circle-color": color[1],
                    "circle-radius": 20
                },
                "filter": i === 0 ?
                    [">=", "point_count", color[0]] :
                    ["all", [">=", "point_count", color[0]], ["<", "point_count", outerColors[i - 1][0]]]
            });
        });
        let innerColors = [[1000, 'rgba(241, 128, 23, 0.6)'], [100, 'rgba(240, 194, 12, 0.6)'], [0, 'rgba(110, 204, 57, 0.6)']];
        
        innerColors.forEach(function (color, i) {
            map.addLayer({
                "id": "point-inner-cluster-" + i,
                "type": "circle",
                "source": "test-points",
                "paint": {
                    "circle-color": color[1],
                    "circle-radius": 15
                },
                "filter": i === 0 ?
                    [">=", "point_count", color[0]] :
                    ["all", [">=", "point_count", color[0]], ["<", "point_count", innerColors[i - 1][0]]]
            });
        });
        
        
        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'test-points',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['simsun'],
                'text-size': 12
            }
        });
        
        map.addLayer({
            id: 'unclustered-point',
            type: 'symbol',
            source: 'test-points',
            filter: ['!', ['has', 'point_count']],
            // map.properties converts camelCase to kebab-case
            ...map.properties({
                // Icon from index % 5; in JS: 'icon' + (index % 5). Usually put icon in geojson.properties and use ['get','icon']
                iconImage: ["concat", "icon", ["to-string", ["%", ["to-number", ['get', 'index']], 5]]],
                iconOffset: [0, -17],
                textField: ['get', 'index'],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 14,
                textColor: '#FFA0FD',
                textOffset: [0, 0],
                textAnchor: 'top',
                iconAllowOverlap: false,
                textAllowOverlap: false
            })
        });
        
        for(let i = 0; i < outerColors.length; i++) {
            let clusterLayer = "point-outer-cluster-" + i;
            map.on('click', clusterLayer, e => {
                let features = map.queryRenderedFeatures(e.point, {
                    layers: [clusterLayer]
                });
                let clusterId = features[0].properties.cluster_id;
                map.getSource('test-points').getClusterExpansionZoom(
                    clusterId,
                    function (err, zoom) {
                        if (err) return;
        
                        map.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom
                        });
                    }
                );
            });
        
        
        
        
            map.on('mouseenter', clusterLayer, e => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', clusterLayer, e => {
                map.getCanvas().style.cursor = '';
            });
        }
        
        
        map.on('click', 'unclustered-point', function (e) {
            let coordinates = e.features[0].geometry.coordinates.slice();
            let index = e.features[0].properties.index;
        
            new vjmap.Popup({
                offset: [0, -32]
            })
            .setLngLat(coordinates)
            .setHTML(`Point ${index}`)
            .addTo(map);
        });
        
        
        map.on('mouseenter', 'unclustered-point', function () {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point', function () {
            map.getCanvas().style.cursor = '';
        });
        
        // Simulate data change
        setInterval(() => {
            for(let i = 0; i < geoJsonData.features.length; i++) {
                if(vjmap.randInt(0, 10) > 3) continue; // Randomly change some points
                geoJsonData.features[i].geometry.coordinates =  map.toLngLat(mapBounds.randomPoint());
            }
            // Set source data
            map.setData('test-points', geoJsonData);
        }, 15000)
        
        // Simulate adding a point
        map.addControl(
            new vjmap.ButtonGroupControl(
                {
                    buttons: [
                        {
                            id: "addPoint",
                            text: "Add point",
                            title: "Bind a new point to cluster",
                            onActivate: async (ctx, e) => {
                                let marker;
                                let actionPoint = await vjmap.Draw.actionDrawPoint(map, {
                                    /* To snap to CAD: api: { getSnapFeatures: snapObj }, assign features to snapObj.features */
                                    updatecoordinate: (e) => {
                                        if (!e.lnglat) return;
                                        if (!marker) {
                                            // First time
                                            marker = new vjmap.Marker();
                                            marker.setLngLat(e.lnglat);
                                            marker.addTo(map);
                                        } else {
                                            // Update position
                                            marker.setLngLat(e.lnglat);
                                        }
                                    },
                                    contextMenu: (e) => {
                                        // Right-click menu
                                        new vjmap.ContextMenu({
                                            event: e.event.originalEvent,
                                            theme: "dark", //light
                                            width: "250px",
                                            items: [
                                                {
                                                    label: 'Cancel',
                                                    onClick: () => {
                                                        // Send ESC to cancel
                                                        map.fire("keyup", {keyCode:27})
                                                    }
                                                }
                                            ]
                                        });
        
                                    }
                                });
                                if (actionPoint.cancel) {
                                    // Cancelled with ESC
                                    if (marker) marker.remove();
                                    return null;
                                }
                                // Get point CAD coordinate
                                let co = map.fromLngLat(actionPoint.features[0].geometry.coordinates);
                                // Get current source data
                                let data = map.getSourceData('test-points');
                                data = vjmap.cloneDeep(data);
                                // Update data
                                data.features.push({
                                    geometry: {
                                        coordinates: map.toLngLat(co),
                                        type: "Point"
                                    },
                                    id: data.features.length + 1,
                                    properties: {
                                        index: data.features.length + 1,
                                    },
                                    type: "Feature"
                                })
                                // Update source
                                map.setData('test-points', data);
                                if (marker) marker.remove(); // Remove temp marker
                                geoJsonData = data;
                            },
                        },
                    ],
                },
                "top-right"
            )
        );
        
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