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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/overlay/div/divOverlayGradientPolygon
        // --Div overlay gradient polygon--
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
        
        // Convert geo points in a bounds to SVG coordinates; svgWidth is SVG width, height is computed by aspect ratio
        function toSvgPath(svgWidth, points, bounds, isClose) {
            if (!bounds) {
                // If no bounds, compute from point array
                bounds = vjmap.GeoBounds.fromDataExtent(points);
            }
            const svgHeight = bounds.height() * svgWidth / bounds.width();
            const xRadio = svgWidth / bounds.width();
            const yRadio = svgHeight / bounds.height();
            const coords = points.map(e => [(e[0] - bounds.min.x) * xRadio, svgHeight - (e[1] - bounds.min.y) * yRadio]);
            let path = `M ${coords[0][0]} ${coords[0][1]}`;
            const toPath = coords.slice(1).reduce((c, a) => c + ` L ${a[0]} ${a[1]}`, "");
            path = path + toPath + (isClose ? " Z" : "")
            return {
                path,
                coords,
                bounds,
                svgWidth,
                svgHeight
            }
        }
        
        const mapBounds = map.getGeoBounds(0.1);
        const randPoint = mapBounds.randomPoint();
        const points = [[mapBounds.min.x, mapBounds.min.y], [mapBounds.min.x, mapBounds.max.y], [randPoint.x, randPoint.y], [mapBounds.max.x, mapBounds.max.y], [mapBounds.max.x, mapBounds.min.y]]
        const markers = []
        // Add markers for position reference
        for(let c = 0; c <  points.length; c++) {
            const marker = new vjmap.Marker();
            marker.setLngLat(map.toLngLat(points[c])).addTo(map);
            markers.push(marker);
        }
        
        
        const width = 2000;
        const svgPath = toSvgPath(width, points);
        const height = svgPath.svgHeight;
        const div = document.createElement( "div" );
        div.innerHTML = `
                        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <radialGradient r="0.5" cy="0.5" cx="0.5" id="grad1">
                                   <stop stop-color="#ff0000" offset="0"></stop>
                                   <stop stop-color="#ffff00" offset="1"></stop>
                                </radialGradient>
                                <path d="${svgPath.path}" fill="url(#grad1)" xmlns="http://www.w3.org/2000/svg" />
                            </g>
                        </svg>
                    `;
        div.style.pointerEvents = "none"
        div.style.width = width + "px";
        div.style.height = height + "px";
        div.style.opacity = '0.8';
        div.style.zIndex = '-1';
        div.style.position = "absolute";// with multiple div overlays, position is required for correct draw
        
        const svgBounds = svgPath.bounds;
        const divOverlay = new vjmap.DivOverlay({
            bounds: [[svgBounds.min.x, svgBounds.min.y], [svgBounds.min.x, svgBounds.max.y], [svgBounds.max.x, svgBounds.max.y], [svgBounds.max.x, svgBounds.min.y]],
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