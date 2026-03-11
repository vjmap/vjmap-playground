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
        // --图片转换为cad--
        // 把div背景改成浅色
        document.body.style.backgroundImage = "linear-gradient(rgba(255, 255, 255, 1), rgba(233,255,255, 1), rgba(233,255,255, 1))"
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 建一个空的地图
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromArray([-1000,-1000,1000,1000]);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterBlankStyle(0, 24), // 空白地图
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 1, // 设置地图缩放级别,
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        svc.setCurrentMapParam({
            darkMode: false
        })
        
        // 点击有高亮状态（鼠标点击地图元素上时，会高亮)
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
            // 如果没有vue和elementui环境
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
                        this.imagePreview = '<div style="color: #999; text-align: center;">图像预览将显示在这里</div>';
                    }
                },
                async convertToCAD() {
                    if (!this.imageBase64) {
                        this.$message.error('请先上传图像');
                        return;
                    }
                    map.logInfo('正在转换，请稍等...', "info");
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
        
                    // js代码
                    let res = await svc.updateMap({
                        // 获取一个临时的图id(临时图形只会用临时查看，过期会自动删除)
                        mapid: vjmap.getTempMapId(5), // 临时图形不浏览情况下过期自动删除时间，单位分钟。默认30
                        fileid: result.fileid,
                        mapopenway: vjmap.MapOpenWay.Memory,
                        style: {
                            backcolor: 0xFFFFFF // 如果div背景色是浅色，则设置为0xFFFFFF，深色则设置为0
                        }
                    })
                    if (res.error) {
                        map.logInfo(res.error, "error");
                        return
                    }
                    await map.switchMap({
                        mapid: res.mapid,
                        style: {
                            backcolor: 0xFFFFFF // 如果div背景色是浅色，则设置为0xFFFFFF，深色则设置为0
                        }
                    });
                    map.logInfo('图像转换为 CAD 成功！', "success");
                },
                async exportCAD() {
                    // 检查是否已经转换
                    if (!svc.currentMapParam().fileid) {
                        map.logInfo('请先转换为 CAD 后再导出', "error");
                        return;
                    }
                    const mapid = 'exportimgdwg';
                    let res = await svc.updateMap({
                        mapid: mapid,
                        fileid: svc.currentMapParam().fileid,
                        mapopenway: vjmap.MapOpenWay.Memory,
                        style: {
                            backcolor: 0xFFFFFF // 如果div背景色是浅色，则设置为0xFFFFFF，深色则设置为0
                        }
                    })
                    if (res.error) {
                        map.logInfo(res.error, "error");
                        return;
                    } else{
                        window.open(`https://vjmap.com/app/cloud/#/map/${res.mapid}?version=${res.version}&mapopenway=Memory&vector=false`)
                    }
        
                    map.logInfo('CAD 导出成功！', "success");
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
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">上传图像文件:</label>
                    <el-upload
                      action=""
                      :auto-upload="false"
                      :show-file-list="false"
                      accept=".png,.jpg,.jpeg,.bmp,.tiff"
                      :on-change="handleFileUpload">
                      <el-button size="mini" type="primary">选择文件</el-button>
                    </el-upload>
                  </div>
        
                  <div style="background: white; border-radius: 6px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 6px;">图像预览</h2>
                    <div
                      v-html="imagePreview"
                      style="border: 1px dashed #ccc; height: 180px; padding: 8px; overflow: auto; font-size: 12px; width: 100%; text-align: center;">
                    </div>
                  </div>
        
                  <div style="display: flex; gap: 10px; width: 100%;">
                    <el-button size="small" type="success" @click="convertToCAD" style="flex: 1;">转换为 CAD</el-button>
                    <el-button size="small" type="primary" @click="exportCAD" style="flex: 1;">导出 CAD</el-button>
                  </div>
                </div>
        
                <div style="margin-bottom: 10px;">
                  <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #2c3e50;">转换选项</h3>
        
                  <div style="margin: 6px 0; display: flex; align-items: center;">
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">显示线宽:</label>
                    <el-switch v-model="showLineWidth" size="small"></el-switch>
                    <label style="margin-left: 15px; margin-right: 8px; font-weight: bold; font-size: 13px;">是否填充:</label>
                    <el-switch v-model="showFill" size="small"></el-switch>
                  </div>
        
                  <div style="margin: 6px 0; display: flex; align-items: center;">
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">白色处理:</label>
                    <el-select v-model="whiteColorProcessingParam" size="small" style="width: 150px;">
                      <el-option label="原样保留" :value="0"></el-option>
                      <el-option label="自动反色" :value="1"></el-option>
                      <el-option label="过滤排除" :value="2"></el-option>
                    </el-select>
                  </div>
        
                  <div style="margin: 6px 0; display: flex; align-items: center;">
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">黑色处理:</label>
                    <el-select v-model="blackColorProcessingParam" size="small" style="width: 150px;">
                      <el-option label="原样保留" :value="0"></el-option>
                      <el-option label="自动反色" :value="1"></el-option>
                      <el-option label="过滤排除" :value="2"></el-option>
                    </el-select>
                  </div>
        
                </div>
        
                <div style="margin-bottom: 15px;">
                  <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #2c3e50;">聚类</h3>
                  <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                    <el-radio-group v-model="colorMode" size="small">
                      <el-radio-button label="bw">黑白</el-radio-button>
                      <el-radio-button label="color">颜色</el-radio-button>
                    </el-radio-group>
                  </div>
                  <div style="display: flex; gap: 10px;">
                    <el-radio-group v-model="hierarchical" size="small">
                      <el-radio-button label="stack">堆叠</el-radio-button>
                      <el-radio-button label="cut">剪切</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
        
                <div style="margin-bottom: 15px;">
                  <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #2c3e50;">参数设置</h3>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>滤除斑点 (清洁器)</label>
                    <el-slider v-model="filterSpeckle" :min="1" :max="20"></el-slider>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>色彩精度 (更准确)</label>
                    <el-slider v-model="colorPrecision" :min="1" :max="10"></el-slider>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>渐变步骤 (较少层)</label>
                    <el-slider v-model="gradientStep" :min="1" :max="50"></el-slider>
                  </div>
                </div>
        
                <div style="margin-bottom: 15px;">
                  <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #2c3e50;">曲线拟合</h3>
                  <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                    <el-radio-group v-model="mode" size="small">
                      <el-radio-button label="pixel">像素</el-radio-button>
                      <el-radio-button label="polygon">多边形</el-radio-button>
                      <el-radio-button label="spline">样条线</el-radio-button>
                    </el-radio-group>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>角阈值 (更平滑)</label>
                    <el-slider v-model="pathPrecision" :min="0" :max="100"></el-slider>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>段长度 (更粗糙)</label>
                    <el-slider v-model="segmentLength" :min="1" :max="10"></el-slider>
                  </div>
        
                  <div class="param-item" style="margin-bottom: 8px;">
                    <label>拼接阈值 (不太准确)</label>
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