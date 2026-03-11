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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/11deleteMap
        // --Delete map--Delete specified map(s)
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        
        function showUI() {
            vjgui.init();
            let element = vjgui.createElement("div", "sidebar .sidebar", "", "")
            vjgui.add(element)
            let sidebar = new vjgui.Inspector();
            sidebar.addButton("All maps","Select map to delete",{callback: async function(name) {
                    let allmaps = await svc.listMaps("", "*");
                    let res = await showSelectMaps(allmaps);
                    if (!res.version && res.id) {
                        res.mapid = res.id;
                        res.version = "*"; // Map only, no version = delete all versions
                    }
                    if (res && res.mapid && res.version) {
                        let data = await svc.cmdDeleteMap(res.mapid, res.version);
                        message.info(data)
                    }
                }});
        
            sidebar.appendTo("#sidebar");
        }
        
        showUI();
        
        async function showSelectMaps(param) {
            return new Promise((resolve, reject) => {
                let dialog = new vjgui.Dialog( { title:"Select map", close: true, minimize: true, width: 300, height: 400, scroll: true, resizable:true, draggable: true} );
                dialog.show();
                dialog.setPosition( 240,20 );
        
                //tree
                let mytree = { id: "All maps",
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
                dialog.addButton('OK', { close: true, callback: () => {
                    isOk = true;
                }});
                dialog.addButton('Cancel',{ close: 'fade' });
        
                vjgui.bind(dialog, "closed", e => {
                    if (isOk) {
                        resolve(sel)
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