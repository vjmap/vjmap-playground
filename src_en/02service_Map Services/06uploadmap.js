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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/06uploadmap
        // --Upload new drawing--Upload local CAD drawing and open in front-end
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let map = null;
        let layers = null;
        let mapExtent = null;
        function newMap(res) {
            if (map != null) return
            mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            let prj = new vjmap.GeoProjection(mapExtent);
            map = new vjmap.Map({
                container: 'map', // container ID
                style: svc.rasterStyle(),
                center: prj.toLngLat(mapExtent.center()),
                zoom: 1,
                renderWorldCopies: false,
                ...svc.currentMapParam().view /* Initial map view params */
            });
            map.attach(svc, prj);
            //map.fitMapBounds();
        
            map.addControl(new vjmap.NavigationControl());
            map.addControl(new vjmap.MousePositionControl({showZoom: true, showBearing: true}));
        
            map.enableLayerClickHighlight(svc, e => {
                e && message.info(`type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`);
            })
            layers = svc.getMapLayers();
        }
        async function openLocalFile(file) {
            message.info("Uploading drawing, please wait", 2);
            let res = await svc.uploadMap(file);
            res = await showSettingsDialog(res)
            let data = await svc.openMap(res);
            if (data.error) {
                message.error(data.error)
                return;
            }
            if (!map) {
                newMap(data);
                if (res.isVector) {
                    await map.onLoad();
                    map.changeSourceTiles(svc.vectorTileUrl());
                }
            }
            else {
                map.changeSourceTiles(res.isVector ? svc.vectorTileUrl() : svc.rasterTileUrl());
                mapExtent = vjmap.GeoBounds.fromString(data.bounds);
                map.updateMapExtent(mapExtent);
                map.setCenter(map.toLngLat(mapExtent.center()))
                map.fitMapBounds();
            }
        }
        
        function showUI() {
            vjgui.init();
            let element = vjgui.createElement("div", "sidebar .sidebar", "", "")
            vjgui.add(element)
            let sidebar = new vjgui.Inspector();
            sidebar.addFile("DWG file", "", { read_file: "binary", accept:".dwg", callback: function(v) {
                    if (v && v.files && v.files.length > 0) {
                        let file = v.files[0]
                        openLocalFile(file)
                    }
                } });
            sidebar.addButton("Layer switch","Select layers",{callback: async function(name) {
                    let res = await showSelectLayers(layers);
                    if (res) {
                        layers = res;
                        map.switchLayers(svc, res.reduce((sum, val) => {
                            if (!val.isOff) {
                                sum.push(val.name);
                            }
                            return sum;
                        }, []))
                    }
                }});
        
            sidebar.appendTo("#sidebar");
        }
        
        showUI();
        
        async function showSettingsDialog(param) {
            return new Promise((resolve, reject) => {
                // Create a new dialog
                let dialog = new vjgui.Dialog({id: 'openSettings', title:'Settings', close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true });
        
                // Create a collection of widgets
                let widgets = new vjgui.Inspector();
                let nameWidget = widgets.addString("Map name",param.mapid);
                widgets.addTitle("Map names starting with ns_ are not shown in map management");
                let openWayType = param.geom ? "Store then render raster" : "Open drawing directly";
                let openWay = param.geom ? vjmap.MapOpenWay.GeomRender : vjmap.MapOpenWay.Memory;
                let isVector = false
                let bOk = false
                let typeWidget = widgets.addComboButtons("Open mode",openWayType,{
                    values:["Open drawing directly","Store then render raster","Store then render vector"],
                    callback: (name) => {
                        openWay = name === "Open drawing directly" ? vjmap.MapOpenWay.Memory : vjmap.MapOpenWay.GeomRender;
                        isVector = name === "Store then render vector";
                    }
                });
                let password = widgets.addString("Password protection", "", {password: true});
                widgets.addTitle("If you choose store then render raster or vector, the first open may take a while to save geometry; subsequent opens are fast.")
                let renderAccuracyWidget = widgets.addNumber("Render accuracy", 1, {precision: 0,step: 1, min: 1, max: 20});
                widgets.addTitle("Default render accuracy is fine. Increase if circles or arcs are not smooth enough.")
                dialog.add(widgets);
        
                // Add some buttons
                dialog.addButton('OK', { close: true, callback: () => {
                        bOk = true;
                    }});
                dialog.addButton('Cancel',{ close: 'fade' });
                dialog.show();
                vjgui.bind(dialog, "closed", e => {
                    if (bOk) {
                        param.mapopenway = openWay;
                        param.mapid = nameWidget.getValue();
                        param.isVector = isVector;
                        param.style = vjmap.openMapDarkStyle();
                        param.renderAccuracy = renderAccuracyWidget.getValue();
                        if (password.getValue() != "") {
                            // If password is set
                            param.secretKey = svc.pwdToSecretKey(password.getValue()) ;// convert password to secret key
                        }
                        resolve(param)
                    } else {
                        reject("cancel");
                    }
                })
            });
        }
        
        
        
        async function showSelectLayers(param) {
            return new Promise((resolve, reject) => {
                let dialog = new vjgui.Dialog( { title:"Layer switch", close: true, minimize: true, width: 300, height: 400, scroll: true, resizable:true, draggable: true} );
                dialog.show();
                dialog.setPosition( 250,10 );
        
                const list = new vjgui.ComplexList({height: "90%"});
                dialog.add( list );
        
                list.onItemToggled = (item, elelm, enable) => {
                    param[item.id].isOff = !enable
                }
                list.addTitle("Please select layers to open");
                for(let i = 0; i < param.length; ++i)
                    list.addItem({id: i},param[i].name, !param[i].isOff, false);
        
                let bOk = false
                // Add some buttons
                dialog.addButton('OK', { close: true, callback: () => {
                        bOk = true;
                    }});
                dialog.addButton('Cancel',{ close: 'fade' });
        
                vjgui.bind(dialog, "closed", e => {
                    if (bOk) {
                        resolve(param)
                    } else {
                        resolve();
                    }
                })
            });
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