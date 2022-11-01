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
        // --提取图中规律数据生成表格数据--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: "sys_exporttable", // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
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
            style: svc.rasterStyle(),
            center: [-24.367859677916186, 9.801896698976805], // 中心点
            zoom: 5,
            pitch: 0,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
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
        
        // 查询所有的圆
        let mapAllCircles = []; // 地图中所有的圆
        const queryAllCircle = async () => {
            let queryEntTypeId = getTypeNameById("AcDbCircle");
            let query = await svc.conditionQueryFeature({
                condition: `name='${queryEntTypeId}'`, // 只需要写sql语句where后面的条件内容,字段内容请参考文档"服务端条件查询和表达式查询"
                fields: "",
                limit: 100000 //设置很大，相当于把所有的圆都查出来。不传的话，默认只能取100条
            })
            if (query.error) {
                message.error(query.error)
            } else {
                if (query.recordCount > 0) {
                    for (var i = 0; i < query.recordCount; i++) {
                        let bounds = map.getEnvelopBounds(query.result[i].envelop);
                        mapAllCircles.push({
                            bounds, // 圆的坐标范围
                            center: bounds.center(), // 中心点
                            radius: bounds.width() / 2.0, // 半径
                            color: map.entColorToHtmlColor(query.result[i].color), // 颜色
                            objectid: query.result[i].objectid // id
                        })
                    }
                }
            }
        }
        await queryAllCircle();
        
        // 给定一个范围（点坐标序列）和圆半径大小，和一个角度值，把数据导出成表格
        const exportTableData = (polygons, radius, rotateAngle) => {
            // 先找出半径相同的
            let circles = mapAllCircles.filter(c => vjmap.isZero(c.radius - radius));
            // 再根据查找范围来过滤
            polygons = polygons.map(p => vjmap.geoPoint(p)) // 转成GeoPoint类型
            circles = circles.filter(c => vjmap.isPointInPolygon(c.center, polygons));
            if (rotateAngle && circles.length > 0) {
                // 如果有旋转角度，则需要把每个点的坐标旋转一个角度，弄成水平的
                let rotateCenter = circles[0].center; // 围绕第一个点旋转吧
                for(let i = 0; i < circles.length; i++) {
                    let ang = vjmap.degreesToRadians(rotateAngle); // 角度值转弧度值
                    let rotatePoint = circles[i].center.roateAround(ang, rotateCenter);
                    circles[i].rotatePoint = rotatePoint;
                    // new vjmap.Marker({color: "red"}).setLngLat(map.toLngLat(rotatePoint)).addTo(map) // 调试用
                }
            }
            // 获取不同的y值，看总共有几行
            let coYSet = new Set();
            circles.forEach(c => {
                let y = c.rotatePoint.y;
                // 如果误差没有比这个小的，则加入set中
                let find = false;
                for(let s of coYSet) {
                    // 以直径做为误差值
                    if (vjmap.isZero(s - y, radius * 2)) {
                        find = true;
                        break;
                    }
                }
                if (!find) {
                    coYSet.add(y);
                }
            });
            // 把Y坐标排序
            let coYArr = Array.from(coYSet);
            coYArr = coYArr.sort((a, b) => b - a) ;// 倒序排序
        
            let tableData = [];
            let id = 0;
            for(let i = 0; i < coYArr.length; i++) {
                // 先找出此行的数据，再按x排序
                let rowCirlces = circles.filter(c => vjmap.isZero(coYArr[i] - c.rotatePoint.y, radius * 2));
                rowCirlces = rowCirlces.sort((a,b) => a.rotatePoint.x - b.rotatePoint.x); // x排序
                for(let r = 0; r < rowCirlces.length; r++) {
                    let cell = {
                        id: ++id,
                        no: `${i + 1}-${r + 1}`,
                        center: rowCirlces[r].center,
                        objectid: rowCirlces[r].id,
                        co: rowCirlces[r].center.toString(4)
                    }
                    // 如果去重，如果和前一个坐标一样，则不用加了
                    if (tableData.length > 0 && tableData[tableData.length - 1].center.equals(cell.center)) continue;
                    tableData.push(cell)
                }
            }
            return tableData;
        }
        
        // 直接给定参数导出表格数据
        const exportTableByParam = () => {
            // 范围
            let points = [
                [518985.5263,4331102.8932],
                [519033.1877,4331132.204],
                [519053.2113,4331104.3143],
                [519008.5544,4331073.8486],
            ]
            return exportTableData(points, 0.2, -41.6478);
        }
        
        // 交互选择范围和角度导出表格数据
        let snapObj = {}; // 设置的捕捉的实体
        const exportTableByMutual = async () => {
            message.info("请绘制一个多边形，范围包含要导出的圆数据点")
            let drawSlantRect = await vjmap.Draw.actionDrawPolygon(map, {
                pointCount: 4,// 只需 四个点，绘制完四个点后，自动结束
            });
            if (drawSlantRect.cancel) {
                return; // 取消了
            }
            // 获取绘制的坐标
            let points = map.fromLngLat(drawSlantRect.features[0].geometry.coordinates[0]);
            message.info("请绘制一条直线，确定旋转角度");
            let drawLine = await vjmap.Draw.actionDrawLineSting(map, {
                pointCount: 2,// 只需二个点，绘制完二个点后，自动结束
                api: {
                    getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                }
            });
            if (drawLine.cancel) {
                return; // 取消了
            }
            let linePoints = map.fromLngLat(drawLine.features[0].geometry.coordinates);
            let angle = -vjmap.radiansToDegrees(linePoints[1].angleTo(linePoints[0]));
            return exportTableData(points, 0.2, angle);
        }
        const addSnapPoint = async () => {
            // 获取捕捉点
            if (map.hasVectorLayer()) {
                // 矢量样式
                // 矢量样式获取捕捉点
                snapObj.features = map.queryRenderedFeatures({layers: ['vector-layer-lines']})
            } else {
                //栅格样式去服务器获取坐标点数据
                // 栅格样式获取捕捉点
                // 查询所有坐标数据,字段含义可参考https://vjmap.com/guide/svrStyleVar.html
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
        // 图标
        await map.loadImageEx("stretchTextBackImg", env.assetsPath + "images/textback.png", {
            // 可以水平拉伸的两列像素设置：(除了两边和中间两角形的部分，其他两部分都能拉伸)
            //-可以拉伸x:7和x:32之间的像素
            //-可以拉伸x:42和x:62之间的像素。
            stretchX: [
                [7, 32],
                [42, 62]
            ],
            // 可以垂直拉伸的一行像素设置：
            // y:3和y:19之间的像素可以拉伸
            stretchY: [[3, 19]],
            //图像的这一部分可以包含文本（[x1，y1，x2，y2]）：
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
                symbols.remove();// 如果有先删除了
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
                      <el-button type="primary" @click="exportByParam">提取圆并按规律生成表格数据</el-button>
                    </el-row>
                  <el-row>
                    <el-button type="success" @click="exportByMutual">手动拾取范围生成表格数据</el-button>
                  </el-row>
                  <el-row>
                    <el-button type="warning" @click="clearData">清空数据</el-button>
                  </el-row>
                    <el-row>
                     <el-table
                      v-if="tableData.length"
                      :data="tableData"
                      height="300"
                      style="width: 320px;">
                      <el-table-column
                        prop="id"
                        label="序号"
                        width="50">
                      </el-table-column>
                      <el-table-column
                        prop="no"
                        label="编号"
                        width="60">
                      </el-table-column>
                      <el-table-column
                        prop="co"
                        label="坐标">
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