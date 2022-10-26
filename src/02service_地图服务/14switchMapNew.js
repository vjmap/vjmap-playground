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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/14switchMapNew
        // --切换图形[地图对象改变]--通过图形id切换不同的图形，切换后地图对象map和所关联的容器将重新创建，发生变化
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        
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
        
        let curMapId;
        const switchMap = async mapid => {
            if (curMapId == mapid) return; // 如果一样，不用管了
            await openNewMap(mapid);
            curMapId = mapid;
        }
        await switchMap("sys_zp");
        
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>图形切换</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => switchMap('sys_zp') }>打开图sys_zp</button>
                        <button className="btn" onClick={ () => switchMap('sys_world') }>打开图sys_world</button>
                        <button className="btn" onClick={ () => switchMap('sys_cad2000') }>打开图sys_cad2000</button>
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