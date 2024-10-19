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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerExtrusion
        // --threejs拉伸模型--
        // !!! 下面中的`vjthree`库已弃用，请用最新的[唯杰地图3D库] https://vjmap.com/map3d/
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
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            pitch: 60,
            antialias:true,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        const center = map.getCenter();
        const len1 = mapBounds.width() / 10;
        const len2 = mapBounds.width() / 20;
        
        if (typeof vjThree !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/plugins/vjthree.min.js"
            },{
                src: "../../js/plugins/vjthree.min.css"
            }])
        }
        
        const threeContext = map.createThreeJsContext({
            defaultLights: true,
            enableSelectingObjects: true, // 将此更改为 false 以禁用 3D 对象选择
            enableDraggingObjects: true, // 将此更改为 false 以禁用 3D 对象在选择后拖动和移动
            enableRotatingObjects: true, // 将此更改为 false 以禁用选择后的 3D 对象旋转
            enableTooltips: true // 将此更改为 false 以禁用填充挤出和 3D 模型的默认工具提示
        });
        
        const redMaterial = new THREE.MeshPhongMaterial({
            color: 0x660000,
            side: THREE.DoubleSide
        });
        
        const points = [], numPts = 5;
        for (let i = 0; i < numPts * 2; i++) {
            const l = i % 2 === 1 ? prj.toMeter(len1) : prj.toMeter(len2);
            const a = i / numPts * Math.PI;
            points.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l));
        }
        const material1 = new THREE.MeshLambertMaterial({ color: 0xb00000, wireframe: false });
        const material2 = new THREE.MeshLambertMaterial({ color: 0xff8000, wireframe: false });
        let star = threeContext.extrusion({
            coordinates: points,
            geometryOptions: { depth: prj.toMeter(len2), steps: 1, bevelEnabled: true, bevelThickness: 2, bevelSize: 4, bevelSegments: 1 },
            anchor: 'center',
            units: 'meters',
            rotation: { x: 90, y: 0, z: 120 },
            materials: [material1, material2]
        });
        star.addTooltip("A animated extruded star", true);
        star.setCoords([center.lng, center.lat, 50]);
        star.set({ rotation: {x: 0, y: 90, z: 720}, duration: 20000 })
        threeContext.add(star);
        
        map.addLayer(new vjmap.ThreeLayer({context: threeContext}));
        
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