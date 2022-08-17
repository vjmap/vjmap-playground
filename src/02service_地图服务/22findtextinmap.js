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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findtextinmap
        // --查找相关图纸中的文字并定位--查找相关图纸中的文字并定位
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        
        message.info({
            content: `请点击图中的任何一个文字，如果相关图纸中的有类似文字，将会自动定位到此图纸的文字位置`,
            key: "textclick",
            duration: 3
        })
        
        // 要查找的图的文字的图id数组
        let findTextMapIds = ['sys_zp', 'sys_webwms'];
        let mapIdTextInfo = {};
        // （鼠标点击地图元素上时，根据文字内容去其他图形中查找相似的文字，并定位过去)
        map.enableLayerClickHighlight(svc, async (e) => {
            if (!e) return;
        
            // 如果点击的是文字(包括单行文本，多行文本、块注记文字，属性文字)
            if (e.name === "AcDbText" || e.name === "AcDbMText" || e.name === "AcDbAttributeDefinition" || e.name === "AcDbAttribute") {
                let text = e.text; // 获取文字内容
                let curMapId = map.getService().currentMapParam().mapid;
                // 如果是点击了文字，则查找其他图中有没有类似的文字，有就跳转至那个图中的文字位置
                let findText = findTextInMaps(text, curMapId)
                if (!findText) {
                    message.info({
                        content: `没有在其他图形中找到类似的文字，请点击其他文字试试: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                        key: "textclick",
                        duration: 3
                    })
                    return
                }
                console.log(findText)
                await map.switchMap({
                    mapid: findText.mapId,
                    style: vjmap.openMapDarkStyle()
                });
        
                // 定位到图的文字的位置
                let bounds = map.getEnvelopBounds(findText.text.envelop);
                map.fitBounds(map.toLngLat(bounds))
                await flashPos(bounds)
        
            }
        })
        
        // 获取每个图的文字信息
        const queryMapText = async (mapId) => {
            let style = await svc.createStyle({ backcolor: 0 }, mapId)
            let query = await svc.conditionQueryFeature({
                mapid: mapId,
                layer: style.stylename,
                // 查询所有文字(包括单行文本，多行文本、块注记文字，属性文字) 具体类型数字参考文档"服务端条件查询和表达式查询-支持的cad实体类型"
                condition: `name='12' or name='13' or name='26' or name='27'`,
                fields: "objectid,name,text,envelop",
                limit: 100000 // 全部查吧
            })
            if (query.error) {
                message.error(query.error)
            } else {
                mapIdTextInfo[mapId] = query.result
            }
        }
        // 从后台去获取文字范围和文字内容
        for(let m of findTextMapIds) {
            await queryMapText(m)
        }
        
        // 在其余的图形中查找相似的文字内容
        const findTextInMaps =  (text, curMapID)=> {
            for(let m = 0; m < findTextMapIds.length; m++) {
                let mid = findTextMapIds[m];
                if (mid=== curMapID) continue;
                let texts = mapIdTextInfo[mid];
                if (!texts) continue;//图中无文字
                for(let t = 0; t < texts.length; t++) {
                    // 这里判断相似，只要text中的一个字符出现在文本中，就算相似吧
                    let r = text.split("").findIndex(a => a && texts[t].text.indexOf(a) >= 0)
                    if (r >= 0) return {
                        mapId: mid,
                        text: texts[t]
                    }
                }
            }
            return null;
        }
        
        
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