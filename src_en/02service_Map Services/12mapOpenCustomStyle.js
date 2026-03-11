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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/12mapOpenCustomStyle
        // --Open map with custom style--Open map on server with custom style options
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: sys_world,
            mapopenway: vjmap.MapOpenWay.Memory ,
            style:{
                name: "style3", // Style name
                backcolor: 0, // Map background color on server
                // Clip extent
                clipbounds: [18769.82488,13214.75077,25117.81422,7942.07141],
                // Line width per zoom level
                lineweight:[0,0,1,1,0,0,1,0,1],
                // Custom expression
                expression: "gOutColor:=gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);",
                // Layer on/off per zoom: "1"="(3)" = at zoom 1 show layer index 3; "3-4"="(4,5,6,7,8,9)"; "*"="(0)" = default
                /*
                "1": "(3)" zoom 1 -> layer index 3 on
                "2": "(3,4,5)" zoom 2 -> layers 3,4,5 on
                "3-4": "(4,5,6,7,8,9)" zoom 3-4 -> layers 4-9 on
                "*": "(0)" default -> layer 0 on
                */
                layeron:`{
                    "*": "(0)",
                    "1": "(3)",
                    "2": "(3,4,5)",
                    "3-4": "(4,5,6,7,8,9)"
                }`
            }
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let style = svc.rasterStyle();
        /*style.layers.unshift({
            id: 'background',
            type: 'background',
            paint: {
                'background-color': 'darkblue'
            }
        })*/
        document.body.style.background = "#022B4F"
        let map = new vjmap.Map({   container: 'map', // container ID
            style: style,
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
            e && message.info(`type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`);
        })
        map.setZoom(0.5)
        window.map = map;
        
        let layers = svc.getMapLayers();
        function showUI() {
            vjgui.init();
            let element = vjgui.createElement("div", "sidebar .sidebar", "", "")
            vjgui.add(element)
            let sidebar = new vjgui.Inspector();
        
            sidebar.addButton("Layer switch","Select layer",{callback: async function(name) {
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
        
        async function showSelectLayers(param) {
            return new Promise((resolve, reject) => {
                let dialog = new vjgui.Dialog( { title:"Layer switch", close: true, minimize: true, width: 300, height: 400, scroll: true, resizable:true, draggable: true} );
                dialog.show();
                dialog.setPosition( 250,10 );
        
                let list = new vjgui.ComplexList({height: "90%"});
                dialog.add( list );
        
                list.onItemToggled = (item, elelm, enable) => {
                    param[item.id].isOff = !enable
                }
                list.addTitle("Please select layers to open");
                for(let i = 0; i < param.length; ++i)
                    list.addItem({id: i},param[i].name, !param[i].isOff, false);
        
        
                // Add some buttons
                let isOk = false;
                dialog.addButton('OK', { close: true, callback: () => {
                        isOk = true;
                    }});
                dialog.addButton('Cancel',{ close: 'fade' });
        
                vjgui.bind(dialog, "closed", e => {
                    if (isOk) {
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