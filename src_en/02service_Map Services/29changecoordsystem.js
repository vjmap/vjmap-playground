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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29changecoordsystem
        // --Change map coordinate system--
        // js code
        document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let mapid = "sys_hello";
        // Get original map metadata
        let metadata = await svc.metadata(mapid);
        let mapOldExtent = vjmap.GeoBounds.fromString(metadata.bounds);
        let mapExtent = mapOldExtent.scale(1.2) ;// Adjust default extent as needed; 1.2 for testing
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object (empty map first)
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            },
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        await map.onLoad();
        
        // Solve four-parameter from corresponding points
        
        // Two points on original map (e.g. rect top-left and bottom-right)
        let oldPoints = [
            vjmap.geoPoint([725.3179,18969.191]),
            vjmap.geoPoint([28662.1131,1273.0363])
        ];
        
        // Corresponding points in new coordinate system (e.g. 0.5 scale of rect)
        let newPoints = [
            vjmap.geoPoint([725.3179,18969.191]),
            vjmap.geoPoint([14693.7155,10121.1137])
        ]
        
        // Solve four-parameter from coordinates
        let fourparam = vjmap.coordTransfromGetFourParamter(newPoints, oldPoints, true); // No rotation
        // Result: offset by base point, then scale 2x to get original coords
        
        
        // Overlay other map via WMS on base map
        // Get map metadata for layer style
        let style = await svc.createStyle({
            backcolor: 0xFFFFFF // light theme
        }, mapid)
        
        // Layer in new coordinate system
        let wmsurl = svc.wmsTileUrl({
            mapid: mapid,
            version:"v1",
            layers: style.stylename,
            mapbounds: mapExtent, // Must be current coordinate system extent
            fourParameter: [fourparam.dx, fourparam.dy, fourparam.scale, fourparam.rotate]  // (offsetX, offsetY, scale, rotate)
        })
        
        map.addSource('wms-new-source', {
            'type': 'raster',
            'tiles': [
                wmsurl
            ],
            'tileSize': 256
        });
        map.addLayer({
                'id': 'wms-new-layer',
                'type': 'raster',
                'source': 'wms-new-source',
                'paint': { "raster-opacity": 1 }
            }
        );
        
        
        // Overlay previous layer
        let oldInvPoints = oldPoints.map(pt => {
            return vjmap.coordTransfromByInvFourParamter(pt, fourparam); // Inverse four-parameter to get coords in new system
        })
        // Compute new four-parameter from new points and inverse-mapped original points
        let fourparamOld = vjmap.coordTransfromGetFourParamter(newPoints, oldInvPoints, true);
        let wmsurlOld = svc.wmsTileUrl({
            mapid: mapid,
            version:"v1",
            layers: style.stylename,
            mapbounds: mapExtent, // Must be current coordinate system extent
            fourParameter: [fourparamOld.dx, fourparamOld.dy, fourparamOld.scale, fourparamOld.rotate]  // (offsetX, offsetY, scale, rotate)
        })
        
        map.addSource('wms-old-source', {
            'type': 'raster',
            'tiles': [
                wmsurlOld
            ],
            'tileSize': 256
        });
        map.addLayer({
                'id': 'wms-old-layer',
                'type': 'raster',
                'source': 'wms-old-source',
                'paint': { "raster-opacity": 0.3 }
            }
        );
        
        // Mark common points
        // Points in new coordinate system
        for(let pt of newPoints) {
            let marker = new vjmap.Marker({
                color: "green"
            });
            marker.setLngLat(map.toLngLat(pt)).addTo(map);
        }
        
        // Points on original map
        for(let pt of oldPoints) {
            let marker = new vjmap.Marker({
                color: "red"
            });
            marker.setLngLat(map.toLngLat(pt)).addTo(map);
        
            // To use original CAD coords, apply inverse four-parameter then add
            //let p = vjmap.coordTransfromByInvFourParamter(pt, fourparam);
            //marker.setLngLat(map.toLngLat([p.x, p.y])).addTo(map);
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