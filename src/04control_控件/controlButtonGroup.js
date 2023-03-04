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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/control/controlButtonGroup
        // --按钮组控件--
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
        
        
        const mapBounds = map.getGeoBounds(0.6);
        let options = {};
        options.buttons = [
            {
                id: "zoomFit",
                title: "全图显示",
                style: {
                    "background-image": `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAALNJREFUWEftltENgCAMRGEwJtBRdAZ1Bh1FJ2AwTIwkBqw56EcxKd+lHK9Ne9YIHyv8vlEBGQE/HBNVFrd1C1Kykhy5gHEPpIC1h0rmC3LQAoKdUyEsAjZc+VzyCVJAGoig/4qJVH4g4G5CFDdKJjZmmhdqKvSRmjgVoASUgBJQAu0RoJZGzZx/3oGXEbW32QJul/QDPxD9nLQle0OO2jSeKZW25dxmK73f3hwo/QE3XpzACTqIZiEG/iYrAAAAAElFTkSuQmCC')`,
                    "background-size": "80% 80%"
                },
                onActivate: (ctx) => {
                    map.fitMapBounds();
                }
            },
            {
                id: "zoomFit",
                title: "允许地图右键旋转",
                style: {
                    "background-image": `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAllJREFUWEfFl1FOwzAMhu1wAcR4ZwwOwk4CuwWqkMYkVLgF4ySUe8Ao7xRxgDVB7prKCW6Sdkj0sW3qL/bv3ynCP1/4z/FhNMDx+c0Fh99ut+V3+VAO3dAggMlZdgUGlgAwFQMZUxjEQmv9lAqTBBANLG97XWu9ioEEAQ6n19MDpd6F768NQIkIH/TMGDhBYy4AkTLDs1OiUovP17uirzQOAAW0xELwEhBW1Vu+DtVZzBbCom9dB0CiMnW9rI1ZUABv5+tqkzf3U6/JLHsEgCv7fq31qVQOJwOTWUbpdgRmAG6/NvkqNTB/72iWLRHgtr1X1lrPfQgfwKEGY4rq/X4+JrhdwyGkzbgAuzYjCH4lqTmoC5ZZvxQOQKMDrZ99AFTqKaTkWIZCWfjVhq0OCkB4iSk+Fpg/7/TllTXJiKRA1KZKqUsEmKYYDu8KXoZRAJJHxAznTwH8Hm/cMNKurUE1Akel5lZTozLg9betUNCs+Jq9AaQZwT8qaWYQALVjrO1aiCUNpZTxy8tWbfIu804JWkryb1K26N1DWs9rQ2Mtudrkp/aZBLDz7sAEGwrBBeiL9dc4PlCKnJAGkjg8hgan9yezzO4eePp3+/Su2PAYCsBrHx1G9uN8LMf6OwTkj2Nee1ED9mY7lMg0mrMBQaQo3ROdM9r72rTXiHhHWPXSkayudRE6aEpHspBHBJ3Qz0S3w/b47RxKd9nqjmAWOjYjkqy4FRL9iMj/A7IQks6RSQD0fTZ+G6PqFR/CIlYmvjYZwA/If83G/paJPjC0z/d9f3QG9g1s1/8ATi1yMPW6z1YAAAAASUVORK5CYII=')`,
                    "background-size": "80% 80%"
                },
                isCheckbox: true,
                checked: true,
                onActivate: (ctx, e) => {
                    e.target.checked ? map.dragRotate.enable() : map.dragRotate.disable();
                }
            },
            {
                id: "pos",
                title: "定位到一个位置",
                text: "定位",
                onActivate: (ctx, e) => {
                    map.flyTo({
                        center: [10, 20],
                        pitch: 30,
                        zoom: 6,
                        speed: 0.2,
                        easing(t) {
                            return t;
                        }
                    });;
                }
            }
        ];
        
        let btnGroupCtrl = new vjmap.ButtonGroupControl(options);
        map.addControl(btnGroupCtrl, 'top-right');
        
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