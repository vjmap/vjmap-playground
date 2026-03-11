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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/03drawInputZ
        // --采集三维线--采集时可自动搜索文字获取当前点的高程值
        // // 采集的坐标转成 [x,z,y]格式，可参考此示例自动生成三维管道
        // https://vjmap.com/map3d/demo/#/demo/map/builtin/objects/03builtinobjtubepath
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: "sys_contour",
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: [-61.4111,-10.8756],
            zoom: 6,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        //map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
        let mapAllTexts;
        let textMeanHeight = 0; // 图中文字平均高
        const getAllTexts = async ()=> {
            if (mapAllTexts) return mapAllTexts; // 如果获取过了
            // 实体类型ID和名称映射
            const { entTypeIdMap } = await svc.getConstData();
            const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
        
            let queryTextEntTypeId = getTypeNameById("AcDbText"); // 单行文字
            let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // 多行文字
            let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // 属性定义文字
            let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // 属性文字
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                fields: "objectid,envelop,text",
                geom: true,
                limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
            })
            if (query.error) {
                message.error(query.error);
                return;
            } else {
                mapAllTexts = []
                textMeanHeight = 0
                if (query.recordCount > 0) {
                    for(let i = 0; i < query.recordCount; i++) {
                        let bounds = map.getEnvelopBounds(query.result[i].envelop);
                        mapAllTexts.push({
                            position: bounds.center(),
                            text: query.result[i].text
                        });
                        textMeanHeight += bounds.height()
                    }
                    textMeanHeight = textMeanHeight / query.recordCount
                }
            }
            return mapAllTexts
        }
        
        function isNumeric(value) {
            const regex = /^[0-9]*\.?[0-9]+$/;  // 匹配数字和一个小数点的模式
            return regex.test(value);
        }
        // 采集三维线 如果采集过程中需要捕捉图上的点，可参考示例 https://vjmap.com/demo/#/demo/map/draw/03drawSnap
        const collect3Dlines = async () => {
            // 给地图发送ESC键消息即可取消，模拟按ESC键，如果之前在采集，先取消之前的
            map.fire("keyup", { keyCode: 27 })
            if (vjmap.logInfo) vjmap.logInfo("请在图上采集线，按回车键或右键菜单里确认结束")
            let elevations = []
            let line = await vjmap.Draw.actionDrawLineSting(map, {
                updatecoordinate: async (e) => {
                    if (!e.lnglat) return;
                    if (e.isClick) {
                        let curIdx = e.feature.coordinates.length - 1
                        const co = map.fromLngLat(e.feature.coordinates[curIdx]);
                        // 获取当前点旁边所有的文字
                        let allTexts = await getAllTexts()
                        let radius = textMeanHeight * 2; // 以文字平均高度的2倍做为搜索距离 这个数值根据实际情况调节
                        // 先根据是否是数字，再根据距离过滤
                        let texts = allTexts.filter(item => isNumeric(item.text)).filter(item => vjmap.geoPoint(co).distanceTo(item.position) <= radius)
                        // 弹出输入框，并获取用户输入
                        // 这里为了演示，用js内置的prompt, 实际中可调出UI界面，把所有的texts列出来。让用户选择哪个做为高程值，或自已输入
                        let elevation
                        while(true) {
                            elevation = prompt("请输入高程值：", texts.map(item => item.text).join(" ")); // 把所有可能的高程值列出来，实际中可用列表框让用户选择
                            if (isNumeric(elevation)) {
                                break;
                            } else {
                                //vjmap.logInfo("必须要填入数值型", "error")
                            }
                        }
                        elevations.push(parseFloat(elevation))
                    }
        
                }, contextMenu: (e) => {
                    new vjmap.ContextMenu({
                        event: e.event.originalEvent,
                        theme: "dark", //light
                        width: "250px",
                        items: [
                            {
                                label: '确认',
                                onClick: () => {
                                    // 给地图发送Enter键消息即可取消，模拟按Enter键
                                    map.fire("keyup", { keyCode: 13 })
                                }
                            },
                            {
                                label: '取消',
                                onClick: () => {
                                    // 给地图发送ESC键消息即可取消，模拟按ESC键
                                    map.fire("keyup", { keyCode: 27 })
                                }
                            }, {
                                label: '删除上一个点',
                                onClick: () => {
                                    // 给地图发送退格键Backspace消息即可删除上一个点，模拟按Backspace键
                                    map.fire("keyup", { keyCode: 8 })
                                    elevations.pop(); // 删除最后一个元素
                                }
                            }, {
                                label: '结束',
                                onClick: () => {
                                    // 给地图发送ESC键消息即可取消，模拟按ESC键
                                    map.fire("keyup", { keyCode: 27 })
                                }
                            }
                        ]
                    });
        
                }
            })
            if (line.cancel) {
                return // 取消操作
            }
            let coords = map.fromLngLat(line.features[0].geometry.coordinates)
            for(let n = 0; n < coords.length; n++) {
                coords[n].z = elevations[n]
            }
            let tip = vjmap.logInfo ? vjmap.logInfo: alert;
            tip(`采集结束，坐标为 ${JSON.stringify(coords)}, 按f12在控制台里可复制`)
            console.log(coords)
        
            // 采集的坐标转成 [x,z,y]格式，可参考此示例自动生成三维管道 https://vjmap.com/map3d/demo/#/demo/map/builtin/objects/03builtinobjtubepath
            map.getDrawLayer().add(line.features[0]) // 此行非必须，是用来显示已经绘制过的线
        }
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>采集</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => collect3Dlines() }>采集三维线</button>
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