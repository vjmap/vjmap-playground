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
        // --Multi-query block sub-entity max area--Find max-area entity in blocks; expr query then condition query, analyze together
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
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
        
        
        
        // let blockNames = ["M_F13", "_AXISO"]; // Block names to find; get blockname from cloud platform block entity props
        
        const handleQuery= async () => {
            let query = await svc.exprQueryFeature({
                // Expr query all blocks first; condition query would see blocks as discrete geometry, so get block info via expr
                /// Query all blocks. For a specific block: expr: `gOutReturn := if((gInFeatureType == 'AcDbBlockReference' and gInAttrs4 == 'YourBlockName'), 1, 0);`,
                expr: `gOutReturn := if((gInFeatureType == 'AcDbBlockReference'), 1, 0);`,
                fields: "objectid,blockname,layername,positon,rotate,scaleX,scaleY,scaleZ", // empty = all fields
                geom: false, // memory mode
                useCache: true,
                limit: 1000000 // large to get all
            })
            if (query.error) {
                message.error(query.error)
                return
            }
            // Filter by block names if needed
            //  let findBlockName = new Set(blockNames);
            let objectIds = new Set(); // block objectids
            let blockEntities = [];
            for(let i = 0; i < query.result.length; i++) {
                let blockname = query.result[i].blockname;
                // if (!findBlockName.has(blockname)) {
                //     continue  // not in target set
                // }
                blockEntities.push(query.result[i])
                objectIds.add(query.result[i].objectid)
            }
        
            // Condition query sub-entities in blocks by block objectids; memory query cannot get this; only after geometry expands blocks to sub-entities
            // In condition query, same-block entity objectids are block_objectid_
            // Block objectid: blockId_refDefId1_refDefId2_entityId_#; table: _@; group: $entityId_index$groupId
            // Build SQL condition: all objectids starting with block id; % is wildcard in LIKE
            let condtionIds = Array.from(objectIds).map(id => `objectid like '${id}_%' `).join(" or ")
        
            let condQuery = await svc.conditionQueryFeature({
                condition:  condtionIds, // objectid matches above
                fields: "objectid,area",
                geom: true,
                limit: 100000 // large to get all; default 100
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
        
            // Find related entities under each block, get max-area sub-entity
            let showDatas = []
            for(let block of blockEntities) {
                // objectid starting with block_objectid_ are block sub-entities
                let blockFeature = blockFeatures.filter(b => b.objectid.indexOf(block.objectid + "_") === 0)
                let maxArea = Math.max(...blockFeature.filter(b => b.area).map(d => d.area))
                showDatas.push({
                    ...block,
                    area: maxArea
                })
            }
            console.table(showDatas)
            message.info(`Matched count: ${blockEntities.length}. Press F12 to see console data`)
        };
        
        const { Button } = antd
        const App = () => {
            return (
                <Button type="primary" onClick={handleQuery}>Click to query max area of block sub-entities in map</Button>
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