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
        // --Three.js control car--
        // !!! `vjthree` is deprecated; use latest [vjmap 3D] https://vjmap.com/map3d/
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(mapExtent.center()),
            zoom: 6,
            pitch: 60,
            antialias:true,
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        const center = map.getCenter();
        const len = mapBounds.width() / 20;
        
        if (typeof vjThree !== "object") {
            // If no env
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