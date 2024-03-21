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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/web/03webTiandituStyle
        // --互联网地图样式自定义--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 根据地图范围建立经纬度投影坐标系
        let prj = new vjmap.LnglatProjection();
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {
                    tdt1: {
                        type: 'raster',
                        tiles: ["https://t3.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                    },
                    tdt2: {
                        type: 'raster',
                        tiles: ["https://t3.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=7baeffb96bf61861b302d0f963cfda66"],
                    }
                },
                layers: [{
                    id: 'tdt1',
                    type: 'raster',
                    source: 'tdt1',
                    paint: {
                        // 自定义地图样式，用深色来代替默认的样式
                        "raster-inverse": 1, //  0不反色 1 反色
                        "raster-monochrome": "#4586b6", // // 修改地图样式，用纯色代替
                        "raster-saturation": 0, // 饱和度  取值 -1 到 1
                        "raster-contrast": 0, // 对比度   取值 -1 到 1
                    }
                },{
                    id: 'tdt2',
                    type: 'raster',
                    source: 'tdt2',
                    paint: {
                        // 自定义地图样式，用深色来代替默认的样式
                        "raster-inverse": 1, //  0不反色 1 反色
                        "raster-monochrome": "#4586b6", // // 修改地图样式，用纯色代替
                        "raster-saturation": 0, // 饱和度  取值 -1 到 1
                        "raster-contrast": 0, // 对比度   取值 -1 到 1
                    }
                }]
            },
            center: prj.toLngLat([116.3912, 39.9073]),
            zoom: 10,
            pitch: 0,
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        
        const co = prj.toLngLat([116.3912, 39.9073])
        const marker = new vjmap.Marker({color: "red"})
        marker.setLngLat(co).addTo(map)
        
        let layerIds = ["tdt1", "tdt2"]
        // 如果后面修改样式的话，可以用下面的语句
        /*
        // 自定义地图样式，用深色来代替默认的样式
        layerIds.forEach(layerId => {
            // 反色
            map.setRasterInverse(layerId, 1) // 0不反色 1 反色
            // 修改地图样式，用纯色代替
            map.setRasterMonochrome(layerId, "#4586b6")
            // 饱和度
            // map.setRasterSaturation(layerId, 0) // 取值 -1 到 1
            // 对比度
            // map.setRasterContrast(layerId, 0) // 取值 -1 到 1
            // 明亮度最大值
            //  map.setRasterBrightnessMin(layerId, 0.5) // 取值 0 到 1
            // 明亮度最大值
            //  map.setRasterBrightnessMax(layerId, 1) // 取值 0 到 1
        })
        */
        
        
        // UI界面
        
        if (typeof Vue !== "object") {
            // 如果没有vue和elementui环境
            await vjmap.addScript([{
                src: "../../js/vue@2.js"
            }, {
                src: "../../js/element-ui@2.15.10/index.js"
            },{
                src: "../../js/element-ui@2.15.10/index.css"
            }])
        }
        
        let app = new Vue({
            el: '#ui',
            data: {
                isInverseColor: true,
                monochromeColor: "#4586b6",
                saturation: 50,
                contrast: 50,
                brightness: [0,100]
            },
            watch: {
                isInverseColor(val) {
                    layerIds.forEach(layerId => {
                        map.setRasterInverse(layerId, val === true ? 1 : 0)
                    })
                },
                monochromeColor(val) {
                    layerIds.forEach(layerId => {
                        map.setRasterMonochrome(layerId, val)
                    })
                },saturation(val) {
                    layerIds.forEach(layerId => {
                        // -1到1
                        map.setRasterSaturation(layerId, -1 + val / 50)
                    })
                },contrast(val) {
                    layerIds.forEach(layerId => {
                        // -1到1
                        map.setRasterContrast(layerId, -1 + val / 50)
                    })
                },brightness(val) {
                    layerIds.forEach(layerId => {
                        map.setRasterBrightnessMin(layerId, val[0] / 100)
                        map.setRasterBrightnessMax(layerId, val[1] / 100)
                    })
                },
            },
            template: `
              <template>
                <div style="position: absolute; z-index: 2;right:10px; top:10px">
                  <el-row>
                    <el-tag type='success' size="medium">是否反色</el-tag>
                     <el-switch
                      v-model="isInverseColor">
                    </el-switch>
                    </el-row>
        
                    <el-row>
                    <el-tag type='success' size="medium">样式色</el-tag>
                    <el-color-picker v-model="monochromeColor" size="mini" style="top:10px"></el-color-picker>
                    </el-row>
                  <br/>
                  <el-row>
                    <el-tag type='success' size="medium">饱和度</el-tag>
                     <el-slider v-model="saturation"></el-slider>
                  </el-row>
                  <el-row>
                    <el-tag type='success' size="medium">对比度</el-tag>
                    <el-slider v-model="contrast"></el-slider>
                  </el-row>
                  <el-row>
                    <el-tag type='success' size="medium">亮度范围</el-tag>
                    <el-slider
                      v-model="brightness"
                      range
                      show-stops>
                    </el-slider>
                  </el-row>
                </div>
              </template>
            `
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