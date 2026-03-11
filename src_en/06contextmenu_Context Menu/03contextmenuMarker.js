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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/contextmenu/03contextmenuMarker
        // --Marker context menu--
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
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
    style: svc.rasterStyle(), // style, raster style here
    center: prj.toLngLat(prj.getMapExtent().center()), // set map center
    zoom: 2, // set map zoom level
    renderWorldCopies: false
});


// Attach service and projection
map.attach(svc, prj);
await map.onLoad();


map.setMenu(event => {
    return new vjmap.ContextMenu({
        event: event.originalEvent,
        theme: "dark", //light
        width: "250px",
        items: [
            {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">Map context menu</span>`},
            {
                label: 'Show full extent',
                onClick: () => {
                    map.setBearing(0);
                    map.setPitch(0);
                    map.fitMapBounds();
                }
            },
            {
                label: 'Get coordinates at this location',
                onClick: () => {
                    let point = map.fromLngLat(event.lngLat);
                    message.info({content: `Current coordinates: x: ${point.x}, y: ${point.y}`, key: "info", duration: 3});
                }
            }
        ]
    });
})

let mapBounds = map.getGeoBounds(); // get map geo bounds
for(let i = 0; i < 50; i++) {
    let point = mapBounds.randomPoint(); // generate random point in bounds
    // marker
    let marker = new vjmap.Marker({
        color: vjmap.randomColor()
    });
    marker.setLngLat(map.toLngLat(point))
    marker.addTo(map);
    marker.id = i + 1;

    // Unlike polygon overlay layer, marker is div; overlay is canvas same div as map
    // Marker right-click must be handled by its own div context menu
    marker.getElement().addEventListener("mousedown", event => {
        if (event.button != 2) return;// not right-click
        // Prevent default map context menu
        event.preventDefault();
        event.stopPropagation();
        return new vjmap.ContextMenu({
            event: event,
            theme: "dark", //light
            width: "250px",
            items: [
                {type: 'custom', markup: `<span style="color: #ffff00; padding-left: 30px">Marker context menu</span>`},
                {
                    label: 'Get marker info',
                    onClick: () => {
                        message.info({content: `Marker ID: ${marker.id}`, key: "info", duration: 3});
                    }
                }
            ]
        });
    })
}

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