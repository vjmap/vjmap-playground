const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolCustomImage
        // --自定义图标图层--
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
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), //svc.rasterBlankStyle(0, 24), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        
        await map.onLoad();
        const mapBounds = map.getGeoBounds(0.6);
        
        const geoDatas = []
        for(let i = 0; i < 100; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name:  `ID:${i + 1}`
                }
            }
            geoDatas.push(data);
        }
        
        const flashingSquare = {
            width: 16,
            height: 16,
            data: new Uint8Array(16 * 16 * 4),
        
            onAdd: function(map) {
                this.map = map;
            },
        
            render: function() {
                // 当图标在地图上时继续重绘
                this.map.triggerRepaint();
        
                this.preData = this.preData || 0;
                if (Date.now() - this.preData >= 1000) {
                    // 一秒更新一次
                    const color = [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)];
                    const bytesPerPixel = 4;
                    for (let x = 0; x < this.width; x++) {
                        for (let y = 0; y < this.height; y++) {
                            const offset = (y * this.width + x) * bytesPerPixel;
                            this.data[offset + 0] = color[0];
                            this.data[offset + 1] = color[1];
                            this.data[offset + 2] = color[2];
                            this.data[offset + 3] = 200;
                        }
                    }
        
                    this.preData = Date.now();
        
                    // 返回 true 表示图像已更改
                    return true;
                }
            }
        }
        
        map.addImage('flashing_square', flashingSquare);
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            iconImage: "flashing_square",
            iconOffset: [0, 0],
            iconAllowOverlap: true
        });
        symbols.addTo(map);
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