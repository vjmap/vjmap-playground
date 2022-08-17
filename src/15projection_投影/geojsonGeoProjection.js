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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/projection/geojsonGeoProjection
        // --几何坐标投影--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await vjmap.httpHelper.get("./../../assets/data/china.json");
        let geo_china = res.data;
        let bounds = vjmap.GeoBounds.fromDataExtent(geo_china).square(true);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(bounds.scale(2.0));
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterBlankStyle(0, 24), // 样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 3, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 适应至地图范围大小
        map.fitMapBounds();
        
        map.on('load', function () {
            // Add a data source containing GeoJSON data.
            map.addSource('china', {
                'type': 'geojson',
                'data': map.toLngLat(geo_china)
            });
        
            // Add a new layer to visualize the polygon.
            map.addLayer({
                'id': 'fill_china',
                'type': 'fill',
                'source': 'china', // reference the data source
                'layout': {},
                'paint': {
                    'fill-color': '#5AB963',
                    'fill-opacity': 0.8
                }
            });
            // Add a black outline around the polygon.
            map.addLayer({
                'id': 'outline_china',
                'type': 'line',
                'source': 'china',
                'layout': {},
                'paint': {
                    'line-color': '#FFE9E9',
                    'line-width': 1
                }
            });
        
            map.addLayer({
                id: 'text_china',
                type: 'symbol',
                source: 'china',
                layout: {
                    'text-field': '{name}',
                    'text-font': ['simsun'],
                    'text-size': 12
                },
                "paint": {
                    "text-color": "#6B007B"
                }
            });
        
        });
        
        // UI界面
        const { useState, useEffect } = React
        const App = () => {
            const [geoPoint, setGeoPoint] = useState(); // 地理坐标
            const [pixelPoint, setPixelPoint] = useState(); // 像素坐标
        
            const showLngLat = (e) => {
                let geo = map.fromLngLat(e.lngLat);
                let pixel = e.point;
                setGeoPoint(geo.toString(6))
                setPixelPoint(e.point.x + ', ' + e.point.y);
            }
        
            useEffect(() => {
                // 只初始化执行
                // 响应地图移动完成后事件
                map.on('click', showLngLat);
                return ()=> {
                    // 退出时移除事件
                    map.off('click', showLngLat);
                }
            }, []);
            return (
                <div>
                    <div className="info w260">
                        <h4>点击获取地理坐标：</h4>
                        <div className="input-item">
                            <p>地理坐标：<span id="lnglat">{geoPoint}</span></p>
                        </div>
                        <div className="input-item">
                            <p>像素位置：<span id="lnglatpx">{pixelPoint}</span></p>
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