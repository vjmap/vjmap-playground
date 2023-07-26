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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/04imagecadmap
        // --影像与CAD图叠加校准--以影像以背景，根据选定的对应点自动校准CAD地图并修改地图坐标导出为DWG图
        // 注: 此示例中引用了vjcommon库。此库是对唯杰地图常用的功能做了一定程度的封装，方便其他工程共用
        // vjcommon库可在 html 中引入`vjcommon.min.js`即可,或npm install vjcommon`通过`import vjcommon from 'vjcommon'`引入
        // vjcommon库是开源的。开源地址 https://github.com/vjmap/vjmap-common
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        message.info("请调节上面两幅图的公共点对CAD地图进行校准")
        const imageMapId = "sys_image"; // 影像地图ID
        const correctMapId1 = "correctdwg"; // 需要校正的地图id
        const correctMapId2 = "sys_zp"; // 需要校正的地图id2
        let mapImage, mapCad1, mapCad2, mapMerge;
        let imagePublicPoint1 = [
            vjmap.geoPoint([451692.9279773526, 3357915.51451705]),
            vjmap.geoPoint([452034.66574774124, 3357558.314824416]),
        ];
        // 增加cad图上面的两个公共点坐标
        let cadPublicPoint1 = [
            vjmap.geoPoint([459487.0296464551, 3356400.9115997166]),
            vjmap.geoPoint([459822.0279662793, 3356037.595313958]),
        ];
        let imagePublicPoint2 = [
            vjmap.geoPoint([452069.8565132098, 3357841.1168254404]),
            vjmap.geoPoint([452198.40164099116, 3357725.426210437]),
        ];
        // 增加cad图上面的两个公共点坐标
        let cadPublicPoint2 = [
            vjmap.geoPoint([587476741.006472, 3103999303.192057]),
            vjmap.geoPoint([587756241.006472, 3103799303.192057]),
        ];
        // 在id为"map”的div下面创建一个一样大的不同的div，用于新的对图对象的容器id
        const createNewMapDivIds = () => {
            // 先清空之前的
            let parentDiv = document.getElementById("map");
            parentDiv.style.display = "flex";
            parentDiv.style.flexDirection = "column";
        
            let newMapDiv1 = document.createElement("div");
            newMapDiv1.id = vjmap.RandomID(6);
            newMapDiv1.style.flex = "1";
            parentDiv.appendChild(newMapDiv1);
        
            let newMapDiv2 = document.createElement("div");
            newMapDiv2.id = vjmap.RandomID(6);
            newMapDiv2.style.flex = "1";
            newMapDiv2.style.backgroundColor = "#022B4F";
            parentDiv.appendChild(newMapDiv2);
        
            parentDiv = document.getElementById(newMapDiv1.id);
            parentDiv.style.display = "flex";
            parentDiv.style.justifyContent = "space-between";
            let newMapDiv3 = document.createElement("div");
            newMapDiv3.id = vjmap.RandomID(6);
            newMapDiv3.style.flex = "1";
            newMapDiv3.style.backgroundColor = "#125558";
            parentDiv.appendChild(newMapDiv3);
        
            let newMapDiv4 = document.createElement("div");
            newMapDiv4.id = vjmap.RandomID(6);
            newMapDiv4.style.flex = "1";
            newMapDiv4.style.backgroundColor = "#271258";
            parentDiv.appendChild(newMapDiv4);
        
            let newMapDiv5 = document.createElement("div");
            newMapDiv5.id = vjmap.RandomID(6);
            newMapDiv5.style.flex = "1";
            newMapDiv5.style.backgroundColor = "#4f3c3c";
            parentDiv.appendChild(newMapDiv5);
            return [newMapDiv3.id, newMapDiv4.id, newMapDiv5.id, newMapDiv2.id];
        };
        
        const createMap = async (mapContainerId, mapId, style, isVector) => {
            let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
            // 打开地图
            let res = await svc.openMap({
                mapid: mapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
                mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
                style: style || vjmap.openMapDarkStyle(), // div为深色背景颜色时，这里也传深色背景样式
            });
            if (res.error) {
                message.error(res.error);
            }
            // 获取地图的范围
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // 建立坐标系
            let prj = new vjmap.GeoProjection(mapExtent);
        
            // 新建地图对象
            let map = new vjmap.Map({
                container: mapContainerId, // container ID
                style: isVector ? svc.vectorStyle() : svc.rasterStyle(), // 瓦片样式
                center: prj.toLngLat(mapExtent.center()), // 中心点
                zoom: 2,
                renderWorldCopies: false,
            });
            // 地图关联服务对象和坐标系
            map.attach(svc, prj);
            // 使地图全部可见
            map.fitMapBounds();
            await map.onLoad();
            let mousePositionControl = new vjmap.MousePositionControl();
            map.addControl(mousePositionControl, "bottom-left");
            return map;
        };
        
        const addEditButtons = (isCorrectMode) => {
            mapMerge.addControl(
                new vjmap.ButtonGroupControl(
                    {
                        buttons: [
                            {
                                id: isCorrectMode ? "edit" : "correct",
                                title: isCorrectMode
                                    ? "请把所有的图确认叠加完后,再点击编辑,编辑将修改叠加的cad图并可将编辑好的cad图导出"
                                    : "返回校正模式进行对地图进行校准",
                                text: isCorrectMode ? "编辑" : "校正",
                                onActivate: async (ctx, e) => {
                                    isCorrectMode ? setMapEditorMode() : setMapCorrectMode();
                                },
                            },
                        ],
                    },
                    isCorrectMode ? "top-right" : "bottom-right"
                )
            );
        };
        
        const removeMap = (map) => {
            if (!map) return;
            map.removeMarkers();
            map.remove();
            map = null;
        };
        // 设置地图为校正模式
        const setMapCorrectMode = async () => {
            let mapContainerDiv = document.getElementById("map");
            mapContainerDiv.innerHTML = "";
            removeMap(mapMerge);
            const divIds = createNewMapDivIds();
            mapImage = await createMap(divIds[0], imageMapId);
            mapCad1 = await createMap(divIds[1], correctMapId1);
            mapCad2 = await createMap(divIds[2], correctMapId2);
            mapMerge = await createMap(divIds[3], imageMapId);
        
            const addCadLayer = (cadMap, imagePublicPoint, cadPublicPoint, colors) => {
                // 增加图像上面的两个公共点坐标
                let addMarkers = [];
                for (let k = 0; k < imagePublicPoint.length; k++) {
                    let marker = new vjmap.Marker({
                        color: colors[k % colors.length],
                        draggable: true,
                    });
                    marker.setLngLat(mapImage.toLngLat(imagePublicPoint[k]));
                    marker.addTo(mapImage);
                    marker.on("drag", (e) => {
                        // 拖动时，修改坐标
                        imagePublicPoint[k] = mapImage.fromLngLat(marker.getLngLat());
                        updateMergeMapDebounce();
                    });
                }
                for (let k = 0; k < cadPublicPoint.length; k++) {
                    let marker = new vjmap.Marker({
                        color: colors[k % colors.length],
                        draggable: true,
                    });
                    marker.setLngLat(cadMap.toLngLat(cadPublicPoint[k]));
                    marker.addTo(cadMap);
                    marker.on("drag", (e) => {
                        // 拖动时，修改坐标
                        cadPublicPoint[k] = cadMap.fromLngLat(marker.getLngLat());
                        updateMergeMapDebounce();
                    });
                }
                // 根据公共点合成图
                const updateMergeMap = () => {
                    // 通过四参数计算然后通过wms图层来叠加cad图
                    console.log(imagePublicPoint, cadPublicPoint);
                    let fourparam = vjmap.coordTransfromGetFourParamter(
                        imagePublicPoint,
                        cadPublicPoint,
                        true,
                        true
                    );
                    let mapParam = cadMap.getService().currentMapParam();
                    addWmsLayer(
                        mapMerge,
                        mapParam.mapid,
                        mapParam.layer,
                        fourparam,
                        mapMerge.getGeoBounds(1.0)
                    );
                };
        
                const addWmsLayer = async (
                    map,
                    mapid,
                    layer,
                    fourparam,
                    mapFullbounds
                ) => {
                    let fourParameter = [
                        fourparam.dx,
                        fourparam.dy,
                        fourparam.scale,
                        fourparam.rotate,
                    ];
                    map.removeSourceEx("wms-maps-source" + mapid);
                    let wmsurl = cadMap.getService().wmsTileUrl({
                        mapid: mapid,
                        layers: layer,
                        fourParameter: fourParameter,
                        mapbounds: mapFullbounds, // 全图的范围
                    });
        
                    map.addSource("wms-maps-source" + mapid, {
                        type: "raster",
                        tiles: [wmsurl],
                        tileSize: 256,
                    });
                    map.addLayer({
                        id: "wms-maps-layer" + mapid,
                        type: "raster",
                        source: "wms-maps-source" + mapid,
                        paint: { "raster-opacity": 1 },
                    });
        
                    for (let m of addMarkers) {
                        m.remove();
                    }
                    addMarkers = [];
        
                    // 增加公共对应点进行显示
                    for (let k = 0; k < imagePublicPoint.length; k++) {
                        // 图像上的点
                        let markerImage = new vjmap.Marker({
                            color: colors[k % colors.length],
                        });
                        markerImage.setLngLat(map.toLngLat(imagePublicPoint[k]));
                        markerImage.addTo(map);
                        addMarkers.push(markerImage);
                    }
        
                    // CAD图上的点  需要通过四参数反算叠加到上面
                    for (let k = 0; k < cadPublicPoint.length; k++) {
                        let newPoint = vjmap.coordTransfromByInvFourParamter(
                            cadPublicPoint[k],
                            fourparam
                        );
                        // 图像上的点
                        let markerCad = new vjmap.Marker({
                            color: colors[k % colors.length],
                        });
                        markerCad.setLngLat(map.toLngLat(newPoint));
                        markerCad.addTo(map);
                        markerCad.getElement().style.opacity = "0.7";
                        addMarkers.push(markerCad);
                    }
                };
                let tmId;
                const updateMergeMapDebounce = (value) => {
                    if (tmId) clearTimeout(tmId);
                    tmId = setTimeout(() => {
                        // 提高性能
                        updateMergeMap();
                    }, 1000);
                };
        
                updateMergeMapDebounce();
        
                return {
                    updateMergeMapDebounce,
                    imagePublicPoint,
                    cadPublicPoint,
                };
            };
        
            const colors1 = ["#FF0000", "#00FF00"];
            const map1 = addCadLayer(
                mapCad1,
                imagePublicPoint1,
                cadPublicPoint1,
                colors1
            );
        
            const colors2 = ["#0000FF", "#FFFF00"];
            const map2 = addCadLayer(
                mapCad2,
                imagePublicPoint2,
                cadPublicPoint2,
                colors2
            );
        
            addEditButtons(true);
        };
        // 设置地图为编辑模式
        const setMapEditorMode = async () => {
            message.info("正在生成对应好的图形并切换至编辑模式，请稍候...")
            let initBounds = mapMerge.getGeoBounds(1.0); // 先获取地图的全部范围
            // 先改变UI界面，把之前的地图全删除，重新生成新的编辑状态的界面
            let mapContainerDiv = document.getElementById("map");
            mapContainerDiv.innerHTML = "";
            removeMap(mapImage);
            removeMap(mapCad1);
            removeMap(mapCad2);
            removeMap(mapMerge);
            // 创建新的
            mapMerge = await createEditMap(initBounds);
            addEditButtons(false);
        };
        
        // 创建编辑模式下的地图地图对象
        const createEditMap = async (initBounds) => {
            let fourparam1 = vjmap.coordTransfromGetFourParamter(imagePublicPoint1, cadPublicPoint1,  true,   true);
            let fourparam2 = vjmap.coordTransfromGetFourParamter(imagePublicPoint2, cadPublicPoint2,  true,   true);
            let rsp = await svc.composeNewMap([
                {
                    mapid: correctMapId1, // 地图id1
                    fourParameter: [fourparam1.dx, fourparam1.dy,fourparam1.scale, fourparam1.rotate], // 对地图进行四参数转换计算
                    isInverseFourParamter: true // 用上面的四参数反算
                },
                {
                    mapid: correctMapId2, // 地图id2
                    fourParameter: [fourparam2.dx, fourparam2.dy,fourparam2.scale, fourparam2.rotate], // 对地图进行四参数转换计算
                    isInverseFourParamter: true // 用上面的四参数反算
                }
            ])
            let style =  {
                backcolor: 0,
                clipbounds: initBounds.toArray()
            };
            let res = await svc.updateMap({
                // 获取一个临时的图id(临时图形只会用临时查看，过期会自动删除)
                mapid: vjmap.getTempMapId(600), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
                fileid: rsp.fileid,
                mapopenway: vjmap.MapOpenWay.GeomRender,
                style: style
            })
            let map = await createMap("map", res.mapid, style, true); // 以矢量方式打开
            // 打开栅格图片
            res = await svc.openMap({
                mapid: imageMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
                mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
                style: vjmap.openMapDarkStyle(), // div为深色背景颜色时，这里也传深色背景样式
            });
            if (res.error) {
                message.error(res.error);
                return
            }
            // 把影像做为图层进加去,因为影像和当前地图是一样的，所以直接叠加就可以了
            let tiles = svc.rasterTileUrl(res);
            map.addRasterSource("imageSource", {
                type: "raster",
                tiles: [tiles],
                tileSize: 256
            });
            map.addRasterLayer("imageLayer", "imageSource");
            vjcommon.setLayerToLowest(map, "imageLayer"); // 把影像图层置为最下面
        
            // 增加绘图按钮
            addDrawButtons(map, style);
            return map;
        }
        
        // 刚开始进入时设置地图为校正模式
        setMapCorrectMode();
        
        const addDrawButtons = (map, style) => {
            const draw = map.getDrawLayer(); // 下面绘制的内容都要基于同一个draw对象
            const getDrawOptions = () => {
                return {
                    snap: true, // 是否启用捕捉节点
                    guides: true, // 是否启用捕捉网格
                };
            };
            const updateMapStyleObj = vjcommon.createUpdateMapStyleObj(map, {
                style: style
            });
        
            let options = {};
            options.buttons = [
                {
                    id: "modify",
                    title: "修改CAD实体",
                    text: "修改",
                    onActivate: async (ctx, e) => {
                        await vjcommon.modifyCadEntity(
                            map,
                            draw,
                            updateMapStyleObj,
                            null,
                            (tip) => {
                                return confirm(tip);
                            }
                        );
                    },
                },
                {
                    id: "delete",
                    title: "删除CAD实体",
                    text: "删除",
                    onActivate: async (ctx, e) => {
                        await vjcommon.deleteCadEntity(
                            map,
                            draw,
                            updateMapStyleObj,
                            null,
                            (tip) => {
                                return confirm(tip);
                            }
                        );
                    },
                },
                {
                    id: "pos",
                    title: "按校正后的坐标导出DWG",
                    text: "导出",
                    onActivate: async (ctx, e) => {
                        const draw = mapMerge.getDrawLayer();  // 如果不是基于这个draw对象绘制的图，如通过绘图控件绘制的，可以通过getAll()获取所有绘制的，再加去此draw对象中来进行导出
                        const res = await vjcommon.exportDwg(mapMerge, draw);
                        if (res.error) {
                            window.$message.error(res.error);
                            return;
                        }
                        let url = `https://vjmap.com/app/cloud/#/map/${res.mapid}?mapopenway=Memory&version=${res.version}`;
                        window.open(url);
                    },
                },
            ];
            let btnGroupCtrl = new vjmap.ButtonGroupControl(options);
            map.addControl(btnGroupCtrl, "top-left");
        
            let drawOptions = {};
            drawOptions.buttons = [
                {
                    id: "line",
                    title: "绘制线",
                    text: "线",
                    onActivate: async (ctx, e) => {
                        vjcommon.drawLineSting(map, draw, getDrawOptions, {
                            color: "#ff0000", // 颜色
                            line_width: 1, // 线宽
                        });
                    },
                },
                {
                    id: "polygon",
                    title: "绘制多边形",
                    text: "面",
                    onActivate: async (ctx, e) => {
                        vjcommon.drawPolygon(map, draw, getDrawOptions(), {
                            color: "#ffff00", // 颜色
                            opacity: 1.0, // 透明度
                            outlineColor: "#ffff00", // 颜色
                            line_width: 1, // 线宽
                            line_opacity: 1.0, // 透明度
                        });
                    },
                },
                {
                    id: "rectangle",
                    title: "绘制矩形",
                    text: "矩形",
                    onActivate: async (ctx, e) => {
                        vjcommon.drawRectangle(
                            map,
                            draw,
                            getDrawOptions(),
                            {
                                color: "#ff0000", // 颜色
                                opacity: 1.0, // 透明度
                                outlineColor: "#ff0000", // 颜色
                                line_width: 1, // 线宽
                                line_opacity: 1.0, // 透明度
                            },
                            false
                        );
                    },
                },
                {
                    id: "text",
                    title: "绘制文字",
                    text: "文字",
                    onActivate: async (ctx, e) => {
                        let content = prompt("请输入文字内容");
                        if (!content) return;
                        vjcommon.drawText(map, draw, getDrawOptions, {
                            color: "#0000ff", // 颜色
                            text: content,
                        });
                    },
                },
            ];
            let drawCtrl = new vjmap.ButtonGroupControl(drawOptions);
            map.addControl(drawCtrl, "top-right");
        };
        
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