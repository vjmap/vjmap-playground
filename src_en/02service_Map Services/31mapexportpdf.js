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
        // --Export PDF--Export map as PDF file
        // js code
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists; upload new drawing to create)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: prj.toLngLat(mapExtent.center()), // center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map bounds
        map.fitMapBounds();
        await map.onLoad();
        
        let mapid;  // if empty, use opened map
        let version; // if empty, use opened version
        let param; // if empty, use defaults
        /*
        param = {
            lineWeight: false, // Include line weight when exporting
            bIncludeOffLayers: false, // Include off layers
            bSearchableSHX: false, // Searchable SHX text
            bSearchableTTF: false, // Searchable TTF text
            pageWidth: 210, // Width, mm
            pageHeight: 297, // Height, mm
            pageLeftMargin: 0, // Left margin (when pageWidth, pageHeight set)
            pageRightMargin: 0, // Right margin (when pageWidth, pageHeight set)
            pageTopMargin: 0, // Top margin (when pageWidth, pageHeight set)
            pageBottomMargin: 0, // Bottom margin (when pageWidth, pageHeight set)
            geomDPI: 600, // Vector DPI
            colorImagesDPI: 400, // Image DPI
            isBlackWhiteMode: false, // Export as black/white
            isGrayMode: false, // Export as grayscale
        }*/
        
        
        // Export PDF
        const exportPdf = async () => {
            message.info("Exporting PDF, please wait...")
            const result = await svc.execCommand("exportPdf", param, mapid, version, true);
            if (result.error) {
                message.error(result.error)
            } else {
                let pdfUrl = svc.baseUrl() + result.path + "?token=" + svc.accessToken;
                window.open(pdfUrl, )
            }
        }
        
        // You can process the drawing first then export, e.g. rotate 90° then export
        /*
        
        // Export PDF
        const exportPdf = async () => {
            message.info("Exporting PDF, please wait...")
            let composeRes = await svc.composeNewMap({
                mapid: 'cbf527ed3ad1',
                version: 'v1',
                fourParameter: [0, 0, 1, -Math.PI / 2]
            })
            let res = await svc.updateMap({
                // Get temp map id(Temp map for viewing only, auto-deleted when expired)
                mapid: vjmap.getTempMapId(1), // Temp map expiry in minutes when not viewed; default 30
                fileid: composeRes.fileid, // Generated fileid
                mapopenway: vjmap.MapOpenWay.Memory,
                style: {
                    backcolor: 0 // Use 0xFFFFFF if div background is light
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
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info w260">
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0" onClick={exportPdf}>Export PDF file</button>
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