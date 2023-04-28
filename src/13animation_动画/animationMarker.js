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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationMarker
        // --点标记动画--
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
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            pitch: 40, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        let pixelPos = [100, 0];
        const marker = new vjmap.Marker();
        marker.setLngLat(map.unproject(pixelPos));
        marker.addTo(map);
        
        vjmap.createAnimation({
                from: 0,
                to: 450, // 像素y的距离
                duration: 3000,
                ease:vjmap.linear, //线性
                onUpdate: latest => {
                    marker.setLngLat(map.unproject([100, latest]));
                }
            }
        );
        
        let greenPixelPos = [200, 0];
        const greenMarker = new vjmap.Marker({
            color: "green"
        });
        greenMarker.setLngLat(map.unproject(greenPixelPos));
        greenMarker.addTo(map);
        
        vjmap.createAnimation({
                from: 0,
                to: 450, // 像素y的距离
                duration: 3000,
                type: "spring", // 弹跳效果
                stiffness: 100, // 定义了弹簧的刚度。更高的刚度将产生更快速的动画。默认为 100
                damping: 5,// 阻尼， 这是 的反作用力stiffness。当您相对于 减小此值时，stiffness弹簧将变得更有弹性并且动画将持续更长时间
                mass: 2, // 质量 这是动画对象的质量。较重的物体需要更长的时间来加速和减速
                velocity: 10,// 速度 动画的初始速度，以每秒为单位。
                bounce: 1,// 弹簧的弹力，作为0和之间的值1，其中0没有弹跳。
                onUpdate: latest => {
                    greenMarker.setLngLat(map.unproject([200, latest]));
                }
            }
        );
        
        let redPixelPos = [300, 0];
        const redMarker = new vjmap.Marker({
            color: 'red'
        });
        redMarker.setLngLat(map.unproject(redPixelPos));
        redMarker.addTo(map);
        
        vjmap.createAnimation({
                from: 0,
                to: 450, // 像素y的距离
                duration: 3000,
                type: "decay", // 衰减效果 用于惯性作用
                velocity: 450, // 动画的初始速度，以每秒为单位。
                power: 0.8,// 用于计算目标值的常数。更高的功率 = 进一步的目标。    默认为0.8.
                timeConstant: 400,// 调整时间常数会改变减速的持续时间，从而影响其手感。
                min: 0,// 动画将从逐渐减速切换并使用弹簧动画捕捉到该点的最小值。
                max: 100, // 动画将从逐渐减速切换并使用弹簧动画捕捉到该点的最大值。
                bounceStiffness: 500,// 这定义了动画命中min或时弹簧的刚度max。更高的刚度将产生更快速的动画。缺省500
                bounceDamping: 10, // 这是 的反作用力bounceStiffness。当您相对于 减小此值时，bounceStiffness弹簧将变得更有弹性并且动画将持续更长时间。同样，较高的相对值将具有较小的弹性并导致动画较短。
                onUpdate: latest => {
                    redMarker.setLngLat(map.unproject([300, latest]));
                }
            }
        );
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