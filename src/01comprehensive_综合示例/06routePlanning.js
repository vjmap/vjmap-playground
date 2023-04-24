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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/06routePlanning
        // --路径规划--自动从CAD图中提取车位置，定义好路线，点击车时，自动规划到出口的位置
        // 下面的数据来源于唯杰地图可视化平台，此项目地址 https://vjmap.com/app/visual/#/edit?key=sys_be517afb&isLocal=false 可以配置或下载相关源码
        // 视频教程地址 https://mp.weixin.qq.com/s?__biz=MzkyOTMyMzAxMw==&mid=2247483910&idx=1&sn=79a94bfe1401ab3f522148a88231d383&chksm=c20a036cf57d8a7a3cfa43272e4805dd8f4707a9bbdc2a07133d59429924c9b24125421000c3#rd
        // 注: 此示例中引用了vjcommon库。此库是对唯杰地图常用的功能做了一定程度的封装，方便其他工程共用
        // vjcommon库可在 html 中引入`vjcommon.min.js`即可,或npm install vjcommon`通过`import vjcommon from 'vjcommon'`引入
        // vjcommon库是开源的。开源地址 https://github.com/vjmap/vjmap-common
        let mapApp =  new vjcommon.MapApp();
        mapApp.mount("map");
        const config = {
            "mapSources": [
                {
                    "id": "draw_JUT9nygZ",
                    "tag": "draw",
                    "source": {
                        "type": "geojson",
                        "data": {
                            "type": "FeatureCollection",
                            "features": [
                                {
                                    "id": "0b28286d5a500724bdfe9377b5999ebc",
                                    "type": "Feature",
                                    "properties": {
                                        "color": "#00ffff",
                                        "opacity": 1,
                                        "outlineColor": "#ff0000",
                                        "line_width": 1,
                                        "line_opacity": 1
                                    },
                                    "geometry": {
                                        "coordinates": [
                                            [
                                                289849.3790565223,
                                                133474.16353269506
                                            ],
                                            [
                                                289849.3790565223,
                                                100289.15546611557
                                            ],
                                            [
                                                214092.49231870734,
                                                100289.15546611557
                                            ],
                                            [
                                                214092.49231870734,
                                                133474.16353269506
                                            ],
                                            [
                                                289849.3790565223,
                                                133474.16353269506
                                            ]
                                        ],
                                        "type": "LineString"
                                    }
                                },
                                {
                                    "id": "226521f4f268601e3f160fe9ea429940",
                                    "type": "Feature",
                                    "properties": {
                                        "color": "#ff0000",
                                        "line_width": 1
                                    },
                                    "geometry": {
                                        "coordinates": [
                                            [
                                                214032.53190811275,
                                                116915.40178990133
                                            ],
                                            [
                                                290109.98189551383,
                                                116852.69398540907
                                            ]
                                        ],
                                        "type": "LineString"
                                    }
                                }
                            ]
                        }
                    },
                    "memo": "绘制的道路"
                },
                {
                    "id": "query_oMx2hsIM",
                    "tag": "query",
                    "query": {
                        "condition": "  layerindex = 0 and name = \"2\" ",
                        "bounds": "",
                        "isContains": false,
                        "coordType": 1,
                        "clearPropData": true
                    },
                    "source": {
                        "type": "geojson",
                        "data": {
                            "features": [],
                            "type": "FeatureCollection"
                        }
                    },
                    "memo": "查询车所在图层的线实体"
                },
                {
                    "id": "geojson_1vKBita9",
                    "tag": "static",
                    "source": {
                        "type": "geojson",
                        "data": {
                            "type": "FeatureCollection",
                            "features": [
                                {
                                    "id": "73fec08aaa38188d35ac446712f98c4a",
                                    "type": "Feature",
                                    "properties": {},
                                    "geometry": {
                                        "coordinates": [
                                            244605.72026535927,
                                            97112.81383865647
                                        ],
                                        "type": "Point"
                                    }
                                }
                            ]
                        }
                    },
                    "props": {},
                    "memo": "出入口位置"
                },
                {
                    "id": "geojson_drawroute",
                    "tag": "static",
                    "source": {
                        "type": "geojson",
                        "data": {
                            "type": "FeatureCollection",
                            "features": [
                                {
                                    "type": "Feature",
                                    "id": 1,
                                    "geometry": {
                                        "type": "LineString",
                                        "coordinates": []
                                    }
                                }
                            ]
                        }
                    },
                    "props": {},
                    "memo": "规划线（先为空,后面动态修改)"
                },
                {
                    "id": "change_AqLw2w7u",
                    "tag": "change",
                    "change": {
                        "fromSourceId": "query_oMx2hsIM",
                        "url": "",
                        "data": "",
                        "header": "",
                        "interval": 0,
                        "reqType": "SOURCE",
                        "processJS": "// 过滤出坐标长度为5的闭合的多边形\r\nlet features = data.features.filter(f => f.geometry.coordinates.length == 5);\r\n// 把多边形求出中心点，做为点坐标\r\nfeatures.forEach(f => {\r\n    const center = vjmap.polygonCentroid(f.geometry.coordinates.map(c => vjmap.geoPoint(c)));\r\n    f.geometry.type = \"Point\";\r\n    f.geometry.coordinates = [center.x, center.y];\r\n})\r\ndata.features = features;\r\nreturn data;"
                    },
                    "source": {
                        "type": "geojson",
                        "data": {
                            "features": [
                                {
                                    "type": "Feature",
                                    "id": "4_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[274466.73319749,108892.28139952,276866.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8922#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            275666.7331974896,
                                            111542.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "20_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[276866.73319749,108892.28139952,279266.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8923#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            278066.7331974867,
                                            111542.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "36_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[279266.73319749,108892.28139952,281666.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8924#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            280466.73319748876,
                                            111542.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "52_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[281666.73319749,108892.28139952,284066.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8925#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            282866.7331975163,
                                            111542.28139953596
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "68_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[284066.73319749,108892.28139952,286466.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8926#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            285266.7331974597,
                                            111542.28139951451
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "84_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[274466.73319749,103592.28139953,276866.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8927#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            275666.7331974878,
                                            106242.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "100_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[276866.73319749,103592.28139953,279266.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8928#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            278066.73319748737,
                                            106242.28139952564
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "116_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[279266.73319749,103592.28139953,281666.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8929#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            280466.73319748876,
                                            106242.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "132_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[281666.73319749,103592.28139953,284066.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C892A#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            282866.7331974867,
                                            106242.28139952564
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "148_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[284066.73319749,103592.28139953,286466.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C892B#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            285266.7331975162,
                                            106242.2813995354
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "164_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[274466.73319749,119692.28139953,276866.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C892C#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            275666.73319748795,
                                            122342.28139952513
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "180_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[276866.73319749,119692.28139953,279266.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C892D#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            278066.73319751566,
                                            122342.28139953726
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "196_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[279266.73319749,119692.28139953,281666.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C892E#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            280466.73319746077,
                                            122342.28139951301
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "212_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[281666.73319749,119692.28139953,284066.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C892F#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            282866.7331975163,
                                            122342.28139953726
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "228_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[284066.73319749,119692.28139953,286466.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8930#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            285266.7331974585,
                                            122342.28139951383
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "244_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[274466.73319749,124992.28139952,276866.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8931#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            275666.7331974602,
                                            127642.28139951255
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "260_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[276866.73319749,124992.28139952,279266.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8932#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            278066.73319748795,
                                            127642.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "276_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[279266.73319749,124992.28139952,281666.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8933#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            280466.73319748836,
                                            127642.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "292_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[281666.73319749,124992.28139952,284066.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8934#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            282866.7331974867,
                                            127642.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "308_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[284066.73319749,124992.28139952,286466.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8935#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            285266.7331974863,
                                            127642.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "324_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[260066.73319749,108892.28139952,262466.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8936#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            261266.73319748795,
                                            111542.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "340_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[262466.73319749,108892.28139952,264866.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8937#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            263666.73319748876,
                                            111542.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "356_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[264866.73319749,108892.28139952,267266.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8938#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            266066.73319748754,
                                            111542.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "372_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[267266.73319749,108892.28139952,269666.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8939#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            268466.733197514,
                                            111542.28139953596
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "388_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[269666.73319749,108892.28139952,272066.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C893A#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            270866.7331974632,
                                            111542.2813995144
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "404_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[272066.73319749,108892.28139952,274466.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C893B#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            273266.73319748754,
                                            111542.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "420_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[260066.73319749,103592.28139953,262466.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C893C#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            261266.7331974892,
                                            106242.28139952564
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "436_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[262466.73319749,103592.28139953,264866.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C893D#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            263666.73319746193,
                                            106242.28139951476
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "452_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[264866.73319749,103592.28139953,267266.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C893E#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            266066.7331974863,
                                            106242.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "468_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[267266.73319749,103592.28139953,269666.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C893F#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            268466.7331974892,
                                            106242.28139952564
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "484_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[269666.73319749,103592.28139953,272066.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8940#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            270866.73319751717,
                                            106242.2813995359
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "500_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[272066.73319749,103592.28139953,274466.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8941#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            273266.73319745966,
                                            106242.28139951476
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "516_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[260066.73319749,119692.28139953,262466.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8942#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            261266.7331974896,
                                            122342.28139952513
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "532_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[262466.73319749,119692.28139953,264866.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8943#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            263666.73319748876,
                                            122342.28139952513
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "548_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[264866.73319749,119692.28139953,267266.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8944#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            266066.7331974867,
                                            122342.28139952513
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "564_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[267266.73319749,119692.28139953,269666.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8945#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            268466.73319748795,
                                            122342.2813995243
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "580_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[269666.73319749,119692.28139953,272066.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8946#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            270866.7331974624,
                                            122342.28139951413
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "596_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[272066.73319749,119692.28139953,274466.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8947#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            273266.73319748836,
                                            122342.28139952595
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "612_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[260066.73319749,124992.28139952,262466.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8948#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            261266.73319748754,
                                            127642.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "628_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[262466.73319749,124992.28139952,264866.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8949#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            263666.7331975134,
                                            127642.28139953689
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "644_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[264866.73319749,124992.28139952,267266.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C894A#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            266066.7331974618,
                                            127642.28139951336
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "660_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[267266.73319749,124992.28139952,269666.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C894B#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            268466.73319751525,
                                            127642.28139953689
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "676_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[269666.73319749,124992.28139952,272066.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C894C#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            270866.7331974624,
                                            127642.28139951336
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "692_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[272066.73319749,124992.28139952,274466.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C894D#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            273266.7331975155,
                                            127642.28139953771
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "708_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[245666.73319749,108892.28139952,248066.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C894E#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            246866.733197489,
                                            111542.28139952575
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "724_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[248066.73319749,108892.28139952,250466.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C894F#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            249266.73319746213,
                                            111542.28139951327
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "740_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[250466.73319749,108892.28139952,252866.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8950#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            251666.73319748815,
                                            111542.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "756_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[252866.73319749,108892.28139952,255266.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8951#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            254066.7331975134,
                                            111542.28139953637
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "772_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[255266.73319749,108892.28139952,257666.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8952#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            256466.733197489,
                                            111542.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "788_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[257666.73319749,108892.28139952,260066.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8953#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            258866.73319748795,
                                            111542.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "804_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[245666.73319749,103592.28139953,248066.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8954#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            246866.7331974884,
                                            106242.28139952503
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "820_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[248066.73319749,103592.28139953,250466.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8955#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            249266.73319751193,
                                            106242.28139953499
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "836_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[250466.73319749,103592.28139953,252866.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8956#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            251666.73319748754,
                                            106242.28139952564
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "852_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[252866.73319749,103592.28139953,255266.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8957#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            254066.73319746315,
                                            106242.28139951425
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "868_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[255266.73319749,103592.28139953,257666.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8958#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            256466.73319748815,
                                            106242.28139952564
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "884_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[257666.73319749,103592.28139953,260066.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8959#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            258866.73319748612,
                                            106242.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "900_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[245666.73319749,119692.28139953,248066.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C895A#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            246866.7331974888,
                                            122342.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "916_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[248066.73319749,119692.28139953,250466.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C895B#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            249266.73319748673,
                                            122342.28139952513
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "932_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[250466.73319749,119692.28139953,252866.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C895C#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            251666.73319748795,
                                            122342.2813995243
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "948_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[252866.73319749,119692.28139953,255266.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C895D#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            254066.73319746376,
                                            122342.28139951383
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "964_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[255266.73319749,119692.28139953,257666.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C895E#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            256466.73319748713,
                                            122342.2813995243
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "980_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[257666.73319749,119692.28139953,260066.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C895F#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            258866.7331974884,
                                            122342.28139952595
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "996_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[245666.73319749,124992.28139952,248066.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8960#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            246866.7331974884,
                                            127642.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1012_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[248066.73319749,124992.28139952,250466.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8961#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            249266.73319748713,
                                            127642.2813995244
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1028_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[250466.73319749,124992.28139952,252866.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8962#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            251666.73319751347,
                                            127642.2813995373
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1044_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[252866.73319749,124992.28139952,255266.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8963#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            254066.7331974892,
                                            127642.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1060_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[255266.73319749,124992.28139952,257666.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8964#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            256466.73319748673,
                                            127642.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1076_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[257666.73319749,124992.28139952,260066.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8965#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            258866.73319748713,
                                            127642.2813995244
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1092_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[231266.73319749,108892.28139952,233666.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8966#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            232466.7331974886,
                                            111542.28139952503
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1108_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[233666.73319749,108892.28139952,236066.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8967#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            234866.7331974888,
                                            111542.28139952534
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1124_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[236066.73319749,108892.28139952,238466.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8968#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            237266.73319746452,
                                            111542.28139951399
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1140_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[238466.73319749,108892.28139952,240866.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8969#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            239666.73319751193,
                                            111542.28139953596
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1156_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[240866.73319749,108892.28139952,243266.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C896A#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            242066.73319748734,
                                            111542.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1172_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[243266.73319749,108892.28139952,245666.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C896B#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            244466.7331974884,
                                            111542.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1188_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[231266.73319749,103592.28139953,233666.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C896C#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            232466.73319748775,
                                            106242.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1204_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[233666.73319749,103592.28139953,236066.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C896D#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            234866.7331974644,
                                            106242.28139951466
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1220_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[236066.73319749,103592.28139953,238466.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C896E#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            237266.7331975112,
                                            106242.2813995356
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1236_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[238466.73319749,103592.28139953,240866.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C896F#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            239666.73319748795,
                                            106242.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1252_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[240866.73319749,103592.28139953,243266.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8970#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            242066.73319748754,
                                            106242.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1268_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[243266.73319749,103592.28139953,245666.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8971#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            244466.7331974644,
                                            106242.28139951435
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1284_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[231266.73319749,119692.28139953,233666.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8972#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            232466.7331974884,
                                            122342.28139952513
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1300_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[233666.73319749,119692.28139953,236066.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8973#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            234866.733197489,
                                            122342.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1316_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[236066.73319749,119692.28139953,238466.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8974#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            237266.73319746513,
                                            122342.28139951383
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1332_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[238466.73319749,119692.28139953,240866.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8975#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            239666.73319751275,
                                            122342.28139953643
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1348_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[240866.73319749,119692.28139953,243266.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8976#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            242066.73319748652,
                                            122342.28139952513
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1364_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[243266.73319749,119692.28139953,245666.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8977#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            244466.7331974894,
                                            122342.28139952595
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1380_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[231266.73319749,124992.28139952,233666.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8978#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            232466.73319748713,
                                            127642.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1396_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[233666.73319749,124992.28139952,236066.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8979#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            234866.73319748795,
                                            127642.28139952461
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1412_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[236066.73319749,124992.28139952,238466.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C897A#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            237266.7331974892,
                                            127642.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1428_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[238466.73319749,124992.28139952,240866.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C897B#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            239666.7331974636,
                                            127642.28139951192
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1444_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[240866.73319749,124992.28139952,243266.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C897C#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            242066.73319748754,
                                            127642.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1460_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[243266.73319749,124992.28139952,245666.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C897D#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            244466.7331974888,
                                            127642.2813995244
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1476_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[216866.73319749,108892.28139952,219266.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C897E#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            218066.73319748713,
                                            111542.28139952503
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1492_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[219266.73319749,108892.28139952,221666.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C897F#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            220466.73319748795,
                                            111542.28139952503
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1508_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[221666.73319749,108892.28139952,224066.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8980#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            222866.73319748754,
                                            111542.28139952503
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1524_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[224066.73319749,108892.28139952,226466.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8981#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            225266.73319746729,
                                            111542.2813995144
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1540_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[226466.73319749,108892.28139952,228866.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8982#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            227666.7331975106,
                                            111542.28139953596
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1556_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[228866.73319749,108892.28139952,231266.73319749,114192.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8983#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            230066.73319748754,
                                            111542.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1572_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[216866.73319749,103592.28139953,219266.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8984#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            218066.73319748815,
                                            106242.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1588_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[219266.73319749,103592.28139953,221666.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8985#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            220466.7331974884,
                                            106242.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1604_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[221666.73319749,103592.28139953,224066.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8986#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            222866.73319748713,
                                            106242.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1620_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[224066.73319749,103592.28139953,226466.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8987#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            225266.7331974894,
                                            106242.28139952503
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1636_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[226466.73319749,103592.28139953,228866.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8988#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            227666.73319748754,
                                            106242.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1652_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[228866.73319749,103592.28139953,231266.73319749,108892.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8989#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            230066.73319748652,
                                            106242.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1668_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[216866.73319749,119692.28139953,219266.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C898A#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            218066.7331974884,
                                            122342.28139952585
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1684_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[219266.73319749,119692.28139953,221666.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C898B#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            220466.73319748734,
                                            122342.28139952481
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1700_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[221666.73319749,119692.28139953,224066.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C898C#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            222866.73319748693,
                                            122342.28139952513
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1716_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[224066.73319749,119692.28139953,226466.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C898D#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            225266.7331974896,
                                            122342.28139952656
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1732_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[226466.73319749,119692.28139953,228866.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C898E#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            227666.73319748815,
                                            122342.2813995243
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1748_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[228866.73319749,119692.28139953,231266.73319749,124992.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C898F#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            230066.73319748713,
                                            122342.28139952595
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1764_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[216866.73319749,124992.28139952,219266.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8990#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            218066.7331974886,
                                            127642.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1780_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[219266.73319749,124992.28139952,221666.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8991#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            220466.73319746464,
                                            127642.28139951192
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1796_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[221666.73319749,124992.28139952,224066.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8992#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            222866.73319748775,
                                            127642.28139952524
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1812_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[224066.73319749,124992.28139952,226466.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8993#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            225266.7331974892,
                                            127642.28139952544
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1828_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[226466.73319749,124992.28139952,228866.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8994#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            227666.73319750998,
                                            127642.2813995373
                                        ]
                                    }
                                },
                                {
                                    "type": "Feature",
                                    "id": "1844_0",
                                    "properties": {
                                        "alpha": 255,
                                        "area": 12720000,
                                        "bounds": "[228866.73319749,124992.28139952,231266.73319749,130292.28139952]",
                                        "bulge": 0,
                                        "color": -9079179,
                                        "colorIndex": 256,
                                        "elevation": 0,
                                        "isclosed": 1,
                                        "layerindex": 0,
                                        "lineWidth": -1,
                                        "linetype": "ByLayer",
                                        "linetypeScale": 1,
                                        "name": "AcDbPolyline",
                                        "objectid": "1C8995#1D5B5E&1C009F",
                                        "thickness": 0,
                                        "xdata": ""
                                    },
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [
                                            230066.73319748673,
                                            127642.28139952524
                                        ]
                                    }
                                }
                            ],
                            "type": "FeatureCollection"
                        }
                    },
                    "memo": "数据处理成车坐标"
                }
            ],
            "mapLayers": [
                {
                    "layerId": "line_vk3aSPs9",
                    "sourceId": "draw_JUT9nygZ",
                    "type": "line",
                    "lineColor": "#54CBCB",
                    "lineWidth": 10,
                    "lineOpacity": 0.5,
                    "memo": "道路"
                },
                {
                    "layerId": "symbol_car",
                    "sourceId": "change_AqLw2w7u",
                    "type": "symbol",
                    "minzoom": 2,
                    "iconImage": "car",
                    "iconAllowOverlap": true,
                    "iconOpacity": [
                        "case",
                        [
                            "to-boolean",
                            [
                                "feature-state",
                                "hover"
                            ]
                        ],
                        0.6,
                        1
                    ],
                    "isHoverPointer": true,
                    "isHoverFeatureState": true,
                    "memo": "车"
                },
                {
                    "layerId": "marker_yI51AeKr",
                    "sourceId": "geojson_1vKBita9",
                    "type": "marker",
                    "color": "#3FB1CE",
                    "customImage": "<svg t=\"1676017821995\" class=\"icon\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" p-id=\"17670\" width=\"48\" height=\"48\"><path d=\"M509.170273 1022.494826C224.270931 1017.738476-3.732832 786.302916 0.903104 506.521167 5.53904 223.90969 239.5635-4.334901 520.007526 1.565381c282.430856 5.900282 503.87206 229.087488 503.149577 514.287865-0.662277 282.55127-236.914393 511.21731-513.98683 506.64158z\" fill=\"#218DCB\" p-id=\"17671\"></path><path d=\"M512.60207 979.627469C252.869238 979.687676 42.325494 769.746002 43.047977 511.277516 43.770461 253.110066 254.856068 43.890875 514.287865 44.372531c256.662277 0.481656 466.844779 211.567262 466.724365 468.711194-0.180621 256.842897-210.603951 466.483537-468.41016 466.543744z\" fill=\"#FFFFFF\" p-id=\"17672\"></path><path d=\"M443.424271 765.170273c0 23.902164-0.60207 47.864534 0.301035 71.706491 0.421449 11.920978-3.793039 15.111947-15.111948 14.750705-21.975541-0.78269-44.071496-0.662277-66.047036-0.060207-10.355597 0.301035-14.449671-2.76952-14.329257-13.727187 0.481656-49.068674-0.120414-98.197554 0.481656-147.266227 0.361242-28.116651 21.072437-48.165569 47.74412-47.864535 26.370649 0.240828 46.299153 20.590781 46.901223 48.827846 0.421449 24.504233 0 49.068674 0.060207 73.633114z\" fill=\"#FFFFFF\" p-id=\"17673\"></path><path d=\"M932.84666 512.060207c0.120414 233.783631-188.267168 422.652869-421.388523 422.412041-231.796802-0.240828-420.003763-188.507996-420.365004-420.425211-0.301035-234.626529 185.497648-422.532455 419.883349-424.519285 231.555974-1.926623 421.749765 188.507996 421.870178 422.532455z\" fill=\"#3A79B6\" p-id=\"17674\"></path><path d=\"M246.306679 293.749765c88.745061-97.896519 251.484478-121.497648 371.416745-53.463782 190.795861 108.252117 215.661336 367.443086 49.068674 510.735654-115.476952 99.281279-303.924741 94.524929-411.032926-10.054563-8.248354-8.067733-11.619944-13.125118-0.662276-21.554092 11.138288-8.549389 19.80809-24.684854 31.548447-26.912512 12.28222-2.348071 21.855127 14.991533 33.234243 22.878646 83.085607 57.437441 171.349012 64.60207 260.395108 19.567262 86.999059-44.011289 134.321731-117.88523 136.549389-216.444026 4.334901-190.555033-192.421449-315.063029-363.288805-230.773283-20.289746 9.994356-38.532455 23.360301-54.848542 38.773283-8.790216 8.248354-14.26905 7.646284-21.734713-0.842898-9.753528-11.078081-20.41016-21.313264-30.645344-31.909689z\" fill=\"#FFFFFF\" p-id=\"17675\"></path><path d=\"M606.404516 474.129821c-18.844779-18.302916-37.569144-36.786453-56.714958-54.788335-5.900282-5.53904-6.14111-8.669802-0.361242-15.05174 33.475071-36.84666 33.29445-37.027281 68.75635-1.866416 32.331138 32.09031 64.301035 64.60207 97.113829 96.210725 9.091251 8.790216 9.211665 13.847601 0.120414 22.758231-40.398871 39.43556-80.376294 79.352775-119.87206 119.691439-8.188147 8.368768-12.763876 8.790216-21.313265 0.240828-32.391345-32.391345-32.873001-32.210724-0.421449-64.240828 10.89746-10.716839 22.818438-20.470367 34.558796-31.006585-8.730009-8.669802-16.135466-5.779868-22.637817-5.779868-87.902164-0.240828-175.864534-0.60207-263.766698 0.240828-16.376294 0.180621-20.349953-4.876764-19.988711-20.530574 0.903104-40.880527 0.180621-40.880527 41.301975-40.880527h261.117592c0.722484-1.625588 1.444967-3.311383 2.107244-4.997178z\" fill=\"#FFFFFF\" p-id=\"17676\"></path></svg>",
                    "closeButton": true,
                    "closeOnClick": true,
                    "memo": "出入口"
                },
                {
                    "layerId": "animateLine_zETTvQdq",
                    "sourceId": "geojson_drawroute",
                    "type": "animateLine",
                    "minzoom": 2,
                    "animateImagesType": "arrow",
                    "animateImages_arrowFillColor": "#22B14C",
                    "animateImages_arrowStrokeColor": "#fff",
                    "animateImages_arrowStrokeWidth": 6,
                    "animateImages_arrowWidth": 16,
                    "animateImages_canvasWidth": 128,
                    "animateImages_canvasHeight": 32,
                    "animateImages_frameCount": 4,
                    "lineColor": "#ff0000",
                    "lineWidth": 10
                }
            ],
            "mapOpenOptions": {
                "mapid": "sys_parking",
                "version": "v1",
                "mapopenway": "GeomRender",
                "isVectorStyle": false,
                "style": {
                    "backcolor": 0
                }
            },
            "title": "路径规划",
            "thumbnail": "https://vjmap.com/server/dataImage?key=image_visual_be517afb&time=1676037435218",
            "mapImages": [
                {
                    "key": "car",
                    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAABqFJREFUaEPtmAtsHNUVhr87s7uz3rVjx8ZOHcckcR6iDrSkpVZ5CGGnFBFoRZGIKLYlqjaVQH2KVgpUoqFqAZVIVY1a0SK1UNsBEZBCVKUSwk4q0fAKSps2Jo2NKYnj+JEYm9je58yp7o7tXXt37XVjE6L6SqOdnTn33P87596Ze0ZxiTd1ietnCeBiZ3ApA0sZuMAIXPAU2t8p1uh/8IcDWDKO3+PDkih+04Ml4Nf6FITtOBHlIxyPElEBwv5xIvlrCG/doCIXwjBvgGfbpMI0+BHCTcDVhgGGAtN0fycP0wBluNLEAdsBR5KHbU+cOwmTNxFeM4Qn7vmS6p8P0LwAWttlq8AfNlawoqwIivKTQykNMSF4LgEaRiRpNRqCofNw9H0QxYbGWtU1l4/J+/MCaDkgf7y9hntnOveaELByHdK1G49AzE7v8+e3+EtDrdqaq7ecAVrbZPXGSjo3VOCd6TxogcfMdUjXTmdhNJze50QPdPawrX6L2pOLx5wBWl6VB67bxK7iZUm3xsgQBU/9PHlhcw3ccffs4x55C/Y+P2UTuuUuoldfO/V/eBRe62BPQ63atqAA+16Xd2/8DFekOvWc7CL43G+Tl27YAjffNj+ArXcTvapmWp+/HoVImPJttapvLoicMrD7oNx8eSmvXLkm6c535BDed/9OYvGe7II1692bK1fBLV9NH7fzOHSfgN4eGB5KHFJYjL2smPjajdhlK4mvq0706zgF3b081FCnHpsXQEubfA3FA8D1Co45wrcbt6hDLe3y0rXV3FlS4Lqz3j6Iv31fVt/OytWE7v3+tPt5T/8SYzB7QOOV6xm75/5En3Pn4Y0OjtXXqSub2+Q6Q/F7gU3A30Sxq7FW7Z10Pi0D39wZe7mi3IxVrVXVHg+f1hDYPCwmL1WvhsKg2618b8q0yYIx/IUvE6pws5J3uouit1+ZK5icucMF6B+C7r7Ee2KLqWjS4kNh+Xd3N509Z5xrmn/hKc8IUP9g/E8gjSJyfHmhcWJdlbG2tFSNIxgoYgoCc6pYAAOBYf0eFCG//6xY73U7H4x8JDeCOiciz+x+3PtIRgB9sf6h+K0K7hORr3yqzHhh82eNnJ4GC6A7o4t/HrNbenq5QcHPlpebu5/83vStR9ZF3LRHdhWXJNbDRW8KflJfpx7NJCQjQGu7fF7g8EVXniJAwTX1deqdmZoyArS0STOKhk8SgMD+xjqV9pJJA2hpk1tR7P8kiZ9asIqd9bVqagHr6+kA7dLUcdz+bjisKCiAYFBxWTH4fDm98xaMOx6HgbPC6JgwOipYXqhaax7afpu6PnWQNFW/esGRw0eS28TiQkVeHpSvNCgt+XggBgaF9953sDzQfy65715fZfDIdnOaiDRFjz7ryLHjLoAWv+NbJuEIPPWizaZqk64uB58f/JbCssDvc89Nz/yCr+uBSESIxiAaIfEbjgqryg3+1eHwna8biaj/ZrfNB2dciJwAml505M13pgOEIvDrZpuqdQanTjn0D6ZUIxO6dUVm+RRer55uYFmKkiL35tkPIR6DSNQVHIsKsXg6cOEyxRdrTF49EOfh+zzkWdDUatPT5453VbXBjsY5MvDkyyJOTOgbEMbGBJ9HRwqGRiQRgbJSxeEjDtFoOkSqpJIixYPbzYSIx5626emf3d7jgZrPebBtQQdQl6rlpYqoDcGAIhiEomKD+2/X28dkS5tCGmD4PCwL6oiCzwu64hobh/yJvZCeo6dOCwODbkGbqa1a4QLo1rzP4Y2j2W312qpcpVhR5takIx8JgYACPc3ibgB12akz++O7cgRIFaVrXT3X8wMQSHxncJueDiMjQiQ6MZ/1b9T9r9vmKxR+C17/hxt9HQz9NNOBcQ9Ffr4iMLHDsgVCYfcIx0A/iVKb9vU/AaQ6CfrBVIKafUZkzUymG3Eboo7SAUefZ2sLAjAyLJw5Pcso85I+3Xh5sWJFefbiOieA3+2XkwNDVGbT0XXCJh5bwPDPGGjNOhO/P/P7piDA4A/uVGWpXdIsn2i1d3r9xk/1F4PUbze6UygkDPZnX4wXEPyprpeVGgSC6QAFAZA4z/xwm/rGrAANO2I3FRapA5dXGoln+mTz+uizvHMX2QsBYdvkh8IyUWRDJCZ8eA56e53alse9B+cEEMWBmUJE2JlaCS2E0Gw+dBAzaVDCEsC0rexiZeH/OwM6qjoCM6M7c/EsVvQn/eaq4ePZ4C8i7RLAIgY3J9dLGcgpTItotJSBRQxuTq4v+Qz8FyI5nk8l4tV6AAAAAElFTkSuQmCC",
                    "options": "{\"width\":48,\"height\": 48}"
                }
            ],
            "program": {
                "onMapLoaded": "// 获取车图层\r\nconst carLayer = mapApp.layersInst['symbol_car'];\r\nif (!carLayer) return;\r\n// 获取路径规划线数据源数据\r\nconst routeSource = await mapApp.getSourceData(\"draw_JUT9nygZ\");\r\n// 获取出口点的数据源\r\nconst exitPointSource = await mapApp.getSourceData(\"geojson_1vKBita9\");\r\nconst exitPoint = vjmap.geoPoint(exitPointSource.features[0].geometry.coordinates);\r\n\r\n// 获取路线源每条线的坐标\r\nconst lines = [];\r\nfor (const ft of routeSource.features) {\r\n    lines.push(ft.geometry.coordinates.map(co => vjmap.geoPoint(co)));\r\n}\r\n// 两两求交，生成相交后的线\r\nconst newLines = vjmap.multiLineSplit(lines);\r\nconst allLines = [...newLines];\r\n\r\n// 响应车点击事件\r\nconst symbol = carLayer.symbol;\r\nconst unClickCb = symbol.clickLayer(e => {\r\n    if (!(e.features && e.features.length > 0 )) return;\r\n    const startPoint = map.fromLngLat(e.features[0].geometry.coordinates);\r\n    const result = vjmap.findShortestPath(startPoint, exitPoint, allLines.map(e => {\r\n        return {\r\n            points: e\r\n        }\r\n    }));\r\n    let coordinates = result.route.map(pt => [pt.x, pt.y])\r\n    coordinates = [[startPoint.x, startPoint.y], ...coordinates, [exitPoint.x, exitPoint.y]]\r\n    mapApp.setSourceData(\"geojson_drawroute\", {\r\n        \"type\": \"FeatureCollection\",\r\n        \"features\": [\r\n            {\r\n                \"type\": \"Feature\",\r\n                \"id\": 1,\r\n                \"geometry\": {\r\n                    \"type\": \"LineString\",\r\n                    \"coordinates\": coordinates\r\n                }\r\n            }\r\n        ]\r\n    })\r\n});\r\n\r\n// 最后返回一个清空的函数\r\nreturn () => {\r\n    if (unClickCb) unClickCb();\r\n}"
            },
            "controls": [
                {
                    "name": "",
                    "position": "",
                    "options": ""
                }
            ],
            "mapOptions": {}
        }
        let cfg = config;
        cfg.serviceUrl = cfg.serviceUrl || env.serviceUrl;
        cfg.serviceToken = cfg.serviceToken || env.accessToken;
        await mapApp.setConfig(cfg);
        
        message.info('点击车时，请自动规划出到出口的最近路线')
        
        let map = mapApp.map;
        let svc = map.getService();
        function showUI() {
            vjgui.init();
            let element = vjgui.createElement("div", "sidebar .sidebar", "", "")
            vjgui.add(element)
            let sidebar = new vjgui.Inspector();
        
            sidebar.addButton("数据图层","数据图层切换",{callback: async function(name) {
                    let res = await showSelectLayers(false);
                    if (res) {
                        switchLayers(res, false);
                    }
                }});
        
            sidebar.addButton("CAD图层","CAD图层切换",{callback: async function(name) {
                    let res = await showSelectLayers(true);
                    if (res) {
                        switchLayers(res, true);
                    }
                }});
        
        
            sidebar.appendTo("#sidebar");
        }
        
        showUI();
        
        let cadLayers;
        async function showSelectLayers(isCadLayer) {
            return new Promise((resolve, reject) => {
                let dialog = new vjgui.Dialog( { title: (isCadLayer ? "CAD" : "数据") + "图层切换", close: true, minimize: true, width: 300, height: 400, scroll: true, resizable:true, draggable: true} );
                dialog.show();
                dialog.setPosition( 250,10 );
        
                let layers = [];
                if (isCadLayer) {
                    // 如果是cad图层
                    layers = cadLayers || svc.getMapLayers().map(m => {
                        return {
                            index: m.index,
                            color: vjmap.randomColor(),
                            name: m.name,
                            isOff: m.isOff
                        }
                    })
                } else {
                    // 如果是数据图层
                    for (let i = 0; i < mapApp.layers.length; i++) {
                        layers.push({
                            index: mapApp.layers[i].layerId,
                            color: vjmap.randomColor(),
                            name: `${mapApp.layers[i].memo || ''} ${mapApp.layers[i].layerId}`,
                            isOff: mapApp.layers[i].visibleOff
                        })
                    }
                }
                let list = new vjgui.ComplexList({height: "90%"});
                dialog.add( list );
        
                list.onItemToggled = (item, elelm, enable) => {
                    layers[item.id].isOff = !enable
                }
                list.addTitle("请选择要打开的图层");
                for(let i = 0; i < layers.length; ++i)
                    list.addItem({id: i},layers[i].name, !layers[i].isOff, false);
        
        
                // Add some buttons
                let isOk = false;
                dialog.addButton('确定', { close: true, callback: () => {
                        isOk = true;
                    }});
                dialog.addButton('取消',{ close: 'fade' });
        
                vjgui.bind(dialog, "closed", e => {
                    if (isOk) {
                        resolve(layers)
                    } else {
                        resolve();
                    }
                })
            });
        }
        
        async function  switchLayers(layers, isCadLayer) {
            if (isCadLayer) {
                await vjcommon.switchCadLayers(map, layers);
                cadLayers = layers;
            } else {
                for (let i = 0; i < layers.length; i++) {
                    let idx = mapApp.layers.findIndex(m => m.layerId == layers[i].index);
                    if (idx == -1) continue;
                    if (mapApp.layers[idx].visibleOff != layers[i].isOff) {
                        mapApp.setLayerVisible(mapApp.layers[idx].layerId, layers[i].isOff);
                    }
                }
            }
        }
        
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