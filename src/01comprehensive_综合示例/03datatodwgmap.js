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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/03datatodwgmap
        // --数据自动生成CAD工程剖面图--根据数据在前端创建生成CAD格式的工程剖面图形
        // 剖面图模板来源地图id和版本
        let templateSectId = "template_sect";
        let templateSecVersion = "v1";
        // 图框模板来源id和版本
        const templateTkMapId = "template_tk";
        const templateTkVersion = "v1";
        // 注：以下所的有objectid来源方法为：
        // 在唯杰云端管理平台里面以内存方式打开模板图，然后点击相应实体，在属性面板中获取object值
        // 或者以几何渲染方式打开模板图，点击相应实体，在属性面板中获取object值，如果是块实体(objectid中有多个_),取第一个_前面的字符串
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        // 获取模板信息
        let tplInfo;
        // 获取模板中的信息
        const getTemplateInfo = async (templateSectId, version) => {
            let features = await getTemplateData(templateSectId, version);
            // 获取所有填充符号。先获取 填充符号 图层中的所有文字，文字上面的hatch就是填充符号
            let hatchInfos = features.filter(f => f.layername == "填充符号" && f.name == "AcDbMText").map(t => {
                let hatch = features.filter(f => f.layername == "填充符号" && f.name == "AcDbHatch").find(h =>
                    // 填充垂直方向位于文字上方，并且距离不能超过文字高度两倍，水平方向包含文字中心点水平方向
                    h.envelop.min.y > t.envelop.max.y &&
                    h.envelop.min.y - t.envelop.max.y < t.envelop.height() * 2 &&
                    h.envelop.min.x <= t.envelop.center().x &&
                    h.envelop.max.x >= t.envelop.center().x
                )
                if (!hatch) return;
                return {
                    name: t.text,
                    hatchObjectId: hatch.objectid
                }
            })
            // 获取绘制开始的位置线
            let lineInfo = features.filter(f => f.layername == "线" && f.name == "AcDbLine");
            let startLine;
            if (lineInfo.length > 0) {
                startLine = {
                    objectId: lineInfo[0].objectid,
                    positon: [lineInfo[0].envelop.min.x, lineInfo[0].envelop.min.y]
                }
            }
            return {
                startLine,
                hatchInfos
            }
        }
        
        // 模拟数据
        const mockData = (hatchNames, minCount) => {
            // 对填充符号次序先随机排序下，这样每次生成次序就不一样了
            hatchNames.sort(() => Math.random() - 0.5);
            let data = [];
            // 孔口个数
            let kongCount = vjmap.randInt(minCount, minCount * 2);
            for(let i = 0; i < kongCount; i++) {
                let item = {
                    name: '孔' + (i + 1),
                    x: 15 * (i + 1) + vjmap.randInt(0, 10) + 1000, // 孔口坐标x 生成随机数x
                    y: vjmap.randInt(100, 105), // 孔口坐标y 生成随机数y
                    stratums: [] // 分层数据
                }
                // 生成每层的信息
                let stratumCount = vjmap.randInt(5, hatchNames.length - 1);
                let stratumAllThickness = 0;
                for(let k = 0; k < stratumCount; k++) {
                    const thickness = vjmap.randInt(2, 6) // 随机生成一个厚度
                    item.stratums.push({
                        hatch: hatchNames[k],
                        thickness: thickness
                    })
                    stratumAllThickness += thickness;
                }
                item.stratumsThickness = stratumAllThickness; // 所有的厚度
                data.push(item);
            }
            return data;
        }
        // 创建剖面图
        const createSectDoc = async (sectData) => {
            // 获取要绘制的数据
            let drawData = sectData;
            // 获取最大和最小值
            let minX = Math.min(...drawData.map(d => d.x));
            let maxX = Math.max(...drawData.map(d => d.x));
            let minY = Math.min(...drawData.map(d => d.y));
            let maxY = Math.max(...drawData.map(d => d.y + d.stratumsThickness));
            minY = Math.floor(minY / 10) * 10; // 往10取整，刻度以10为单位
            maxY = Math.ceil(maxY / 10) * 10 + 10; // 往10取整，刻度以10为单位，稍长点
            let posMaxX = maxX - minX + 20; //x绘制位置，相对距离从标尺偏移十个像素
            let posMinX = 10;//x绘制位置，相对距离从标尺偏移十个像素
        
            const startPoint = tplInfo.startLine.positon;
        
            let doc = new vjmap.DbDocument();
            // 数据来源
            doc.from = `${templateSectId}/${templateSecVersion}`;
        
            // 把来源图的数据最后都清空，（这里的模板不需要清空，直接用了)
            // doc.isClearFromDb = true;
            let entitys = [];
        
            // 左边刻度
            entitys.push(new vjmap.DbLine({
                objectid: "169A2",
                start: startPoint,
                end: [startPoint[0], startPoint[1] + (maxY - minY)]
            }))
            for(let y = minY; y < maxY; y += 10) {
                let pt = [startPoint[0], startPoint[1] + maxY - y];
                entitys.push(new vjmap.DbLine({
                    start: pt,
                    end: [pt[0] - 2, pt[1]]
                }))
                // 刻度值
        
                entitys.push(new vjmap.DbText({
                    cloneObjectId: '168C8',
                    position: [pt[0] - 1, pt[1] + 0.2],
                    text: y + ''
                }))
            }
            // 右边刻度
            entitys.push(new vjmap.DbLine({
                cloneObjectId: "169A2", // 不是修改了，是克隆左边的刻度线
                start: [startPoint[0] + posMaxX, startPoint[1]],
                end: [startPoint[0] + posMaxX, startPoint[1] + (maxY - minY)]
            }))
            for(let y = minY; y < maxY; y += 10) {
                let pt = [startPoint[0], startPoint[1] + maxY - y];
                entitys.push(new vjmap.DbLine({
                    start: [pt[0] + posMaxX , pt[1]],
                    end: [pt[0]  + posMaxX + 2, pt[1]]
                }))
                // 刻度值
                entitys.push(new vjmap.DbText({
                    cloneObjectId: '168C8',
                    position: [pt[0] + posMaxX + 1, pt[1] + 0.2],
                    text: y + ''
                }))
            }
        
            // 修改线坐标
            entitys.push(new vjmap.DbLine({
                cloneObjectId:  tplInfo.startLine.objectId,
                start: [startPoint[0], startPoint[1]],
                end: [startPoint[0] + posMaxX, startPoint[1]]
            }))
        
        
            // 演示下块及属性字段的使用，这里用块创建一个孔口名称和x坐标，中间用横线隔开
            const blockName = "nameAndx";
            let block = new vjmap.DbBlock();
            block.name = blockName;
            block.origin = [0, 0]
            block.entitys = [
                new vjmap.DbAttributeDefinition({
                    position: [0, 0.2],
                    contents: "名称",
                    tag: "NAME",
                    colorIndex: 7, // 自动反色
                    horizontalMode: vjmap.DbTextHorzMode.kTextCenter,
                    verticalMode: vjmap.DbTextVertMode.kTextBottom, // kTextBottom,
                    height: 0.5,
                }),
                new vjmap.DbLine({
                    start: [-2, 0],
                    end: [2, 0]
                }),
                new vjmap.DbAttributeDefinition({
                    position: [0, -0.2],
                    contents: "X坐标",
                    tag: "POSX",
                    colorIndex: 7, // 自动反色
                    horizontalMode: vjmap.DbTextHorzMode.kTextCenter,
                    verticalMode: vjmap.DbTextVertMode.kTextTop, // kTextBottom,
                    height: 0.5,
                })
            ];
            doc.appendBlock(block);
            // 绘制每一个孔
            for(let i = 0; i < drawData.length; i++) {
                // 开始绘制的位置点
                let x = posMinX + drawData[i].x - minX;
                let y = startPoint[1] + maxY - drawData[i].y;
                // 名称和x,用上面的块创建块参照
                let blockRef = new vjmap.DbBlockReference();
                blockRef.blockname = blockName;
                blockRef.position =  [x + 1.5,  y + 3];
                // 修改属性定义值
                blockRef.attribute = {
                    NAME: drawData[i].name,
                    POSX: drawData[i].x
                }
                entitys.push(blockRef);
        
                // 一层一层绘制
                for(let k = 0; k < drawData[i].stratums.length; k++) {
                    let y2 = y - drawData[i].stratums[k].thickness;
                    let bounds = vjmap.GeoBounds.fromArray([x, y, x + 3, y2]);
                    let points = bounds.toPointArray(); // 转成点坐标格式
                    // 闭合
                    points.push(points[0]);
                    // 填充
                    entitys.push(new vjmap.DbHatch({
                        cloneObjectId: drawData[i].stratums[k].hatch.hatchObjectId,
                        points: points,
                        patternScale: 1.5
                    }))
                    // 边框
                    entitys.push(new vjmap.Db2dPolyline({
                        points: points
                    }))
        
                    // 绘制连接下一个孔的线
                    if (i != drawData.length - 1) {
                        const nextKongStratums = drawData[i + 1].stratums;
                        let nextX = posMinX + drawData[i + 1].x - minX;
                        let nextY = startPoint[1] + maxY - drawData[i + 1].y;
                        if (k < nextKongStratums.length) {
                            for(let n = 0; n <= k; n++) {
                                nextY = nextY - drawData[i + 1].stratums[n].thickness;
                            }
                            entitys.push(new vjmap.DbLine({
                                start: [x + 3, y2],
                                end: [nextX, nextY]
                            }))
                        }
                        // 水平间距
                        entitys.push(new vjmap.DbLine({
                            start: [x, startPoint[1]],
                            end: [x, startPoint[1] - 2]
                        }))
                        entitys.push(new vjmap.DbLine({
                            start: [nextX, startPoint[1]],
                            end: [nextX, startPoint[1] - 2]
                        }))
                        entitys.push(new vjmap.DbLine({
                            start: [x, startPoint[1] - 2],
                            end: [nextX, startPoint[1] - 2]
                        }))
                        // 间距值
                        entitys.push(new vjmap.DbText({
                            cloneObjectId: '168C8',
                            position: [(x + nextX) / 2, startPoint[1] - 1],
                            text: nextX - x,
                            horizontalMode: vjmap.DbTextHorzMode.kTextCenter, // kTextCenter
                            verticalMode: vjmap.DbTextVertMode.kTextVertMid // kTextVertMid,
                        }))
                    }
                    y = y2;
                }
                // 最下面写上累计厚度值
                entitys.push(new vjmap.DbText({
                    cloneObjectId: '168C8',
                    position: [x + 1.5, y - 0.2],
                    text: drawData[i].stratumsThickness,
                    horizontalMode: vjmap.DbTextHorzMode.kTextCenter, // kTextCenter
                    verticalMode: vjmap.DbTextVertMode.kTextTop // kTextTop,
                }))
        
        
            }
        
        
            entitys.push(new vjmap.DbText({
                objectid: '1687C',
                position: [(posMinX + posMaxX) / 2.0, startPoint[1] + maxY - minY + 10],
                /* 如果是相对位置，可以利用矩阵
                matrix: [
                    {
                        op: "translation",
                        vector: [相对偏移x, 相对偏移y]
                    }
                ],*/
                text: `剖面图${Date.now()}`
            }))
        
            // 绘制图框
            let bounds = vjmap.GeoBounds.fromArray([posMinX - 20, startPoint[1] + maxY - minY + 15, posMaxX + 10, startPoint[1] - 20]);
            let labelPos = [bounds.max.x, bounds.min.y];
            let points = bounds.toPointArray(); // 转成点坐标格式
            // 闭合
            points.push(points[0]);
            // 边框
            entitys.push(new vjmap.Db2dPolyline({
                points: points
            }))
            bounds = bounds.scale(1.02);
            points = bounds.toPointArray(); // 转成点坐标格式
            // 闭合
            points.push(points[0]);
            // 边框
            entitys.push(new vjmap.Db2dPolyline({
                points: points,
                lineWidth: 30 // mm
            }))
        
            let date = new Date();
            // 图框从其他模板插入，并修改块属性文字
            entitys.push(new vjmap.DbBlockReference({
                cloneObjectId: '6A1',
                cloneFromDb: `${templateTkMapId}/${templateTkVersion}`,
                position: labelPos,
                attribute: {
                    // 修改块中的属性字段
                    DATETIME: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
                    COMPANY: {
                        text: "唯杰地图VJMAP",
                        color: 0x00FFFF
                    }
                }
            }))
        
            entitys.push(new vjmap.DbLine({
                objectid: "168C8", // 这个模板文字不用了，直接删除了
                delete: true
            }))
            doc.entitys = entitys;
            // 创建完缩放至全图
            doc.isZoomExtents = true;
            return doc;
        }
        
        
        // 先得设置一个要图形的所有范围，这个范围是随便都没有有关系的。最后导出dwg时，会根据实体的所有坐标去自动计算真实的范围。
        let mapBounds = '[-10000,-10000,10000,10000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        mapExtent = mapExtent.square(); // 要转成正方形
        
        svc.setCurrentMapParam({
            darkMode: true, // 由于没有打开过图，所以主动设置黑色模式
            bounds: mapExtent.toString()
        })
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },// 矢量瓦片样式
            center: [0,0], // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        
        
        // 创建一个几何对象
        const createGeomData = async (map, doc) => {
            let svc = map.getService();
            let res = await svc.cmdCreateEntitiesGeomData({
                filedoc: JSON.stringify(doc)
            });
            if (res.error) {
                message.error(res.error);
                return {
                    type: "FeatureCollection",
                    features: []
                };
            }
            if (res.metadata && res.metadata.mapBounds) {
                // 如果返回的元数据里面有当前地图的范围，则更新当前地图的坐标范围
                map.updateMapExtent(res.metadata.mapBounds);
            }
        
            const features = [];
            if (res && res.result && res.result.length > 0) {
                for (let ent of res.result) {
                    if (ent.geom && ent.geom.geometries) {
                        let clr = map.entColorToHtmlColor(ent.color); // 实体颜色转html颜色
                        let featureAttr = {};
                        // 因为要组合成一个组合实体，所以线和多边形的颜色得区分
                        if (ent.isPolygon) {
                            featureAttr.color = clr; // 填充色，只对多边形有效
                            featureAttr.noneOutline = true; // 不显示多边形边框，只对多边形有效
                        } else {
                            featureAttr.color = clr; // 颜色
                            featureAttr.line_width = ent.lineWidth; // 线宽
                        }
                        for(let g = 0; g < ent.geom.geometries.length; g++) {
                            if (ent.geom.geometries[g].type == "Point") {
                                // 改成起始和终点一样的线
                                ent.geom.geometries[g].type = "LineString";
                                ent.geom.geometries[g].coordinates = [
                                    ent.geom.geometries[g].coordinates, // 始点
                                    ent.geom.geometries[g].coordinates // 终点
                                ]
                            }
                        }
        
                        let ft = {
                            id: vjmap.RandomID(10),
                            type: "Feature",
                            properties: {
                                objectid: ent.objectid,
                                opacity: ent.alpha / 255,
                                ...featureAttr,
                            }
                        }
                        if (ent.geom.geometries.length == 1) {
                            features.push({
                                ...ft,
                                geometry: ent.geom.geometries[0],
                            });
                        } else {
                            features.push({
                                ...ft,
                                geometry: {
                                    geometries: ent.geom.geometries,
                                    type: "GeometryCollection"
                                },
                            });
                        }
        
                    }
                }
            }
            return {
                type: "FeatureCollection",
                features: features,
            };
        };
        
        // 清空之前的地图数据
        const clearMapData = () => {
            svc.setCurrentMapParam({
                darkMode: true, // 由于没有打开过图，所以主动设置黑色模式
                bounds: mapExtent.toString()
            })
            map.disableLayerClickHighlight();
            map.removeDrawLayer();
            let sources = map.getStyle().sources;
            for(let source in sources) {
                map.removeSourceEx(source);
            }
        }
        
        // 创建一个有数据的地图
        const createDataMap = async (doc) => {
            clearMapData();
            let geojson = await createGeomData(map, doc);
            map.getDrawLayer().set(geojson);
        }
        
        // 创建一个dwg的地图
        const createDwgMap = async (doc) => {
            // 先清空之前绘制的
            clearMapData();
            // js代码
            let res = await svc.updateMap({
                // 获取一个临时的图id(临时图形只会用临时查看，过期会自动删除)
                mapid: vjmap.getTempMapId(1), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
                filedoc:JSON.stringify(doc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
                }
            })
            if (res.error) {
                message.error(res.error)
            }
            await map.switchMap(res);
        }
        
        
        let curDoc;
        const exportDwgOpen = async () => {
            if (!curDoc) return;
            const mapid = 'exportdwgmap';
            let res = await svc.updateMap({
                mapid: mapid,
                filedoc: JSON.stringify(curDoc),
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
                }
            })
            if (res.error) {
                message.error(res.error)
            } else{
                window.open(`https://vjmap.com/app/cloud/#/map/${res.mapid}?version=${res.version}&mapopenway=Memory&vector=false`)
            }
        }
        
        // 获取模板的所有数据
        const getTemplateData = async (mapid, version) => {
            let res = await svc.rectQueryFeature({
                mapid,
                version,
                fields: "",
                geom: false, // 以内存方式打开，获取真正的objectid
                maxGeomBytesSize: 0, // 不需要几何坐标
                useCache: true, // 因为是以内存方式打开，后台先把查询的数据保存进缓存，下次直接去缓存查找，提高效率
                // x1,y1,x2,y2同时不输的话，表示是查询整个图的范围  这范围不输入，表示是全图范围
            })
            // 把实体的范围字符串转成对象
            res.result.map(f => f.envelop = vjmap.GeoBounds.fromString(f.bounds));
            console.log(res.result)
            return res.result;
        }
        
        
        const creatSectDataMap = async () => {
            let sectData = mockData(tplInfo.hatchInfos, 5);
            const doc = await createSectDoc(sectData);
            await createDataMap(doc);
            map.fitMapBounds();
            curDoc = doc;
        }
        const creatSectDwgMap = async () => {
            let sectData = mockData(tplInfo.hatchInfos, 15);
            const doc = await createSectDoc(sectData);
            await createDwgMap(doc);
            map.fitMapBounds();
            // 点击有高亮状态（鼠标点击地图元素上时，会高亮)
            map.enableLayerClickHighlight(svc, e => {
                if (!e) return;
                let msg = {
                    content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                    key: "layerclick",
                    duration: 5
                }
                e && message.info(msg);
            })
            curDoc = doc;
        }
        // 先获取模板信息
        tplInfo = await getTemplateInfo(templateSectId, templateSecVersion);
        // 随机生成一个剖面图
        creatSectDataMap();
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: '430px'}}>
                        <div className="input-item">
                            <button className="btn btn-full mr0" onClick={creatSectDataMap}>随机生成一个剖面图[前端直接绘制,适合于生成图不大的情况]</button>
                            <button className="btn btn-full mr0" onClick={creatSectDwgMap}>随机生成剖面图[后台生成DWG前端展示,适合于生成图大的情况]</button>
                            <button className="btn btn-full mr0" onClick={exportDwgOpen}>导出成DWG图并打开</button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
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