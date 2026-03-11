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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerAnimation
        // --Three.js model animation--
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
        
        const mapBounds = map.getGeoBounds(0.6);
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
        const options = {
            obj: env.assetsPath + 'data/soldier.glb',
            type: 'gltf',
            scale: 10000,
            rotation: { x: 90, y: 0, z: 0 }, //default rotation
            anchor: 'center'
        }
        
        const createLabelIcon = (text) => {
            let popup = document.createElement('div');
            popup.innerHTML = '<span title="' + text + '" style="font-size: 30px;color: yellow;">&#9762;</span>';
            return popup;
        }
        threeContext.loadObj(options, function (model) {
            let soldier = model.setCoords([center.lng, center.lat, 0]);
            model.addLabel(createLabelIcon("Status: Radioactive"), true);
            model.addTooltip("This is a custom tooltip", true);
            threeContext.add(soldier);
            // play animation 3, for 10 seconds
            soldier.playAnimation({ animation: 1, duration: 10000 });
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