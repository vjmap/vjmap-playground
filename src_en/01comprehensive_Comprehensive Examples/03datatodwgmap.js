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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/03datatodwgmap
        // --Data to CAD engineering section-- Create CAD-style section from data on frontend
// Section template map id and version
let templateSectId = "template_sect";
let templateSecVersion = "v1";
// Title block template id and version
const templateTkMapId = "template_tk";
const templateTkVersion = "v1";
// Note: objectid source: open template in cloud by memory, click entity, get object value in property panel;
// or open by geom render, click entity, get object value. For block (objectid with multiple _), use string before first _.
let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
// Get template info
let tplInfo;
// Get template data
const getTemplateInfo = async (templateSectId, version) => {
    let features = await getTemplateData(templateSectId, version);
    // Get all fill symbols: text in fill-symbol layer ("填充符号" - fill symbol), hatch above text is the fill symbol
    let hatchInfos = features.filter(f => f.layername == "填充符号" && f.name == "AcDbMText").map(t => {
        let hatch = features.filter(f => f.layername == "填充符号" && f.name == "AcDbHatch").find(h =>
            // Hatch above text vertically, within 2x text height; horizontally contains text center
            h.envelop.min.y > t.envelop.max.y &&
            h.envelop.min.y - t.envelop.max.y < t.envelop.height() * 2 &&
            h.envelop.min.x <= t.envelop.center().x &&
            h.envelop.max.x >= t.envelop.center().x
        )
        if (!hatch) return;
        return {
            name: t.text,
            hatchObjectId: hatch.objectid
        }
    })
    // Get start line for drawing (layer "线" - line)
    let lineInfo = features.filter(f => f.layername == "线" && f.name == "AcDbLine");
    let startLine;
    if (lineInfo.length > 0) {
        startLine = {
            objectId: lineInfo[0].objectid,
            positon: [lineInfo[0].envelop.min.x, lineInfo[0].envelop.min.y]
        }
    }
    return {
        startLine,
        hatchInfos
    }
}

