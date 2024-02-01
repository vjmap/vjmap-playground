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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/20maptag
        // --图纸批注--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle()
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
            center: prj.toLngLat(mapExtent.center()),
            zoom: 1,
            pitch: 0,
            antialias: true,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        if (typeof fabric !== "object") {
            // 如果没有fabric环境
            await vjmap.addScript({
                src: "../../js/fabric.min.js"
            });
        
        }
        
        const createDivSvg = (pt1, pt2, width, height, svg) => {
            svg = svg.substr(svg.indexOf("<desc>"));
            const div = document.createElement("div");
            div.innerHTML = `
                        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            ${svg}
                        </svg>
                    `;
            div.style.position = 'absolute';
            div.style.pointerEvents = "none"
            div.style.width = width + "px";
            div.style.height = height + "px";
            //div.style.opacity = '0.8';
        
            const divOverlay = new vjmap.DivOverlay({
                bounds: [[pt1.x, pt2.y], [pt1.x, pt1.y], [pt2.x, pt1.y], [pt2.x, pt2.y]],
                element: div,
                width: width,
                height: height,
                updateDivSize: true // 如果svg需要放大，需要加此参数
            })
            divOverlay.addTo(map);
        }
        
        
        const createDivCanvas = (pt1, pt2, canvas) => {
            let id = "canvasid_" + vjmap.randInt(1000, 10000);
            let lngLat1 = map.toLngLat(pt1);
            let lngLat2 = map.toLngLat(pt2);
            pt1.x = lngLat1[0];
            pt1.y = lngLat1[1];
            pt2.x = lngLat2[0];
            pt2.y = lngLat2[1];
            map.addSource(id + "_source", {
                type: 'canvas',
                canvas: canvas,
                coordinates: [[pt1.x, pt1.y], [pt2.x, pt1.y], [pt2.x, pt2.y], [pt1.x, pt2.y]]
            });
            map.addRasterLayer(id + +"_layer", id + "_source", {
                visibility: "visible"
            })
        }
        let drawCanvas;
        let fabricCanvas;
        let canvasCoord1, canvasCoord2;
        let canvasWidth, canvasHeight;
        let drawType;
        const beginFreeDraw = () => {
            if (drawCanvas) {
                return
            }
        
            // 先使地图不要放置倾斜
            map.setPitch(0);
            map.setBearing(0);
        
            let mapCanvas = map.getCanvas();
            drawCanvas = document.createElement("canvas");
            drawCanvas.style.position = "fixed";
            let rect = mapCanvas.getBoundingClientRect();
            drawCanvas.style.left = rect.left + "px";
            drawCanvas.style.top = rect.top + "px";
            drawCanvas.style.width = rect.width + "px";
            drawCanvas.style.height = rect.height + "px";
            document.body.insertBefore(drawCanvas, document.getElementById("ui"));
            canvasWidth = rect.width;
            canvasHeight = rect.height;
            initFabric(drawCanvas, canvasWidth, canvasHeight);
            canvasCoord1 = map.fromLngLat(map.unproject(new vjmap.Point(0, 0)));
            canvasCoord2 = map.fromLngLat(map.unproject(new vjmap.Point(canvasWidth, canvasHeight)));
        }
        
        const initFabric = (drawCanvas, width, height) => {
            let canvas = new fabric.Canvas(drawCanvas, {
                isDrawingMode: false,
                selectable: true,
                selection: true,
                width: width,
                height: height
            });
        
            fabricCanvas = canvas;
            //
            //变量声明
            let mouseFrom = {},
                mouseTo = {},
                canvasObjectIndex = 0,
                textbox = null;
            let drawWidth = 5; //笔触宽度
            let color = "#e34f51"; //画笔颜色
            let drawingObject = null; //当前绘制对象
            let moveCount = 1; //绘制移动计数器
            let doDrawing = false; // 绘制状态
        
            canvas.freeDrawingBrush.color = color; //设置自由绘颜色
            canvas.freeDrawingBrush.width = drawWidth;
        
            //绑定画板事件
            const down = (options) => {
                if (fabricCanvas.selection) return;
                if (options.e.touches) {
                    // 移动端
                    mouseFrom.x = options.e.touches[0].clientX;
                    mouseFrom.y = options.e.touches[0].clientY;
                } else {
                    mouseFrom.x = options.e.offsetX;
                    mouseFrom.y = options.e.offsetY;
                }
        
                doDrawing = true;
            }
            canvas.on("mouse:down", down);
            canvas.on("touchstart", down);
        
            const up = (options) => {
                if (fabricCanvas.selection) return;
                if (!options.e.touches) {
                    mouseTo.x = options.e.offsetX;
                    mouseTo.y = options.e.offsetY;
                }
                // drawing();
                if (drawingObject) {
                    fabricCanvas.setActiveObject(drawingObject);
                    fabricCanvas.requestRenderAll();
                }
        
                drawingObject = null;
                moveCount = 1;
                doDrawing = false;
                fabricCanvas.isDrawingMode = false;
                fabricCanvas.selection = true;
        
            }
            canvas.on("mouse:up", up);
            canvas.on("touchend", up);
        
            const move = (options) => {
                if (fabricCanvas.selection) return;
                if (moveCount % 2 && !doDrawing) {
                    //减少绘制频率
                    return;
                }
                moveCount++;
                if (options.e.touches) {
                    // 移动端
                    mouseTo.x = options.e.touches[0].clientX;
                    mouseTo.y = options.e.touches[0].clientY;
                } else {
                    mouseTo.x = options.e.offsetX;
                    mouseTo.y = options.e.offsetY;
                }
        
                drawing();
            }
            canvas.on("mouse:move", move);
            canvas.on("touchmove", move);
        
        
            //绘画方法
            function drawing() {
                if (drawingObject) {
                    canvas.remove(drawingObject);
                }
                var canvasObject = null;
                switch (drawType) {
                    case "arrow": //箭头
                        canvasObject = new fabric.Path(drawArrow(mouseFrom.x, mouseFrom.y, mouseTo.x, mouseTo.y, 30, 30), {
                            stroke: color,
                            fill: "rgba(255,255,255,0)",
                            strokeWidth: drawWidth
                        });
                        break;
                    case "line": //直线
                        canvasObject = new fabric.Line([mouseFrom.x, mouseFrom.y, mouseTo.x, mouseTo.y], {
                            stroke: color,
                            strokeWidth: drawWidth
                        });
                        break;
                    case "dottedline": //虚线
                        canvasObject = new fabric.Line([mouseFrom.x, mouseFrom.y, mouseTo.x, mouseTo.y], {
                            strokeDashArray: [3, 1],
                            stroke: color,
                            strokeWidth: drawWidth
                        });
                        break;
                    case "circle": //正圆
                        var left = mouseFrom.x,
                            top = mouseFrom.y;
                        var radius = Math.sqrt((mouseTo.x - left) * (mouseTo.x - left) + (mouseTo.y - top) * (mouseTo.y - top)) / 2;
                        canvasObject = new fabric.Circle({
                            left: left,
                            top: top,
                            stroke: color,
                            fill: "rgba(255, 255, 255, 0)",
                            radius: radius,
                            strokeWidth: drawWidth
                        });
                        break;
                    case "ellipse": //椭圆
                        var left = mouseFrom.x,
                            top = mouseFrom.y;
                        var radius = Math.sqrt((mouseTo.x - left) * (mouseTo.x - left) + (mouseTo.y - top) * (mouseTo.y - top)) / 2;
                        canvasObject = new fabric.Ellipse({
                            left: left,
                            top: top,
                            stroke: color,
                            fill: "rgba(255, 255, 255, 0)",
                            originX: "center",
                            originY: "center",
                            rx: Math.abs(left - mouseTo.x),
                            ry: Math.abs(top - mouseTo.y),
                            strokeWidth: drawWidth
                        });
                        break;
                    case "rectangle": //长方形
                        var path =
                            "M " +
                            mouseFrom.x +
                            " " +
                            mouseFrom.y +
                            " L " +
                            mouseTo.x +
                            " " +
                            mouseFrom.y +
                            " L " +
                            mouseTo.x +
                            " " +
                            mouseTo.y +
                            " L " +
                            mouseFrom.x +
                            " " +
                            mouseTo.y +
                            " L " +
                            mouseFrom.x +
                            " " +
                            mouseFrom.y +
                            " z";
                        canvasObject = new fabric.Path(path, {
                            left: left,
                            top: top,
                            stroke: color,
                            strokeWidth: drawWidth,
                            fill: "rgba(255, 255, 255, 0)"
                        });
                        //也可以使用fabric.Rect
                        break;
                    case "cloud": // 云线
                        let strokeWidth = 20
                        let x1 =  mouseFrom.x, y1 =  mouseFrom.y, x2 = mouseTo.x, y2 = mouseTo.y;
        
                        // 计算半圆的半径
                        var radius = strokeWidth / 2;
        
                        let rectWidth = Math.abs(x2 - x1)
                        let rectHeight = Math.abs(y2 - y1)
                        let rectLeft = Math.min(x1, x2);
                        let rectTop = Math.min(y1, y2);
        // 创建半圆的路径数据
                        let pathData = '';
        
        // 顶边上的半圆
                        let firstPoint;
                        for (let i = 0; i < rectWidth / (2 * radius) - 1; i++) {
                            let centerX = rectLeft + i * 2 * radius + radius;
                            let centerY = rectTop;
                            if (i == 0) {
                                firstPoint = ` ${centerX - radius} ${centerY} `
                            }
                            let arcPathTop = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
                            pathData += arcPathTop;
                        }
        
        // 右边上的半圆
                        for (let i = 0; i < rectHeight / (2 * radius) - 1; i++) {
                            let centerX = rectLeft + rectWidth;
                            let centerY = rectTop + i * 2 * radius + radius;
                            if (i == 0) {
                                pathData += `L ${centerX} ${centerY - radius}`
                            }
                            let arcPathRight = `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius}`;
                            pathData += arcPathRight;
                        }
        
        
        // 底边上的半圆
                        for (let i = 0; i < rectWidth / (2 * radius) - 1; i++) {
                            let centerX = rectLeft + rectWidth - i * 2 * radius - radius;
                            let centerY = rectTop + rectHeight;
                            if (i == 0) {
                                pathData += `L ${centerX + radius} ${centerY}`
                            }
                            let arcPathBottom = `M ${centerX + radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX - radius} ${centerY}`;
                            pathData += arcPathBottom;
                        }
        
        // 左边上的半圆
                        for (let i = 0; i < rectHeight / (2 * radius) - 1; i++) {
                            let centerX = rectLeft;
                            let centerY = rectTop + rectHeight - i * 2 * radius - radius;
                            if (i == 0) {
                                pathData += `L ${centerX} ${centerY + radius}`
                            }
                            let arcPathLeft = `M ${centerX} ${centerY + radius} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY - radius}`;
                            pathData += arcPathLeft;
                        }
                        pathData += "L " + firstPoint
        
                        // canvas.freeDrawingBrush = patternBrush;
                        // canvas.freeDrawingBrush.source = canvas.freeDrawingBrush.getPatternSrc.call(this);
                        canvasObject = new fabric.Path(pathData, {
                            left: left,
                            top: top,
                            stroke: color,
                            strokeWidth: drawWidth,
                            fill: "rgba(255, 255, 255, 0)"
                        });
                        break;
                    case "rightangle": //直角三角形
                        var path = "M " + mouseFrom.x + " " + mouseFrom.y + " L " + mouseFrom.x + " " + mouseTo.y + " L " + mouseTo.x + " " + mouseTo.y + " z";
                        canvasObject = new fabric.Path(path, {
                            left: left,
                            top: top,
                            stroke: color,
                            strokeWidth: drawWidth,
                            fill: "rgba(255, 255, 255, 0)"
                        });
                        break;
                    case "equilateral": //等边三角形
                        var height = mouseTo.y - mouseFrom.y;
                        canvasObject = new fabric.Triangle({
                            top: mouseFrom.y,
                            left: mouseFrom.x,
                            width: Math.sqrt(Math.pow(height, 2) + Math.pow(height / 2.0, 2)),
                            height: height,
                            stroke: color,
                            strokeWidth: drawWidth,
                            fill: "rgba(255,255,255,0)"
                        });
                        break;
                    case "text":
                        textbox = new fabric.Textbox("", {
                            left: mouseFrom.x - 60,
                            top: mouseFrom.y - 20,
                            width: 150,
                            fontSize: 30,
                            borderColor: "yellow",
                            fill: color,
                            hasControls: true
                        });
                        canvas.add(textbox);
                        textbox.enterEditing();
                        textbox.hiddenTextarea.focus();
                        break;
                    case "remove":
                        break;
                    default:
                        break;
                }
                if (canvasObject) {
                    canvas.add(canvasObject);
                    drawingObject = canvasObject;
                }
            }
        
            //绘制箭头方法
            function drawArrow(fromX, fromY, toX, toY, theta, headlen) {
                theta = typeof theta != "undefined" ? theta : 30;
                headlen = typeof theta != "undefined" ? headlen : 10;
                // 计算各角度和对应的P2,P3坐标
                var angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI,
                    angle1 = (angle + theta) * Math.PI / 180,
                    angle2 = (angle - theta) * Math.PI / 180,
                    topX = headlen * Math.cos(angle1),
                    topY = headlen * Math.sin(angle1),
                    botX = headlen * Math.cos(angle2),
                    botY = headlen * Math.sin(angle2);
                var arrowX = fromX - topX,
                    arrowY = fromY - topY;
                var path = " M " + fromX + " " + fromY;
                path += " L " + toX + " " + toY;
                arrowX = toX + topX;
                arrowY = toY + topY;
                path += " M " + arrowX + " " + arrowY;
                path += " L " + toX + " " + toY;
                arrowX = toX + botX;
                arrowY = toY + botY;
                path += " L " + arrowX + " " + arrowY;
                return path;
            }
        }
        
        const draw = (dType) => {
            beginFreeDraw();
            if (dType == "freedraw") {
                fabricCanvas.isDrawingMode = true;
            } else {
                fabricCanvas.isDrawingMode = false;
            }
            fabricCanvas.selection = false;
            drawType = dType;
        }
        
        const selectDel = () => {
            var selected = fabricCanvas.getActiveObjects(),
                selGroup = new fabric.ActiveSelection(selected, {
                    canvas: fabricCanvas
                });
            if (!selGroup) return;
        
            selGroup.forEachObject(function (obj) {
                fabricCanvas.remove(obj);
            });
            fabricCanvas.discardActiveObject().renderAll();
        }
        
        const endFreeDraw = () => {
            if (!canvasCoord1) return;
            let useSvgLayer = true;
            if (useSvgLayer) {
                // 使用svg图层，放大不会失真
                createDivSvg(canvasCoord1, canvasCoord2, canvasWidth, canvasHeight, fabricCanvas.toSVG());
            } else {
                // 使用画布图层的图，放大会失真
                //  createDivCanvas(canvasCoord1, canvasCoord2, drawCanvas);
            }
        
            if (drawCanvas) {
                document.body.removeChild(drawCanvas.parentElement);
                drawCanvas = null;
            }
        }
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>图纸批注</h4>
                    <div id="btns">
                        <div className="input-item">
                            <button className="btn" onClick={() => draw("arrow")}>绘制箭头</button>
                            <button className="btn" onClick={() => draw("freedraw")}>随手绘</button>
                            <button className="btn" onClick={() => draw("line")}>直线</button>
                            <button className="btn" onClick={() => draw("dottedline")}>虚线</button>
                            <button className="btn" onClick={() => draw("circle")}>圆</button>
                            <button className="btn" onClick={() => draw("ellipse")}>椭圆</button>
                            <button className="btn" onClick={() => draw("rectangle")}>矩形</button>
                            <button className="btn" onClick={() => draw("cloud")}>云线</button>
                            <button className="btn" onClick={() => draw("rightangle")}>直角三角形</button>
                            <button className="btn" onClick={() => draw("equilateral")}>等边三角形</button>
                            <button className="btn" onClick={() => draw("text")}>文本</button>
                            <button className="btn" onClick={selectDel}>删除选择</button>
                            <button className="btn" onClick={endFreeDraw}>结束绘制</button>
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