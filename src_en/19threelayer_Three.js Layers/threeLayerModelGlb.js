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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerModelGlb
        // --Three.js load GLB model--
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
            zoom: 3,
            pitch: 60,
            antialias:true,
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds();
        const center = map.getCenter();
        
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
            enableSelectingObjects: true // Set to false to disable 3D object selection
        });
        
        let modelSize = 1.8 // soldier.glb model size
        let modelMapLength = mapBounds.width() / 10; // Model on map = 1/10 of map width
        // Scale ratio
        let scale = map.getMapProjection().toMeter(modelMapLength) / modelSize;
        
        const options = {
            obj: env.assetsPath + 'data/soldier.glb',
            type: 'gltf',
            scale: scale,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 }, //default rotation
            anchor: 'center'
        }
        
        // Doc https://vjmap.com/guide/threejs.html
        threeContext.loadObj(options, function (model) {
            let soldier = model.setCoords([center.lng, center.lat, 0]);
            threeContext.add(soldier);
        
            soldier.addEventListener('SelectedChange', e => console.log(e), false);
            soldier.addEventListener('Wireframed', e => console.log(e), false);
            soldier.addEventListener('IsPlayingChanged', e => console.log(e), false);
            soldier.addEventListener('ObjectDragged', e => console.log(e), false);
            soldier.addEventListener('ObjectMouseOver', e => console.log(e), false);
            soldier.addEventListener('ObjectMouseOut', e => console.log(e), false);
        
        
            // Modify size/angle later
            setTimeout(() => {
                let scale = soldier.scale.x * 2
                soldier.set({ scale: [scale, scale, scale] , rotation: [10, 10, 10] });
        
                // Update coordinate
                let lnglat = map.toLngLat([587727221.6345291,3103853143.0935783]) // CAD coordinate
                //soldier.set({ position: [lnglat[0], lnglat[1], 0] });
                 //soldier.setCoords([lnglat[0], lnglat[1], 0] )
            }, 3000)
        })
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