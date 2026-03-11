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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/14switchMapNew
        // --Switch map [map object and div change]--Switch by map id; map and container are recreated
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        
        // Create a new div for the map
        const createNewMapDivId = ()=> {
            // Clear previous
            let parentDiv = document.getElementById("map");
            parentDiv.innerHTML = "";
            let newMapDiv = document.createElement("div");
            newMapDiv.id = vjmap.RandomID(6);
            newMapDiv.style.position = 'absolute';
            newMapDiv.style.width = "100%";
            newMapDiv.style.height = "100%";
            parentDiv.appendChild(newMapDiv);
            return newMapDiv.id;
        }
        
        const openNewMap = async (mapid, isVector) => {
            // Open map
            let res = await svc.openMap({
                mapid: mapid,
                mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
                style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
            })
            if (res.error) {
                message.error(res.error)
                return;
            }
            // Get map extent
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // Create coordinate system
            let prj = new vjmap.GeoProjection(mapExtent);
        
            // Create map instance
            let map = new vjmap.Map({
                container: createNewMapDivId(), // New div bound to this map
                style: isVector ? svc.vectorStyle() : svc.rasterStyle(), // Raster tile style
                center: prj.toLngLat(mapExtent.center()), // Center
                zoom: 2,
                renderWorldCopies: false
            });
            // Attach service and projection to map
            map.attach(svc, prj);
            // Fit map to full extent
            map.fitMapBounds();
        }
        
        let curMapId;
        const switchMap = async mapid => {
            if (curMapId == mapid) return; // Same map, no change
            await openNewMap(mapid);
            curMapId = mapid;
        }
        await switchMap("sys_zp");
        
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Map switch</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => switchMap('sys_zp') }>Open map sys_zp</button>
                        <button className="btn" onClick={ () => switchMap('sys_world') }>Open map sys_world</button>
                        <button className="btn" onClick={ () => switchMap('sys_cad2000') }>Open map sys_cad2000</button>
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