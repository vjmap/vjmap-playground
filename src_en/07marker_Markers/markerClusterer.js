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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/markerClusterer
        // --Point symbol clustering--
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
            fadeDuration: 0, // Fade duration in ms for label collision
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit to map bounds
        map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds(); // Get map bounds
        
        let geoJsonData = mapBounds.randomGeoJsonPointCollection(5000); // 5000 random points in bounds
        
        map.addSource('test-points', {
            type: 'geojson',
            data: map.toLngLat(geoJsonData),
            cluster: true,
            clusterMaxZoom: 10,
            clusterRadius: 60
        });
        
        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'test-points',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#57FF8C',
                    100,
                    '#FFA0FD',
                    1000,
                    '#FF420E'
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    1000,
                    40
                ]
            }
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
            type: 'circle',
            source: 'test-points',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#0ef7ff',
                'circle-radius': 5,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#007b7b'
            }
        });
        
        map.on('click', 'clusters', function (e) {
            let features = map.queryRenderedFeatures(e.point, {
                layers: ['clusters']
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
        
        map.on('click', 'unclustered-point', function (e) {
            let coordinates = e.features[0].geometry.coordinates.slice();
            let index = e.features[0].properties.index;
        
            new vjmap.Popup()
                .setLngLat(coordinates)
                .setHTML(`Point ${index}`)
                .addTo(map);
        });
        
        map.on('mouseenter', 'clusters', function () {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', function () {
            map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', 'unclustered-point', function () {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point', function () {
            map.getCanvas().style.cursor = '';
        });
        
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