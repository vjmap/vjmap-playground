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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05yfrommap
        // --在现有图形上修改或新增删除[先预览再生成DWG]--基于现在的图形，在上面进行修改或新增删除，先预览再生成DWG
        const createDwgDoc = () => {
        	let doc = new vjmap.DbDocument();
        
        	// 数据来源
        	doc.from = "symbolsbase/v1";
        	// 把来源图的数据最后都清空，都用于模板
        	doc.isClearFromDb = true;
        	// 可通过表达式要过滤要显示的实体
        	doc.pickExpr = "gOutReturn := if((gInFeatureType == 'AcDbPolyline'), 1, 0);"
        	let entitys = [];
        
        	// 克隆一个填充，修改下颜色
        	let hatch = new vjmap.DbHatch();
        	hatch.cloneObjectId = "426"
        	hatch.color = 0x00FF00;
        	entitys.push(hatch)
        
        	// 克隆一个有线型的直线，修改下坐标
        	let line = {
        		cloneObjectId: "40D",
        		points: [
        			[ 587621282.9992019, 3103825727.070341],
        			[ 587624787.2905588,3103825630.4953823]
        		]
        	}
        	entitys.push(line)
        
        	// 克隆一个有线型的直线，修改下坐标
        	let line2 = {
        		cloneObjectId: "40D",
        		points: [
        			[ 587621476.1491191, 3103823478.2534466],
        			[ 587625270.1653521, 3103823354.085643]
        		]
        	}
        	entitys.push(line2)
        
        	// 克隆一个有线型的曲线，修改下坐标
        	let curve = {
        		cloneObjectId: "40E",
        		fitPoints: [
        			[587626704.9933093,	3103822140.000448],
        			[587629077.9780077,	3103823147.1393027],
        			[587631395.7770153,	3103822222.778984],
        			[587633327.2761885,	3103823409.271333]
        		]
        	}
        	entitys.push(curve);
        
        	// 新增一条
        	let newLine = new vjmap.DbLine({
        		start: [ 587614797.4495885,
        			3103826738.684679],
        		end: [587619532.0491413,
        			3103826678.753039]
        	});
        	entitys.push(newLine);
        	doc.entitys = entitys;
        	return doc;
        }
        
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        // 先得设置一个要图形的所有范围，这个范围是随便都没有有关系的。最后导出dwg时，会根据实体的所有坐标去自动计算真实的范围。
        let mapBounds = '[-10000,-10000,10000,10000]'
        let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
        mapExtent = mapExtent.square(); // 要转成正方形
        
        svc.setCurrentMapParam({
        	darkMode: true, // 由于没有打开过图，所以主动设置黑色模式
        	bounds: mapExtent.toString()
        })
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
        	container: 'map', // container ID
        	style: {
        		version: svc.styleVersion(),
        		glyphs: svc.glyphsUrl(),
        		sources: {},
        		layers: []
        	},// 矢量瓦片样式
        	center: [0,0], // 中心点
        	zoom: 2,
        	renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        
        // 创建一个几何对象
        const createGeomData = async (map, doc) => {
        	let svc = map.getService();
        	let res = await svc.cmdCreateEntitiesGeomData({
        		filedoc: JSON.stringify(doc)
        	});
        	if (res.metadata && res.metadata.mapBounds) {
        		// 如果返回的元数据里面有当前地图的范围，则更新当前地图的坐标范围
        		map.updateMapExtent(res.metadata.mapBounds);
        	}
        	const features = [];
        	if (res && res.result && res.result.length > 0) {
        		for (let ent of res.result) {
        			if (ent.geom && ent.geom.geometries) {
        				let clr = map.entColorToHtmlColor(ent.color); // 实体颜色转html颜色
        				for (let g = 0; g < ent.geom.geometries.length; g++) {
        					let featureAttr = {};
        					// 因为要组合成一个组合实体，所以线和多边形的颜色得区分
        					if (ent.isPolygon) {
        						featureAttr.color = clr; // 填充色，只对多边形有效
        						featureAttr.noneOutline = true; // 不显示多边形边框，只对多边形有效
        					} else {
        						featureAttr.color = clr; // 颜色
        						featureAttr.line_width = ent.lineWidth; // 线宽
        					}
        					features.push({
        						id: vjmap.RandomID(10),
        						type: "Feature",
        						properties: {
        							objectid: ent.objectid + "_" + g,
        							opacity: ent.alpha / 255,
        							...featureAttr,
        						},
        						geometry: ent.geom.geometries[g],
        					});
        				}
        			}
        		}
        	}
        	return {
        		type: "FeatureCollection",
        		features: features,
        	};
        };
        
        const doc = await createDwgDoc();
        const createMap = async () => {
        	let geojson = await createGeomData(map, doc);
        	const opts = vjmap.Draw.defaultOptions();
        	// 修改默认样式，把点的半径改成1，没有边框，默认为5
        	let pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-point-stroke-inactive");
        	if (pointIdx >= 0) {
        		opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 0
        	}
        	pointIdx = opts.styles.findIndex(s => s.id === "gl-draw-point-inactive");
        	if (pointIdx >= 0) {
        		opts.styles[pointIdx]['paint']['circle-radius'][3][3] = 1
        	}
        	map.getDrawLayer(opts).set(geojson);
        }
        await createMap();
        
        const exportDwgOpen = async () => {
        	const mapid = 'exportdwgmap';
        	let res = await svc.updateMap({
        		mapid: mapid,
        		filedoc: JSON.stringify(doc),
        		mapopenway: vjmap.MapOpenWay.Memory,
        		style: {
        			backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
        		}
        	})
        	if (res.error) {
        		message.error(res.error)
        	} else{
        		window.open(`https://vjmap.com/app/cloud/#/map/${res.mapid}?version=${res.version}&mapopenway=Memory&vector=false`)
        	}
        }
        
        // UI界面
        const App = () => {
        	return (
        		<div>
        			<div className="info w260">
        				<h4>操作：</h4>
        				<div className="input-item">
        					<button id="clear-map-btn" className="btn btn-full mr0" onClick={exportDwgOpen}>导出成DWG图并打开</button>
        				</div>
        
        			</div>
        		</div>
        	);
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
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