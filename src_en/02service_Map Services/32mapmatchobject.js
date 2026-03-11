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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/service/32mapmatchobject
        // --Entity object detection--Detect similar entity bounds from selected image.
        // Note: Image-based detection is one approach; prefer backend spatial query for precise match. See https://vjmap.com/demo/#/demo/map/service/22findcircledrawbounds
        // Create map service with service URL and token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // Open map
        let res = await svc.openMap({
            mapid: env.exampleMapId, // Map ID (ensure it exists or upload new map)
            mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry render
            style: vjmap.openMapDarkStyle() // Use dark style when div has dark background
        })
        if (res.error) {
            message.error(res.error)
        }
        // Get map bounds
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // Create coordinate system
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // Create map object
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // raster tile style
            center: [21.08081675060015, 16.22507363215631] ,// center
            zoom: 5,
            renderWorldCopies: false
        });
        // Attach service and projection
        map.attach(svc, prj);
        await map.onLoad();
        
        
        if (typeof Vue !== "object") {
            // If no Vue and Element UI
            await vjmap.addScript([{
                src: "../../js/vue@2.js"
            }, {
                src: "../../js/element-ui@2.15.10/index.js"
            },{
                src: "../../js/element-ui@2.15.10/index.css"
            }])
        }
        
        let antPathAnimateLine;
        const matchObject = async (param) => {
            message.info("Finding matching entities in map, please wait...")
            if (antPathAnimateLine) {
                antPathAnimateLine.remove();
                antPathAnimateLine = null;
            }
            param = {
                ...param,
                mapid: svc.currentMapParam().mapid,
                version: svc.currentMapParam().version
            }
            const result = await svc.cmdMatchObject(param);
            if (result.error) {
                message.error(result.error)
                return
            }
            let match = result.match.split(";");
            let geoDatas = [];
            for(let i = 0; i < match.length; i++) {
                if (match[i].indexOf(",") <= 0) continue;
                const items = match[i].split(",");
                const pts = [[+items[0], +items[1]], [+items[2], +items[3]], [+items[4], +items[5]], [+items[6], +items[7]]];
                pts.push(pts[0])
        
                geoDatas.push({
                    points: map.toLngLat(pts.map(p => vjmap.geoPoint(p))),
                    properties: {
                        color: "#ff0000"
                    }
                })
            }
            antPathAnimateLine = vjmap.createAntPathAnimateLineLayer(map, geoDatas, {
                fillColor1: "#f00",
                fillColor2: "#0ffb",
                canvasWidth: 128,
                canvasHeight: 32,
                frameCount: 4,
                lineWidth: 4,
                lineOpacity: 0.8
            });
            message.info(`Found ${geoDatas.length} matching object(s).`)
        }
        
        const selectFeature = async (isPoint) => {
            message.info("Select entity, right-click to finish")
            let param = {};
            res = await vjcommon.selectFeatures(map, true, isPoint, isPoint, true);
            vjcommon.clearHighlight(map);
            if (!res || res.length == 0) return;
            const objectIds = res.map(f => f.properties.objectid);
            const layeron = `(${Array.from(new Set(res.map(f => f.properties.layerindex))).join(",")})`;
            const features = {
                type: "FeatureCollection",
                features: res
            }
            let data = map.fromLngLat(features);
            let bounds = vjcommon.getGeoJsonBounds(data).scale(1.01); // Slightly enlarge
            param.objectIds = objectIds.join("||");
            param.objectBounds = `[${bounds.toString()}]`;
            param.layeron = layeron;
            return param;
        }
        let app = new Vue({
            el: '#ui',
            data: {
                form: {
                    objectIds: '',
                    objectBounds: '',
                    method: "matchPattern",
                    maxCount: 200,
                    score: 0.6,
                    size: 10000,
                    canOverlap: false,
                    maxOverlap: 0.3,
                    toleranceAngle: 180,
                    layer: "",
                    layeron: ""
                }
            },
            methods: {
                matchObjectCmd() {
                    matchObject(this.form);
                },
                async select(isPoint) {
                    let result = await selectFeature(isPoint);
                    if (!result) return;
                    this.form.objectIds = result.objectIds;
                    this.form.objectBounds = result.objectBounds;
                    this.form.layeron = result.layeron;
                }
            },
            template: `
              <template>
                <div style="position: absolute; z-index: 2;left:10px; top:10px">
                  <el-row>
                    <el-form  :model="form" label-width="80px" style="background: white;margin:3px" size="mini">
                      <el-form-item label="Match entity">
                        <el-button type="primary" @click="()=>select(false)">Box select</el-button>
                        <el-button type="primary" @click="()=>select(true)">Point select</el-button>
                      </el-form-item>
                      <el-form-item label="Entity ID">
                        <el-input v-model="form.objectIds"></el-input>
                      </el-form-item>
                       <el-form-item label="Match method">
                        <el-radio v-model="form.method" label="matchPattern">Method 1</el-radio>
                        <el-radio v-model="form.method" label="matchTemplate">Method 2</el-radio>
                      </el-form-item>
                      <el-form-item label="Match score">
                        <el-tooltip class="item" effect="dark" content="Range 0.1-1; higher value means stricter match" placement="right">
                          <el-input v-model="form.score"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="Max count">
                        <el-tooltip class="item" effect="dark" content="Maximum number of records to return" placement="right">
                          <el-input v-model="form.maxCount"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="Allow overlap">
                        <el-tooltip class="item" effect="dark" content="Whether matched entities may overlap" placement="right">
                          <el-checkbox v-model="form.canOverlap">Yes</el-checkbox>
                        </el-tooltip>
                      </el-form-item>
                       <el-form-item label="Overlap ratio">
                        <el-tooltip class="item" effect="dark" content="Overlap ratio range (0-0.8), default 0.3" placement="right">
                          <el-input v-model="form.maxOverlap"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="Angle range">
                        <el-tooltip class="item" effect="dark" content="Angle range (-180, 180) for rotation; applies to matchPattern, default 180" placement="right">
                          <el-input v-model="form.toleranceAngle"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="Style name">
                        <el-tooltip class="item" effect="dark" content="Layer style name; empty uses selected entity layer" placement="right">
                          <el-input v-model="form.layer"></el-input>
                        </el-tooltip>
                      </el-form-item>
                       <el-form-item label="Match layer">
                        <el-tooltip class="item" effect="dark" content="Layers to open for target match" placement="right">
                          <el-input v-model="form.layeron"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="Match size">
                        <el-tooltip class="item" effect="dark" content="Image size for match, default 10000" placement="right">
                          <el-input v-model="form.size"></el-input>
                        </el-tooltip>
                      </el-form-item>
                       <el-form-item size="large">
                        <el-button type="success" @click="matchObjectCmd">Object detection</el-button>
                      </el-form-item>
                    </el-form>
                  </el-row>
                </div>
              </template>
            `
        })
        
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