// Mock data
const mockData = (hatchNames, minCount) => {
    // Shuffle hatch order so each run differs
    hatchNames.sort(() => Math.random() - 0.5);
    let data = [];
    // Bore count
    let kongCount = vjmap.randInt(minCount, minCount * 2);
    for(let i = 0; i < kongCount; i++) {
        let item = {
            name: 'Hole' + (i + 1),
            x: 15 * (i + 1) + vjmap.randInt(0, 10) + 1000, // bore x
            y: vjmap.randInt(100, 105), // bore y
            stratums: [] // stratum data
        }
        // Generate each layer
        let stratumCount = vjmap.randInt(5, hatchNames.length - 1);
        let stratumAllThickness = 0;
        for(let k = 0; k < stratumCount; k++) {
            const thickness = vjmap.randInt(2, 6) // random thickness
            item.stratums.push({
                hatch: hatchNames[k],
                thickness: thickness
            })
            stratumAllThickness += thickness;
        }
        item.stratumsThickness = stratumAllThickness; // total thickness
        data.push(item);
    }
    return data;
}
// Create section document
const createSectDoc = async (sectData) => {
    // Data to draw
    let drawData = sectData;
    // Get min/max
    let minX = Math.min(...drawData.map(d => d.x));
    let maxX = Math.max(...drawData.map(d => d.x));
    let minY = Math.min(...drawData.map(d => d.y));
    let maxY = Math.max(...drawData.map(d => d.y + d.stratumsThickness));
    minY = Math.floor(minY / 10) * 10; // round to 10, scale step 10
    maxY = Math.ceil(maxY / 10) * 10 + 10; // round to 10, scale step 10, a bit longer
    let posMaxX = maxX - minX + 20; // x draw position, offset from scale
    let posMinX = 10;// x draw position, offset from scale

    const startPoint = tplInfo.startLine.positon;

    let doc = new vjmap.DbDocument();
    // Data source
    doc.from = `${templateSectId}/${templateSecVersion}`;

    // Clear source drawing (this template is used as-is, no clear)
    // doc.isClearFromDb = true;
    let entitys = [];

    // Left scale
    entitys.push(new vjmap.DbLine({
        objectid: "169A2",
        start: startPoint,
        end: [startPoint[0], startPoint[1] + (maxY - minY)]
    }))
    for(let y = minY; y < maxY; y += 10) {
        let pt = [startPoint[0], startPoint[1] + maxY - y];
        entitys.push(new vjmap.DbLine({
            start: pt,
            end: [pt[0] - 2, pt[1]]
        }))
        // Scale value

        entitys.push(new vjmap.DbText({
            cloneObjectId: '168C8',
            position: [pt[0] - 1, pt[1] + 0.2],
            text: y + ''
        }))
    }
    // Right scale
    entitys.push(new vjmap.DbLine({
        cloneObjectId: "169A2", // Clone left scale line, not modify
        start: [startPoint[0] + posMaxX, startPoint[1]],
        end: [startPoint[0] + posMaxX, startPoint[1] + (maxY - minY)]
    }))
    for(let y = minY; y < maxY; y += 10) {
        let pt = [startPoint[0], startPoint[1] + maxY - y];
        entitys.push(new vjmap.DbLine({
            start: [pt[0] + posMaxX , pt[1]],
            end: [pt[0]  + posMaxX + 2, pt[1]]
        }))
        // Scale value
        entitys.push(new vjmap.DbText({
            cloneObjectId: '168C8',
            position: [pt[0] + posMaxX + 1, pt[1] + 0.2],
            text: y + ''
        }))
    }

    // Modify line coordinates
    entitys.push(new vjmap.DbLine({
        cloneObjectId:  tplInfo.startLine.objectId,
        start: [startPoint[0], startPoint[1]],
        end: [startPoint[0] + posMaxX, startPoint[1]]
    }))


    // Demo block and attributes: bore name and x coordinate with line between
    const blockName = "nameAndx";
    let block = new vjmap.DbBlock();
    block.name = blockName;
    block.origin = [0, 0]
    block.entitys = [
        new vjmap.DbAttributeDefinition({
            position: [0, 0.2],
            contents: "Name",
            tag: "NAME",
            colorIndex: 7, // auto invert
            horizontalMode: vjmap.DbTextHorzMode.kTextCenter,
            verticalMode: vjmap.DbTextVertMode.kTextBottom, // kTextBottom,
            height: 0.5,
        }),
        new vjmap.DbLine({
            start: [-2, 0],
            end: [2, 0]
        }),
        new vjmap.DbAttributeDefinition({
            position: [0, -0.2],
            contents: "X",
            tag: "POSX",
            colorIndex: 7, // auto invert
            horizontalMode: vjmap.DbTextHorzMode.kTextCenter,
            verticalMode: vjmap.DbTextVertMode.kTextTop, // kTextBottom,
            height: 0.5,
        })
    ];
    doc.appendBlock(block);
    // Draw each hole
    for(let i = 0; i < drawData.length; i++) {
        // Start draw position
        let x = posMinX + drawData[i].x - minX;
        let y = startPoint[1] + maxY - drawData[i].y;
        // Name and x, create block ref from block above
        let blockRef = new vjmap.DbBlockReference();
        blockRef.blockname = blockName;
        blockRef.position =  [x + 1.5,  y + 3];
        // Set attribute values
        blockRef.attribute = {
            NAME: drawData[i].name,
            POSX: drawData[i].x
        }
        entitys.push(blockRef);

        // Draw layer by layer
        for(let k = 0; k < drawData[i].stratums.length; k++) {
            let y2 = y - drawData[i].stratums[k].thickness;
            let bounds = vjmap.GeoBounds.fromArray([x, y, x + 3, y2]);
            let points = bounds.toPointArray(); // to point array
            // Close
            points.push(points[0]);
            // Fill
            entitys.push(new vjmap.DbHatch({
                cloneObjectId: drawData[i].stratums[k].hatch.hatchObjectId,
                points: points,
                patternScale: 1.5
            }))
            // Border
            entitys.push(new vjmap.Db2dPolyline({
                points: points
            }))

            // Line to next bore
            if (i != drawData.length - 1) {
                const nextKongStratums = drawData[i + 1].stratums;
                let nextX = posMinX + drawData[i + 1].x - minX;
                let nextY = startPoint[1] + maxY - drawData[i + 1].y;
                if (k < nextKongStratums.length) {
                    for(let n = 0; n <= k; n++) {
                        nextY = nextY - drawData[i + 1].stratums[n].thickness;
                    }
                    entitys.push(new vjmap.DbLine({
                        start: [x + 3, y2],
                        end: [nextX, nextY]
                    }))
                }
                // Horizontal spacing
                entitys.push(new vjmap.DbLine({
                    start: [x, startPoint[1]],
                    end: [x, startPoint[1] - 2]
                }))
                entitys.push(new vjmap.DbLine({
                    start: [nextX, startPoint[1]],
                    end: [nextX, startPoint[1] - 2]
                }))
                entitys.push(new vjmap.DbLine({
                    start: [x, startPoint[1] - 2],
                    end: [nextX, startPoint[1] - 2]
                }))
                // Spacing value
                entitys.push(new vjmap.DbText({
                    cloneObjectId: '168C8',
                    position: [(x + nextX) / 2, startPoint[1] - 1],
                    text: nextX - x,
                    horizontalMode: vjmap.DbTextHorzMode.kTextCenter, // kTextCenter
                    verticalMode: vjmap.DbTextVertMode.kTextVertMid // kTextVertMid,
                }))
            }
            y = y2;
        }
        // Total thickness at bottom
        entitys.push(new vjmap.DbText({
            cloneObjectId: '168C8',
            position: [x + 1.5, y - 0.2],
            text: drawData[i].stratumsThickness,
            horizontalMode: vjmap.DbTextHorzMode.kTextCenter, // kTextCenter
            verticalMode: vjmap.DbTextVertMode.kTextTop // kTextTop,
        }))


    }


    entitys.push(new vjmap.DbText({
        objectid: '1687C',
        position: [(posMinX + posMaxX) / 2.0, startPoint[1] + maxY - minY + 10],
        /* For relative position, use matrix:
        matrix: [
            {
                op: "translation",
                vector: [offsetX, offsetY]
            }
        ],*/
        text: `Section ${Date.now()}`
    }))

    // Draw title block
    let bounds = vjmap.GeoBounds.fromArray([posMinX - 20, startPoint[1] + maxY - minY + 15, posMaxX + 10, startPoint[1] - 20]);
    let labelPos = [bounds.max.x, bounds.min.y];
    let points = bounds.toPointArray(); // to point array
    // Close
    points.push(points[0]);
    // Border
    entitys.push(new vjmap.Db2dPolyline({
        points: points
    }))
    bounds = bounds.scale(1.02);
    points = bounds.toPointArray(); // to point array
    // Close
    points.push(points[0]);
    // Border
    entitys.push(new vjmap.Db2dPolyline({
        points: points,
        lineWidth: 30 // mm
    }))

    let date = new Date();
    // Insert title block from template, set block attributes
    entitys.push(new vjmap.DbBlockReference({
        cloneObjectId: '6A1',
        cloneFromDb: `${templateTkMapId}/${templateTkVersion}`,
        position: labelPos,
        attribute: {
            // Set block attribute fields
            DATETIME: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
            COMPANY: {
                text: "VJMAP",
                color: 0x00FFFF
            }
        }
    }))

    entitys.push(new vjmap.DbLine({
        objectid: "168C8", // Remove this template text
        delete: true
    }))
    doc.entitys = entitys;
    // Zoom to extent after create
    doc.isZoomExtents = true;
    return doc;
}


