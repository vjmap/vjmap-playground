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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/openlayers/07olswitchtheme
        // --深色浅色切换主题--
        
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
        // 地图服务对象，调用唯杰地图服务打开地图，获取地图的元数据
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let mapId = "sys_zp";
        let style = {
            backcolor: 0 // div为深色背景颜色时，这里也传深色背景样式
        }
        let res = await svc.openMap({
            mapid: mapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: style // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapBounds = vjmap.GeoBounds.fromString(res.bounds);
        
        //自定义投影参数
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
        
        // 创建openlayer的地图对象
        let map = new ol.Map({
            target: 'map', // div的id
            view: new ol.View({
                center: mapBounds.center().toArray(),  // 地图中心点
                projection: cadProjection, // 刚自定义的cad的坐标系
                resolutions:resolutions, // 分辨率
                zoom: 2// 初始缩放级别
            })
        });
        
        // 增加一个瓦片图层
        let layer = new ol.layer.Tile({
            // 增加一个瓦片数据源
            source: new ol.source.TileImage({
                url: svc.rasterTileUrl() // 唯杰地图服务提供的cad的栅格瓦片服务地址
            })
        });
        // 在地图中增加上面的瓦片图层
        map.addLayer(layer);
        
        map.on('click', (e) => message.info({content: `您点击的坐标为： ${JSON.stringify(e.coordinate)}`, key: "info", duration: 3}));
        
        
        let curIsDarkTheme = true;
        const switchToDarkTheme = async () => {
            if (curIsDarkTheme) return;
            curIsDarkTheme = true;
            document.body.style.background = "#022B4F"; // 背景色改为深色
            await updateStyle(curIsDarkTheme)
        }
        
        const switchToLightTheme = async () => {
            if (!curIsDarkTheme) return;
            curIsDarkTheme = false;
            document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
            await updateStyle(curIsDarkTheme)
        }
        
        const updateStyle = async (isDarkTheme) => {
            style.backcolor = isDarkTheme ? 0 : 0xFFFFFF;//深色为黑色，浅色为白色
            let res = await svc.cmdUpdateStyle(style);
            let source = layer.getSource();
            // 重新设置新的唯杰地图服务提供的cad的栅格瓦片服务地址
            source.setUrl(svc.rasterTileUrl());
            // 刷新
            source.refresh();
        }
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w160">
                        <h4>主题色：</h4>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToDarkTheme}>切换至深色主题</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={switchToLightTheme}>切换至浅色主题</button>
                        </div>
        
                    </div>
                </div>
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