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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findzintersect
        // --指定距离间距自动获取每层厚度--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: "sac115342aea37", // 地图ID
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
            center:  prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        map.doubleClickZoom.disable(); // 禁止地图双击放大
        let mapBounds = map.getGeoBounds(1.0);
        await map.onLoad();
        
        // 获取开始绘制的位置
        // 先创建一根临时线
        message.info("请指定要绘制的开始位置")
        // 可以做一条辅助线显示
        let co1 = [mapBounds.center().x, mapBounds.min.y];
        let co2 = [mapBounds.center().x, mapBounds.max.y];
        let tempLine = new vjmap.Polyline({
            data: map.toLngLat([co1, co2]),
            lineColor: "yellow",
            lineWidth: 3,
            lineDasharray: [2, 2],
        });
        tempLine.addTo(map);
        let startPosAction = await vjmap.Draw.actionDrawPoint(map, {
            updatecoordinate: (e) => {
                if (!e.lnglat) return;
                const co = map.fromLngLat(e.lnglat);
                co1[0] = co.x;
                co2[0] = co.x;
                tempLine.setData(map.toLngLat([co1, co2])); // 修改临时线的坐标
            }});
        
        if (startPosAction.cancel)
        {
            tempLine.remove();
            return
        }
        
        let startPos = map.fromLngLat(startPosAction.features[0].geometry.coordinates)
        message.info("请指定绘制的间隔")
        
        co1 = [startPos.x, startPos.y];
        co2 = [startPos.x, startPos.y];
        let tempLine2 = new vjmap.Polyline({
            data: map.toLngLat([co1, co2]),
            lineColor: "red",
            lineWidth: 3,
            lineDasharray: [2, 2],
        });
        tempLine2.addTo(map);
        let secPosAction = await vjmap.Draw.actionDrawPoint(map, {
            updatecoordinate: (e) => {
                if (!e.lnglat) return;
                const co = map.fromLngLat(e.lnglat);
                co2[0] = co.x;
                tempLine2.setData(map.toLngLat([co1, co2])); // 修改临时线的坐标
            }});
        tempLine.remove();
        tempLine2.remove();
        if (secPosAction.cancel)
        {
            return
        }
        
        let secondPos = map.fromLngLat(secPosAction.features[0].geometry.coordinates);
        let dist = secondPos.x - startPos.x;
        
        // 获取所有图层名称为***层的曲线或直线类型的实体坐标
        // 实体类型ID和名称映射
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        const mapLayers = svc.getMapLayers();
        
        const lineCoords = [];
        const lineLayerName = [];
        const queryData = async () => {
            let queryEntTypeId1 = getTypeNameById("AcDbLine");
            let queryEntTypeId2 = getTypeNameById("AcDbSpline");
            // 通过图层名称过滤图层id 图层名称为***层
            const layerindexs = svc.getMapLayers().filter(layer => layer.name.substring(layer.name.length - 1) == "层").map(layer => layer.index).join(",");
        
            let query = await svc.conditionQueryFeature({
                condition: `(name='${queryEntTypeId1}' or name='${queryEntTypeId2}') and   layerindex in (${layerindexs}) `, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                fields: "",
                includegeom: true,
                realgeom: true,
                limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
            })
            if (query.error) {
                message.error(query.error)
            } else {
                if (query.recordCount > 0) {
                    for (let i = 0; i < query.recordCount; i++) {
                        let item = query.result[i];
                        let layername = mapLayers[item.layerindex].name
                        if (item.geom.geometries[0].type != "LineString") continue;
                        let coordinates = map.fromLngLat(item.geom.geometries[0].coordinates);
                        lineCoords.push(coordinates);
                        lineLayerName.push(layername)
                    }
                }
            }
        }
        await queryData();
        
        let curX = startPos.x;
        let result = {};
        let circleDatas = {
            type: "FeatureCollection",
            features: []
        };
        let textDatas = [];
        let lineDatas = [];
        while(true) {
            // 竖线与上面的地层线一个个求交
            let lineCo1 = vjmap.geoPoint([curX, mapBounds.min.y]);
            let lineCo2 = vjmap.geoPoint([curX, mapBounds.max.y]);
        
            let crossPoints = [];//交点
            let crossLayerNames = [];//交点图层名
            for(let i = 0; i < lineCoords.length; i++) {
                for(let m = 0; m < lineCoords[i].length - 1; m++) {
                    let res = vjmap.segmentIntersect(curX, mapBounds.min.y, curX, mapBounds.max.y,
                        lineCoords[i][m].x, lineCoords[i][m].y, lineCoords[i][m + 1].x, lineCoords[i][m + 1].y);
                    if (res.status) {
                        crossPoints.push(res);
                        crossLayerNames.push(lineLayerName[i]);
                        circleDatas.features.push({
                            type: "Feature",
                            id: circleDatas.features.length + 1,
                            geometry: {
                                coordinates: [res.x, res.y],
                                type: "Point"
                            },
                            properties: {
                                name: lineLayerName[i]
                            }
                        });
        
                    }
                }
            }
            if (crossPoints.length == 0) break; // 没有相交的了，不用算了
        
            // 交点接 y值从大到小排序 冒泡法
            for(let i = 0; i < crossPoints.length - 1; i++) {
                for(let j = i + 1; j < crossPoints.length; j++) {
                    if (crossPoints[i].y < crossPoints[j].y) {
                        let temp = vjmap.geoPoint(crossPoints[i]);
                        crossPoints[i] = vjmap.geoPoint(crossPoints[j]);
                        crossPoints[j] = temp;
        
                        temp = crossLayerNames[i];
                        crossLayerNames[i] = crossLayerNames[j];
                        crossLayerNames[j] = temp;
                    }
                }
            }
            let infos = []
            for(let i = 0; i < crossPoints.length - 1; i++) {
                let textCo = [crossPoints[i].x, (crossPoints[i].y + crossPoints[i + 1].y) / 2.0];
                let dist = crossPoints[i].y - crossPoints[i + 1].y;
                infos.push({
                    start: crossPoints[i],
                    end: crossPoints[i + 1],
                    name: crossLayerNames[i],
                    dist: dist,
                    textCo: textCo// 文字位置放中间
                })
        
                const data = {
                    point: map.toLngLat(textCo),
                    properties: {
                        text: crossLayerNames[i] + " 厚度:" + dist.toFixed(2),
                        textColor: "#00129A"
                    }
                }
                textDatas.push(data);
        
                lineDatas.push({
                    points: map.toLngLat([crossPoints[i], crossPoints[i + 1]]),
                    properties: {
                        name: crossLayerNames[i],
                    }
                })
            }
            result[curX] = infos;
            // 下一条竖线
            curX += dist;
            if (curX > mapBounds.max.x) break;
        }
        message.info('具体坐标数据请按F12控制台查看')
        console.log(result);
        
        let circles = new vjmap.Circle({
            data: map.toLngLat(circleDatas),
            circleColor: ['case', ["boolean", ["feature-state", "hover"], false], '#ff0000', '#22B14C'],
            circleRadius: 5,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        circles.addTo(map);
        circles.hoverPopup(f => `${f.properties.name}`, { anchor: 'bottom' });
        
        // 线
        let polylines = new vjmap.Polyline({
            data: lineDatas,
            // 如果是hover状态时，用红色，非hover状态时，取属性中的'color'做为颜色值
            lineColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'red', '#3580BB'],
            lineWidth: 2,
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polylines.addTo(map);
        polylines.hoverPopup(f => `${f.properties.name}`, { anchor: 'bottom' });
        
        // 图标
        await map.loadImageEx("stretchTextBackImg", env.assetsPath + "images/textback.png", {
            // 可以水平拉伸的两列像素设置：(除了两边和中间两角形的部分，其他两部分都能拉伸)
            //-可以拉伸x:7和x:32之间的像素
            //-可以拉伸x:42和x:62之间的像素。
            stretchX: [
                [7, 32],
                [42, 62]
            ],
            // 可以垂直拉伸的一行像素设置：
            // y:3和y:19之间的像素可以拉伸
            stretchY: [[3, 19]],
            //图像的这一部分可以包含文本（[x1，y1，x2，y2]）：
            content: [7, 3, 62, 19]
        });
        // 文字
        let  symbols = new vjmap.Symbol({
            data: textDatas,
            iconImage: "stretchTextBackImg",
            iconAnchor: "bottom",
            iconOpacity: 0.5,
            iconOffset: [-2, -10],
            textTranslate: [-2, -6],
            textAnchor: "bottom",
            textField: ['get', 'text'],
            textFont: ['Arial Unicode MS Regular'],
            textSize: 10,
            textColor: ['get', 'textColor'],
            iconTextFit: "both",
            iconAllowOverlap: false,
            textAllowOverlap: false
        });
        symbols.addTo(map);
        
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