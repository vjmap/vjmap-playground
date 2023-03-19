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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/04imagecadmap
        // --影像与CAD图叠加校准--以影像以背景，根据选定的对应点自动校准CAD地图并修改地图坐标导出为DWG图
        message.info("请调节上面两幅图的公共点对CAD地图进行校准")
        const imageMapId = 'sys_image'; // 影像地图ID
        const correctMapId = 'correctdwg'; // 需要校正的地图id
        
        // 在id为"map”的div下面创建一个一样大的不同的div，用于新的对图对象的容器id
        const createNewMapDivIds = ()=> {
            // 先清空之前的
            let parentDiv = document.getElementById("map");
            parentDiv.style.display = "flex";
            parentDiv.style.flexDirection = "column";
        
            let newMapDiv1 = document.createElement("div");
            newMapDiv1.id = vjmap.RandomID(6);
            newMapDiv1.style.flex = "1";
            parentDiv.appendChild(newMapDiv1);
        
            let newMapDiv2 = document.createElement("div");
            newMapDiv2.id = vjmap.RandomID(6);
            newMapDiv2.style.flex = "1";
            newMapDiv2.style.backgroundColor = '#022B4F'
            parentDiv.appendChild(newMapDiv2);
        
            parentDiv = document.getElementById( newMapDiv1.id);
            parentDiv.style.display = "flex";
            parentDiv.style.justifyContent = "space-between"
            let newMapDiv3 = document.createElement("div");
            newMapDiv3.id = vjmap.RandomID(6);
            newMapDiv3.style.flex = "1";
            newMapDiv3.style.backgroundColor = '#125558'
            parentDiv.appendChild(newMapDiv3);
        
            let newMapDiv4 = document.createElement("div");
            newMapDiv4.id = vjmap.RandomID(6);
            newMapDiv4.style.flex = "1";
            newMapDiv4.style.backgroundColor = '#271258'
            parentDiv.appendChild(newMapDiv4);
            return [newMapDiv3.id, newMapDiv4.id, newMapDiv2.id];
        }
        
        
        const createMap = async (mapContainerId, mapId) => {
            let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
            let res = await svc.openMap({
                mapid: mapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
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
                container: mapContainerId, // container ID
                style: svc.rasterStyle(), // 栅格瓦片样式
                center: prj.toLngLat(mapExtent.center()), // 中心点
                zoom: 2,
                renderWorldCopies: false
            });
            // 地图关联服务对象和坐标系
            map.attach(svc, prj);
            // 使地图全部可见
            map.fitMapBounds();
            await map.onLoad();
            let mousePositionControl = new vjmap.MousePositionControl();
            map.addControl(mousePositionControl, "bottom-left");
            return map;
        }
        const divIds = createNewMapDivIds();
        const mapImage = await createMap(divIds[0], imageMapId);
        const mapCad = await createMap(divIds[1], correctMapId);
        const mapMerge = await createMap(divIds[2], imageMapId);
        const draw = new vjmap.Draw.Tool();
        mapMerge.addControl(draw, 'top-right');
        
        // 增加图像上面的两个公共点坐标,默认为图像的左上角和右下角坐标
        let imagePublicPoint = [
            vjmap.geoPoint([451692.9279773526, 3357915.51451705]),
            vjmap.geoPoint([452034.66574774124, 3357558.314824416])
        ];
        const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
        for(let k = 0; k < imagePublicPoint.length; k++) {
            let marker = new vjmap.Marker({
                color: colors[k % (colors.length - 1)],
                draggable: true
            });
            marker.setLngLat(mapImage.toLngLat(imagePublicPoint[k]));
            marker.addTo(mapImage);
            marker.on('drag', e => {
                // 拖动时，修改坐标
                imagePublicPoint[k] = mapImage.fromLngLat(marker.getLngLat());
                updateMergeMapDebounce();
            });
        }
        
        // 增加cad图上面的两个公共点坐标,默认为地图的左上角和右下角坐标
        let cadBounds = mapCad.getGeoBounds(0.3);
        let cadPublicPoint = [
            vjmap.geoPoint([459487.0296464551, 3356400.9115997166]),
            vjmap.geoPoint([459822.0279662793, 3356037.595313958])
        ];
        for(let k = 0; k < cadPublicPoint.length; k++) {
            let marker = new vjmap.Marker({
                color: colors[k % (colors.length - 1)],
                draggable: true
            });
            marker.setLngLat(mapCad.toLngLat(cadPublicPoint[k]));
            marker.addTo(mapCad);
            marker.on('drag', e => {
                // 拖动时，修改坐标
                cadPublicPoint[k] = mapCad.fromLngLat(marker.getLngLat());
                updateMergeMapDebounce();
            });
        }
        // 根据公共点合成图
        const updateMergeMap = () => {
            // 通过四参数计算然后通过wms图层来叠加cad图
            console.log(imagePublicPoint, cadPublicPoint)
            let fourparam = vjmap.coordTransfromGetFourParamter(imagePublicPoint, cadPublicPoint, true);
            let mapParam = mapCad.getService().currentMapParam();
            addWmsLayer(mapMerge, mapParam.mapid, mapParam.layer, fourparam, mapMerge.getGeoBounds(1.0));
        }
        
        const addWmsLayer = async (map, mapid, layer, fourparam, mapFullbounds) => {
            let fourParameter = [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate];
            map.removeSourceEx('wms-maps-source' + mapid)
            let wmsurl = mapCad.getService().wmsTileUrl({
                mapid: mapid,
                layers: layer,
                fourParameter: fourParameter,
                mapbounds: mapFullbounds // 全图的范围
            })
        
            map.addSource('wms-maps-source' + mapid, {
                'type': 'raster',
                'tiles': [
                    wmsurl
                ],
                'tileSize': 256
            });
            map.addLayer({
                'id': 'wms-maps-layer' + mapid,
                'type': 'raster',
                'source': 'wms-maps-source' + mapid,
                'paint': {"raster-opacity": 1}
            });
        
            map.removeMarkers();
            // 增加公共对应点进行显示
            for(let k = 0; k < imagePublicPoint.length; k++) {
                // 图像上的点
                let markerImage = new vjmap.Marker({
                    color: colors[k % (colors.length - 1)]
                });
                markerImage.setLngLat(map.toLngLat(imagePublicPoint[k]));
                markerImage.addTo(map);
            }
        
            // CAD图上的点  需要通过四参数反算叠加到上面
            for(let k = 0; k < cadPublicPoint.length; k++) {
                let newPoint = vjmap.coordTransfromByInvFourParamter(cadPublicPoint[k], fourparam);
                // 图像上的点
                let markerCad = new vjmap.Marker({
                    color: colors[k % (colors.length - 1)],
                });
                markerCad.setLngLat(map.toLngLat(newPoint));
                markerCad.addTo(map);
                markerCad.getElement().style.opacity = '0.7';
            }
        }
        let tmId;
        const updateMergeMapDebounce = (value) => {
            if (tmId) clearTimeout(tmId);
            tmId = setTimeout(() => {
                // 提高性能
                updateMergeMap();
            }, 1000)
        };
        
        updateMergeMapDebounce();
        
        let options = {};
        options.buttons = [
            {
                id: "pos",
                title: "按校正后的坐标导出DWG",
                text: "导出DWG",
                onActivate: async (ctx, e) => {
                    let fourparam = vjmap.coordTransfromGetFourParamter(cadPublicPoint, imagePublicPoint, true);
                    let rsp = await mapMerge.getService().composeNewMap([
                        {
                            mapid: correctMapId, // 地图id
                            fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate]// 对地图进行四参数转换计算
                        }
                    ])
                    if (!rsp.status) {
                        message.error(rsp.error)
                    }
                    let url = `https://vjmap.com/app/cloud/#/upload?fileid=${rsp.fileid}&mapid=${rsp.fileid}&isNewMapId=true`;
                    window.open(url);
                }
            }
        ];
        
        let btnGroupCtrl = new vjmap.ButtonGroupControl(options);
        mapMerge.addControl(btnGroupCtrl, 'top-left');
        
        // 备注: 能叠加多个cad图。以影像地图的地理范围为坐标系（示例中只加了一个cad 图，加多个的原理 是一样的）
        
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