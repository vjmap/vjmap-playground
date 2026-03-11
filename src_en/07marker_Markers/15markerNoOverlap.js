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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/15markerNoOverlap
        // --Marker cluster (one visible when overlapping)--
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
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style, raster style here
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 2, // set map zoom level
            renderWorldCopies: false, // do not show multi-world copies
            doubleClickZoom: false // disable double-click zoom
        });
        
        
        // Attach service and projection
        map.attach(svc, prj);
        let mapBounds = map.getGeoBounds(0.4); // Get map bounds
        // Random points
        let data = [];
        for (let i = 0; i < 1000; i++) {
            data.push({
                point: mapBounds.randomPoint(),
                properties: {
                    index: i
                }
            })
        }
        let popupInfo = null;
        const getColor = (num) => {
            let color = "#00FFFF";
            if (num > 1) {
                // Color by count: 1-5 green, 5-10 yellow, 10+ red
                if (num <= 5) {
                    color = "#80FF00";
                } else  if (num <= 10) {
                    color = "#FFFF00";
                } else {
                    color = "#FF3D3D";
                }
            }
            return color
        }
        // Create marker callback; must return Marker or subclass
        const createMarker = (curMarkerData, clusterMarkersData)=> {
            let marker = new vjmap.Marker({
                color: getColor(clusterMarkersData.length)
            }).setLngLat(map.toLngLat(curMarkerData.point));
            // Click event
            marker.on('click', (e) => {
                let html = `
                    ID: ${marker.clusterMarkersData[0].properties.index}<br/>
                `
                if (marker.clusterMarkersData.length > 1) {
                    html +=  `
                                            <span style="color: red" >${marker.clusterMarkersData.length}</span> markers in cluster<br/>
                                            Double-click to show all
                                        `
                }
                if (!popupInfo) {
                    popupInfo = new vjmap.Popup({ closeOnClick: false, closeButton: true, anchor: "bottom" });
                } else {
                    popupInfo.remove()
                }
                popupInfo.setHTML(html)
                    .setLngLat(marker.getLngLat())
                    .setOffset([0, -30])
                    .addTo(map);
            });
            // Double-click to show all markers in cluster
            marker.on('dblclick', (e) => {
                if (marker.clusterMarkersData.length <= 1)  return;
                let pts = marker.clusterMarkersData.map(c => c.point)
                let showBounds = vjmap.geoBounds();
                showBounds.update(pts);
                let lngLatBounds = map.toLngLat(showBounds);
                map.fitBounds(lngLatBounds, {
                    padding: 40
                });
                if (popupInfo) {
                    popupInfo.remove()
                    popupInfo = null;
                }
            })
            return marker;
        
        }
        // Update marker callback
        const updateMarker = (curMarkerData, clusterMarkersData, marker)=> {
            marker.setColor(getColor(clusterMarkersData.length)); // Color by cluster count
        }
        let markerCluster = new vjmap.MarkerCluster({
            /** Data (CAD geo coordinates). */
            data,
            createMarker,
            updateMarker,
            /** Allow overlap. Default false. */
            allowOverlap: false,
            /** Max zoom for overlap. Default 4. */
            allowOverlapMaxZoom: 4,
            /** Marker div width in px. Default 40. Or markerWidth in data.properties. */
            markerWidth: 28,
            /** Marker div height in px. Default 40. Or markerHeight in data.properties. */
            markerHeight: 40,
            /** Camera near front. Default false. */
            cameraNearFront: true
        })
        
        markerCluster.addTo(map)
        
        
        const setOverlap = (isOverlap) => {
            markerCluster.allowOverlap(isOverlap);
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w160">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => setOverlap(true)}>Allow overlap</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => setOverlap(false)}>Disallow overlap</button>
                        </div>
        
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
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