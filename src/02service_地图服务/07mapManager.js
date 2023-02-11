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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/07mapManager
        // --地图管理--对地图进行管理
        // js代码
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
        	mapid: env.exampleMapId,
        	mapopenway: vjmap.MapOpenWay.Memory, // 以几何数据渲染方式打开
        	style: {
        		backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
        	}
        })
        if (res.error) {
        	message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
        	container: 'map', // container ID
        	style: svc.rasterStyle(),
        	center: prj.toLngLat(mapExtent.center()),
        	zoom: 1,
        	renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        map.addControl(new vjmap.NavigationControl());
        map.addControl(new vjmap.MousePositionControl({showZoom: true}));
        
        map.enableLayerClickHighlight(svc, e => {
        	e && message.info(`type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`);
        })
        
        async function openLocalFile(file) {
        	message.info("正在上传图形，请稍候", 2);
        	let res = await svc.uploadMap(file);
        	res = await showSettingsDialog(res)
        	let data = await svc.openMap(res);
        	if (data.error) {
        		message.error(data.error)
        		return;
        	}
        	map.changeSourceTiles(res.isVector ? svc.vectorTileUrl() : svc.rasterTileUrl());
        	mapExtent = vjmap.GeoBounds.fromString(data.bounds);
        	map.updateMapExtent(mapExtent);
        	map.setCenter(map.toLngLat(mapExtent.center()))
        	map.fitMapBounds();
        }
        
        let layers = svc.getMapLayers();
        function showUI() {
        	vjgui.init();
        	let element = vjgui.createElement("div", "sidebar .sidebar", "", "")
            vjgui.add(element)
        	let sidebar = new vjgui.Inspector();
        	sidebar.addFile("dwg文件", "", { read_file: "binary", callback: function(v) {
        			if (v && v.files && v.files.length > 0) {
        				let file = v.files[0]
        				openLocalFile(file)
        			}
        		} });
        	sidebar.addButton("图层切换","选择图层",{callback: async function(name) {
        		let res = await showSelectLayers(layers);
        		if (res) {
        			layers = res;
        			map.switchLayers(svc, res.reduce((sum, val) => {
        				if (!val.isOff) {
        					sum.push(val.name);
        				}
        				return sum;
        			}, []))
        		}
        	}});
        	sidebar.addButton("所有图形","选择图",{callback: async function(name) {
        		let allmaps = await svc.listMaps("", "*");
        		let res = await showSelectMaps(allmaps);
        		if (res && res.mapid && res.version) {
        			let data = await svc.openMap({
        				mapid: res.mapid,
        				version: res.version,
        				mapopenway: res.geom ? vjmap.MapOpenWay.GeomRender : vjmap.MapOpenWay.Memory,
        				style: vjmap.openMapDarkStyle()
        			});
        			if (data.error) {
        				message.error(data.error)
        				return;
        			}
        			map.changeSourceTiles(res.isVector ? svc.vectorTileUrl() : svc.rasterTileUrl());
        			mapExtent = vjmap.GeoBounds.fromString(data.bounds);
        			map.updateMapExtent(mapExtent);
        			map.setCenter(map.toLngLat(mapExtent.center()))
        			map.fitMapBounds();
        		}
        	}});
        	sidebar.addFile("更新图形", "", { read_file: "binary", callback: async function(v) {
        		if (v && v.files && v.files.length > 0) {
        			let file = v.files[0]
        			message.info("正在上传图形，请稍候", 2);
        			let curParam = svc.currentMapParam() || {};
        			let res = await svc.uploadMap(file);
        			res.mapid = curParam.mapid ? curParam.mapid : res.mapid;
        			// res.deleteOldVersion = true; // 是否更新时需要
        			let data = await svc.updateMap(res);
        			map.changeSourceTiles(res.isVector ? svc.vectorTileUrl() : svc.rasterTileUrl());
        			mapExtent = vjmap.GeoBounds.fromString(data.bounds);
        			map.updateMapExtent(mapExtent);
        			map.setCenter(map.toLngLat(mapExtent.center()))
        			map.fitMapBounds();
        		}
        	} });
        	sidebar.addButton("图形切片","点击输入级别",{callback: async function(name) {
        		vjgui.prompt("请输入要切的级别", e=>{
        			if (e) {
        				svc.cmdSliceLayer({
        					zoom: parseInt(e),
        					ismvt: map.hasVectorLayer()
        				})
        			}
        		}, {
        			value: "6",
        			title: "切片设置",
        			width: "200px",
        			height: "150px"
        		})
        	}});
        	sidebar.appendTo("#sidebar");
        }
        
        showUI();
        
        async function showSettingsDialog(param) {
        	return new Promise((resolve, reject) => {
        		// Create a new dialog
        		let dialog = new vjgui.Dialog({id: 'openSettings', title:'设置', close: true, minimize: false, width: 250, height: 300, scroll: false, resizable: false, draggable: true });
        
        		// Create a collection of widgets
        		let widgets = new vjgui.Inspector();
        		let nameWidget = widgets.addString("图名称",param.mapid);
        		let openWayType = param.geom ? "存储后渲染栅格" : "直接打开图形";
        		let openWay = param.geom ? vjmap.MapOpenWay.GeomRender : vjmap.MapOpenWay.Memory;
        		let isVector = false;
        		let isOk = false;
        		let typeWidget = widgets.addComboButtons("打开方式",openWayType,{
        			values:["直接打开图形","存储后渲染栅格","存储后渲染矢量"],
        			callback: (name) => {
        				openWay = name === "直接打开图形" ? vjmap.MapOpenWay.Memory : vjmap.MapOpenWay.GeomRender;
        				isVector = name === "存储后渲染矢量";
        			}
        		});
        
        		dialog.add(widgets);
        
        		// Add some buttons
        		dialog.addButton('确定', { close: true, callback: () => {
        			isOk = true;
        		}});
        		dialog.addButton('取消',{ close: 'fade' });
        		dialog.show();
        		vjgui.bind(dialog, "closed", e => {
        			if (isOk) {
        				param.mapopenway = openWay;
        				param.mapid = nameWidget.getValue();
        				param.isVector = isVector;
        				param.style = vjmap.openMapDarkStyle();
        				resolve(param)
        			} else {
        				reject("cancel");
        			}
        		})
        	});
        }
        
        async function showSelectMaps(param) {
        	return new Promise((resolve, reject) => {
        		let dialog = new vjgui.Dialog( { title:"选择图形", close: true, minimize: true, width: 300, height: 400, scroll: true, resizable:true, draggable: true} );
        		dialog.show();
        		dialog.setPosition( 250,20 );
        
               //tree
        		let mytree = { id: "所有图形",
        			children: [
        			]};
        
        		for(let m in param) {
        			let node = {};
        			node.id = m;
        			node.children = []
        			for(let v of param[m]) {
        				node.children.push({
        					id: v.version,
        					geom: v.geom,
        					status: v.finish,
        					mapid: m,
        					version: v.version
        				})
        			}
        			mytree.children.push(node);
        		}
        		mytree.children.push({});
        		let sel = {};
        		let litetree = new vjgui.Tree( mytree, { allow_rename: false });
        		vjgui.bind( litetree.root, "item_selected", function(e) {
        			sel = e.detail.data;
        		});
        		dialog.add(litetree);
        
        		// Add some buttons
        		let isOk = false;
        		dialog.addButton('确定', { close: true, callback: () => {
        			isOk = true;
        			}});
        		dialog.addButton('取消',{ close: 'fade' });
        
        		vjgui.bind(dialog, "closed", e => {
        			if (isOk) {
        				resolve(sel)
        			} else {
        				resolve();
        			}
        		})
        	});
        }
        
        async function showSelectLayers(param) {
        	return new Promise((resolve, reject) => {
        		let dialog = new vjgui.Dialog( { title:"图层切换", close: true, minimize: true, width: 300, height: 400, scroll: true, resizable:true, draggable: true} );
        		dialog.show();
        		dialog.setPosition( 250,10 );
        
        		let list = new vjgui.ComplexList({height: "90%"});
        		dialog.add( list );
        
        		list.onItemToggled = (item, elelm, enable) => {
        			param[item.id].isOff = !enable
        		}
        		list.addTitle("请选择要打开的图层");
        		for(let i = 0; i < param.length; ++i)
        			list.addItem({id: i},param[i].name, !param[i].isOff, false);
        
        
        		// Add some buttons
        		let isOk = false;
        		dialog.addButton('确定', { close: true, callback: () => {
        			isOk = true;
        			}});
        		dialog.addButton('取消',{ close: 'fade' });
        
        		vjgui.bind(dialog, "closed", e => {
        			if (isOk) {
        				resolve(param)
        			} else {
        				resolve();
        			}
        		})
        	});
        }
        
        
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