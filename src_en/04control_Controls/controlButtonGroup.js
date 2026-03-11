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
        // --Button group control--
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
// Open map
let res = await svc.openMap({
    mapid: env.exampleMapId, // map ID
    mapopenway: vjmap.MapOpenWay.GeomRender, // open with geometry render
    style: vjmap.openMapDarkStyle() // use dark style when div has dark background
})
if (res.error) {
    // If open failed
    message.error(res.error)
}
// Get map bounds
let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
// Create geo projection from map bounds
let prj = new vjmap.GeoProjection(mapExtent);

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterStyle(), // style, raster style here
    center: prj.toLngLat(mapExtent.center()), // set map center
    zoom: 2, // set map zoom level
    pitch: 0, // pitch angle
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();


const mapBounds = map.getGeoBounds(0.6);
let options = {};
options.buttons = [
    {
        id: "zoomFit",
        title: "Show full extent",
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
        title: "Allow map right-click rotation",
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
        title: "Fly to a location",
        text: "Locate",
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