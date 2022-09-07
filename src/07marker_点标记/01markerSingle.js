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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/marker/01markerSingle
        // --单个点标记--
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
        // 根据地图范围建立几何投影坐标系
        let prj = new vjmap.GeoProjection(res.bounds);
        
        // 地图对象
        let map = new vjmap.Map({
            container: 'map', // DIV容器ID
            style: svc.rasterStyle(), // 样式，这里是栅格样式
            center: prj.toLngLat(prj.getMapExtent().center()), // 设置地图中心点
            zoom: 3, // 设置地图缩放级别
            renderWorldCopies: false // 不显示多屏地图
        });
        
        // 关联服务对象和投影对象
        map.attach(svc, prj);
        // 适应至地图范围大小
        map.fitMapBounds();
        const mapBounds = map.getGeoBounds(0.6);
        // marker
        let marker = null;
        let marker2 = null;
        let markerZoom = null;
        let position = mapBounds.randomPoint();
        let latLng = map.toLngLat(position); // 地理坐标转经纬度
        //map.setCenter(latLng)
        // 添加marker
        function addMarker(e) {
            removeMarker();
            // 默认marker
            marker = new vjmap.Marker();
            // 格式为: new vjmap.Marker().setLngLat( map.toLngLat([cad的x坐标，cad的y坐标)).addTo(map);
            marker.setLngLat(latLng).addTo(map);
        
        
            // 红色marker,旋转45度
            marker2 = new vjmap.Marker({ color: 'red', rotation: 45 });
            marker2.setLngLat(map.toLngLat(mapBounds.randomPoint()))
            marker2.addTo(map);
        
            markerZoom = new vjmap.Marker({ color: '#ff0'});
            markerZoom.setLngLat(map.toLngLat(mapBounds.randomPoint()))
            // 设置能缩放的最大级别。如果小于这个级别，div将根据缩小级别自动缩小比例，当小于3级时，大小将自动缩放，大于3级时，将保持原样
            markerZoom.setScaleMaxZoom(3);
            markerZoom.setMinZoom(1); // 小于1级别将不可见
            markerZoom.setMaxZoom(8); // 大于8级时将不可见
            markerZoom.addTo(map);
        }
        // 删除marker
        function removeMarker() {
            marker && marker.remove();
            marker = null;
            marker2 && marker2.remove();
            marker2 = null;
            markerZoom && markerZoom.remove();
            markerZoom = null;
        }
        // 自定义点标记icon
        function customMarker() {
            removeMarker()
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage =
                'url("../../assets/images/nilt.png")';
            el.style.width = '42px';
            el.style.height = '68px';
            el.style.backgroundSize = '100%';
        
            el.addEventListener('click', function (e) {
                message.info("you click a marker");
            });
        
            // Add markers to the map.
            new vjmap.Marker({
                element: el,
                anchor: 'bottom',
                draggable: true
            }).setLngLat(map.toLngLat(mapBounds.randomPoint()))
                .addTo(map);
        }
        // 自定义点标记内容
        function customMarkerContent() {
            marker && marker.remove();
            marker = null;
            marker = new vjmap.Marker();
            marker.setLngLat(latLng).addTo(map);
            let popup = new vjmap.Popup();
            popup.setHTML("<div class='marker-demo'><h3>唯杰地图</h3><p>CAD图WebGIS可视化开发提供的一站式解决方案</p><p>https://www.vjmap.com</p></div>")
            marker.setPopup(popup);
            marker.togglePopup(); // toggle popup open or closed
        }
        
        const createLeaderMarker = (lnglat, content) => {
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.position = 'absolute'
        
            let img = document.createElement("div");
            img.style.backgroundImage =
                'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4AAAAAlCAYAAACj1PQVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTJFMTU1RjExN0UzMTFFOTg3RTBFODdGNTY0NThGQkUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MTJFMTU1RjIxN0UzMTFFOTg3RTBFODdGNTY0NThGQkUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxMkUxNTVFRjE3RTMxMUU5ODdFMEU4N0Y1NjQ1OEZCRSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxMkUxNTVGMDE3RTMxMUU5ODdFMEU4N0Y1NjQ1OEZCRSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pj97JFoAAAV9SURBVHja7N1faJ1nHQfw33nzpuekaZfWNFmbLHXWdf7DWgvebF4M0SEZhTG8mKvFyzG9UJFKh9peVGnd0DkE/10Ic6s6BBEGbshggho3BVGnRnC2s1n/ras2J2uzc05PXp+3yZzSm7XJkvfi84HveZ9z3ve8F7/bL8/71oqiiMs8NhCLsCllfcpfAwAAAAAAAIDlsXM68jfgtl9K2Z3Sa8IAAAAAAAAAb7hjKW8uF9kS3/jdKR9PaZkxAAAAAAAAwPJa6h3A96X0pBxK+bLxAgAAAAAAACyfpSyAP5jy4ZQXUh747687p00ZAAAAAAAAYBlkS3if+xfW+1MuGC0AAAAAAADA8lqqAnh3yvaUZ1MeMlYAAAAAAACA5bcUBXBfyoGF9edSusYKAAAAAAAAsPyWogD+VMpYypMpTxgpAAAAAAAAwMpYbAG8IWVvylzKHuMEAAAAAAAAWDmLLYC/mDKQ8nDKH4wTAAAAAAAAYOUspgC+IeWelNmYL4IBAAAAAAAAWEGLKYAPpfSmfD1lyigBAAAAAAAAVtbVFsA3pdyR8lLMF8EAAAAAAAAArLCrKYBrKfcvHA+kNI0RAAAAAAAAYOVdTQFc7vwtdwA/l/ItIwQAAAAAAACohistgMt3/h5cWO9N6RghAAAAAAAAQDVcaQF8d8rWlImUnxgfAAAAAAAAQHVcSQF8Tcq+lCJlz8IRAAAAAAAAgIq4kgK4fOTzUMzv/J0wOgAAAAAAAIBqeb0F8FjKp2P+nb97jQ0AAAAAAACgel5vAXwgpS/l2ynPGRsAAAAAAABA9eSjd370sh+P7/q/r9tTdqc0Y74IBgAAAAAAAKCC8v9Zl7uB6yn9o4fHG+lYS2n/867Hv5bXivLcoZQzRgYAAAAAAABQTfnw5nvjxWMHe9N6cP+OyVtv2nj2ruFG6209WbGqM5c181rx9m5RO/ngn2/4zlf/tLV2fNfPCmMDAAAAAAAAqJ68LH+HGq2xRz7wu2+8a31zvCgiLs5FlC3vqp4YKS8638mzqZf7tqXlb1MuGBsAAAAAAABA9ZSPdh58tfyd7UScOh9xYjqLszNZlGVwN6U/71z7hR1/e/g9g9NbRg+P9xobAAAAAAAAQPVk+3ZMfujV8vf0TC3WXWzE9ZveHyNjt0UxOxCnp7NotiPWr2pfl67dk/6zxtgAAAAAAAAAqie7eePZXeVO33OtiOGsHqtvfjDi1scibnkkesafipHVI3HuQi3a3Yh3rpsZT/+5ZvTweM3oAAAAAAAAAKolH2q0byzf+dtuZ9G/8b0RW+587ezat0a84xPR+8z+aHU7MVDvbLhl05lrf3FyaGr08Hj5muA4/qMfmiIAAAAAAABABWS1KPJLTW75UR+8/Ir6uksvCi6K+a/Dfa26sQEAAAAAAABUT/ZyJz+Z19IiL6J7eiLi/NRrZ4tuxNEfRzvmorcnoj2XvfL41MZTMV8XAwAAAAAAAFAh2eS5tU9kWcRAo4ipC9MRP98ZMfnNiH/8IOLJO+LMC7+ORl83Gj0RR5r9z8x08nOhAAYAAAAAAAConPyzT2976H1D//7YYL21ZW5NN442n4/ep/ddeuxzK+air68bb2pEdCN75dEj192Xfp4xNgAAAAAAAIDqyWY6+akHnt16d7Oz6uRAPWJkoIi1azuxek0nhge6MdQXUatlrZ8+P/L5706+ZSLKXhgAAAAAAACAyik3+s5+/++bJ+751fbbfv/S+kc7c/l0WQSva0TUe2rtIzNrJr7yxxs/8pnfbPteurY5vPlej38GAAAAAAAAqKC8LHRfPHZw9penNvwl5ZP1nrmB268/MdafX+x96sTQ8aMz/f9K102ntJS/AAAAAAAAANX1HwEGAM75MhcANnAkAAAAAElFTkSuQmCC")';
            img.style.backgroundRepeat = "no-repeat"
            img.style.height = '37px';
            img.style.width = '100px';
            img.style.position = 'absolute';
            img.style.left = '-3px';
            img.style.bottom = '-3px';
            img.style.right = "0px"
            el.appendChild(img);
        
            let panel = document.createElement("div");
            panel.style.height = '50px';
            panel.style.width = '200px';
            panel.style.position = 'absolute';
            panel.style.left = '97px';
            panel.style.top = '-60px';
            panel.style.border = "solid 1px #8E0EFF";
            panel.style.background = 'linear-gradient(#00ffff, #00ffff) left top,  linear-gradient(#00ffff, #00ffff) left top,     linear-gradient(#00ffff, #00ffff) right bottom,    linear-gradient(#00ffff, #00ffff) right bottom';
            panel.style.backgroundRepeat = 'no-repeat';
            panel.style.backgroundColor ='rgba(87,255,255, 0.3)'
            panel.style.backgroundSize = '1px 6px, 6px 1px';
            panel.style.fontSize = '18px';
            panel.style.color = '#ffffff';
            panel.innerHTML =  `<div style='margin: 15px'>${content}</div>`;
            el.appendChild(panel);
        
            // Add markers to the map.
            let marker = new vjmap.Marker({
                element: el,
                anchor: "bottom-left"
            })
            marker.setLngLat(lnglat)
                .addTo(map);
            return marker
        }
        
        const leaderMarker = ()=> {
            let position = mapBounds.randomPoint();
            let latLng = map.toLngLat(position); // 地理坐标转经纬度
            createLeaderMarker(latLng, "欢迎使用唯杰地图！")
        }
        
        const zoomMarker = ()=> {
        
        }
        // UI界面
        const App = () => {
            return (
                <div className="input-card">
                    <h4>添加、删除、自定义点标记</h4>
                    <div className="input-item">
                        <button className="btn" onClick={addMarker}>添加点标记</button>
                        <button className="btn" onClick={removeMarker}>删除点标记</button>
                    </div>
                    <div className="input-item">
                        <button className="btn" onClick={customMarker}>自定义点标记</button>
                        <button className="btn" onClick={customMarkerContent}>自定义点标记内容</button>
                        <button className="btn" onClick={leaderMarker}>引线标记</button>
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