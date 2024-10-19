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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/31mapexportpdf
        // --导出pdf--将地图导出为pdf文件
        // js代码
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
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
        await map.onLoad();
        
        let mapid;  // 不填的话，用上面打开默认的
        let version; // 不填的话，用上面打开默认的
        let param; // 不填的话，用默认的
        /*
        param = {
            lineWeight: false, // 导出时是否包含线宽
            bIncludeOffLayers: false, // 是否包含关闭的图层
            bSearchableSHX: false, // 可搜索型文字
            bSearchableTTF: false, // 可搜索ttf文字
            pageWidth: 210, // 宽，单位mm
            pageHeight: 297, // 高，单位mm
            pageLeftMargin: 0, // 左页边距 （pageWidth, pageHeight有值时有效）
            pageRightMargin: 0, // 右页边距 （pageWidth, pageHeight有值时有效）
            pageTopMargin: 0, // 上页边距 （pageWidth, pageHeight有值时有效）
            pageBottomMargin: 0, // 下页边距 （pageWidth, pageHeight有值时有效）
            geomDPI: 600, // 矢量dpi
            colorImagesDPI: 400, //图像dpi
            isBlackWhiteMode: false, // 是否导出为黑白模式
            isGrayMode: false, // 是否导出为灰色模式
        }*/
        
        
        // 导出pdf
        const exportPdf = async () => {
            message.info("正在导出pdf,请稍等...")
            const result = await svc.execCommand("exportPdf", param, mapid, version, true);
            if (result.error) {
                message.error(result.error)
            } else {
                let pdfUrl = svc.baseUrl() + result.path + "?token=" + svc.accessToken;
                window.open(pdfUrl, )
            }
        }
        
        // 也可以对图纸进行处理后，再导出如旋转90度后再导出
        /*
        
        // 导出pdf
        const exportPdf = async () => {
            message.info("正在导出pdf,请稍等...")
            let composeRes = await svc.composeNewMap({
                mapid: 'cbf527ed3ad1',
                version: 'v1',
                fourParameter: [0, 0, 1, -Math.PI / 2]
            })
            let res = await svc.updateMap({
                // 获取一个临时的图id(临时图形只会用临时查看，过期会自动删除)
                mapid: vjmap.getTempMapId(1), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
                fileid: composeRes.fileid, // 生成的fileid
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
                }
            })
            const result = await svc.execCommand("exportPdf", param, res.mapid, res.version, true);
            if (result.error) {
                message.error(result.error)
            } else {
                let pdfUrl = svc.baseUrl() + result.path + "?token=" + svc.accessToken;
                window.open(pdfUrl, )
            }
        }
         */
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={exportPdf}>导出Pdf文件</button>
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