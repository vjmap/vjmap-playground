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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/11stats
        // --服务性能实时统计分析--根据CAD模板图形，用实时数据替换CAD中的文字进行显示
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: "sys_stats", // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: {
                backcolor: 0,
                // 根据表达式，把变量的字隐藏掉，这图里变量的字都用黄色来表示了，所以过滤颜色为黄色的字即可
                expression: "gOutVisible := (gInColorRed == 255 and gInColorGreen == 255 and gInColorBlue == 0) ? 0 : 1;"
            }
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
        await map.onLoad();
        
        // 实体类型ID和名称映射
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        // 下面根据条件表达式云数据库里查询所有变量文字
        let queryEntTypeId = getTypeNameById("AcDbMText");
        let query = await svc.conditionQueryFeature({
            // 过滤出类型为文本，颜色为黄色的
            condition: `name='${queryEntTypeId}' and color = -16711681`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
            fields: "",
            limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
        })
        
        const geoDatas = []
        for(let i = 0; i < query.result.length; i++) {
            let item = query.result[i];
            let bounds = map.getEnvelopBounds(item.envelop);
            // 用文字的中间点，做为symbol文字的点坐标
            let pt = map.toLngLat(bounds.center());
            const data = {
                point: pt,
                properties: {
                    index: item.objectid,
                    text: item.text, // 这个用来记录原来的文本内容
                    val: item.text //  这个用来设置新的文本内容
                },
            }
            geoDatas.push(data);
        }
        
        let fontHeight =  10;
        const symbols = new vjmap.Symbol({
            data: geoDatas,
            textField: ['get', 'val'],
            textFont: ['Arial Unicode MS Regular'],
            // 文字大小，这些用表达式，表达式的作用是根据缩放级别，会自动缩放文字大小
            textSize:  [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0, ["*", fontHeight, ["^", 2, 0]],
                24, ["*", fontHeight, ["^", 2, 24]]
            ],
            textColor: '#FFFF00',
            textOffset: [0, -0.5],
            textAnchor: 'top',
            textRotationAlignment: "map",
            textMaxWidth: 10000000, //不自动换行
            iconAllowOverlap: true,
            textAllowOverlap: true
        });
        symbols.addTo(map);
        
        // 下面去后台获取性能数据，改变值
        const changeStatData = async () => {
            let { data } = await vjmap.httpHelper.get(svc.baseUrl() + "_stats");
            for(let i = 0; i < geoDatas.length; i++) {
                let text = geoDatas[i].properties.text; // 获取原来文本的内容
                // 根据此内容，去取数据
                let val = "";
                if (text === "status") {
                    val = data['gin.status.200']['count'];
                } else {
                    val = data['gin.latency'][text];
                    if (text !== "count") {
                        val = parseInt(val / 1000000); // 如果是时间，把 ns转成ms
                    }
                }
                geoDatas[i].properties.val = val;
            }
            symbols.setData(geoDatas) ;// 改变数据
        }
        await changeStatData();
        setInterval(async () => {
            await changeStatData();
        }, 5000); //五秒刷新一次
        
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