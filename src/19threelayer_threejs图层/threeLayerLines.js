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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/threelayer/threeLayerLines
        // --threejs 3d线--
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
        
        if (typeof vjThree !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/plugins/vjthree.min.js"
            },{
                src: "../../js/plugins/vjthree.min.css"
            }])
        }
        
        const threeContext = map.createThreeJsContext({
            defaultLights: true
        });
        const arcSegments = 25;
        const lineQuantity = 50;
        
        for (let i = 0; i < lineQuantity; i++){
            const line = [];
            const destination = [300*(Math.random()-0.5), 140*(Math.random()-0.5)];
            const maxElevation = Math.pow(Math.abs(destination[0]*destination[1]), 0.5) * 80000;
        
            const increment = destination.map(function(direction){
                return direction/arcSegments;
            })
        
            for (let l = 0; l<=arcSegments; l++){
                const waypoint = increment.map(function(direction){
                    return direction * l
                })
        
                const waypointElevation = Math.sin(Math.PI*l/arcSegments) * maxElevation;
        
                waypoint.push(waypointElevation);
                line.push(waypoint);
            }
        
            const lineOptions = {
                geometry: line,
                color: (line[1][1]/180) * 0xffffff, // color based on latitude of endpoint
                width: Math.random() + 1 // random width between 1 and 2
            }
        
            let lineMesh = threeContext.line(lineOptions);
            threeContext.add(lineMesh)
        }
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