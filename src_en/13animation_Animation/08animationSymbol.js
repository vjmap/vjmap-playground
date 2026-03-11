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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/animation/08animationSymbol
        // --Point symbol walking animation [load image]--
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
    renderWorldCopies: false, // do not show multi-world copies
    doubleClickZoom: false
});

// Attach service and projection
map.attach(svc, prj);
// Fit map to full extent
//map.fitMapBounds();
await map.onLoad();


map.setRasterOpacity(svc.rasterLayerId(), 0.3);
let mapBounds = map.getGeoBounds(0.4);
let geoDatas = mapBounds.randomGeoJsonPointCollection(50, 1, 1, (index)=> {
    return {
        id: index,
        name: `Name:${index}`
    }
})

const loadUrlImage = (src) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            resolve(image)
        }
        image.onerror = ()=> {
            reject(`load image ${src} error`)
        }
    })
}
let img = await loadUrlImage(env.assetsPath + "images/walk.png");

// Create animation image set from sprite sheet
let animateImages = vjmap.createAnimateImages({
    fromImage: img, // Source image
    spriteWidth: 146, // Sprite width per frame (292/2=146)
    spriteHeight: 345,// Sprite height per frame (690/2=345)
    canvasWidth: 40, // Scale each frame to this width
    canvasHeight: 95 // Proportional scale 345 * 40 / 146
});
let animateSymbol = vjmap.createAnimateSymbolLayer(map, map.toLngLat(geoDatas), {
    animateImages,
    iconAllowOverlap: true,
    iconAnchor: "bottom",
    iconOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.6, 1.0],
    isHoverPointer: true,
    isHoverFeatureState: true,
    speed: 1,
});
animateSymbol.symbol.clickLayer(e => message.info(`You clicked item ${e.features[0].id}, name: ${e.features[0].properties.name}`))
animateSymbol.symbol.hoverPopup(f => `<h3>ID: ${f.properties.name}`, { anchor: 'bottom' });

let speed = 1.0;
let isWalking = false;
const changeAnimateSymbol = (action) => {
    if (!animateSymbol) return;
    if (action === "stopAnimation") {
        // Stop animation
        animateSymbol.stopAnimation();
    } else if (action === "startAnimation") {
        // Start animation
        animateSymbol.startAnimation();
    } else if (action === "setSpeedFaster") {
        // Speed up
        speed *= 2;
        animateSymbol.setSpeed(speed);
    } else if (action === "setSpeedSlower") {
        // Slow down
        speed /= 2;
        animateSymbol.setSpeed(speed);
    }
    else if (action === "setData") {
        if (isWalking) return;
        isWalking = true;
        animateSymbol.startAnimation();
        // Update coordinates
        let oldDatas= vjmap.cloneDeep(map.fromLngLat(map.getSourceData(animateSymbol.sourceId)));
        let interpolateList = []
        for(let i = 0; i < oldDatas.features.length; i++) {
            let co = oldDatas.features[i].geometry.coordinates;
            // New coordinates, random walk pixels
            let moveX =  map.pixelToGeoLength(vjmap.randInt(50, 200), map.getZoom()) ;
            let moveY =  map.pixelToGeoLength(vjmap.randInt(50, 200), map.getZoom())  ;
            let newCo = [co[0] + moveX, co[1] ];
            let mapProgressToValues = vjmap.interpolate(
                [0, 1],
                [co, newCo]
            )
            interpolateList.push(mapProgressToValues)
        }
        // Walking animation
        vjmap.createAnimation({
            from: 0,
            to: 1,
            duration: 5000,
            ease:vjmap.linear, // Linear
            onUpdate: latest => {
                for(let i = 0; i < oldDatas.features.length; i++) {
                    oldDatas.features[i].geometry.coordinates = interpolateList[i](latest) // Compute current point from saved interpolate and progress
                }
                // Update coordinates
                animateSymbol.updateData(map.toLngLat(oldDatas))
            },
            onComplete: (e) => {
                animateSymbol.stopAnimation();// Walking done, stop animation
                isWalking = false;
            },
            onStop: () => {
                animateSymbol.stopAnimation();// Walking done, stop animation
                isWalking = false;
            }
        })
    }
    else if (action === "remove") {
        // Remove
        animateSymbol.remove()
        animateSymbol = null;
    }
    // See animation line layer or fill layer examples for updating images
}
// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{width: "90px", right: "10px"}}>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("stopAnimation")}>Stop animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("startAnimation")}>Start animation
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("setSpeedFaster")}>Speed up
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("setSpeedSlower")}>Slow down
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("setData")}>Start walking
                    </button>
                </div>
                <div className="input-item">
                    <button id="clear-map-btn" className="btn btn-full mr0"
                            onClick={() => changeAnimateSymbol("remove")}>Remove
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