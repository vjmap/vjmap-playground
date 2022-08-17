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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/map/eventMapClick
        // --地图点击和鼠标事件--
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
                        <h4>请用鼠标在地图上操作试试</h4>
                        <p><span id="text">未绑定</span></p>
                    </div>
                    <div className="input-card">
                        <h4>地图点击相关事件</h4>
                        <div>
                            <div className="input-item">
                                <button id="clickOn" className="btn">绑定事件</button>
                                <button id="clickOff" className="btn">解绑事件</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        // 事件
        function showInfoClick(e){
            let pt = map.fromLngLat(e.lngLat); // 转化成地图几何坐标
            let text = '您在 [ '+pt.x+','+pt.y+' ] 的位置单击了地图！'
            document.querySelector("#text").innerText = text;
        }
        function showInfoDbClick(e){
            let pt = map.fromLngLat(e.lngLat); // 转化成地图几何坐标
            let text = '您在 [ '+pt.x+','+pt.y+' ] 的位置双击了地图！'
            document.querySelector("#text").innerText = text;
        }
        function showInfoMove(){
            let text = '您移动了您的鼠标！'
            document.querySelector("#text").innerText = text;
        }
        // 事件绑定
        function clickOn(e){
            let el = e.target;
            removeClass("btn");
            el.classList.add("btn-active");
            message.info("绑定事件!");
            document.querySelector("#text").innerText = "已绑定";
            map.on('click', showInfoClick);
            map.on('dblclick', showInfoDbClick);
            map.on('mousemove', showInfoMove);
        }
        // 解绑事件
        function clickOff(){
            removeClass("btn");
            message.info("解除事件绑定!");
            document.querySelector("#text").innerText = "未绑定";
            map.off('click', showInfoClick);
            map.off('dblclick', showInfoDbClick);
            map.off('mousemove', showInfoMove);
        }
        
        function removeClass(el){
            let els = document.getElementsByClassName(el);
            for (let i = 0; i < els.length; i++) {
                els[i].classList.remove("btn-active");
            }
        }
        
        // 给按钮绑定事件
        document.getElementById("clickOn").onclick = clickOn;
        document.getElementById("clickOff").onclick = clickOff;
        
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