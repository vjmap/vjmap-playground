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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/svg/svgOverlayFlow
        // --SVG动画--
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        await map.onLoad();
        
        
        let mapBounds = map.getGeoBounds();
        let len = mapBounds.width() / 5;
        let svgOverlay = new vjmap.SvgOverlay({
            maxZoom: 15, // 第5级时全部不显示了
            maxPitch: 60 // 倾角超过60度就不显示了
        });
        svgOverlay.addTo(map);
        
        const addCss = cssCode => {
            let style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = cssCode;
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        
        addCss(`
                    .svg_ani_flow {
                        stroke-dasharray:1000;
                        stroke-dashoffset:1000;
                        animation:ani_flow 10s linear infinite;
                        animation-fill-mode:forwards;
                        -webkit-animation:ani_flow 10s linear infinite;
                        -webkit-animation-fill-mode:forwards;
                    }
                    @keyframes ani_flow {
                        from {
                            stroke-dasharray:10,5;
                        }
                        to {
                            stroke-dasharray:13,5;
                        }
                    }
                `)
        
        const getStyle = (style = {}) => {
            return Object.keys(style).map(key => `${key}:${style[key]}`).join(";")
        }
        const svgPolylineHtml = (points, style) => {
            // 把类别设置为svg_ani_flow，就有动画效果了
            return ` <polyline id="polyline1" class="svg_ani_flow" ${vjmap.SvgOverlay.attr_points(points)} style="${getStyle(style)}"/>`
        }
        const addPolyline = ()=> svgOverlay.addElement(svgPolylineHtml(mapBounds.randomPoints(2, 5), {stroke: vjmap.randomColor(), fill: "none", "stroke-width": 10}))
        
        addPolyline();
        
        let pt = mapBounds.randomPoint();
        let textHeight = mapBounds.width() / 30;
        let textContent = '唯杰地图';
        let textWidth = textHeight * textContent.length;
        let textBounds = mapBounds; // 这里动画路径比较大，直接取图的最大范围吧
        svgOverlay.addElement({
            html: `
                        <g>
                            <text
                              ${vjmap.SvgOverlay.attr_x_y(pt.x, pt.y)}
                              font-family="microsoft yahei"
                              font-size="${vjmap.SvgOverlay.attr_length(textHeight)}"
                              stroke="${vjmap.randomColor()}"
                              stroke-width="2"
                              fill="${vjmap.randomColor()}"
                             >${textContent}</text>
                            <animateTransform
                              id = "animate1"
                              attributeName="transform"
                              begin="0s"
                              dur="10s"
                              type="rotate"
                              from="0 ${vjmap.SvgOverlay.attr_point(pt)}"
                              to="360 ${vjmap.SvgOverlay.attr_point(pt)}"
                              repeatCount="indefinite"
                            />
                        </g>
                    `,
            bounds: textBounds
        })
        
        
        let path = vjmap.SvgOverlay.attr_path(mapBounds.randomPoints(3,8))
        svgOverlay.addElement({
            html: `
                          <text
                              x="0" y="0"
                              font-family="microsoft yahei"
                              font-size="${vjmap.SvgOverlay.attr_length(textHeight)}"
                              stroke="${vjmap.randomColor()}"
                              stroke-width="2"
                              fill="${vjmap.randomColor()}"
                             >${textContent}
                                <animateMotion
                                  id = "animate2"
                                  begin="0s"
                                  dur="10s"
                                  path="${path}"
                                  rotate="auto"
                                  repeatCount="indefinite"
                                />
                            </text>
                            <path d="${path}" stroke="${vjmap.randomColor()}" stroke-width="6" fill="none" />
                    `,
            bounds: textBounds
        })
        
        const stopAnimate = ()=> {
            let aniIds = ["animate1", "animate2"];
            for(let id of aniIds) {
                let ele = svgOverlay.getSvgContainer().getElementById(id);
                if (!ele) continue;
                ele.endElement();
            }
            // 线条动画，只需把类名移除就可以了
            let poly = svgOverlay.getSvgContainer().getElementById("polyline1");
            if (poly) vjmap.Dom.removeClass(poly, "svg_ani_flow")
        }
        
        const startAnimate = ()=> {
            let aniIds = ["animate1", "animate2"];
            for(let id of aniIds) {
                let ele = svgOverlay.getSvgContainer().getElementById(id);
                if (!ele) continue;
                ele.beginElement();
            }
            // 线条动画，只需把类名加上就可以了
            let poly = svgOverlay.getSvgContainer().getElementById("polyline1");
            if (poly) vjmap.Dom.addClass(poly, "svg_ani_flow")
        }
        
        const pauseAnimate = ()=> {
            svgOverlay.getSvgContainer().pauseAnimations();
            // 线条动画，只需把类名移除就可以了
            let poly = svgOverlay.getSvgContainer().getElementById("polyline1");
            if (poly) vjmap.Dom.removeClass(poly, "svg_ani_flow")
        }
        
        const unPauseAnimate = ()=> {
            svgOverlay.getSvgContainer().unpauseAnimations();
            // 线条动画，只需把类名加上就可以了
            let poly = svgOverlay.getSvgContainer().getElementById("polyline1");
            if (poly) vjmap.Dom.addClass(poly, "svg_ani_flow")
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={stopAnimate}>停止动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={startAnimate}>开始动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={pauseAnimate}>暂停所有动画
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={unPauseAnimate}>重启所有动画
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