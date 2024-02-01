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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/21conditionquery
        // --条件查询定位闪烁实体--几何数据渲染模式下，在后台通过条件查询实体数据并定位闪烁到此实体
        // 把div背景改成浅色
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
            e && message.info(`type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`);
        })
        
        const flashPos = (bounds) => {
            return new Promise((resolve => {
                const routePath = [];
                routePath.push(bounds.min);
                routePath.push(vjmap.geoPoint([bounds.max.x, bounds.min.y]));
                routePath.push(bounds.max);
                routePath.push(vjmap.geoPoint([bounds.min.x, bounds.max.y]));
                routePath.push(bounds.min);
                let geoLineDatas = [];
                geoLineDatas.push({
                    points: map.toLngLat(routePath),
                    properties: {
                        opacity: 1.0
                    }
                })
        
                let polylines = new vjmap.Polyline({
                    data: geoLineDatas,
                    lineColor: 'yellow',
                    lineWidth: 3,
                    lineOpacity: ['get', 'opacity'],
                    isHoverPointer: false,
                    isHoverFeatureState: false
                });
                polylines.addTo(map);
        
                vjmap.createAnimation({
                    from: 1,
                    to: 10,
                    duration: 1000,
                    onUpdate: (e) => {
                        const data = polylines.getData();
                        data.features[0].properties.opacity = parseInt(e) % 2 ? 1.0 : 0 ;
                        polylines.setData(data);
                    },
                    onStop: () => {
                        polylines.remove()
                        resolve({})
                    },
                    onComplete: () => {
                        polylines.remove()
                        resolve({})
                    }
                })
            }))
        }
        
        const { Button } = antd
        const App = () => {
            const handleClick = async () => {
                let query = await svc.conditionQueryFeature({
                    condition: `objectid='53D'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                    // 查询所有文字(包括单行文本，多行文本、块注记文字，属性文字) 具体类型数字参考文档"服务端条件查询和表达式查询-支持的cad实体类型"
                    // condition: `name='12' or name='13' or name='26' or name='27'`,
                    fields: ""
                })
                if (query.error) {
                    message.error(query.error)
                } else {
                    message.info(`查询到符合的记数条数：${query.recordCount}`)
                    if (query.recordCount > 0) {
                        let bounds = map.getEnvelopBounds(query.result[0].envelop);
                        // 演示两种不同的定位实体的方式
                        let n = vjmap.randInt(0, 1)
                        if (n == 0) {
                            let center = bounds.center();
                            map.flyTo({
                                center: map.toLngLat(center),
                                zoom: 4
                            });
                        } else {
                            let lnglatBouds = map.toLngLat(bounds);
                            map.fitBounds(lnglatBouds)
                        }
                        await flashPos(bounds)
                    }
                }
        
                /*
                    // 查找图中所有的块
                    // 实体id
                // 块objectid命名规则:块id_引用的块定义id1_引用的块定义id2(可能有多个)_实体id_#;
                // 表格命名规则:objectid命名规则:块id_引用的块定义id1_引用的块定义id2(可能有多个)_实体id_@;
                // 组objectid命名规则:实体id_实体内元素索引$组id;
                    let query = await svc.conditionQueryFeature({
                        condition: `objectid like '%#%'`,
                        fields: ""
                    })
        
                    let blockEnts = {}; // 块实体对应表
                    if (query.result) {
                        for(let i = 0; i < query.result.length; i++) {
                            let item = query.result[i];
                            let objId = item.objectid;
                            if (objId.indexOf("#") < 0) continue
                            let ids = objId.split("#");
                            let blockId = ids[0];
                            let entId = ids[1];
                            blockEnts[blockId] = blockEnts[blockId] || [];
                            blockEnts[blockId].push(objId);
                        }
                    }
        
                    console.log(`总共有 ${Object.keys(blockEnts).length} 个块实体`);
                 */
            };
            return (
                <Button type="primary" onClick={handleClick}>请点击此按钮查询objectid为'53D‘实体并定位闪烁此实体"</Button>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        
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