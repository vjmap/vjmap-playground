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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/setLayerStyle
        // --Set layer custom style--
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
        
        let styleStyle = svc.rasterStyle();
        // Initial style
        styleStyle.layers[0].paint = {
        	...styleStyle.layers[0].paint,
        	// Custom style
        	"raster-inverse": 1, // 0 no invert 1 invert
        	"raster-monochrome": "#4586b6", // monochrome color
        	"raster-saturation": 0, // saturation -1 to 1
        	"raster-contrast": 0, // contrast -1 to 1
        }
        // Map object
        let map = new vjmap.Map({
        	container: 'map', // DIV container ID
        	style: styleStyle, // style
        	center: prj.toLngLat(prj.getMapExtent().center()), // set map center
        	zoom: 2, // set zoom level
        	renderWorldCopies: false // do not show world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        await map.onLoad()
        
        let layerId = "raster-layer"
        // Invert
        //map.setRasterInverse(layerId, 1) // 0 no invert 1 invert
        // Monochrome
        //map.setRasterMonochrome(layerId, "#4586b6")
        // Saturation
        // map.setRasterSaturation(layerId, 0) // -1 to 1
        // Contrast
        // map.setRasterContrast(layerId, 0) // -1 to 1
        // Brightness min
        //  map.setRasterBrightnessMin(layerId, 0.5) // 0 to 1
        // Brightness max
        //  map.setRasterBrightnessMax(layerId, 1) // 0 to 1
        
        // UI
        
        if (typeof Vue !== "object") {
        	// If no Vue/Element UI
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
        		isInverseColor: 0,
        		monochromeColor: "#4586b6",
        		saturation: 50,
        		contrast: 50,
        		brightness: [0,100]
        	},
        	watch: {
        		isInverseColor(val) {
        			map.setRasterInverse(layerId, val === true ? 1 : 0)
        		},
        		monochromeColor(val) {
        			map.setRasterMonochrome(layerId, val)
        		},saturation(val) {
        			// -1 to 1
        			map.setRasterSaturation(layerId, -1 + val / 50)
        		},contrast(val) {
        			// -1 to 1
        			map.setRasterContrast(layerId, -1 + val / 50)
        		},brightness(val) {
        			map.setRasterBrightnessMin(layerId, val[0] / 100)
        			map.setRasterBrightnessMax(layerId, val[1] / 100)
        		},
        	},
        	template: `
              <template>
                <div style="position: absolute; z-index: 2;right:10px; top:10px">
                  <el-row>
                    <el-tag type='success' size="medium">Invert</el-tag>
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