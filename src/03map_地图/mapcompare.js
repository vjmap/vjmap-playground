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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/mapcompare
        // --地图比较(可用来比较不同版本或样式)--
        
        // 在id为"map”的div下面创建一个一样大的不同的div，用于新的对图对象的容器id
        const createNewMapDivId = ()=> {
            // 先清空之前的
            let parentDiv = document.getElementById("map");
            let newMapDiv = document.createElement("div");
            newMapDiv.id = vjmap.RandomID(6);
            newMapDiv.style.position = 'absolute';
            newMapDiv.style.width = "100%";
            newMapDiv.style.height = "100%";
            parentDiv.appendChild(newMapDiv);
            return newMapDiv.id;
        }
        
        const createCadMap = async (mapid, version, style)=> {
            let newMapId = createNewMapDivId();
            // 地图服务对象
            let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
            // 打开地图
            let res = await svc.openMap({
                mapid: mapid, // 地图ID
                version: version, // 版本号
                mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
                style: style
            })
            if (res.error) {
                // 如果打开出错
                message.error(res.error)
            }
            // 获取地图范围
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // 根据地图范围建立几何投影坐标系
            let prj = new vjmap.GeoProjection(mapExtent);
        
            let center = prj.toLngLat(mapExtent.center());
            // 地图对象
            let map = new vjmap.Map({
                container: newMapId, // DIV容器ID
                style: svc.rasterStyle(), // 样式，这里是栅格样式
                center: center, // 设置地图中心点
                zoom: 1, // 设置地图缩放级别
                renderWorldCopies: false // 不显示多屏地图
            });
        
            // 关联服务对象和投影对象
            map.attach(svc, prj);
            // 根据地图本身范围缩放地图至全图显示
            map.fitMapBounds();
            return map;
        }
        
        // 用来比较不同版本或样式，这里比较不同的样式
        const map1 = await createCadMap(env.exampleMapId, "", vjmap.openMapDarkStyle())
        const map2 = await createCadMap(env.exampleMapId, "", {
            name: "styleDark", // 样式名
            backcolor: 0, // 后台打开地图的背景色
            // 自定义表达式
            expression: "var color := gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);gOutColorAlpha[0] := 50;"
        })
        const container = "#map";
        const map = new vjmap.Compare(map1, map2, container, {
            mousemove: false,
            orientation: "vertical"
        });
        
        map.on("slideend", e => {
            message.info({ content: "slideend", key: "info", duration: 1});
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