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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/measure/02measurearea
        // --测面积--
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
        
        // 测量面积
        const sleep = (tm) => {
            return new Promise(resolve => setTimeout(resolve, tm))
        }
        const measureArea = async ()=> {
            let isDrawing = false;
            await sleep(500) // 防止双击结束时误多点了几个点被当前下一次的起点了
            let poly = await vjmap.Draw.actionDrawPolygon(map, {
                api: {
                    getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    isDrawing = true;
                    const co = map.fromLngLat(e.feature.coordinates[0][e.feature.coordinates.length - 1]);
                    let html = `当前坐标:<span style="color: #ff0000"> ${co.x.toFixed(2)}, ${co.y.toFixed(2)}</span>`;
                    if (e.feature.coordinates[0].length == 1) {
                        html += "<br/>请指定要测量的第一点的坐标位置"
                    } else {
                        html += `<br/>按Alt键取捕捉; Ctrl键启用正交; 退格键删除上一个点`
                        html += `<br/>当前面积: <span style="color: #ff0000">${getArea(e.feature.coordinates[0])}</span>`
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
                                label: '结束测面积',
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
            if (poly.cancel) {
                setPopupText("");
                return {
                    cancel: true,
                    exit: isDrawing === false // 如果还没有绘制，就取消的话，就结束测距
                };// 取消操作
            }
        
            let color = vjmap.randomColor();
            let polygon = new vjmap.Polygon({
                data: poly.features[0].geometry.coordinates[0],
                fillColor: color,
                fillOpacity: 0.4,
                fillOutlineColor: color,
            });
            polygon.addTo(map);
            addMarkersToPolygon(poly.features[0].geometry.coordinates[0], color, polygon.sourceId);
            return {
                polygon
            };
        }
        
        // 测量面积循环，直至按ESC键取消，否则测量完一条后，继续测量下一条
        const measureAreaLoop = async ()=> {
            while(true) {
                let res = await measureArea();
                if (res.exit === true) break;
            }
        }
        
        measureAreaLoop();
        
        // 给加个测量的结果值
        const addMarkersToPolygon = (coordinates, color, sourceId) => {
            let markerTexts = [];
            const center = vjmap.polygonCentroid(map.fromLngLat(coordinates));
            let text = new vjmap.Text({
                text: getArea(coordinates),
                anchor: "center",
                offset: [0, 0], // x,y 方向像素偏移量
                style:{     // 自定义样式
                    'cursor': 'pointer',
                    'opacity': 0.8,
                    'padding': '6px',
                    'border-radius': '12px',
                    'background-color': `#${color.substr(1).split("").map(c => (15 - parseInt(c,16)).toString(16)).join("")}`,
                    'border-width': 0,
                    'box-shadow': '0px 2px 6px 0px rgba(97,113,166,0.2)',
                    'text-align': 'center',
                    'font-size': '14px',
                    'color': color,
                }
            });
            text.setLngLat(map.toLngLat(center)).addTo(map);
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
            deleteMarker.setLngLat(coordinates[0])
                .setOffset([-5, 0])
                .addTo(map);
            markerTexts.push(deleteMarker)
        
            // 把坐标加进捕捉数组中。
            addSnapCoordinates(coordinates);
        }
        // 得到面积值
        const getArea = (coordinates) => {
            let result = vjmap.calcPolygonArea(map.fromLngLat(coordinates));
            let unit = "m²";
            if (result >= 1e6) {
                result /= 1e6;
                unit = "km²";
            } else if (result < 1.0/1e4) {
                result *= 1e4;
                unit = "cm²";
            }
            return result.toFixed(2) + " " + unit;
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