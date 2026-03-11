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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/06toolMeasure
        // --Distance and area measure tool (method 1)--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // if open failed
            message.error(res.error)
        }
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster here
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 2, // set zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        map.fitMapBounds();
        
        await map.onLoad();
        
        
        class MapMeasureTool {
            constructor () {
                this.linePopupWindow = undefined // distance result popup
                this.areaPopupWindow = undefined // area result popup
                this.isMeasureType = '' //
                vjmap.bindAll(['measureMethod'], this)
            }
            onAdd (map) {
                this.map = map
                // init draw
                const  opts = vjmap.cloneDeep(vjmap.Draw.defaultOptions()); // clone, do not mutate original
                for(let c in opts.controls) {
                    opts.controls[c] = false;// hide all controls initially
                }
                this.mapMeasureDrawTool = new vjmap.Draw.Tool(opts);
        
                this.map.addControl(this.mapMeasureDrawTool, 'top-left')
                // init buttons
                this.initMeasureToolControl()
        
                // line measure button click
                this.lineButton.addEventListener('click', () => {
                    if (this.isMeasureType === '' || this.isMeasureType === 'polygon') {
                        this.clearMeasure()
                        // start distance measure
                        this.isMeasureType = 'line'
                        this.map.on('draw.create', this.measureMethod)
                        this.mapMeasureDrawTool.changeMode('draw_line_string')
                    } else {
                        this.clearMeasure()
                    }
                })
        
                // area measure button click
                this.areaButton.addEventListener('click', () => {
                    if (this.isMeasureType === '' || this.isMeasureType === 'line') {
                        this.clearMeasure()
                        // start area measure
                        this.isMeasureType = 'polygon'
                        this.map.on('draw.create', this.measureMethod)
                        this.mapMeasureDrawTool.changeMode('draw_polygon')
                    } else {
                        this.clearMeasure()
                    }
                })
        
                return this.container
            }
        
            // clear
            clearMeasure () {
                this.isMeasureType = ''
                this.mapMeasureDrawTool.deleteAll()
                if (this.linePopupWindow) {
                    this.linePopupWindow.remove()
                    this.linePopupWindow = undefined
                }
                if (this.areaPopupWindow) {
                    this.areaPopupWindow.remove()
                    this.areaPopupWindow = undefined
                }
            }
        
            // measure result
            measureMethod () {
                let data = this.mapMeasureDrawTool.getAll()
                if (data.features.length > 0) {
                    if (this.isMeasureType === 'line') {
                        const coordinates = data.features[0].geometry.coordinates
                        const position = coordinates[coordinates.length - 1]
                        let result = vjmap.Math2D.lineDist(this.map.fromLngLat(coordinates)) / 1000.0;
                        result = result.toFixed(2);
                        this.linePopupWindow = new vjmap.Popup({ closeButton: false, closeOnClick: false })
                        this.linePopupWindow.setLngLat(position).setHTML('<div>Distance: ' + result + ' (km)</div>').addTo(this.map)
                    } else if (this.isMeasureType === 'polygon') {
                        const coordinates = this.map.fromLngLat(data.features[0].geometry.coordinates[0]);
                        const center = vjmap.polygonCentroid(coordinates);
                        let result = vjmap.calcPolygonArea(coordinates) / 1e6;
                        result = result.toFixed(2);
                        this.areaPopupWindow = new vjmap.Popup({ closeButton: false, closeOnClick: false })
                        this.areaPopupWindow.setLngLat(map.toLngLat(center)).setHTML('<div>Area: ' + result + ' (km²)</div>').addTo(this.map)
                    }
                }
                this.map.off('draw.create', this.measureMethod)
            }
        
            initMeasureToolControl () {
                const iconRuler = '<svg t="1575453922172" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5140" width="25" height="30"><path d="M64 335.8v352c0 8.8 6.9 16 15.4 16h865.1c8.5 0 15.4-7.2 15.4-16v-352c0-8.8-6.9-16-15.4-16h-865c-8.6 0-15.5 7.2-15.5 16z m833.2 304H128.8v-256h768.4v256z" p-id="5141"></path><path d="M202.5 577.6h30v62h-30zM320.3 485.3h30v154h-30zM438.1 577.6h30v62h-30zM555.9 485.3h30v154h-30zM673.7 577.6h30v62h-30zM791.5 485.3h30v154h-30z" p-id="5142"></path></svg>'
                const iconArea = '<svg t="1575453274789" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4964" width="25" height="25"><path d="M947.93351 255.639285c16.063496 0 29.06104-12.998035 29.06104-29.059849L976.99455 73.015967c0-16.062837-12.997545-29.060873-29.06104-29.060873L794.334073 43.955094c-16.034842 0-29.060017 12.998035-29.060017 29.060873L765.274056 120.750131l-94.33837 0c-2.937009-0.451278-5.928256-0.451278-8.864241 0L258.72799 120.750131 258.72799 73.015967c0-16.062837-13.027222-29.060873-29.062063-29.060873L76.067513 43.955094c-16.063496 0-29.062063 12.998035-29.062063 29.060873l0 153.563468c0 16.062837 12.998568 29.059849 29.062063 29.059849l47.737143 0 0 506.581594L76.067513 762.220878c-16.063496 0-29.062063 12.997012-29.062063 29.059849l0 153.563468c0 16.062837 12.998568 29.059849 29.062063 29.059849l153.598414 0c16.034842 0 29.062063-12.997012 29.062063-29.059849l0-47.735188 506.545043 0 0 47.735188c0 16.062837 13.026198 29.059849 29.060017 29.059849l153.599437 0c16.063496 0 29.06104-12.997012 29.06104-29.059849L976.993527 791.281751c0-16.062837-12.997545-29.059849-29.06104-29.059849l-47.737143 0L900.195344 354.582761c0.050144-0.984421 0.050144-1.970888 0-2.955308l0-95.988168L947.93351 255.639285zM823.39716 102.07684l95.473264 0 0 95.441723-95.473264 0L823.39716 102.07684zM181.928783 459.920878c1.707968-1.102101 3.328951-2.394537 4.825086-3.89061l277.168724-277.158391 132.079449 0L181.928783 592.929194 181.928783 459.920878zM105.129576 102.07684l95.473264 0 0 46.62797c-0.014327 0.367367-0.02763 0.734734-0.02763 1.106194s0.014327 0.738827 0.02763 1.106194l0 46.601364-95.473264 0L105.129576 102.07684zM229.665927 255.639285c16.034842 0 29.062063-12.998035 29.062063-29.059849l0-47.707558 123.003375 0L181.928783 378.666272 181.928783 255.639285 229.665927 255.639285zM181.928783 675.116031l496.265511-496.244154 87.079762 0 0 35.606962L217.509574 762.220878l-35.580791 0L181.928783 675.116031zM105.129576 915.784346l0-95.441723 95.473264 0 0 46.600341c-0.014327 0.367367-0.02763 0.735757-0.02763 1.106194s0.014327 0.738827 0.02763 1.106194l0 46.62797L105.129576 915.783323zM842.071217 553.748846 563.784997 832.022641c-2.10912 2.109034-3.823229 4.460592-5.148464 6.965645L426.365717 838.988286l415.7055-415.688467L842.071217 553.748846zM918.870424 915.784346l-95.473264 0 0-95.441723 95.473264 0L918.870424 915.784346zM794.334073 762.220878c-16.034842 0-29.060017 12.997012-29.060017 29.059849l0 47.706535L639.011318 838.987263l203.060922-203.051579 0 126.284171L794.334073 762.219855zM842.071217 341.111958 344.174489 838.988286l-85.446499 0 0-35.795251 547.576186-547.552727 35.76704 0L842.071217 341.111958z" p-id="4965"></path></svg>'
        
                this.container = document.createElement('div')
                this.container.classList.add('vjmapgis-ctrl')
                this.container.classList.add('vjmapgis-ctrl-group')
        
                // distance
                this.lineButton = document.createElement('button')
                this.lineButton.classList.add('vjmapgis-ctrl-measure-line-tool')
                this.lineButton.title = 'Measure distance'
                this.lineButton.innerHTML = iconRuler
                this.container.appendChild(this.lineButton)
        
                // area
                this.areaButton = document.createElement('button')
                this.areaButton.classList.add('vjmapgis-ctrl-measure-area-tool')
                this.areaButton.title = 'Measure area'
                this.areaButton.innerHTML = iconArea
                this.container.appendChild(this.areaButton)
            }
        
            onRemove () {
                this.container.parentNode.removeChild(this.container)
                this.map = undefined
            }
        }
        map.addControl(new MapMeasureTool(), 'top-right')
        
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