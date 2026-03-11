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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/mapcoordinate
        // --Map coordinate conversion--
        // Map service object
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
            style: vjmap.openMapDarkStyle() // use dark style when div is dark
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Create geo projection from map bounds
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterStyle(), // style
            center: prj.toLngLat(prj.getMapExtent().center()), // set map center
            zoom: 2, // set zoom level
            renderWorldCopies: false // do not show world copies
        });
        
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        map.fitMapBounds();
        
        await map.onLoad();
        
        const addStyle = cssStyle => {
            let style = `<style>${cssStyle }</style>`;
            let ele = document.createElement('div');
            ele.innerHTML = style;
            document.getElementsByTagName('head')[0].appendChild(ele.firstElementChild)
        }
        // Custom popup style
        addStyle(`
        .custom-popup .vjmapgis-popup-content {
        background-color: #A0FFA0;
        }
        .custom-popup .vjmapgis-popup-tip {
        border-top-color: #A0FFA0;
        }
        `)
        // Popup following mouse
        const div = window.document.createElement('div');
        div.innerHTML = 'Coordinate: ';
        const popup = new vjmap.Popup({
            className: "custom-popup",
            closeOnClick: false,
            closeButton: false
        })
            //.setHTML("Hello VJMap!")
            .setDOMContent(div)
            .trackPointer()
            .addTo(map);
        
        
        // On map mousemove, get mouse coordinate:
        map.on("mousemove", e => {
            let html = '';
            html += `CAD coordinate: `
            let cadPoint = map.fromLngLat(e.lngLat);
            html += `<br/>${cadPoint.toString()}`;
        
            // LngLat for drawing, range (-180,180)
            html += `<br/>LngLat: `
            let lngLat = map.toLngLat(cadPoint);  // Or use e.lngLat; demo CAD to lnglat
            html += `<br/>${lngLat[0].toFixed(6)},${lngLat[1].toFixed(6)}`;
        
            // Device/screen pixel coordinate
            html += `<br/>Screen: `
            let pixelPoint = map.project(lngLat); // Inverse: map.unproject()
            html += `<br/>${pixelPoint.x.toFixed(0)},${pixelPoint.y.toFixed(0)}`;
        
            popup.setHTML(html)
        })
        
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