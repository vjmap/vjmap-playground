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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05openMapFromHttp
        // --Open map from HTTP URL--Open DWG from an HTTP path
        // js code
        // Create map service instance with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        
        // Map URL: last four chars must be .dwg; else add e.g. url?param=xxx&filetype=.dwg
        // For header auth pass key/value as query params with prefix __header__
        // e.g. auth user=123, pwd=abc -> ...gym.dwg?__header__user=123&__header__pwd=abc&filetype=.dwg
        const httpDwgUrl = "https://vjmap.com/../../assets/data/gym.dwg" ;
        // Map ID (use unique id for your URL); here md5 of URL
        const mapid = svc.strMd5(httpDwgUrl).substring(0, 16);
        let res = await svc.openMap({
            // First open: fetch DWG from fileid; later opens use cache
            mapid: mapid, // Map ID
            fileid: httpDwgUrl,
            // httpUsePost: true, // Use POST for complex URLs; default false
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        /*
         First open for a mapid fetches DWG from fileid; later opens use cache.
         If you reuse same mapid with different fileid, server reuses cache. Use updateMap to refresh or a new mapid.
        */
        if (res.error) {
            message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map instance
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // Raster style
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            renderWorldCopies: false
        });
        // Attach service and projection to map
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        await map.onLoad();
        
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