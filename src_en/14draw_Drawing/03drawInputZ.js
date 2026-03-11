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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/03drawInputZ
        // --Collect 3D line-- optionally search text for elevation at each point
        // // Coords as [x,z,y] for 3D pipe: https://vjmap.com/map3d/demo/#/demo/map/builtin/objects/03builtinobjtubepath
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: "sys_contour",
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: [-61.4111,-10.8756],
            zoom: 6,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        //map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        
        let mapAllTexts;
        let textMeanHeight = 0; // average text height in map
        const getAllTexts = async ()=> {
            if (mapAllTexts) return mapAllTexts; // already fetched
            // entity type ID to name mapping
            const { entTypeIdMap } = await svc.getConstData();
            const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
        
            let queryTextEntTypeId = getTypeNameById("AcDbText"); // single-line text
            let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // multiline text
            let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // attribute definition
            let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // attribute
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // SQL WHERE clause; see server condition query docs
                fields: "objectid,envelop,text",
                geom: true,
                limit: 100000 // large limit to get all; default 100 if omitted
            })
            if (query.error) {
                message.error(query.error);
                return;
            } else {
                mapAllTexts = []
                textMeanHeight = 0
                if (query.recordCount > 0) {
                    for(let i = 0; i < query.recordCount; i++) {
                        let bounds = map.getEnvelopBounds(query.result[i].envelop);
                        mapAllTexts.push({
                            position: bounds.center(),
                            text: query.result[i].text
                        });
                        textMeanHeight += bounds.height()
                    }
                    textMeanHeight = textMeanHeight / query.recordCount
                }
            }
            return mapAllTexts
        }
        
        function isNumeric(value) {
            const regex = /^[0-9]*\.?[0-9]+$/;  // match number with optional decimal
            return regex.test(value);
        }
        // Collect 3D line; for snap see https://vjmap.com/demo/#/demo/map/draw/03drawSnap
        const collect3Dlines = async () => {
            // send ESC to cancel; cancels previous collect if any
            map.fire("keyup", { keyCode: 27 })
            if (vjmap.logInfo) vjmap.logInfo("Collect line on map; press Enter or right-click to finish")
            let elevations = []
            let line = await vjmap.Draw.actionDrawLineSting(map, {
                updatecoordinate: async (e) => {
                    if (!e.lnglat) return;
                    if (e.isClick) {
                        let curIdx = e.feature.coordinates.length - 1
                        const co = map.fromLngLat(e.feature.coordinates[curIdx]);
                        // get all text near current point
                        let allTexts = await getAllTexts()
                        let radius = textMeanHeight * 2; // search radius 2x mean text height; tune as needed
                        // filter by numeric then by distance
                        let texts = allTexts.filter(item => isNumeric(item.text)).filter(item => vjmap.geoPoint(co).distanceTo(item.position) <= radius)
                        // prompt for elevation
                        // demo uses prompt; in production use UI list for user to pick or type
                        let elevation
                        while(true) {
                            elevation = prompt("Enter elevation:", texts.map(item => item.text).join(" ")); // list possible values; use listbox in production
                            if (isNumeric(elevation)) {
                                break;
                            } else {
                                //vjmap.logInfo("Must enter numeric", "error")
                            }
                        }
                        elevations.push(parseFloat(elevation))
                    }
        
                }, contextMenu: (e) => {
                    new vjmap.ContextMenu({
                        event: e.event.originalEvent,
                        theme: "dark", //light
                        width: "250px",
                        items: [
                            {
                                label: 'OK',
                                onClick: () => {
                                    map.fire("keyup", { keyCode: 13 })
                                }
                            },
                            {
                                label: 'Cancel',
                                onClick: () => {
                                    map.fire("keyup", { keyCode: 27 })
                                }
                            }, {
                                label: 'Delete last point',
                                onClick: () => {
                                    map.fire("keyup", { keyCode: 8 })
                                    elevations.pop();
                                }
                            }, {
                                label: 'Finish',
                                onClick: () => {
                                    map.fire("keyup", { keyCode: 27 })
                                }
                            }
                        ]
                    });
        
                }
            })
            if (line.cancel) {
                return // cancelled
            }
            let coords = map.fromLngLat(line.features[0].geometry.coordinates)
            for(let n = 0; n < coords.length; n++) {
                coords[n].z = elevations[n]
            }
            let tip = vjmap.logInfo ? vjmap.logInfo: alert;
            tip(`Collection done. Coords: ${JSON.stringify(coords)}; F12 console to copy`)
            console.log(coords)
        
            // Coords as [x,z,y] for 3D pipe: https://vjmap.com/map3d/demo/#/demo/map/builtin/objects/03builtinobjtubepath
            map.getDrawLayer().add(line.features[0]) // optional: show drawn line
        }
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Collect</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => collect3Dlines() }>Collect 3D line</button>
                    </div>
                </div>
            );
        }
        
        ReactDOM.render(<App/>, document.getElementById('ui'));
        
        
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