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
        // --REGL自定义图层--
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
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            renderWorldCopies: false, // 不显示多屏地图
            doubleClickZoom: false
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        let mapBounds = map.getGeoBounds(0.4);
        
        try {
            // 加载regl库
            if (typeof createREGL !== "function") {
                // 如果没有环境
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
                    this.renderAnimation = true; // 如果需要每帧都刷新的话，需要设置为true
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
                // 生成三个随机点
                points: map.toLngLat([mapBounds.randomPoint(), mapBounds.randomPoint(), mapBounds.randomPoint()]),
                color: [1, 0, 0, 1]
            })
            map.addLayer(layer);
        
        } catch (e) {
            // 由于babel转换的原因，上面代码在演示环境中可能会出错。实际应用中不会存在这问题。
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