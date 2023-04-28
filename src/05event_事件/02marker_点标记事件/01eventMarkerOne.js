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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/event/marker/01eventMarkerOne
        // --点标记事件--
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
                        请点击覆盖物试试
                        <h4><span id="text">未绑定</span></h4>
                    </div>
                    <div className="input-card">
                        <h4>覆盖物点击事件</h4>
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
        let marker = null;
        map.on("load", addMarder);
        
        function addMarder() {
            marker && marker.remove();
            marker = new vjmap.Marker({
                draggable: true,    // 默认允许拖拽
            }).setLngLat(map.getCenter());
            marker.addTo(map);
        }
        function showInfoM() {
            let pt = map.fromLngLat(marker.getLngLat());
            let text = '您在 [ ' + pt.toString(2) + ' ] 的位置点击了覆盖物！'
            showLog(text);
        }
        
        function showInfoOver() {
            showLog("鼠标移入覆盖物！");
        }
        function showInfoOut() {
            showLog("鼠标移出覆盖物！");
        }
        function dragFun(){
            showLog("您拖拽了覆盖物！");
        }
        function startDragFun(){
            showLog("开始拖拽覆盖物...");
        }
        function endDragFun(){
            showLog("覆盖物拖拽结束！");
        }
        function dblclick() {
            showLog("双击了覆盖物");
        }
        function clickOn(e) {
            let el = e.target;
            marker.on('drag', dragFun);
            marker.on('dragstart', startDragFun);
            marker.on('dragend', endDragFun);
            marker.on('click', showInfoM);
            marker.on('mouseover', showInfoOver);
            marker.on('mouseleave', showInfoOut);
            marker.on('dblclick', dblclick);
            showLog("已绑定", "绑定事件!");
        }
        function clickOff(e) {
            marker.off('drag', dragFun);
            marker.off('dragstart', startDragFun);
            marker.off('dragend', endDragFun);
            marker.off('click', showInfoM);
            marker.off('mouseover', showInfoOver);
            marker.off('mouseleave', showInfoOut);
            marker.off('dblclick', dblclick);
            showLog("未绑定", "解除事件绑定!");
        }
        // 给按钮绑定事件
        document.getElementById("clickOn").onclick = clickOn;
        document.getElementById("clickOff").onclick = clickOff;
        
        function showLog(text, alertText) {
            document.querySelector("#text").innerText = text;
            removeClass("btn");
            alertText && message.info(alertText);
        }
        
        function removeClass(el){
            let els = document.getElementsByClassName(el);
            for (let i = 0; i < els.length; i++) {
                els[i].classList.remove("btn-active");
            }
        }
        
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