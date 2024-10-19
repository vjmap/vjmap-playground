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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/30mapshowquerygeojson
        // --查询图中部分区域前端绘制--给定一个区域或指定查询条件获取渲染数据通过geojson在前端绘制
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        let mapid = env.exampleMapId;
        // 得到原来图的元数据
        let metadata = await svc.metadata(mapid, "v1");
        let mapBounds = vjmap.GeoBounds.fromString(metadata.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapBounds);
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterBlankStyle(0, 24), // 样式
            center: prj.toLngLat(mapBounds.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        
        await map.onLoad()
        let style = await svc.createStyle({
            backcolor: 0xFFFFFF // 浅色主题
        }, mapid)
        // 查询图中一个范围内容的所有实体
        let res = await svc.conditionQueryFeature({
            mapid: mapid,
            version: "v1",
            layer: style.stylename,
            condition: ``,
            bounds: [587685118.956964,3103929741.304815,587740977.733287,3103995128.931217],
            geom: true,
            includegeom: true,
            isContains: false,
            realgeom: true,
            fields: "",
            limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
        })
        
        
        const features = [];
        if (res && res.result && res.result.length > 0) {
            for (let ent of res.result) {
                if (ent.geom && ent.geom.geometries) {
                    let clr = map.entColorToHtmlColor(ent.color); // 实体颜色转html颜色
                    for (let g = 0; g < ent.geom.geometries.length; g++) {
                        let featureAttr = {};
                        // 因为要组合成一个组合实体，所以线和多边形的颜色得区分
                        if (ent.isPolygon) {
                            featureAttr.color = clr; // 填充色，只对多边形有效
                            featureAttr.noneOutline = true; // 不显示多边形边框，只对多边形有效
                        } else {
                            featureAttr.color = clr; // 颜色
                            featureAttr.line_width = ent.lineWidth < 0 ? 1: ent.lineWidth; // 线宽
                        }
                        features.push({
                            id: vjmap.RandomID(10),
                            type: "Feature",
                            properties: {
                                objectid: ent.objectid + "_" + g,
                                opacity: ent.alpha / 255,
                                ...featureAttr,
                            },
                            geometry: ent.geom.geometries[g],
                        });
                    }
                }
            }
        }
        let geojson =  {
            type: "FeatureCollection",
            features: features,
        };
        const opts = vjmap.Draw.defaultOptions();
        // 修改默认样式，把点的半径改成1，没有边框，默认为5
        let pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-point-stroke-inactive");
        if (pointIdx >= 0) {
            opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 0
        }
        pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-inactive");
        if (pointIdx >= 0) {
            opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 1
        }
        map.getDrawLayer(opts).set(geojson);
        
        // 适应至当前数据范围
        let dataExtent = vjmap.GeoBounds.fromDataExtent(geojson)
        map.fitBounds(dataExtent.toArray() ,{
            padding: 50,
            duration: 0 // 取消动画过程
        });
        
        
        // 增加鼠标位置
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