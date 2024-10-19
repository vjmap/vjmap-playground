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
        // --定位图中表格并提取表格数据--
        // !!! 注： 自动提取图中所有表格，在后台已有更好的实现方法。
        // 可打开图 https://vjmap.com/app/cloud/#/map/sys_table?version=v1&mapopenway=GeomRender&vector=false
        // 在“更多功能” 里面 点击 "自动提取图中所有表格"
        // 下面示例实现了如果自己写算法提取表格数据的一个简单的思路
            let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
            let res = await svc.openMap({
                mapid: "sys_table", // 地图ID
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
                center:  prj.toLngLat(mapExtent.center()), // 设置地图中心点
                zoom: 2, // 设置地图缩放级别
                renderWorldCopies: false // 不显示多屏地图
            });
        
        // 关联服务对象和投影对象
            map.attach(svc, prj);
            map.doubleClickZoom.disable(); // 禁止地图双击放大
            let mapBounds = map.getGeoBounds(0.4);
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
        
            // 在图中查找所有的直线段
            const  getMapHVLines = async () => {
                // 查找图中所有的直线，二三维多段线
                let queryEntTypes = ['AcDbLine', 'AcDbPolyline', 'AcDb2dPolyline', 'AcDb3dPolyline'];
                let cond = queryEntTypes.map(t => `name='${getTypeNameById(t)}'`).join(' or '); // sql条件
        
                let result = [];
                let beginPos = 0; // 记录查询开始位置
                // 有可能记录数会很多，这里用分页查询
                while(true) {
                    let query = await svc.conditionQueryFeature({
                        condition: cond, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                        fields: "objectid,points,envelop", // 只要id,坐标
                        beginpos: beginPos, // 记录开始位置
                        limit: 100000 // 每次查10万条
                    });
                    beginPos += query.result.length; // 开始位置位置挪动
                    result.push(...query.result || []);
                    if (result.length >= query.recordCount) break;
                }
        
                result = result.filter(e => {
                    let points = e.points.split(";");
                    if (points.length !=2 ) return false;
                    e.geoStart = vjmap.GeoPoint.fromString(points[0]);
                    delete e.geoStart.z;// 不考虑z值
                    e.geoEnd = vjmap.GeoPoint.fromString(points[1]);
                    delete e.geoEnd.z;// 不考虑z值
        
                    if (e.geoStart.x > e.geoStart.x) {
                        // 交换下
                        let temp = e.geoStart;
                        e.geoStart = e.geoEnd;
                        e.geoEnd = temp;
                    }
                    e.startPoint = e.geoStart.toString();
                    e.endPoint =  e.geoEnd.toString();
                    if (e.startPoint == e.endPoint) {
                        // 同一个点
                        return false;
                    }
                    let line = points.map(e=>vjmap.geoPoint(e.split(",")))
                    let isVLine = vjmap.isZero(line[0].x - line[1].x);//竖线
                    let isHLine = vjmap.isZero(line[0].y - line[1].y);//横线
                    if (!(isVLine || isHLine)) return false; // 并且是横线或竖线
        
                    e.isHorzLine = isHLine;
                    return true
                })
                return result;
            }
        
            // 获取所有文本
            const getAllTexts = async ()=> {
                // 实体类型ID和名称映射
                const { entTypeIdMap } = await svc.getConstData();
                const getTypeNameById = name => Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === name);
                let allTexts = [];
                let queryTextEntTypeId = getTypeNameById("AcDbText"); // 单行文字
                let queryMTextEntTypeId = getTypeNameById("AcDbMText"); // 多行文字
                let queryAttDefEntTypeId = getTypeNameById("AcDbAttributeDefinition"); // 属性定义文字
                let queryAttEntTypeId = getTypeNameById("AcDbAttribute"); // 属性文字
                let query = await svc.conditionQueryFeature({
                    condition: `name='${queryTextEntTypeId}' or name='${queryMTextEntTypeId}' or name='${queryAttDefEntTypeId}' or name='${queryAttEntTypeId}'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                    fields: "",
                    geom: true,
                    limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
                })
                if (query.error) {
                    message.error(query.error);
                    return;
                } else {
                    if (query.recordCount > 0) {
                        for(let i = 0; i < query.recordCount; i++) {
                            let bounds = map.getEnvelopBounds(query.result[i].envelop);
                            let clr = vjmap.entColorToHtmlColor(query.result[i].color); // 实体颜色转html颜色(
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
        
                //（1）查找所有有"序 号"
                // (2) 定位到序号上面的水平线，
                // (3) 查找此水平线x坐标一样的水平线(可以根据距离优化下，太远的可以过滤掉)
                // (4) 水平线之间的所有垂直线
                //（5） 根据水平线和垂直线拆分成一个个单元格，查找单元格里面的文字
        
                //（1）查找所有有"序 号"
                let findTexts = allTexts.filter(t => t.text.indexOf('序 号') >= 0);
        
                let data = [];
                for(let t = 0; t < findTexts.length; t++) {
                    let text = findTexts[t];
                    // (2) 定位到序号上面的水平线，
                    let textAboveHLines = allHVLines.filter(ln => ln.isHorzLine && text.bounds.scale(3).contains(ln.geoStart)); // 这里可以再优化下，比较找最近的水平线
                    if (textAboveHLines.length == 0) continue;
                    // 取第一条
                    let hortLineStartPoint = textAboveHLines[0].geoStart;
                    let hortLineEndPoint = textAboveHLines[0].geoEnd;
                    //  (3) 查找此水平线x坐标一样的水平线(可以根据距离优化下，太远的可以过滤掉)
                    let textAboveAllHLines = allHVLines.filter(ln => ln.isHorzLine && vjmap.isZero(ln.geoStart.x - hortLineStartPoint.x, 2) && vjmap.isZero(ln.geoEnd.x - hortLineEndPoint.x, 2));
                    // 获取最大和最小y值
                    let yMinValue = Math.min.apply(null, textAboveAllHLines.map(ln => ln.geoStart.y)); // 数据最小值
                    let yMaxValue = Math.max.apply(null, textAboveAllHLines.map(ln => ln.geoStart.y)); // 数据最大值
                    let ySet = new Set();
                    textAboveAllHLines.forEach(ln => {
                        let y = ln.geoStart.y.toFixed(2);
                        ySet.add(y);
                    });
                    // 根据minx, miny, maxx, mayy生成表格矩形范围
                    let tableBounds = vjmap.GeoBounds.fromArray([hortLineStartPoint.x, yMinValue, hortLineEndPoint.x, yMaxValue]);
                    // 为了防止点刚好在范围上，把范围稍放大一点点
                    tableBounds = tableBounds.scale(1.001);
                    // (4) 水平线之间的所有垂直线
                    let textAboveAllVLines = allHVLines.filter(ln => !ln.isHorzLine && tableBounds.contains(ln.geoStart) && tableBounds.contains(ln.geoEnd));
                    // 获取所有的x坐标
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
                            // 把单元格的范围算出来
                            let bounds = vjmap.GeoBounds.fromArray([xArr[m], yArr[n], xArr[m + 1], yArr[n + 1]]);
                            // 查找此单元格里面所有的文字
                            let texts = allTexts.filter(t => bounds.contains(t.center));
                            if (texts.length == 0) {
                                row.push('')
                            } else {
                                row.push(texts[0].text); // 如果有多个，自行看着处理下吧
                            }
                        }
                        rows.push(row)
                    }
                    console.table(rows)
                    data.push(rows);
                }
                return data;
            }
        
        
        
        
        // ui实现。这里用element ui做为演示
            if (typeof Vue !== "object") {
                // 如果没有vue和elementui环境
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
                       // 总共有多少个表
                        let idx = 1;
                        for(let i = 0; i < data.length; i++) {
                            let item = {
                                id: idx++,
                                col1: `第 ${i + 1} 个表`
                            }
                            this.tableData.push(item)
                            // 输出每个表的行列值
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
                  <el-button type="primary" @click="exportByTable">提取图中表格数据</el-button>
                </el-row>
        
                <el-row>
                 <el-table
                  v-if="tableData.length"
                  :data="tableData"
                  height="400"
                  style="width: 620px;">
                  <el-table-column
                    prop="id"
                    label="序号"
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