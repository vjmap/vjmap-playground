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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/03webzgetepsg
        // --Get EPSG code by coordinate--
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Create lnglat projection by map bounds
let prj = new vjmap.LnglatProjection();
// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: {
        version: svc.styleVersion(),
        glyphs: svc.glyphsUrl(),
        sources: {
            tdt1: {
                type: 'raster',
                tiles: ["https://t3.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
            },
            tdt2: {
                type: 'raster',
                tiles: ["https://t3.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
            }
        },
        layers: [{
            id: 'tdt1',
            type: 'raster',
            source: 'tdt1',
        },{
            id: 'tdt2',
            type: 'raster',
            source: 'tdt2',
        }]
    },
    center: prj.toLngLat([116.3912, 39.9073]),
    zoom: 10,
    pitch: 0,
    renderWorldCopies: false // Do not show multi-screen map
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent by map bounds
//map.fitMapBounds();
await map.onLoad();



// Load proj4 for coordinate conversion
if (typeof proj4 !== "object") {
    // If not available
    await vjmap.addScript([{
        src: "../../js/proj4.min.js"
    }])
}

// Query parameter content at https://epsg.io/
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");

// UI
const { useRef, useState } = React;
const { Input, Select } = antd;
const { TextArea  } = Input;
let curCrsType, curIsThirdDegreeBelt;
const App = () => {
    const xValueInput = useRef(null);
    const yValueInput = useRef(null);
    const [epsgText, setEpsgText] = useState('');

    const getCurLngLat = () => {
        let center = map.getCenter();
        xValueInput.current.value = center.lng;
        yValueInput.current.value = center.lat;
    }
    const handleCrsChange = (value) => {
        curCrsType = value;
        getMapEpsg();
    }
    const handleBeltChange = (value) => {
        curIsThirdDegreeBelt = value;
        getMapEpsg();
    }
    const getMapEpsg = () => {
        if (!xValueInput.current.value && !yValueInput.current.value) return;
        let x = +xValueInput.current.value, y = +yValueInput.current.value
        let res = vjmap.transform.getEpsgCode([x, y],curCrsType, curIsThirdDegreeBelt);
        for(let item of res) {
            if (item.proj) {
                proj4.defs(item.epsg, item.proj);
            }
            if (x < 180) {
                // Lnglat to CAD projection coordinate
                item.convertCoordinate = proj4("EPSG:4326", item.epsg, [x, y]);
            } else {
                // CAD projection coordinate to lnglat
                item.convertCoordinate = proj4(item.epsg, "EPSG:4326", [x, y]);
            }
            delete item.proj; // Do not show proj, too long
        }
        setEpsgText(JSON.stringify(res, null, 4))
    }
    return (
        <div>
            <div className="input-card w270">
                Coordinate X,Y can be CAD coordinates or web lnglat:
                <div className="input-item">
                    <button id="moving_btn" className="btn btn-full mr0" onClick={getCurLngLat}>Get current map center lnglat</button>
                </div>
                <div className="input-item border">
                    Coordinate X: <input type="text" ref={xValueInput}  placeholder=""
                                className="inp"/>
                </div>
                <div className="input-item border">
                    Coordinate Y: <input type="text" ref={yValueInput}  placeholder=""
                                className="inp"/>
                </div>
                <div>
                    CRS:
                    <Select
                        defaultValue=""
                        style={{ width: 120 }}
                        onChange={handleCrsChange}
                        options={[
                            { value: '', label: 'Any' },
                            { value: vjmap.transform.EpsgCrsTypes.CGCS2000, label: 'CGCS2000' },
                            { value: vjmap.transform.EpsgCrsTypes.Xian80, label: 'Xian 80' },
                            { value: vjmap.transform.EpsgCrsTypes.Beijing54, label: 'Beijing 54' },
                            { value: vjmap.transform.EpsgCrsTypes.NewBeijing54, label: 'New Beijing 54' },
                        ]}
                    />
                </div>
                <div>
                    Belt:
                    <Select
                        defaultValue=""
                        style={{ width: 120 }}
                        onChange={handleBeltChange}
                        options={[
                            { value: '', label: 'Any' },
                            { value: false, label: '6-degree belt' },
                            { value: true, label: '3-degree belt' }
                        ]}
                    />
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0" onClick={getMapEpsg}>Compute EPSG code by coordinate</button>
                </div>
                <div className="input-item border">
                    EPSG: <TextArea type="text" rows={12} value={epsgText}/>
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