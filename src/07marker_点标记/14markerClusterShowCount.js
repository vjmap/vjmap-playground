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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/14markerClusterShowCount
        // --标记Marker聚合(重叠时显示总数)--
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false, // 不显示多屏地图
            doubleClickZoom: false // 不启用双击缩放
        });
        
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        let mapBounds = map.getGeoBounds(0.4); // 得到地图地理范围
        // 随机生成点
        let data = [];
        for (let i = 0; i < 1000; i++) {
            data.push({
                point: mapBounds.randomPoint(),
                properties: {
                    index: i,
                    minZoom: 1, //可选项，小于1级时将不可见
                    maxZoom: 5 //可选项，大于5级时将不可见
                }
            })
        }
        let popupInfo = null;
        const getColor = (num, isText) => {
            let color = "#00FFFF";
            if (num > 1) {
                //  可以用颜色来区分下，
                // 1-5个 绿色 #80FF00
                // 5-10个 黄色 #FFFF00
                // 10个以上 红色 #FF3D3D
                if (num <= 5) {
                    color = isText ? "#F0F" : "#80FF00";
                } else  if (num <= 10) {
                    color = isText ? "#00F" : "#FFFF00";
                } else {
                    color = isText ? "#FFF" : "#FF3D3D";
                }
            }
            return color
        }
        // 创建Marker回调，必须返回一个Marker或从Marker派生的对象
        // curMarkerData 当前要显示的marker的数据， clusterMarkersData 当前聚合的maker的数据，包括当前要显示的)
        const createMarker = (curMarkerData, clusterMarkersData)=> {
            if (clusterMarkersData.length <= 1) {
                // 只有一个，没有聚合的实体，直接用Marker来绘制
                let marker = new vjmap.Marker({
                    color: getColor(clusterMarkersData.length)
                }).setLngLat(map.toLngLat(curMarkerData.point));
                // 给marker增加点击事件
                marker.on('click', (e) => {
                    let html = `
                                        ID: ${marker.clusterMarkersData[0].properties.index}<br/>
                                    `
                    if (!popupInfo) {
                        popupInfo = new vjmap.Popup({ closeOnClick: false, closeButton: true, anchor: "bottom" });
                    } else {
                        popupInfo.remove()
                    }
                    popupInfo.setHTML(html)
                        .setLngLat(marker.getLngLat())
                        .setOffset([0, -28])
                        .addTo(map);
                });
        
                return marker;
            } else {
                // 如果有聚合的实体，则显示聚合数
                // vjmap.Text是从Marker派生的对象，具有Marker对象的方法，所以可以返回Text对象
                let text = new vjmap.Text({
                    text: clusterMarkersData.length,//总共聚合的个数
                    anchor: "center",
                    offset: [0, 0], // x,y 方向像素偏移量
                    style:{     // 自定义样式
                        'cursor': 'pointer',
                        'opacity': 0.8,
                        'padding': '6px',
                        'border-radius': '12px',
                        'background-color': getColor(clusterMarkersData.length),
                        'border-width': 0,
                        'box-shadow': '0px 2px 6px 0px rgba(97,113,166,0.2)',
                        'text-align': 'center',
                        'font-size': '14px',
                        'color': getColor(clusterMarkersData.length, true),
                    }
                });
                text.setLngLat(map.toLngLat(curMarkerData.point)).addTo(map);
                text.on('click', (e) => {
                    if (text.clusterMarkersData.length === 1)  return;
                    // 获取所有聚合的点何地
                    let pts = text.clusterMarkersData.map(c => c.point)
                    let showBounds = vjmap.geoBounds();
                    showBounds.update(pts); //得到所有点坐标的范围
                    let lngLatBounds = map.toLngLat(showBounds);
                    map.fitBounds(lngLatBounds, {
                        padding: 40 //旁边留几十个像素，方便全部看到
                    });
                })
                return text;
            }
        
        }
        // 更新Marker回调，如果返回空，则表示只更新Marker内容，如果返回了Marker对象，表示要替换之前的Marker对象
        // curMarkerData 当前要显示的marker的数据， clusterMarkersData 当前聚合的maker的数据，包括当前要显示的; marker当前的实例对象)
        const updateMarker = (curMarkerData, clusterMarkersData, marker)=> {
            if (marker instanceof vjmap.Text) {
                // 如果是文本对象
                if (clusterMarkersData.length > 1) {
                    // 还是聚合对象，只要改变文本就可以
                    marker.setText(clusterMarkersData.length);
                    // 修改的话，不用返回
                } else {
                    //  要变成marker对象才可以了
                    // 先删除自己，再创建marker
                    marker.remove();
                    return createMarker(curMarkerData, clusterMarkersData);
                }
            } else {
                // 如果是marker
                if (clusterMarkersData.length > 1) {
                    // 如果数量大于1，表示需要聚合，先删除自己的Marker对象，再创建text
                    marker.remove();
                    return createMarker(curMarkerData, clusterMarkersData);
                }
            }
        }
        let markerCluster = new vjmap.MarkerCluster({
            /** 数据内容.(传入坐标为CAD地理坐标) */
            data,
            // 创建Marker回调，必须返回一个Marker或从Marker派生的对象 (curMarkerData 当前要显示的marker的数据， clusterMarkersData 当前聚合的maker的数据，包括当前要显示的)
            createMarker,
            // 更新Marker回调，如果返回空，则表示只更新Marker内容，如果返回了Marker对象，表示要替换之前的Marker对象 (curMarkerData 当前要显示的marker的数据， clusterMarkersData 当前聚合的maker的数据，包括当前要显示的; marker当前的实例对象)
            updateMarker,
            /** 是否允许重叠，默认false. */
            allowOverlap: false,
            /** 允许重叠的最大缩放级别，小于或等于此级别才会处理重叠，超过此级时会全部显示当前所有的(如果不允许重叠时有效).默认4级*/
            allowOverlapMaxZoom: 4,
            /** marker div的像素宽，用于计算重叠时需要，默认40. 如果在data的properties设置了属性markerWidth，则以data设置的为准*/
            markerWidth: 28,
            /** marker div的像素高，用于计算重叠时需要，默认40. 如果在data的properties设置了属性markerHeight，则以data设置的为准 */
            markerHeight: 40,
        })
        
        markerCluster.addTo(map)
        
        
        const setOverlap = (isOverlap) => {
            markerCluster.allowOverlap(isOverlap);
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w160">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => setOverlap(true)}>允许重叠</button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={() => setOverlap(false)}>不允许重叠</button>
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