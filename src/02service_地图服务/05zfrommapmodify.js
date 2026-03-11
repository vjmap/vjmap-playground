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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/05zfrommapmodify
        // --在原有数据上修改或新增删除[改变原图]--通过之前创建的数据，获取原来的数据，对原来的数据进行修改。
        // 注：此示例只适用于后台修改原图的情况，如果只前端显示修改，可用draw对象绘制，无需更改原图，效率还快。
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        let mapid = "basketballCourt";
        let version = ""; // 最新版本
        // 打开地图
        let res = await svc.openMap({
        	mapid: mapid, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
        	mapopenway: version, // 以几何数据渲染方式打开
        	style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
        	message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
        	container: 'map', // container ID
        	style: svc.rasterStyle(), // 栅格瓦片样式
        	center: prj.toLngLat(mapExtent.center()), // 中心点
        	zoom: 2,
        	renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        // 使地图全部可见
        map.fitMapBounds();
        await map.onLoad();
        
        // isModify false 创建三条线段;  true 修改三条线段
        const createDoc = async (isModify) => {
        	let version = svc.currentMapParam().version; // 当前打开的最新版本
        	let curDrawLayerName = 'mynewlayer' ; // 当前绘制的实体在哪个图层上面
        	// 先查询图中是否有之前绘制过的的三条线段
        	// 查询条件为图层和实体类型，再通过扩展数据xdata来确实是哪一条
        	let query = await svc.exprQueryFeature({
        		// 先表达式查询所有的块实体，因为如何用条件查询的话，块已经转为了离散的空间数据，不能整体查了，所以先通过表达式查询出块信息
        		/// 以下是查所有块。如果要查询某个具体的块名可以这样写  expr: `gOutReturn := if((gInFeatureType == 'AcDbBlockReference' and gInAttrs4 == '您要查询的块名称'), 1, 0);`,
        		expr: `gOutReturn := if((gInFeatureType == 'AcDbPolyline' and gInLayerName == '${curDrawLayerName}'), 1, 0);`,
        		fields: "", // 为空的话，表达所有字段
        		geom: false, // 内存模式
        		useCache: true,
        		limit: 1000000 // 数量大些，相当于查找所有的
        	})
        	if (query.error) {
        		message.error(query.error)
        		return
        	}
        
        	let lineObjectIds = new Map(); // 第几条线在原来图中的object映射关系
        	if (query.result) {
        		for(let i = 0; i < query.result.length; i++) {
        			let item = query.result[i];
        			let objectid = item.objectid; // 获取实体的objectid 唯一
        			let xdata = item.xdata; // 获取实体的扩展数据
        			if (xdata != "") xdata = JSON.parse(xdata);
        			if (xdata && xdata["1000"]) xdata = JSON.parse(xdata["1000"]);
        			if (xdata && xdata.lineIndex !== undefined) {
        				// 如果有扩展数据里面的线索引
        				lineObjectIds.set(xdata.lineIndex, objectid); // 索引和id记录下关系
        			}
        		}
        	}
        
        	let doc = new vjmap.DbDocument();
        	// 数据来源
        	doc.from = `${mapid}/${version}`;
        
        	let lineCount = 3;// 总共几条线
        
        	// 在cad图新增图层
        	let cadLayer1 = new vjmap.DbLayer();
        	cadLayer1.name = curDrawLayerName;
        	cadLayer1.color = 7;
        	doc.layers = doc.layers || [];
        	doc.layers.push(cadLayer1);
        
        	let entities = []
        	if (!isModify) {
        		// 如果是创建
        		for(let n = 0; n < lineCount; n++) {
        			if (lineObjectIds.has(n)) continue; // 如果之前有了,不创建了
        			// 线的扩展数据，把线的索引存入
        			let extData = {
        				lineIndex: n
        			}
        			entities.push(new vjmap.DbPolyline({
        				points: mapExtent.randomPoints(2, 4).map(p => [p.x, p.y]), // 随机生成几个点
        				colorIndex: n + 1,
        				layer: curDrawLayerName, // 把创建的实体放置至此图层上
        				xdata: { key: JSON.stringify(extData, null, 0)} // 创建扩展数据后，查询时返回 {"1000":"{\"a\":1,\"b\":\"text\"}","1001":"key"} "1000"是固定的。表示是值; "1001"是固定的。表示是键
        			}))
        		}
        	} else {
        		// 如果是修改
        		for(let n = 0; n < lineCount; n++) {
        			if (!lineObjectIds.has(n)) continue; // 如果之前没有
        			let objectid = lineObjectIds.get(n); // 有了objectid表示就是对这个实体进行修改了
        			let isDelete = vjmap.randInt(0, 3) == 0; // 测试数据，看是修改坐标还是删除实体
        			if (isDelete) {
        				entities.push(new vjmap.DbPolyline({
        					objectid: objectid,
        					delete: true // 表示删除
        				}))
        			}
        			else {
        				entities.push(new vjmap.DbPolyline({
        					objectid: objectid,
        					points: mapExtent.randomPoints().map(p => [p.x, p.y]), // 随机生成几个点修改坐标
        				}))
        			}
        		}
        	}
        	doc.entitys = entities
        	// 创建完缩放至全图
        	doc.isZoomExtents = true;
        	return doc;
        }
        
        
        
        
        
        // 清空之前的地图数据
        const clearMapData = () => {
        	svc.setCurrentMapParam({
        		darkMode: true, // 由于没有打开过图，所以主动设置黑色模式
        		bounds: mapExtent.toString()
        	})
        	map.disableLayerClickHighlight();
        	map.removeDrawLayer();
        	let sources = map.getStyle().sources;
        	for(let source in sources) {
        		map.removeSourceEx(source);
        	}
        }
        
        
        // 创建一个dwg的地图
        const createDwgMap = async (doc) => {
        	if (doc.entitys && doc.entitys.length == 0) return;
        	// 先清空之前绘制的
        	clearMapData();
        	// js代码
        	let res = await svc.updateMap({
        		mapid: mapid,
        		filedoc:JSON.stringify(doc),
        		mapopenway: vjmap.MapOpenWay.Memory,
        		style: {
        			backcolor: 0 // 如果div背景色是浅色，则设置为oxFFFFFF
        		}
        	})
        	if (res.error) {
        		message.error(res.error)
        	}
        	await map.switchMap(res);
        }
        
        const createLines = async () => {
        	let doc = await createDoc(false);
        	await createDwgMap(doc)
        }
        
        const modifyLines = async () => {
        	let doc = await createDoc(true);
        	await createDwgMap(doc)
        }
        
        // UI界面
        const App = () => {
        	return (
        		<div>
        			<div className="info" style={{width: '430px'}}>
        				<div className="input-item">
        					<button className="btn btn-full mr0" onClick={createLines}>创建三条线段</button>
        					<button className="btn btn-full mr0" onClick={modifyLines}>修改三条线段</button>
        				</div>
        			</div>
        		</div>
        	);
        }
        ReactDOM.render(<App />, document.getElementById('ui'));
        
        
        const mousePositionControl = new vjmap.MousePositionControl();
        map.addControl(mousePositionControl, "bottom-left");
        
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