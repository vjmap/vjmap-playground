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
        // --Map workspace management--Different workspaces store maps in different locations; data is isolated
        // Map service instance
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        // Create a new div for the map
        const createNewMapDivId = ()=> {
        	// Clear previous content
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
        	// Open map
        	let res = await svc.openMap({
        		mapid: mapid,
        		mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
        		style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        	})
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
        		container: createNewMapDivId(), // Create new div and bind to this map
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
        
        // Open the first map in a workspace
        const openFirstMap = async () => {
        	let maps = await svc.listMaps();
        	let mapIds = Object.keys(maps);
        	if (mapIds.length == 0) {
        		message.error("No maps in this workspace");
        		return;
        	}
        	let mapId = mapIds[0];
        	await openNewMap(mapId)
        }
        const runButtonCmd = async cmdName => {
        	if (cmdName == "getWorkspaces") {
        		// Get all workspaces; non-public workspaces return empty for non-root tokens
        		// When isPublic is false, default token cannot see them; only root token can
        		let res = await svc.getWorkspaces();
        		message.info(JSON.stringify(res, null, 4))
        	} else if (cmdName == "openWorkspaceMap") {
        		let res = await svc.getWorkspaces();
        		res = res.filter(e => e.name != "") // Filter to public only
        		if (res.length == 0) {
        			message.error("No public workspace yet");
        			return;
        		}
        		let workspaceName = res[0].name; // First public workspace name
        		// Switch to this workspace; subsequent svc calls use this workspace
        		svc.switchWorkspace(workspaceName);
        		// Open first map in this workspace
        		await openFirstMap();
        	} else if (cmdName == "openDefaultWorkspaceMap") {
        		// Switch to default workspace (empty name); subsequent svc calls use default workspace
        		svc.switchWorkspace("");
        		// Open first map in default workspace
        		await openFirstMap();
        	}
        }
        
        const createWorkspace = async (name, alias, workDir, isPublic) => {
        	// Create workspace (requires root token)
        	let res = await svc.workspaceCreate({
        		name,
        		alias,
        		workDir,
        		isPublic
        	});
        	message.info(JSON.stringify(res, null, 4))
        }
        const modifyWorkspace = async (name, alias, isPublic) => {
        	// Modify workspace (requires root token)
        	let res = await svc.workspaceModify({
        		name,
        		alias,
        		isPublic
        	});
        	message.info(JSON.stringify(res, null, 4))
        }
        const deleteWorkspace = async (name) => {
        	// Delete workspace (requires root token)
        	let res = await svc.workspaceDelete(name);
        	message.info(JSON.stringify(res, null, 4))
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
        		dialogVisible: false,
        		isCreate: false,
        		isModify: false,
        		isDelete: false,
        		form: {
        			name: "", /** Workspace name (English, no special chars; used as key and route). */
        			alias: "", /** Workspace alias (can be any language). */
        			workDir: "", /** Workspace dir: relative or absolute; empty = use workspace name. */
        			isPublic: true /** Public (if false, workspace not listed by getWorkspaces for non-root). */
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
        					// Create
        					await createWorkspace(this.form.name, this.form.alias, this.form.workDir, this.form.isPublic)
        				} else if (this.isModify) {
        					// Modify
        					await modifyWorkspace(this.form.name, this.form.alias, this.form.isPublic)
        				} else if (this.isDelete) {
        					// Delete
        					this.$confirm(`This will permanently delete workspace ${this.form.name} and clear all data under its directory. Continue?`, 'Confirm', {
        						confirmButtonText: 'OK',
        						cancelButtonText: 'Cancel',
        						type: 'warning'
        					}).then(async () => {
        						await deleteWorkspace(this.form.name)
        					}).catch((e) => {
        						this.$message({
        							type: 'info',
        							message: 'Delete cancelled' + JSON.stringify(e)
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
                      <el-button type="primary" size="mini" @click="buttonCmd('getWorkspaces')">Get all workspaces</el-button>
                      <el-button type="success" size="mini" @click="buttonCmd('openWorkspaceMap')">Open workspace map</el-button>
                      <el-button type="warning" size="mini" @click="buttonCmd('openDefaultWorkspaceMap')">Open default workspace map</el-button>
                    </el-button-group>
                  </el-row>
                  <el-row style="margin-top: 10px">
                    <el-button-group>
                      <el-button type="success" size="mini" @click="showDialog(true, false, false)">Create workspace (root)</el-button>
                      <el-button type="warning" size="mini" @click="showDialog(false, true, false)">Modify workspace (root)</el-button>
                      <el-button type="danger" size="mini" @click="showDialog(false, false, true)">Delete workspace (root)</el-button>
                    </el-button-group>
                  </el-row>
                  <el-dialog
                    title="Workspace"
                    :visible.sync="dialogVisible"
                    :modal="false"
                    width="350px">
                    <el-form ref="form" :model="form" label-width="140px" size="mini">
                      <el-form-item label="Workspace name">
                        <el-input v-model="form.name"></el-input>
                      </el-form-item>
                      <el-form-item label="Workspace alias (optional)"  v-if="this.isModify || this.isCreate">
                        <el-input v-model="form.alias"></el-input>
                      </el-form-item>
                      <el-form-item label="Workspace path (optional)" v-if="this.isCreate">
                        <el-input v-model="form.workDir"></el-input>
                      </el-form-item>
                      <el-form-item label="Public" v-if="this.isModify || this.isCreate">
                        <el-switch v-model="form.isPublic"></el-switch>
                      </el-form-item>
                    </el-form>
                    <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">Cancel</el-button>
                <el-button type="primary" @click="onOK">OK</el-button>
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