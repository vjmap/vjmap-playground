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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/l7layer/02airPlaneLayer
        // --飞行线动画--
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        // 假设我们希望全图显示是对应级别为8级
        let initZoom = 8;
        let style = {
            backcolor: 0, // div为深色背景颜色时，这里也传深色背景样式
            clipbounds: Math.pow(2, initZoom) // 只传值，不传范围，表示之前的范围放大多少倍
        }
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: style // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: initZoom + 1,
            pitch: 60,
            minZoom: initZoom - 3,//可以设置一个最小级别
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
        // 点击有高亮状态（鼠标点击地图元素上时，会高亮)
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        })
        
        let mousePositionControl = new vjmap.MousePositionControl({
            showZoom: true,
            showLatLng: true
        });
        map.addControl(mousePositionControl, "bottom-left");
        
        await map.onLoad();
        
        let mapBounds = vjmap.GeoBounds.fromString(res.mapBounds); // 图的真正范围
        mapBounds = mapBounds.scale(0.4);
        
        // 下面增加l7的库，L7的用法，可参考L7官方地址 https://l7.antv.vision/zh
        if (typeof L7 !== "object") {
            // 如果没有deck环境
            await vjmap.addScript({
                src: "../../js/l7.js"
            });
        
        }
        
        let lngLat1 = map.toLngLat(mapBounds.min);
        let lngLat2= map.toLngLat([mapBounds.min.x, mapBounds.max.y]);
        let lngLat3 = map.toLngLat(mapBounds.max);
        let lngLat4 = map.toLngLat([mapBounds.max.x, mapBounds.min.y]);
        
        const airPorts = [
            {
                name: '地点一',
                lng: lngLat1[0],
                lat: lngLat1[1]
            },
            {
                name: '地点二',
                lng: lngLat2[0],
                lat: lngLat2[1]
            },
            {
                name: '地点三',
                lng: lngLat3[0],
                lat: lngLat3[1]
            },
            {
                name: '地点四',
                lng: lngLat4[0],
                lat: lngLat4[1]
            }
        ];
        const center = map.toLngLat(mapBounds.center())
        const planeTarget = {
            lng2: center[0],
            lat2: center[1]
        };
        const airLineData = [
            {
                name: '地点一',
                lng: lngLat1[0],
                lat: lngLat1[1],
                ...planeTarget
            },
            {
                name: '地点二',
                lng: lngLat2[0],
                lat: lngLat2[1],
                ...planeTarget
            },
            {
                name: '地点三',
                lng: lngLat3[0],
                lat: lngLat3[1],
                ...planeTarget
            },
            {
                name: '地点四',
                lng: lngLat4[0],
                lat: lngLat4[1],
                ...planeTarget
            }
        ];
        
        // 下面生成l7的场景
        const scene = new vjmap.Scene(L7, map);
        
        scene.addImage(
            'plane',
            'https://gw.alipayobjects.com/zos/bmw-prod/96327aa6-7fc5-4b5b-b1d8-65771e05afd8.svg'
        );
        const airPrtsLayer = new L7.PointLayer()
            .source(airPorts, {
                parser: {
                    type: 'json',
                    x: 'lng',
                    y: 'lat'
                }
            })
            .shape('name', 'text')
            .color('#00F8F9')
            .size(10);
        
        const airLineLayer = new L7.LineLayer({ blend: 'normal' })
            .source(airLineData, {
                parser: {
                    type: 'json',
                    x: 'lng',
                    y: 'lat',
                    x1: 'lng2',
                    y1: 'lat2'
                }
            })
            .shape('arc3d')
            .size(3)
            .color('#f00')
            .style({
                sourceColor: '#00F8F9',
                targetColor: 'rgba(0,248,249,0.1)'
            });
        
        const airPlaneLayer = new L7.LineLayer({ blend: 'normal', zIndex: 1 })
            .source(airLineData, {
                parser: {
                    type: 'json',
                    x: 'lng2',
                    y: 'lat2',
                    x1: 'lng',
                    y1: 'lat'
                }
            })
            .shape('arc3d')
            .texture('plane')
            .size(60)
            .color('#f00')
            .animate({
                duration: 0.2,
                interval: 0.2,
                trailLength: 0.2
            })
            .style({
                textureBlend: 'replace',
                lineTexture: true, // 开启线的贴图功能
                iconStep: 6 // 设置贴图纹理的间距
            });
        
        
        const dotPoint = new L7.PointLayer({ bland: 'additive' })
            .source(airPorts, {
                parser: {
                    type: 'json',
                    x: 'lng',
                    y: 'lat'
                }
            })
            .shape('circle')
            .color('#00F8F9')
            .animate(true)
            .size(80)
            .style({
                opacity: 1.0
            });
        
        scene.on('loaded', () => {
            scene.addLayer(dotPoint);
            scene.addLayer(airPrtsLayer);
            scene.addLayer(airLineLayer);
            scene.addLayer(airPlaneLayer);
        });
        
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