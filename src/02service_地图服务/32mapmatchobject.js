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
        // --实体目标检测--通过分析图像的方式，对选择的图像进行目标检测，查找相似的实体范围。
        // 注意：通过图像目标检测去查找相似图形，只是一种手段，一般情况下建议用后台空间查询的方式，精确查找相似的实体。
        // 如示例 https://vjmap.com/demo/#/demo/map/service/22findcircledrawbounds
        // 新建地图服务对象，传入服务地址和token
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        // 打开地图
        let res = await svc.openMap({
            mapid: env.exampleMapId, // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
            mapopenway: vjmap.MapOpenWay.GeomRender, // 以几何数据渲染方式打开
            style: vjmap.openMapDarkStyle() // div为深色背景颜色时，这里也传深色背景样式
        })
        if (res.error) {
            message.error(res.error)
        }
        // 获取地图的范围
        let mapExtent = vjmap.GeoBounds.fromString(res.bounds);
        // 建立坐标系
        let prj = new vjmap.GeoProjection(mapExtent);
        
        // 新建地图对象
        let map = new vjmap.Map({
            container: 'map', // container ID
            style: svc.rasterStyle(), // 栅格瓦片样式
            center: [21.08081675060015, 16.22507363215631] ,// 中心点
            zoom: 5,
            renderWorldCopies: false
        });
        // 地图关联服务对象和坐标系
        map.attach(svc, prj);
        await map.onLoad();
        
        
        if (typeof Vue !== "object") {
            // 如果没有vue和elementui环境
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
            message.info("正在图中查找匹配的实体，请稍候...")
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
            message.info(`共找到 ${geoDatas.length} 个匹配的对象。`)
        }
        
        const selectFeature = async (isPoint) => {
            message.info("请选择实体，按右键结束选择")
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
            let bounds = vjcommon.getGeoJsonBounds(data).scale(1.01); // 稍放大点
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
                      <el-form-item label="匹配实体">
                        <el-button type="primary" @click="()=>select(false)">框选实体</el-button>
                        <el-button type="primary" @click="()=>select(true)">点选实体</el-button>
                      </el-form-item>
                      <el-form-item label="实体ID">
                        <el-input v-model="form.objectIds"></el-input>
                      </el-form-item>
                       <el-form-item label="匹配方法">
                        <el-radio v-model="form.method" label="matchPattern">方法一</el-radio>
                        <el-radio v-model="form.method" label="matchTemplate">方法二</el-radio>
                      </el-form-item>
                      <el-form-item label="匹配分数">
                        <el-tooltip class="item" effect="dark" content="范围0.1-1，匹配分数，值越大，要求的匹配精度就越高" placement="right">
                          <el-input v-model="form.score"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="记录总数">
                        <el-tooltip class="item" effect="dark" content="返回记录的最大总数" placement="right">
                          <el-input v-model="form.maxCount"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="允许重叠">
                        <el-tooltip class="item" effect="dark" content="匹配的实体是否会重叠。" placement="right">
                          <el-checkbox v-model="form.canOverlap">是</el-checkbox>
                        </el-tooltip>
                      </el-form-item>
                       <el-form-item label="重叠比例">
                        <el-tooltip class="item" effect="dark" content="重叠比例 范围(0-0.8)，默认 0.3" placement="right">
                          <el-input v-model="form.maxOverlap"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="角度范围">
                        <el-tooltip class="item" effect="dark" content="角度范围(-180, 180)有旋转的时候需要。方法为matchPattern有效. 默认180" placement="right">
                          <el-input v-model="form.toleranceAngle"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="样式名称">
                        <el-tooltip class="item" effect="dark" content="图层样式名.为空时，将由选择的实体的图层来决定" placement="right">
                          <el-input v-model="form.layer"></el-input>
                        </el-tooltip>
                      </el-form-item>
                       <el-form-item label="匹配图层">
                        <el-tooltip class="item" effect="dark" content="目标匹配的地图打开的图层" placement="right">
                          <el-input v-model="form.layeron"></el-input>
                        </el-tooltip>
                      </el-form-item>
                      <el-form-item label="匹配尺寸">
                        <el-tooltip class="item" effect="dark" content="匹配时的图像尺寸，默认10000" placement="right">
                          <el-input v-model="form.size"></el-input>
                        </el-tooltip>
                      </el-form-item>
                       <el-form-item size="large">
                        <el-button type="success" @click="matchObjectCmd">目标检测</el-button>
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