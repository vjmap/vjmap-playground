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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/22findsubmapsplit
        // --Auto split submaps--Split submaps by rules, save as submap or export image
        // js code
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: 'sys_splitmap', // Map ID (ensure it exists or upload new map)
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
            style: svc.rasterStyle(), // Raster style
            center: prj.toLngLat(mapExtent.center()), // Center
            zoom: 2,
            renderWorldCopies: false
        });
        map.attach(svc, prj);
        map.fitMapBounds();
        
        // Entity type ID to name mapping
        const { entTypeIdMap } = await svc.getConstData();
        const getTypeNameById = name => {
            for(let id in entTypeIdMap) {
                if (entTypeIdMap[id] == name) {
                    return id
                }
            }
        }
        // Find all line segments in map
        const  getMapLines = async () => {
            let queryEntTypes = ['AcDbLine', 'AcDbPolyline', 'AcDb2dPolyline', 'AcDb3dPolyline'];
            let cond = queryEntTypes.map(t => `name='${getTypeNameById(t)}'`).join(' or '); // SQL condition
        
            let result = [];
            let beginPos = 0; // Query start position
            while(true) {
                let limit = 50000
                let query = await svc.conditionQueryFeature({
                    condition: cond,
                    fields: "objectid,points,envelop",
                    beginpos: beginPos,
                    limit: limit
                });
                if (!query.result) break;
                beginPos += limit;
                result.push(...query.result || []);
                if (result.length >= query.recordCount) break;
            }
        
            result.forEach(rst => rst.envelop = map.getEnvelopBounds(rst.envelop));
            return result;
        }
        
        
        
        // Find all rectangles in map (4-line or closed polyline)
        function findAllRectInMap(lines) {
            let allRects = [];
            lines.forEach(e => {
                if (e.points == "") {
                    return;
                }
                let points = e.points.split(";").map(p => vjmap.GeoPoint.fromString(p));
                if (points[0].equals(points[points.length - 1])) {
                    points.length = points.length - 1;
                }
                if (points.length != 4) return;
                let cx = (points[0].x + points[1].x + points[2].x + points[3].x) / 4.0;
                let cy = (points[0].y + points[1].y + points[2].y + points[3].y) / 4.0;
                let center = vjmap.geoPoint([cx, cy]);
                let dist = center.distanceTo(points[0]);
                let isDistEqual = true;
                for(let k = 1; k < points.length; k++) {
                    if(!vjmap.isZero(center.distanceTo(points[k]) - dist)) {
                        isDistEqual = false;
                        break;
                    }
                }
                if (!isDistEqual) return false;
                let rectObj = {
                    bounds: e.envelop,
                    ents: [e.objectid]
                };
                allRects.push(rectObj)
            });
        
            // Rectangles from 4 lines: 2 points per line, horizontal or vertical
            lines = lines.filter(e => {
                    let points = e.points.split(";");
                    if (points.length !=2 ) return false;
                    e.geoStart = vjmap.GeoPoint.fromString(points[0]);
                    delete e.geoStart.z;
                    e.geoEnd = vjmap.GeoPoint.fromString(points[1]);
                    delete e.geoEnd.z;
                    e.startPoint = e.geoStart.toString();
                    e.endPoint =  e.geoEnd.toString();
                    if (e.startPoint == e.endPoint) {
                        return false;
                    }
                    let line = points.map(e=>vjmap.geoPoint(e.split(",")))
                    let isVLine = vjmap.isZero(line[0].x - line[1].x); // Vertical
                    let isHLine = vjmap.isZero(line[0].y - line[1].y); // Horizontal
                    if (!(isVLine || isHLine)) return false;
        
                    e.isHorzLine = isHLine;
                    e.findFlag = false;
                    return true
                }
            )
            let coordPointMap = {}
            let entMap = {}
            for(let ln of lines) {
                entMap[ln.objectid] = ln;
                coordPointMap[ln.startPoint] = coordPointMap[ln.startPoint] || new Set()
                coordPointMap[ln.startPoint].add(ln.objectid)
        
                coordPointMap[ln.endPoint] = coordPointMap[ln.endPoint] || new Set()
                coordPointMap[ln.endPoint].add(ln.objectid)
            }
            for(let c in coordPointMap) {
                coordPointMap[c] = Array.from(coordPointMap[c])
            }
        
            const findNextLine = (ln, isStartPoint, nextIsHortLine) => {
                const pt = isStartPoint ? ln.startPoint : ln.endPoint
                const findLines = coordPointMap[pt];
                if (!findLines) return null;
                let idx = findLines.findIndex( e => e != ln.objectid && e.substr(0, 3) == ln.objectid.substr(0, 3));
                if(idx < 0) {
                    idx = findLines.findIndex( e => e != ln.objectid);
                    if(idx < 0) return null;
                }
                const findLn = entMap[findLines[idx]];
                if (findLn.isHorzLine != nextIsHortLine) return null;
                let isLnStartPoint = findLn.startPoint != pt
                return {
                    findLine: findLn,
                    isStartPoint: isLnStartPoint
                }
            };
        
            for(let ln of lines) {
                if (ln.isHorzLine) continue;
                let n1 = coordPointMap[ln.startPoint].length;
                let n2 = coordPointMap[ln.endPoint].length;
                if (ln.findFlag) continue;
                let nextLine1 = findNextLine(ln, true, true)
                if (!nextLine1) continue;
                let nextLine2 = findNextLine(nextLine1.findLine, nextLine1.isStartPoint, false)
                if (!nextLine2) continue;
                let nextLine3 = findNextLine(nextLine2.findLine, nextLine2.isStartPoint, true)
                if (!nextLine3) continue;
                let nextLine4 = findNextLine(nextLine3.findLine, nextLine3.isStartPoint, false)
                if (!nextLine4) continue;
                if (nextLine4.findLine.objectid == ln.objectid && nextLine4.isStartPoint == true) {
                    ln.findFlag = true;
                    nextLine1.findLine.findFlag = true;
                    nextLine2.findLine.findFlag = true;
                    nextLine3.findLine.findFlag = true;
        
                    let strBounds = '[' + ln.startPoint + ','  + (nextLine2.isStartPoint ? nextLine2.findLine.startPoint : nextLine2.findLine.endPoint) + ']';
                    let rectObj = {
                        bounds: vjmap.GeoBounds.fromString(strBounds),
                        ents: [ln.objectid, nextLine1.findLine.objectid, nextLine2.findLine.objectid, nextLine3.findLine.objectid]
                    };
                    allRects.push(rectObj)
                }
            }
            return allRects;
        }
        
        
        // Auto split submap, display bounds of all submaps
        // Logic: find all rectangles in the map (including those formed by lines); if a rectangle is not contained by any other, it is a submap bounds
        const splitMap = async () => {
            message.info('Please click the highlighted submap frame, then choose ”Save as new submap“or"Save as image"')
            let lnRes = await getMapLines();
            let allRects = findAllRectInMap(lnRes);
            // Among all rectangles, only those not contained by any other are considered submap frames
            let mapRects = [];
            for(let i = 0; i < allRects.length; i++) {
                let isContain = false;
                for(let j = 0; j < allRects.length; j++) {
                    if (i == j) continue;
                    // Check if rect is contained
                    if ( allRects[j].bounds.isContains(allRects[i].bounds)) {
                        isContain = true;
                        break;
                    }
                }
                if (!isContain) {
                    mapRects.push(allRects[i]);
                }
            }
        
            let data = []
            for(let i = 0; i < mapRects.length; i++) {
                let bounds = mapRects[i].bounds;
                data.push({
                    points: map.toLngLat(bounds.toPointArray()),
                    properties: {
                        color: "#FF2AA5"
                    }
                });
            }
            let polygon = new vjmap.Polygon({
                data: data,
                fillColor: ['case', ['to-boolean', ['feature-state', 'hover']], 'yellow', '#FD2DC3'],
                fillOpacity: ['case', ['to-boolean', ['feature-state', 'hover']], 0.5, 0.3],
                fillOutlineColor: ['get', 'color'],
                isHoverPointer: true,
                isHoverFeatureState: true
            });
            polygon.addTo(map);
        
            window.saveSubMapByBounds = async points => {
                let bounds = vjmap.GeoBounds.fromDataExtent(points);
                bounds = map.fromLngLat(bounds);
                let curMapParam = svc.currentMapParam();
                let rsp = await svc.composeNewMap([
                    {
                        mapid: curMapParam.mapid,
                        version: curMapParam.version,
                        clipbounds: bounds.toArray() // Clip bounds
                    }
                ])
                let url = `https://vjmap.com/app/cloud/#/upload?fileid=${rsp.fileid}&mapid=${rsp.fileid}&isNewMapId=true`;
                window.open(url);
            };
            // Save as image
            window.exportMapPngByBoundsUrl = points => {
                let bounds = vjmap.GeoBounds.fromDataExtent(points);
                bounds = map.fromLngLat(bounds);
                // bounds = bounds.square(); // ensure square
                bounds = bounds.scale(1.01);
                let pictureWidth = 1024;
                let wmsUrl = svc.wmsTileUrl({
                    width: pictureWidth,
                    height: Math.round(pictureWidth * bounds.height() / bounds.width()),
                    srs: "",
                    bbox: bounds.toString(),
                    transparent: false,
                    backgroundColor: 'rgb(0,0,0)'
                });
                window.open(wmsUrl);
            };
            polygon.clickPopup(f => {
                let coordinates = JSON.stringify(f.geometry.coordinates[0]);
                return `
                            <h3>Actions</h3>
                            <h3><button onclick="saveSubMapByBounds(${coordinates})">Save as new submap</button></h3>
                            <h3><button onclick="exportMapPngByBoundsUrl(${coordinates})">Save as image</button></h3>
                        `
            }, { anchor: 'bottom', closeOnClick: true});
        }
        
        // UI
        const App = () => {
            return (
                <div>
                    <div className="info" style={{ width: "150px", right: "10px" }}>
                        <div className="input-item">
                            <button id="clear-map-btn" className="btn btn-full mr0"
                                    onClick={() => splitMap()}>Auto split submaps
                            </button>
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