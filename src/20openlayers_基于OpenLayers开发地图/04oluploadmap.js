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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/04oluploadmap
        // --上传打开CAD的DWG图形--使用openlayer来打开上传的CAD的DWG图形-
        
        // openlayers 官网地址 https://openlayers.org/
        // openlayers 源码地址 https://github.com/openlayers/openlayers
        if (typeof ol !== "object") {
            // 如果没有openlayer环境
            await vjmap.addScript([{
                src: "../../js/ol7.1.0/ol.js"
            },{
                src: "../../js/ol7.1.0/ol.css"
            }]);
        }
        
        
        // 创建openlayer的地图对象
        let map = new ol.Map({
            target: 'map', // div的id
            view: new ol.View({
                center: [0, 0],  // 地图中心点
                zoom: 2 // 初始缩放级别
            })
        });
        
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
        
        let layer;
        const openMap = res => {
            // 获取地图范围
            let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
            // 自定义投影参数
            let cadProjection = new ol.proj.Projection({
                // extent用于确定缩放级别
                extent: mapBounds.toArray(),
                units: 'm'
            });
            // 设置每级的分辨率
            let resolutions= [];
            for(let i = 0; i < 25; i++) {
                resolutions.push(mapBounds.width() / (512 * Math.pow(2, i - 1)))
            }
            // 增加自定义的cad的坐标系
            ol.proj.addProjection(cadProjection);
        
            if (layer) map.removeLayer(layer); // 移除之前的图层，也可以重新 new ol.Map
        
            let view = new ol.View({
                center: mapBounds.center().toArray(),  // 地图中心点
                projection: cadProjection, // 刚自定义的cad的坐标系
                resolutions:resolutions, // 分辨率
                zoom: 2// 初始缩放级别
            });
            map.setView(view);
        
            // 增加一个瓦片图层
            layer = new ol.layer.Tile({
                // 增加一个瓦片数据源
                source: new ol.source.TileImage({
                    url: svc.rasterTileUrl() // 唯杰地图服务提供的cad的栅格瓦片服务地址
                })
            });
            // 在地图中增加上面的瓦片图层
            map.addLayer(layer);
        }
        map.on('click', (e) => console.log(message.info(`您点击的坐标为： ${JSON.stringify(e.coordinate)}`)));
        
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