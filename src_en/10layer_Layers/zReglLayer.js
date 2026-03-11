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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/layer/zReglLayer
        // --REGL custom layer--
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
// Get map bounds
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
// Create geo projection from map bounds
let prj = new vjmap.GeoProjection(mapExtent);

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterStyle(), // style, raster style here
    center: prj.toLngLat(mapExtent.center()), // set map center
    zoom: 2, // set map zoom level
    renderWorldCopies: false, // do not show multi-world copies
    doubleClickZoom: false
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();

let mapBounds = map.getGeoBounds(0.4);

try {
    // Load regl library
    if (typeof createREGL !== "function") {
        // If no env
        await vjmap.addScript([{
            src: "../../js/regl.min.js"
        }])
    }
    class GlAdapterTestLayer extends vjmap.ReglBaseLayer {
        constructor(options) {
            super();
            this.type = 'custom';
            this.id = "glAdapterTestLayer"
            this.renderingMode = "3d";
            this.renderAnimation = true; // Set true for per-frame refresh
            Object.assign(this, options);
        }

        getReglInitialization() {
            const reglOptions = {};
            return createREGL(reglOptions);
        }

        init(map, gl) {
            let points = this.points
                .reduce((prev, cur) => {
                    let p = vjmap.MercatorCoordinate.fromLngLat([cur[0],cur[1]], 500000)
                    prev.push([
                        p.x,
                        p.y,
                        p.z
                    ]);
                    return prev;
                }, []);


            const reglDrawConfig = {
                frag: `
precision mediump float;
varying vec4 v_color;
uniform vec4 u_color;
void main() {
gl_FragColor = u_color;
}`,

                vert: `
uniform mat4 u_matrix;
attribute vec3 position;
attribute vec4 a_color;
varying vec4 v_color;
void main() {
    v_color = a_color;
    gl_Position = u_matrix * vec4(position, 1.0);
}`,

                attributes: {
                    position: points,
                    a_color: {
                        constant: this.color
                    }
                },
                uniforms: {
                    'u_matrix': this.regl.prop('u_matrix'),
                    'u_color': (state, props, batchId = 0) => [
                        Math.random(),
                        Math.random(),
                        Math.random(),
                        1
                    ]
                },
                count: 3
            };

            this.drawPoints = this.regl(reglDrawConfig);
        }

        frame(gl, matrix) {
            let drawParams = {
                'u_matrix': matrix
            };
            this.drawPoints(drawParams);
        }
    }

    let layer = new GlAdapterTestLayer({
        // Generate three random points
        points: map.toLngLat([mapBounds.randomPoint(), mapBounds.randomPoint(), mapBounds.randomPoint()]),
        color: [1, 0, 0, 1]
    })
    map.addLayer(layer);

} catch (e) {
    // Demo env may error due to babel; production is fine
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