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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/13switchLayerMemory
        // --切换图层[内存方式]--直接在后台以内存方式打开已上传的CAD的DWG格式的图，并切换图层
        // js代码
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.Memory, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
            e && message.info(`type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`);
        })
        
        window.map = map;
        
        let layers = svc.getMapLayers();
        function showUI() {
            vjgui.init();
            let element = vjgui.createElement("div", "sidebar .sidebar", "", "")
            vjgui.add(element)
            let sidebar = new vjgui.Inspector();
        
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
        
        async function showSelectLayers(param) {
            return new Promise((resolve, reject) => {
                let dialog = new vjgui.Dialog( { title:"图层切换", close: true, minimize: true, width: 300, height: 400, scroll: true, resizable:true, draggable: true} );
                dialog.show();
                dialog.setPosition( 250,10 );
        
                let list = new vjgui.ComplexList({height: "90%"});
                dialog.add( list );
        
                list.onItemToggled = (item, elelm, enable) => {
                    param[item.id].isOff = !enable
                }
                list.addTitle("请选择要打开的图层");
                for(let i = 0; i < param.length; ++i)
                    list.addItem({id: i},param[i].name, !param[i].isOff, false);
        
        
                // Add some buttons
                let isOk = false;
                dialog.addButton('确定', { close: true, callback: () => {
                        isOk = true;
                    }});
                dialog.addButton('取消',{ close: 'fade' });
        
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