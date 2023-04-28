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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/l7layer/01wavebarLayer
        // --光柱和路径动画--
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
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
            zoom: 2,
            pitch: 60,
            //minZoom: initZoom - 3,//可以设置一个最小级别
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
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        let c = map.getCenter()
        
        // 下面增加l7的库，L7的用法，可参考L7官方地址 https://l7.antv.vision/zh
        if (typeof L7 !== "object") {
            // 如果没有deck环境
            await vjmap.addScript({
                src: "../../js/l7.js"
            });
        
        }
        // 下面生成l7的场景
        const scene = new vjmap.Scene(L7, map);
        
        const waveLayer = new L7.PointLayer({ zIndex: 2, blend: 'additive' })
            .source(
                [
                    { lng: 0, lat: 0, size: 10000 },
                ],
                {
                    parser: {
                        type: 'json',
                        x: 'lng',
                        y: 'lat'
                    }
                }
            )
            .shape('circle')
            .color('#00F8F9')
            .size('size', v => v / 100.0)
            .animate(true)
            .style({
            });
        
        const barLayer = new L7.PointLayer({ zIndex: 2, depth: false })
            .source(
                [
                    { lng: 0, lat: 0, size: 10000 },
                ],
                {
                    parser: {
                        type: 'json',
                        x: 'lng',
                        y: 'lat'
                    }
                }
            )
            .shape('cylinder')
            .color('#00F8F9')
            .size('size', v => [ 5, 5, v / 100 ])
            .active({
                color: 'red',
                mix: 0.0,
            })
            .animate(true)
            .style({
                opacityLinear: {
                    enable: true, // true - false
                    dir: 'up' // up - down
                },
                lightEnable: false
            });
        
        scene.addImage(
            'arrow',
            'https://gw.alipayobjects.com/zos/bmw-prod/ce83fc30-701f-415b-9750-4b146f4b3dd6.svg'
        );
        
        let data = {
            "type": "FeatureCollection",
            "name": "dl2",
            "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
            "features": [
                { "type": "Feature", "properties": { }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ -50, -30 ], [ 0, 0], [ 20, 40 ] ] ] } },
            ]}
        const layer = new L7.LineLayer({})
            .source(data)
            .size(10)
            .shape('line')
            .texture('arrow')
            .active(true)
            .color('#00F8F9')
            .animate({
                interval: 1, // 间隔
                duration: 1, // 持续时间，延时
                trailLength: 2 // 流线长度
            })
            .style({
                opacity: 0.6,
                lineTexture: true, // 开启线的贴图功能
                iconStep: 10, // 设置贴图纹理的间距
                borderWidth: 0.4, // 默认文 0，最大有效值为 0.5
                borderColor: '#fff' // 默认为 #ccc
            });
        
        layer.on('click', (e) => {
            console.log('click', e);
        });
        
        scene.on('loaded', () => {
            scene.addLayer(waveLayer);
            scene.addLayer(barLayer);
            scene.addLayer(layer);
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