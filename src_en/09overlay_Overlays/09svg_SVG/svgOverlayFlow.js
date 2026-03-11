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
        // --SVG animation--
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID (ensure it exists; upload new drawing to create)
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        await map.onLoad();
        
        
        let mapBounds = map.getGeoBounds();
        let len = mapBounds.width() / 5;
        let svgOverlay = new vjmap.SvgOverlay({
            maxZoom: 15, // hidden above this zoom
            maxPitch: 60 // hidden when pitch over 60 degrees
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
            // Set class to svg_ani_flow for animation
            return ` <polyline id="polyline1" class="svg_ani_flow" ${vjmap.SvgOverlay.attr_points(points)} style="${getStyle(style)}"/>`
        }
        const addPolyline = ()=> svgOverlay.addElement(svgPolylineHtml(mapBounds.randomPoints(2, 5), {stroke: vjmap.randomColor(), fill: "none", "stroke-width": 10}))
        
        addPolyline();
        
        let pt = mapBounds.randomPoint();
        let textHeight = mapBounds.width() / 30;
        let textContent = 'vjmap';
        let textWidth = textHeight * textContent.length;
        let textBounds = mapBounds; // animation path is large, use full map bounds
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
            // Line animation: remove class to stop
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
            // Line animation: add class to start
            let poly = svgOverlay.getSvgContainer().getElementById("polyline1");
            if (poly) vjmap.Dom.addClass(poly, "svg_ani_flow")
        }
        
        const pauseAnimate = ()=> {
            svgOverlay.getSvgContainer().pauseAnimations();
            // Line animation: remove class to stop
            let poly = svgOverlay.getSvgContainer().getElementById("polyline1");
            if (poly) vjmap.Dom.removeClass(poly, "svg_ani_flow")
        }
        
        const unPauseAnimate = ()=> {
            svgOverlay.getSvgContainer().unpauseAnimations();
            // Line animation: add class to start
            let poly = svgOverlay.getSvgContainer().getElementById("polyline1");
            if (poly) vjmap.Dom.addClass(poly, "svg_ani_flow")
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={stopAnimate}>Stop animation
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={startAnimate}>Start animation
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={pauseAnimate}>Pause all
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={unPauseAnimate}>Resume all
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