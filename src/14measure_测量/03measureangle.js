const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/measure/03measureangle
        // --测角度--
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
            renderWorldCopies: false, // 不显示多屏地图
            doubleClickZoom: false // 禁用鼠标双击放大
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        
        
        const addStyle = cssStyle => {
            let style = `<style>${cssStyle }</style>`;
            let ele = document.createElement('div');
            ele.innerHTML = style;
            document.getElementsByTagName('head')[0].appendChild(ele.firstElementChild)
        }
        // 增加一个popup自定义的样式
        addStyle(`
                        .custom-popup .vjmapgis-popup-content {
                            background-color: #0EFFC2;
                            opacity: 0.7;
                        }
                        .custom-popup .vjmapgis-popup-tip {
                            border-top-color: #0EFFC2;
                            opacity: 0.7;
                        }
                    `)
        
        let popup = null;
        const setPopupText = text => {
            if (text) {
                if (!popup) {
                    popup = new vjmap.Popup({
                        className: "custom-popup",
                        closeOnClick: false,
                        closeButton: false
                    })
                        .setHTML(text)
                        .setMaxWidth("500px")
                        .trackPointer()
                        .addTo(map)
                }
                else {
                    popup.setHTML(text);
                }
            } else {
                // 如果为空时，则删除popup
                if (popup) {
                    popup.setLngLat([0,0]); // 取消trackPointer
                    popup.remove();
                    popup = null;
                }
            }
        
        }
        
        let snapObj = {}; // 设置的捕捉的实体
        
        // 测量角度
        const measureAngle = async ()=> {
            let isDrawing = false;
            let line = await vjmap.Draw.actionDrawLineSting(map, {
                pointCount: 3,// 只需三个点，绘制完三个点后，自动结束
                api: {
                    getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    isDrawing = true;
                    const co = map.fromLngLat(e.feature.coordinates[e.feature.coordinates.length - 1]);
                    let html = `当前坐标:<span style="color: #ff0000"> ${co.x.toFixed(2)}, ${co.y.toFixed(2)}</span>`;
                    if (e.feature.coordinates.length == 1) {
                        html += "<br/>请指定要测量的第一点的坐标位置"
                    } else {
                        let len = e.feature.coordinates.length;
                        html += `<br/>按Alt键取捕捉; Ctrl键启用正交; 退格键删除上一个点`
                        html += `<br/>当前角度: <span style="color: #ff0000">${getAngle(e.feature.coordinates).angle}</span>`
                    }
                    setPopupText(html)
                },
                contextMenu: (e) => {
                    new vjmap.ContextMenu({
                        event: e.event.originalEvent,
                        theme: "dark", //light
                        width: "250px",
                        items: [
                            {
                                label: '确认',
                                onClick: () => {
                                    // 给地图发送Enter键消息即可取消，模拟按Enter键
                                    map.fire("keyup", {keyCode:13})
                                    setPopupText("");
                                }
                            },
                            {
                                label: '取消',
                                onClick: () => {
                                    // 给地图发送ESC键消息即可取消，模拟按ESC键
                                    map.fire("keyup", {keyCode:27})
                                    setPopupText("");
                                }
                            },{
                                label: '删除上一个点',
                                onClick: () => {
                                    // 给地图发送退格键Backspace消息即可删除上一个点，模拟按Backspace键
                                    map.fire("keyup", {keyCode:8})
                                }
                            },{
                                label: '结束测角度',
                                onClick: () => {
                                    // 给地图发送ESC键消息即可取消，模拟按ESC键
                                    map.fire("keyup", {keyCode:27})
                                    isDrawing = false;
                                    setPopupText("");
                                }
                            }
                        ]
                    });
        
                }
            });
            if (line.cancel) {
                setPopupText("");
                return {
                    cancel: true,
                    exit: isDrawing === false // 如果还没有绘制，就取消的话，就结束测距
                };// 取消操作
            }
        
            let color = vjmap.randomColor();
            let polyline = new vjmap.Polyline({
                data: line.features[0].geometry.coordinates,
                lineColor: color,
                lineWidth: 2
            });
            polyline.addTo(map);
            addMarkersToAngle(line.features[0].geometry.coordinates, color, polyline.sourceId);
            return {
                polyline
            };
        }
        
        // 测量角度循环，直至按ESC键取消，否则测量完一条后，继续测量下一条
        const measureAngleLoop = async ()=> {
            while(true) {
                let res = await measureAngle();
                if (res.exit === true) break;
            }
        }
        
        measureAngleLoop();
        
        // 给加个测量的结果值
        const addMarkersToAngle = (coordinates, color, sourceId) => {
            if (coordinates.length < 3) return;
            let markerTexts = [];
            let points = map.fromLngLat(coordinates);
            let textPoint = coordinates[1];
            let ang = getAngle(coordinates);
            // 绘制注记圆弧
            const cirleArcPath = vjmap.getCirclePolygonCoordinates(
                points[1],
                points[1].distanceTo(points[0]) / 4.0, 36,
                ang.startAngle,  ang.endAngle, false);
            let path = new vjmap.Polyline({
                data: map.toLngLat(cirleArcPath),
                lineColor: color,
                lineWidth: 2
            });
            path.addTo(map);
            markerTexts.push(path)
        
            let arcPoints = path.getData().features[0].geometry.coordinates;
            let arcMid = arcPoints[Math.ceil(arcPoints.length / 2)];// 取中点
            let textAngle = vjmap.radiansToDegrees(-map.fromLngLat(arcMid).angleTo(points[1])) + 90;
            if (textAngle > 90) textAngle += 180;
            else if (textAngle > 270) textAngle -= 180;
            let text = new vjmap.Text({
                text: ang.angle,
                anchor: "center",
                rotation: textAngle,
                offset: [0, 0], // x,y 方向像素偏移量
                style:{     // 自定义样式
                    'cursor': 'pointer',
                    'opacity': 0.8,
                    'padding': '6px',
                    'border-radius': '12px',
                    'background-color': color,
                    'border-width': 0,
                    'box-shadow': '0px 2px 6px 0px rgba(97,113,166,0.2)',
                    'text-align': 'center',
                    'font-size': '14px',
                    'color': `#${color.substr(1).split("").map(c => (15 - parseInt(c,16)).toString(16)).join("")}`,
                }
            });
            text.setLngLat(arcMid).addTo(map);
            markerTexts.push(text);
            // 给第一个点加一个marker用来删除
            const deletePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAbNJREFUWEftlrFOAkEQhv9Z4XgJOCrlTgp5ABOhMBoTCws7EzUaeAx5A0sDiYmFxpLGaAkU2KqFArHi4CU4cMccAQN6HHcIwZi7cnd25tt/5maHsOCPFhwfPoAnBarhQFIIccjAkV3qCMhKKct6q1tym1pPAHVVOWMg6+ScgKuYYR7PBaCmKmw5XgLiy4b5NhzkXVVWP4BXa00zTNcXc21oOR4AjAswaX9M2n4u1yLBIoiSbmV0Zcdc0pqd1HdbWwUWDuDqRjMy8lQDM4o54sYRoJcKq6qHclePKnuScQ0pd/RWt2ztVyOhLUFckIwTvWneDiLYnXdVA18O+r/dcNXXIsozCGsMzuhGJ98DUINpAuUAqmhGe33k/JjiG9g4K2ADUFdDOQan7QAIlI8Z7YwP4CvgK/C/FahFlQcwtm0bEeNFa5qJuSpgdT2AzkFyU290H3udMBzYgBD3gnAQa5iFuQJ4eZB6A8ovW/ETgARLmfIyaPZVSZIQRTBdas326Thwx7fAzRA6SREB2l0x2ndTAfTnwH0CrGk4PinY6D5VQHyhNcwbp3N/eyDxduPprH0FPgHEyH4wGIHUYwAAAABJRU5ErkJggg==";
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage =
                `url(${deletePng})`;
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.backgroundSize = '100%';
            el.style.cursor = "pointer";
        
            el.addEventListener('click', function (e) {
                map.removeSourceEx(sourceId); // 删除绘制的线
                markerTexts.forEach(m => m.remove());
                markerTexts = [];
            });
            // Add markers to the map.
            let deleteMarker = new vjmap.Marker({
                element: el,
                anchor: 'right'
            });
            deleteMarker.setLngLat(coordinates[1])
                .setOffset([-5, 0])
                .addTo(map);
            markerTexts.push(deleteMarker)
        
            // 把坐标加进捕捉数组中。
            addSnapCoordinates(coordinates);
        }
        // 得到角度值
        const getAngle = (coordinates) => {
            let points = map.fromLngLat(coordinates);
            if (points.length < 3) return {  angle: 0.0 }
            let angle1 = points[0].angleTo(points[1]);
            let angle2 = points[2].angleTo(points[1]);
            let angle = angle1 - angle2;
            let deg = vjmap.radiansToDegrees(angle);//弧度转角度
            let dir = true;
            if (deg < 0) {
                deg = -deg;
                dir = !dir;
            }
            if (deg > 180) {
                deg = 360 - deg;
                dir = !dir;
            }
            let startAngle = !dir ? vjmap.radiansToDegrees(angle1) : vjmap.radiansToDegrees(angle2);
            let endAngle = dir ? vjmap.radiansToDegrees(angle1) : vjmap.radiansToDegrees(angle2);
            startAngle = startAngle < 0 ? 360 + startAngle : startAngle;
            endAngle = endAngle < 0 ? 360 + endAngle : endAngle;
            if (endAngle < startAngle) {
                endAngle += 360;
            }
            return {
                angle: deg.toFixed(2) + "°",
                dir,
                startAngle,
                endAngle
            }
        }
        // 增加捕捉点
        const addSnapCoordinates = (coordinates) => {
            snapObj.features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [...coordinates]
                }
            })
        }
        
        // 获取捕捉点
        if (map.hasVectorLayer()) {
            // 矢量样式
            // 矢量样式获取捕捉点
            snapObj.features = map.queryRenderedFeatures({layers: ['vector-layer-lines']})
        } else {
            //栅格样式去服务器获取坐标点数据
            // 栅格样式获取捕捉点
            // 查询所有坐标数据,字段含义可参考https://vjmap.com/guide/svrStyleVar.html
            let res = await svc.conditionQueryFeature({ fields:"s3", condition:"s3 != ''", limit: 100000})
            res = res.result.map(e => e.s3.split(";"))
            snapObj.features = []
            for(let item of res) {
                let coordinates = []
                for(let pt of item) {
                    const p = pt.split(",")
                    if (p.length >= 2) {
                        coordinates.push(map.toLngLat([+p[0], +p[1]]))
                    }
                }
                if (coordinates.length == 1) {
                    snapObj.features.push({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: coordinates[0]
                        }
                    })
                }
                else if (coordinates.length > 1) {
                    snapObj.features.push({
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: coordinates
                        }
                    })
                }
        
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