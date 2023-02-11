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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/07mapWorkspace
        // --地图工作区管理--不同的工作区的地图存放位置不同，数据之间相互隔离
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        // 创建一个新的div对象
        const createNewMapDivId = ()=> {
        	// 先清空之前的
        	let parentDiv = document.getElementById("map");
        	parentDiv.innerHTML = "";
        	let newMapDiv = document.createElement("div");
        	newMapDiv.id = vjmap.RandomID(6);
        	newMapDiv.style.position = 'absolute';
        	newMapDiv.style.width = "100%";
        	newMapDiv.style.height = "100%";
        	parentDiv.appendChild(newMapDiv);
        	return newMapDiv.id;
        }
        
        const openNewMap = async (mapid, isVector) => {
        // 打开地图
        	let res = await svc.openMap({
        		mapid: mapid,
        		mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
        		style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        	})
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
        		container: createNewMapDivId(), // 这里要创建一个新的div对象，与新的map对象相绑定
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
        
        // 打开一个工作区的第一张图
        const openFirstMap = async () => {
        	let maps = await svc.listMaps();
        	let mapIds = Object.keys(maps);
        	if (mapIds.length == 0) {
        		message.error("此工作区没有图");
        		return;
        	}
        	let mapId = mapIds[0];
        	await openNewMap(mapId)
        }
        const runButtonCmd = async cmdName => {
        	if (cmdName == "getWorkspaces") {
        		// 获取所有工作区信息 如果不是root权限的token去获取的话，设置了非公开的工作区，此工作区获取的数据返回为空
        		// 如果isPublic为false, 默认权限获取所有工作区的时候，不公开的工作区是获取不到的。只有root权限的token获取的时候才能获取到
        		let res = await svc.getWorkspaces();
        		message.info(JSON.stringify(res, null, 4))
        	} else if (cmdName == "openWorkspaceMap") {
        		let res = await svc.getWorkspaces();
        		res = res.filter(e => e.name != "") // 过滤出所有公开的
        		if (res.length == 0) {
        			message.error("还没有公开的工作区呢");
        			return;
        		}
        		let workspaceName = res[0].name; // 获取第一个公开的工作区的名称
        		// 切换到此工作区下面，以后服务svc调用的方法都是在此工作区下面进行了
        		svc.switchWorkspace(workspaceName);
        		// 在此工作区下面打开此工作区的第一张图
        		await openFirstMap();
        	} else if (cmdName == "openDefaultWorkspaceMap") {
        		// 切换到默认工作区下面，默认工作区名称就是为空，以后服务svc调用的方法都是在此默认工作区下面进行了
        		svc.switchWorkspace("");
        		// 在默认工作区下面打开默认工作区的第一张图
        		await openFirstMap();
        	}
        }
        
        const createWorkspace = async (name, alias, workDir, isPublic) => {
        	// 创建工作区 (需要root的token的权限)
        	let res = await svc.workspaceCreate({
        		name,
        		alias,
        		workDir,
        		isPublic
        	});
        	message.info(JSON.stringify(res, null, 4))
        }
        const modifyWorkspace = async (name, alias, isPublic) => {
        	// 修改工作区 (需要root的token的权限)
        	let res = await svc.workspaceModify({
        		name,
        		alias,
        		isPublic
        	});
        	message.info(JSON.stringify(res, null, 4))
        }
        const deleteWorkspace = async (name) => {
        	// 删除工作区 (需要root的token的权限)
        	let res = await svc.workspaceDelete(name);
        	message.info(JSON.stringify(res, null, 4))
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
        		dialogVisible: false,
        		isCreate: false,
        		isModify: false,
        		isDelete: false,
        		form: {
        			name: "", /** 工作区名称(英文名称，不要有特殊字符，用于做为键值和路由). */
        			alias: "", /** 工作区别名(可以是中文). */
        			workDir: "",/** 工作区目录，如果是相对于工作区路径的一个路径或绝对路径，如为空的话，则用工作区名称做为工作目录. */
        			isPublic: true/** 是否公开（不公开的话，无法通过获取工作区功能来获取到此工作区信息）. */
        		}
        	},
        	methods: {
        		buttonCmd(cmdName) {
        			runButtonCmd(cmdName)
        		},
        		showDialog(_isCreate, _isModify, _isDelete) {
        			this.isCreate = _isCreate;
        			this.isModify = _isModify;
        			this.isDelete = _isDelete;
        			this.dialogVisible = _isCreate || _isModify || _isDelete;
        		},
        		async onOK() {
        			this.dialogVisible = false;
        			try {
        				if (this.isCreate) {
        					// 创建
        					await createWorkspace(this.form.name, this.form.alias, this.form.workDir, this.form.isPublic)
        				} else if (this.isModify) {
        					// 修改
        					await modifyWorkspace(this.form.name, this.form.alias, this.form.isPublic)
        				} else if (this.isDelete) {
        					// 删除
        					this.$confirm(`此操作将永久删除工作区 ${name}, 工作区目录下面的所有数据将被清空, 是否继续?`, '提示', {
        						confirmButtonText: '确定',
        						cancelButtonText: '取消',
        						type: 'warning'
        					}).then(async () => {
        						await deleteWorkspace(this.form.name)
        					}).catch((e) => {
        						this.$message({
        							type: 'info',
        							message: '已取消删除' + JSON.stringify(e)
        						});
        					});
        
        				}
        			} catch (e) {
        				console.error(e);
        				message.error({
        					content: "catch error: " + (e.message || e.response || JSON.stringify(e).substr(0, 80)),
        					duration: 60,
        					key: "err"
        				});
        			}
        
        		}
        	},
        	template: `
              <template>
                <div style="position: absolute; z-index: 2;">
                  <el-row>
                    <el-button-group>
                      <el-button type="primary" size="mini" @click="buttonCmd('getWorkspaces')">获取所有工作区信息</el-button>
                      <el-button type="success" size="mini" @click="buttonCmd('openWorkspaceMap')">打开工作区一的图</el-button>
                      <el-button type="warning" size="mini" @click="buttonCmd('openDefaultWorkspaceMap')">打开默认工作区的图</el-button>
                    </el-button-group>
                  </el-row>
                  <el-row style="margin-top: 10px">
                    <el-button-group>
                      <el-button type="success" size="mini" @click="showDialog(true, false, false)">创建工作区(需root权限)</el-button>
                      <el-button type="warning" size="mini" @click="showDialog(false, true, false)">修改工作区(需root权限)</el-button>
                      <el-button type="danger" size="mini" @click="showDialog(false, false, true)">删除工作区(需root权限)</el-button>
                    </el-button-group>
                  </el-row>
                  <el-dialog
                    title="工作区"
                    :visible.sync="dialogVisible"
                    :modal="false"
                    width="350px">
                    <el-form ref="form" :model="form" label-width="140px" size="mini">
                      <el-form-item label="工作区名称">
                        <el-input v-model="form.name"></el-input>
                      </el-form-item>
                      <el-form-item label="工作区别名(可为空)"  v-if="this.isModify || this.isCreate">
                        <el-input v-model="form.alias"></el-input>
                      </el-form-item>
                      <el-form-item label="工作区路径(可为空)" v-if="this.isCreate">
                        <el-input v-model="form.workDir"></el-input>
                      </el-form-item>
                      <el-form-item label="是否公开" v-if="this.isModify || this.isCreate">
                        <el-switch v-model="form.isPublic"></el-switch>
                      </el-form-item>
                    </el-form>
                    <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="onOK">确 定</el-button>
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