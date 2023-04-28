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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/07toolMeasure2
        // --测距量测面积工具(方式二)--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.vectorStyle(), // 样式，这里是矢量样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        map.fitMapBounds();
        
        await map.onLoad();
        
        let snapObj = {}; // 设置的捕捉的实体
        class MapMeasureTool {
            constructor () {
                this.linePopupWindow = undefined // 测距结果显示
                this.areaPopupWindow = undefined // 测面结果显示
                this.polyline = null;
                this.polygon = null;
                vjmap.bindAll(['measureMethod'], this)
            }
            onAdd (map) {
                this.map = map
        
                // 初始化按钮
                this.initMeasureToolControl()
        
                // 测距按钮点击事件
                this.lineButton.addEventListener('click', async () => {
                    this.clearMeasure();
        
                    let line = await vjmap.Draw.actionDrawLineSting(map, {
        				api: {
                            getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                        }
        			});
                    if (line.cancel) {
                        return ;// 取消操作
                    }
        
                    this.polyline = new vjmap.Polyline({
                        data: line.features[0].geometry.coordinates,
                        lineColor: 'red',
                        lineWidth: 2
                    });
                    this.polyline.addTo(map);
                    this.measureMethod(line.features[0])
                })
        
                // 测面按钮点击事件
                this.areaButton.addEventListener('click', async () => {
                    this.clearMeasure();
        
                    let polygon = await vjmap.Draw.actionDrawPolygon(map, {
        				api: {
                            getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                        }
        			});
                    if (polygon.cancel) {
                        return ;// 取消操作
                    }
        
                    this.polygon = new vjmap.Polygon({
                        data: polygon.features[0].geometry.coordinates,
                        fillColor: 'green',
                        fillOpacity: 0.3,
                        fillOutlineColor: "#f00",
                    });
                    this.polygon.addTo(map);
                    this.measureMethod(polygon.features[0])
                })
        
                return this.container
            }
        
        
        
            // 测量结果
            measureMethod (feature) {
                if (feature.geometry.type === 'LineString') {
                    const coordinates = feature.geometry.coordinates
                    const position = coordinates[coordinates.length - 1]
                    let result = vjmap.Math2D.lineDist(this.map.fromLngLat(coordinates)) / 1000.0;
                    result = result.toFixed(2);
                    this.linePopupWindow = new vjmap.Popup({ closeButton: false, closeOnClick: false })
                    this.linePopupWindow.setLngLat(position).setHTML('<div>距离：' + result + ' (km)</div>').addTo(this.map)
                } else if (feature.geometry.type === 'Polygon') {
                    const coordinates = this.map.fromLngLat(feature.geometry.coordinates[0]);
                    const center = vjmap.polygonCentroid(coordinates);
                    let result = vjmap.calcPolygonArea(coordinates) / 1e6;
                    result = result.toFixed(2);
                    this.areaPopupWindow = new vjmap.Popup({ closeButton: false, closeOnClick: false })
                    this.areaPopupWindow.setLngLat(map.toLngLat(center)).setHTML('<div>面积：' + result + ' (km²)</div>').addTo(this.map)
                }
            }
        
            initMeasureToolControl () {
                const iconRuler = '<svg t="1575453922172" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5140" width="25" height="30"><path d="M64 335.8v352c0 8.8 6.9 16 15.4 16h865.1c8.5 0 15.4-7.2 15.4-16v-352c0-8.8-6.9-16-15.4-16h-865c-8.6 0-15.5 7.2-15.5 16z m833.2 304H128.8v-256h768.4v256z" p-id="5141"></path><path d="M202.5 577.6h30v62h-30zM320.3 485.3h30v154h-30zM438.1 577.6h30v62h-30zM555.9 485.3h30v154h-30zM673.7 577.6h30v62h-30zM791.5 485.3h30v154h-30z" p-id="5142"></path></svg>'
                const iconArea = '<svg t="1575453274789" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4964" width="25" height="25"><path d="M947.93351 255.639285c16.063496 0 29.06104-12.998035 29.06104-29.059849L976.99455 73.015967c0-16.062837-12.997545-29.060873-29.06104-29.060873L794.334073 43.955094c-16.034842 0-29.060017 12.998035-29.060017 29.060873L765.274056 120.750131l-94.33837 0c-2.937009-0.451278-5.928256-0.451278-8.864241 0L258.72799 120.750131 258.72799 73.015967c0-16.062837-13.027222-29.060873-29.062063-29.060873L76.067513 43.955094c-16.063496 0-29.062063 12.998035-29.062063 29.060873l0 153.563468c0 16.062837 12.998568 29.059849 29.062063 29.059849l47.737143 0 0 506.581594L76.067513 762.220878c-16.063496 0-29.062063 12.997012-29.062063 29.059849l0 153.563468c0 16.062837 12.998568 29.059849 29.062063 29.059849l153.598414 0c16.034842 0 29.062063-12.997012 29.062063-29.059849l0-47.735188 506.545043 0 0 47.735188c0 16.062837 13.026198 29.059849 29.060017 29.059849l153.599437 0c16.063496 0 29.06104-12.997012 29.06104-29.059849L976.993527 791.281751c0-16.062837-12.997545-29.059849-29.06104-29.059849l-47.737143 0L900.195344 354.582761c0.050144-0.984421 0.050144-1.970888 0-2.955308l0-95.988168L947.93351 255.639285zM823.39716 102.07684l95.473264 0 0 95.441723-95.473264 0L823.39716 102.07684zM181.928783 459.920878c1.707968-1.102101 3.328951-2.394537 4.825086-3.89061l277.168724-277.158391 132.079449 0L181.928783 592.929194 181.928783 459.920878zM105.129576 102.07684l95.473264 0 0 46.62797c-0.014327 0.367367-0.02763 0.734734-0.02763 1.106194s0.014327 0.738827 0.02763 1.106194l0 46.601364-95.473264 0L105.129576 102.07684zM229.665927 255.639285c16.034842 0 29.062063-12.998035 29.062063-29.059849l0-47.707558 123.003375 0L181.928783 378.666272 181.928783 255.639285 229.665927 255.639285zM181.928783 675.116031l496.265511-496.244154 87.079762 0 0 35.606962L217.509574 762.220878l-35.580791 0L181.928783 675.116031zM105.129576 915.784346l0-95.441723 95.473264 0 0 46.600341c-0.014327 0.367367-0.02763 0.735757-0.02763 1.106194s0.014327 0.738827 0.02763 1.106194l0 46.62797L105.129576 915.783323zM842.071217 553.748846 563.784997 832.022641c-2.10912 2.109034-3.823229 4.460592-5.148464 6.965645L426.365717 838.988286l415.7055-415.688467L842.071217 553.748846zM918.870424 915.784346l-95.473264 0 0-95.441723 95.473264 0L918.870424 915.784346zM794.334073 762.220878c-16.034842 0-29.060017 12.997012-29.060017 29.059849l0 47.706535L639.011318 838.987263l203.060922-203.051579 0 126.284171L794.334073 762.219855zM842.071217 341.111958 344.174489 838.988286l-85.446499 0 0-35.795251 547.576186-547.552727 35.76704 0L842.071217 341.111958z" p-id="4965"></path></svg>'
        
                this.container = document.createElement('div')
                this.container.classList.add('vjmapgis-ctrl')
                this.container.classList.add('vjmapgis-ctrl-group')
        
                // 测距
                this.lineButton = document.createElement('button')
                this.lineButton.classList.add('vjmapgis-ctrl-measure-line-tool')
                this.lineButton.title = '测距'
                this.lineButton.innerHTML = iconRuler
                this.container.appendChild(this.lineButton)
        
                // 测面
                this.areaButton = document.createElement('button')
                this.areaButton.classList.add('vjmapgis-ctrl-measure-area-tool')
                this.areaButton.title = '测面'
                this.areaButton.innerHTML = iconArea
                this.container.appendChild(this.areaButton)
            }
        
            clearMeasure () {
                if (this.polyline) {
                    this.polyline.remove();
                    this.polyline = null;
                }
                if (this.polygon) {
                    this.polygon.remove();
                    this.polygon = null;
                }
                if (this.linePopupWindow) {
                    this.linePopupWindow.remove()
                    this.linePopupWindow = undefined
                }
                if (this.areaPopupWindow) {
                    this.areaPopupWindow.remove()
                    this.areaPopupWindow = undefined
                }
            }
        
            onRemove () {
                this.clearMeasure();
                this.container.parentNode.removeChild(this.container)
                this.map = undefined
            }
        }
        map.addControl(new MapMeasureTool(), 'top-right')
        
              
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
    catch (e) {
        console.error(e);
        message.error({
            content: "catch error: " + (e.message || e.response || JSON.stringify(e).substr(0, 80)),
            duration: 60,
            key: "err"
        });
    }
};