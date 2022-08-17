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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/svg/svgOverlay
        // --SVG覆盖物--
        // js代码
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
        let mapBounds2 = map.getGeoBounds(0.1);
        let len = mapBounds.width() / 10;
        let svgOverlay = new vjmap.SvgOverlay();
        svgOverlay.addTo(map);
        
        const getStyle = (style = {}) => {
            return Object.keys(style).map(key => `${key}:${style[key]}`).join(";")
        }
        const svgRectHtml = (point, width, height, style) => {
            return ` <rect  ${vjmap.SvgOverlay.attr_x_y_w_h(point.x, point.y, width, height)} style="${getStyle(style)}"/>`
        }
        const svgCircleHtml = (point, r, style) => {
            return ` <circle  ${vjmap.SvgOverlay.attr_cx_cy_r(point.x, point.y, r)} style="${getStyle(style)}"/>`
        }
        const svgEllipseHtml = (point, rx, ry, style) => {
            return ` <ellipse  ${vjmap.SvgOverlay.attr_cx_cy_rx_ry(point.x, point.y, rx, ry)} style="${getStyle(style)}"/>`
        }
        const svgPolygonHtml = (points, style) => {
            return ` <polygon  ${vjmap.SvgOverlay.attr_points(points)} style="${getStyle(style)}"/>`
        }
        
        const svgLineHtml = (point1, point2, style) => {
            return ` <line   ${vjmap.SvgOverlay.attr_x1_y1_x2_y2(point1.x, point1.y, point2.x, point2.y)} style="${getStyle(style)}"/>`
        }
        
        const svgPolylineHtml = (points, style) => {
            return ` <polyline   ${vjmap.SvgOverlay.attr_points(points)} style="${getStyle(style)}"/>`
        }
        
        const svgPathHtml = (point1, point2, point3, style) => {
            return ` <path  d="M ${vjmap.SvgOverlay.attr_point(point1)} Q ${vjmap.SvgOverlay.attr_point(point2)} ${vjmap.SvgOverlay.attr_point(point3)}" style="${getStyle(style)}"/>`
        }
        
        const svgTextHtml = (point, textContent, style) => {
            return `<text   ${vjmap.SvgOverlay.attr_x_y(point.x, point.y)}  style="${getStyle(style)}"">${textContent}</text>`
        }
        
        const addRect = (id)=> {
            if (id) {
                return svgOverlay.addElement({
                    html: svgRectHtml(mapBounds.randomPoint(), len, len / 2, {fill: vjmap.randomColor(), opacity: 0.7}),
                    id
                });
            } else {
                svgOverlay.addElement(svgRectHtml(mapBounds.randomPoint(), len, len / 2, {fill: vjmap.randomColor(), opacity: 0.7}));
            }
        }
        
        const addCircle = ()=> svgOverlay.addElement(svgCircleHtml(mapBounds.randomPoint(), len /2, {fill: vjmap.randomColor(), opacity: 0.7}))
        
        const addPolygon = ()=> svgOverlay.addElement(svgPolygonHtml(mapBounds.randomPoints(3, 3), {fill: vjmap.randomColor(), opacity: 0.7}))
        
        const addEllipse = ()=> svgOverlay.addElement(svgEllipseHtml(mapBounds.randomPoint(), len /2, len / 3, {fill: vjmap.randomColor(), opacity: 0.7}))
        
        const addLine = ()=> svgOverlay.addElement(svgLineHtml(mapBounds.randomPoint(), mapBounds.randomPoint(), {stroke: vjmap.randomColor(), "stroke-width": 2}))
        
        const addPolyline = ()=> svgOverlay.addElement(svgPolylineHtml(mapBounds.randomPoints(2, 5), {stroke: vjmap.randomColor(), fill: "none", "stroke-width": 2}))
        
        const addPath = ()=> {
            let p1 = mapBounds2.randomPoint();
            let p2 = mapBounds2.randomPoint();
            let p3 = mapBounds2.randomPoint();
            let bounds = vjmap.GeoBounds.fromDataExtent([p1, p2, p3])
            svgOverlay.addElement({
                html: svgPathHtml(p1, p2, p3, {stroke: vjmap.randomColor(), fill: "none", "stroke-width": 2}),
                bounds: bounds.scale(3) // 因为这个真实的是个弧线，可能是三个点的坐标范围大，需要手动传一个范围，不要很精确，比真实的大就可以，要不可能会裁剪掉
            })
        }
        const addText = ()=> {
            let pt = mapBounds.randomPoint();
            let textHeight = vjmap.randInt(mapBounds.width() / 30, mapBounds.width() / 20);
            let textContent = '唯杰地图vjmap';
            let textWidth = textHeight * textContent.length;
            let textBounds = vjmap.GeoBounds.fromArray([pt.x - textWidth, pt.y - textHeight, pt.x + textWidth, pt.y + textHeight]) //
            svgOverlay.addElement({
                html: svgTextHtml(pt, textContent, {stroke: vjmap.randomColor(), "stroke-width":"2", fill: vjmap.randomColor(),  "font-size" : vjmap.SvgOverlay.attr_length(textHeight)}),
                bounds: textBounds, // 文字比较特殊，需要手动传一个范围，不要很精确，比真实的大就可以，要不可能会裁剪掉
                minZoom: 1, // 每个都可以设置最小级别
                maxZoom: vjmap.randInt(3, 10) // 测试每个都可以设置最大级别
            })
        }
        
        const updateRect = id => {
            svgOverlay.updateElements({
                html: svgRectHtml(mapBounds.randomPoint(), len * 2, len, {fill: vjmap.randomColor(), stroke: vjmap.randomColor(), "stroke-width": 5, opacity: 0.7}),
                id
            })
        }
        
        const removeRect = id => {
            svgOverlay.removeElements(id);
        }
        
        const removeSvgOverlay = ()=> svgOverlay.remove()
        
        addRect("rect1");
        addCircle();
        addEllipse();
        addPolygon();
        addLine();
        addPolyline();
        addPath();
        addText();
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={addRect}>增加SVG矩形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={addCircle}>增加SVG圆
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={addEllipse}>增加SVG椭圆
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={addPolygon}>增加SVG多边形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={addLine}>增加SVG直线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={addPolyline}>增加SVG多段线
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={addPath}>增加SVG路径
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={addText}>增加SVG文本
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={()=>updateRect("rect1")}>更新矩形坐标
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={()=>removeRect("rect1")}>删除矩形
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={()=>removeSvgOverlay()}>移除SVG覆盖物
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