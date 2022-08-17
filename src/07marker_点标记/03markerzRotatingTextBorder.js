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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/03markerzRotatingTextBorder
        // --旋转的文本框--
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
        
        // 导航条控件
        map.addControl(new vjmap.NavigationControl());
        // 鼠标移动显示坐标位置控件
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        const mapBounds = map.getGeoBounds(0.6);
        
        // 创建一个缺省的
        let markerEle = new vjmap.RotatingTextBorderMarker({
            lngLat: map.toLngLat(mapBounds.randomPoint()),
            text: "唯杰地图"
        }, {})
        let marker = markerEle.createMarker({
            // 设置Marker的属性，如可拖放
            draggable: true
        });
        marker.addTo(map)
        
        for(let i = 1; i < 20; i++) {
            // 再随机生成不同样式的
            let _marker = new vjmap.RotatingTextBorderMarker({
                lngLat: map.toLngLat(mapBounds.randomPoint()),
                text: "文字" + i
            }, {
                // 可以给不同的属性，如宽度，颜色，字体
                //width: vjmap.randInt(40, 100),
                //height: vjmap.randInt(40, 100),
                colors: [vjmap.randomColor(), vjmap.randomColor()],
                //textFontSize: vjmap.randInt(14, 30),
                textColor: vjmap.randomColor()
            }).createMarker();
            _marker.addTo(map)
        }
        
        // 修改宽度
        const modifyWidth = ()=> {
            markerEle.setMarkersWidth(200);
            // 也可以通过 marker.elementObject.setMarkersWidth(200);
        }
        
        // 修改高度
        const modifyHeight = ()=> {
            markerEle.setMarkersHeight(100);
        }
        
        // 修改颜色
        const modifyColors = ()=> {
            markerEle.setMarkersColors(["rgb(255, 0, 0)", "rgb(255, 255, 0)"]);
        }
        
        // 修改文字颜色
        const modifyTextColor = ()=> {
            markerEle.setMarkersTextColor("rgb(255, 0, 0)");
        }
        
        // 修改文字大小
        const modifyTextFontSize = ()=> {
            markerEle.setMarkersTextFontSize(40);
        }
        
        // 修改文字内容
        const modifyTextContent = ()=> {
            markerEle.setMarkersText("唯杰地图vjmap");
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyWidth()}>修改宽度
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyHeight()}>修改高度
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyColors()}>修改图标颜色
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyTextColor()}>修改文字颜色
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyTextFontSize()}>修改文字大小
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyTextContent()}>修改文字内容
                            </button>
                        </div>
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