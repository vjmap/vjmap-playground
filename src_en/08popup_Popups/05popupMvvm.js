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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/popup/05popupMvvm
        // --Vue2 popup--
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
    pitch: 60,
    renderWorldCopies: false, // do not show multi-world copies
    doubleClickZoom: false // do not enable double-click zoom
});


// Attach service and projection
map.attach(svc, prj);
await map.onLoad()
let mapBounds = map.getGeoBounds(0.4); // get map geo bounds


// Load Vue2 library
if (typeof Vue !== "object" || Vue.version.substring(0, 1) != "2")  {
    // If no env
    await vjmap.addScript([{
        src: "../../js/vue@2.js"
    }])
}
// For Vue3, see Vue3 Marker in marker examples
const VuePopup = {
    data() {
        return {
            count: 1
        }
    },
    methods: {
        add: function() {
            this.count++;
        }
    },
    template : `
          <div style="background: #7ec699">
             <h4>count:{{count}}</h4>
             <button @click="add">Add one to count</button>
         </div>
      `
}

// Create popup
let popup = new vjmap.Popup({ offset: 0 })
let popupEl = new Vue(VuePopup).$mount()

popup.setLngLat(map.getCenter())
    .setDOMContent(popupEl.$el)
    .addTo(map);

// Debug position, check if it matches native Marker position
// let m = new vjmap.Marker();
// m.setLngLat(map.getCenter())
// m.addTo(map);

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