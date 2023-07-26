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
        // --通过坐标获取EPSG代号--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 根据地图范围建立经纬度投影坐标系
        let prj = new vjmap.LnglatProjection();
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
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
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        
        
        // 加载proj4库，用于坐标转换
        if (typeof proj4 !== "object") {
            // 如果没有环境
            await vjmap.addScript([{
                src: "../../js/proj4.min.js"
            }])
        }
        
        // 下面的参数内容请去 https://epsg.io/ 上面查询
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");
        
        // UI界面
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
                        // 经纬度转 cad投影坐标
                        item.convertCoordinate = proj4("EPSG:4326", item.epsg, [x, y]);
                    } else {
                        // cad投影坐标转经纬度
                        item.convertCoordinate = proj4(item.epsg, "EPSG:4326", [x, y]);
                    }
                    delete item.proj; //不显示proj，内容太长了
                }
                setEpsgText(JSON.stringify(res, null, 4))
            }
            return (
                <div>
                    <div className="input-card w270">
                        坐标X,Y可以是CAD图坐标或互联网经纬度坐标:
                        <div className="input-item">
                            <button id="moving_btn" className="btn btn-full mr0" onClick={getCurLngLat}>获取当前地图中心点经纬度</button>
                        </div>
                        <div className="input-item border">
                            坐标X值：<input type="text" ref={xValueInput}  placeholder=""
                                        className="inp"/>
                        </div>
                        <div className="input-item border">
                            坐标Y值：<input type="text" ref={yValueInput}  placeholder=""
                                        className="inp"/>
                        </div>
                        <div>
                            坐标系:
                            <Select
                                defaultValue=""
                                style={{ width: 120 }}
                                onChange={handleCrsChange}
                                options={[
                                    { value: '', label: '不限' },
                                    { value: vjmap.transform.EpsgCrsTypes.CGCS2000, label: '2000坐标系' },
                                    { value: vjmap.transform.EpsgCrsTypes.Xian80, label: '西安80坐标系' },
                                    { value: vjmap.transform.EpsgCrsTypes.Beijing54, label: '北京54坐标系' },
                                    { value: vjmap.transform.EpsgCrsTypes.NewBeijing54, label: '新北京54坐标系' },
                                ]}
                            />
                        </div>
                        <div>
                            坐标系:
                            <Select
                                defaultValue=""
                                style={{ width: 120 }}
                                onChange={handleBeltChange}
                                options={[
                                    { value: '', label: '不限' },
                                    { value: false, label: '六度带' },
                                    { value: true, label: '三度带' }
                                ]}
                            />
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={getMapEpsg}>根据坐标计算EPSG代号</button>
                        </div>
                        <div className="input-item border">
                            EPSG：<TextArea type="text" rows={12} value={epsgText}/>
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