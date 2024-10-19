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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/02techEffect
        // --高科技效果展示--
        // 地图服务对象
        // 注意：此示例是基于旧的vjthree的三维库，目前唯杰地图3D库已升级，可参考最新的示例效果 
        // https://vjmap.com/map3d/demo/#/demo/map/entity/custom/05entitycustommap2d
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style:{
                name: "styleDark", // 样式名
                backcolor: 0, // 后台打开地图的背景色
                // 自定义表达式
                expression: "var color := gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);gOutColorAlpha[0] := 50;"
            }
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
            zoom: 0,
            pitch: 60,
            antialias: true,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        let len = mapBounds.width() / 20;
        const center = map.getCenter();
        
        if (typeof vjThree !== "object") {
            // 如果没有环境
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
        
        
        
        // 查询要绘制的光墙线坐标
        let query = await svc.conditionQueryFeature({
            condition: `objectid='9BE'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
            // 查询所有文字(包括单行文本，多行文本、块注记文字，属性文字) 具体类型数字参考文档"服务端条件查询和表达式查询-支持的cad实体类型"
            // condition: `name='12' or name='13' or name='26' or name='27'`,
            fields: ""
        })
        let linePoints = [];
        if (query.error) {
            message.error(query.error)
        } else {
            if (query.recordCount > 0) {
                let points = query.result[0].points; // 得到点坐标序列
                linePoints = points.split(";").map(p => vjmap.GeoPoint.fromString(p));
                // 闭合
                linePoints.push(linePoints[0]);
                threeContext.wall(linePoints, {
                    height: 40000
                })
            }
        }
        
        
        let c = mapExtent.center();
        linePoints[0] = c;
        
        for(let i = 0; i < linePoints.length; i++) {
            if (i != 0) {
                // 增加从中点至坐标点的飞线
                threeContext.flyline({
                    source: {
                        x: c.x,
                        y: c.y,
                        z: 0
                    },
                    target: {
                        x: linePoints[i].x,
                        y: linePoints[i].y,
                        z: 0,
                    },
                    count: 1000,
                    range: 200,
                    height: 300000,
                    color: vjmap.randomColor(),
                    color2: vjmap.randomColor(),
                    size: 30
                });
            }
        
            let pt = linePoints[i];
            pt.z = 1000;
            // 创建一个四棱锥
            threeContext.coneMesh(pt, {
                size: 10240,
                color: vjmap.randomColor()
            });
        
            // 创建一个波动光圈
            threeContext.wave(linePoints[i], {
                color: vjmap.randomColor(),
                size: 5000
            });
        }
        
        // 创建一个径向渐变球
        threeContext.radialGradient(c, {
            color: new THREE.Vector3(0.0,1.0,1.0),
            size: 50000
        });
        
        // 创建一个波动光圈
        threeContext.waveWall(c, {
            color: "#ffff00",
            height: 4000
        });
        
        // 增加烟花背景
        for(let i = 0; i < 20; i++) {
            let pt = mapExtent.randomPoint();
            threeContext.flyline({
                source: {
                    x: pt.x,
                    y: pt.y,
                    z: 0
                },
                target: {
                    x: pt.x,
                    y: pt.y,
                    z: 500000,
                },
                count: 1000,
                range: 500,
                height: 0,
                color: vjmap.randomColor(),
                color2: vjmap.randomColor(),
                speed: 1,
                size: 3,
                opacity: 1.0,
            });
        }
        
        // 增加雷达
        let pt = mapExtent.randomPoint();
        let radar = threeContext.radar(pt, {
            size: 80000,
            texture1: (env.assetsPath + 'images/扫描雷达.png'),
            texture2: (env.assetsPath + 'images/雷达刻度.png'),
            color1: "#ffff00",
            color2: "#00ff00"
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