const { message } = antd; // 第三方库用于消息提示
window.onload = async () => {
    const env = {
        serviceUrl: "https://vjmap.com/server/api/v1",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiVXNlcm5hbWUiOiJhZG1pbjEiLCJOaWNrTmFtZSI6ImFkbWluMSIsIkF1dGhvcml0eUlkIjoiYWRtaW4iLCJCdWZmZXJUaW1lIjo4NjQwMCwiZXhwIjo0ODEzMjY3NjM3LCJpc3MiOiJ2am1hcCIsIm5iZiI6MTY1OTY2NjYzN30.cDXCH2ElTzU2sQU36SNHWoTYTAc4wEkVIXmBAIzWh6M",
        exampleMapId: "sys_zp",
        assetsPath: "../../../assets/",
        ...__env__ // 如果您已私有化部署，需要连接已部署的服务器地址和token，请打开js/env.js,修改里面的参数
    };
    try {
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/div/divOverlayRadar
        // --Div overlay radar effect--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
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
            zoom: 3, // set map zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        map.setRasterOpacity(svc.rasterLayerId(), 0.3);
        
        const mapBounds = map.getGeoBounds(0.1);
        const points = [[mapBounds.min.x, mapBounds.min.y], [mapBounds.min.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.min.y]]
        const marker = new vjmap.Marker();
        marker.setLngLat(map.toLngLat(mapBounds.center()));
        marker.addTo(map);
        
        const width = 400;
        const height = 400;
        const div = document.createElement( "div" );
        div.innerHTML = `
                        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style="stop-color:rgb(0,255,0);stop-opacity:.8" />
                                    <stop offset="50%" style="stop-color:rgb(0,150,0);stop-opacity:.5" />
                                    <stop offset="100%" style="stop-color:rgb(0,30,0);stop-opacity:.1" />
                                </linearGradient>
                                <path d="M 373.20508075688775 300 A 200 200 0 0 0 200 0 L 200 200 Z" fill="url(#grad1)" xmlns="http://www.w3.org/2000/svg" />
                               <animateTransform attributeName="transform" begin="0s" dur="3s" type="rotate" from="0 200 200" to="360 200 200" repeatCount="indefinite" />
                            </g>
                        </svg>
                    `;
        div.style.pointerEvents = "none"
        div.style.width = width + "px";
        div.style.height = height + "px";
        div.style.opacity = '0.8';
        div.style.position = "absolute";// with multiple div overlays, position is required for correct draw
        
        const divOverlay = new vjmap.DivOverlay({
            bounds: points,
            element: div,
            width: width,
            height: height,
            updateDivSize: true, // required if SVG needs to scale
            maxZoom: 6
        })
        divOverlay.addTo(map);
        
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