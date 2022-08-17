const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/map/eventMapZoom
        // --地图缩放相关事件--
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
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info">
                        <h4 id="text">地图缩放相关事件</h4>
                        <p>当前级别：<span id="map-zoom"></span></p>
                        <p>地图缩放事件：<span id="el">未绑定</span></p>
                    </div>
                    <div className="input-card">
                        <h4>地图缩放事件</h4>
                        <div>
                            <div className="input-item">
                                <button id="zoomOn" className="btn">绑定事件</button>
                                <button id="zoomOff" className="btn">解绑事件</button>
                            </div>
                        </div>
                    </div>
                    <div id="tip"></div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        // 事件
        let mapZoomDom = document.querySelector("#map-zoom");
        let el = document.querySelector("#el");
        let logMapinfo = function (){
            var zoom = map.getZoom(); //获取当前地图级别
            mapZoomDom.innerText = Math.floor(zoom);
        };
        map.on("load",function(){
            logMapinfo();
            map.on('zoomend', logMapinfo);
        })
        function mapZoomstart(){
            el.innerText = '缩放开始';
        }
        function mapZoom(){
            el.innerText = '正在缩放';
            //logMapinfo();
        }
        function mapZoomend(){
            el.innerText = '缩放结束';
            logMapinfo();
        }
        
        // 事件绑定
        function zoomOn(e){
            let el = e.target;
            removeClass("btn");
            el.classList.add("btn-active");
            message.info("绑定成功!");
            map.on('zoomstart', mapZoomstart);
            //map.on('zoom', mapZoom);
            map.on('zoomend', mapZoomend);
        }
        // 解绑事件
        function zoomOff(){
            removeClass("btn");
            message.info("解绑成功!");
            map.off('zoomstart', mapZoomstart);
            //map.off('zoom', mapZoom);
            map.off('zoomend', mapZoomend);
            logMapinfo();
            el.innerText = "未绑定";
        }
        
        function removeClass(el){
            let els = document.getElementsByClassName(el);
            for (let i = 0; i < els.length; i++) {
                els[i].classList.remove("btn-active");
            }
        }
        // 给按钮绑定事件
        document.getElementById("zoomOn").onclick = zoomOn;
        document.getElementById("zoomOff").onclick = zoomOff;
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