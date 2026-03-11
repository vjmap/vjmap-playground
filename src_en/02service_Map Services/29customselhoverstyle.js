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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29customselhoverstyle
        // --Custom select highlight style--Highlight effect when selecting entity
        // js code
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists or upload new map)
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
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        
        // Click to highlight (highlight when clicking on map element)
        let entBoundsPolyline;
        const drawBounds = (bounds) => {
            if (entBoundsPolyline) {
                entBoundsPolyline.remove();
                entBoundsPolyline = null;
            }
            if (!bounds) return;
            const routePath = [];
            routePath.push(bounds.min);
            routePath.push(vjmap.geoPoint([bounds.max.x, bounds.min.y]));
            routePath.push(bounds.max);
            routePath.push(vjmap.geoPoint([bounds.min.x, bounds.max.y]));
            routePath.push(bounds.min);
            let geoLineDatas = [];
            geoLineDatas.push({
                points: map.toLngLat(routePath),
                properties: {
                    opacity: 1.0
                }
            })
        
            entBoundsPolyline = new vjmap.Polyline({
                data: geoLineDatas,
                lineColor: 'yellow',
                lineWidth: 3,
                lineOpacity: ['get', 'opacity'],
                isHoverPointer: false,
                isHoverFeatureState: false
            });
            entBoundsPolyline.addTo(map);
        }
        map.enableLayerClickHighlight(svc, e => {
            drawBounds(e ? map.getEnvelopBounds(e.envelop) : null);
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        }, "#0000" /* Use "#0000" to disable default highlight */, null, (res) => {
            if (res && res.result && res.result.length >= 1 && res.result[0].isline) {
                return res;// If line, return as-is
            }
            return null;// Otherwise return null
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