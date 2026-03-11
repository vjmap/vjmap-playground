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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/03markerzHaloRing
        // --Halo ring--
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
            zoom: 2, // set map zoom level
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        
        // Nav controls
        map.addControl(new vjmap.NavigationControl());
        // Mouse position
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        const mapBounds = map.getGeoBounds(0.6);
        
        // Create default
        let markerEle = new vjmap.HaloRingMarker({
            lngLat: map.toLngLat(mapBounds.randomPoint()),
            text: "vjmap"
        }, {})
        let marker = markerEle.createMarker({
            // Set marker props, e.g. draggable
            draggable: true
        });
        marker.addTo(map)
        
        for(let i = 1; i < 20; i++) {
            // Random markers with different styles
            let _marker = new vjmap.HaloRingMarker({
                lngLat: map.toLngLat(mapBounds.randomPoint()),
                text: "Text" + i
            }, {
                // Set width, color, font, etc.
                //width: vjmap.randInt(20, 50),
                colors: [vjmap.randomColor(), vjmap.randomColor()],
                //textFontSize: vjmap.randInt(14, 30),
                textColor: vjmap.randomColor()
            }).createMarker();
            _marker.addTo(map)
        }
        
        // Modify width
        const modifyWidth = ()=> {
            markerEle.setMarkersWidth(50);
            // Or marker.elementObject.setMarkersWidth(200);
        }
        
        // Modify color
        const modifyColors = ()=> {
            markerEle.setMarkersColors(["rgb(255, 0, 0)", "rgb(255, 255, 0)"]);
        }
        
        // Modify text color
        const modifyTextColor = ()=> {
            markerEle.setMarkersTextColor("rgb(255, 0, 0)");
        }
        
        // Modify text size
        const modifyTextFontSize = ()=> {
            markerEle.setMarkersTextFontSize(40);
        }
        
        // Modify text content
        const modifyTextContent = ()=> {
            markerEle.setMarkersText("vjmap");
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "90px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyWidth()}>Modify width
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyColors()}>Modify icon color
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyTextColor()}>Modify text color
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyTextFontSize()}>Modify text size
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => modifyTextContent()}>Modify text content
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App/>, document.getElementById('ui'));
        
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