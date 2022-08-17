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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/10animationVectorLayer
        // --矢量瓦片动画图层--可以使矢量瓦片中的某个图层生成动画
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: 'sys_zp', // 地图ID
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
            style: svc.vectorStyle(), // 样式，这里是矢量样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        
        let styles = map.getStyle().layers;
        let lineLayerId = styles.filter(s => s.type === "line" && s['source-layer'] === 'lines')[0].id
        let antPathImages = vjmap.createAntPathAnimateImages({
            canvasWidth: 128,
            canvasHeight: 4,
            fillColor1: "#f0f",
            fillColor2: "#0ff"
        });
        let animLineLayer;
        const startLineAnimation = () => {
            if (animLineLayer) {
                // 存在了，则开始动画
                animLineLayer.startAnimation();
            } else {
                // 创建新的动画
                animLineLayer = vjmap.animateVectorLayer(map, lineLayerId, {
                    animateImages: antPathImages
                }, 0)
            }
        }
        startLineAnimation();
        
        const stopLineAnimation = () => {
            if (!animLineLayer) return
            animLineLayer.stopAnimation();
        }
        
        const removeLineAnimation = () => {
            if (!animLineLayer) return
            animLineLayer.remove();
            animLineLayer = null
        }
        
        let fillLayerId = styles.filter(s => s.type === "fill" && s['source-layer'] === 'polygons')[0].id
        
        let antPathFillImages = vjmap.createAntPathAnimateImages({
            canvasWidth: 4,
            canvasHeight: 4,
            fillColor1: "#f00",
            fillColor2: "#0f0"
        });
        let animFillLayer;
        const startFillAnimation = () => {
            if (animFillLayer) {
                // 存在了，则开始动画
                animFillLayer.startAnimation();
            } else {
                // 创建新的动画
                animFillLayer = vjmap.animateVectorLayer(map, fillLayerId, {
                    animateImages: antPathFillImages
                }, 1)
            }
        }
        startFillAnimation();
        
        const stopFillAnimation = () => {
            if (!animFillLayer) return
            animFillLayer.stopAnimation();
        }
        
        const removeFillAnimation = () => {
            if (!animFillLayer) return
            animFillLayer.remove();
            animFillLayer = null
        }
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>动画控制</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => startLineAnimation()}>开始线条流动动画</button>
                        <button className="btn" onClick={ () => stopLineAnimation() }>结束线条动画</button>
                        <button className="btn" onClick={ () => removeLineAnimation() }>移除线条动画</button>
                    </div>
        
                    <div className="input-item">
                        <button className="btn" onClick={ () => startFillAnimation()}>开始填充箭头动画</button>
                        <button className="btn" onClick={ () => stopFillAnimation() }>结束填充箭头动画</button>
                        <button className="btn" onClick={ () => removeFillAnimation() }>移除填充动画</button>
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