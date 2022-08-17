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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/01webcadswitch2
        // --互联网地图与CAD图切换效果[同一个Map对象]--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 根据地图范围建立经纬度投影坐标系
        let prj = new vjmap.LnglatProjection();
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },
            center: [0,0],
            zoom: 1,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        
        const showWebMap = ()=> {
            prj = new vjmap.LnglatProjection();
            map.setMapProjection(prj);
            map.setZoom(2);
            map.setPitch(0);
            map.setCenter([115.33, 39.95]);
        
            map.addSource('web-source1', {
                type: 'raster',
                // 影像
                tiles: [
                    "https://webst01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                    "https://webst02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                    "https://webst03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}",
                    "https://webst04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}"
                ],
            });
            map.addSource('web-source2', {
                type: 'raster',
                // 路网注记
                tiles: [
                    "https://webst01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
                    "https://webst02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
                    "https://webst03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
                    "https://webst04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                ],
            });
            map.addLayer({
                    'id': 'web-layer1',
                    'type': 'raster',
                    'source': 'web-source1'
                }
            );
            map.addLayer({
                    'id': 'web-layer2',
                    'type': 'raster',
                    'source': 'web-source2'
                }
            );
        
        
            map.flyTo({
                zoom: 10,
                center: [115.33, 39.95],
                pitch: 60
            })
        
            let path = [
                [115.18443115234203, 39.978155850446086],
                [115.22151000976328, 40.003407305052974],
                [115.24966247558291, 40.01234828988561],
                [115.3245068359364, 40.00445924640303],
                [115.32862670898288, 39.97552495375567],
                [115.32038696288981, 39.94289342068308],
                [115.30322082519274, 39.92657181512973],
                [115.25721557549127, 39.921305950193755],
                [115.22082336357619, 39.929731138733786],
                [115.17893798759985, 39.950789573758385],
                [115.18443115234203, 39.978155850446086]
            ];
        
            let  geoDatas = [];
            geoDatas.push({
                points: path,
                properties: {
                    color: "#5A57FF",
                    color2: "#ab57ff",
                    baseHeight: 300,
                    height: 2000
                }
            })
        
            let fillExtrusion = new vjmap.FillExtrusion({
                data: geoDatas,
                fillExtrusionColor: ['case', ['to-boolean', ['feature-state', 'hover']], '#00FFFF', ['get', 'color']],
                fillExtrusionOpacity: 0.8,
                fillExtrusionHeight: ['get', 'height'],
                fillExtrusionBase: ['get', 'baseHeight'],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            fillExtrusion.addTo(map);
            fillExtrusion.clickLayer(()=> {
                setTimeout(()=> {
                    removeLayer();
                    showCadMap();
                }, 100)
            })
        
        
            const initData = vjmap.cloneDeep(fillExtrusion.getData());
        
            const mapProgressToValues = idx => vjmap.interpolate(
                [0, 1],
                [
                    { color: initData.features[idx].properties.color, height: 0 },
                    { color: initData.features[idx].properties.color2, height: initData.features[idx].properties.height }
                ]
            )
        
            let anmi = vjmap.createAnimation({
                from: 0,
                to: 1,
                repeat: Infinity,
                duration: 2000,
                onUpdate: latest => {
                    const data = fillExtrusion.getData();
                    if (!data) return;
                    for(let i = 0 ; i < data.features.length; i++) {
                        const value = mapProgressToValues(i)(latest)
                        data.features[i].properties.color = value.color;
                        data.features[i].properties.height = value.height;
                    }
                    fillExtrusion.setData(data);
                }
            })
        
            let latLng = map.toLngLat([115.259,39.966]);
            createLeaderMarker(latLng, "某某景点 --- 点击或鼠标放大进入景点地图！")
        
            const zoomChanged = ()=> {
                let zoom = map.getZoom();
                if (zoom >= 11) {
                    removeLayer();
                    showCadMap();
                }
            }
            map.on("zoomend", zoomChanged);
            const removeLayer = ()=> {
                anmi.stop();
                fillExtrusion.remove();
                map.off("zoomend", zoomChanged);
                removeMapLayer(map);
            }
            return {
                removeLayer
            }
        }
        
        // 清空地图上面的所有图层
        const removeMapLayer = map => {
            let style = map.getStyle()
            map.removeSourceEx(Object.keys(style.sources))
            map.removeMarkers();
            map.removePopups();
        }
        
        const showCadMap = async (mapid = "sys_zp")=> {
            let res = await svc.openMap({
                mapid: mapid,
                mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
                style:  vjmap.openMapDarkStyle()
            })
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            let center = mapExtent.center();
            let prj = new vjmap.GeoProjection(mapExtent);
            let mapStyle = svc.rasterStyle();
            map.setStyle(mapStyle);
            map.setMapProjection(prj);
            map.updateMapExtent(mapExtent);
        
            console.log(prj.toLngLat(center))
        
            map.setZoom(2);
            map.setCenter(prj.toLngLat(center));
        
        
            const popup = new vjmap.Popup({ closeOnClick: false, closeButton: true, anchor: "bottom" });
            popup.setHTML('缩小地图至级别1后，将自动切换至互联网地图!')
                .setLngLat(prj.toLngLat(center))
                .addTo(map);
        
        
            const zoomChanged = ()=> {
                let zoom = map.getZoom();
                if (zoom  <= 1) {
                    removeLayer();
                    showWebMap();
                }
            }
            map.on("zoomend", zoomChanged);
        
            const removeLayer = ()=> {
                map.off("zoomend", zoomChanged);
                removeMapLayer(map);
            }
            return {
                removeLayer
            }
        }
        
        
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
            panel.style.width = '400px';
            panel.style.position = 'absolute';
            panel.style.left = '97px';
            panel.style.top = '-60px';
            panel.style.border = "solid 1px #8E0EFF";
            panel.style.background = 'linear-gradient(#00ffff, #00ffff) left top,  linear-gradient(#00ffff, #00ffff) left top,     linear-gradient(#00ffff, #00ffff) right bottom,    linear-gradient(#00ffff, #00ffff) right bottom';
            panel.style.backgroundRepeat = 'no-repeat';
            panel.style.backgroundColor ='rgba(255,0,255, 0.6)'
            panel.style.backgroundSize = '1px 6px, 6px 1px';
            panel.style.fontSize = '18px';
            panel.style.color = '#ffffff';
            panel.innerHTML =  `<div style='margin: 15px'>${content}</div>`;
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
        
        
        showWebMap();
        
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