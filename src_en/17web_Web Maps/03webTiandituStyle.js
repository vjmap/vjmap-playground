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
        // --Web map style customization--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Create lnglat projection by map bounds
        let prj = new vjmap.LnglatProjection();
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
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
                        // Custom map style, use dark style instead of default
                        "raster-inverse": 1, // 0 no inverse 1 inverse
                        "raster-monochrome": "#4586b6", // Modify map style with solid color
                        "raster-saturation": 0, // Saturation, value -1 to 1
                        "raster-contrast": 0, // Contrast, value -1 to 1
                    }
                },{
                    id: 'tdt2',
                    type: 'raster',
                    source: 'tdt2',
                    paint: {
                        // Custom map style, use dark style instead of default
                        "raster-inverse": 1, // 0 no inverse 1 inverse
                        "raster-monochrome": "#4586b6", // Modify map style with solid color
                        "raster-saturation": 0, // Saturation, value -1 to 1
                        "raster-contrast": 0, // Contrast, value -1 to 1
                    }
                }]
            },
            center: prj.toLngLat([116.3912, 39.9073]),
            zoom: 10,
            pitch: 0,
            renderWorldCopies: false // Do not show multi-screen map
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent by map bounds
        //map.fitMapBounds();
        await map.onLoad();
        
        const co = prj.toLngLat([116.3912, 39.9073])
        const marker = new vjmap.Marker({color: "red"})
        marker.setLngLat(co).addTo(map)
        
        let layerIds = ["tdt1", "tdt2"]
        // To modify style later, use the following:
        /*
        // Custom map style, use dark style instead of default
        layerIds.forEach(layerId => {
            // Inverse color
            map.setRasterInverse(layerId, 1) // 0 no inverse 1 inverse
            // Modify map style with solid color
            map.setRasterMonochrome(layerId, "#4586b6")
            // Saturation
            // map.setRasterSaturation(layerId, 0) // value -1 to 1
            // Contrast
            // map.setRasterContrast(layerId, 0) // value -1 to 1
            // Brightness min
            //  map.setRasterBrightnessMin(layerId, 0.5) // value 0 to 1
            // Brightness max
            //  map.setRasterBrightnessMax(layerId, 1) // value 0 to 1
        })
        */
        
        
        // UI
        
        if (typeof Vue !== "object") {
            // If Vue and Element UI are not available
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
                        // -1 to 1
                        map.setRasterSaturation(layerId, -1 + val / 50)
                    })
                },contrast(val) {
                    layerIds.forEach(layerId => {
                        // -1 to 1
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
                    <el-tag type='success' size="medium">Inverse color</el-tag>
                     <el-switch
                      v-model="isInverseColor">
                    </el-switch>
                    </el-row>
        
                    <el-row>
                    <el-tag type='success' size="medium">Style color</el-tag>
                    <el-color-picker v-model="monochromeColor" size="mini" style="top:10px"></el-color-picker>
                    </el-row>
                  <br/>
                  <el-row>
                    <el-tag type='success' size="medium">Saturation</el-tag>
                     <el-slider v-model="saturation"></el-slider>
                  </el-row>
                  <el-row>
                    <el-tag type='success' size="medium">Contrast</el-tag>
                    <el-slider v-model="contrast"></el-slider>
                  </el-row>
                  <el-row>
                    <el-tag type='success' size="medium">Brightness range</el-tag>
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