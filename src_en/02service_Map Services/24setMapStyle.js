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
        // --Custom map style--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid:"sys_zp", // Map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let prj = new vjmap.GeoProjection(res.bounds);
        
        let map = new vjmap.Map({
            container: 'map', // Container ID
            style: svc.rasterStyle(), // Raster style
            center: prj.toLngLat(prj.getMapExtent().center()), // Center
            zoom: 2,
            renderWorldCopies: false
        });
        
        map.attach(svc, prj);
        map.fitMapBounds();
        
        // styleFunction: style expression; isDarkMode: dark mode
        function changeMapStyle(styleFunction, isDarkMode) {
            if (!!isDarkMode && isDarkMode !== "false") {
                document.body.style.background = "#022B4F"
            } else {
                document.body.style.background = "#FFFFFF"
                document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 0.5), rgba(233,255,255, .5), rgba(233,255,255, .7))"
            }
            const style = {
                layeron: "", // All layers on
                clipbounds: "", // Default bounds
                backcolor: isDarkMode ? 0 : 4278332239, // Black 0, white 4278332239
                expression: styleFunction ? `var color := ${styleFunction};gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);` : ""
            };
            let content = JSON.stringify(style);
            style.name = svc.strMd5(content); // Unique style name from content
            map.updateStyle(svc, style);
        }
        
        const { useState, useEffect } = React;
        const { Radio, Space } = antd;
        const App = () => {
            const [value, setValue] = useState(";true");
            const onChange = (v) => {
                let val = v.target.value
                setValue(val)
                changeMapStyle(...val.split(";")); // Params separated by ;
            }
        
            useEffect(() => {
                map.on('load', () => {
                    changeMapStyle("", true);
                });
            }, []);
            let style ={"min-width":"65px", opacity: 0.6}
            return (
                <Radio.Group className="input-card"  onChange={onChange} value={value} style={style}>
                    <Space  size={[8, 16]} wrap>
                        <Radio value={";true"}>Dark background</Radio>
                        <Radio value={"gFilterRedTheme(gInColorRed, gInColorGreen, gInColorBlue);false"}>Red theme</Radio>
                        <Radio value={"gFilterGreenTheme(gInColorRed, gInColorGreen, gInColorBlue);true"}>Green theme</Radio>
                        <Radio value={"gFilterBlueTheme(gInColorRed, gInColorGreen, gInColorBlue);true"}>Blue theme</Radio>
                        <Radio value={"gFilterBrown(gInColorRed, gInColorGreen, gInColorBlue);true"}>Brown filter</Radio>
                        <Radio value={"gFilterComic(gInColorRed, gInColorGreen, gInColorBlue);false"}>Comic filter</Radio>
                        <Radio value={"gFilterFrozen(gInColorRed, gInColorGreen, gInColorBlue);true"}>Frozen filter</Radio>
                        <Radio value={"gFilterFusion(gInColorRed, gInColorGreen, gInColorBlue);true"}>Fusion filter</Radio>
                        <Radio value={"gFilterOld(gInColorRed, gInColorGreen, gInColorBlue);true"}>Old/retro filter</Radio>
                        <Radio value={"gFilterRemoveBlue(gInColorRed, gInColorGreen, gInColorBlue);true"}>Remove blue</Radio>
                        <Radio value={"gFilterRemoveRed(gInColorRed, gInColorGreen, gInColorBlue);true"}>Remove red</Radio>
                        <Radio value={"gFilterRemoveGreen(gInColorRed, gInColorGreen, gInColorBlue);false"}>Remove green</Radio>
                        <Radio value={"gFilterGreen(gInColorRed, gInColorGreen, gInColorBlue);true"}>Green monochrome</Radio>
                        <Radio value={"gFilterRed(gInColorRed, gInColorGreen, gInColorBlue);true"}>Red monochrome</Radio>
                        <Radio value={"gFilterBlue(gInColorRed, gInColorGreen, gInColorBlue);true"}>Blue monochrome</Radio>
                        <Radio value={"gFilterMaxAvg(gInColorRed, gInColorGreen, gInColorBlue);true"}>Desaturate</Radio>
                        <Radio value={"gFilterOpposite(gInColorRed, gInColorGreen, gInColorBlue);true"}>Invert</Radio>
                        <Radio value={"gFilterBlackWhite(gInColorRed, gInColorGreen, gInColorBlue);true"}>Black & white</Radio>
                        <Radio value={"gFilterWeight(gInColorRed, gInColorGreen, gInColorBlue);true"}>Grayscale (weighted)</Radio>
                        <Radio value={"gFilterGreyMin(gInColorRed, gInColorGreen, gInColorBlue);true"}>Grayscale (min)</Radio>
                        <Radio value={"gFilterGreyMax(gInColorRed, gInColorGreen, gInColorBlue);true"}>Grayscale (max)</Radio>
                        <Radio value={"gFilterGrey(gInColorRed, gInColorGreen, gInColorBlue);true"}>Grayscale (avg)</Radio>
                        <Radio value={"gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);true"}>Custom filter 1</Radio>
                        <Radio value={"gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 0.2, 200, 180);true"}>Custom filter 2</Radio>
                        <Radio value={"gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 0.1, 180);true"}>Custom filter 3</Radio>
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