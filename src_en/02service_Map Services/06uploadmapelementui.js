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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/06uploadmapelementui
        // --Upload new drawing (Element UI)--Upload local CAD drawing with Element UI and open in front-end
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        const openMap = async (param, isVector) => {
            // Open map
            let res = await svc.openMap(param)
            if (res.error) {
                message.error(res.error)
                return;
            }
            // Get map extent
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // Create coordinate system
            let prj = new vjmap.GeoProjection(mapExtent);
        
            // Create map instance
            let map = new vjmap.Map({
                container: 'map', // container ID
                style: isVector ? svc.vectorStyle() : svc.rasterStyle(), // Raster tile style
                center: prj.toLngLat(mapExtent.center()), // Center
                zoom: 2,
                renderWorldCopies: false
            });
            // Attach service and projection to map
            map.attach(svc, prj);
            // Fit map to full extent
            map.fitMapBounds();
        }
        if (typeof Vue !== "object") {
            // If Vue/Element UI not loaded
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
                acceptFormat: ".dwg, .dxf",
                fileList: [],
                isSelectFile: true,
                dialogVisible: false,
                maptype: '', // Map type: empty = CAD, "image" = image
                form: {
                    mapid: '',
                    isPasswordProtection: false,
                    password: '',
                    password2: '',
                    openway: 'Store then render raster',
                    uploadname: '',
                    notUseDefaultTtfFont: false,
                    notUseDefaultShxFont: false,
                    notReplaceLineType: false,
                    fontReplaceRule: ''
                },
                uploadMapResult: {
        
                }
            },
            async mounted() {
                let formats = await svc.cmdGetSupportFormat();
                this.acceptFormat = '';
                if (formats.cad) {
                    this.acceptFormat = formats.cad.split(";").map(f => '.' + f).join(",")
                }
                if (formats.image) {
                    this.acceptFormat += ";" + formats.image.split(";").map(f => '.' + f).join(",")
                }
            },
            methods: {
                async onChangeFile(file) {
                    try {
                        message.info('Uploading file, please wait...')
                        this.isSelectFile = false;
                        this.uploadMapResult = await svc.uploadMap(file.raw);
                        if (this.uploadMapResult.error) {
                            message.error('Upload failed! ' + this.uploadMapResult.error)
                            return
                        }
                        this.form.mapid = this.uploadMapResult.mapid;
                        this.form.uploadname = this.uploadMapResult.uploadname;
                        this.maptype = this.uploadMapResult.maptype || '';
                        this.dialogVisible = true;
                    } catch (error) {
                        console.error(error);
                        message.error('Upload failed!', error)
                    }
                },
                async onOpenMap() {
                    try {
                        let mapid = this.form.mapid;
                        let reg = /[0-9A-Za-z_]{2,40}$/;
                        if (mapid.length > 40 || !reg.test(mapid)) {
                            message.error('Only letters, numbers and underscore _, length 2-40');
                            return;
                        }
                        if (this.form.isPasswordProtection) {
                            if (this.form.password != this.form.password2 || this.form.password.length >= 16 || this.form.password.length < 6) {
                                message.error('Password length 6-15, two inputs must match');
                                return;
                            }
                        }
                        this.dialogVisible = false; // Close dialog
                        let fontReplaceRule = undefined;
                        if (this.form.fontReplaceRule) {
                            try {
                                fontReplaceRule = JSON.parse(this.form.fontReplaceRule)
                            } catch (e) {
        
                            }
                        }
                        let param = {
                            ...this.uploadMapResult,
                            // Map name
                            mapid: this.form.mapid,
                            // fileid returned after upload
                            fileid: this.uploadMapResult.fileid,
                            // Upload filename
                            uploadname: this.form.uploadname,
                            // Map open mode
                            mapopenway: this.form.openway === "Open drawing directly" ? vjmap.MapOpenWay.Memory : vjmap.MapOpenWay.GeomRender,
                            // Password protection: set secret key
                            secretKey: this.form.isPasswordProtection ? svc.pwdToSecretKey(this.form.password) : undefined,
                            style: vjmap.openMapDarkStyle(), // Use dark style when div has dark background
                            /** Do not use default TTF; use default SHX instead */
                            notUseDefaultTtfFont: this.form.notUseDefaultTtfFont,
                            /** Do not use default SHX; use default font instead */
                            notUseDefaultShxFont: this.form.notUseDefaultShxFont,
                            /** Do not auto-replace linetype */
                            notReplaceLineType: this.form.notReplaceLineType,
                            /* Font replace rule; openMap returns findFonts. Example: {"tssdeng.shx_1": "_default_.ttc"} */
                            fontReplaceRule: fontReplaceRule,
                            // Image type: top-left coords and resolution
                            imageLeft: this.form.imageLeft ? +this.form.imageLeft : undefined,
                            imageTop: this.form.imageTop ? +this.form.imageTop : undefined,
                            imageResolution: this.form.imageResolution ? +this.form.imageResolution : undefined,
                            // Password-protected map: callback to input password (or system prompt if not provided)
                            cbInputPassword: (param) => {
                                return new Promise((resolve) => {
                                    if (param.tryPasswordCount > 3) {
                                        resolve(''); // After 3 retries
                                    } else {
                                        ELEMENT.MessageBox.prompt('Enter password or AccessKey', `Map ${this.form.mapId} requires password`, {
                                            confirmButtonText: 'OK',
                                            cancelButtonText: 'Cancel',
                                            inputType: "password"
                                        })
                                            .then(({value}) => {
                                                resolve(value);
                                            })
                                            .catch(() => {
                                                resolve('');
                                            })
                                    }
                                })
                            }
                        }
                        message.info('Opening map; first open may take tens of seconds to a few minutes depending on size...');
                        let isVectorStyle = this.form.openway === "Store then render vector";
                        await openMap(param, isVectorStyle);
                    } catch (error) {
                        console.error(error);
                        message.error('Open failed!', error)
                    }
                }
            },
            template: `
              <template>
                <div style="position: absolute; z-index: 2">
                  <el-upload
                    v-if="isSelectFile"
                    ref="upload"
                    drag
                    :accept="acceptFormat"
                    action="#"
                    :auto-upload="false"
                    :on-change="onChangeFile">
                    <i class="el-icon-upload"></i>
                    <div class="el-upload__text">Drag CAD Dwg/Dxf or image here, or <em>click to upload</em></div>
                  </el-upload>
                  <el-dialog
                    title="Settings"
                    :visible.sync="dialogVisible"
                    :modal="false"
                    width="400px">
                    <el-form ref="form" :model="form" label-width="150px" size="mini">
                      <el-form-item label="Map ID">
                        <el-input v-model="form.mapid"></el-input>
                      </el-form-item>
                      <el-form-item label="Password required to open" >
                        <el-switch
                          v-model="form.isPasswordProtection"
                          inline-prompt
                          active-text="Yes"
                          inactive-text="No"
                        />
                      </el-form-item>
        
                      <el-form-item label="Password" v-if="form.isPasswordProtection" prop="password">
                        <el-input v-model="form.password" type="password" placeholder="Please input password"  show-password></el-input>
                      </el-form-item>
        
                      <el-form-item label="Confirm password" v-if="form.isPasswordProtection" prop="password2">
                        <el-input v-model="form.password2" type="password" placeholder="Please input password"  show-password></el-input>
                      </el-form-item>
        
        
                      <el-form-item label="Open mode" v-if="maptype == ''">
                        <el-radio-group v-model="form.openway">
                          <el-radio-button label="Open drawing directly"></el-radio-button>
                          <el-radio-button label="Store then render raster"></el-radio-button>
                          <el-radio-button label="Store then render vector"></el-radio-button>
                        </el-radio-group>
                      </el-form-item>
        
                      <el-form-item label="Image top-left X" v-if="maptype == 'image'" prop="imageLeft">
                        <el-input v-model="form.imageLeft"  placeholder="Top-left X, default 0" ></el-input>
                      </el-form-item>
        
                      <el-form-item label="Image top-left Y" v-if="maptype == 'image'" prop="imageTop">
                        <el-input v-model="form.imageTop"  placeholder="Top-left Y, default 0" ></el-input>
                      </el-form-item>
        
                      <el-form-item label="Image resolution" v-if="maptype == 'image'" prop="imageResolution">
                        <el-input v-model="form.imageResolution"  placeholder="Geo length per pixel; default 1" ></el-input>
                      </el-form-item>
        
        
                      <el-form-item label="Upload filename">
                        <el-input v-model="form.uploadname"></el-input>
                      </el-form-item>
        
                      <el-form-item label="Do not use default TTF" >
                        <el-switch
                          v-model="form.notUseDefaultTtfFont"
                          inline-prompt
                          active-text="Yes"
                          inactive-text="No"
                        />
                      </el-form-item>
                      <el-form-item label="Do not use default SHX" >
                        <el-switch
                          v-model="form.notUseDefaultShxFont"
                          inline-prompt
                          active-text="Yes"
                          inactive-text="No"
                        />
                      </el-form-item>
                      <el-form-item label="Do not auto-replace linetype" >
                        <el-switch
                          v-model="form.notReplaceLineType"
                          inline-prompt
                          active-text="Yes"
                          inactive-text="No"
                        />
                      </el-form-item>
                      <el-form-item label="Font replace rule">
                        <el-input v-model="form.fontReplaceRule"></el-input>
                      </el-form-item>
                    </el-form>
                    <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">Cancel</el-button>
                <el-button type="primary" @click="onOpenMap()">OK</el-button>
              </span>
                  </el-dialog>
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