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
        // --Three.js extrusion model--
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
            zoom: 2,
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
        const len1 = mapBounds.width() / 10;
        const len2 = mapBounds.width() / 20;
        
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
            enableSelectingObjects: true, // Set to false to disable 3D object selection
            enableDraggingObjects: true, // Set to false to disable drag/move after select
            enableRotatingObjects: true, // Set to false to disable 3D object rotation after select
            enableTooltips: true // Set to false to disable default tooltips
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