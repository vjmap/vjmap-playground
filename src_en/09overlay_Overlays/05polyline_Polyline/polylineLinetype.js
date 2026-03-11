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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/polyline/polylineLinetype
        // --Polyline line type--
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
            center: [2.3653, 48.8688], // set map center
            zoom: 14, // set zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.fromLngLat(map.getBounds()); // current map visible bounds
        
        // draw line
        const drawCycle = ()=> {
            let path = mapBounds.randomPoints(3, 4);
        
            let polyline1 = new vjmap.Polyline({
                data: map.toLngLat(path),
                lineColor: "#444",
                lineWidth: 20,
                lineJoin: "round",
                lineCap: "round"
            });
            polyline1.addTo(map);
        
            let polyline2 = new vjmap.Polyline({
                data: map.toLngLat(path),
                lineColor: "white",
                lineWidth: 2,
                lineDasharray: [30,8,5,8],
                lineOffset: 7
            });
            polyline2.addTo(map);
        
            let polyline3 = new vjmap.Polyline({
                data: map.toLngLat(path),
                lineColor: "yellow",
                lineWidth: 1,
                lineDasharray: [3,6],
                lineOffset: -7
            });
            polyline3.addTo(map);
        }
        drawCycle()
        
        
        // draw route
        const drawBusRoute = ()=>{
            let geoJson = getJsonData();
        
            let lineWeight = 6;
            let lineColors = ['red', '#08f', '#0c0', '#f80'];
        
        
            let ends = [];
            const addStop = ll => {
                for(var i=0, found= false; i< ends.length && !found; i++) {
                    found = (ends[i][0] == ll[1] && ends[i][0] == ll[1]);
                }
                if(!found) {
                    ends.push(ll);
                }
            }
        
            let lineSegment, linesOnSegment, segmentCoords, segmentWidth;
            let geoDatas = []
            geoJson.features.forEach((lineSegment) => {
                segmentCoords = lineSegment.geometry.coordinates;
        
                linesOnSegment = lineSegment.properties.lines;
                segmentWidth = linesOnSegment.length * (lineWeight + 1);
        
                geoDatas.push({
                    points: segmentCoords, // coords already lnglat, no map.toLngLat needed
                    properties: {
                        color: '#000',
                        width: segmentWidth + 5,
                        offset: 0
                    }
                })
                geoDatas.push({
                    points: segmentCoords, // coords already lnglat, no map.toLngLat needed
                    properties: {
                        color: '#fff',
                        width: segmentWidth + 3,
                        offset: 0
                    }
                })
        
        
                for(let j=0;j < linesOnSegment.length;j++) {
                    geoDatas.push({
                        points: segmentCoords, // coords already lnglat, no map.toLngLat needed
                        properties: {
                            color: lineColors[linesOnSegment[j]],
                            width: lineWeight,
                            offset: j * (lineWeight + 1) - (segmentWidth / 2) + ((lineWeight + 1) / 2)
                        }
                    })
        
                }
        
                addStop(segmentCoords[0]);
                addStop(segmentCoords[segmentCoords.length - 1]);
            });
        
        
            let polylines = new vjmap.Polyline({
                data: geoDatas,
                lineColor: ['get', 'color'],
                lineWidth: ['get', 'width'],
                lineOffset: ['get', 'offset'],
                lineJoin: "round",
                lineCap: "round"
            });
            polylines.addTo(map);
        
            const cirlces = new vjmap.Circle({
                data: ends,// coords already lnglat, no map.toLngLat needed
                circleColor: "#ccc" ,
                circleStrokeColor: "#000",
                circleStrokeWidth: 4,
                circleRadius: 10
            });
            cirlces.addTo(map);
        }
        
        
        const getJsonData = ()=> {
            return {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "lines": [0, 1]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    2.357919216156006,
                                    48.87621773324153
                                ],
                                [
                                    2.357339859008789,
                                    48.874834693731664
                                ],
                                [
                                    2.362983226776123,
                                    48.86855408432749
                                ],
                                [
                                    2.362382411956787,
                                    48.86796126699168
                                ],
                                [
                                    2.3633265495300293,
                                    48.86735432768131
                                ]
                            ]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "lines": [2, 3]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    2.351503372192383,
                                    48.86443950493823
                                ],
                                [
                                    2.361609935760498,
                                    48.866775611250205
                                ],
                                [
                                    2.3633265495300293,
                                    48.86735432768131
                                ]
                            ]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "lines": [1, 2]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    2.369627058506012,
                                    48.86619159489603
                                ],
                                [
                                    2.3724031448364253,
                                    48.8626397112042
                                ],
                                [
                                    2.3728322982788086,
                                    48.8616233285001
                                ],
                                [
                                    2.372767925262451,
                                    48.86080456075567
                                ]
                            ]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "lines": [0]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    2.3647427558898926,
                                    48.86653565369396
                                ],
                                [
                                    2.3647642135620117,
                                    48.86630981023694
                                ],
                                [
                                    2.3666739463806152,
                                    48.86314789481612
                                ],
                                [
                                    2.3673176765441895,
                                    48.86066339254944
                                ]
                            ]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "lines": [0, 1, 2, 3]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    2.3633265495300293,
                                    48.86735432768131
                                ],
                                [
                                    2.3647427558898926,
                                    48.86653565369396
                                ]
                            ]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "lines": [1, 2, 3]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    2.3647427558898926,
                                    48.86653565369396
                                ],
                                [
                                    2.3650002479553223,
                                    48.86660622956524
                                ],
                                [
                                    2.365509867668152,
                                    48.866987337550164
                                ],
                                [
                                    2.369627058506012,
                                    48.86619159489603
                                ]
                            ]
                        }
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "lines": [3]
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    2.369627058506012,
                                    48.86619159489603
                                ],
                                [
                                    2.372349500656128,
                                    48.865702850895744
                                ]
                            ]
                        }
                    }
                ]
            };
        }
        drawBusRoute();
        
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