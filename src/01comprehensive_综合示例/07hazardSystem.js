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
        // 在线效果查看地址: https://vjmap.com/demo/#/demo/map/comprehensive/07hazardSystem
        // --隐患管理系统示例--在CAD图标注出隐患点查看管理
        let svc = new vjmap.Service(env.serviceUrl, env.accessToken)
        let res = await svc.openMap({
            mapid: env.exampleMapId,
            mapopenway: vjmap.MapOpenWay.GeomRender,
            style: vjmap.openMapDarkStyle()
        })
        if (res.error) {
            message.error(res.error)
        }
        let prj = new vjmap.GeoProjection(res.bounds);
        
        let map = new vjmap.Map({
            container: 'map',
            style: svc.rasterStyle(),
            center: prj.toLngLat(prj.getMapExtent().center()),
            zoom: 2,
            pitch: 0,
            renderWorldCopies: false,
            doubleClickZoom: false
        });
        
        map.attach(svc, prj);
        await map.onLoad();
        let mapBounds = map.getGeoBounds(0.6);
        
        
        // ═══════════════════════════════════════════
        // 加载 Vue3
        // ═══════════════════════════════════════════
        if (typeof Vue !== "object" || Vue.version.substring(0, 1) != "3") {
            await vjmap.addScript([{ src: "../../js/vue@3.js" }]);
        }
        
        // ═══════════════════════════════════════════
        // 数据配置
        // ═══════════════════════════════════════════
        const HAZARD_TYPES = ['一般隐患', '重大隐患'];
        const HAZARD_LEVELS = { A: '重大', B: '较大', C: '一般' };
        const PROFESSIONS = ['消防安全', '电气安全', '机械安全', '化学品管理', '高处作业', '环保安全'];
        const STATUS_LIST = ['未整改', '整改中', '已整改'];
        
        const HAZARD_TYPE_CONFIG = {
            '一般隐患': { color: '#f59e0b', pulse: false },
            '重大隐患': { color: '#ef4444', pulse: true },
        };
        const STATUS_CONFIG = {
            '未整改': { color: '#ef4444', label: '未整改' },
            '整改中': { color: '#f59e0b', label: '整改中' },
            '已整改': { color: '#22c55e', label: '已整改' },
        };
        function createMarkerIcon(innerSvg, scale) {
            var iconScale = scale || 0.84;
            var inset = ((24 - 24 * iconScale) / 2).toFixed(2);
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<g transform="translate(' + inset + ' ' + inset + ') scale(' + iconScale + ')">' +
                innerSvg +
                '</g></svg>';
        }
        
        const PROFESSION_ICONS = {
            '消防安全': createMarkerIcon('<path d="M12 2c1.2 2.8 4.5 5.8 4.5 10a4.5 4.5 0 0 1-9 0C7.5 7.8 10.8 4.8 12 2z"/><path d="M12 13c1.1 1 2 2 2 3.3a2 2 0 0 1-4 0c0-1.3.9-2.3 2-3.3z"/>', 0.8),
            '电气安全': createMarkerIcon('<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>', 0.82),
            '机械安全': createMarkerIcon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', 0.74),
            '化学品管理': createMarkerIcon('<path d="M9 3h6"/><path d="M10 3v5l-4 8.5A2 2 0 0 0 7.8 20h8.4a2 2 0 0 0 1.8-3.5L14 8V3"/><path d="M10 13h4"/>', 0.78),
            '高处作业': createMarkerIcon('<path d="M12 3L3 20h18L12 3z"/><path d="M12 9v4"/><path d="M12 16h.01"/>', 0.8),
            '环保安全': createMarkerIcon('<path d="M7 14c0-5 4-9 9-10 0 5-2 11-8 13-3 1-5-1-5-4 0-2 1-4 4-5"/><path d="M9 15c1.5 0 3-1 4-2.5"/>', 0.78),
        };
        
        const LOCATIONS = [
            'A栋生产车间', 'B栋仓储区', 'C栋办公楼', '动力站房',
            '配电房', '锅炉房', '化学品仓库', '成品仓库',
            '污水处理站', '食堂区域', '停车场', '门卫室',
            '研发实验室', '质检中心', '装卸平台', '消防控制室',
        ];
        const DESCRIPTIONS = {
            '消防安全': [
                '灭火器过期未更换，压力表指示不在绿色区域',
                '消防通道堆放杂物，影响紧急疏散',
                '自动喷淋系统管道锈蚀，部分喷头堵塞',
                '消防应急灯损坏，安全出口标识不清',
            ],
            '电气安全': [
                '配电柜内接线凌乱，线缆标识缺失',
                '电气设备外壳未接地，漏电保护器失效',
                '电缆桥架内电缆堆积过密，散热不良',
                '临时用电未办理审批手续，拖线板串联使用',
            ],
            '机械安全': [
                '冲压设备安全防护罩缺失，操作人员有夹伤风险',
                '传动皮带无防护网，旋转部件裸露',
                '叉车转弯处无警示镜和警示标线',
                '起重设备钢丝绳磨损超标，未及时更换',
            ],
            '化学品管理': [
                '危化品存储区未设置围堰，无泄漏应急物资',
                '化学品标签脱落，MSDS资料不齐全',
                '酸碱类化学品混放，未按相容性分区存储',
                '废弃化学品容器未按危废管理要求处置',
            ],
            '高处作业': [
                '脚手架搭设不规范，缺少防坠落网',
                '高处作业人员未佩戴安全带',
                '屋顶检修通道护栏松动，有坠落风险',
                '登高梯具损坏，防滑措施不到位',
            ],
            '环保安全': [
                '废气排放口在线监测设备故障，数据缺失',
                '危废暂存间标识不规范，台账记录不完整',
                '雨污分流不彻底，存在混排现象',
                '噪声超标区域未设置警示标识和防护措施',
            ],
        };
        const DEPTS = ['生产部', '安全环保部', '设备部', '仓储物流部', '行政部', '质量部'];
        const LEADERS = ['张明', '李华', '王强', '赵刚', '孙磊', '刘洋'];
        const CAPTAINS = ['陈建国', '杨志远', '周伟', '吴刚', '郑涛', '冯军'];
        const GROUP_LEADERS = ['黄磊', '林峰', '何勇', '马超', '罗斌', '谢辉'];
        const HANDLERS = ['朱明', '钱伟', '孙强', '李磊', '周杰', '吴斌'];
        const SOURCES = ['安全巡检', '专项检查', '隐患排查', '员工上报', '政府检查', '第三方审核'];
        const RECTIFY_MAP = {
            '消防安全': ['立即更换过期灭火器', '清理消防通道杂物', '检修喷淋系统', '更换应急灯和标识'],
            '电气安全': ['整理配电柜接线并标识', '安装接地装置和漏保', '疏理电缆桥架', '规范临时用电管理'],
            '机械安全': ['安装安全防护罩', '加装传动部件防护网', '设置转弯警示设施', '更换磨损钢丝绳'],
            '化学品管理': ['建设围堰并配备应急物资', '补齐标签和MSDS', '按相容性重新分区', '规范危废处置流程'],
            '高处作业': ['整改脚手架搭设', '配发并强制佩戴安全带', '加固屋顶护栏', '更换登高梯具'],
            '环保安全': ['修复在线监测设备', '规范危废暂存间管理', '整改雨污分流系统', '设置噪声警示和防护'],
        };
        const SCENE_PHOTOS = [
            'https://picsum.photos/seed/hz1/400/300',
            'https://picsum.photos/seed/hz2/400/300',
            'https://picsum.photos/seed/hz3/400/300',
        ];
        const RECTIFY_PHOTOS = [
            'https://picsum.photos/seed/rt1/400/300',
            'https://picsum.photos/seed/rt2/400/300',
        ];
        
        function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function randomDate() {
            const y = 2025 + Math.floor(Math.random() * 2);
            const m = String(randInt(1, 12)).padStart(2, '0');
            const d = String(randInt(1, 28)).padStart(2, '0');
            return `${y}/${m}/${d}`;
        }
        
        // ═══════════════════════════════════════════
        // 生成区域
        // ═══════════════════════════════════════════
        function generateAreaZones(bounds) {
            const { min, max } = bounds;
            const w = max.x - min.x, h = max.y - min.y;
            const cx = min.x + w / 2, cy = min.y + h / 2;
            const mg = 0.08;
            const x0 = min.x + w * mg, x1 = cx, x2 = max.x - w * mg;
            const y0 = min.y + h * mg, y1 = cy, y2 = max.y - h * mg;
            return [
                { name: '生产车间', color: 'rgba(59,130,246,0.15)', polygon: [[x0, y1], [x0, y2], [x1, y2], [x1, y1]], center: [(x0 + x1) / 2, (y1 + y2) / 2] },
                { name: '仓储区域', color: 'rgba(168,85,247,0.15)', polygon: [[x1, y1], [x1, y2], [x2, y2], [x2, y1]], center: [(x1 + x2) / 2, (y1 + y2) / 2] },
                { name: '办公区域', color: 'rgba(234,179,8,0.15)', polygon: [[x0, y0], [x0, y1], [cx, y1], [cx, y0]], center: [(x0 + cx) / 2, (y0 + y1) / 2] },
                { name: '公用设施', color: 'rgba(34,197,94,0.15)', polygon: [[cx, y0], [cx, y1], [x2, y1], [x2, y0]], center: [(cx + x2) / 2, (y0 + y1) / 2] },
            ];
        }
        
        // ═══════════════════════════════════════════
        // 生成隐患数据
        // ═══════════════════════════════════════════
        function generateHazardData(bounds, count = 40) {
            const zones = generateAreaZones(bounds);
            const items = [];
            for (let i = 0; i < count; i++) {
                const profession = randItem(PROFESSIONS);
                const isSerious = Math.random() < 0.25;
                const hazardType = isSerious ? '重大隐患' : '一般隐患';
                const hazardLevel = isSerious ? 'A' : (Math.random() < 0.5 ? 'B' : 'C');
                const sr = Math.random();
                const status = sr < 0.35 ? '未整改' : sr < 0.65 ? '整改中' : '已整改';
                const zone = zones[i % zones.length];
                const poly = zone.polygon;
                const px = poly[0][0] + Math.random() * (poly[2][0] - poly[0][0]);
                const py = poly[0][1] + Math.random() * (poly[2][1] - poly[0][1]);
                items.push({
                    id: `YH-${String(i + 1).padStart(4, '0')}`,
                    inspectionDate: randomDate(),
                    hazardType, hazardLevel,
                    hazardLocation: `${zone.name} - ${randItem(LOCATIONS)}`,
                    hazardProfession: profession,
                    hazardDescription: randItem(DESCRIPTIONS[profession]),
                    infoSource: randItem(SOURCES),
                    responsibleDept: randItem(DEPTS),
                    managementLeader: randItem(LEADERS),
                    teamLeader: randItem(CAPTAINS),
                    groupLeader: randItem(GROUP_LEADERS),
                    responsible: randItem(GROUP_LEADERS),
                    rectifyMeasures: randItem(RECTIFY_MAP[profession]),
                    rectifyDeadline: randItem([3, 5, 7, 10, 15, 30]),
                    handler: randItem(HANDLERS),
                    penalty: isSerious ? randInt(1, 10) * 1000 : randInt(0, 5) * 100,
                    point: [px, py],
                    area: zone.name,
                    status,
                    photos: {
                        scene: SCENE_PHOTOS.slice(0, randInt(1, 3)),
                        rectify: status === '已整改' ? RECTIFY_PHOTOS.slice(0, randInt(1, 2)) : [],
                    },
                });
            }
            return items;
        }
        
        // ═══════════════════════════════════════════
        // 注入样式
        // ═══════════════════════════════════════════
        const styleEl = document.createElement('style');
        styleEl.textContent = `
        /* ─── 隐患标记样式 ─── */
        /* 所有子元素全部 absolute 定位，不用 flex，确保布局像素精确 */
        /* 布局: icon-wrap 32x32 在顶部, pin 2x10 紧接其下, 总高 42px */
        .hazard-marker { cursor: pointer; width: 32px; height: 42px; position: relative; overflow: visible; }
        .hazard-marker-inner { position: absolute; top: 0; left: 0; width: 32px; height: 42px; }
        .hazard-icon-wrap {
            position: absolute; top: 0; left: 0;
            width: 32px; height: 32px; border-radius: 50%;
            background: var(--marker-color);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 3px rgba(0,0,0,0.15);
            z-index: 2; transition: transform 0.15s ease;
        }
        .hazard-marker:hover .hazard-icon-wrap { transform: scale(1.15); }
        .hazard-icon { width: 16px; height: 16px; color: #fff; display: flex; align-items: center; justify-content: center; }
        .hazard-icon svg {
            width: 100%;
            height: 100%;
            display: block;
            overflow: visible;
            shape-rendering: geometricPrecision;
        }
        .hazard-pin {
            position: absolute; top: 32px; left: 15px;
            width: 2px; height: 10px; background: var(--marker-color); z-index: 1;
        }
        .hazard-pin::after {
            content: ''; position: absolute; bottom: -3px; left: 50%; transform: translateX(-50%);
            width: 6px; height: 6px; border-radius: 50%; background: var(--marker-color); opacity: 0.5;
        }
        .hazard-status-dot {
            position: absolute; top: -2px; right: -2px;
            width: 10px; height: 10px; border-radius: 50%;
            background: var(--status-color); border: 2px solid rgba(10,22,40,0.9); z-index: 3;
        }
        .hazard-pulse {
            position: absolute; top: 16px; left: 16px; transform: translate(-50%,-50%);
            width: 32px; height: 32px; border-radius: 50%; z-index: 0;
            pointer-events: none;
        }
        .hazard-pulse::before, .hazard-pulse::after {
            content: ''; position: absolute; inset: 0; border-radius: 50%;
            background: var(--marker-color); opacity: 0; animation: hazardPulse 2s ease-out infinite;
        }
        .hazard-pulse::after { animation-delay: 1s; }
        @keyframes hazardPulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(2.5); opacity: 0; }
        }
        
        /* ─── vjmap弹窗覆盖 ─── */
        .vjmapgis-popup-content {
            background: rgba(10,22,40,0.92) !important; color: #e2e8f0 !important;
            border: 1px solid rgba(0,212,255,0.2) !important; border-radius: 8px !important;
            padding: 8px 12px !important; font-size: 13px !important;
            box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important;
        }
        .vjmapgis-popup-tip { border-top-color: rgba(10,22,40,0.92) !important; }
        
        /* ─── 全局UI ─── */
        .hz-app * { box-sizing: border-box; margin: 0; padding: 0; }
        .hz-app {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #e2e8f0; line-height: 1.5; font-size: 13px;
        }
        
        /* ─── 侧边面板 ─── */
        .side-panel {
            position: fixed; top: 12px; left: 12px; bottom: 12px; width: 280px;
            z-index: 10; display: flex; flex-direction: column;
            transition: width 0.3s ease;
        }
        .side-panel.collapsed { width: 36px; }
        .toggle-btn {
            position: absolute; top: 12px; right: -16px; z-index: 11;
            width: 32px; height: 32px; border-radius: 50%;
            background: rgba(10,22,40,0.9); border: 1px solid rgba(0,212,255,0.3);
            color: #94a3b8; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s; padding: 0;
        }
        .toggle-btn:hover { color: #00d4ff; border-color: #00d4ff; }
        .panel-content {
            flex: 1; background: rgba(10,22,40,0.85);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(0,212,255,0.15); border-radius: 12px;
            padding: 20px 16px; overflow-y: auto; overflow-x: hidden;
        }
        .panel-content::-webkit-scrollbar { width: 4px; }
        .panel-content::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
        .panel-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .panel-header h2 { margin: 0; font-size: 17px; font-weight: 600; color: #e2e8f0; letter-spacing: 1px; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 20px; }
        .stat-card {
            background: rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 8px;
            text-align: center; border: 1px solid rgba(255,255,255,0.06); transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: rgba(0,212,255,0.3); }
        .stat-num { display: block; font-size: 22px; font-weight: 700; line-height: 1.2; }
        .stat-label { display: block; font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .stat-total .stat-num { color: #00d4ff; }
        .stat-normal .stat-num { color: #f59e0b; }
        .stat-serious .stat-num { color: #ef4444; }
        .stat-pending .stat-num { color: #ef4444; }
        .stat-fixing .stat-num { color: #f59e0b; }
        .stat-fixed .stat-num { color: #22c55e; }
        
        .filter-section { margin-bottom: 16px; }
        .filter-title {
            font-size: 12px; color: #64748b; text-transform: uppercase;
            letter-spacing: 1px; margin: 0 0 8px 0; padding-bottom: 6px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .filter-group { display: flex; flex-wrap: wrap; gap: 6px; }
        .filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .filter-check {
            display: flex; align-items: center; gap: 6px; font-size: 13px; color: #cbd5e1;
            cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.15s; user-select: none;
        }
        .filter-check:hover { background: rgba(255,255,255,0.05); }
        .filter-check input { display: none; }
        .check-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; opacity: 1; transition: opacity 0.15s; }
        .filter-check input:not(:checked) ~ .check-dot { opacity: 0.3; }
        .check-indicator {
            width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid #475569;
            flex-shrink: 0; position: relative; transition: all 0.15s;
        }
        .filter-check input:checked ~ .check-indicator { background: #00d4ff; border-color: #00d4ff; }
        .filter-check input:checked ~ .check-indicator::after {
            content: ''; position: absolute; left: 3px; top: 1px;
            width: 5px; height: 8px; border: solid #0a1628; border-width: 0 2px 2px 0; transform: rotate(45deg);
        }
        .filter-check input:not(:checked) ~ span:last-child { opacity: 0.5; }
        
        .area-list { display: flex; flex-direction: column; gap: 4px; }
        .area-item {
            display: flex; align-items: center; gap: 8px; padding: 8px 10px;
            border-radius: 8px; cursor: pointer; transition: background 0.15s;
        }
        .area-item:hover { background: rgba(0,212,255,0.08); }
        .area-color { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
        .area-name { flex: 1; font-size: 13px; color: #cbd5e1; }
        .area-count { font-size: 14px; font-weight: 600; color: #00d4ff; min-width: 24px; text-align: right; }
        .area-arrow { color: #475569; flex-shrink: 0; }
        
        /* ─── 图例面板 ─── */
        .legend-panel {
            position: fixed; bottom: 16px; right: 16px; z-index: 10; min-width: 200px;
            background: rgba(10,22,40,0.85); backdrop-filter: blur(16px);
            border: 1px solid rgba(0,212,255,0.15); border-radius: 10px; overflow: hidden;
        }
        .legend-header {
            display: flex; align-items: center; gap: 8px; padding: 10px 14px;
            cursor: pointer; color: #94a3b8; font-size: 13px; font-weight: 500; user-select: none;
        }
        .legend-header:hover { color: #e2e8f0; }
        .chevron { margin-left: auto; transition: transform 0.2s; }
        .chevron.flipped { transform: rotate(180deg); }
        .legend-body { padding: 0 14px 12px; }
        .legend-group { margin-bottom: 10px; }
        .legend-group:last-child { margin-bottom: 0; }
        .legend-group-title {
            font-size: 11px; color: #475569; letter-spacing: 0.5px; margin-bottom: 6px;
            padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .legend-items { display: flex; flex-wrap: wrap; gap: 6px; }
        .legend-items-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .legend-icon { width: 14px; height: 14px; flex-shrink: 0; color: #64748b; }
        .legend-icon svg { width: 100%; height: 100%; }
        .pulse-hint {
            font-size: 10px; color: #475569; padding: 0 4px;
            border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;
        }
        
        /* ─── 详情弹窗 ─── */
        .detail-overlay {
            position: fixed; inset: 0; z-index: 100;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .detail-panel {
            width: 520px; max-height: 85vh;
            background: rgba(10,22,40,0.95); backdrop-filter: blur(20px);
            border: 1px solid rgba(0,212,255,0.2); border-radius: 16px;
            overflow: hidden; display: flex; flex-direction: column; animation: slideUp 0.25s ease;
        }
        .detail-header {
            position: relative; padding: 20px 20px 12px;
            background: linear-gradient(135deg, rgba(0,212,255,0.08), transparent);
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .detail-title-row { display: flex; align-items: center; gap: 10px; }
        .type-badge { padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #fff; }
        .detail-title-row h3 { margin: 0; font-size: 18px; color: #e2e8f0; font-weight: 600; }
        .status-tag { font-size: 12px; padding: 2px 8px; border: 1px solid; border-radius: 4px; margin-left: auto; margin-right: 76px; }
        .detail-location { margin: 6px 0 0; font-size: 13px; color: #64748b; }
        .close-btn, .locate-btn {
            position: absolute; top: 16px; width: 32px; height: 32px; border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
            color: #94a3b8; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.15s; padding: 0;
        }
        .close-btn { right: 16px; }
        .locate-btn { right: 56px; }
        .close-btn:hover, .locate-btn:hover { color: #00d4ff; border-color: rgba(0,212,255,0.4); background: rgba(0,212,255,0.1); }
        
        .desc-box { padding: 12px 20px; background: rgba(255,255,255,0.02); }
        .desc-box p { margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.7; }
        
        .tab-bar { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 20px; }
        .tab-bar button {
            padding: 10px 16px; font-size: 13px; color: #64748b;
            background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s;
        }
        .tab-bar button.active { color: #00d4ff; border-bottom-color: #00d4ff; }
        .tab-bar button:hover:not(.active) { color: #94a3b8; }
        
        .tab-content { flex: 1; overflow-y: auto; padding: 16px 20px 20px; }
        .tab-content::-webkit-scrollbar { width: 4px; }
        .tab-content::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.15); border-radius: 2px; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
        .info-row { display: flex; flex-direction: column; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; }
        .info-row-full { grid-column: 1 / -1; }
        .info-label { font-size: 11px; color: #475569; margin-bottom: 2px; }
        .info-value { font-size: 13px; color: #cbd5e1; word-break: break-all; }
        
        .photo-section { margin-bottom: 16px; }
        .photo-section h4 { font-size: 13px; color: #64748b; margin: 0 0 8px; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap: 8px; }
        .photo-item { border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); aspect-ratio: 4/3; }
        .photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .no-data { font-size: 13px; color: #475569; text-align: center; padding: 20px; }
        
        .hazard-card-print { border: 1px solid rgba(0,212,255,0.2); border-radius: 8px; overflow: hidden; }
        .card-title-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 16px; background: rgba(0,212,255,0.06); border-bottom: 1px solid rgba(0,212,255,0.15);
        }
        .card-title-row h4 { margin: 0; font-size: 15px; color: #e2e8f0; }
        .card-title-row span { font-size: 12px; color: #64748b; }
        .card-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .card-table td { padding: 8px 12px; border: 1px solid rgba(255,255,255,0.06); color: #cbd5e1; }
        .td-label { color: #64748b; width: 80px; white-space: nowrap; background: rgba(255,255,255,0.02); }
        
        /* ─── 区域编辑按钮 ─── */
        .area-actions { display: flex; gap: 4px; flex-shrink: 0; }
        .area-action-btn {
            width: 24px; height: 24px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04); color: #64748b; display: flex;
            align-items: center; justify-content: center; cursor: pointer;
            transition: all 0.15s; padding: 0;
        }
        .area-action-btn:hover { color: #00d4ff; border-color: rgba(0,212,255,0.4); background: rgba(0,212,255,0.1); }
        .area-action-btn.danger:hover { color: #ef4444; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.1); }
        .add-area-btn {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            width: 100%; padding: 8px; margin-top: 8px; border-radius: 8px;
            border: 1px dashed rgba(0,212,255,0.3); background: rgba(0,212,255,0.04);
            color: #00d4ff; font-size: 13px; cursor: pointer; transition: all 0.15s;
        }
        .add-area-btn:hover { background: rgba(0,212,255,0.1); border-color: #00d4ff; }
        .add-area-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        
        /* ─── 区域名称对话框 ─── */
        .area-dialog-overlay {
            position: fixed; inset: 0; z-index: 200;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); animation: fadeIn 0.15s ease;
        }
        .area-dialog {
            width: 360px; background: rgba(10,22,40,0.95); backdrop-filter: blur(20px);
            border: 1px solid rgba(0,212,255,0.2); border-radius: 12px; padding: 24px;
            animation: slideUp 0.2s ease;
        }
        .area-dialog h3 { margin: 0 0 16px; font-size: 16px; color: #e2e8f0; }
        .area-dialog-input {
            width: 100%; padding: 10px 14px; border-radius: 8px; font-size: 14px;
            border: 1px solid rgba(0,212,255,0.2); background: rgba(255,255,255,0.05);
            color: #e2e8f0; outline: none; transition: border-color 0.15s;
            box-sizing: border-box;
        }
        .area-dialog-input:focus { border-color: #00d4ff; }
        .area-dialog-btns { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }
        .area-dialog-btns button {
            padding: 8px 20px; border-radius: 6px; font-size: 13px; cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1); transition: all 0.15s;
        }
        .area-dialog-btns .btn-cancel { background: rgba(255,255,255,0.05); color: #94a3b8; }
        .area-dialog-btns .btn-cancel:hover { background: rgba(255,255,255,0.1); }
        .area-dialog-btns .btn-confirm { background: #00d4ff; color: #0a1628; border-color: #00d4ff; font-weight: 600; }
        .area-dialog-btns .btn-confirm:hover { background: #22d3ee; }
        .area-dialog-btns .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
        `;
        document.head.appendChild(styleEl);
        
        // ═══════════════════════════════════════════
        // 初始化隐患图层
        // ═══════════════════════════════════════════
        const areas = Vue.reactive(generateAreaZones(mapBounds));
        const hazards = generateHazardData(mapBounds, 40);
        const markerMap = new Map();
        
        const filters = Vue.reactive({
            types: new Set(HAZARD_TYPES),
            professions: new Set(PROFESSIONS),
            statuses: new Set(STATUS_LIST),
            areas: new Set(areas.map(a => a.name)),
        });
        
        // 区域多边形 & 标签（可动态增删改）
        const areaPolygonObjs = new window.Map();
        const areaLabelObjs = new window.Map();
        const AREA_COLORS = [
            'rgba(59,130,246,0.15)', 'rgba(168,85,247,0.15)',
            'rgba(234,179,8,0.15)', 'rgba(34,197,94,0.15)',
            'rgba(236,72,153,0.15)', 'rgba(99,102,241,0.15)',
            'rgba(20,184,166,0.15)', 'rgba(249,115,22,0.15)',
        ];
        
        function addAreaToMap(zone) {
            const polygon = new vjmap.Polygon({
                data: map.toLngLat(zone.polygon),
                fillColor: zone.color,
                fillOpacity: 0.5,
                fillOutlineColor: zone.color.replace(/[\d.]+\)$/, '0.8)'),
                isHoverPointer: false,
                isHoverFeatureState: false,
            });
            polygon.addTo(map);
            areaPolygonObjs.set(zone.name, polygon);
        
            const count = hazards.filter(function (h) { return h.area === zone.name; }).length;
            const text = new vjmap.Text({
                text: zone.name + '\n' + count + ' 个隐患',
                anchor: 'center',
                offset: [0, 0],
                style: {
                    'cursor': 'default', 'padding': '8px 14px', 'border-radius': '8px',
                    'background-color': 'rgba(10,22,40,0.75)', 'backdrop-filter': 'blur(4px)',
                    'border': '1px solid ' + zone.color.replace(/[\d.]+\)$/, '0.4)'),
                    'text-align': 'center', 'font-size': '13px', 'color': '#e2e8f0',
                    'white-space': 'pre-line', 'line-height': '1.6', 'pointer-events': 'none',
                },
            });
            text.setLngLat(map.toLngLat(vjmap.geoPoint(zone.center)));
            text.addTo(map);
            areaLabelObjs.set(zone.name, text);
        }
        
        function removeAreaFromMap(areaName) {
            var poly = areaPolygonObjs.get(areaName);
            if (poly) { poly.remove(); areaPolygonObjs.delete(areaName); }
            var label = areaLabelObjs.get(areaName);
            if (label) { label.remove(); areaLabelObjs.delete(areaName); }
        }
        
        function refreshAreaLabel(zone) {
            var label = areaLabelObjs.get(zone.name);
            if (label) {
                var count = getFilteredHazards().filter(function (h) { return h.area === zone.name; }).length;
                label.setText(zone.name + '\n' + count + ' 个隐患');
            }
        }
        
        areas.forEach(function (zone) { addAreaToMap(zone); });
        
        // 隐患标记
        const selectedHazard = Vue.ref(null);
        
        hazards.forEach(hazard => {
            const config = HAZARD_TYPE_CONFIG[hazard.hazardType];
            const statusCfg = STATUS_CONFIG[hazard.status];
            const icon = PROFESSION_ICONS[hazard.hazardProfession] || PROFESSION_ICONS['环保安全'];
            const elMarker = document.createElement('div');
            // 自定义Marker缩放时保持位置不动的关键：
            // 1. 外层用一个空div(elMarker)包裹自定义内容，传给Marker的element参数
            // 2. anchor设为'bottom'，使地图坐标点锚定在DOM底部（即针脚尖端）
            // 这样无论缩放级别如何变化，针脚底部始终对准地图上的精确坐标点
            const el = document.createElement('div');
            el.className = 'hazard-marker';
            el.innerHTML = `
                <div class="hazard-marker-inner" style="--marker-color:${config.color};--status-color:${statusCfg.color}">
                    ${config.pulse ? '<div class="hazard-pulse"></div>' : ''}
                    <div class="hazard-icon-wrap"><div class="hazard-icon">${icon}</div></div>
                    <div class="hazard-pin"></div>
                    <div class="hazard-status-dot" title="${hazard.status}"></div>
                </div>
            `;
            elMarker.appendChild(el);
            const marker = new vjmap.Marker({ element: elMarker, anchor: 'bottom' });
            marker.setLngLat(map.toLngLat(vjmap.geoPoint(hazard.point)));
            marker.addTo(map);
            marker.getElement().addEventListener('click', (e) => {
                e.stopPropagation();
                selectedHazard.value = hazard;
            });
            markerMap.set(hazard.id, marker);
        });
        
        // 过滤逻辑
        function getFilteredHazards() {
            return hazards.filter(h =>
                filters.types.has(h.hazardType) &&
                filters.professions.has(h.hazardProfession) &&
                filters.statuses.has(h.status) &&
                filters.areas.has(h.area)
            );
        }
        function applyFilters() {
            const visible = new Set(getFilteredHazards().map(function (h) { return h.id; }));
            markerMap.forEach(function (marker, id) {
                marker.getElement().style.display = visible.has(id) ? '' : 'none';
            });
            areas.forEach(function (zone) { refreshAreaLabel(zone); });
        }
        function flyToArea(areaName) {
            const zone = areas.find(a => a.name === areaName);
            if (!zone) return;
            const poly = zone.polygon;
            const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
            map.fitBounds(
                [map.toLngLat(vjmap.geoPoint([Math.min(...xs), Math.min(...ys)])),
                map.toLngLat(vjmap.geoPoint([Math.max(...xs), Math.max(...ys)]))],
                { padding: 60, duration: 800 }
            );
        }
        function flyToHazard(hazardId) {
            const h = hazards.find(h => h.id === hazardId);
            if (!h) return;
            map.flyTo({ center: map.toLngLat(vjmap.geoPoint(h.point)), zoom: 4, duration: 600 });
        }
        
        // ═══════════════════════════════════════════
        // 区域绘制/编辑/删除
        // ═══════════════════════════════════════════
        const isDrawing = Vue.ref(false);
        const editingArea = Vue.ref(null);
        const showAreaDialog = Vue.ref(false);
        const areaDialogName = Vue.ref('');
        const areaDialogIsEdit = Vue.ref(false);
        let pendingPolygonCoords = null;
        
        const drawOpts = vjmap.Draw.defaultOptions();
        drawOpts.isActionDrawMode = true;
        const areaDraw = new vjmap.Draw.Tool(drawOpts);
        map.addControl(areaDraw, 'top-right');
        
        let areaEditResolve = null;
        
        function finishAreaEdit(confirmed) {
            if (!areaEditResolve) return;
            areaEditResolve(confirmed);
            areaEditResolve = null;
        }
        
        const drawOptions = {
            contextMenu: function (e) {
                new vjmap.ContextMenu({
                    event: e.event.originalEvent,
                    theme: "dark",
                    width: "180px",
                    items: [
                        {
                            label: '确认完成',
                            onClick: function () { map.fire("keyup", { keyCode: 13 }); }
                        },
                        {
                            label: '取消绘制',
                            onClick: function () { map.fire("keyup", { keyCode: 27 }); }
                        }
                    ]
                });
            }
        };
        
        async function drawNewArea() {
            if (isDrawing.value) return;
            isDrawing.value = true;
            map.logInfo("请在地图上绘制新区域多边形，右键确认/取消", "info", 5000);
            try {
                var result = await vjmap.Draw.actionDrawPolygon(map, drawOptions);
                if (result.cancel) {
                    isDrawing.value = false;
                    return;
                }
                var lngLatCoords = result.features[0].geometry.coordinates[0];
                pendingPolygonCoords = lngLatCoords.map(function (c) {
                    var pt = map.fromLngLat(vjmap.geoPoint([c[0], c[1]]));
                    return [pt.x, pt.y];
                });
                areaDialogName.value = '';
                areaDialogIsEdit.value = false;
                showAreaDialog.value = true;
            } catch (e) {
                console.error(e);
            }
            isDrawing.value = false;
        }
        
        function confirmAreaDialog() {
            var name = areaDialogName.value.trim();
            if (!name) return;
        
            if (areaDialogIsEdit.value) {
                var oldName = editingArea.value;
                var idx = areas.findIndex(function (a) { return a.name === oldName; });
                if (idx < 0) return;
                removeAreaFromMap(oldName);
                var zone = areas[idx];
                if (pendingPolygonCoords) {
                    zone.polygon = pendingPolygonCoords;
                    var xs = pendingPolygonCoords.map(function (p) { return p[0]; });
                    var ys = pendingPolygonCoords.map(function (p) { return p[1]; });
                    zone.center = [(Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2,
                    (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2];
                }
                if (name !== oldName) {
                    filters.areas.delete(oldName);
                    filters.areas.add(name);
                    hazards.forEach(function (h) { if (h.area === oldName) h.area = name; });
                }
                zone.name = name;
                addAreaToMap(zone);
                editingArea.value = null;
            } else {
                var color = AREA_COLORS[areas.length % AREA_COLORS.length];
                var coords = pendingPolygonCoords;
                var xs2 = coords.map(function (p) { return p[0]; });
                var ys2 = coords.map(function (p) { return p[1]; });
                var newZone = {
                    name: name,
                    color: color,
                    polygon: coords,
                    center: [(Math.min.apply(null, xs2) + Math.max.apply(null, xs2)) / 2,
                    (Math.min.apply(null, ys2) + Math.max.apply(null, ys2)) / 2],
                };
                areas.push(newZone);
                filters.areas.add(name);
                addAreaToMap(newZone);
            }
            pendingPolygonCoords = null;
            showAreaDialog.value = false;
            applyFilters();
        }
        
        async function editAreaShape(areaName) {
            if (isDrawing.value) return;
            var zone = areas.find(function (a) { return a.name === areaName; });
            if (!zone) return;
            isDrawing.value = true;
            editingArea.value = areaName;
            flyToArea(areaName);
        
            var poly = areaPolygonObjs.get(areaName);
            if (poly) poly.remove();
            var label = areaLabelObjs.get(areaName);
            if (label) label.remove();
        
            var lngLatCoords = map.toLngLat(zone.polygon);
            var ring = [];
            for (var i = 0; i < lngLatCoords.length; i++) {
                var c = lngLatCoords[i];
                if (Array.isArray(c)) {
                    ring.push([c[0], c[1]]);
                } else if (c && typeof c === 'object') {
                    ring.push([c.lng !== undefined ? c.lng : c.x, c.lat !== undefined ? c.lat : c.y]);
                }
            }
            if (ring.length > 0) {
                var first = ring[0], last = ring[ring.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    ring.push([first[0], first[1]]);
                }
            }
        
            var feature = {
                type: 'Feature',
                properties: {
                    color: zone.color.replace(/[\d.]+\)$/, '0.6)'),
                    opacity: 0.5
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [ring]
                }
            };
            var featureIds = areaDraw.add(feature);
            var featureId = featureIds[0];
        
            areaDraw.changeMode('simple_select', { featureIds: [featureId] });
            areaDraw.changeMode('direct_select', { featureId: featureId });
        
            map.logInfo("拖拽顶点编辑「" + areaName + "」区域范围，右键确认/取消", "info", 8000);
        
            var editContextMenuHandler = function (e) {
                e.originalEvent.preventDefault();
                new vjmap.ContextMenu({
                    event: e.originalEvent,
                    theme: "dark",
                    width: "180px",
                    items: [
                        {
                            label: '✓ 确认修改',
                            onClick: function () { finishAreaEdit(true); }
                        },
                        {
                            label: '✗ 取消编辑',
                            onClick: function () { finishAreaEdit(false); }
                        }
                    ]
                });
            };
            map.on('contextmenu', editContextMenuHandler);
        
            try {
                var confirmed = await new Promise(function (resolve) {
                    areaEditResolve = resolve;
                });
        
                if (confirmed) {
                    var editedFeature = areaDraw.get(featureId);
                    if (editedFeature) {
                        var editedRing = editedFeature.geometry.coordinates[0];
                        var geoPts = map.fromLngLat(editedRing);
                        pendingPolygonCoords = [];
                        for (var gi = 0; gi < geoPts.length; gi++) {
                            var gp = geoPts[gi];
                            pendingPolygonCoords.push(Array.isArray(gp) ? [gp[0], gp[1]] : [gp.x, gp.y]);
                        }
                        if (pendingPolygonCoords.length > 1) {
                            var f2 = pendingPolygonCoords[0], l2 = pendingPolygonCoords[pendingPolygonCoords.length - 1];
                            if (f2[0] === l2[0] && f2[1] === l2[1]) {
                                pendingPolygonCoords.pop();
                            }
                        }
                        areaDialogName.value = areaName;
                        areaDialogIsEdit.value = true;
                        showAreaDialog.value = true;
                    }
                } else {
                    addAreaToMap(zone);
                }
            } catch (e) {
                console.error(e);
                addAreaToMap(zone);
            }
        
            map.off('contextmenu', editContextMenuHandler);
            areaDraw.deleteAll();
            isDrawing.value = false;
            if (!showAreaDialog.value) {
                editingArea.value = null;
            }
        }
        
        function deleteArea(areaName) {
            var idx = areas.findIndex(function (a) { return a.name === areaName; });
            if (idx < 0) return;
            removeAreaFromMap(areaName);
            areas.splice(idx, 1);
            filters.areas.delete(areaName);
            applyFilters();
        }
        
        // ═══════════════════════════════════════════
        // Vue3 应用
        // ═══════════════════════════════════════════
        const App = {
            setup() {
                const collapsed = Vue.ref(false);
                const legendCollapsed = Vue.ref(false);
                const activeTab = Vue.ref('info');
        
                const stats = Vue.computed(() => ({
                    total: hazards.length,
                    normal: hazards.filter(h => h.hazardType === '一般隐患').length,
                    serious: hazards.filter(h => h.hazardType === '重大隐患').length,
                    pending: hazards.filter(h => h.status === '未整改').length,
                    fixing: hazards.filter(h => h.status === '整改中').length,
                    fixed: hazards.filter(h => h.status === '已整改').length,
                }));
        
                const areaStats = Vue.computed(() =>
                    areas.map(z => ({ ...z, count: hazards.filter(h => h.area === z.name).length }))
                );
        
                const infoFields = Vue.computed(() => {
                    const h = selectedHazard.value;
                    if (!h) return [];
                    const tc = HAZARD_TYPE_CONFIG[h.hazardType];
                    const sc = STATUS_CONFIG[h.status];
                    return [
                        { label: '隐患编号', value: h.id },
                        { label: '排查日期', value: h.inspectionDate },
                        { label: '隐患类型', value: h.hazardType, color: tc.color },
                        { label: '隐患等级', value: `${h.hazardLevel} (${HAZARD_LEVELS[h.hazardLevel]})` },
                        { label: '整改状态', value: h.status, color: sc.color },
                        { label: '隐患地点', value: h.hazardLocation },
                        { label: '排查专业', value: h.hazardProfession },
                        { label: '信息来源', value: h.infoSource },
                        { label: '责任部门', value: h.responsibleDept },
                        { label: '分管领导', value: h.managementLeader },
                        { label: '主管', value: h.teamLeader },
                        { label: '班组长', value: h.groupLeader },
                        { label: '责任人', value: h.responsible },
                        { label: '处理人', value: h.handler },
                        { label: '治理期限', value: `${h.rectifyDeadline} 天` },
                        { label: '处罚金额', value: h.penalty > 0 ? `¥${h.penalty}` : '无' },
                    ];
                });
        
                function toggleFilter(setName, value) {
                    const s = filters[setName];
                    s.has(value) ? s.delete(value) : s.add(value);
                    applyFilters();
                }
                function isChecked(setName, value) {
                    return filters[setName].has(value);
                }
        
                return {
                    collapsed, legendCollapsed, activeTab,
                    stats, areaStats, infoFields,
                    selectedHazard, filters,
                    toggleFilter, isChecked,
                    flyToArea, flyToHazard,
                    isDrawing, showAreaDialog, areaDialogName, areaDialogIsEdit,
                    drawNewArea, editAreaShape, deleteArea, confirmAreaDialog,
                    HAZARD_TYPES, PROFESSIONS, STATUS_LIST,
                    HAZARD_TYPE_CONFIG, STATUS_CONFIG, PROFESSION_ICONS, HAZARD_LEVELS,
                };
            },
            template: `
            <div class="hz-app">
                <!-- ═══ 侧边面板 ═══ -->
                <div class="side-panel" :class="{ collapsed }">
                    <button class="toggle-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开' : '收起'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline v-if="!collapsed" points="15 18 9 12 15 6"/>
                            <polyline v-else points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                    <div class="panel-content" v-show="!collapsed">
                        <div class="panel-header">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="2" width="20" height="20">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <h2>隐患管理</h2>
                        </div>
        
                        <div class="stats-grid">
                            <div class="stat-card stat-total"><span class="stat-num">{{stats.total}}</span><span class="stat-label">总数</span></div>
                            <div class="stat-card stat-normal"><span class="stat-num">{{stats.normal}}</span><span class="stat-label">一般</span></div>
                            <div class="stat-card stat-serious"><span class="stat-num">{{stats.serious}}</span><span class="stat-label">重大</span></div>
                            <div class="stat-card stat-pending"><span class="stat-num">{{stats.pending}}</span><span class="stat-label">未整改</span></div>
                            <div class="stat-card stat-fixing"><span class="stat-num">{{stats.fixing}}</span><span class="stat-label">整改中</span></div>
                            <div class="stat-card stat-fixed"><span class="stat-num">{{stats.fixed}}</span><span class="stat-label">已整改</span></div>
                        </div>
        
                        <div class="filter-section">
                            <h3 class="filter-title">隐患类型</h3>
                            <div class="filter-group">
                                <label v-for="t in HAZARD_TYPES" :key="t" class="filter-check">
                                    <input type="checkbox" :checked="isChecked('types', t)" @change="toggleFilter('types', t)"/>
                                    <span class="check-dot" :style="{ background: HAZARD_TYPE_CONFIG[t].color }"></span>
                                    <span>{{t}}</span>
                                </label>
                            </div>
                        </div>
        
                        <div class="filter-section">
                            <h3 class="filter-title">排查专业</h3>
                            <div class="filter-group filter-grid">
                                <label v-for="p in PROFESSIONS" :key="p" class="filter-check">
                                    <input type="checkbox" :checked="isChecked('professions', p)" @change="toggleFilter('professions', p)"/>
                                    <span class="check-indicator"></span>
                                    <span>{{p}}</span>
                                </label>
                            </div>
                        </div>
        
                        <div class="filter-section">
                            <h3 class="filter-title">整改状态</h3>
                            <div class="filter-group">
                                <label v-for="s in STATUS_LIST" :key="s" class="filter-check">
                                    <input type="checkbox" :checked="isChecked('statuses', s)" @change="toggleFilter('statuses', s)"/>
                                    <span class="check-dot" :style="{ background: STATUS_CONFIG[s].color }"></span>
                                    <span>{{s}}</span>
                                </label>
                            </div>
                        </div>
        
                        <div class="filter-section">
                            <h3 class="filter-title">区域管理</h3>
                            <div class="area-list">
                                <div v-for="a in areaStats" :key="a.name" class="area-item">
                                    <div class="area-color" :style="{ background: a.color.replace(/[\\d.]+\\)$/, '0.6)') }" @click="flyToArea(a.name)"></div>
                                    <span class="area-name" @click="flyToArea(a.name)" style="cursor:pointer">{{a.name}}</span>
                                    <span class="area-count">{{a.count}}</span>
                                    <div class="area-actions">
                                        <button class="area-action-btn" @click.stop="editAreaShape(a.name)" :disabled="isDrawing" title="编辑区域范围">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                        <button class="area-action-btn danger" @click.stop="deleteArea(a.name)" :disabled="isDrawing" title="删除区域">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button class="add-area-btn" @click="drawNewArea()" :disabled="isDrawing">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                <span>{{isDrawing ? '绘制中...' : '新增区域'}}</span>
                            </button>
                        </div>
                    </div>
                </div>
        
                <!-- ═══ 图例面板 ═══ -->
                <div class="legend-panel">
                    <div class="legend-header" @click="legendCollapsed = !legendCollapsed">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                        </svg>
                        <span>图例</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"
                             class="chevron" :class="{ flipped: !legendCollapsed }">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                    <div class="legend-body" v-show="!legendCollapsed">
                        <div class="legend-group">
                            <div class="legend-group-title">隐患类型</div>
                            <div class="legend-items">
                                <div v-for="t in HAZARD_TYPES" :key="t" class="legend-item">
                                    <span class="legend-dot" :style="{ background: HAZARD_TYPE_CONFIG[t].color }"></span>
                                    <span>{{t}}</span>
                                    <span v-if="HAZARD_TYPE_CONFIG[t].pulse" class="pulse-hint">脉冲</span>
                                </div>
                            </div>
                        </div>
                        <div class="legend-group">
                            <div class="legend-group-title">排查专业</div>
                            <div class="legend-items legend-items-grid">
                                <div v-for="p in PROFESSIONS" :key="p" class="legend-item">
                                    <span class="legend-icon" v-html="PROFESSION_ICONS[p]"></span>
                                    <span>{{p}}</span>
                                </div>
                            </div>
                        </div>
                        <div class="legend-group">
                            <div class="legend-group-title">整改状态</div>
                            <div class="legend-items">
                                <div v-for="s in STATUS_LIST" :key="s" class="legend-item">
                                    <span class="legend-dot" :style="{ background: STATUS_CONFIG[s].color }"></span>
                                    <span>{{s}}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        
                <!-- ═══ 隐患详情弹窗 ═══ -->
                <div class="detail-overlay" v-if="selectedHazard" @click.self="selectedHazard = null">
                    <div class="detail-panel">
                        <div class="detail-header">
                            <div class="detail-title-row">
                                <span class="type-badge" :style="{ background: HAZARD_TYPE_CONFIG[selectedHazard.hazardType].color }">{{selectedHazard.hazardType}}</span>
                                <h3>{{selectedHazard.id}}</h3>
                                <span class="status-tag" :style="{ color: STATUS_CONFIG[selectedHazard.status].color, borderColor: STATUS_CONFIG[selectedHazard.status].color }">{{selectedHazard.status}}</span>
                            </div>
                            <p class="detail-location">{{selectedHazard.hazardLocation}}</p>
                            <button class="close-btn" @click="selectedHazard = null" title="关闭">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                            <button class="locate-btn" @click="flyToHazard(selectedHazard.id)" title="定位">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
                                </svg>
                            </button>
                        </div>
        
                        <div class="desc-box"><p>{{selectedHazard.hazardDescription}}</p></div>
        
                        <div class="tab-bar">
                            <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">基本信息</button>
                            <button :class="{ active: activeTab === 'photos' }" @click="activeTab = 'photos'">现场照片</button>
                            <button :class="{ active: activeTab === 'card' }" @click="activeTab = 'card'">隐患卡</button>
                        </div>
        
                        <div class="tab-content">
                            <div v-if="activeTab === 'info'" class="info-grid">
                                <div v-for="f in infoFields" :key="f.label" class="info-row">
                                    <span class="info-label">{{f.label}}</span>
                                    <span class="info-value" :style="f.color ? { color: f.color } : {}">{{f.value}}</span>
                                </div>
                                <div class="info-row info-row-full">
                                    <span class="info-label">治理措施</span>
                                    <span class="info-value">{{selectedHazard.rectifyMeasures}}</span>
                                </div>
                            </div>
        
                            <div v-if="activeTab === 'photos'" class="photos-tab">
                                <div class="photo-section">
                                    <h4>现场照片</h4>
                                    <div class="photo-grid" v-if="selectedHazard.photos.scene.length">
                                        <div v-for="(url, i) in selectedHazard.photos.scene" :key="'s'+i" class="photo-item">
                                            <img :src="url" :alt="'现场照片'+(i+1)" loading="lazy"/>
                                        </div>
                                    </div>
                                    <p v-else class="no-data">暂无现场照片</p>
                                </div>
                                <div class="photo-section">
                                    <h4>整改照片</h4>
                                    <div class="photo-grid" v-if="selectedHazard.photos.rectify.length">
                                        <div v-for="(url, i) in selectedHazard.photos.rectify" :key="'r'+i" class="photo-item">
                                            <img :src="url" :alt="'整改照片'+(i+1)" loading="lazy"/>
                                        </div>
                                    </div>
                                    <p v-else class="no-data">暂无整改照片</p>
                                </div>
                            </div>
        
                            <div v-if="activeTab === 'card'" class="card-tab">
                                <div class="hazard-card-print">
                                    <div class="card-title-row">
                                        <h4>隐患整改通知单</h4>
                                        <span>编号：{{selectedHazard.id}}</span>
                                    </div>
                                    <table class="card-table"><tbody>
                                        <tr><td class="td-label">排查日期</td><td>{{selectedHazard.inspectionDate}}</td><td class="td-label">隐患类型</td><td>{{selectedHazard.hazardType}}</td></tr>
                                        <tr><td class="td-label">隐患等级</td><td>{{selectedHazard.hazardLevel}}</td><td class="td-label">排查专业</td><td>{{selectedHazard.hazardProfession}}</td></tr>
                                        <tr><td class="td-label">隐患地点</td><td colspan="3">{{selectedHazard.hazardLocation}}</td></tr>
                                        <tr><td class="td-label">隐患描述</td><td colspan="3">{{selectedHazard.hazardDescription}}</td></tr>
                                        <tr><td class="td-label">责任部门</td><td>{{selectedHazard.responsibleDept}}</td><td class="td-label">责任人</td><td>{{selectedHazard.responsible}}</td></tr>
                                        <tr><td class="td-label">治理措施</td><td colspan="3">{{selectedHazard.rectifyMeasures}}</td></tr>
                                        <tr><td class="td-label">治理期限</td><td>{{selectedHazard.rectifyDeadline}} 天</td><td class="td-label">处罚金额</td><td>{{selectedHazard.penalty > 0 ? '¥'+selectedHazard.penalty : '无'}}</td></tr>
                                        <tr><td class="td-label">处理人</td><td>{{selectedHazard.handler}}</td><td class="td-label">整改状态</td><td :style="{ color: STATUS_CONFIG[selectedHazard.status].color }">{{selectedHazard.status}}</td></tr>
                                    </tbody></table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- ═══ 区域名称对话框 ═══ -->
                <div class="area-dialog-overlay" v-if="showAreaDialog" @click.self="showAreaDialog = false">
                    <div class="area-dialog">
                        <h3>{{areaDialogIsEdit ? '编辑区域' : '新增区域'}}</h3>
                        <input class="area-dialog-input" v-model="areaDialogName"
                               :placeholder="'请输入区域名称'" @keyup.enter="confirmAreaDialog()"/>
                        <div class="area-dialog-btns">
                            <button class="btn-cancel" @click="showAreaDialog = false">取消</button>
                            <button class="btn-confirm" @click="confirmAreaDialog()" :disabled="!areaDialogName.trim()">确定</button>
                        </div>
                    </div>
                </div>
            </div>
            `
        };
        
        // 挂载Vue应用到地图上
        let appEl = document.createElement('div');
        appEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
        appEl.querySelectorAll = appEl.querySelectorAll || (() => []);
        document.getElementById('map').appendChild(appEl);
        
        // 让子元素可以接收事件
        const appStyle = document.createElement('style');
        appStyle.textContent = `
        .hz-app .side-panel, .hz-app .legend-panel, .hz-app .detail-overlay, .hz-app .area-dialog-overlay {
            pointer-events: auto;
        }`;
        document.head.appendChild(appStyle);
        
        Vue.createApp(App).mount(appEl);
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