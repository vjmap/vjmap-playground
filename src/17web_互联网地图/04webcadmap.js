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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/04webcadmap
        // --CAD图与互联网图叠加--CAD图与互联网图叠加显示，以CAD图为坐标系
        // 假设我们希望CAD全图显示是对应级别为8级,这样地图缩小后，互联网地图还会显示
        let initZoom = 8;
        let style = {
            backcolor: 0, // div为深色背景颜色时，这里也传深色背景样式
            clipbounds: Math.pow(2, initZoom) // 只传值，不传范围，表示之前的范围放大多少倍
        }
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: "sys_cad2000",
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style:  style
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: initZoom,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        await map.onLoad();
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        // 如果x是8位，可通过前两位获取 如 vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
        // 如果x是6位，是通过下面此工具 https://vjmap.com/demo/#/demo/map/web/03webzgetepsg，把地图移动至cad图位置的省市，点击获取当前地图中心经纬度， 计算EPSG，找一个与 CAD图距离相近的EPSG
        let epsg = "EPSG:4509" // cad图的epsg
        // 增加高德地图底图
        const addGaodeMap = async (isRoadway) => {
            const tileUrl = svc.webMapUrl({
                tileCrs: "gcj02",
                tileUrl:  isRoadway ? [
                        "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                    ] :
                    /* 如果用影像 */
                    [
                        "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                        "https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                    ],
                tileSize: 256,
                tileRetina: 1,
                tileMaxZoom: 18,
                tileShards: "1,2,3,4",
                tileToken: "",
                tileFlipY: false,
                mapbounds: res.bounds,
                srs: epsg
            })
        
            map.addSource('web-gaode-source', {
                'type': 'raster',
                'tiles': [
                    tileUrl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': 'web-gaode-layer',
                    'type': 'raster',
                    'source': 'web-gaode-source',
                    'paint': { "raster-opacity": 1 }
                }
            );
            let layers = map.getStyle().layers
            // 把这个图层放至所有图层的最下面
            map.moveLayer('web-gaode-layer', layers[0].id)
        
            // cad坐标与高德坐标相互转换示例
            let webCo = await cad2webCoordinate(center, false); // cad转高德
            let cadCo = await web2cadCoordinate(webCo, false); // 高德转cad
            console.log(center, webCo, cadCo)
        }
        
        // 增加天地图图底图
        const addTiandituMap = async (isRoadway) => {
            const tileUrl = svc.webMapUrl({
                tileCrs: "wgs84",
                tileUrl: [
                    isRoadway ? "https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk={t}" :
                        /* 如果用影像 */"https://t{s}.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk={t}",
                    "https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk={t}"
                ],
                tileSize: 256,
                tileRetina: 1,
                tileMaxZoom: 18,
                tileShards: "1,2,3,4,5,6",
                tileToken: [
                    "6d53378dc5f7dbef8d84ffdd2b54139b", // 有可能有一个token会导致请求过多而返回失败，可以多写几个，失败时会尝试后面的token
                    "69eb2fa0de3b2a668f1ef603a3f8bc73"
                ],
                tileFlipY: false,
                mapbounds: res.bounds,
                srs: epsg
            })
        
            map.addSource('web-tdt-source', {
                'type': 'raster',
                'tiles': [
                    tileUrl
                ],
                'tileSize': 256
            });
            map.addLayer({
                    'id': 'web-tdt-layer',
                    'type': 'raster',
                    'source': 'web-tdt-source',
                    'paint': { "raster-opacity": 1 }
                }
            );
            let layers = map.getStyle().layers
            // 把这个图层放至所有图层的最下面
            map.moveLayer('web-tdt-layer', layers[0].id)
        
            // cad坐标与天地图坐标相互转换示例
            let webCo = await cad2webCoordinate(center, true); // cad转天地图
            let cadCo = await web2cadCoordinate(webCo, true); // 天地图转cad
            console.log(center, webCo, cadCo)
        }
        
        
        
        const removeMapLayer = ()=> {
            // 删除source及source下面的所有图层
            map.removeSourceEx(['web-gaode-source', 'web-tdt-source'])
        }
        
        // cad转web坐标，isWgs84是否为wgs84 4326坐标，如天地图；否的话为gcj02火星坐标,如高德地图
        const cad2webCoordinate = async (pt, isWgs84) => {
            // 通过坐标转换把转成wgs84 4326坐标
            let res = await svc.cmdTransform(epsg,"EPSG:4326",pt); // 如果不想调服务转，也可以在前端用proj4库
            // 如果为火星坐标，还需要从4326转火星
            let webPt = res[0];// 返回的第1条结果
            if (isWgs84 === false) {
                webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
            }
            return webPt;
        }
        
        // web转cad坐标，isWgs84是否为wgs84 4326坐标，如天地图；否的话为gcj02火星坐标,如高德地图
        const web2cadCoordinate = async (pt, isWgs84) => {
            // (上面计算过程的逆过程), 如果为火星坐标，还需要从火星转4326，再通过坐标转换把wgs84 4326转成cad图坐标
            if (isWgs84 === false) {
                pt = vjmap.transform.convert(pt, vjmap.transform.CRSTypes.AMap, vjmap.transform.CRSTypes.EPSG4326);
            }
            // 通过坐标转换把cad epsg转成wgs84 4326坐标
            let res = await svc.cmdTransform("EPSG:4326",epsg,vjmap.geoPoint(pt)); // 如果不想调服务转，也可以在前端用proj4库
            let cadPt = res[0];// 返回的第1条结果
            return cadPt
        }
        
        map.on("zoomend", async ()=> {
            let center = map.fromLngLat(map.getCenter());// 得到cad地图地理中心坐标点
            let gcj02Web = await cad2webCoordinate(center, false);// 转高德坐标
            let wgs84Web = await cad2webCoordinate(center, true);// 转天地图坐标
            let content = `当前地图中心点坐标： CAD坐标:${center.x.toFixed(4)},${center.y.toFixed(4)}; 高德坐标:${gcj02Web[0].toFixed(4)},${gcj02Web[1].toFixed(4)}; 天地图坐标:${wgs84Web[0].toFixed(4)},${wgs84Web[1].toFixed(4)}`;
            message.info({ content, key: "info", duration: 3});
        })
        
        const { useState } = React;
        const { Radio, Space } = antd;
        // UI界面
        const App = () => {
            const [value, setValue] = useState(0);
            const onChange = (v) => {
                let val = v.target.value
                setValue(val)
                switch (val) {
                    case 0:
                        removeMapLayer(); // 把之前的底图删除了
                        break;
                    case 1:
                        removeMapLayer(); // 把之前的底图删除了
                        addGaodeMap(true);
                        break;
                    case 2:
                        removeMapLayer(); // 把之前的底图删除了
                        addGaodeMap(false);
                        break;
                    case 3:
                        removeMapLayer(); // 把之前的底图删除了
                        addTiandituMap(true);
                        break;
                    case 4:
                        removeMapLayer(); // 把之前的底图删除了
                        addTiandituMap(false);
                        break;
                }
            }
        
            let style ={"min-width":"65px"}
            return (
                <Radio.Group className="input-card"  onChange={onChange} value={value} style={style}>
                    <Space direction="vertical">
                        <Radio value={0}>不叠加地图</Radio>
                        <Radio value={1}>叠加高德道路地图</Radio>
                        <Radio value={2}>叠加高德影像地图</Radio>
                        <Radio value={3}>叠加天地图道路</Radio>
                        <Radio value={4}>叠加天地图影像</Radio>
                    </Space>
                </Radio.Group>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
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