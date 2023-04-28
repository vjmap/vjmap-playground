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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/measure/04measurecoordinate
        // --测坐标--
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
        
        // 测量坐标
        const measureCoordinate = async ()=> {
            let isDrawing = false;
            let point = await vjmap.Draw.actionDrawPoint(map, {
                api: {
                    getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                },
                updatecoordinate: (e) => {
                    if (!e.lnglat) return;
                    isDrawing = true;
                    const co = map.fromLngLat(e.lnglat);
                    let html = `当前坐标:<span style="color: #ff0000"> ${co.x.toFixed(2)}, ${co.y.toFixed(2)}</span>`;
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
                            },
                            {
                                label: '结束测坐标',
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
            if (point.cancel) {
                setPopupText("");
                return {
                    cancel: true,
                    exit: isDrawing === false
                };// 取消操作
            }
        
            addMarkersToCoord(point.features[0].geometry.coordinates);
            return {
                point
            };
        }
        
        // 测量坐标循环，直至按ESC键取消
        const measureCoordinateLoop = async ()=> {
            while(true) {
                let res = await measureCoordinate();
                if (res.exit === true) break;
            }
        }
        
        measureCoordinateLoop();
        
        // 给加个点加个测量的结果值
        const addMarkersToCoord = (coordinates) => {
            let markerTexts = [];
            let co = map.fromLngLat(coordinates);
            let content = `X: ${co.x.toFixed(2)}, Y: ${co.y.toFixed(2)}`
            let marker = createLeaderMarker(coordinates, content);
            markerTexts.push(marker);
        
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
                markerTexts.forEach(m => m.remove());
                markerTexts = [];
        
            });
            // Add markers to the map.
            let deleteMarker = new vjmap.Marker({
                element: el,
                anchor: 'right'
            });
            deleteMarker.setLngLat(coordinates)
                .setOffset([-5, 0])
                .addTo(map);
            markerTexts.push(deleteMarker)
        
        }
        
        // 引线标记
        const createLeaderMarker = (lnglat, content) => {
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.position = 'absolute'
        
            let img = document.createElement("div");
            img.style.backgroundImage =
                'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4AAAAAlCAYAAACj1PQVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTJFMTU1RjExN0UzMTFFOTg3RTBFODdGNTY0NThGQkUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MTJFMTU1RjIxN0UzMTFFOTg3RTBFODdGNTY0NThGQkUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxMkUxNTVFRjE3RTMxMUU5ODdFMEU4N0Y1NjQ1OEZCRSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxMkUxNTVGMDE3RTMxMUU5ODdFMEU4N0Y1NjQ1OEZCRSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pj97JFoAAAV9SURBVHja7N1faJ1nHQfw33nzpuekaZfWNFmbLHXWdf7DWgvebF4M0SEZhTG8mKvFyzG9UJFKh9peVGnd0DkE/10Ic6s6BBEGbshggho3BVGnRnC2s1n/ras2J2uzc05PXp+3yZzSm7XJkvfi84HveZ9z3ve8F7/bL8/71oqiiMs8NhCLsCllfcpfAwAAAAAAAIDlsXM68jfgtl9K2Z3Sa8IAAAAAAAAAb7hjKW8uF9kS3/jdKR9PaZkxAAAAAAAAwPJa6h3A96X0pBxK+bLxAgAAAAAAACyfpSyAP5jy4ZQXUh747687p00ZAAAAAAAAYBlkS3if+xfW+1MuGC0AAAAAAADA8lqqAnh3yvaUZ1MeMlYAAAAAAACA5bcUBXBfyoGF9edSusYKAAAAAAAAsPyWogD+VMpYypMpTxgpAAAAAAAAwMpYbAG8IWVvylzKHuMEAAAAAAAAWDmLLYC/mDKQ8nDKH4wTAAAAAAAAYOUspgC+IeWelNmYL4IBAAAAAAAAWEGLKYAPpfSmfD1lyigBAAAAAAAAVtbVFsA3pdyR8lLMF8EAAAAAAAAArLCrKYBrKfcvHA+kNI0RAAAAAAAAYOVdTQFc7vwtdwA/l/ItIwQAAAAAAACohistgMt3/h5cWO9N6RghAAAAAAAAQDVcaQF8d8rWlImUnxgfAAAAAAAAQHVcSQF8Tcq+lCJlz8IRAAAAAAAAgIq4kgK4fOTzUMzv/J0wOgAAAAAAAIBqeb0F8FjKp2P+nb97jQ0AAAAAAACgel5vAXwgpS/l2ynPGRsAAAAAAABA9eSjd370sh+P7/q/r9tTdqc0Y74IBgAAAAAAAKCC8v9Zl7uB6yn9o4fHG+lYS2n/867Hv5bXivLcoZQzRgYAAAAAAABQTfnw5nvjxWMHe9N6cP+OyVtv2nj2ruFG6209WbGqM5c181rx9m5RO/ngn2/4zlf/tLV2fNfPCmMDAAAAAAAAqJ68LH+HGq2xRz7wu2+8a31zvCgiLs5FlC3vqp4YKS8638mzqZf7tqXlb1MuGBsAAAAAAABA9ZSPdh58tfyd7UScOh9xYjqLszNZlGVwN6U/71z7hR1/e/g9g9NbRg+P9xobAAAAAAAAQPVk+3ZMfujV8vf0TC3WXWzE9ZveHyNjt0UxOxCnp7NotiPWr2pfl67dk/6zxtgAAAAAAAAAqie7eePZXeVO33OtiOGsHqtvfjDi1scibnkkesafipHVI3HuQi3a3Yh3rpsZT/+5ZvTweM3oAAAAAAAAAKolH2q0byzf+dtuZ9G/8b0RW+587ezat0a84xPR+8z+aHU7MVDvbLhl05lrf3FyaGr08Hj5muA4/qMfmiIAAAAAAABABWS1KPJLTW75UR+8/Ir6uksvCi6K+a/Dfa26sQEAAAAAAABUT/ZyJz+Z19IiL6J7eiLi/NRrZ4tuxNEfRzvmorcnoj2XvfL41MZTMV8XAwAAAAAAAFAh2eS5tU9kWcRAo4ipC9MRP98ZMfnNiH/8IOLJO+LMC7+ORl83Gj0RR5r9z8x08nOhAAYAAAAAAAConPyzT2976H1D//7YYL21ZW5NN442n4/ep/ddeuxzK+air68bb2pEdCN75dEj192Xfp4xNgAAAAAAAIDqyWY6+akHnt16d7Oz6uRAPWJkoIi1azuxek0nhge6MdQXUatlrZ8+P/L5706+ZSLKXhgAAAAAAACAyik3+s5+/++bJ+751fbbfv/S+kc7c/l0WQSva0TUe2rtIzNrJr7yxxs/8pnfbPteurY5vPlej38GAAAAAAAAqKC8LHRfPHZw9penNvwl5ZP1nrmB268/MdafX+x96sTQ8aMz/f9K102ntJS/AAAAAAAAANX1HwEGAM75MhcANnAkAAAAAElFTkSuQmCC")';
            img.style.backgroundRepeat = "no-repeat"
            img.style.height = '37px';
            img.style.width = '100px';
            img.style.position = 'absolute';
            img.style.left = '-3px';
            img.style.bottom = '-3px';
            img.style.right = "0px"
            el.appendChild(img);
        
            let panel = document.createElement("div");
            panel.style.height = '50px';
            panel.style.width = '350px';
            panel.style.position = 'absolute';
            panel.style.left = '97px';
            panel.style.top = '-60px';
            panel.style.border = "solid 1px #8E0EFF";
            panel.style.background = 'linear-gradient(#00ffff, #00ffff) left top,  linear-gradient(#00ffff, #00ffff) left top,     linear-gradient(#00ffff, #00ffff) right bottom,    linear-gradient(#00ffff, #00ffff) right bottom';
            panel.style.backgroundRepeat = 'no-repeat';
            panel.style.backgroundColor ='rgba(87,255,255, 0.3)'
            panel.style.backgroundSize = '1px 6px, 6px 1px';
            panel.style.fontSize = '18px';
            panel.style.color = '#ffffff';
            panel.innerHTML =  `<div style='margin: 15px 5px 15px 5px'>${content}</div>`;
            el.appendChild(panel);
        
            // Add markers to the map.
            let marker = new vjmap.Marker({
                element: el,
                anchor: "bottom-left"
            })
            marker.setLngLat(lnglat)
                .addTo(map);
            return marker
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