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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/08openMapNeedPassword
        // --打开有密码保护的图--需要输入密码或AccessKey才能访问有密码保护的图
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
        // 如果有此图的密码，可以在打开之前进行设置，这样就不会弹出密码输入框了
        // secretKey权限上图的最多权限，不要轻易把secretKey暴露
        // let secretKey = 'xxxxxxx'; // xxxxxxx的值可以通过在控制台输出 svc.pwdToSecretKey("your password"); 的值复制过来。这样就不会在代码中暴露密码明文了
        //svc.addSecretKey(secretKey);
        
        // 或者如果有此图的accessKey，可以在打开之前进行设置，这样就不会弹出密码输入框了，
        // accessKey可以访问图形，但权限比较小，不能删除图形等。可以把accessKey发给需要访问此图的人
        //svc.addAccessKey("akxxxxxxxxxxxxxxxx")
        
        // 打开地图
        let res = await svc.openMap({
            mapid: "sys_zp", // 请改成有密码保护的图id,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle(), // div为深色背景颜色时，这里也传深色背景样式
            // 如果密码输入回调不传的话，则用默认的prompt弹框为输入密码
            cbInputPassword: async (param) => {
                if (param.tryPasswordCount > 3) return '';// 如果密码重试次数超过三次
                // 如果是有密码保护的图，在这里自定义密码输入框,可能用自己的UI库。这里用了vjgui只是做了一个示例说明
                return new Promise((resolve) => {
                    vjgui.init();
                    vjgui.prompt(`<span style="color: whitesmoke;">请输入密码或AccessKey</span>`, e=>{
                        resolve(e)
                    }, {
                        value: "",
                        title: `图 ${param.mapid}`,
                        width: "200px",
                        height: "150px"
                    })
                })
        
            }
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