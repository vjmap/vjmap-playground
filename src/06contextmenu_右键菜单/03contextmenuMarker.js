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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/contextmenu/03contextmenuMarker
        // --标记Marker右键菜单--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        await map.onLoad();
        
        
        map.setMenu(event => {
            return new vjmap.ContextMenu({
                event: event.originalEvent,
                theme: "dark", //light
                width: "250px",
                items: [
                    {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">我是地图的右键菜单</span>`},
                    {
                        label: '全图范围显示',
                        onClick: () => {
                            map.setBearing(0);
                            map.setPitch(0);
                            map.fitMapBounds();
                        }
                    },
                    {
                        label: '获取此位置的坐标',
                        onClick: () => {
                            let point = map.fromLngLat(event.lngLat);
                            message.info({content: `当前坐标为 x: ${point.x}, y: ${point.y}`, key: "info", duration: 3});
                        }
                    }
                ]
            });
        })
        
        let mapBounds = map.getGeoBounds(); // 得到地图地理范围
        for(let i = 0; i < 50; i++) {
            let point = mapBounds.randomPoint(); // 在地理范围里随机生成一个点
            // marker
            let marker = new vjmap.Marker({
                color: vjmap.randomColor()
            });
            marker.setLngLat(map.toLngLat(point))
            marker.addTo(map);
            marker.id = i + 1;
        
            // marker与多边形等覆盖物图层不同的时，marker是div，而覆盖物图层是canvas渲染与map属于同一个div
            // 所以marker的右键，得由自己的div的上下文菜单来触发
            marker.getElement().addEventListener("mousedown", event => {
                if (event.button != 2) return;//不是右键
                // 阻止地图默认右键菜单触发
                event.preventDefault();
                event.stopPropagation();
                return new vjmap.ContextMenu({
                    event: event,
                    theme: "dark", //light
                    width: "250px",
                    items: [
                        {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">我是标注Marker的右键菜单</span>`},
                        {
                            label: '获取此Marker的信息',
                            onClick: () => {
                                message.info({content: `当前MarkerId为 ${marker.id}`, key: "info", duration: 3});
                            }
                        }
                    ]
                });
            })
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