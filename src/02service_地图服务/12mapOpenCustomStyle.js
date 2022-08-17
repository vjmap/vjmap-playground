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
        // --自定义样式打开地图--通过指定不同的样式内容在后台打开地图
        // js代码
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: sys_world,
            mapopenway: vjmap.MapOpenWay.Memory ,
            style:{
                name: "style3", // 样式名
                backcolor: 0, // 后台打开地图的背景色
                // 裁剪范围
                clipbounds: [18769.82488,13214.75077,25117.81422,7942.07141],
                // 不同缩放级别下的线宽
                lineweight:[0,0,1,1,0,0,1,0,1],
                // 自定义表达式
                expression: "gOutColor:=gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);",
                // 不同级别下图层的开关设置
                /*
                "1": "(3)" 表示级别为1的情况下，把index为3的图层打开。
                "2": "(3，4，5)" 表示级别为2的情况下，把index为3，4，5的图层打开。
                "3-4": "(4，5，6，7，8，9)" 表示级别为3到4级的情况下，把index为4，5，6，7，8，9的图层打开。
                "*: "(0)" 其余没设置图层级别的，把index为0的图层打开。
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
        // 关联服务对象和投影对象
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