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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/02markerSeveral
        // --多个点标记--
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
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 3, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 适应至地图范围大小
        map.fitMapBounds();
        
        let mapBounds = map.getGeoBounds(); // 得到地图地理范围
        for(let i = 0; i < 5; i++) {
            let point = mapBounds.randomPoint(); // 在地理范围里随机生成一个点
            // marker
            let marker = new vjmap.Marker({
                draggable: true,
                color: vjmap.randomColor()
            });
            marker.setLngLat(map.toLngLat(point))
            marker.addTo(map);
            // 设置自定义的扩展数据吧
            marker.extData = {
                id: i,
                name: `marker:${i}`
            }
        
            if (i === 2) {
                // 设置坠落动画
                setTimeout(() => {
                    marker.setAnimation("MAP_ANIMATION_DROP");
                }, 1000)
            }
        
            // 给marker增加点击事件
            marker.getElement().addEventListener('click', (e) => {
                message.info(`index:${marker.extData.id}; name: ${marker.extData.name}`)
            });
        }
        
        // 通过id获取marker
        function getMarkerById(id) {
            let markers = map.getMarkers() || [];
            let findMarker = markers.find(m => m.extData && m.extData.id === id)
            if (!findMarker) {
                message.info("该marker已经删除！");
            } else {
                // 弹跳
                findMarker.setAnimation("MAP_ANIMATION_BOUNCE");
            }
        }
        
        // 删除id
        function removeMarkerById(id) {
            let markers = map.getMarkers() || [];
            let findMarker = markers.find(m => m.extData && m.extData.id === id)
            if (!findMarker) {
                message.info("该marker已经删除！");
            } else {
                // 取消动画
                // findMarker.setAnimation("MAP_ANIMATION_NONE");
                findMarker.remove();
            }
        }
        const { useState } = React;
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>删除指定点标记</h4>
                    <div className="input-item">
                        <button className="btn btn-full mr0" onClick={()=>getMarkerById(2)}>获取ID为2的点标记</button>
                        <button className="btn btn-full mr0" onClick={()=>removeMarkerById(2)}>删除ID为2的点标记</button>
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