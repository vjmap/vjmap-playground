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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/24setMapStyle
        // --个性化地图样式--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid:"sys_zp", // 地图ID
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
        // 适应至地图范围大小
        map.fitMapBounds();
        
        // 修改地图风格 styleFunctionName 样式函数， isDarkMode 深色模式
        function changeMapStyle(styleFunction, isDarkMode) {
            if (!!isDarkMode && isDarkMode !== "false") {
                // 深色模式
                document.body.style.background = "#022B4F"
            } else {
                // 浅色模式
                document.body.style.background = "#FFFFFF"
                document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 0.5), rgba(233,255,255, .5), rgba(233,255,255, .7))"
            }
            const style = {
                layeron: "", // 所有图层都开
                clipbounds: "", // 默认范围
                backcolor: isDarkMode ? 0 : 4278332239, // 黑色0,白色4278332239
                expression: styleFunction ? `var color := ${styleFunction};gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);` : ""
            };
            let content = JSON.stringify(style);
            style.name = svc.strMd5(content); // 根据设置的内容生成唯一的样式名称
            map.updateStyle(svc, style);// 更新地图新式
        }
        
        const { useState, useEffect } = React;
        const { Radio, Space } = antd;
        // UI界面
        const App = () => {
            const [value, setValue] = useState(";true");
            const onChange = (v) => {
                let val = v.target.value
                setValue(val)
                changeMapStyle(...val.split(";")); // 以;为参数分隔传入参数
            }
        
            useEffect(() => {
                // 只初始化执行
                map.on('load', () => {
                    // 不使用函数表达式改变地图颜色，只改变地图背景
                    changeMapStyle("", true);
                });
            }, []);
            let style ={"min-width":"65px", opacity: 0.6}
            return (
                <Radio.Group className="input-card"  onChange={onChange} value={value} style={style}>
                    <Space  size={[8, 16]} wrap>
                        <Radio value={";true"}>深色背景</Radio>
                        <Radio value={"gFilterRedTheme(gInColorRed, gInColorGreen, gInColorBlue);false"}>红色主题</Radio>
                        <Radio value={"gFilterGreenTheme(gInColorRed, gInColorGreen, gInColorBlue);true"}>绿色主题</Radio>
                        <Radio value={"gFilterBlueTheme(gInColorRed, gInColorGreen, gInColorBlue);true"}>蓝色主题</Radio>
                        <Radio value={"gFilterBrown(gInColorRed, gInColorGreen, gInColorBlue);true"}>褐色滤镜</Radio>
                        <Radio value={"gFilterComic(gInColorRed, gInColorGreen, gInColorBlue);false"}>连环画滤镜</Radio>
                        <Radio value={"gFilterFrozen(gInColorRed, gInColorGreen, gInColorBlue);true"}>冰冻滤镜</Radio>
                        <Radio value={"gFilterFusion(gInColorRed, gInColorGreen, gInColorBlue);true"}>熔铸滤镜</Radio>
                        <Radio value={"gFilterOld(gInColorRed, gInColorGreen, gInColorBlue);true"}>怀旧滤镜</Radio>
                        <Radio value={"gFilterRemoveBlue(gInColorRed, gInColorGreen, gInColorBlue);true"}>滤镜去掉蓝色</Radio>
                        <Radio value={"gFilterRemoveRed(gInColorRed, gInColorGreen, gInColorBlue);true"}>滤镜去掉红色</Radio>
                        <Radio value={"gFilterRemoveGreen(gInColorRed, gInColorGreen, gInColorBlue);false"}>滤镜去掉绿色</Radio>
                        <Radio value={"gFilterGreen(gInColorRed, gInColorGreen, gInColorBlue);true"}>绿色单色滤镜</Radio>
                        <Radio value={"gFilterRed(gInColorRed, gInColorGreen, gInColorBlue);true"}>红色单色滤镜</Radio>
                        <Radio value={"gFilterBlue(gInColorRed, gInColorGreen, gInColorBlue);true"}>蓝色单色滤镜</Radio>
                        <Radio value={"gFilterMaxAvg(gInColorRed, gInColorGreen, gInColorBlue);true"}>去色滤镜</Radio>
                        <Radio value={"gFilterOpposite(gInColorRed, gInColorGreen, gInColorBlue);true"}>反向滤镜</Radio>
                        <Radio value={"gFilterBlackWhite(gInColorRed, gInColorGreen, gInColorBlue);true"}>黑白滤镜</Radio>
                        <Radio value={"gFilterWeight(gInColorRed, gInColorGreen, gInColorBlue);true"}>灰度滤镜(加权)</Radio>
                        <Radio value={"gFilterGreyMin(gInColorRed, gInColorGreen, gInColorBlue);true"}>灰度滤镜(最小)</Radio>
                        <Radio value={"gFilterGreyMax(gInColorRed, gInColorGreen, gInColorBlue);true"}>灰度滤镜(最大)</Radio>
                        <Radio value={"gFilterGrey(gInColorRed, gInColorGreen, gInColorBlue);true"}>灰度滤镜(平均)</Radio>
                        <Radio value={"gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);true"}>自定义滤镜一</Radio>
                        <Radio value={"gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 0.2, 200, 180);true"}>自定义滤镜二</Radio>
                        <Radio value={"gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 0.1, 180);true"}>自定义滤镜三</Radio>
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