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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/draw/02drawApiAddButton
        // --Custom add/hide draw control buttons--
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
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set zoom level
            pitch: 0, // pitch angle
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to bounds
        //map.fitMapBounds();
        await map.onLoad();
        
        const mapBounds = map.getGeoBounds(0.6);
        
        const opts = vjmap.cloneDeep(vjmap.Draw.defaultOptions());
        // https://vjmap.com/guide/draw.html
        // Can hide default buttons
        opts.controls.cutPolygon = false;// do not show cut polygon
        /*
        combine_features: true,
        cutPolygon: false,
        drawCircle: true,
        drawRectangle: true,
        line_string: true,
        point: true,
        polygon: true,
        redo: true,
        snap_mode_grid: true,
        snap_mode_snap: true,
        splitLine: true,
        trash: true,
        uncombine_features: true,
        undo: true,
        */
        
        // Controls to add
        opts.addControls = [
            {
                id: "getSelected",
                title: "Get selected count",
                className: "my_class_1",
                style: {
                    "background-image": `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M10,10L12,22L26,22z" fill="blue"/></svg>')`
                },
                onActivate: (ctx) => {
                    let sels = ctx.api.getSelectedIds();
                    message.info(`Selected count: ${sels.length}`);
                }
        
            },
            {
                id: "getAllCoord",
                title: "Get all drawn entity coordinates",
                className: "my_class_2",
                style: {
                    "background-image": `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M10,10L10,22L22,22L22,10z" fill="red"/></svg>')`
                },
                onActivate: (ctx) => {
                    let all = ctx.api.getAll();
                    let tip = "";
                    for(let f of all.features) {
                        let featureType = f.geometry.type;
                        // convert lng/lat to map coordinates
                        let co = map.fromLngLat(f.geometry.coordinates);
                        tip += `${featureType}: ${JSON.stringify(co)};  `
                    }
                    message.info(tip);
                }
        
            }
        ];
        
        const draw = new vjmap.Draw.Tool(opts);
        map.addControl(draw, 'top-right');
        
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