// Set an initial bounds for the drawing; exact value does not matter. Export DWG will compute real bounds from entity coordinates.
let mapBounds = '[-10000,-10000,10000,10000]'
let mapExtent = vjmap.GeoBounds.fromString(mapBounds);
mapExtent = mapExtent.square(); // must be square

svc.setCurrentMapParam({
    darkMode: true, // no map opened yet, set dark mode
    bounds: mapExtent.toString()
})
// Create coordinate system
let prj = new vjmap.GeoProjection(mapExtent);

// New map object
let map = new vjmap.Map({
    container: 'map', // container ID
    style: {
        version: svc.styleVersion(),
        glyphs: svc.glyphsUrl(),
        sources: {},
        layers: []
    },// vector tile style
    center: [0,0], // center
    zoom: 2,
    renderWorldCopies: false
});
// Attach service and projection
map.attach(svc, prj);

// Make map fully visible
map.fitMapBounds();
await map.onLoad();


// Create geometry data
const createGeomData = async (map, doc) => {
    let svc = map.getService();
    let res = await svc.cmdCreateEntitiesGeomData({
        filedoc: JSON.stringify(doc)
    });
    if (res.error) {
        message.error(res.error);
        return {
            type: "FeatureCollection",
            features: []
        };
    }
    if (res.metadata && res.metadata.mapBounds) {
        // If metadata has map bounds, update map extent
        map.updateMapExtent(res.metadata.mapBounds);
    }

    const features = [];
    if (res && res.result && res.result.length > 0) {
        for (let ent of res.result) {
            if (ent.geom && ent.geom.geometries) {
                let clr = map.entColorToHtmlColor(ent.color); // entity color to HTML color
                let featureAttr = {};
                // Combined entity: distinguish line and polygon colors
                if (ent.isPolygon) {
                    featureAttr.color = clr; // fill, polygon only
                    featureAttr.noneOutline = true; // no polygon outline
                } else {
                    featureAttr.color = clr; // color
                    featureAttr.line_width = ent.lineWidth; // line width
                }
                for(let g = 0; g < ent.geom.geometries.length; g++) {
                    if (ent.geom.geometries[g].type == "Point") {
                        // Convert to line with same start and end
                        ent.geom.geometries[g].type = "LineString";
                        ent.geom.geometries[g].coordinates = [
                            ent.geom.geometries[g].coordinates, // start
                            ent.geom.geometries[g].coordinates // end
                        ]
                    }
                }

                let ft = {
                    id: vjmap.RandomID(10),
                    type: "Feature",
                    properties: {
                        objectid: ent.objectid,
                        opacity: ent.alpha / 255,
                        ...featureAttr,
                    }
                }
                if (ent.geom.geometries.length == 1) {
                    features.push({
                        ...ft,
                        geometry: ent.geom.geometries[0],
                    });
                } else {
                    features.push({
                        ...ft,
                        geometry: {
                            geometries: ent.geom.geometries,
                            type: "GeometryCollection"
                        },
                    });
                }

            }
        }
    }
    return {
        type: "FeatureCollection",
        features: features,
    };
};

