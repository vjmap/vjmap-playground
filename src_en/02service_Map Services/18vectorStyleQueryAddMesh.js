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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/18vectorStyleQueryAddMesh
        // --Query vector data and draw objects--Query vector data by condition and draw objects
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        let prj = new vjmap.GeoProjection(mapExtent);
        
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: {
                version: svc.styleVersion(),
                glyphs: svc.glyphsUrl(),
                sources: {},
                layers: []
            }, // Vector tile style
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            pitch: 60,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        await map.onLoad();
        map.setMaxBounds(map.toLngLat(prj.getMapExtent()));
        
        const len = mapExtent.width() / 80;
        const layers = svc.getMapLayers();
        const prefix = "my";
        const sourceId = prefix + "-source";
        map.addVectorSource(sourceId, svc.vectorTileUrl(), {
            maxzoom: 25,
            minzoom: 0
        });
        
        const mapParam = svc.currentMapParam();
        const darkMode = mapParam && mapParam.darkMode;
        // Invert color
        const darkColor = [
            "case",
            ["==", ["get", "color"], "#000000"],
            "#FFFFFF",
            ["get", "color"]
        ];
        
        const color = [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "rgba(0,0,255,255)",
            darkMode ? darkColor : ["get", "color"]
        ];
        
        // Line layer
        map.addLineLayer(prefix + "-layer-lines", sourceId, {
            source: sourceId,
            sourceLayer: "lines",
            lineCap: "round",
            lineColor: color,
            lineWidth: [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                3,
                ["get", "linewidth"]
            ]
        })
        
        // Extrusion layer
        map.addFillExtrusionLayer(prefix + "-layer-polygons", sourceId, {
            source: sourceId,
            sourceLayer: "polygons",
            fillExtrusionColor: color,
            fillExtrusionBase: 0,
            fillExtrusionHeight: prj.toMeter(len)
        })
        
        // Entity type ID to name mapping
        const { entTypeIdMap } = await svc.getConstData();
        // Hover highlight
        map.enableVectorLayerHoverHighlight((event, feature, layer) => {
            // Click-highlight entity callback
            const prop = feature.properties;
            let content = `event: ${event}; feature: ${feature.id}; layer: ${layers[prop.layer].name}; type: ${entTypeIdMap[prop.type]}`
            message.info({ content, key: "info", duration: 5});
        }, prefix)
        
        // Add Deck.gl layer
        if (typeof deck !== "object") {
            await vjmap.addScript([{
                src: "../../js/deck.gl.min.js"
            },{
                src: "../../js/loaders.gl/core/dist/dist.min.js"
            },{
                src: "../../js/loaders.gl/obj/dist/dist.min.js"
            }]);
            loaders.registerLoaders([loaders.OBJLoader]);
        }
        
        // Wait for source to load
        const waitSourceLoaded = () => {
            return new Promise((resolve, reject) => {
                const lister = ()=> {
                    if (map.getSource(sourceId) && map.isSourceLoaded(sourceId)) {
                        map.off("sourcedata", lister);
                        resolve({});
                    }
                };
                map.on("sourcedata", lister);
            });
        }
        
        await waitSourceLoaded();
        // Query all circle entities in layer
        const featureType = "AcDbCircle";
        const featureTypeIndex = Object.keys(entTypeIdMap).find(e => entTypeIdMap[e] === featureType);
        const features = map.querySourceFeatures(sourceId, {sourceLayer: "lines", filter: ["all", ["==", "layer", 22],["==", "type", +featureTypeIndex]]});
        const points = features.map(f => {
            const geom = f.geometry.coordinates;
            const pt = vjmap.GeoBounds.fromDataExtent(geom).center();
            return [pt.x, pt.y];
        });
        
        const data = [];
        for(let i = 0; i < points.length; i++) {
            data.push({
                id: i + 1,
                position: points[i],
                color: [vjmap.randInt(0, 255), vjmap.randInt(0, 255), vjmap.randInt(0, 255)],
                angle: vjmap.randInt(0, 360)
            })
        }
        
        const deckLayer = new vjmap.DeckLayer({
            id: 'scatterplot',
            type: deck.SimpleMeshLayer,
            data: data,
            getPosition: d => d.position,
            mesh: env.assetsPath + "data/Bulbasaur.obj",
            getColor: d => d.color,
            getOrientation: d => [0, d.angle, 90],
            sizeScale: 40000,
            autoHighlight: true,
            pickable: true,
            onClick: ({object}) => {
                message.info(`Clicked Deck layer object ${object.id}`)
            }
        });
        map.addLayer(deckLayer);
        
        map.flyTo({center: [-61.59, 13.28], zoom: 4, pitch: 58, bearing: 112});
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