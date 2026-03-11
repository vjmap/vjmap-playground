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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerTextureBuilding
        // --Polygon extrusion texture--
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
            antialias: true,
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        let len = mapBounds.width() / 20;
        const center = map.getCenter();
        
        if (typeof vjThree !== "object") {
            // If no env
            await vjmap.addScript([{
                src: "../../js/plugins/vjthree.min.js"
            }, {
                src: "../../js/plugins/vjthree.min.css"
            }])
        }
        
        const threeContext = map.createThreeJsContext({
            defaultLights: true,
            enableSelectingObjects: false
        });
        map.addLayer(new vjmap.ThreeLayer({ context: threeContext }));
        
        
        // Query wall line coordinates
        let query = await svc.conditionQueryFeature({
            condition: `objectid='4AB'`, // SQL WHERE clause; see doc "Server condition query"
            // Query text entities; type codes see doc "Server condition query - CAD entity types"
            // condition: `name='12' or name='13' or name='26' or name='27'`,
            fields: ""
        })
        let linePoints = [];
        if (query.error) {
            message.error(query.error)
        } else {
            if (query.recordCount > 0) {
                let points = query.result[0].points; // Point sequence
                linePoints = points.split(";").map(p => vjmap.GeoPoint.fromString(p));
                // Close
                linePoints.push(linePoints[0]);
            }
        }
        
        const dataPoints = linePoints.map(e => {
            let pt = threeContext.mapToWorld(e);
            return new THREE.Vector2(pt.x, pt.y)
        });
        
        
        const extrudeSettings = {
            depth: 50000,
            steps: 1,
            bevelEnabled: false
        }
        
        
        let rectShape = new THREE.Shape(dataPoints)
        let geometry = new THREE.ExtrudeGeometry(rectShape, extrudeSettings);
        let textureTop = new THREE.TextureLoader().load(env.assetsPath + 'images/building_top.png');
        let materialTop = new THREE.MeshLambertMaterial({
            color: 0x00ff00,
            transparent: true,
            map: textureTop,
            opacity: 0.8,
            side: THREE.DoubleSide
        })
        textureTop.wrapS = textureTop.wrapT = THREE.RepeatWrapping;
        textureTop.repeat.set( 0.000005, 0.000005 );
        
        let textureWall = new THREE.TextureLoader().load(env.assetsPath + 'images/building.png')
        textureWall.wrapS = THREE.RepeatWrapping
        textureWall.wrapT = THREE.RepeatWrapping;
        textureWall.repeat.set( 0.00001, 0.00001 );
        let materialWall = new THREE.MeshLambertMaterial({
            color: 0xffff00,
            transparent: true,
            map: textureWall,
            opacity: 0.8,
            side: THREE.DoubleSide
        })
        
        let mesh = new THREE.Mesh(geometry, [materialTop, materialWall])
        
        let box2d = new THREE.Box2();
        dataPoints.forEach(d => box2d.expandByPoint(d));
        let width = box2d.max.x - box2d.min.x;
        let height = box2d.max.y - box2d.min.y;
        
        const geom = new THREE.PlaneGeometry( width, height);
        let textureLogo = new THREE.TextureLoader().load(env.assetsPath + 'images/a7.png');
        
        let materialLogo = new THREE.MeshLambertMaterial({
            transparent: true,
            map: textureLogo,
            depthTest: false
        })
        let meshLogo = new THREE.Mesh( geom, materialLogo ) ;
        meshLogo.scale.set(0.3, 0.3, 1.0);
        meshLogo.rotateZ(Math.PI);
        meshLogo.position.x = (box2d.max.x + box2d.min.x) / 2.0;
        meshLogo.position.y = (box2d.max.y + box2d.min.y) / 2.0;
        meshLogo.position.z = 50000;
        
        mesh.add(meshLogo)
        
        let obj3d = threeContext.Object3D({ obj: mesh, anchor: "auto" }).setCoords([0,0]);
        threeContext.add(obj3d)
        
        let stopAnimationFrame = null;
        const animation = () => {
            textureTop.offset.x += 0.005;
            textureWall.offset.x += 0.01;
            textureWall.offset.y += 0.01;
            stopAnimationFrame = requestAnimationFrame(animation);
            map.triggerRepaint()
        }
        animation();
        const stop =  () => {
            if (stopAnimationFrame) cancelAnimationFrame(stopAnimationFrame); // Cancel animation
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