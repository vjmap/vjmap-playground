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
        // --点标记Marker聚合(聚合通过Symbol绘制)--
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
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 适应至地图范围大小
        map.fitMapBounds();
        await map.onLoad();
        
        let mapBounds = map.getGeoBounds(); // 得到地图地理范围
        
        // 随机生成一些点
        let geoJsonData = {
            features: [],
            type: "FeatureCollection"
        }
        let pointCount = 500; // 模拟的点数
        for(let i = 0; i < pointCount; i++) {
            let point = mapBounds.randomPoint();// 生成一个随机点
            let feature = {
                geometry: {
                    coordinates: [point.x, point.y],
                    type: "Point"
                },
                id: i,
                properties: {
                    index: i,
                    color: vjmap.randomColor() // 属性中加个颜色，用来改变marker的颜色，也可以再加一些自定义字段
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
            clusterMaxZoom: 3, // 0-3级才会聚合，超过3级，到第四级时会全部显示
            clusterRadius: 60 // 多大像素范围内的点才聚合到一起
        });
        
        //添加聚合图层
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
                    // 把属性数据加进marker里面
                    marker.props = {...props}
                    let popup = new vjmap.Popup({
                        offset: [0, -32]
                    })
                        .setHTML(`第 ${id} 个点`)
                    marker.setPopup(popup)
                }
                newMarkers[id] = marker;
        
                if (!markersOnScreen[id]) {
                    marker.addTo(map);
                }
            }
            // 移除已经隐藏的
            for (const id in markersOnScreen) {
                if (!newMarkers[id]) markersOnScreen[id].remove();
            }
            markersOnScreen = newMarkers;
        }
        
        // 在数据加载完成后，每帧刷新时候更新
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
        
        
        
        // 模拟数据变化
        
        setInterval(() => {
            for(let i = 0; i < geoJsonData.features.length; i++) {
                if(vjmap.randInt(0, 10) > 3) continue; // 随机变化一些点坐标
                geoJsonData.features[i].geometry.coordinates =  map.toLngLat(mapBounds.randomPoint());
            }
            // 设置数据源数据
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