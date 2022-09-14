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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findtextbyrules
        // --根据规则查找相关联的文字--根据有规则的图形查找相关联的实体如文字
        // js代码
        // 新建地图服务对象，传入服务地址和token
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
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        
        
        const drawDatas = []; // 格式为[{point: [x,y], text: "", color: "", objectid: "", bounds: []}
        
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
        
        
        
        const queryMapText = async () => {
            let query = await svc.conditionQueryFeature({
                // 查询所有文字(包括单行文本，多行文本、块注记文字，属性文字) 具体类型数字参考文档"服务端条件查询和表达式查询-支持的cad实体类型"
                condition: `(name='12' or name='13' or name='26' or name='27') and ((s4 like '%.%' or LENGTH(s4) <= 2) and s4 != "." )`, // 字符串有包含有小数点
                fields: "",
                limit: 100000 // 全部查吧
            })
            if (query.error) {
                message.error(query.error)
            } else {
                query.result.forEach(rst => {
                    rst.geoBounds = vjmap.GeoBounds.fromString(rst.bounds); // 获取范围
                    rst.position = vjmap.GeoPoint.fromString(rst.location); // 获取坐标
                })
                return  query.result;
            }
        }
        // 获取图中的文字信息
        let mapAllText = await queryMapText();
        console.log(mapAllText);
        
        // 查找所有为.的文字
        const queryDotText = async () => {
            let query = await svc.conditionQueryFeature({
                condition: `(name='12' or name='13' or name='26' or name='27') and (s4 == "." ) `,
                fields: "",
                limit: 100000 // 全部查吧
            })
            if (query.error) {
                message.error(query.error)
            } else {
                query.result.forEach(rst => {
                    rst.geoBounds = vjmap.GeoBounds.fromString(rst.bounds); // 获取范围
                })
                return  query.result;
            }
        }
        let mapDotTexts = await queryDotText();
        console.log(mapDotTexts);
        
        // 找点旁边最近的满足规则的文字
        mapDotTexts.forEach(r => {
            // 查找距离最近的一个
            let texts = mapAllText.filter(t => "NaN" != parseFloat(t)) // 所有数字
            let findTexts = texts.filter(t => t.position.distanceTo(r.geoBounds.center()) <= t.geoBounds.width() * 2) // 查找符合条件的文字
            // 找一个距离最近的
            if (findTexts.length > 0) {
                findTexts = findTexts.sort((a, b) => a.position.distanceTo(r.geoBounds.center()) - b.position.distanceTo(r.geoBounds.center()) )
                drawDatas.push({
                    point: r.geoBounds.center(),
                    text: findTexts[0].text,
                    color: "#0f0",
                    objectid: findTexts[0].objectid,
                    bounds: findTexts[0].geoBounds
                })
            }
        
        })
        
        // 查找所有圆
        const queryCircles = async () => {
            let query = await svc.conditionQueryFeature({
                condition: `name='7'`,
                fields: "",
                limit: 100000 // 全部查吧
            })
            if (query.error) {
                message.error(query.error)
            } else {
                query.result.forEach(rst => {
                    rst.geoBounds = vjmap.GeoBounds.fromString(rst.bounds); // 获取范围
                    /*
                    //下面的代码用来临时调试数据，输出宽和高
                    drawDatas.push({
                        point: rst.geoBounds.center(),
                        text: rst.geoBounds.width() + "," + rst.geoBounds.height(),
                        color: "#00f"
                    })*/
        
                })
                query.result =  query.result.filter(rst => vjmap.isZero(rst.geoBounds.width() - 4000, 1) && vjmap.isZero(rst.geoBounds.height() - 4000, 1))
                return  query.result;
            }
        }
        let mapCircles = await queryCircles();
        console.log(mapCircles);
        
        // 找圆中里面的文字
        mapCircles.forEach(r => {
            // 查找距离最近的一个
            let findTexts = mapAllText.filter(t => r.geoBounds.contains(t.position)) // 查找符合条件的文字，文字并且包含在圆中
            // 找一个距离最近的
            if (findTexts.length > 0) {
                drawDatas.push({
                    point: r.geoBounds.center(),
                    text: findTexts[0].text,
                    color: "#f0f",
                    objectid: findTexts[0].objectid,
                    bounds: findTexts[0].geoBounds
                })
            }
        
        })
        
        console.log(drawDatas)
        // 把数据显示到图上
        let symbols;
        const showDataInMap = (datas)=> {
            let geoDatas = []
            for(let i = 0; i < datas.length; i++) {
                const pt = datas[i].point;
                const data = {
                    point: map.toLngLat(pt),
                    properties: {
                        text:  datas[i].text,
                        textColor: datas[i].color,
                        objectid: datas[i].objectid,
                        bounds: datas[i].bounds.toString()
                    }
                }
                geoDatas.push(data);
            }
            if (symbols) {
                symbols.remove();// 如果有先删除了
            }
            symbols = new vjmap.Symbol({
                data: geoDatas,
                iconImage: "stretchTextBackImg",
                iconAnchor: "bottom",
                iconOpacity: 0.5,
                iconOffset: [-2, -10],
                textTranslate: [-2, -6],
                textAnchor: "bottom",
                textField: ['get', 'text'],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 18,
                textColor: ['get', 'textColor'],
                iconTextFit: "both",
                iconAllowOverlap: true,
                textAllowOverlap: true
            });
            symbols.addTo(map);
            // 点击文字定位要查找的文字上面
            symbols.clickLayer(e => {
                flashPos(e.features[0].properties.bounds)
            })
        }
        showDataInMap(drawDatas);
        
        // 定位闪烁实体
        const flashPos = (bounds) => {
            return new Promise((resolve => {
                bounds = vjmap.GeoBounds.fromString(bounds)
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