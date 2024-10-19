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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerTruckGame
        // --threejs控制小车--
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
            zoom: 6,
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
        const len = mapBounds.width() / 20;
        
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
            enableSelectingObjects: true
        });
        let truck;
        let origin = [center.lng, center.lat, 0];
        let options = {
            type: "glb", //model type
            obj: env.assetsPath + "data/car.glb",
            units: 'meters', // in meters
            scale: 200000, //x3 times is real size for this model
            rotation: { x: 90, y: -90, z: 0 }, //default rotation
            anchor: 'top'
        }
        threeContext.loadObj(options, function (model) {
            truck = model.setCoords(origin);
            truck.setRotation({ x: 0, y: 0, z: -38 }); //turn it to the initial street way
            truck.addTooltip("Drive with WASD keys", true, truck.anchor, true, 2);
            truck.castShadow = true;
            truck.selected = true;
        
            threeContext.add(truck);
            init();
        });
        map.addLayer(new vjmap.ThreeLayer({context: threeContext}));
        
        let velocity = 0.0, speed = 0.0, ds = 0.40;
        let keys;
        let api = {
            acceleration: 5,
            inertia: 3
        };
        function init() {
            keys = {
                a: false,
                s: false,
                d: false,
                w: false
            };
        
            document.body.addEventListener('keydown', function (e) {
        
                const key = e.code.replace('Key', '').toLowerCase();
                if (keys[key] !== undefined)
                    keys[key] = true;
            });
            document.body.addEventListener('keyup', function (e) {
        
                const key = e.code.replace('Key', '').toLowerCase();
                if (keys[key] !== undefined)
                    keys[key] = false;
            });
        
            animate();
        }
        
        function easing(t) {
            return t * (2 - t);
        }
        
        function animate() {
            requestAnimationFrame(animate);
            speed = 0.0;
        
            if (!(keys.w || keys.s)) {
                if (velocity > 0) { speed = -api.inertia * ds }
                else if (velocity < 0) { speed = api.inertia * ds }
                if (velocity > -0.0008 && velocity < 0.0008) { speed = velocity = 0.0; return; }
            }
        
            if (keys.w)
                speed = api.acceleration * ds;
            else if (keys.s)
                speed = -api.acceleration * ds;
        
            velocity += (speed - velocity) * api.acceleration * ds;
            if (speed == 0.0) {
                velocity = 0;
                return;
            }
        
            truck.set({ worldTranslate: new THREE.Vector3(0, -velocity, 0) });
        
            let options = {
                center: truck.coordinates,
                bearing: map.getBearing(),
                easing: easing
            };
        
            function toDeg(rad) {
                return rad / Math.PI * 180;
            }
        
            function toRad(deg) {
                return deg * Math.PI / 180;
            }
        
            let deg = 1;
            let rad = toRad(deg);
            let zAxis = new THREE.Vector3(0, 0, 1);
        
            if (keys.a || keys.d) {
                rad *= (keys.d ? -1 : 1);
                truck.set({ quaternion: [zAxis, truck.rotation.z + rad] });
                options.bearing = -toDeg(truck.rotation.z);
            }
        
            map.jumpTo(options);
            threeContext.map.update = true;
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