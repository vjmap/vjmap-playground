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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/map/tMapAutoMoveWhenOutScreen
        // --地图自动平移当Marker超时屏幕时--
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        let center = mapExtent.center();
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(),
            center: prj.toLngLat(center),
            zoom: 4,
            renderWorldCopies: false,
            doubleClickZoom: false
        });
        
        map.attach(svc, prj);
        await map.onLoad();
        const mapBounds = map.getGeoBounds(0.4);
        // 移动一个marker至新的位置
        const moveMarkerToPos = (marker, pos) => {
            return new Promise((resolve => {
                // 得到地理坐标
                const co = map.fromLngLat(marker.getLngLat())
                const mapProgressToValues = vjmap.interpolate(
                    [0, 1],
                    [co, pos]
                )
        
                // 确保marker在屏幕上面,offset距离屏幕的边距,小于此边距时，将marker平移至屏幕中间
                const enableMarkerInScreen = (m, offset = 150) => {
                    let pt = map.project(marker.getLngLat()); //得到屏幕坐标
                    let size = map.getCanvasSize(); // 得到当前屏幕像素尺寸
                    if (pt.x < offset || pt.y < offset || pt.x > size[0] - offset || pt.y > size[1] - offset) {
                        if (!map.isMoving() && !map.isZooming()  && !map.isRotating() && !map.isEasing()) {
                            map.flyTo({
                                center: marker.getLngLat()
                            })
                        }
                    }
                }
        
        
                // 如果要相机跟随,请用这个代码
                const followCamera = (m) => {
                    let lnglat = marker.getLngLat();
                    map.easeTo({
                        center: lnglat, // 更新地图中心到对象的最新位置
                        duration: 2000, // 动画持续时间（毫秒）
                        easing: t => t // 使用默认的线性缓动
                    });
                }
        
                // 走路的动画
                vjmap.createAnimation({
                    from: 0,
                    to: 1,
                    duration: 2000,
                    ease: vjmap.linear, //线性
                    onUpdate: latest => {
                        const newPos = mapProgressToValues(latest)
                        marker.setLngLat(map.toLngLat(newPos));
                        let isFollowCamera = false;  // 如果要相机跟随,请改成true
                        if (!isFollowCamera) {
                            enableMarkerInScreen(marker);
                        } else {
                            followCamera(marker)
                        }
                    },
                    onComplete: (e) => {
                        resolve()
                    },
                    onStop: () => resolve()
                })
            }))
        }
        
        
        // 根据步伐在指定的范围内随机生成一个点
        const getRandomPointOnPolygon = (marker, step, polygons) => {
            // 先得到以前走的方位(有点变化)，没有的话，则随机生成一个
            marker.dir = (marker.dir + vjmap.randInt(0, 60)) || vjmap.randInt(0, 360)
            let s = 0;
            // 得到地理坐标
            const co = map.fromLngLat(marker.getLngLat())
            while (s++ < 100) {
                const newX = co.x + step * Math.cos(vjmap.degToRad(marker.dir))
                const newY = co.y + step * Math.sin(vjmap.degToRad(marker.dir))
                const newCo = new vjmap.Point(newX, newY);
                let isInPolygon = false;
                for (let p of polygons) {
                    if (vjmap.isPointInPolygon(newCo, p)) {
                        isInPolygon = true;
                    }
                }
                if (isInPolygon) {
                    return newCo
                }
                // 改变方位
                marker.dir = vjmap.randInt(0, 360)
            }
            return co // 不变
        }
        
        
        // 开始走路,设置走的范围
        const beginWalk = async (marker, step, walkRegions) => {
            if (marker.isWalking) return
            while (!marker.isStopWalk) {
                marker.isWalking = true
                let nextPoint = getRandomPointOnPolygon(marker, step, walkRegions)
                await moveMarkerToPos(marker, nextPoint)
            }
        }
        
        let el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = 'url("../../assets/images/man.png")';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.backgroundSize = '100%';
        
        // Add markers to the map.
        const marker = new vjmap.Marker({
            element: el,
            anchor: 'bottom'
        });
        marker.setLngLat(map.getCenter())
            .addTo(map);
        await beginWalk(marker, mapBounds.width() / 20, [mapBounds.toPointArray().map(p => vjmap.geoPoint(p))])
        
        
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