// Clear previous map data
const clearMapData = () => {
    svc.setCurrentMapParam({
        darkMode: true, // set dark mode
        bounds: mapExtent.toString()
    })
    map.disableLayerClickHighlight();
    map.removeDrawLayer();
    let sources = map.getStyle().sources;
    for(let source in sources) {
        map.removeSourceEx(source);
    }
}

// Create map with data
const createDataMap = async (doc) => {
    clearMapData();
    let geojson = await createGeomData(map, doc);
    map.getDrawLayer().set(geojson);
}

// Create DWG map
const createDwgMap = async (doc) => {
    // Clear previous drawing first
    clearMapData();
    let res = await svc.updateMap({
        // Temp map id (temp maps auto-delete when expired)
        mapid: vjmap.getTempMapId(1), // Expiry in minutes when not viewed. Default 30.
        filedoc:JSON.stringify(doc),
        mapopenway: vjmap.MapOpenWay.Memory,
        style: {
            backcolor: 0 // set 0xFFFFFF if div background is light
        }
    })
    if (res.error) {
        message.error(res.error)
    }
    await map.switchMap(res);
}


let curDoc;
const exportDwgOpen = async () => {
    if (!curDoc) return;
    const mapid = 'exportdwgmap';
    let res = await svc.updateMap({
        mapid: mapid,
        filedoc: JSON.stringify(curDoc),
        mapopenway: vjmap.MapOpenWay.Memory,
        style: {
            backcolor: 0 // set 0xFFFFFF if div background is light
        }
    })
    if (res.error) {
        message.error(res.error)
    } else{
        window.open(`https://vjmap.com/app/cloud/#/map/${res.mapid}?version=${res.version}&mapopenway=Memory&vector=false`)
    }
}

// Get all template data
const getTemplateData = async (mapid, version) => {
    let res = await svc.rectQueryFeature({
        mapid,
        version,
        fields: "",
        geom: false, // open by memory to get real objectid
        maxGeomBytesSize: 0, // no geometry needed
        useCache: true, // cache query result for speed
        // Omit x1,y1,x2,y2 to query full map
    })
    // Parse entity bounds string to object
    res.result.map(f => f.envelop = vjmap.GeoBounds.fromString(f.bounds));
    console.log(res.result)
    return res.result;
}


const creatSectDataMap = async () => {
    let sectData = mockData(tplInfo.hatchInfos, 5);
    const doc = await createSectDoc(sectData);
    await createDataMap(doc);
    map.fitMapBounds();
    curDoc = doc;
}
const creatSectDwgMap = async () => {
    let sectData = mockData(tplInfo.hatchInfos, 15);
    const doc = await createSectDoc(sectData);
    await createDwgMap(doc);
    map.fitMapBounds();
    // Click to highlight (element highlights on click)
    map.enableLayerClickHighlight(svc, e => {
        if (!e) return;
        let msg = {
            content: `type: ${e.name}, id: ${e.objectid}, layer: ${e.layerindex}`,
            key: "layerclick",
            duration: 5
        }
        e && message.info(msg);
    })
    curDoc = doc;
}
// Get template info first
tplInfo = await getTemplateInfo(templateSectId, templateSecVersion);
// Generate random section
creatSectDataMap();
// UI
const App = () => {
    return (
        <div>
            <div className="info" style={{width: '430px'}}>
                <div className="input-item">
                    <button className="btn btn-full mr0" onClick={creatSectDataMap}>Random section [frontend draw, for small output]</button>
                    <button className="btn btn-full mr0" onClick={creatSectDwgMap}>Random section [server DWG, for large output]</button>
                    <button className="btn btn-full mr0" onClick={exportDwgOpen}>Export as DWG and open</button>
                </div>
            </div>
        </div>
    );
}
ReactDOM.render(<App />, document.getElementById('ui'));


const mousePositionControl = new vjmap.MousePositionControl();
map.addControl(mousePositionControl, "bottom-left");

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