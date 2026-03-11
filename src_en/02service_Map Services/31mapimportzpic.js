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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/31mapimportzpic
        // --Image to CAD--
        // Set div background to light
        document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Create an empty map
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromArray([-1000,-1000,1000,1000]);
        // Create geometric projection from map extent
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: svc.rasterBlankStyle(0, 24), // blank map
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 1, // set map zoom level,
            pitch: 0, // pitch angle
            renderWorldCopies: false // do not show multi-world copies
        });
        // Attach service and projection
        map.attach(svc, prj);
        svc.setCurrentMapParam({
            darkMode: false
        })
        
        // Click to highlight (highlight when clicking on map element)
        map.enableLayerClickHighlight(svc, e => {
            if (!e) return;
            let msg = {
                content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
                key: "layerclick",
                duration: 5
            }
            e && message.info(msg);
        })
        
        if (typeof Vue !== "object") {
            // If no Vue and Element UI environment
            await vjmap.addScript([{
                src: "../../js/vue@2.js"
            }, {
                src: "../../js/element-ui@2.15.10/index.js"
            },{
                src: "../../js/element-ui@2.15.10/index.css"
            }])
        }
        
        new Vue({
            el: '#ui',
            data: {
                imageBase64: '',
                showLineWidth: true,
                showFill: true,
                imagePreview: '',
                whiteColorProcessingParam: 0,
                blackColorProcessingParam: 0,
                colorMode: 'color',
                colorPrecision: 6,
                filterSpeckle: 4,
                gradientStep: 16,
                hierarchical: 'stack',
                mode: 'spline',
                pathPrecision: 60,
                segmentLength: 4,
                spliceThreshold: 45,
                defaultValues: {
                    colorMode: 'color',
                    colorPrecision: 6,
                    filterSpeckle: 4,
                    gradientStep: 16,
                    hierarchical: 'stack',
                    mode: 'spline',
                    pathPrecision: 60,
                    segmentLength: 4,
                    spliceThreshold: 45
                }
            },
            methods: {
                handleFileUpload(file) {
                    if (!file) return;
        
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.imageBase64 = e.target.result;
                        this.updatePreview();
                    };
                    reader.readAsDataURL(file.raw);
                },
                updatePreview() {
                    if (this.imageBase64) {
                        this.imagePreview = `<img src="${this.imageBase64}" style="max-width: 100%; max-height: 100%;">`;
                    } else {
                        this.imagePreview = '<div style="color: #999; text-align: center;">Image preview will show here</div>';
                    }
                },
                async convertToCAD() {
                    if (!this.imageBase64) {
                        this.$message.error('Please upload an image first');
                        return;
                    }
                    map.logInfo('Converting, please wait...', "info");
                    let doc = new vjmap.DbDocument();
                    let param = svc.currentMapParam();
                    let imageData = this.imageBase64;
                    let layerName = "";
        
                    let params = {
                        image: imageData,
                        flipY: true,
                        bDisbleDrawFill: !this.showFill,
                        layer: layerName,
                        whiteColorProcessingParam: this.whiteColorProcessingParam,
                        blackColorProcessingParam: this.blackColorProcessingParam
                    };
        
                    if (this.colorMode !== this.defaultValues.colorMode) {
                        params.colormode = this.colorMode;
                    }
                    if (this.colorPrecision !== this.defaultValues.colorPrecision) {
                        params.color_precision = this.colorPrecision;
                    }
                    if (this.filterSpeckle !== this.defaultValues.filterSpeckle) {
                        params.filter_speckle = this.filterSpeckle;
                    }
                    if (this.gradientStep !== this.defaultValues.gradientStep) {
                        params.gradient_step = this.gradientStep;
                    }
                    if (this.hierarchical !== this.defaultValues.hierarchical) {
                        params.hierarchical = this.hierarchical;
                    }
                    if (this.mode !== this.defaultValues.mode) {
                        params.mode = this.mode;
                    }
                    if (this.pathPrecision !== this.defaultValues.pathPrecision) {
                        params.path_precision = this.pathPrecision;
                    }
                    if (this.segmentLength !== this.defaultValues.segmentLength) {
                        params.segment_length = this.segmentLength;
                    }
                    if (this.spliceThreshold !== this.defaultValues.spliceThreshold) {
                        params.splice_threshold = this.spliceThreshold;
                    }
        
                    let result = await svc.execCommand("imageSvgToDwg", params, "_null", "v1");
                    if (result.error) {
                        map.logInfo(result.error, "error");
                        return
                    }
        
                    // js code
                    let res = await svc.updateMap({
                        // Get a temporary map id (temp map for viewing only, auto-deleted when expired)
                        mapid: vjmap.getTempMapId(5), // Temp map auto-delete time when not viewed, in minutes. Default 30
                        fileid: result.fileid,
                        mapopenway: vjmap.MapOpenWay.Memory,
                        style: {
                            backcolor: 0xFFFFFF // if div background is light set to 0xFFFFFF, dark set to 0
                        }
                    })
                    if (res.error) {
                        map.logInfo(res.error, "error");
                        return
                    }
                    await map.switchMap({
                        mapid: res.mapid,
                        style: {
                            backcolor: 0xFFFFFF // if div background is light set to 0xFFFFFF, dark set to 0
                        }
                    });
                    map.logInfo('Image converted to CAD successfully!', "success");
                },
                async exportCAD() {
                    // Check if already converted
                    if (!svc.currentMapParam().fileid) {
                        map.logInfo('Please convert to CAD first before export', "error");
                        return;
                    }
                    const mapid = 'exportimgdwg';
                    let res = await svc.updateMap({
                        mapid: mapid,
                        fileid: svc.currentMapParam().fileid,
                        mapopenway: vjmap.MapOpenWay.Memory,
                        style: {
                            backcolor: 0xFFFFFF // if div background is light set to 0xFFFFFF, dark set to 0
                        }
                    })
                    if (res.error) {
                        map.logInfo(res.error, "error");
                        return;
                    } else{
                        window.open(`https://vjmap.com/app/cloud/#/map/${res.mapid}?version=${res.version}&mapopenway=Memory&vector=false`)
                    }
        
                    map.logInfo('CAD export successful!', "success");
                }
            },
            watch: {
                imageBase64() {
                    this.updatePreview();
                }
            },
            mounted() {
                this.updatePreview();
            },
            template: `
              <div style="position: absolute; top: 0; left: 0; height: 650px; overflow-y: auto; padding: 10px; font-family: Arial, sans-serif; color: #333;">
              <div style="display: flex; flex-direction: column; width: 280px; margin: 0; gap: 10px;">
                <div style="background: white; border-radius: 6px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="margin-bottom: 10px;">
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">Upload image file:</label>
                    <el-upload
                      action=""
                      :auto-upload="false"
                      :show-file-list="false"
                      accept=".png,.jpg,.jpeg,.bmp,.tiff"
                      :on-change="handleFileUpload">
                      <el-button size="mini" type="primary">Select file</el-button>
                    </el-upload>
                  </div>
        
                  <div style="background: white; border-radius: 6px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 6px;">Image preview</h2>
                    <div
                      v-html="imagePreview"
                      style="border: 1px dashed #ccc; height: 180px; padding: 8px; overflow: auto; font-size: 12px; width: 100%; text-align: center;">
                    </div>
                  </div>
        
                  <div style="display: flex; gap: 10px; width: 100%;">
                    <el-button size="small" type="success" @click="convertToCAD" style="flex: 1;">Convert to CAD</el-button>
                    <el-button size="small" type="primary" @click="exportCAD" style="flex: 1;">Export CAD</el-button>
                  </div>
                </div>
        
                <div style="margin-bottom: 10px;">
                  <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #2c3e50;">Conversion options</h3>
        
                  <div style="margin: 6px 0; display: flex; align-items: center;">
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">Show line width:</label>
                    <el-switch v-model="showLineWidth" size="small"></el-switch>
                    <label style="margin-left: 15px; margin-right: 8px; font-weight: bold; font-size: 13px;">Fill:</label>
                    <el-switch v-model="showFill" size="small"></el-switch>
                  </div>
        
                  <div style="margin: 6px 0; display: flex; align-items: center;">
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">White handling:</label>
                    <el-select v-model="whiteColorProcessingParam" size="small" style="width: 150px;">
                      <el-option label="Keep as is" :value="0"></el-option>
                      <el-option label="Auto invert" :value="1"></el-option>
                      <el-option label="Filter exclude" :value="2"></el-option>
                    </el-select>
                  </div>
        
                  <div style="margin: 6px 0; display: flex; align-items: center;">
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">Black handling:</label>
                    <el-select v-model="blackColorProcessingParam" size="small" style="width: 150px;">
                      <el-option label="Keep as is" :value="0"></el-option>
                      <el-option label="Auto invert" :value="1"></el-option>
                      <el-option label="Filter exclude" :value="2"></el-option>
                    </el-select>
                  </div>
        
                </div>
        
                <div style="margin-bottom: 15px;">
                  <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #2c3e50;">Clustering</h3>
                  <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                    <el-radio-group v-model="colorMode" size="small">
                      <el-radio-button label="bw">B&amp;W</el-radio-button>
                      <el-radio-button label="color">Color</el-radio-button>
                    </el-radio-group>
                  </div>
                  <div style="display: flex; gap: 10px;">
                    <el-radio-group v-model="hierarchical" size="small">
                      <el-radio-button label="stack">Stack</el-radio-button>
                      <el-radio-button label="cut">Cut</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
        
                <div style="margin-bottom: 15px;">
                  <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #2c3e50;">Parameter settings</h3>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>Filter speckle (cleaner)</label>
                    <el-slider v-model="filterSpeckle" :min="1" :max="20"></el-slider>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>Color precision (more accurate)</label>
                    <el-slider v-model="colorPrecision" :min="1" :max="10"></el-slider>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>Gradient steps (fewer layers)</label>
                    <el-slider v-model="gradientStep" :min="1" :max="50"></el-slider>
                  </div>
                </div>
        
                <div style="margin-bottom: 15px;">
                  <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #2c3e50;">Curve fitting</h3>
                  <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                    <el-radio-group v-model="mode" size="small">
                      <el-radio-button label="pixel">Pixel</el-radio-button>
                      <el-radio-button label="polygon">Polygon</el-radio-button>
                      <el-radio-button label="spline">Spline</el-radio-button>
                    </el-radio-group>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>Angle threshold (smoother)</label>
                    <el-slider v-model="pathPrecision" :min="0" :max="100"></el-slider>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>Segment length (rougher)</label>
                    <el-slider v-model="segmentLength" :min="1" :max="10"></el-slider>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>Splice threshold (less accurate)</label>
                    <el-slider v-model="spliceThreshold" :min="0" :max="100"></el-slider>
                  </div>
                </div>
        
        
              </div>
              </div>
            `
        });
        
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