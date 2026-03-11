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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findzexporttable
        ﻿// --Locate tables in map and extract table data--
        // !!! Note: Auto-extract all tables has a better implementation in the backend.
        // Open https://vjmap.com/app/cloud/#/map/sys_table?version=v1&mapopenway=GeomRender&vector=false
        // In More features click Auto-extract all tables in map"
        // This example shows a simple approach to extract table data with your own algorithm
            let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
            let res = await svc.openMap({
                mapid: "sys_table", // Map ID
                mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
                style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
            })
            if (res.error) {
                // If open failed
                message.error(res.error)
            }
        // Get map extent
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geometric projection from map extent
            let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
            let map = new vjmap.Map({
                container: 'map', // DIV container ID
                style: svc.rasterStyle(), // style, raster here
                center:  prj.toLngLat(mapExtent.center()), // set map center
                zoom: 2, // set map zoom level
                renderWorldCopies: false // do not show multi-world copies
            });
        
        // Attach service and projection
            map.attach(svc, prj);
            map.doubleClickZoom.disable(); // disable map double-click zoom
            let mapBounds = map.getGeoBounds(0.4);
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
        
            // Find all line segments in the map
            const  getMapHVLines = async () => {
                // Find all lines in map: 2D/3D polylines
                let queryEntTypes = ['AcDbLine', 'AcDbPolyline', 'AcDb2dPolyline', 'AcDb3dPolyline'];
                let cond = queryEntTypes.map(t => `name='${getTypeNameById(t)}'`).join(' or '); // SQL condition
        
                let result = [];
                let beginPos = 0; // query start position
                // Record count may be large, use paginated query
                while(true) {
                    let query = await svc.conditionQueryFeature({
                        condition: cond, // only the WHERE condition; see docs "Server condition/expression query"
                        fields: "objectid,points,envelop", // id and coordinates only
                        beginpos: beginPos, // start position
                        limit: 100000 // 100k per batch
                    });
                    beginPos += query.result.length; // advance start position
                    result.push(...query.result || []);
                    if (result.length >= query.recordCount) break;
                }
        
                result = result.filter(e => {
                    let points = e.points.split(";");
                    if (points.length !=2 ) return false;
                    e.geoStart = vjmap.GeoPoint.fromString(points[0]);
                    delete e.geoStart.z;// ignore z
                    e.geoEnd = vjmap.GeoPoint.fromString(points[1]);
                    delete e.geoEnd.z;// ignore z
        
                    if (e.geoStart.x > e.geoStart.x) {
                        // swap
                        let temp = e.geoStart;
                        e.geoStart = e.geoEnd;
                        e.geoEnd = temp;
                    }
                    e.startPoint = e.geoStart.toString();
                    e.endPoint =  e.geoEnd.toString();
                    if (e.startPoint == e.endPoint) {
                        // same point
                        return false;
                    }
                    let line = points.map(e=>vjmap.geoPoint(e.split(",")))
                    let isVLine = vjmap.isZero(line[0].x - line[1].x);// vertical line
                    let isHLine = vjmap.isZero(line[0].y - line[1].y);// horizontal line
                    if (!(isVLine || isHLine)) return false; // must be horizontal or vertical
        
                    e.isHorzLine = isHLine;
                    return true
                })
                return result;
            }
        
            // Get all text
            const getAllTexts = async ()=> {
                // Entity type ID and name mapping
                const { entTypeIdMap } = await svc.getConstData();
                const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
                let allTexts = [];
                let queryTextEntTypeId = getTypeNameById("AcDbText"); // single-line text
                let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // multiline text
                let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // attribute definition text
                let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // attribute text
                let query = await svc.conditionQueryFeature({
                    condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // WHERE condition only; see docs
                    fields: "",
                    geom: true,
                    limit: 100000 // large limit to get all; default is 100
                })
                if (query.error) {
                    message.error(query.error);
                    return;
                } else {
                    if (query.recordCount > 0) {
                        for(let i = 0; i < query.recordCount; i++) {
                            let bounds = map.getEnvelopBounds(query.result[i].envelop);
                            let clr = vjmap.entColorToHtmlColor(query.result[i].color); // entity color to HTML color
                            allTexts.push({
                                bounds: bounds,
                                center: bounds.center(),
                                name: query.result[i].objectid,
                                color: clr,
                                text: query.result[i].text
                            });
                        }
                    }
                }
                return allTexts;
            }
        
        
            const pickTableData = async () => {
                let allHVLines = await getMapHVLines();
                let allTexts = await getAllTexts();
        
                // (1) Find all text containing "No." (serial number)
                // (2) Locate horizontal lines above the No. text
                // (3) Find horizontal lines with same x as that line (can optimize by distance, filter far ones)
                // (4) All vertical lines between the horizontal lines
                // (5) Split into cells by horizontal and vertical lines, find text in each cell
        
                // (1) Find all text containing "No." (序 号 = serial number, keep in code for data match)
                let findTexts = allTexts.filter(t => t.text.indexOf('序 号') >= 0);
        
                let data = [];
                for(let t = 0; t < findTexts.length; t++) {
                    let text = findTexts[t];
                    // (2) Locate horizontal lines above the No. text
                    let textAboveHLines = allHVLines.filter(ln => ln.isHorzLine && text.bounds.scale(3).contains(ln.geoStart)); // can optimize: find nearest horizontal line
                    if (textAboveHLines.length == 0) continue;
                    // Take first one
                    let hortLineStartPoint = textAboveHLines[0].geoStart;
                    let hortLineEndPoint = textAboveHLines[0].geoEnd;
                    // (3) Find horizontal lines with same x (can optimize by distance, filter far ones)
                    let textAboveAllHLines = allHVLines.filter(ln => ln.isHorzLine && vjmap.isZero(ln.geoStart.x - hortLineStartPoint.x, 2) && vjmap.isZero(ln.geoEnd.x - hortLineEndPoint.x, 2));
                    // Get min and max y
                    let yMinValue = Math.min.apply(null, textAboveAllHLines.map(ln => ln.geoStart.y)); // min y
                    let yMaxValue = Math.max.apply(null, textAboveAllHLines.map(ln => ln.geoStart.y)); // max y
                    let ySet = new Set();
                    textAboveAllHLines.forEach(ln => {
                        let y = ln.geoStart.y.toFixed(2);
                        ySet.add(y);
                    });
                    // Form table rectangle from minx, miny, maxx, maxy
                    let tableBounds = vjmap.GeoBounds.fromArray([hortLineStartPoint.x, yMinValue, hortLineEndPoint.x, yMaxValue]);
                    // Slightly expand bounds so points on edge are included
                    tableBounds = tableBounds.scale(1.001);
                    // (4) All vertical lines between the horizontal lines
                    let textAboveAllVLines = allHVLines.filter(ln => !ln.isHorzLine && tableBounds.contains(ln.geoStart) && tableBounds.contains(ln.geoEnd));
                    // Get all x coordinates
                    let xSet = new Set();
                    textAboveAllVLines.forEach(ln => {
                        let x = ln.geoStart.x.toFixed(2);
                        xSet.add(x);
                    });
                    let xArr = Array.from(xSet);
                    let yArr = Array.from(ySet);
                    xArr = xArr.map(x => +x).sort((a, b) => a - b);
                    yArr = yArr.map(y => +y).sort((a, b) => a - b);
                    let rows = []
                    for (let n = 0; n < yArr.length - 1; n++) {
                        let row = []
                        for (let m = 0; m < xArr.length - 1; m++) {
                            // Compute cell bounds
                            let bounds = vjmap.GeoBounds.fromArray([xArr[m], yArr[n], xArr[m + 1], yArr[n + 1]]);
                            // Find all text in this cell
                            let texts = allTexts.filter(t => bounds.contains(t.center));
                            if (texts.length == 0) {
                                row.push('')
                            } else {
                                row.push(texts[0].text); // if multiple, handle as needed
                            }
                        }
                        rows.push(row)
                    }
                    console.table(rows)
                    data.push(rows);
                }
                return data;
            }
        
        
        
        
        // UI implementation using Element UI for demo
            if (typeof Vue !== "object") {
                // If no Vue and Element UI environment
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
                    async exportByTable() {
                       let data = await pickTableData();
                       this.tableData = [];
                       // Total number of tables
                        let idx = 1;
                        for(let i = 0; i < data.length; i++) {
                            let item = {
                                id: idx++,
                                col1: `Table ${i + 1}`
                            }
                            this.tableData.push(item)
                            // Output each table's rows and columns
                            for(let row = 0; row < data[i].length; row++) {
                                let item = {
                                    id: idx++,
                                }
                                for(let col = 0; col < data[i][row].length; col++) {
                                    item['col'+ (col + 1)] = data[i][row][col]
                                }
                                this.tableData.push(item)
                            }
                        }
                    }
                },
                template: `
          <template>
            <div style="position: absolute; z-index: 2">
                <el-row>
                  <el-button type="primary" @click="exportByTable">Extract table data from map</el-button>
                </el-row>
        
                <el-row>
                 <el-table
                  v-if="tableData.length"
                  :data="tableData"
                  height="400"
                  style="width: 620px;">
                  <el-table-column
                    prop="id"
                    label="No."
                    width="50">
                  </el-table-column>
                   <el-table-column  v-for="items in 20" :key="items.index" :label="items"
                     :prop="'col' + items">
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