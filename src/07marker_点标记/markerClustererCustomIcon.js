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
        // --点符号聚合自定义图标--
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
        
        for(let i = 0; i < 5; i++) {
            await map.loadImageEx(`icon${i}`, env.assetsPath + `images/sensor${i + 1}.png`);
        }
        
        let geoJsonData = mapBounds.randomGeoJsonPointCollection(5000); // 在范围内随机生成5000个点
        
        map.addSource('test-points', {
            type: 'geojson',
            data: map.toLngLat(geoJsonData),
            cluster: true,
            clusterMaxZoom: 10,
            clusterRadius: 60
        });
        
        //添加聚合图层
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
            // 使用map.properties 把属性 驼峰式 写法改成 kebab-case 写法
            ...map.properties({
                // 这里的图标，是根据属性index取余而来
                // 对应js为 'icon' + (index % 5)
                // 这里只是为了演示下表达式的写法，通常情况下，直接把icon的值，放进geojson的properties中
                // 如 geojson.properties.icon = 'icon' + (index % 5),这里直接 通过 ['get', 'icon'] 获取即可
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
            .setHTML(`第 ${index} 个点`)
            .addTo(map);
        });
        
        
        map.on('mouseenter', 'unclustered-point', function () {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point', function () {
            map.getCanvas().style.cursor = '';
        });
        
        // 模拟数据变化
        setInterval(() => {
            for(let i = 0; i < geoJsonData.features.length; i++) {
                if(vjmap.randInt(0, 10) > 3) continue; // 随机变化一些点坐标
                geoJsonData.features[i].geometry.coordinates =  map.toLngLat(mapBounds.randomPoint());
            }
            // 设置数据源数据
            map.setData('test-points', geoJsonData);
        }, 15000)
        
        // 模拟增加数据的情况
        map.addControl(
            new vjmap.ButtonGroupControl(
                {
                    buttons: [
                        {
                            id: "addPoint",
                            text: "加点",
                            title: "绑定一个新的点坐标至聚合中",
                            onActivate: async (ctx, e) => {
                                let marker;
                                let actionPoint = await vjmap.Draw.actionDrawPoint(map, {
                                    /* 如果需要捕捉cad图上面的点
                                     api: {
                                        getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                                     },
                                     */
                                    updatecoordinate: (e) => {
                                        if (!e.lnglat) return;
                                        if (!marker) {
                                            // 如果第一次新增
                                            marker = new vjmap.Marker();
                                            marker.setLngLat(e.lnglat);
                                            marker.addTo(map);
                                        } else {
                                            // 更新坐标
                                            marker.setLngLat(e.lnglat);
                                        }
                                    },
                                    contextMenu: (e) => {
                                        // 点击右键弹出菜单
                                        new vjmap.ContextMenu({
                                            event: e.event.originalEvent,
                                            theme: "dark", //light
                                            width: "250px",
                                            items: [
                                                {
                                                    label: '取消',
                                                    onClick: () => {
                                                        // 给地图发送ESC键消息即可取消，模拟按ESC键
                                                        map.fire("keyup", {keyCode:27})
                                                    }
                                                }
                                            ]
                                        });
        
                                    }
                                });
                                if (actionPoint.cancel) {
                                    // 如果是按ESC键取消了
                                    if (marker) marker.remove();
                                    return null;
                                }
                                // 获取点的cad坐标
                                let co = map.fromLngLat(actionPoint.features[0].geometry.coordinates);
                                // 先获取数据源之前的数据
                                let data = map.getSourceData('test-points');
                                data = vjmap.cloneDeep(data);
                                // 更新数据
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
                                // 更新数据源
                                map.setData('test-points', data);
                                if (marker) marker.remove(); // 删除临时绘制绑点的marker
                                // 更新下之前的数据变量
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