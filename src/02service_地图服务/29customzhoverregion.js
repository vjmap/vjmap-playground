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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/29customzhoverregion
        // --自定义高亮区域--可以根据自己的需要圈划相关区域并高亮响应事件
        // js代码
        // 新建地图服务对象，传入服务地址和token
        // 地图服务对象
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            // 如果打开出错
            message.error(res.error)
        }
        // 获取地图范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(mapExtent.center()), // 设置地图中心点
            zoom: 2, // 设置地图缩放级别
            pitch: 0, // 倾斜角度
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 根据地图本身范围缩放地图至全图显示
        //map.fitMapBounds();
        await map.onLoad();
        // 具体文档查看 https://vjmap.com/guide/draw.html
        // 更复杂的示例请参考 https://vjmap.com/demo/#/demo/map/draw/02drawCustomToolbar
        const opts = vjmap.Draw.defaultOptions();
        opts.isActionDrawMode = true; // 按钮都隐藏，界面用自己的
        
        const draw = new vjmap.Draw.Tool(opts);
        map.addControl(draw, 'top-right');
        
        // 切换为编辑模式
        const switchEditMode = () => {
            draw.changeMode("simple_select");
        }
        
        // 切换为浏览模式
        const switchBrowerMode = () => {
            draw.changeMode('static');
        }
        
        // 绘制高亮区域
        const drawPolygon = ()=> {
            draw.changeMode("draw_polygon");
        }
        
        // 删除区域
        const deletePolygon = ()=> {
            draw.trash();
        }
        
        // 保存数据
        const saveData = async ()=> {
            let entsJson = draw.getAll();
            // 转成地理坐标
            entsJson = map.fromLngLat(entsJson);
        
            let svc = map.getService();
            let curParam = svc.currentMapParam() || {};
            // 用地图的mapid和版本号做为key值，把数据保存起来，这里演示只是做数据保存到了唯台后台,实际中请保存至自己的后台数据库中
            let key = `map_drawdata_${curParam.mapid}_${curParam.version}`;
            await svc.saveCustomData(key, entsJson);
            message.info('保存成功')
        }
        
        // 加载数据
        const loadData = async ()=> {
            try {
                let svc = map.getService();
                // 用地图的mapid和版本号做为key值, 这里演示只是从localStorage去加载,实际中请从后台去请求数据加载
                let curParam = svc.currentMapParam() || {};
                let key = `map_drawdata_${curParam.mapid}_${curParam.version}`;
                let res = await svc.getCustomData(key);
                if (res.data) {
                    draw.set(map.toLngLat(res.data));
                    message.info("加载数据成功")
                }
            } catch (e) {
                console.error(e)
            }
        
        }
        
        
        // 创建完后修改颜色，让用户输入内容
        map.on("draw.create", function (e) {
        
            for (let i = 0; i < e.features.length; i++) {
                let id = e.features[i].id;
                if (!draw.get(id)) continue;
                draw.setFeatureProperty(id, "hoverPointer", true); // 允许浏览模式下高亮，响应事件
        
                // 在这里可以弹出一个输入框，设置一些自定义的属性，以后查询时能查到相关信息
                // 这里弹出一个框让输入名称信息
                let text = prompt("请输入属性内容：");
                draw.setFeatureProperty(id, "content", text);
        
                let color = vjmap.randomColor();
                draw.setFeatureProperty(id, "color", color); // 颜色
                draw.setFeatureProperty(id, "hover_color", vjmap.randomColor());  // 高亮颜色
                draw.setFeatureProperty(id, "hover_opacity", 0.8); // 高亮时的透明度
            }
        });
        
        const popup = new vjmap.Popup({
            closeButton: false
        });
        // 浏览模式下，鼠标悬浮时，显示信息提示内容
        map.on("draw.static.mouseenter", e => {
            if (e.event.featureTarget) {
                popup.setLngLat(e.event.lngLat);
                popup.setHTML(JSON.stringify(e.event.featureTarget.properties, null, 4));
                popup.addTo(map);
            }
        });
        
        map.on("draw.static.mouseleave", e => {
            if (popup) popup.remove();
        });
        
        map.on("draw.static.click", e => {
            if (e.event.featureTarget) {
                message.info(`您点击了id为：${e.event.featureTarget.properties.id} 的实体， 内容为： ${e.event.featureTarget.properties.content} `)
            }
        });
        
        
        // 先加载数据，切换至浏览模式
        await loadData();
        switchBrowerMode();
        
        // UI界面
        const App = () => {
            return (
                <div>
                    <div className="info" style={{width: "120px", right: "10px"}}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => switchEditMode()}>切换为编辑模式
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => switchBrowerMode()}>切换为浏览模式
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => drawPolygon()}>绘制高亮区域
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => deletePolygon()}>删除区域
                            </button>
                        </div>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => saveData()}>保存数据
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        ReactDOM.render(<App/>, document.getElementById('ui'));
        
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