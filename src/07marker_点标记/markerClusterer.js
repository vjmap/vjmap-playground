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
        // --点符号聚合--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 3, // 设置地图缩放级别
            fadeDuration: 0, // 控制标签碰撞的淡入/淡出动画的持续时间，以毫秒为单位
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 适应至地图范围大小
        map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds(); // 得到地图地理范围
        
        let geoJsonData = mapBounds.randomGeoJsonPointCollection(5000); // 在范围内随机生成5000个点
        
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
                .setHTML(`第 ${index} 个点`)
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