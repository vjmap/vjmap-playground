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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/20queryMemory
        // --Backend query entities [memory render]--Condition query with map opened in memory (DWG)
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.Memory, // Open in memory
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
        
        
        
        let blockNames = ["M_F13", "_AXISO"]; // Block names to find (blockname in cloud props)
        const handleQuery= async () => {
            let query = await svc.exprQueryFeature({
                expr: `return gInFeatureType == 'AcDbBlockReference'`,
                fields: "objectid,blockname,envelop",
                useCache: true,
                limit: 1000000
            })
            if (query.error) {
                message.error(query.error)
            } else {
                let findBlockName = new Set(blockNames);
                let polygons = []
                let blockColors = {};
                for(let i = 0; i < query.result.length; i++) {
                    let blockname = query.result[i].blockname;
        
                    if (!findBlockName.has(blockname)) {
                        continue
                    }
        
                    let bounds = map.getEnvelopBounds(query.result[i].envelop);
                    let clr = blockColors[blockname];
                    if (!clr) {
                        clr = vjmap.randomColor();
                        blockColors[blockname] = clr;
                    }
                    polygons.push({
                        points: map.toLngLat(bounds.toPointArray()),
                        properties: {
                            name: "objectid:" + query.result[i].objectid,
                            blockname: blockname,
                            color: clr
                        }
                    });
                }
                message.info(`Matched count: ${query.recordCount}`)
        
                let polygon = new vjmap.Polygon({
                    data: polygons,
                    fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', ['get', 'color']],
                    fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 0.5],
                    // fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 0.0],
                    fillOutlineColor: ['get', 'color'],
                    isHoverPointer: true,
                    isHoverFeatureState: true
                });
                polygon.addTo(map);
                polygon.clickLayer(e => message.info(`Clicked polygon ${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}`))
                polygon.hoverPopup((f, popup) => {
                    let bounds = vjmap.GeoBounds.fromDataExtent(f);
                    popup.setLngLat([bounds.center().x, bounds.max.y]);
                    return `<h3>ID: ${f.properties.name}</h3>Block: ${f.properties.blockname}`
                }, { anchor: 'bottom' });
            }
        };
        
        const { Button } = antd
        const App = () => {
            return (
                <Button type="primary" onClick={handleQuery}>Query all block entities in map</Button>
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