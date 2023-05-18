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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29modifyselectentity
        // --选择实体修改实体颜色增加效果--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: "sacc698bb198b6", // 地图ID
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
        
        // let style = svc.vectorStyle(); // 默认的样式
        let customColorCaseExpr = [
            ['==', ['feature-state', 'status'], 'red'], '#ff0000',
            ['==', ['feature-state', 'status'], 'green'], '#00ff00',
            ['==', ['feature-state', 'status'], 'blue'], '#0000ff',
        ];
        // 自定义的矢量样式
        let style = svc.vectorStyle({
            hoverColor: 'rgba(19,255,247,1)', // 自定义高亮时颜色
            hoverOpacity: 1, // 自定义 高亮时透明度
            hoverLineWidth: 5, // 自定义 高亮时线宽
            customColorCaseExpr
        })
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: style, // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 3, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        // map.fitMapBounds();
        
        let mapBounds = map.getGeoBounds();
        await map.onLoad();
        
        // *** 实际项目中css样式直接写css文件中，不要通过代码来增加
        let cssCode = `
                @keyframes rotate {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
                 .myImage {
                    width: 200px;
                    height: 200px;
                    animation: rotate 5s infinite linear;
                    positon: 'absolute';
                    left: '0px';
                    top: '0px';
                    opacity: 1;
                    zIndex: 2;
                    pointerEvents: "none"
                }
                `
        let styleElement = document.createElement('style');
        styleElement.appendChild(document.createTextNode(cssCode));
        // 将新创建的 <style> 元素添加到 <head> 中
        document.head.appendChild(styleElement);
        
        // 有高亮状态（鼠标在地图元素上时，会高亮)
        map.enableVectorLayerHoverHighlight((event, feature, layer) => {
            // 点击高亮实体回调事件
            // const prop = feature.properties;
            // let content = `event: ${event}; feature: ${feature.id}; layer: ${layers[prop.layer].name}; type: ${entTypeIdMap[prop.type]}`
        })
        
        const imageWidth = 200; // 图像宽
        const imageHeight = 200; // 图像高
        const image = document.createElement("img");
        image.className = "myImage"
        image.src = "data:image/png;base64,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"
        const divDom = document.createElement('div');
        divDom.appendChild(image)
        
        const changeFeatureStatus = (ids, state) => {
            if (!ids) return;
            if (!Array.isArray(ids)) ids = [ids]
            let sourceLayers = ['polygons', 'lines', 'points'];
            // vector source下面的所有图层
            for (let sourceLayer of sourceLayers) {
                // 块下面的所有feature id
                for (let id of ids) {
                    map.setFeatureState({
                            source: "vector-source",
                            sourceLayer: sourceLayer,
                            id: id
                        },
                        state)
                }
            }
        }
        
        let curFeatureId;
        let curDivOverlay;
        
        const addDivOverlay = (bounds) => {
            if (curDivOverlay) {
                curDivOverlay.remove();
                curDivOverlay = null;
            }
            curDivOverlay = new vjmap.DivOverlay({
                bounds: vjmap.GeoBounds.fromString(bounds), // 四个点的位置
                element: divDom, // DIV 元素
                width: imageWidth,// DIV 宽
                height: imageHeight,// DIV 高
                maxZoom: 7
            })
            curDivOverlay.addTo(map);
        }
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            // 点击在圆上时增加一个动画图片
            if (e.name == "AcDbHatch") {
                // 如果是点击在圆上面
                // 增加一个DIV的Image覆盖物
                addDivOverlay(e.bounds)
            }
        
            // 把实体的颜色进行修改，改成红色
            if (curFeatureId) {
                // 先取消原来修改的颜色
                changeFeatureStatus(curFeatureId, {status: ""})
            }
            curFeatureId = `${e.id}`
            // 改成新的颜色
            changeFeatureStatus(curFeatureId, {status: "red"})
        
        }, "#0000", undefined, undefined, (curLngLat) => {
            // 查询前回调函数，默认点击查询误差是5个像素，这里改成1个像素误差，提高精度
            return {
                pixelsize: 1
            }
        })
        
        let initImageBounds = '[1882.28697585,1907.56398938,1902.28536452,1927.56318371]'
        addDivOverlay(initImageBounds);
        map.setCenter(map.toLngLat(vjmap.GeoBounds.fromString(initImageBounds).center()));
        
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