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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/02drawApiAddButton
        // --自定义增加隐藏绘图控件按钮--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
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
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        
        const opts = vjmap.cloneDeep(vjmap.Draw.defaultOptions());
        // https://vjmap.com/guide/draw.html
        // 可以隐藏默认的按钮
        opts.controls.cutPolygon = false;//不显示裁剪多边形
        /*
        combine_features: true,
        cutPolygon: false,
        drawCircle: true,
        drawRectangle: true,
        line_string: true,
        point: true,
        polygon: true,
        redo: true,
        snap_mode_grid: true,
        snap_mode_snap: true,
        splitLine: true,
        trash: true,
        uncombine_features: true,
        undo: true,
        */
        
        // 设置要增加的控件
        opts.addControls = [
            {
                id: "getSelected",
                title: "获取选择的个数",
                className: "my_class_1",
                style: {
                    "background-image": `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M10,10L12,22L26,22z" fill="blue"/></svg>')`
                },
                onActivate: (ctx) => {
                    let sels = ctx.api.getSelectedIds();
                    message.info(`当前选择的个数: ${sels.length}`);
                }
        
            },
            {
                id: "getAllCoord",
                title: "获取绘制全部的实体坐标",
                className: "my_class_2",
                style: {
                    "background-image": `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M10,10L10,22L22,22L22,10z" fill="red"/></svg>')`
                },
                onActivate: (ctx) => {
                    let all = ctx.api.getAll();
                    let tip = "";
                    for(let f of all.features) {
                        let featureType = f.geometry.type;
                        // 把经纬度转成地理坐标
                        let co = map.fromLngLat(f.geometry.coordinates);
                        tip += `${featureType}: ${JSON.stringify(co)};  `
                    }
                    message.info(tip);
                }
        
            }
        ];
        
        const draw = new vjmap.Draw.Tool(opts);
        map.addControl(draw, 'top-right');
        
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