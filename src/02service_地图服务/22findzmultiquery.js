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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findzmultiquery
        // --多种查询块对象子实体面积最大值--查询块中面积最大的实体，先通过表达式查询，再通过条件查询。一起分析结果
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle()
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
        
        
        
        // let blockNames = ["M_F13", "_AXISO"]; // 要查找的块名称列表 块名称可通过在云端管理平台中点击块实体，右侧属性中的blockname
        
        const handleQuery= async () => {
            let query = await svc.exprQueryFeature({
                // 先表达式查询所有的块实体，因为如何用条件查询的话，块已经转为了离散的空间数据，不能整体查了，所以先通过表达式查询出块信息
                /// 以下是查所有块。如果要查询某个具体的块名可以这样写  expr: `gOutReturn := if((gInFeatureType == 'AcDbBlockReference' and gInAttrs4 == '您要查询的块名称'), 1, 0);`,
                expr: `gOutReturn := if((gInFeatureType == 'AcDbBlockReference'), 1, 0);`,
                fields: "objectid,blockname,layername,positon,rotate,scaleX,scaleY,scaleZ", // 为空的话，表达所有字段
                geom: false, // 内存模式
                useCache: true,
                limit: 1000000 // 数量大些，相当于查找所有的
            })
            if (query.error) {
                message.error(query.error)
                return
            }
            // 根据要过滤的块名称过滤结果
            //  let findBlockName = new Set(blockNames);
            let objectIds = new Set(); // 块对象的objectid值
            let blockEntities = [];
            for(let i = 0; i < query.result.length; i++) {
                let blockname = query.result[i].blockname;
                // if (!findBlockName.has(blockname)) {
                // 如果不在要找的里面
                //     continue
                // }
                blockEntities.push(query.result[i])
                objectIds.add(query.result[i].objectid)
            }
        
            // 下面根据所有块的objectid去条件查询下面块中所包含的具体子实体。这个数据通过内存查询查不到。只有通过几何处理把块分解成了一个个子实体了，通过条件查询去查
            // 条件查询中同一个块实体的objectid都是为此块的objectid_开头的
            // 实体id
            // 块objectid命名规则:块id_引用的块定义id1_引用的块定义id2(可能有多个)_实体id_#;
            // 表格命名规则:objectid命名规则:块id_引用的块定义id1_引用的块定义id2(可能有多个)_实体id_@;
            // 组objectid命名规则:$实体id_实体内元素索引$组id;
        
            // 构造sql条件，所有块objectid_开头的一次先查出来。提高效率
            // 模糊查找可能like中的匹配符%查找。%符号用于在模式的前后定义通配符。like 'k%'查找以字母 'k' 结尾
            let condtionIds = Array.from(objectIds).map(id => `objectid like '${id}_%' `).join(" or ") // 把所有符合条件的id用字符串连起来
        
            let condQuery = await svc.conditionQueryFeature({
                condition:  condtionIds, // objectid符合上面的条件就可以。
                fields: "objectid,area",
                geom: true,
                limit: 100000 //设置很大，相当于把所有的都查出来。不传的话，默认只能取100条
            })
        
            if (query.error) {
                message.error(query.error)
                return
            }
            let blockFeatures = []
            for(let i = 0; i < condQuery.result.length; i++) {
                let item = condQuery.result[i];
                blockFeatures.push(item)
            }
        
            // 查找所有块下面的相关的实体，找出面积最大的子实体
            let showDatas = []
            for(let block of blockEntities) {
                // 以块objectid_开头的都是块的子实体
                let blockFeature = blockFeatures.filter(b => b.objectid.indexOf(block.objectid + "_") === 0)
                let maxArea = Math.max(...blockFeature.filter(b => b.area).map(d => d.area))
                showDatas.push({
                    ...block,
                    area: maxArea
                })
            }
            console.table(showDatas)
            message.info(`查询到符合的记数条数：${blockEntities.length} 请按F12查看控制台具体数据`)
        };
        
        const { Button } = antd
        const App = () => {
            return (
                <Button type="primary" onClick={handleQuery}>请点击此按钮查询图中指定的块对象子实体面积最大值</Button>
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