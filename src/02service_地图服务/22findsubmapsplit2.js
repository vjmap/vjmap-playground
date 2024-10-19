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
        // --自动拆分子图(后台获取子图范围)--通过后台自动获取所有子图范围，并在后台根据范围批量保存所有子图
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: 'sys_splitmap', // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: prj.toLngLat(mapExtent.center()), // 中心点
            zoom: 2,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        
        
        let childMapBounds = [];
        const getChildMapRects = async () => {
            childMapBounds = []
        
            let result = await svc.cmdExtractTale({
                /** 误差值. 正数表示距离小于这个误差值就以为是直线（为零的话表示自动求误差值)，负数表示自动获取的误差值比例倍数大小 默认为0自动*/
                tol: 0,
                /** 查找子图范围 默认false */
                findChildMapRects: true, // 只获取子图范围
            });
        
            if (!result.childMapRects) return;
            let data = []
            for (let i = 0; i < result.childMapRects.length; i++) {
                let bounds = vjmap.GeoBounds.fromArray(result.childMapRects[i].bounds);
                childMapBounds.push(bounds.toString())
                let points = bounds.toPointArray();
                points.push(points[0]); // 闭合
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
        
            message.success(`已成功获取 ${childMapBounds.length} 个子图范围`)
        }
        
        
        const splitMap = async () => {
            if (childMapBounds.length == 0) {
                message.error('范围为空，请先获取所有子图范围')
                return
            }
            // 拆分子图
            let result = await svc.cmdSplitChildMaps({
                /** 子图范围数组. ["x1,y1,x2,y2",  "x1,y1,x2,y2", ...] */
                clipBounds: childMapBounds,
                /** 方法 cloneObjects 通过深度克隆实体,效率最快(默认),  cloneDb 通过克隆文档数据库，效率较快；cloneMap 通过克隆图，效率较慢，但最能保持原样*/
                method: "cloneObjects",
                /** 是否启动新进程处理（不影响主进程，看初始速度慢些） 默认true */
                startNewProcess: true,
                /** 拆分后的图是否全图 默认false */
                isFullExtent: true
            });
            if (result.error) {
                message.error(result.error)
                return
            }
            message.success(`已在后台成功保存所有子图,文件id分别为: ${result.fileids.join(",")}`)
            console.log(result.fileids.join(","))
        }
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "200px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => getChildMapRects()}>自动获取所有子图范围
                            </button>
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => splitMap()}>根据范围自动拆分子图
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