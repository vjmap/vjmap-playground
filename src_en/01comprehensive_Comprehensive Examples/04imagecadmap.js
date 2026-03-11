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
        // --Image and CAD overlay calibration-- Use image as background, auto-calibrate CAD from control points and export DWG
        // Note: This example uses vjcommon. Include `vjcommon.min.js` or npm install vjcommon and import.
        // vjcommon is open source: https://github.com/vjmap/vjmap-common
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        message.info("Adjust control points on the two maps above to calibrate the CAD map")
        const imageMapId = "sys_image"; // Image map ID
        const correctMapId1 = "correctdwg"; // Map to calibrate id
        const correctMapId2 = "sys_zp"; // Map to calibrate id2
        let mapImage, mapCad1, mapCad2, mapMerge;
        let imagePublicPoint1 = [
            vjmap.geoPoint([451692.9279773526, 3357915.51451705]),
            vjmap.geoPoint([452034.66574774124, 3357558.314824416]),
        ];
        // Two control points on CAD map
        let cadPublicPoint1 = [
            vjmap.geoPoint([459487.0296464551, 3356400.9115997166]),
            vjmap.geoPoint([459822.0279662793, 3356037.595313958]),
        ];
        let imagePublicPoint2 = [
            vjmap.geoPoint([452069.8565132098, 3357841.1168254404]),
            vjmap.geoPoint([452198.40164099116, 3357725.426210437]),
        ];
        // Two control points on CAD map
        let cadPublicPoint2 = [
            vjmap.geoPoint([587476741.006472, 3103999303.192057]),
            vjmap.geoPoint([587756241.006472, 3103799303.192057]),
        ];
        // Under #"map” map div create same-size div as container for image map
        const createNewMapDivIds = () => {
            // Clear previous first
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
            // Open map
            let res = await svc.openMap({
                mapid: mapId, // map ID (ensure it exists)
                mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
                style: style || vjmap.openMapDarkStyle(), // use dark style when div is dark
            });
            if (res.error) {
                message.error(res.error);
            }
            // Get map bounds
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // Create coordinate system
            let prj = new vjmap.GeoProjection(mapExtent);
        
            // New map object
            let map = new vjmap.Map({
                container: mapContainerId, // container ID
                style: isVector ? svc.vectorStyle() : svc.rasterStyle(), // tile style
                center: prj.toLngLat(mapExtent.center()), // center
                zoom: 2,
                renderWorldCopies: false,
            });
            // Attach service and projection
            map.attach(svc, prj);
            // Fit map to bounds
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
                                    ? "After confirming overlay, click Edit to modify CAD and export"
                                    : "Return to calibration mode to align maps",
                                text: isCorrectMode ? "Edit" : "Calibrate",
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
        // Set map to calibration mode
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
                // Add two control points on image
                let addMarkers = [];
                for (let k = 0; k < imagePublicPoint.length; k++) {
                    let marker = new vjmap.Marker({
                        color: colors[k % colors.length],
                        draggable: true,
                    });
                    marker.setLngLat(mapImage.toLngLat(imagePublicPoint[k]));
                    marker.addTo(mapImage);
                    marker.on("drag", (e) => {
                        // Update coordinate on drag
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
                        // Update coordinate on drag
                        cadPublicPoint[k] = cadMap.fromLngLat(marker.getLngLat());
                        updateMergeMapDebounce();
                    });
                }
                // Compose map from control points
                const updateMergeMap = () => {
                    // Four-parameter transform then overlay CAD via WMS layer
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
                        mapbounds: mapFullbounds, // full map bounds
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
        
                    // Show control points
                    for (let k = 0; k < imagePublicPoint.length; k++) {
                        // Point on image
                        let markerImage = new vjmap.Marker({
                            color: colors[k % colors.length],
                        });
                        markerImage.setLngLat(map.toLngLat(imagePublicPoint[k]));
                        markerImage.addTo(map);
                        addMarkers.push(markerImage);
                    }
        
                    // CAD points: inverse four-parameter to overlay
                    for (let k = 0; k < cadPublicPoint.length; k++) {
                        let newPoint = vjmap.coordTransfromByInvFourParamter(
                            cadPublicPoint[k],
                            fourparam
                        );
                        // Point on image
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
                        // Debounce for performance
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
        // Set map to edit mode
        const setMapEditorMode = async () => {
            message.info("Generating aligned map and switching to edit mode, please wait...")
            let initBounds = mapMerge.getGeoBounds(1.0); // Get full map bounds first
            // Update UI: remove previous maps, create new edit UI
            let mapContainerDiv = document.getElementById("map");
            mapContainerDiv.innerHTML = "";
            removeMap(mapImage);
            removeMap(mapCad1);
            removeMap(mapCad2);
            removeMap(mapMerge);
            // Create new
            mapMerge = await createEditMap(initBounds);
            addEditButtons(false);
        };
        
        // Create map object in edit mode
        const createEditMap = async (initBounds) => {
            let fourparam1 = vjmap.coordTransfromGetFourParamter(imagePublicPoint1, cadPublicPoint1,  true,   true);
            let fourparam2 = vjmap.coordTransfromGetFourParamter(imagePublicPoint2, cadPublicPoint2,  true,   true);
            let rsp = await svc.composeNewMap([
                {
                    mapid: correctMapId1, // map id1
                    fourParameter: [fourparam1.dx, fourparam1.dy,fourparam1.scale, fourparam1.rotate], // four-parameter transform
                    isInverseFourParamter: true // inverse with above params
                },
                {
                    mapid: correctMapId2, // map id2
                    fourParameter: [fourparam2.dx, fourparam2.dy,fourparam2.scale, fourparam2.rotate], // four-parameter transform
                    isInverseFourParamter: true // inverse with above params
                }
            ])
            let style =  {
                backcolor: 0,
                clipbounds: initBounds.toArray()
            };
            let res = await svc.updateMap({
                // Temp map id (auto-delete when expired)
                mapid: vjmap.getTempMapId(600), // Expiry in minutes. Default 30.
                fileid: rsp.fileid,
                mapopenway: vjmap.MapOpenWay.GeomRender,
                style: style
            })
            let map = await createMap("map", res.mapid, style, true); // Open as vector
            // Open raster image
            res = await svc.openMap({
                mapid: imageMapId, // map ID
                mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
                style: vjmap.openMapDarkStyle(), // dark style when div is dark
            });
            if (res.error) {
                message.error(res.error);
                return
            }
            // Add image as layer (same coords as current map, overlay directly)
            let tiles = svc.rasterTileUrl(res);
            map.addRasterSource("imageSource", {
                type: "raster",
                tiles: [tiles],
                tileSize: 256
            });
            map.addRasterLayer("imageLayer", "imageSource");
            vjcommon.setLayerToLowest(map, "imageLayer"); // Put image layer at bottom
        
            // Add draw buttons
            addDrawButtons(map, style);
            return map;
        }
        
        // Start in calibration mode
        setMapCorrectMode();
        
        const addDrawButtons = (map, style) => {
            const draw = map.getDrawLayer(); // All drawing uses same draw object
            const getDrawOptions = () => {
                return {
                    snap: true, // snap to vertices
                    guides: true, // snap to grid
                };
            };
            const updateMapStyleObj = vjcommon.createUpdateMapStyleObj(map, {
                style: style
            });
        
            let options = {};
            options.buttons = [
                {
                    id: "modify",
                    title: "Modify CAD entity",
                    text: "Modify",
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
                    title: "Delete CAD entity",
                    text: "Delete",
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
                    title: "Export DWG by calibrated coordinates",
                    text: "Export",
                    onActivate: async (ctx, e) => {
                        const draw = mapMerge.getDrawLayer();  // If drawing was not from this draw (e.g. from draw control), use getAll() and add to this draw for export
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
                    title: "Draw line",
                    text: "Line",
                    onActivate: async (ctx, e) => {
                        vjcommon.drawLineSting(map, draw, getDrawOptions, {
                            color: "#ff0000",
                            line_width: 1,
                        });
                    },
                },
                {
                    id: "polygon",
                    title: "Draw polygon",
                    text: "Polygon",
                    onActivate: async (ctx, e) => {
                        vjcommon.drawPolygon(map, draw, getDrawOptions(), {
                            color: "#ffff00",
                            opacity: 1.0,
                            outlineColor: "#ffff00",
                            line_width: 1,
                            line_opacity: 1.0,
                        });
                    },
                },
                {
                    id: "rectangle",
                    title: "Draw rectangle",
                    text: "Rectangle",
                    onActivate: async (ctx, e) => {
                        vjcommon.drawRectangle(
                            map,
                            draw,
                            getDrawOptions(),
                            {
                                color: "#ff0000",
                                opacity: 1.0,
                                outlineColor: "#ff0000",
                                line_width: 1,
                                line_opacity: 1.0,
                            },
                            false
                        );
                    },
                },
                {
                    id: "text",
                    title: "Draw text",
                    text: "Text",
                    onActivate: async (ctx, e) => {
                        let content = prompt("Enter text content");
                        if (!content) return;
                        vjcommon.drawText(map, draw, getDrawOptions, {
                            color: "#0000ff",
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