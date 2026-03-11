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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findsubmapsplit2
        // --Auto split submaps (backend submap bounds)--Get all submap bounds from backend, then batch save
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: 'sys_splitmap', // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // Raster style
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        
        let childMapBounds = [];
        const getChildMapRects = async () => {
            childMapBounds = []
        
            let result = await svc.cmdExtractTable({
                /** tol: tolerance for line detection; 0 = auto */
                tol: 0,
                /** Find submap bounds, default false */
                findChildMapRects: true, // Get submap bounds only
            });
        
            if (!result.childMapRects) return;
            let data = []
            for (let i = 0; i < result.childMapRects.length; i++) {
                let bounds = vjmap.GeoBounds.fromArray(result.childMapRects[i].bounds);
                childMapBounds.push(bounds.toString())
                let points = bounds.toPointArray();
                points.push(points[0]); // Close ring
                data.push({
                    points: map.toLngLat(points),
                    properties: {
                        color: "#FF2AA5"
                    }
                });
            }
            let polygon = new vjmap.Polygon({
                data: data,
                fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', '#FD2DC3'],
                fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.5, 0.3],
                fillOutlineColor: ['get', 'color'],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygon.addTo(map);
        
            message.success(`Got ${childMapBounds.length} submap bounds`)
        }
        
        
        const splitMap = async () => {
            if (childMapBounds.length == 0) {
                message.error('No bounds; get submap bounds first')
                return
            }
            let result = await svc.cmdSplitChildMaps({
                /** Submap bounds array */
                clipBounds: childMapBounds,
                /** cloneObjects (default), cloneDb, or cloneMap */
                method: "cloneObjects",
                /** Start new process, default true */
                startNewProcess: true,
                /** Full extent for split maps, default false */
                isFullExtent: true
            });
            if (result.error) {
                message.error(result.error)
                return
            }
            message.success(`Saved all submaps; file ids: ${result.fileids.join(",")}`)
            console.log(result.fileids.join(","))
        }
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "200px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => getChildMapRects()}>Get all submap bounds
                            </button>
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => splitMap()}>Split submaps by bounds
                            </button>
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