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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/05drawcadedit
        // --CAD图在线编辑--能对CAD图进行修改、删除、新增操作，并且导出为dwg图
        // 注: 此示例中引用了vjcommon库。此库是对唯杰地图常用的功能做了一定程度的封装，方便其他工程共用
        // vjcommon库可在 html 中引入`vjcommon.min.js`即可,或npm install vjcommon`通过`import vjcommon from 'vjcommon'`引入
        // vjcommon库是开源的。开源地址 https://github.com/vjmap/vjmap-common
        // 注: 此示例中引用了vjgeo库。此库是对几何模型做了一定程度的封装，方便其他工程共用
        // vjgeo库可在 html 中引入`vjgeo.min.js`即可,或npm install vjgeo`通过`import vjgeo from 'vjgeo'`引入
        // 几何模型帮助文档 https://vjmap.com/guide/geomodel.html
        // 几何模型API文档 https://vjmap.com/docs/geomodel/
        // 几何模型的更多示例代码地址 https://vjmap.com/demo/#/demo/map/models/01geomodels
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
            style: svc.vectorStyle(), // 矢量瓦片样式
            center: [45.14,4.47], // 中心点
            zoom: 6,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        // map.fitMapBounds();
        await map.onLoad();
        map.doubleClickZoom.disable(); // 禁止双击放大
        
        // 绘制参数
        let strokeColor = "#ff0000";  // 边框色
        let fillColor = "#00ffff"; // 填充色
        let lineWidth = 1; // 线宽
        let fillOpacity = 1.0; // 填充透明度
        let pointPixel = 5; // 点像素大小
        let extrusionHeight = 500000; // 默认拉伸高度
        let isSnapMap = true; // 捕捉地图上面的点
        let isSnap = true;// 捕捉绘制的点
        
        // 更新地图样式对象
        const updateMapStyleObj = vjcommon.createUpdateMapStyleObj(map);
        const opts = vjmap.cloneDeep(vjmap.Draw.defaultOptions());
        opts.isActionDrawMode = true; // 按钮都隐藏，界面用自己的
        let snapObj = {};
        // 如果是为cad为底图，则可以捕捉dwg图上的点
        vjcommon.getMapSnapPoints(map, snapObj);
        const draw = map.getDrawLayer();
        const getDrawOptions = () => {
            let mapSnapFeatures = [];
            if (isSnapMap) {
                // @ts-ignore
                mapSnapFeatures = snapObj.features;
            }
            let drawFeatures = [];
            if (typeof draw != 'undefined') {
                drawFeatures = draw.getAll().features;
            }
            return {
                ...opts,
                snap: isSnap, // 是否启用捕捉节点
                guides: isSnap,// 是否启用捕捉网格
                api: {
                    getSnapFeatures: isSnap ? {
                        ...snapObj,
                        features: [
                            ...mapSnapFeatures,
                            ...drawFeatures
                        ]
                    } : {} //捕捉地图上的数据点 要捕捉的数据项在后面，通过属性features赋值
                }
            }
        }
        
        const addDwgDocToMap = async (doc) => {
            let dwgDoc = new vjmap.DbDocument();
            dwgDoc.entitys = doc.entitys
            let geojson = await map.createDbGeomData(dwgDoc);
            let result = await vjcommon.interactiveCreateGeom(geojson, map);
            if (!(result && result.feature && result.feature.features)) return;
            let mapJson = draw.getAll();
            result.feature.features.forEach(f => f.id = vjmap.RandomID(10)); //防止加入后 id 重复
            mapJson.features.push(...result.feature.features);
            draw.set(mapJson);
        }
        const addModelToMap = async (modelName, context) => {
            // 先获取模型默认的参数
            let param = vjgeo.models[modelName].metaParameters;
            if (context) {
                let value = JSON.stringify(param.map(p => {return {title: p.title, value: (p.type == 'select') ? p[0] : p}}), null, 0)
                let content = await context.prompt("请输入绘制的参数", value);
                if (!content) return;
                param = JSON.parse(content)
            }
            let args = param.map(p => p); // 获取参数值
            let model = new vjgeo.models[modelName](...args);
            model.data = {
                ...model.data,
                color: vjmap.htmlColorToEntColor(strokeColor),
                isFill: vjmap.randInt(0, 3) == 0
            }
            let dwgDoc = vjgeo.exporter.toDWG(model);
            await addDwgDocToMap(dwgDoc);
        }
        let geoModelMenus = []; // 几何模型的菜单, 根据内置的几何模型自动生成
        geoModelMenus = Object.keys(vjgeo.models).sort().map(modelName => {
            return {
                id: modelName,
                name: modelName,
                cb: (context) => {
                    addModelToMap(modelName, context)
                }
            }
        })
        
        const menus = [
            {
                name: "绘制",
                menus: [
                    {
                        id: "point",
                        name: "点",
                        cb: () => {
                            vjcommon.drawPoint(map, draw, {
                                ...getDrawOptions(),
                            }, {
                                "color_inactive": fillColor,// 编辑模式活动状态下点的颜色
                                "color_static": fillColor,// 预览模式活动状态下点的颜色
                                "radius_inactive": pointPixel,// 编辑模式活动状态下点的半径
                                "radius_static": pointPixel // 预览模式活动状态下点的半径
                            });
                        }
                    },
                    {
                        id: "line",
                        name: "线",
                        cb: () => {
                            vjcommon.drawLineSting(map, draw, getDrawOptions(), {
                                "color": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                            });
                        }
                    },
                    {
                        id: "polygon",
                        name: "多边形",
                        cb: () => {
                            vjcommon.drawPolygon(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            });
                        }
                    },
                    {
                        id: "fillExtrusion",
                        name: "拉伸",
                        cb: () => {
                            vjcommon.drawPolygon(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                                "extrusionHeight": extrusionHeight, // 拉伸高度
                            });
                        }
                    },
                    {
                        id: "circle",
                        name: "圆",
                        cb: () => {
                            vjcommon.drawCircle(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, false);
                        }
                    },
                    {
                        id: "fillcircle",
                        name: "填充圆",
                        cb: () => {
                            vjcommon.drawCircle(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, true);
                        }
                    },
                    {
                        id: "rectangle",
                        name: "矩形",
                        cb: () => {
                            vjcommon.drawRectangle(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, false);
                        }
                    },
                    {
                        id: "fillRectangle",
                        name: "填充矩形",
                        cb: () => {
                            vjcommon.drawRectangle(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, true);
                        }
                    },
                    {
                        id: "slantRectangle",
                        name: "斜矩形",
                        cb: () => {
                            vjcommon.drawSlantRectangle(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, false);
                        }
                    },
                    {
                        id: "fillSlantRectangle",
                        name: "填充斜矩形",
                        cb: () => {
                            vjcommon.drawSlantRectangle(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, true);
                        }
                    },
                    {
                        id: "text",
                        name: "文本",
                        cb: async (context) => {
                            let content = await context.prompt("请输入文字内容");
                            if (!content) return;
                            let param = {
                                text: content,
                                height: 30, // 文字初始像素高
                                disableScale: false, // 不指定缩放
                                disableRotate: false, // 不指定旋转
                            }
                            vjcommon.drawText(map, draw, {
                                ...getDrawOptions(),
                            }, {
                                "color": fillColor,// 颜色
                                ...param
                            }, message.info);
                        }
                    },
                    {
                        id: "fillEllipse",
                        name: "填充椭圆",
                        cb: () => {
                            vjcommon.drawEllipseFill(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, message.info);
                        }
                    },
                    {
                        id: "ellipse",
                        name: "椭圆",
                        cb: () => {
                            vjcommon.drawEllipseEdge(map, draw, getDrawOptions(), {
                                "color": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                            }, message.info);
                        }
                    },
                    {
                        id: "fillEllipseArc",
                        name: "填充扇形",
                        cb: () => {
                            vjcommon.drawEllipseFillArc(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, message.info);
                        }
                    },
                    {
                        id: "ellipseArc",
                        name: "椭圆弧",
                        cb: () => {
                            vjcommon.drawEllipseArc(map, draw, getDrawOptions(), {
                                "color": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                            }, message.info);
                        }
                    },
                    {
                        id: "arrow",
                        name: "创建箭头",
                        cb:  () => {
                            let param = {
                                lineWidth: 50,
                                contents: "箭头",
                                noLineType: false,
                                noText: false,
                                textPositon: [100, 70],
                                textHeight: 20,
                                arrowShape: [
                                    [10, 60],
                                    [150, 20],
                                    [140, 40],
                                    [190, 0],
                                    [140, -40],
                                    [150, -20],
                                    [10, -40],
                                    [10, 60],
                                ]
                            };
                            vjcommon.drawArrow(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, message.info, param);
                        }
                    },
                    {
                        id: "lineTypePolyline",
                        name: "线型线段",
                        cb: () => {
                            let param = {
                                mapid: "sys_symbols",
                                version: "v1",
                                linetypeScale: 100,
                                objectid: '40D'
                            };
                            vjcommon.createLineTypePolyline(map, draw, getDrawOptions(), {
                                "color": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                            }, message.info, param);
                        }
                    },
                    {
                        id: "lineTypeCurve",
                        name: "线型曲线",
                        cb: () => {
                            let param = {
                                mapid: "sys_symbols",
                                version: "v1",
                                linetypeScale: 100,
                                objectid: '40E'
                            };
                            vjcommon.createLineTypeCurve(map, draw, getDrawOptions(), {
                                "color": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                            }, message.info, param);
                        }
                    },
                    {
                        id: "symbolHatch",
                        name: "符号填充",
                        cb: () => {
                            let param = {
                                mapid: "sys_symbols",
                                version: "v1",
                                patternScale: 400,
                                objectid: '42F'
                            };
                            vjcommon.createHatch(map, draw, getDrawOptions(), {
                                "color": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "outlineColor": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, message.info, param);
                        }
                    },
                    {
                        id: "insertOutSymbol",
                        name: "插入外部符号",
                        cb: () => {
                            let param = {
                                mapid: "sys_symbols",
                                version: "v1",
                                condition: 'layerindex=1'
                            };
                            vjcommon.createOutSymbol(map, draw, getDrawOptions(), {
                                "fillColor": fillColor,// 颜色
                                "opacity": fillOpacity, // 透明度
                                "color": strokeColor,// 颜色
                                "line_width": lineWidth, // 线宽
                                "line_opacity": fillOpacity, // 透明度
                            }, message.info, param);
                        }
                    }
                ]
            },{
                name: "修改",
                menus: [
                    {
                        id: "undo",
                        name: "撤销",
                        cb: () => {
                            draw.undo();
                        }
                    },
                    {
                        id: "redo",
                        name: "重做",
                        cb: () => {
                            draw.redo();
                        }
                    },
                    {
                        id: "trash",
                        name: "删除所选实体",
                        tooltip: "请先选中要删除的绘制对象，再点击删除",
                        cb: () => {
                            draw.trash();
                        }
                    },
                    {
                        id: "scaleRotate",
                        name: "缩放旋转",
                        tooltip: "先选择要旋转缩放的对象，再点击缩放旋转",
                        cb: () => {
                            draw.changeMode("scaleRotateMode");
                        }
                    },
                    {
                        id: "combine",
                        name: "组合实体",
                        tooltip:
                            "把多条线组合成多线，或多个多边形组合成多多边形，请先选择多条线或多个多边形再点击此按钮操作",
                        cb: () => {
                            draw.combineFeatures();
                        }
                    },
                    {
                        id: "unCombine",
                        name: "取消组合实体",
                        tooltip:
                            "把多线拆分成多条线，或多多边形拆分成多个多边形，请先选择多线或多多多边形再点击此按钮操作",
                        cb: () => {
                            draw.uncombineFeatures();
                        }
                    },
                    {
                        id: "splitLine",
                        name: "分割线",
                        tooltip:
                            "(1)选中要裁剪的线，点击“分割线”，绘制一条临时线对选中的线分割。(2)分割线后，点击“取消组合实体”，这样分割线分成两部分了.(3)如要删除，选中要删除的，按delete键就可以了",
                        cb: () => {
                            draw.changeMode("splitLineMode");
                        }
                    },
                    {
                        id: "cutPolygon",
                        name: "分割多边形",
                        tooltip: "先选择要分割的多边形，再绘制一个多边形，对选择的多边形进行分割",
                        cb: () => {
                            draw.changeMode("cutPolygonMode");
                        }
                    },
                    {
                        id: "polygonToPolyline",
                        name: "多边形转多段线",
                        tooltip: "选择一个多边形，转为多段线",
                        cb: () => {
                            const sels = draw.getSelectedIds();
                            if (sels.length == 0) return;
                            const ents = draw.getAll();
                            for (let i = 0; i < sels.length; i++) {
                                const idx = ents.features.findIndex((f) => f.id == sels[i]);
                                if (idx == -1) continue;
                                const feature = ents.features[idx];
                                if (feature.geometry.type != "Polygon") continue;
                                feature.geometry.type = "LineString";
                                // @ts-ignore
                                feature.geometry.coordinates = feature.geometry.coordinates[0];
                            }
                            const newEnts = vjmap.cloneDeep(ents);
                            draw.deleteAll();
                            draw.set(newEnts);
                        }
                    },
                    {
                        id: "toMultiPolygon",
                        name: "转为多多边形",
                        tooltip: "选择多个多边形，转成多多边形",
                        cb: () => {
                            draw.doAction("toMultiPolygon");
                        }
                    },
                    {
                        id: "toBezierCurve",
                        name: "转为曲线",
                        tooltip: "选择一条线段，转为曲线",
                        cb: () => {
                            vjcommon.toBezierCurve(map, draw);
                        }
                    },
                    {
                        id: "selectRotate",
                        name: "选择多个旋转",
                        tooltip: "选择多个要旋转的对象，进行旋转操作",
                        cb: () => {
                            vjcommon.selectRotate(map, draw, getDrawOptions(), message.info);
                        }
                    },
                    {
                        id: "hideSelected",
                        name: "隐藏所选实体",
                        cb: () => {
                            const sels = draw.getSelectedIds();
                            if (sels.length == 0) return;
                            for (const featureId of sels) {
                                draw.setFeatureProperty(featureId, "isOff", true); // isOff属性设置为true，即为隐藏了
                            }
                            draw.changeMode("simple_select");
                        }
                    },
                    {
                        id: "showAllFeatures",
                        name: "显示全部实体",
                        cb: () => {
                            const ents = draw.getAll();
                            if (ents.features.length == 0) return;
                            for (const feature of ents.features) {
                                // @ts-ignore
                                draw.setFeatureProperty(feature.id, "isOff", undefined); // isOff属性移除了。默认就是显示
                            }
                            // 刷新下
                            draw.forceRefresh()
                        }
                    },
                    {
                        id: "lockedSelected",
                        name: "锁定所选实体",
                        tooltip: "锁定所选实体，锁定的实体将不允许进行编辑",
                        cb: () => {
                            const sels = draw.getSelectedIds();
                            if (sels.length == 0) return;
                            for (const featureId of sels) {
                                draw.setFeatureProperty(featureId, "isLocked", true);
                            }
                            draw.changeMode("simple_select");
                        }
                    },
                    {
                        id: "unLockedAllFeatures",
                        name: "解锁全部实体",
                        tooltip: "解锁全部实体，解锁的实体将允许进行编辑",
                        cb: () => {
                            const ents = draw.getAll();
                            if (ents.features.length == 0) return;
                            for (const feature of ents.features) {
                                // @ts-ignore
                                draw.setFeatureProperty(feature.id, "isLocked", undefined); //属性移除了。默认就是不锁定
                            }
                            draw.changeMode("simple_select");
                        }
                    },
                    {
                        id: "deleteAll",
                        name: "清空全部实体",
                        cb: () => {
                            let ret = confirm("您确定要清空所有绘制的对象??");
                            if (!ret) return
                            draw.deleteAll(); // 不能撤销还原
                        }
                    },
                    {
                        id: "save",
                        name: "保存至本地缓存",
                        cb: async () => {
                            let entsJson = draw.getAll();
                            // 转成地理坐标
                            entsJson = map.fromLngLat(entsJson);
                            const curParam = map.getService().currentMapParam() || {};
                            // 用地图的mapid和版本号做为key值，把数据保存起来，这里演示只是做数据保存到了localStorage,实际中请保存至后台数据库中
                            const key = `map_drawdata_${curParam.mapid}_${curParam.version}${map
                                .getService()
                                .getCurWorkspaceName()}`;
                            await vjcommon.cacheStorage.setValueByKey(key, entsJson, true)
                            message.info("保存成功");
                        }
                    },
                    {
                        id: "load",
                        name: "从本地缓存加载",
                        cb: async () => {
                            const curParam = map.getService().currentMapParam() || {};
                            const key = `map_drawdata_${curParam.mapid}_${curParam.version}${map
                                .getService()
                                .getCurWorkspaceName()}`;
                            const data = await vjcommon.cacheStorage.getValueByKey(key, false);
                            if (data != "") {
                                try {
                                    vjcommon.loadDataToDraw(map, draw, data, updateMapStyleObj)
                                    message.info("加载成功");
                                } catch (error) {
                                    message.error(error);
                                }
                            }
                        }
                    }
                ]
            },{
                name: "编辑CAD图",
                menus: [
                    {
                        id: "modifyCADByPointSel",
                        name: "修改CAD图形(点选)",
                        cb: async (context) => {
                            await vjcommon.modifyCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, false);
                        }
                    },
                    {
                        id: "deleteCADByPointSel",
                        name: "删除CAD图形(点选)",
                        cb: async (context) => {
                            await vjcommon.deleteCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, false);
                        }
                    },
                    {
                        id: "copyCADByPointSel",
                        name: "复制CAD图形(点选)",
                        cb: async (context) => {
                            await vjcommon.copyCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, false);
                        }
                    },
                    {
                        id: "modifyCADByRectSel",
                        name: "修改CAD图形(框选)",
                        divided: true, // 分隔符
                        cb: async (context) => {
                            await vjcommon.modifyCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, true);
                        }
                    },
                    {
                        id: "deleteCADByRectSel",
                        name: "删除CAD图形(框选)",
                        cb: async (context) => {
                            await vjcommon.deleteCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, true);
                        }
                    },
                    {
                        id: "copyCADByRectSel",
                        name: "复制CAD图形(框选)",
                        cb: async (context) => {
                            await vjcommon.copyCadEntity(map, draw, updateMapStyleObj,  message.info, context.confirm, true);
                        }
                    },
                    {
                        id: "exportCAD",
                        name: "导出为新的CAD图形",
                        divided: true,
                        cb: async ()=>{
                            message.info("正在导出dwg并打开，请稍候...")
                            const res = await vjcommon.exportDwg(map, draw);
                            if (res.error) {
                                window.$message.error(res.error);
                                return;
                            }
                            const isCloud = map.getService().serverUrl.indexOf("vjmap.com") >= 0;
                            const host = isCloud ? "https://vjmap.com/app/cloud" : (window.location.origin + "/_cloud");
                            const url = host + `/#/map/${res.mapid}?mapopenway=Memory&version=${res.version}`;
                            window.open(url);
                        }
                    },
                    {
                        id: "exportPdf",
                        name: "导出为PDF",
                        divided: true,
                        cb: async ()=>{
                            message.info("正在导出Pdf并打开，请稍候...")
                            const res = await vjcommon.exportDwg(map, draw);
                            if (res.error) {
                                window.$message.error(res.error);
                                return;
                            }
        
                            let param; // 不填的话，用默认的
                            /*
                            param = {
                                bIncludeOffLayers: false, // 是否包含关闭的图层
                                bSearchableSHX: false, // 可搜索型文字
                                bSearchableTTF: false, // 可搜索ttf文字
                                pageWidth: 210, // 宽，单位mm
                                pageHeight: 297, // 高，单位mm
                                pageLeftMargin: 0, // 左页边距 （pageWidth, pageHeight有值时有效）
                                pageRightMargin: 0, // 右页边距 （pageWidth, pageHeight有值时有效）
                                pageTopMargin: 0, // 上页边距 （pageWidth, pageHeight有值时有效）
                                pageBottomMargin: 0, // 下页边距 （pageWidth, pageHeight有值时有效）
                                geomDPI: 600, // 矢量dpi
                                colorImagesDPI: 400, //图像dpi
                                isBlackWhiteMode: false, // 是否导出为黑白模式
                                isGrayMode: false, // 是否导出为灰色模式
                            }*/
                            const result = await svc.execCommand("exportPdf", param, res.mapid, res.version, true);
                            if (result.error) {
                                message.error(result.error)
                            } else {
                                let pdfUrl = svc.baseUrl() + result.path + "?token=" + svc.accessToken;
                                window.open(pdfUrl, )
                            }
                        }
                    }
                ]
            },{
                name: "测量",
                menus: [
                    {
                        id: "measureDist",
                        name: "测量距离",
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureDist");
                        }
                    },
                    {
                        id: "measureArea",
                        name: "测量面积",
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureArea");
                        }
                    },
                    {
                        id: "measureAngle",
                        name: "测量角度",
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureAngle");
                        }
                    },
                    {
                        id: "measureCoordinate",
                        name: "测量坐标",
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureCoordinate");
                        }
                    },
                    {
                        id: "measureCancel",
                        name: "取消测量",
                        divided: true,
                        cb: async ()=>{
                            await vjcommon.runMeasureCmd(map, "measureCancel");
                        }
                    }
                ]
            }, {
                name: "几何模型",
                menus: [...geoModelMenus]
            }, {
                name: "布局克隆",
                menus: [{
                    id: "cloneToRow",
                    name: "行布局",
                    cb: (context) => {
                        cloneModel("cloneToRow", context)
                    }
                },{
                    id: "cloneToColumn",
                    name: "列布局",
                    cb: (context) => {
                        cloneModel("cloneToColumn", context)
                    }
                },{
                    id: "cloneToGrid",
                    name: "网格布局",
                    cb: (context) => {
                        cloneModel("cloneToGrid", context)
                    }
                },{
                    id: "cloneToBrick",
                    name: "砖块布局",
                    cb: (context) => {
                        cloneModel("cloneToBrick", context)
                    }
                },{
                    id: "cloneToHoneycomb",
                    name: "蜂窝布局",
                    cb: (context) => {
                        cloneModel("cloneToHoneycomb", context)
                    }
                },{
                    id: "cloneToRadial",
                    name: "径向布局",
                    cb: (context) => {
                        cloneModel("cloneToRadial", context)
                    }
                }]
            },{
                name: "其他",
                menus: [
                    {
                        id: "jsonView",
                        name: "查看绘制的JSON数据",
                    },
                    {
                        id: "snapMap",
                        name: "捕捉地图上的点",
                        cb: () => {
                            isSnapMap = true;
                        }
                    },
                    {
                        id: "noSnapMap",
                        name: "不捕捉地图上的点",
                        cb: () => {
                            isSnapMap = false;
                        }
                    },
                    {
                        id: "snapDraw",
                        name: "捕捉绘制上的点",
                        cb: () => {
                            isSnap = true;
                        }
                    },
                    {
                        id: "noSnapDraw",
                        name: "不捕捉绘制上的点",
                        cb: () => {
                            isSnap = false;
                        }
                    }
                ]
            }
        ]
        
        // 克隆模型
        const cloneModel = async (methodName, context) => {
            message.info("请选择已绘制好的，要克隆的实体，按右键结束.")
            let selected = await vjmap.Draw.actionSelect(map, draw);
            if (selected.features.length == 0) {
                message.info("您没有选择任何实体哦")
                return
            }
            // 把查询的geojson转成几何模型
            let symbol = vjgeo.importer.fromGeoJsonData(map.fromLngLat(selected));
            // 获取符号的范围
            let extent = vjgeo.measure.modelExtents(symbol)
            // 对模型进行网格布局
            let model;
            let param;
            let margin = +(extent.width / 2).toFixed(2);
            if (methodName == "cloneToRow" || methodName == "cloneToColumn") {
                param = [{title:"count",value:4},{title:"margin",value:margin}]
            } else  if (methodName == "cloneToGrid" || methodName == "cloneToBrick" || methodName == "cloneToHoneycomb") {
                param = [{title:"xCount",value:4},{title:"yCount",value:3},{title:"margin",value:margin}]
            } else if (methodName == "cloneToRadial") {
                message.info("请指定中心点")
                let origin = await vjmap.Draw.actionDrawPoint(map);
                let center = map.fromLngLat(origin.features[0].geometry.coordinates);
                param = [{title:"count",value:8},{title:"angleInDegrees",value:45},{title:"rotationOrigin",value:[center.x,center.y]}]
            }
            if (!param) return;
            param = JSON.stringify(param, null, 0)
            let content = await context.prompt("请输入布局克隆的参数", param);
            if (!content) return;
            param = JSON.parse(content)
            let args = param.map(p => p); // 获取参数值
            model = vjgeo.layout[methodName](symbol, ...args);
            if (!model) return;
            // 直接转成geojson
            let json = vjgeo.exporter.toDWG(model, { isGeoJson: true});
            // 交互式绘制geojson
            let result = await vjcommon.interactiveCreateGeom(map.toLngLat(json), map, null, null, {disableScale: true,keepGeoSize:true});
            if (!(result && result.feature && result.feature.features)) return;
            let mapJson = draw.getAll();
            result.feature.features.forEach(f => f.id = vjmap.RandomID(10)); //防止加入后 id 重复
            mapJson.features.push(...result.feature.features);
            draw.set(mapJson);
        }
        
        // 颜色值改变事件
        const onColorChange = (props) => {
            strokeColor = props.strokeColor;
            fillColor = props.fillColor;
        
            // 修改属性
            let data = draw.getSelected();
            for (let i = 0; i < data.features.length; i++) {
                let feature = data.features[i];
                if (feature.geometry.type == "LineString" || feature.geometry.type == "MultiLineString") {
                    draw.setFeatureProperty(feature.id, "color", strokeColor);
                } else if (feature.geometry.type == "Polygon" || feature.geometry.type == "MultiPolygon") {
                    draw.setFeatureProperty(feature.id, "outlineColor", strokeColor);
                } else if (feature.geometry.type == "GeometryCollection") {
                    draw.setFeatureProperty(feature.id, "color", strokeColor);
                }
            }
            for (let i = 0; i < data.features.length; i++) {
                let feature = data.features[i];
                if (feature.geometry.type == "Polygon"  || feature.geometry.type == "MultiPolygon") {
                    draw.setFeatureProperty(feature.id, "color", fillColor);
                } else if (feature.geometry.type == "GeometryCollection" ) {
                    draw.setFeatureProperty(feature.id, "fillColor", fillColor);
                } else if (feature.geometry.type == "Point" || feature.geometry.type == "MultiPoint") {
                    draw.setFeatureProperty(feature.id, "color_inactive", fillColor);
                    draw.setFeatureProperty(feature.id, "color_static", fillColor);
                }
            }
            map.triggerRepaint();
            draw.forceRefresh();
        }
        if (typeof Vue !== "object") {
            // 如果没有vue和elementui环境
            await vjmap.addScript([{
                src: "../../js/vue@2.js"
            }, {
                src: "../../js/element-ui@2.15.10/index.js"
            },{
                src: "../../js/element-ui@2.15.10/index.css"
            }])
        }
        
        let app = new Vue({
            el: '#ui',
            data: {
                dialogVisible: false,
                strokeColor: "#ff0000",
                fillColor: "#00ffff",
                menus: menus,
                jsonData: ''
            },
            watch: {
                strokeColor(val) {
                    onColorChange({
                        strokeColor: val,
                        fillColor: this.strokeColor,
                    });
                },fillColor(val) {
                    onColorChange({
                        strokeColor: this.strokeColor,
                        fillColor: val,
                    });
                }
            },
            methods: {
                handleMeasureSelect(cmdId) {
                    vjcommon.cancelDraw(map); // 点击一个命令时，先取消上次的绘制
                    let func;
                    for(let group of menus) {
                        const menu = group.menus.find(m => m.id == cmdId);
                        if (menu) {
                            func = menu.cb;
                            if (menu.tooltip) {
                                message.info(menu.tooltip)
                            }
                            break;
                        }
                    }
                    if (func) func(this);
                    else if (cmdId == "jsonView") {
                        let data = draw.getAll();
                        if (draw.getSelectedIds().length > 0) {
                            // 如果有选择的，则看选择的数据
                            data = draw.getSelected()
                        }
                        this.jsonData = JSON.stringify(map.fromLngLat(data), null, 4);
                        this.dialogVisible = true;
                    } else {
                        message.error("unknown command " + cmdId)
                    }
                },
                prompt(content, inputValue) {
                    return new Promise((resolve, reject) => {
                        this.$prompt(content, '提示', {
                            inputValue,
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            closeOnClickModal: false
                        }).then(({ value }) => {
                            resolve(value)
                        }).catch(() => {
                            reject();
                        });
                    })
                },
                confirm(content) {
                    return new Promise((resolve, reject) => {
                        this.$confirm(content, '提示', {
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            type: 'warning'
                        }).then(() => {
                            resolve(true);
                        }).catch(() => {
                            resolve();
                        });
                    })
                }
            },
            template: `
              <template>
                <div style="position: absolute; z-index: 2;left:10px; top:10px">
                  <el-row>
                    <el-button-group size="mini" >
                      <el-dropdown size="mini" @command="handleMeasureSelect" v-for="menu in menus" :key="menu.name">
                        <el-button type="primary" size="mini" plain>{{menu.name}}</el-button>
                        <el-dropdown-menu slot="dropdown">
                          <el-dropdown-item :command="m.id" v-for="m in menu.menus" :divided="m.divided">{{m.name}}</el-dropdown-item>
                        </el-dropdown-menu>
                      </el-dropdown>
                    </el-button-group>
                    <el-tag type='success' size="medium">边框色</el-tag>
                    <el-color-picker v-model="strokeColor" size="mini" style="top:10px"></el-color-picker>
                    <el-tag type='success' size="medium">填充色</el-tag>
                    <el-color-picker v-model="fillColor" size="mini" style="top:10px"></el-color-picker>
                  </el-row>
                  <el-dialog
                    title="查看"
                    :visible.sync="dialogVisible"
                    :modal="false"
                    width="550px">
                    <el-form  label-width="140px" size="mini">
                      <el-input
                        type="textarea"
                        :rows="15"
                        v-model="jsonData">
                      </el-input>
                    </el-form>
                  </el-dialog>
                </div>
              </template>
            `
        })
        
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