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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/23styleVectorlayer
        // --定义后台矢量瓦片样式--通过表达式来控制后台矢量瓦片样式
        // js代码
        document.body.style.background = "#022B4F"
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 先获取元数据
        let meta = await svc.metadata(env.exampleMapId);
        // 要关闭的图层列表索引
        let layeroff = svc.toLayerIndex(["尺寸线", "图例"], meta.layers);
        // 再打开图
        let res = await svc.openMap({
            mapid: sys_world,
            mapopenway: vjmap.MapOpenWay.GeomRender,
            style :{
                name: "style2",
                layeron: "",
                layeroff: layeroff,
                clipbounds: "",
                backcolor: 0,
                expression: "var color := gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);"
            }
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.vectorStyle(),
            center: prj.toLngLat(mapExtent.center()),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
        
        const { useState, useEffect } = React;
        const App = () => {
            const [info, setInfo] = useState("");
            useEffect(() => {
                // 能使地图高亮并且回调
                map.enableVectorLayerHoverHighlight((event, feature, layer) => {
                    let info = `event: ${event}; feature: ${feature.id}; layer: ${layer}`
                    setInfo(info)
                })
            }, []);
            return (
                <div>
                    {info &&
                    <div className="info" style={{opacity: 0.7}}>
                        <h4>{info}</h4>
                    </div>
                    }
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