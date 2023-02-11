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
        // --切换图层[几何矢量渲染]--在后台获取几何数据并进行渲染至前端，并切换图层
        // js代码
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
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
        
        
        // 通过图层名称来查找图层id
        const getLayerIdByName = name => {
            return svc.getMapLayers().findIndex(layer => layer.name === name)
        }
        
        let layers = svc.getMapLayers();
        
        // 增加实体图层判断条件,只要满足任何一种类型即可,如 ['图层一','图层二']
        const conditionLayers = (layers, inputIsIndex) => {
            if (!Array.isArray(layers)) layers = [layers];// 先转成数组，再统一用数组去算吧
            if (!inputIsIndex) {
                // 如果输入的不是图层索引，是图层名称，则需要转成图层索引
                layers = layers.map(layer => getLayerIdByName(layer)); // 把图层名称转为图层索引，在矢量瓦片中图层是用索引来表示的
            }
            return [
                "match",
                ['get', 'layer'],
                layers,
                true,
                false
            ]
        }
        
        // 切换图层 onLayers 要显示的图层名称数组
        const switchLayers = (onLayers) => {
            // 获取之前的默认的矢量图层样式，然后在当前样式中，对矢量图层的数据进行图层进行过滤
            let style = map.getStyle();
            let vectorStyle = svc.vectorStyle();
            let vectorLayerIds = vectorStyle.layers.map(layer => layer.id);
            let filter = conditionLayers(onLayers, false);
            for(let i = 0; i < style.layers.length; i++) {
                if (vectorLayerIds.includes(style.layers[i].id)) {
                    style.layers[i].filter = filter; // 设置过滤条件
                }
            }
            map.setStyle(style);
        }
        function showUI() {
            vjgui.init();
            let element = vjgui.createElement("div", "sidebar .sidebar", "", "")
            vjgui.add(element)
            let sidebar = new vjgui.Inspector();
        
            sidebar.addButton("图层切换","选择图层",{callback: async function(name) {
                    let res = await showSelectLayers(layers);
                    if (res) {
                        layers = res;
                        let onLayers = res.reduce((sum, val) => {
                            if (!val.isOff) {
                                sum.push(val.name);
                            }
                            return sum;
                        }, []); // 要开的图层
                        switchLayers(onLayers);
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