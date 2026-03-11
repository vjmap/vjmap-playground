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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/14switchLayerVector
        // --Switch layer [Geometry vector]--Get geometry on server, render on front-end, and switch layers
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.vectorStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
        // Get layer id by layer name
        const getLayerIdByName = name => {
            return svc.getMapLayers().findIndex(layer => layer.name === name)
        }
        
        let layers = svc.getMapLayers();
        
        // Add entity layer condition (any of the layers), e.g. ['Layer1','Layer2']
        const conditionLayers = (layers, inputIsIndex) => {
            if (!Array.isArray(layers)) layers = [layers];
            if (!inputIsIndex) {
                // Convert layer names to layer indices (vector tiles use index)
                layers = layers.map(layer => getLayerIdByName(layer));
            }
            return [
                "match",
                ['get', 'layer'],
                layers,
                true,
                false
            ]
        }
        
        // Switch layers: onLayers = array of layer names to show
        const switchLayers = (onLayers) => {
            // Get default vector style and filter vector layers in current style
            let style = map.getStyle();
            let vectorStyle = svc.vectorStyle();
            let vectorLayerIds = vectorStyle.layers.map(layer => layer.id);
            let filter = conditionLayers(onLayers, false);
            for(let i = 0; i < style.layers.length; i++) {
                if (vectorLayerIds.includes(style.layers[i].id)) {
                    style.layers[i].filter = filter; // Set filter
                }
            }
            map.setStyle(style);
        }
        function showUI() {
            vjgui.init();
            let element = vjgui.createElement("div", "sidebar .sidebar", "", "")
            vjgui.add(element)
            let sidebar = new vjgui.Inspector();
        
            sidebar.addButton("Layer switch","Select layers",{callback: async function(name) {
                    let res = await showSelectLayers(layers);
                    if (res) {
                        layers = res;
                        let onLayers = res.reduce((sum, val) => {
                            if (!val.isOff) {
                                sum.push(val.name);
                            }
                            return sum;
                        }, []); // Layers to show
                        switchLayers(onLayers);
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
                list.addTitle("Select layers to show");
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