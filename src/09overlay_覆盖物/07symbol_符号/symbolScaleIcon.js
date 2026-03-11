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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/symbol/symbolScaleIcon
        // --随级别缩放的符号图标--
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
            zoom: 2, // 设置地图缩放级别,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        await map.onLoad();
        
        for (let i = 0; i < 4; i++) {
            await map.loadImageEx("icon" + i, env.assetsPath + `images/sensor${i + 1}.png`);
        }
        
        const mapBounds = map.getGeoBounds(0.6);
        const geoDatas = []
        for (let i = 0; i < 50; i++) {
            const pt = mapBounds.randomPoint();
            const data = {
                point: map.toLngLat(pt),
                properties: {
                    name: `ID:${i + 1}`,
                    icon: "icon" + vjmap.randInt(0, 3)
                }
            }
            geoDatas.push(data);
        }
        
        let iconHeight = 0.2 // 最开始级别的图像像素高
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            // 图标名来源于geojson属性中的icon字段
            iconImage: ['get', 'icon'],
            // 二级以下全部用icon1图标，二级以上用自己属性中的图标名
            //iconImage: ["step", ["zoom"], "icon1", 2, ['get', 'icon']],
            iconOffset: [0, -12],
            iconSize: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0, ["*", iconHeight, ["^", 2, 0]], // 最开始级别的图像像素高
                3, ["*", iconHeight, ["^", 2, 3]] // 超过3级后，图标不放大了。3级也可以自己修改
            ],
            // 鼠标hover时设置透明度0.8,不悬浮1.0
            iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 1.0],
            iconAllowOverlap: false,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        // 如需文字也缩放，可查看此示例  https://vjmap.com/demo/#/demo/map/overlay/text/02scalesymboltext
        symbols.addTo(map);
        symbols.clickLayer(e => {
            if (e.defaultPrevented) return; //  如果事件之前阻止了，则不再执行了
            message.info(`您点击了第 ${e.features[0].id} 个，名称为 ${e.features[0].properties.name}，的图标`)
            e.preventDefault(); // 阻止之后的事件执行
        })
        
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