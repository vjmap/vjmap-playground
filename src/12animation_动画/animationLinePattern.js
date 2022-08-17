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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/animationLinePattern
        // --线图案路径动画--
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
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.6);
        /*
        方式一
         */
        await map.loadImageEx(`arrow2`, `../../assets/images/arrow.png`);
        const lines2 = mapBounds.randomGeoJsonLineCollection(3, 3);
        map.addGeoJSONSource('lines2', map.toLngLat(lines2));
        map.addSymbolLayer("SymbolLayer2", "lines2", {
            iconImage: "arrow2",
            symbolPlacement: 'line',
            iconAllowOverlap: true,
            iconRotationAlignment: "map",
            symbolSpacing: 64,
            iconSize: 1,
            iconOffset: [0,0],
            iconPadding: 0
        });
        map.addLineLayer("lineLayer2", "lines2", {
            lineColor: "green",
            lineWidth: 16,
            lineOpacity: 0.5
        });
        
        vjmap.createAnimation({
            from: 0,
            to: 64,
            repeat: Infinity,
            duration: 2000,
            ease:vjmap.linear, //线性
            onUpdate: latest => {
                map.setLayoutProperty('SymbolLayer2', 'icon-offset', [latest, 0]);
            }
        })
        /*
        方式二
         */
        const size = 32;
        const arrow = {
            width: size,
            height: size,
            data: new Uint8Array(size * size * 4),
            //将图层添加到地图时获取地图画布的渲染上下文
            onAdd: function () {
                let canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;
                this.context = canvas.getContext('2d');
            },
        
            // 在将使用图标的每一帧之前调用一次
            render: function () {
                const duration = 800;
                let t = (performance.now() % duration) / duration / 2;
        
                const len = size / 2;
                let context = this.context;
                context.clearRect(0, 0, this.width, this.height);
                const x = t * size;
                const y = 0;
                context.beginPath();
                context.strokeStyle = "#058";
                context.lineWidth = 5;
                context.moveTo(x,0);
                context.lineTo(x + len,size / 2);
                context.lineTo(x,size);
                context.stroke();
                this.data = context.getImageData(
                    0,
                    0,
                    this.width,
                    this.height
                ).data;
                // 不断地重绘地图，导致圆点的平滑动画
                map.triggerRepaint();
        
                // 返回 `true` 让地图知道图像已更新
                return true;
        
            }
        };
        
        map.addImage('arrow', arrow, { pixelRatio: 2 });
        
        const lines = mapBounds.randomGeoJsonLineCollection(1, 3);
        map.addGeoJSONSource('lines', map.toLngLat(lines));
        map.addSymbolLayer("SymbolLayer", "lines", {
            iconImage: "arrow",
            symbolPlacement: 'line',
            iconAllowOverlap: true,
            iconRotationAlignment: "map",
            symbolSpacing: 1,
            iconSize: 1
        });
        map.addLineLayer("lineLayer", "lines", {
            lineColor: "yellow",
            lineWidth: 16,
            lineOpacity: 0.5
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