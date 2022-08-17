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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/setMapMouseStyle
        // --设置鼠标样式--
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
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        
        const { useState, useEffect } = React;
        const { Radio, Space } = antd;
        // UI界面
        const App = () => {
            const [value, setValue] = useState(2);
            const onChange = (v) => {
                let val = v.target.value
                setValue(val)
                switch (val) {
                    case 1:
                        map.getCanvas().style.cursor = "default";
                        break;
                    case 2:
                        map.getCanvas().style.cursor = "pointer";
                        break;
                    case 3:
                        map.getCanvas().style.cursor = "move";
                        break;
                    case 4:
                        map.getCanvas().style.cursor = "crosshair";
                        break;
                }
            }
        
            useEffect(() => {
                // 只初始化执行
                map.on('load', () => {
                    map.getCanvas().style.cursor = "pointer";
                });
            }, []);
            let style ={"min-width":"65px"}
            return (
                <Radio.Group className="input-card"  onChange={onChange} value={value} style={style}>
                    <Space direction="vertical">
                        <Radio value={1}>默认</Radio>
                        <Radio value={2}>手形</Radio>
                        <Radio value={3}>移动</Radio>
                        <Radio value={4}>十字</Radio>
                    </Space>
                </Radio.Group>
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