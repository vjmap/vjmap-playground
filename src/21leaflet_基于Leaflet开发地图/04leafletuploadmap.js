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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/leaflet/04leafletuploadmap
        // --上传打开CAD的DWG图形--使用leaflet来打开上传的CAD的DWG图形-
        
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
        // leaflet中坐标是反的，如果要用L.latLng传入坐标的时候要传[y,x]，如果要传[x,y]，官网建议如下方案
        // https://leafletjs.com/examples/crs-simple/crs-simple.html
        L.XY = function(x, y) {
            if (L.Util.isArray(x)) {    // When doing XY([x, y]);
                return L.latLng(x[1], x[0]);
            }
            return L.latLng(y, x);  // When doing XY(x, y);
        };
        
        // 地图服务对象，调用唯杰地图服务打开地图，获取地图的元数据
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        // 上传dwg文件
        const uploadDwgFile = async file => {
            message.info("正在上传图形，请稍候", 2);
            let res = await svc.uploadMap(file); // 上传地图
            // 输入图id
            let mapid = prompt("请输入图名称ID", res.mapid);
            res.mapid = mapid;
            res.mapopenway = vjmap.MapOpenWay.GeomRender; // 几何渲染，内存渲染用vjmap.MapOpenWay.Memory
            res.isVector = false; // 使用栅格瓦片
            res.style = vjmap.openMapDarkStyle(); // 深色样式，浅色用openMapDarkStyle
            message.info("正在打开图形，请稍候，第一次打开时根据图的大小可能需要几十秒至几分钟不等", 5);
            let data = await svc.openMap(res); // 打开地图
            if (data.error) {
                message.error(data.error)
                return;
            }
            openMap(data);
        }
        
        // 打开地图
        let map;
        const openMap = res => {
            // 获取地图范围
            let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
            let mapPrj = new vjmap.GeoProjection(mapBounds);
        
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
                    this.transformation = new L.Transformation(r, -r * this.bounds.getWest(), -r, r * this.bounds.getNorth());
                }
            });
        
        
            // 当前CAD地图范围
            let bounds = new L.LatLngBounds([L.XY(mapBounds.min.toArray()), L.XY(mapBounds.max.toArray())]);
            let center = mapBounds.center(); // 地图中心点
        
            // 创建leaflet的地图对象
            map = L.map(createNewMapDivId(), {
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
        
            map.on('click', (e) => message.info({content: `您点击的坐标为： ${e.latlng.lng}, ${e.latlng.lat}}`, key: "info", duration: 3}));
        }
        
        const createNewMapDivId = ()=> {
            // 先清空之前的
            let parentDiv = document.getElementById("map");
            parentDiv.innerHTML = "";
            let newMapDiv = document.createElement("div");
            newMapDiv.id = vjmap.RandomID(6);
            newMapDiv.style.position = 'absolute';
            newMapDiv.style.width = "100%";
            newMapDiv.style.height = "100%";
            newMapDiv.style.background = "#ffffff00"; // 把地图背景色设置为透明，用document之前设置的背景色
            parentDiv.appendChild(newMapDiv);
            return newMapDiv.id;
        }
        
        
        const { Upload } = antd;
        const  { useState } = React;
        // UI界面
        const App = () => {
            const props = {
                onChange: ({file}) => {
                    uploadDwgFile(file);
                },
                beforeUpload: (file) => {
                    // 设置为false，表示手动上传
                    return false;
                }
            };
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <Upload {...props}>
                                <button >点击上传打开DWG文件</button>
                            </Upload>
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