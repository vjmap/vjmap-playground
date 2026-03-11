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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findblockmodifyclr
        // --Find blocks in map and modify color / animated lines--Find all block or group entities, change block color by state and handle events
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: 'sys_topo', // Map ID
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry rendering
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            // If open failed
            message.error(res.error)
        }
        // Get map extent
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create geometric projection from map extent
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Custom vector style with state: alarm (red), normal (green)
        let customColorCaseExpr = [['==', ['feature-state', 'status'], 'alarm'], '#ff0000', ['==', ['feature-state', 'status'], 'normal'], '#00ff00'];
        
        let vectorStyle = svc.vectorStyle({
            customColorCaseExpr
        });
        // Map object
        let map = new vjmap.Map({
            container: 'map', // DIV container ID
            style: vectorStyle, // style, vector here
            center: prj.toLngLat(mapExtent.center()), // set map center
            zoom: 2, // set map zoom level
            pitch: 0, // pitch
            renderWorldCopies: false // do not show multi-world copies
        });
        
        // Attach service and projection
        map.attach(svc, prj);
        // Fit map to full extent
        //map.fitMapBounds();
        await map.onLoad();
        
        // Get block entity id to objectid mapping; cache result to avoid repeated backend queries
        const getFeatureIdObjectIdMap = async () => {
            let blocks = {} // block info
            let featureIdBlock = {} // feature id to block id
            let query = await svc.conditionQueryFeature({
                // Block objectid: blockId_refDefId_entityId_#; table: _@; group: $entityId_index$groupId
                condition: `objectid like '%#%' or objectid like '%$%' `,
                // id, objectid, envelop only
                fields: "id,objectid,envelop",
                limit: 100000 // large to get all; default 100
            })
            if (query.error) {
                message.error(query.error)
            } else {
                if (query.recordCount > 0) {
                    for(let i = 0; i < query.result.length; i++) {
                        let item = query.result[i];
                        let bounds = map.getEnvelopBounds(item.envelop);
                        let objectId = item.objectid;
                        let blockId;
                        if (objectId.indexOf("_") > 0) {
                            // block
                            let ids = objectId.split("_");
                            blockId = ids[0];
                        } else if (objectId.indexOf("$") > 0) {
                            // group
                            let ids = objectId.split("$");
                            blockId = ids[0];
                        } else {
                            continue;
                        }
        
                        blocks[blockId] = blocks[blockId] || {};
                        blocks[blockId].childrens = blocks[blockId].childrens || []
                        blocks[blockId].childrens.push(item.id);
                        blocks[blockId].bounds = blocks[blockId].bounds || new vjmap.GeoBounds();
                        blocks[blockId].bounds.updateByBounds(bounds); // update bounds
                        featureIdBlock[item.id] = blocks[blockId];
                    }
                }
            }
            return {
                blocks,
                featureIdBlock
            }
        }
        let { blocks, featureIdBlock } = await getFeatureIdObjectIdMap();
        
        // Simulate block status change and update block color
        const mockStatusChange = () => {
            for(let block in blocks) {
                let status = vjmap.randInt(0, 1) == 0 ? "normal" : "alarm";
                let sourceLayers = ['polygons', 'lines', 'points'];
                // All layers under vector source
                for (let sourceLayer of sourceLayers) {
                    // All feature ids under block
                    for(let id of blocks[block].childrens) {
                        map.setFeatureState({
                                source: "vector-source",
                                sourceLayer: sourceLayer,
                                id: id
                            },
                            {
                                status: status
                            })
                    }
                }
            }
        }
        setInterval(() => mockStatusChange(), 5000)
        
        // Hover highlight and click on block: use block bounds, transparent polygon, respond to events
        // Example shows two highlight modes: block bounds polygon, or change block entity color
        let polygons = []
        let idx = 0;
        for(let block in blocks) {
            polygons.push({
                points: map.toLngLat(blocks[block].bounds.toPointArray()),
                properties: {
                    name: block,
                    isHoverPolygon: (idx++ % 2) === 0 // two highlight modes, one used here
                }
            })
        }
        let fillOpacityHover = ['case', ['==', ['get', 'isHoverPolygon'], true], 0.1, 0.0]
        let polygon = new vjmap.Polygon({
            data: polygons,
            fillColor: '#00F6F7',
            // Invisible when not hovered, set opacity on hover
            fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], fillOpacityHover, 0],
            fillOutlineColor: "#00F6F7",
            isHoverPointer: true,
            isHoverFeatureState: true
        });
        polygon.addTo(map);
        polygon.clickLayer(e => message.info(`You clicked block ${e.features[0].properties.name}`))
        polygon.hoverPopup((f, popup) => {
            let bounds = vjmap.GeoBounds.fromDataExtent(f);
            popup.setLngLat([bounds.center().x, bounds.max.y]);// adjust popup position, e.g. top center of entity
            return `<h3>Block ID: ${f.properties.name}</h3>`
        }, { anchor: 'bottom' });
        
        // For second highlight mode: set all entities in block to highlight color
        const setBlockHighlight = (blockId, isHightLight) => {
            let sourceLayers = ['polygons', 'lines', 'points'];
            // All layers under vector source
            for (let sourceLayer of sourceLayers) {
                // All feature ids under block
                for(let id of blocks[blockId].childrens) {
                    map.setFeatureState({
                            source: "vector-source",
                            sourceLayer: sourceLayer,
                            id: id
                        },
                        {
                            hover: isHightLight
                        })
                }
            }
        }
        let highlightBlockId = '';
        polygon.hoverLayer(e => {
            if (e && e.features && e.features.length > 0) {
                // Get block name
                highlightBlockId = e.features[0].properties.name;
                setBlockHighlight(highlightBlockId, true)
            } else {
                // Clear previous highlight
                setBlockHighlight(highlightBlockId, false)
            }
        });
        
        
        // Animate all yellow lines in map
        // Filter existing vector line layer to exclude line type 1; can filter by layer etc.
        // Line type 1: https://vjmap.com/guide/svrStyleVar.html
        let condition = [
            'all',
            ['has', 'type'],
            ['==', ['get', 'type'], 1],
            ['==', ['get', 'color'], '#ffff00']
        ]
        map.setFilter('vector-layer-lines', ["!", condition]);
        
        // Add animated line layer
        let layers = vectorStyle.layers;
        // Find existing line layer
        let lineLayer = layers.find(layer => layer.id === "vector-layer-lines")
        // Clone and add new animate line layer
        let animateLineLayer = {
            ...lineLayer, // copy original props
            id: "vector-layer-animate-lines", // new id
            filter: condition // filter: all line type
        }
        map.addLayer(animateLineLayer);
        
        
        let antPathImages = vjmap.createAntPathAnimateImages({
            canvasWidth: 128,
            canvasHeight: 4,
            fillColor1: "#f0f",
            fillColor2: "#0ff"
        });
        let anim;
        const startAnimation = () => {
            if (anim) {
                // Already exists, start it
                anim.startAnimation();
            } else {
                // Create new animation
                anim = vjmap.animateVectorLayer(map, animateLineLayer.id, {
                    animateImages: antPathImages
                }, 0)
            }
        }
        startAnimation();
        
        const stopAnimation = () => {
            if (!anim) return
            anim.stopAnimation();
        }
        
        const removeAnimation = () => {
            if (!anim) return
            anim.remove();
            anim = null
        }
        
        
        // UI
        const App = () => {
            return (
                <div className="input-card">
                    <h4>Animation control</h4>
                    <div className="input-item">
                        <button className="btn" onClick={ () => startAnimation()}>Start line flow animation</button>
                        <button className="btn" onClick={ () => stopAnimation() }>Stop animation</button>
                        <button className="btn" onClick={ () => removeAnimation() }>Remove animation</button>
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