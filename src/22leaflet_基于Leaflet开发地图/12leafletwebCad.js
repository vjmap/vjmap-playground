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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/12leafletwebCad
        // --CAD图叠加互联网地图[CAD为底图]--
        
        // leaflet 官网地址 https://leafletjs.com/
        // leaflet 源码地址 https://github.com/Leaflet/Leaflet
        if (typeof L !== "object") {
            // 如果没有leaflet环境
            await vjmap.addScript([{
                src: "../../js/leaflet2.0/leaflet.js"
            },{
                src: "../../js/leaflet2.0/leaflet.css"
            }]);
        }
        
        // 地图服务对象，调用唯杰地图服务打开地图，获取地图的元数据
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let mapId = "sys_cad2000";
        let res = await svc.openMap({
            mapid: mapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapBounds);
        let center = mapBounds.center();
        
        // 建立一个基于CAD图范围的坐标系
        let CadCRS = L.Class.extend({
            includes: L.CRS.Simple,
            initialize: function (bounds) {
                // 当前CAD图的范围
                this.bounds = bounds;
                // 投影
                this.projection = L.Projection.LonLat;
                // 计算分辨率
                let r = (256 / Math.abs(this.bounds.getEast() - this.bounds.getWest()));
                // 设置转换参数 一个仿射变换:一组系数a, b, c, d，用于将一个形式为(x, y)的点变换为 (ax + b, cy + d)并做相反的变换
                this.transformation = new L.Transformation(r, -r * this.bounds.getWest(),  - r,  r * this.bounds.getNorth());
            }
        });
        
        // leaflet中坐标是反的，如果要用L.latLng传入坐标的时候要传[y,x]，如果要传[x,y]，官网建议如下方案
        // https://leafletjs.com/examples/crs-simple/crs-simple.html
        L.XY = function(x, y) {
            if (L.Util.isArray(x)) {    // When doing XY([x, y]);
                return L.latLng(x[1], x[0]);
            }
            return L.latLng(y, x);  // When doing XY(x, y);
        };
        
        // 当前CAD地图范围
        let bounds = new L.LatLngBounds([L.XY(mapBounds.min.toArray()), L.XY(mapBounds.max.toArray())]);
        
        // 创建leaflet的地图对象
        let map = L.map('map', {
            // 坐标系
            crs: new CadCRS(bounds),
            attributionControl: false
        }).setView(L.XY([center.x, center.y]), 2); // 设置初始中心点和缩放级别
        // 如果要用L.latLng设置的话，x,y应写反进行设置。如
        // map.setView(L.latLng([center.y, center.x]), 2);
        
        // 增加一个栅格瓦片图层
        let layer = L.tileLayer(
            svc.rasterTileUrl(),  // 唯杰地图服务提供的cad的栅格瓦片服务地址
            {
                bounds: bounds // 当前CAD地图范围
            }
        ).addTo(map);
        // 把图层增加至地图中
        layer.addTo(map);
        
        document.getElementById("map").style.background = "#ffffff00"; // 把地图背景色设置为透明，用document之前设置的背景色
        map.on('click', (e) => message.info({content: `您点击的坐标为： ${e.latlng.lng}, ${e.latlng.lat}}`, key: "info", duration: 3}));
        
        
        // 增加高德地图底图
        let gdlayer;
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
                srs: "EPSG:4527",// 可通过前两位获取 vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
                // 因为sys_cad2000这个图只有6位，没有带系。需要在坐标转换前平移下带系  https://blog.csdn.net/thinkpang/article/details/124172626
                fourParameterBefore: "39000000,0,1,0"
            })
        
            gdlayer = L.tileLayer(
                tileUrl,
                {
                    zIndex: 0
                }
            );
            gdlayer.addTo(map);
        
        
            // cad坐标与高德坐标相互转换示例
            let webCo = await cad2webCoordinate(center, false); // cad转高德
            let cadCo = await web2cadCoordinate(webCo, false); // 高德转cad
            console.log(center, webCo, cadCo)
        }
        
        // 增加天地图图底图
        let tdtlayer;
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
                srs: "EPSG:4527", // 可通过前两位获取 vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
                // 因为sys_cad2000这个图只有6位，没有带系。需要在坐标转换前平移下带系  https://blog.csdn.net/thinkpang/article/details/124172626
                fourParameterBefore: "39000000,0,1,0"
            })
        
            // 增加一个瓦片图层
            tdtlayer = L.tileLayer(
                tileUrl,
                {
                    zIndex: 0
                }
            );
            tdtlayer.addTo(map);
        
            // cad坐标与天地图坐标相互转换示例
            let webCo = await cad2webCoordinate(center, true); // cad转天地图
            let cadCo = await web2cadCoordinate(webCo, true); // 天地图转cad
            console.log(center, webCo, cadCo)
        }
        
        
        
        const removeMapLayer = ()=> {
            if (gdlayer) {
                map.removeLayer(gdlayer);
            }
            if (tdtlayer) {
                map.removeLayer(tdtlayer);
            }
        }
        
        // cad转web坐标，isWgs84是否为wgs84 4326坐标，如天地图；否的话为gcj02火星坐标,如高德地图
        const cad2webCoordinate = async (pt, isWgs84) => {
            let srs = "EPSG:4527"; // 可通过前两位获取 vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
            // 因为sys_cad2000这个图只有6位，没有带系。需要在坐标转换前平移下带系  https://blog.csdn.net/thinkpang/article/details/124172626
            let fourParameter = "39000000,0,1,0".split(",");
            // 思路为先通过四参数，把cad还原成4527坐标，再通过坐标转换把4527转成wgs84 4326坐标，如果为火星坐标，还需要从4326转火星
            // 把cad还原成4527坐标 这里就只要把x平移39000000就可以了
            //pt.x += 39000000;
            pt = vjmap.coordTransfromByFourParamter(pt, {
                dx: +fourParameter[0],
                dy: +fourParameter[1],
                scale: +fourParameter[2],
                rotate: +fourParameter[3]
            })
            // 通过坐标转换把4527转成wgs84 4326坐标
            let res = await svc.cmdTransform("EPSG:4527","EPSG:4326",pt); // 如果不想调服务转，也可以在前端用proj4库
            // 如果为火星坐标，还需要从4326转火星
            let webPt = res[0];// 返回的第1条结果
            if (isWgs84 === false) {
                webPt = vjmap.transform.convert(webPt, vjmap.transform.CRSTypes.EPSG4326, vjmap.transform.CRSTypes.AMap)
            }
            return webPt;
        }
        
        // web转cad坐标，isWgs84是否为wgs84 4326坐标，如天地图；否的话为gcj02火星坐标,如高德地图
        const web2cadCoordinate = async (pt, isWgs84) => {
            let srs = "EPSG:4527"; // 可通过前两位获取 vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, 39).epsg
            // 因为sys_cad2000这个图只有6位，没有带系。需要在坐标转换前平移下带系  https://blog.csdn.net/thinkpang/article/details/124172626
            let fourParameter = "39000000,0,1,0".split(",");
            // (上面计算过程的逆过程), 如果为火星坐标，还需要从火星转4326，再通过坐标转换把wgs84 4326转成4527坐标, 4527坐标先通过四参数，得到cad坐标
            if (isWgs84 === false) {
                pt = vjmap.transform.convert(pt, vjmap.transform.CRSTypes.AMap, vjmap.transform.CRSTypes.EPSG4326);
            }
            // 通过坐标转换把4527转成wgs84 4326坐标
            let res = await svc.cmdTransform("EPSG:4326","EPSG:4527",vjmap.geoPoint(pt)); // 如果不想调服务转，也可以在前端用proj4库
            let cadPt = res[0];// 返回的第1条结果
            // 把4527坐标还原成cad 这里就只要把x减去39000000就可以了
            //pt.x -= 39000000;
            // 四参数反算
            cadPt = vjmap.coordTransfromByInvFourParamter(vjmap.geoPoint(cadPt), {
                dx: +fourParameter[0],
                dy: +fourParameter[1],
                scale: +fourParameter[2],
                rotate: +fourParameter[3]
            })
            return cadPt
        }
        
        
        
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