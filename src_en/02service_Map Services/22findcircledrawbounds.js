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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findcircledrawbounds
        // --Find circles in bounds and draw border--Query all circles in bounds and draw envelope
        // Light background
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
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
        
        // Entity type ID to name mapping
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        const queryCircleAndDrawBounds = async () => {
            let queryEntTypeId = getTypeNameById("AcDbCircle");
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryEntTypeId}'`,
                bounds:[587498538.4551579,3103826144.0635295, 587696451.4441276, 3103979855.1575785], // Optional; omit to skip bounds filter
                fields: "",
                limit: 100000 // Large limit to get all circles; default 100 if omitted
            })
            if (query.error) {
                message.error(query.error)
            } else {
                message.info(`Matched count: ${query.recordCount}`)
        
                if (query.recordCount > 0) {
                    let polygons = []
                    for(var i = 0; i < query.recordCount; i++) {
                        let bounds = map.getEnvelopBounds(query.result[i].envelop);
                        let clr = map.entColorToHtmlColor(query.result[i].color); // Entity color to HTML
                        polygons.push({
                            points: map.toLngLat(bounds.toPointArray()),
                            properties: {
                                name: "objectid:" + query.result[i].objectid,
                                color: clr
                            }
                        });
        
        
                    }
                    let polygon = new vjmap.Polygon({
                        data: polygons,
                        fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', '#f00'],
                        fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.8, 0.5],
                        // Set fillOpacity to 0 to hide until hover
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
                        return `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`
                    }, { anchor: 'bottom' });
                }
            }
        }
        const { Button } = antd
        const App = () => {
            const handleClick = async () => {
                queryCircleAndDrawBounds()
            };
            return (
                <Button type="primary" onClick={handleClick}>Query all circles and draw borders</Button>
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