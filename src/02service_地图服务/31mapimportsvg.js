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
        // --svg转换为cad--
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
                svgCode: '',
                showLineWidth: true,
                showFill: true,
                svgPreview: '',
                whiteColorProcessingParam: 0, // 0 原样保留, 1 自动反色, 2 过滤排除
                blackColorProcessingParam: 0 // 0 原样保留, 1 自动反色, 2 过滤排除
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
                        this.svgPreview = '<div style="color: #999; text-align: center;">SVG 预览将显示在这里</div>';
                    }
                },
                async convertToCAD() {
                    if (!this.svgCode.trim()) {
                        this.$message.error('请先上传或输入 SVG 代码');
                        return;
                    }
                    map.logInfo('正在转换，请稍等...', "info");
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
                    map.logInfo('SVG 转换为 CAD 成功！', "success");
                },
                async exportCAD() {
                    // 检查是否已经转换
                    if (!svc.currentMapParam().fileid) {
                        map.logInfo('请先转换为 CAD 后再导出', "error");
                        return;
                    }
                    const mapid = 'exportsvgdwg';
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
                    <label style="margin-right: 8px; font-weight: bold; font-size: 13px;">上传 SVG 文件:</label>
                    <el-upload
                      action=""
                      :auto-upload="false"
                      :show-file-list="false"
                      accept=".svg"
                      :on-change="handleFileUpload">
                      <el-button size="mini" type="primary">选择文件</el-button>
                    </el-upload>
                  </div>
        
                  <div style="margin-top: 10px; margin-bottom: 10px;">
                    <label style="margin-right: 8px; font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px;">或输入 SVG 代码:</label>
                    <el-input
                      type="textarea"
                      :rows="4"
                      placeholder="在此粘贴 SVG 代码..."
                      v-model="svgCode"
                      style="width: 100%; font-size: 12px;">
                    </el-input>
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
        
                  <div style="display: flex; gap: 10px; width: 100%;">
                    <el-button size="small" type="success" @click="convertToCAD" style="flex: 1;">转换为 CAD</el-button>
                    <el-button size="small" type="primary" @click="exportCAD" style="flex: 1;">导出 CAD</el-button>
                  </div>
                </div>
        
                <div style="background: white; border-radius: 6px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 6px;">SVG 预览</h2>
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