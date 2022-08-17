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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/layer/layerRasterImage
        // --栅格图像图层--
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
            zoom: 10, // 设置地图缩放级别
            pitch: 40, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.001);
        const coords = map.toLngLat(mapBounds.toPointArray());
        map.addImageSource("park", {
            url: env.assetsPath + "images/park.jpg",
            coordinates: coords
        })
        map.addRasterLayer("parkLayer", "park", {
            rasterOpacity: 0.8,
            minzoom: 7,
            maxzoom: 20
        })
        
        // 增加四个覆盖物用来调节位置
        const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
        const markers = []
        for(let c = 0; c <  colors.length; c++) {
            const marker = new vjmap.Marker({
                color: colors[c],
                draggable: true
            });
            marker.setLngLat(coords[c]).addTo(map);
            marker.on('drag', e => {
                updateBounds();
            });
            markers.push(marker);
        }
        
        
        const updateBounds = () => {
            // 更新位置
            map.getSource("park").setCoordinates(markers.map(m => {
                let lngLat = m.getLngLat();
                return [lngLat.lng,lngLat.lat]
            }));
        }
        
        const updateImage = (index) => {
            map.getSource("park").updateImage({
                url: env.assetsPath + `images/${index === 1 ? "bk.jpeg" : "park.jpg"}`,
            })
        }
        message.info("拖动四个点来调节图片位置");
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <div className="input-item">
                        <button className="btn" onClick={ () => updateImage(1) }>图片1</button>
                        <button className="btn" onClick={ () => updateImage(2) }>图片2</button>
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