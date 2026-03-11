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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findzexportdata
        // --Extract regular data from map to generate table--
        // Map service
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: "sys_exporttable", // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: [-24.367859677916186, 9.801896698976805], // center
            zoom: 5,
            pitch: 0,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        await map.onLoad();
        
        
        // Entity type ID and name mapping
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        
        // Query all circles
        let mapAllCircles = []; // All circles in map
        const queryAllCircle = async () => {
            let queryEntTypeId = getTypeNameById("AcDbCircle");
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryEntTypeId}'`, // WHERE condition only; see docs
                fields: "",
                limit: 100000 // Large limit to get all; default 100
            })
            if (query.error) {
                message.error(query.error)
            } else {
                if (query.recordCount > 0) {
                    for (var i = 0; i < query.recordCount; i++) {
                        let bounds = map.getEnvelopBounds(query.result[i].envelop);
                        mapAllCircles.push({
                            bounds, // circle bounds
                            center: bounds.center(), // center
                            radius: bounds.width() / 2.0, // radius
                            color: map.entColorToHtmlColor(query.result[i].color), // color
                            objectid: query.result[i].objectid // id
                        })
                    }
                }
            }
        }
        await queryAllCircle();
        
        // Given bounds (point sequence), circle radius and angle, export data as table
        const exportTableData = (polygons, radius, rotateAngle) => {
            // Find circles with same radius
            let circles = mapAllCircles.filter(c => vjmap.isZero(c.radius - radius));
            // Filter by bounds
            polygons = polygons.map(p => vjmap.geoPoint(p)) // to GeoPoint
            circles = circles.filter(c => vjmap.isPointInPolygon(c.center, polygons));
            if (rotateAngle && circles.length > 0) {
                // If rotation angle, rotate each point to horizontal
                let rotateCenter = circles[0].center; // rotate around first point
                for(let i = 0; i < circles.length; i++) {
                    let ang = vjmap.degreesToRadians(rotateAngle); // degrees to radians
                    let rotatePoint = circles[i].center.roateAround(ang, rotateCenter);
                    circles[i].rotatePoint = rotatePoint;
                    // new vjmap.Marker({color: "red"}).setLngLat(map.toLngLat(rotatePoint)).addTo(map) // for debug
                }
            }
            // Get distinct y values for row count
            let coYSet = new Set();
            circles.forEach(c => {
                let y = c.rotatePoint.y;
                let find = false;
                for(let s of coYSet) {
                    // Use diameter as tolerance
                    if (vjmap.isZero(s - y, radius * 2)) {
                        find = true;
                        break;
                    }
                }
                if (!find) {
                    coYSet.add(y);
                }
            });
            // Sort Y coordinates
            let coYArr = Array.from(coYSet);
            coYArr = coYArr.sort((a, b) => b - a) ;// descending
        
            let tableData = [];
            let id = 0;
            for(let i = 0; i < coYArr.length; i++) {
                // Find row data, then sort by x
                let rowCirlces = circles.filter(c => vjmap.isZero(coYArr[i] - c.rotatePoint.y, radius * 2));
                rowCirlces = rowCirlces.sort((a,b) => a.rotatePoint.x - b.rotatePoint.x); // sort by x
                for(let r = 0; r < rowCirlces.length; r++) {
                    let cell = {
                        id: ++id,
                        no: `${i + 1}-${r + 1}`,
                        center: rowCirlces[r].center,
                        objectid: rowCirlces[r].id,
                        co: rowCirlces[r].center.toString(4)
                    }
                    // Dedup: skip if same as previous
                    if (tableData.length > 0 && tableData[tableData.length - 1].center.equals(cell.center)) continue;
                    tableData.push(cell)
                }
            }
            return tableData;
        }
        
        // Export table data by given params
        const exportTableByParam = () => {
            // bounds
            let points = [
                [518985.5263,4331102.8932],
                [519033.1877,4331132.204],
                [519053.2113,4331104.3143],
                [519008.5544,4331073.8486],
            ]
            return exportTableData(points, 0.2, -41.6478);
        }
        
        // Interactive select bounds and angle to export table
        let snapObj = {}; // snap entity
        const exportTableByMutual = async () => {
            message.info("Please draw a polygon containing the circle points to export")
            let drawSlantRect = await vjmap.Draw.actionDrawPolygon(map, {
                pointCount: 4,// 4 points, auto-end when done
            });
            if (drawSlantRect.cancel) {
                return; // Cancel
            }
            // Get drawn coordinates
            let points = map.fromLngLat(drawSlantRect.features[0].geometry.coordinates[0]);
            message.info("Please draw a line to set rotation angle");
            let drawLine = await vjmap.Draw.actionDrawLineSting(map, {
                pointCount: 2,// 2 points, auto-end when done
                api: {
                    getSnapFeatures: snapObj // assign features to snap
                }
            });
            if (drawLine.cancel) {
                return; // Cancel
            }
            let linePoints = map.fromLngLat(drawLine.features[0].geometry.coordinates);
            let angle = -vjmap.radiansToDegrees(linePoints[1].angleTo(linePoints[0]));
            return exportTableData(points, 0.2, angle);
        }
        const addSnapPoint = async () => {
            // Get snap points
            if (map.hasVectorLayer()) {
                // Vector style: get snap points
                snapObj.features = map.queryRenderedFeatures({layers: ['vector-layer-lines']})
            } else {
                // Raster style: get coordinate data from server
                // Query all coordinate data; see https://vjmap.com/guide/svrStyleVar.html
                let res = await svc.conditionQueryFeature({ fields:"s3", condition:"s3 != ''", limit: 100000})
                res = res.result.map(e => e.s3.split(";"))
                snapObj.features = []
                for(let item of res) {
                    let coordinates = []
                    for(let pt of item) {
                        const p = pt.split(",")
                        if (p.length >= 2) {
                            coordinates.push(map.toLngLat([+p[0], +p[1]]))
                        }
                    }
                    if (coordinates.length == 1) {
                        snapObj.features.push({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: coordinates[0]
                            }
                        })
                    }
                    else if (coordinates.length > 1) {
                        snapObj.features.push({
                            type: "Feature",
                            geometry: {
                                type: "LineString",
                                coordinates: coordinates
                            }
                        })
                    }
        
                }
            }
        }
        await addSnapPoint();
        // Icon
        await map.loadImageEx("stretchTextBackImg", env.assetsPath + "images/textback.png", {
            // Horizontal stretch: x 7-32 and 42-62
            stretchX: [
                [7, 32],
                [42, 62]
            ],
            // Vertical stretch: y 3-19
            stretchY: [[3, 19]],
            // Text content area [x1, y1, x2, y2]
            content: [7, 3, 62, 19]
        });
        
        
        
        let symbols;
        const showDataInMap = (datas)=> {
            let geoDatas = []
            for(let i = 0; i < datas.length; i++) {
                const pt = datas[i].center;
                const data = {
                    point: map.toLngLat(pt),
                    properties: {
                        text:  datas[i].no,
                        textColor: "#00ffff",
                        objectid: datas[i].objectid
                    }
                }
                geoDatas.push(data);
            }
            if (symbols) {
                symbols.remove();// Remove existing first
            }
            symbols = new vjmap.Symbol({
                data: geoDatas,
                iconImage: "stretchTextBackImg",
                iconAnchor: "bottom",
                iconOpacity: 0.5,
                iconOffset: [-2, -10],
                textTranslate: [-2, -6],
                textAnchor: "bottom",
                textField: ['get', 'text'],
                textFont: ['Arial Unicode MS Regular'],
                textSize: 18,
                textColor: ['get', 'textColor'],
                iconTextFit: "both",
                iconAllowOverlap: true,
                textAllowOverlap: true
            });
            symbols.addTo(map);
        }
        
        // UI using Element UI for demo
        if (typeof Vue !== "object") {
            // If no Vue and Element UI
            await vjmap.addScript([{
                src: "../../js/vue@2.js"
            }, {
                src: "../../js/element-ui@2.15.10/index.js"
            },{
                src: "../../js/element-ui@2.15.10/index.css"
            }])
        }
        
        let app = new Vue({
            el: '#ui',
            data: {
                tableData: []
            },
            methods: {
                exportByParam() {
                    this.tableData = exportTableByParam();
                    showDataInMap(this.tableData);
                },
                async exportByMutual() {
                    this.tableData = await exportTableByMutual();
                    showDataInMap(this.tableData);
                },
                clearData() {
                    this.tableData = [];
                    showDataInMap(this.tableData);
                }
            },
            template: `
              <template>
                <div style="position: absolute; z-index: 2">
                    <el-row>
                      <el-button type="primary" @click="exportByParam">Extract circles and generate table by pattern</el-button>
                    </el-row>
                  <el-row>
                      <el-button type="success" @click="exportByMutual">Pick bounds manually to generate table</el-button>
                  </el-row>
                  <el-row>
                      <el-button type="warning" @click="clearData">Clear data</el-button>
                  </el-row>
                    <el-row>
                     <el-table
                      v-if="tableData.length"
                      :data="tableData"
                      height="300"
                      style="width: 320px;">
                      <el-table-column
                        prop="id"
                        label="No."
                        width="50">
                      </el-table-column>
                      <el-table-column
                        prop="no"
                        label="ID"
                        width="60">
                      </el-table-column>
                      <el-table-column
                        prop="co"
                        label="Coordinate">
                      </el-table-column>
                    </el-table>
                  </el-row>
                </div>
              </template>
            `
        })
        
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