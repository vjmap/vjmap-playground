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
        // --上传新图形(基于ElementUI实现)--用ElementUI上传本地的CAD图形，然后在前端打开
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        const openMap = async (param, isVector) => {
            // 打开地图
            let res = await svc.openMap(param)
            if (res.error) {
                message.error(res.error)
                return;
            }
            // 获取地图的范围
            let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
            // 建立坐标系
            let prj = new vjmap.GeoProjection(mapExtent);
        
            // 新建地图对象
            let map = new vjmap.Map({
                container: 'map', // container ID
                style: isVector ? svc.vectorStyle() : svc.rasterStyle(), // 栅格瓦片样式
                center: prj.toLngLat(mapExtent.center()), // 中心点
                zoom: 2,
                renderWorldCopies: false
            });
            // 地图关联服务对象和坐标系
            map.attach(svc, prj);
            // 使地图全部可见
            map.fitMapBounds();
        }
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
                acceptFormat: ".dwg, .dxf",
                fileList: [],
                isSelectFile: true,
                dialogVisible: false,
                maptype: '',// 地图类型，为空的话为cad图，"image"为图像类型
                form: {
                    mapid: '',
                    isPasswordProtection: false,
                    password: '',
                    password2: '',
                    openway: '存储后渲染栅格',
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
                        message.info('文件上传中，请稍候...')
                        this.isSelectFile = false;
                        this.uploadMapResult = await svc.uploadMap(file.raw);
                        if (this.uploadMapResult.error) {
                            message.error('上传图形失败!' + this.uploadMapResult.error)
                            return
                        }
                        this.form.mapid = this.uploadMapResult.mapid;
                        this.form.uploadname = this.uploadMapResult.uploadname;
                        this.maptype = this.uploadMapResult.maptype || '';
                        this.dialogVisible = true;
                    } catch (error) {
                        console.error(error);
                        message.error('上传图形失败!', error)
                    }
                },
                async onOpenMap() {
                    try {
                        let mapid = this.form.mapid;
                        let reg = /[0-9A-Za-z_]{2,40}$/;
                        if (mapid.length > 40 || !reg.test(mapid)) {
                            message.error('只能包含字母数字和下划线_，长度2-40');
                            return;
                        }
                        if (this.form.isPasswordProtection) {
                            if (this.form.password != this.form.password2 || this.form.password.length >= 16 || this.form.password.length < 6) {
                                message.error('密码长度为6-15,两次密码要输入一样才可以了');
                                return;
                            }
                        }
                        this.dialogVisible = false; // 关闭对话框
                        let fontReplaceRule = undefined;
                        if (this.form.fontReplaceRule) {
                            try {
                                fontReplaceRule = JSON.parse(this.form.fontReplaceRule)
                            } catch (e) {
        
                            }
                        }
                        let param = {
                            ...this.uploadMapResult,
                            // 图名称
                            mapid: this.form.mapid,
                            // 上传完返回的fileid
                            fileid: this.uploadMapResult.fileid,
                            // 上传完返回的文件名
                            uploadname: this.form.uploadname,
                            // 地图打开方式
                            mapopenway: this.form.openway === "直接打开图形" ? vjmap.MapOpenWay.Memory : vjmap.MapOpenWay.GeomRender,
                            // 如果要密码访问的话，设置秘钥值
                            secretKey: this.form.isPasswordProtection ? svc.pwdToSecretKey(this.form.password) : undefined,
                            style: vjmap.openMapDarkStyle(),// div为深色背景颜色时，这里也传深色背景样式
                            /** 不使用缺省的字体文件，将使用缺省的型文件来代替字体文件.. */
                            notUseDefaultTtfFont: this.form.notUseDefaultTtfFont,
                            /** 不使用缺省的型文字文件，将使用缺省的字体来代替型文件. */
                            notUseDefaultShxFont: this.form.notUseDefaultShxFont,
                            /** 不自动替换线型. */
                            notReplaceLineType: this.form.notReplaceLineType,
                            /* 字符替换规则. openMap返回的字段findFonts为系统查找的字体替换规则。如需修改默认的话，请传入替换的字体规则，如fontReplaceRule: {"tssdeng.shx_1": "_default_.ttc"} */
                            fontReplaceRule: fontReplaceRule,
                            // 图像类型设置地图左上角坐标和分辨率
                            imageLeft: this.form.imageLeft ? +this.form.imageLeft : undefined,
                            imageTop: this.form.imageTop ? +this.form.imageTop : undefined,
                            imageResolution: this.form.imageResolution ? +this.form.imageResolution : undefined,
                            // 如果有密码保护的图，要求输入密码回调，如果不传回调函数的话，将用系统的prompt提示输入
                            cbInputPassword: (param) => {
                                return new Promise((resolve) => {
                                    if (param.tryPasswordCount > 3) {
                                        resolve('');// 如果密码重试次数超过三次
                                    } else {
                                        ELEMENT.MessageBox.prompt('请输入密码或AccessKey', `打开图 ${this.form.mapId} 需要密码`, {
                                            confirmButtonText: '确定',
                                            cancelButtonText: '取消',
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
                        message.info('正在打开地图，第一次打开时根据图的大小可能需要几十秒至几分钟不等，请稍候...');
                        let isVectorStyle = this.form.openway === "存储后渲染矢量";
                        await openMap(param, isVectorStyle);
                    } catch (error) {
                        console.error(error);
                        message.error('打开图形失败!', error)
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
                    <div class="el-upload__text">将CAD的Dwg或Dxf或图像文件拖到此处，或<em>点击上传</em></div>
                  </el-upload>
                  <el-dialog
                    title="设置"
                    :visible.sync="dialogVisible"
                    :modal="false"
                    width="400px">
                    <el-form ref="form" :model="form" label-width="150px" size="mini">
                      <el-form-item label="图名称id">
                        <el-input v-model="form.mapid"></el-input>
                      </el-form-item>
                      <el-form-item label="打开图需要密码" >
                        <el-switch
                          v-model="form.isPasswordProtection"
                          inline-prompt
                          active-text="是"
                          inactive-text="否"
                        />
                      </el-form-item>
        
                      <el-form-item label="密码" v-if="form.isPasswordProtection" prop="password">
                        <el-input v-model="form.password" type="password" placeholder="Please input password"  show-password></el-input>
                      </el-form-item>
        
                      <el-form-item label="密码确认" v-if="form.isPasswordProtection" prop="password2">
                        <el-input v-model="form.password2" type="password" placeholder="Please input password"  show-password></el-input>
                      </el-form-item>
        
        
                      <el-form-item label="打开方式" v-if="maptype == ''">
                        <el-radio-group v-model="form.openway">
                          <el-radio-button label="直接打开图形"></el-radio-button>
                          <el-radio-button label="存储后渲染栅格"></el-radio-button>
                          <el-radio-button label="存储后渲染矢量"></el-radio-button>
                        </el-radio-group>
                      </el-form-item>
        
                      <el-form-item label="图像左上角坐标X" v-if="maptype == 'image'" prop="imageLeft">
                        <el-input v-model="form.imageLeft"  placeholder="图像左上角坐标X, 缺省0" ></el-input>
                      </el-form-item>
        
                      <el-form-item label="图像左上角坐标Y" v-if="maptype == 'image'" prop="imageTop">
                        <el-input v-model="form.imageTop"  placeholder="图像左上角坐标Y, 缺省0" ></el-input>
                      </el-form-item>
        
                      <el-form-item label="图像分辨率" v-if="maptype == 'image'" prop="imageResolution">
                        <el-input v-model="form.imageResolution"  placeholder="一个像素表示多少地理长度。地理长度/像素宽。缺省1" ></el-input>
                      </el-form-item>
        
        
                      <el-form-item label="上传时文件名">
                        <el-input v-model="form.uploadname"></el-input>
                      </el-form-item>
        
                      <el-form-item label="不使用缺省字体文件" >
                        <el-switch
                          v-model="form.notUseDefaultTtfFont"
                          inline-prompt
                          active-text="是"
                          inactive-text="否"
                        />
                      </el-form-item>
                      <el-form-item label="不使用缺省型文件" >
                        <el-switch
                          v-model="form.notUseDefaultShxFont"
                          inline-prompt
                          active-text="是"
                          inactive-text="否"
                        />
                      </el-form-item>
                      <el-form-item label="不自动替换线型" >
                        <el-switch
                          v-model="form.notReplaceLineType"
                          inline-prompt
                          active-text="是"
                          inactive-text="否"
                        />
                      </el-form-item>
                      <el-form-item label="字体替换规则">
                        <el-input v-model="form.fontReplaceRule"></el-input>
                      </el-form-item>
                    </el-form>
                    <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="onOpenMap()">确 定</el-button>
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