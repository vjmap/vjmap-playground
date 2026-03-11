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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/projection/geojsonLnglatProjection
        // --LngLat coordinate projection--
// Map service object
let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
let res = await vjmap.httpHelper.get("./../../assets/data/china.json");
let geo_china = res.data;
res = await vjmap.httpHelper.get("./../../assets/data/beijing.json");
let geo_bj = res.data;
let bounds = vjmap.GeoBounds.fromDataExtent(geo_china);
// Create lnglat projection
let prj = new vjmap.LnglatProjection();

// Map object
let map = new vjmap.Map({
    container: 'map', // DIV container ID
    style: svc.rasterBlankStyle(0, 24), // style
    center: prj.toLngLat(bounds.center()), // set map center
    zoom: 3, // set map zoom level
    renderWorldCopies: false // do not show multi-world copies
});

// Attach service and projection
map.attach(svc, prj);
// Fit to map bounds
map.fitBounds(map.toLngLat(bounds));

map.on('load', function () {
    // Add a data source containing GeoJSON data.
    map.addSource('china', {
        'type': 'geojson',
        'data': map.toLngLat(geo_china)
    });

    // Add a new layer to visualize the polygon.
    map.addLayer({
        'id': 'fill_china',
        'type': 'fill',
        'source': 'china', // reference the data source
        'layout': {},
        'paint': {
            'fill-color': '#F8C8DE',
            'fill-opacity': 1
        }
    });
    // Add a black outline around the polygon.
    map.addLayer({
        'id': 'outline_china',
        'type': 'line',
        'source': 'china',
        'layout': {},
        'paint': {
            'line-color': '#AE9394',
            'line-width': 1
        }
    });

    map.addLayer({
        id: 'text_china',
        type: 'symbol',
        source: 'china',
        layout: {
            'text-field': '{name}',
            'text-font': ['simsun'],
            'text-size': 12
        }
    });

    // beijing
    map.addSource('beijing', {
        'type': 'geojson',
        'data': map.toLngLat(geo_bj)
    });

    // Add a new layer to visualize the polygon.
    map.addLayer({
        'id': 'fill_bj',
        'type': 'fill',
        'source': 'beijing', // reference the data source
        'layout': {},
        'paint': {
            'fill-color': '#57C9FF',
            'fill-opacity': 0.6
        }
    });
    // Add a black outline around the polygon.
    map.addLayer({
        'id': 'outline_bj',
        'type': 'line',
        'source': 'beijing',
        'layout': {},
        'paint': {
            'line-color': '#00277B',
            'line-width': 1
        }
    });

    map.addLayer({
        id: 'text_bj',
        type: 'symbol',
        source: 'beijing',
        minzoom: 6,
        layout: {
            'text-field': '{name}',
            'text-font': ['simsun'],
            'text-size': 12
        }
    });
});

// UI
const { useState, useEffect } = React
const App = () => {
    const [geoPoint, setGeoPoint] = useState(); // geo coordinates
    const [pixelPoint, setPixelPoint] = useState(); // pixel coordinates

    const showLngLat = (e) => {
        let geo = map.fromLngLat(e.lngLat);
        let pixel = e.point;
        setGeoPoint(geo.toString(6))
        setPixelPoint(e.point.x + ', ' + e.point.y);
    }

    useEffect(() => {
        // Run only on init
        // Handle map click
        map.on('click', showLngLat);
        return ()=> {
            // Cleanup: remove listener
            map.off('click', showLngLat);
        }
    }, []);
    return (
        <div>
            <div className="info w260">
                <h4>Click to get geo coordinates:</h4>
                <div className="input-item">
                    <p>Geo: <span id="lnglat">{geoPoint}</span></p>
                </div>
                <div className="input-item">
                    <p>Pixel: <span id="lnglatpx">{pixelPoint}</span></p>
                </div>
            </div>
        </div>
    );
}
ReactDOM.render(<App />, document.getElementById('ui'));
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