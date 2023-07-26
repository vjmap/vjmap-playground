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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zinsertoutmapzentdirect
        // --通过坐标加载外部图形实体--把外部图形的元素通过坐标指定插入至当前图形中(以geojson形式加载，前端绘制）
        // 注: 此示例中引用了vjcommon库。此库是对唯杰地图常用的功能做了一定程度的封装，方便其他工程共用
        // vjcommon库可在 html 中引入`vjcommon.min.js`即可,或npm install vjcommon`通过`import vjcommon from 'vjcommon'`引入
        // vjcommon库是开源的。开源地址 https://github.com/vjmap/vjmap-common
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: 'sys_hello', // 地图ID
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
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        let mapBounds = map.getGeoBounds();
        
        const draw = map.getDrawLayer();
        // 在指定位置加一个符号
        let pos = mapBounds.randomPoint() // 随机生成一个点
        
        let templateMapId = "sys_symbols";
        let templateMapIdVer = "v1";
        // 注以下layerindex和objectid的值的获取请在唯杰地图云端图纸管理平台打开sys_symbols图点击实体，右侧属性页面中layerindex值和objectid的值
        let createEntPromise = []
        let param = {
            mapid: templateMapId,  // 指定符号来源于哪个图id
            version: templateMapIdVer,  // 指定符号来源于哪个图id版本
            condition: 'layerindex=2', // 过滤出符号的条件
            position: pos, // 指定绘制的位置
            // scaleValue: 1, // 指定缩放倍数
            // angleValue: 0, // 指定旋转角度
        };
        
        let res1 = vjcommon.createOutSymbol(map, draw, {}, {
            disableScale: true, // 不交互式指定缩放
            disableRotate: true,// 不交互式指定旋转
            keepGeoSize: true, // 保持原来符号大小尺寸
            // unCombineFeature: true // 不自动组合成新的实体
        }, null, param);
        createEntPromise.push(res1);
        
        // 在指定位置创建一条线段
        let linePoints = [];
        // 给这条线段随机生成三个点
        for(let i = 0; i < 3; i++) {
            linePoints.push( mapBounds.randomPoint())
        }
        
        param = {
            mapid: templateMapId,  // 指定符号来源于哪个图id
            version: templateMapIdVer,  // 指定符号来源于哪个图id版本
            // linetypeScale: 100, // 线型比例
            objectid: '40D', // 线型线的objectid
            coordinates: linePoints // 直接指定坐标
        };
        let res2 = vjcommon.createLineTypePolyline(map, draw, {}, {
            // "color": "#ff0000",// 颜色
            //"line_width": 1, // 线宽
        },null, param);
        createEntPromise.push(res2);
        
        // 在指定位置创建一条曲线
        let curvePoints = [];
        // 给这条线段随机生成三个点
        for(let i = 0; i < 3; i++) {
            curvePoints.push( mapBounds.randomPoint())
        }
        
        param = {
            mapid: templateMapId,  // 指定符号来源于哪个图id
            version: templateMapIdVer,  // 指定符号来源于哪个图id版本
            // linetypeScale: 100, // 线型比例
            objectid: '40E', // 线型线的objectid
            coordinates: curvePoints, // 直接指定坐标
            isCurve: true, // 表明是曲线，注意模板中也应该是曲线实体
            curveUseControlPoints: false, //  false 用拟合点 fitPoints; true 控制点 controlPoints
        };
        let res3 = vjcommon.createLineTypePolyline(map, draw, {}, {
            // "color": "#ff0000",// 颜色
            //"line_width": 1, // 线宽
        },null, param);
        createEntPromise.push(res3);
        
        
        // 在指定位置创建填充符号
        let fillPoints = [];
        // 随机生成三个点
        for(let i = 0; i < 3; i++) {
            fillPoints.push( mapBounds.randomPoint())
        }
        
        param = {
            mapid: templateMapId,  // 指定符号来源于哪个图id
            version: templateMapIdVer,  // 指定符号来源于哪个图id版本
            objectid: '426', // 填充objectid
            // patternScale: 400, // 填充符号
            coordinates: fillPoints // 直接指定坐标
        };
        let res4 = vjcommon.createHatch(map, draw, {}, {
            // "color": "#ff0000",// 颜色
        },null, param);
        createEntPromise.push(res4);
        
        // 等全部创建完
        await Promise.all(createEntPromise);
        
        draw.changeMode('static');  // 编辑模式 simple_select
        
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