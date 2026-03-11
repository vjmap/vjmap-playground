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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/markerClustererMarker
        // --Marker clustering (clusters drawn with Symbol)--
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
        
        // Random points
        let geoJsonData = {
            features: [],
            type: "FeatureCollection"
        }
        let pointCount = 500; // Point count
        for(let i = 0; i < pointCount; i++) {
            let point = mapBounds.randomPoint(); // Random point
            let feature = {
                geometry: {
                    coordinates: [point.x, point.y],
                    type: "Point"
                },
                id: i,
                properties: {
                    index: i,
                    color: vjmap.randomColor() // Custom color for marker; add more props as needed
                },
                type: "Feature",
            }
            geoJsonData.features.push(feature)
        }
        
        
        let sourceId = 'test-points';
        map.addSource(sourceId, {
            type: 'geojson',
            data: map.toLngLat(geoJsonData),
            cluster: true,
            clusterMaxZoom: 3, // Cluster at zoom 0-3; above 3 show all
            clusterRadius: 60 // Pixel radius for clustering
        });
        
        // Add cluster layers
        let outerColors = [
            [1000, 'rgba(253, 156, 115, 0.6)'],
            [100, 'rgba(241, 211, 87, 0.6)'],
            [0, 'rgba(181, 226, 140, 0.6)']
        ];
        
        outerColors.forEach(function (color, i) {
            map.addLayer({
                "id": "point-outer-cluster-" + i,
                "type": "circle",
                "source": sourceId,
                "paint": {
                    "circle-color": color[1],
                    "circle-radius": 20
                },
                "filter": i === 0 ?
                    [">=", "point_count", color[0]]:
                    ["all",
                        [">=", "point_count", color[0]],
                        ["<", "point_count", outerColors[i - 1][0]]
                    ],
            });
        });
        let innerColors = [
            [1000, 'rgba(241, 128, 23, 0.6)'],
            [100, 'rgba(240, 194, 12, 0.6)'],
            [0, 'rgba(110, 204, 57, 0.6)']
        ];
        
        innerColors.forEach(function (color, i) {
            map.addLayer({
                "id": "point-inner-cluster-" + i,
                "type": "circle",
                "source": sourceId,
                "paint": {
                    "circle-color": color[1],
                    "circle-radius": 15
                },
                "filter": i === 0 ?
                    [">=", "point_count", color[0]]:
                    ["all",
                        [">=", "point_count", color[0]],
                        ["<", "point_count", innerColors[i - 1][0]]
                    ]
            });
        });
        
        
        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: sourceId,
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Arial Unicode MS Regular'],
                'text-size': 12
            }
        });
        
        
        const markers = {};
        let markersOnScreen = {};
        
        function updateMarkers() {
            const newMarkers = {};
            const features = map.querySourceFeatures(sourceId);
        
            for (const feature of features) {
                const coords = feature.geometry.coordinates;
                const props = feature.properties;
                if (props.point_count > 0) continue;
                const id = props.index;
                let marker = markers[id];
                if (!marker) {
                    marker = markers[id] = new vjmap.Marker({
                        color: props.color
                    }).setLngLat(coords);
                    // Attach props to marker
                    marker.props = {...props}
                    let popup = new vjmap.Popup({
                        offset: [0, -32]
                    })
                        .setHTML(`Point ${id}`)
                    marker.setPopup(popup)
                }
                newMarkers[id] = marker;
        
                if (!markersOnScreen[id]) {
                    marker.addTo(map);
                }
            }
            // Remove hidden
            for (const id in markersOnScreen) {
                if (!newMarkers[id]) markersOnScreen[id].remove();
            }
            markersOnScreen = newMarkers;
        }
        
        // Update on each frame after data loaded
        map.on('render', () => {
            if (!map.isSourceLoaded(sourceId)) return;
            updateMarkers();
        });
        
        
        for(let i = 0; i < outerColors.length; i++) {
            let clusterLayer = "point-outer-cluster-" + i;
            map.on('click', clusterLayer, e => {
                let features = map.queryRenderedFeatures(e.point, {
                    layers: [clusterLayer]
                });
                let clusterId = features[0].properties.cluster_id;
                map.getSource(sourceId).getClusterExpansionZoom(
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
        
        
        
        // Simulate data change
        
        setInterval(() => {
            for(let i = 0; i < geoJsonData.features.length; i++) {
                if(vjmap.randInt(0, 10) > 3) continue; // Randomly change some points
                geoJsonData.features[i].geometry.coordinates =  map.toLngLat(mapBounds.randomPoint());
            }
            // Set source data
            map.setData(sourceId, geoJsonData);
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