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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05openMapFromHttp
        // --通过网络路径打开地图--传入DWG路径的http路径打开DWG图
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        // 地图ID (如果换成了您自定义的url地址，记得修改此名称id，改成您想要的唯一的名称即可)
        const mapid = "gym";
        // 地图url地址，注意：url地址后四个字母必须为.dwg。如果实际中的地址四4位不是.dwg可以随便加个参数如 url?param=xxx&filetype=.dwg
        const httpDwgUrl = "https://vjmap.com/../../assets/data/gym.dwg" ;
        
        let res = await svc.openMap({
            // (第一次打开此地图ID时，会根据fileid去获取dwg路径打开，之后会读取缓存打开)
            mapid: mapid, // 地图ID
            fileid: httpDwgUrl,
            // httpUsePost: true, // 如果是复杂的url地址，建议用post请求，请把httpUsePost设置为true, 默认false
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        /*
         “(第一次打开此地图ID时，会根据fileid去获取dwg路径打开，之后会读取缓存打开)” 的意思是
          举例来说，您第一次打开的图的时候用的是
        {
         mapid: 'map1',
         fileid: 'http://127.0.0.1/1.dwg'
        }
        这时候因为后台没有 map1 这个图纸，所以第一次时 map1 就会去下载 'http://127.0.0.1/1.dwg'
        打开图。
        但是，您第二次的时候如果要换成另外的图2.dwg，但是如果还是用同样的mapid的话，如
        {
         mapid: 'map1',
         fileid: 'http://127.0.0.1/2.dwg'
        }
        这时候为了性能，后台不会再去下载2.dwg了，就直接用之前的下载并处理好的图的缓存数据了。
        这时候有两个选择。
        (1) 要么是updateMap去更新图。
        (2) 要么就重新命名一个新的 mapid 如map2
        */
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式,// 矢量瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        
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