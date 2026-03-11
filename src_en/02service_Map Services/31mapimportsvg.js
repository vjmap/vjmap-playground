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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/31mapimportsvg
        // --SVG to CAD--
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
                svgCode: '',
                showLineWidth: true,
                showFill: true,
                svgPreview: '',
                whiteColorProcessingParam: 0, // 0 keep as is, 1 auto invert, 2 filter exclude
                blackColorProcessingParam: 0 // 0 keep as is, 1 auto invert, 2 filter exclude
            },
            methods: {
                handleFileUpload(file) {
                    if (!file) return;
        
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.svgCode = e.target.result;
                        this.updatePreview();
                    };
                    reader.readAsText(file.raw);
                },
                updatePreview() {
                    if (this.svgCode.trim()) {
                        this.svgPreview = this.svgCode;
                    } else {
                        this.svgPreview = '<div style="color: #999; text-align: center;">SVG preview will show here</div>';
                    }
                },
                async convertToCAD() {
                    if (!this.svgCode.trim()) {
                        this.$message.error('Please upload or enter SVG code first');
                        return;
                    }
                    map.logInfo('Converting, please wait...', "info");
                    let doc = new vjmap.DbDocument();
                    let param = svc.currentMapParam();
                    let svg = this.svgCode.trim();
                    let layerName = "";
        
                    let result = await svc.execCommand("imageSvgToDwg", {
                        svg: svg,
                        flipY: true,
                        bDisbleDrawFill: !this.showFill,
                        layer: layerName,
                        whiteColorProcessingParam: this.whiteColorProcessingParam,
                        blackColorProcessingParam: this.blackColorProcessingParam
                    }, "_null", "v1");
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
                    map.logInfo('SVG converted to CAD successfully!', "success");
                },
                async exportCAD() {
                    // Check if already converted
                    if (!svc.currentMapParam().fileid) {
                        map.logInfo('Please convert to CAD first before export', "error");
                        return;
                    }
                    const mapid = 'exportsvgdwg';
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
                svgCode() {
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
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">Upload SVG file:</label>
                    <el-upload
                      action=""
                      :auto-upload="false"
                      :show-file-list="false"
                      accept=".svg"
                      :on-change="handleFileUpload">
                      <el-button size="mini" type="primary">Select file</el-button>
                    </el-upload>
                  </div>
        
                  <div style="margin-top: 10px; margin-bottom: 10px;">
                    <label style="margin-right: 8px; font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px;">Or enter SVG code:</label>
                    <el-input
                      type="textarea"
                      :rows="4"
                      placeholder="Paste SVG code here..."
                      v-model="svgCode"
                      style="width: 100%; font-size: 12px;">
                    </el-input>
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
        
                  <div style="display: flex; gap: 10px; width: 100%;">
                    <el-button size="small" type="success" @click="convertToCAD" style="flex: 1;">Convert to CAD</el-button>
                    <el-button size="small" type="primary" @click="exportCAD" style="flex: 1;">Export CAD</el-button>
                  </div>
                </div>
        
                <div style="background: white; border-radius: 6px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 6px;">SVG preview</h2>
                  <div
                    v-html="svgPreview"
                    style="border: 1px dashed #ccc; height: 180px; padding: 8px; overflow: auto; font-size: 12px; width: 100%; text-align: center;">
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