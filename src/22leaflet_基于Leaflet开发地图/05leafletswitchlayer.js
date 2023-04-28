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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/05leafletswitchlayer
        // --切换CAD图层--
        
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
        let mapId = "sys_zp";
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
        // 获取所有图层
        const cadLayers = svc.getMapLayers();
        
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
        let center = mapBounds.center(); // 地图中心点
        
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
        
        
        const { Select } = antd;
        const { Option } = Select;
        const children = [];
        for (let i = 0; i < cadLayers.length; i++) {
            children.push(<Option key={cadLayers[i].name}>{cadLayers[i].name}</Option>);
        }
        // 图层选择改变
        let tmId;
        const handleChange = (value) => {
            if (tmId) clearTimeout(tmId);
            tmId = setTimeout(() => {
                // 提高性能，防止选择时多次切换图层
                switchLayer(value)
            }, 2000)
        };
        
        // 切换图层
        const switchLayer = async layers => {
            let res = await svc.cmdSwitchLayers(layers); // 调用唯杰服务切换图层，返回图层id {layerid： "xxxx"}
            layer.setUrl(svc.rasterTileUrl());  // 唯杰地图服务提供的cad的栅格瓦片服务地址
        }
        // 初始图层状态
        let defaultLayerStatus = cadLayers.filter(ly => !ly.isOff).map(n => n.name);
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "500px", right: "10px"}}>
                        <div className="input-item">
                            <Select
                                mode="multiple"
                                allowClear
                                style={{ width: '100%' }}
                                placeholder="Please select"
                                defaultValue={defaultLayerStatus}
                                onChange={handleChange}
                            >
                                {children}
                            </Select>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App/>, document.getElementById('ui'));
        
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