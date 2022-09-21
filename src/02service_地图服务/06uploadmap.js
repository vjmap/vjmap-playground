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
        // --上传新图形--上传本地的CAD图形，然后在前端打开
        // js代码
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
                ...svc.currentMapParam().view /* 地图初始视图参数 */
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
            message.info("正在上传图形，请稍候", 2);
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
            sidebar.addFile("dwg文件", "", { read_file: "binary", accept:".dwg", callback: function(v) {
                    if (v && v.files && v.files.length > 0) {
                        let file = v.files[0]
                        openLocalFile(file)
                    }
                } });
            sidebar.addButton("图层切换","选择图层",{callback: async function(name) {
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
                let dialog = new vjgui.Dialog({id: 'openSettings', title:'设置', close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true });
        
                // Create a collection of widgets
                let widgets = new vjgui.Inspector();
                let nameWidget = widgets.addString("图名称",param.mapid);
                widgets.addTitle("以ns_开头的图名称在图形管理中不会显示");
                let openWayType = param.geom ? "存储后渲染栅格" : "直接打开图形";
                let openWay = param.geom ? vjmap.MapOpenWay.GeomRender : vjmap.MapOpenWay.Memory;
                let isVector = false
                let bOk = false
                let typeWidget = widgets.addComboButtons("打开方式",openWayType,{
                    values:["直接打开图形","存储后渲染栅格","存储后渲染矢量"],
                    callback: (name) => {
                        openWay = name === "直接打开图形" ? vjmap.MapOpenWay.Memory : vjmap.MapOpenWay.GeomRender;
                        isVector = name === "存储后渲染矢量";
                    }
                });
                let password = widgets.addString("密码保护", "", {password: true});
                widgets.addTitle("如果选择存储后渲染栅格或矢量，第一次打开时由于需要保存几何数据，需耐心等待一段时间。下次打开时会很快打开图形。")
                let renderAccuracyWidget = widgets.addNumber("渲染精度", 1, {precision: 0,step: 1, min: 1, max: 20});
                widgets.addTitle("渲染精度默认就行。极少数情况圆或圆弧不够光滑时，可提高精度")
                dialog.add(widgets);
        
                // Add some buttons
                dialog.addButton('确定', { close: true, callback: () => {
                        bOk = true;
                    }});
                dialog.addButton('取消',{ close: 'fade' });
                dialog.show();
                vjgui.bind(dialog, "closed", e => {
                    if (bOk) {
                        param.mapopenway = openWay;
                        param.mapid = nameWidget.getValue();
                        param.isVector = isVector;
                        param.style = vjmap.openMapDarkStyle();
                        param.renderAccuracy = renderAccuracyWidget.getValue();
                        if (password.getValue() != "") {
                            // 如果有密码
                            param.secretKey = svc.pwdToSecretKey(password.getValue()) ;// 把密码明码转成秘钥
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
                let dialog = new vjgui.Dialog( { title:"图层切换", close: true, minimize: true, width: 300, height: 400, scroll: true, resizable:true, draggable: true} );
                dialog.show();
                dialog.setPosition( 250,10 );
        
                const list = new vjgui.ComplexList({height: "90%"});
                dialog.add( list );
        
                list.onItemToggled = (item, elelm, enable) => {
                    param[item.id].isOff = !enable
                }
                list.addTitle("请选择要打开的图层");
                for(let i = 0; i < param.length; ++i)
                    list.addItem({id: i},param[i].name, !param[i].isOff, false);
        
                let bOk = false
                // Add some buttons
                dialog.addButton('确定', { close: true, callback: () => {
                        bOk = true;
                    }});
                dialog.addButton('取消',{ close: 'fade' });
        
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