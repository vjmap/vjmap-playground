
/// <reference types="geojson" />

export = vjmap;
export as namespace vjmap;

declare namespace vjmap {
/**
 * 将脚本注入.
 * 脚本选项信息:
 *   `strategy`: 用于运行 JavaScript 的策略。可以是`inject`、`eval` 或`href`。默认自动检测.
 *   `injectLocation`: 用于注入资源的位置的 `document.querySelector` 参数。默认为 `head`.
 *   `async`: 异步加载脚本
 *   `src`: 脚本的来源
 * @method
 * @async
 * @param {typeof defaultOptions |  Array<typeof defaultOptions>} scripts - Options for a script
 * @return {Promise<void>}
 * @example
 * // you can add multiple loads
 * awit addScript([{
 *  src: "https://code.jquery.com/jquery-3.5.0.js"
 * }, {
 *  src: "https://code.jquery.com/jquery-3.2.0.js",
 *  async: true
 * }, {
 *  src: "https://code.jquery.com/jquery-3.3.0.js",
 *  async: true,
 *  injectLocation: '#main div.test',
 * }, {
 *  src: "https://code.jquery.com/jquery-3.4.0.js",
 *  strategy: 'eval',
 * }, {
 * // link tag
 * // css autodetected
 *  src: "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.0.2/css/bootstrap-grid.min.css",
 * }])
 */
export  function addScript(scripts: ScriptDefaultOptions | ScriptDefaultOptions[]): Promise<unknown[]>;

export  const angle: (a: Point23D, b?: Point23D) => number;

/**
 * 动画标记图层.
 */
export  class AnimateMarkerLayer extends Evented {
    private map;
    private options;
    private features;
    private type;
    private width;
    private height;
    private colors;
    private textFontSize;
    private textColor;
    private textField;
    private _markersElement;
    private markers;
    private marker;
    constructor(features: FeatureCollection, options?: AnimateMarkerLayerOption);
    addTo(map: Map): void;
    remove(): void;
    getMarkers(): Marker[];
    private _initalizeOptions;
    private _initalizeMarkerLayer;
    private _createMarker;
    setType(type: AnimateMarkerType, options?: AnimateMarkerLayerOption): void;
    _getMarkerElement(): void;
    clearMarkerLayer(): void;
    render(): void;
}

export  interface AnimateMarkerLayerOption {
    type?: AnimateMarkerType;
    width?: number;
    height?: number;
    colors?: string[];
    textFontSize?: number;
    textColor?: string;
    textField?: string;
}

/**
 * breathingAperture 呼吸的光圈.
 * rotatingAperture 旋转的光环
 * haloRing 发光的光环
 * diffusedAperture 扩散的点
 * rotatingTextBorder 旋转的文本框
 * fluorescence 荧光点
 */
export  type AnimateMarkerType = "breathingAperture" | 'rotatingAperture' | 'haloRing' | 'diffusedAperture' | 'rotatingTextBorder' | 'fluorescence';

/**
 * 创建矢量图层动画图层
 * @param map 地图对象
 * @param layerId 矢量图层id
 * @param options 选项
 * @param layerType 图层类型 0 线 1 填充 2 符号点
 */
export  const animateVectorLayer: (map: Map, layerId: string, options?: IAnimateVectorLayerOptions, layerType?: number | undefined) => IAnimateVectorLayerResult;

 interface Animation_2<V> {
    next: (t: number) => {
        value: V;
        done: boolean;
    };
    flipTarget: () => void;
}
export { Animation_2 as Animation }

export  type AnimationOps<V> = PlaybackOptions<V> & (DecayOptions | KeyframeOptions<V> | SpringOptions);

export  interface AnimationState<V> {
    value: V;
    done: boolean;
}

export  const anticipate: Easing;

/**
 * Copy methods and properties from one prototype into another.
 *
 * @see https://www.typescriptlang.org/docs/handbook/mixins.html
 *
 * @param derivedCtor - Class to mix methods and properties into.
 * @param baseCtors - Class to take all methods and properties from.
 */
export  function applyMixins(derivedCtor: any, baseCtors: any[]): void;

/**
 * Copy methods from one prototype into another.
 *
 * @see https://www.typescriptlang.org/docs/handbook/mixins.html
 *
 * @param derivedCtor - Class to mix methods into.
 * @param baseCtors - Class to take all methods from.
 */
export  function applyMixinsWithoutProperties(derivedCtor: any, baseCtors: any[]): void;

/**
 * Apply offset
 * A function that, given a value, will get the offset from `from`
 * and apply it to `to`
 * @param  {number} from
 * @param  {number} to
 * @return {function}
 */
export  const applyOffset: (from: number, to?: number | undefined) => (v: number) => number | undefined;

export  const attract: (constant: number, origin: number, v: number) => number;

export  const attractExpo: (constant: number, origin: number, v: number) => number;

/**
 * 创建一个背景图层.
 *
 **/
export  class BackgroundLayer extends OverlayLayerBase {
    options: BackgroundLayerOptions;
    constructor(options: BackgroundLayerOptions);
    addTo(map: Map, beforeId?: string): void;
    setBackgroundColor(value: PropertyValueSpecificationEx<ColorSpecification>): this;
    getBackgroundColor(): PropertyValueSpecificationEx<ColorSpecification>;
    setBackgroundPattern(value: PropertyValueSpecificationEx<ResolvedImageSpecification>): this;
    getBackgroundPattern(): PropertyValueSpecificationEx<ResolvedImageSpecification>;
    setBackgroundOpacity(value: PropertyValueSpecificationEx<number>): this;
    getBackgroundOpacity(): PropertyValueSpecificationEx<number>;
}

export  interface BackgroundLayerOptions extends OverlayLayerBaseOptions {
    backgroundColor?: PropertyValueSpecificationEx<ColorSpecification>;
    backgroundPattern?: PropertyValueSpecificationEx<ResolvedImageSpecification>;
    backgroundOpacity?: PropertyValueSpecificationEx<number>;
}

export  type BackgroundLayerSpecification = {
    id: string;
    type: "background";
    metadata?: unknown;
    minzoom?: number;
    maxzoom?: number;
    layout?: {
        visibility?: "visible" | "none";
    };
    paint?: {
        "background-color"?: PropertyValueSpecificationEx<ColorSpecification>;
        "background-pattern"?: PropertyValueSpecificationEx<ResolvedImageSpecification>;
        "background-opacity"?: PropertyValueSpecificationEx<number>;
    };
};

export  const backIn: Easing;

export  const backInOut: Easing;

export  const backOut: Easing;

 type BBox = BBox2d | BBox3d;

/**
 * Bounding box
 *
 * https://tools.ietf.org/html/rfc7946#section-5
 * A GeoJSON object MAY have a member named 'bbox' to include information on the coordinate range for its Geometries, Features, or FeatureCollections.
 * The value of the bbox member MUST be an array of length 2*n where n is the number of dimensions represented in the contained geometries,
 * with all axes of the most southwesterly point followed by all axes of the more northeasterly point.
 * The axes order of a bbox follows the axes order of geometries.
 */
 type BBox2d = [number, number, number, number];

 type BBox3d = [number, number, number, number, number, number];

/**
 * [起始点, 贝塞尔曲线段, ...]
 * 下一段贝塞尔曲线的起始点是上一段的结束点
 */
 type BezierCurve = [CurvePoint, BezierCurveSegment, ...BezierCurveSegment[]];

/**
 * [控制点1，控制点2，结束点]
 */
 type BezierCurveSegment = [CurvePoint, CurvePoint, CurvePoint];

/**
 * @description 将 bezierCurve 转换为折线 [理想情况下，计算结果中相邻的两个点的距离等于设置的精度（单位 px）]
 * @param {BezierCurve} bezierCurve 贝塞尔曲线
 * @param {number} precision       想要的精度（并非总是可以实现）[建议精度 5-10。设置的精度通常是达不到的，除非设置较高的迭代次数，计算成本较高。]
 * @param {number} recursiveCount   递归计数
 */
export  function bezierCurveToPolyline(bezierCurve: BezierCurve, precision?: number, recursiveCount?: number): CurvePoint[];

/**
 * Given an array of member function names as strings, replace all of them
 * with bound versions that will always refer to `context` as `this`. This
 * is useful for classes where otherwise event bindings would reassign
 * `this` to the evented object or some other value: this lets you ensure
 * the `this` value always.
 *
 * @param fns list of member function names
 * @param context the context value
 * @example
 * function MyClass() {
 *   bindAll(['ontimer'], this);
 *   this.name = 'Tom';
 * }
 * MyClass.prototype.ontimer = function() {
 *   alert(this.name);
 * };
 * var myClass = new MyClass();
 * setTimeout(myClass.ontimer, 100);
 * @private
 */
export  function bindAll(fns: string[], context: Object): void;

export  const bounceIn: Easing;

export  const bounceInOut: (p: number) => number;

export  const bounceOut: (p: number) => number;

/**
 * 呼吸的光圈.
 */
export  class BreathingApertureMarker extends MarkerBase {
    constructor(features: FeatureCollection | {
        lngLat: LngLatLike;
        text?: string;
    }, options?: AnimateMarkerLayerOption);
    _createMarker(): void;
    private _createMakerElement;
    setMarkersWidth(width: number, index?: number): void;
    private _setBreathingApertureWidth;
    setDotSize(size: number, index?: number): void;
    setMarkersColors(colors: string[], index?: number): void;
}

/**
 * 取一个凸环并通过在其周围应用缓冲区将其向外扩展。 此功能假定环是顺时针缠绕的。
 * @param ring
 * @param buffer
 * @return {any[]}
 */
export  function bufferConvexPolygon(ring: GeoPoint[], buffer: number): GeoPoint[];

/**
 * 根据多条多段线，建立topo
 * @param lines 坐标，请转成几何坐标，再传入
 * @param precision 误差，小数点后几位， 以为相同, 如果两个点的坐标距离小于此值，则认为是同一个节点
 * @param hasDirection 是否考虑方向
 * @return {{topo: any, graph: {topologicalSort: (sourceNodes?: NodeId[], includeSourceNodes?: boolean) => NodeId[], addNode: (node: NodeId) => {topologicalSort: (sourceNodes?: NodeId[], includeSourceNodes?: boolean) => ...[], addNode: (node: NodeId) => any, lowestCommonAncestors: (node1: NodeId, node2: NodeId) => ...[], shortestPath: (source: NodeId, destination: NodeId) => ... & ..., setEdgeWeight: (u: NodeId, v: NodeId, weight: EdgeWeight) => any, adjacent: (node: NodeId) => NodeId[], depthFirstSearch: (sourceNodes?: NodeId[], includeSourceNodes?: boolean, errorOnCycle?: boolean) => ...[], hasCycle: () => boolean, getEdgeWeight: (u: NodeId, v: NodeId) => EdgeWeight, serialize: () => Serialized, removeEdge: (u: NodeId, v: NodeId) => any, ...}, lowestCommonAncestors: (node1: NodeId, node2: NodeId) => NodeId[], shortestPath: (source: NodeId, destination: NodeId) => NodeId[] & {weight?: EdgeWeight}, setEdgeWeight: (u: NodeId, v: NodeId, weight: EdgeWeight) => {topologicalSort: (sourceNodes?: NodeId[], includeSourceNodes?: boolean) => ...[], addNode: (node: NodeId) => any, lowestCommonAncestors: (node1: NodeId, node2: NodeId) => ...[], shortestPath: (source: NodeId, destination: NodeId) => ... & ..., setEdgeWeight: (u: NodeId, v: NodeId, weight: EdgeWeight) => any, adjacent: (node: NodeId) => NodeId[], depthFirstSearch: (sourceNodes?: NodeId[], includeSourceNodes?: boolean, errorOnCycle?: boolean) => ...[], hasCycle: () => boolean, getEdgeWeight: (u: NodeId, v: NodeId) => EdgeWeight, serialize: () => Serialized, removeEdge: (u: NodeId, v: NodeId) => any, ...}, adjacent: (node: NodeId) => NodeId[], depthFirstSearch: (sourceNodes?: NodeId[], includeSourceNodes?: boolean, errorOnCycle?: boolean) => NodeId[], hasCycle: () => boolean, getEdgeWeight: (u: NodeId, v: NodeId) => EdgeWeight, serialize: () => Serialized, removeEdge: (u: NodeId, v: NodeId) => {topologicalSort: (sourceNodes?: NodeId[], includeSourceNodes?: boolean) => ...[], addNode: (node: NodeId) => any, lowestCommonAncestors: (node1: NodeId, node2: NodeId) => ...[], shortestPath: (source: NodeId, destination: NodeId) => ... & ..., setEdgeWeight: (u: NodeId, v: NodeId, weight: EdgeWeight) => any, adjacent: (node: NodeId) => NodeId[], depthFirstSearch: (sourceNodes?: NodeId[], includeSourceNodes?: boolean, errorOnCycle?: boolean) => ...[], hasCycle: () => boolean, getEdgeWeight: (u: NodeId, v: NodeId) => EdgeWeight, serialize: () => Serialized, removeEdge: (u: NodeId, v: NodeId) => any, ...}, ...}}}
 */
export  function buildTopoGraph(lines: Array<{
    points: GeoPoint[];
    id?: string;
    weight?: number;
}>, precision?: number, hasDirection?: boolean): {
    graph: {
        addNode: (node: string) => any;
        removeNode: (node: string) => any;
        nodes: () => string[];
        adjacent: (node: string) => string[];
        addEdge: (u: string, v: string, weight?: number | undefined) => any;
        removeEdge: (u: string, v: string) => any;
        hasEdge: (u: string, v: string) => boolean;
        setEdgeWeight: (u: string, v: string, weight: number) => any;
        getEdgeWeight: (u: string, v: string) => number;
        indegree: (node: string) => number;
        outdegree: (node: string) => number;
        depthFirstSearch: (sourceNodes?: string[] | undefined, includeSourceNodes?: boolean, errorOnCycle?: boolean) => string[];
        hasCycle: () => boolean;
        lowestCommonAncestors: (node1: string, node2: string) => string[];
        topologicalSort: (sourceNodes?: string[] | undefined, includeSourceNodes?: boolean) => string[];
        shortestPath: (source: string, destination: string) => string[] & {
            weight?: number | undefined;
        };
        serialize: () => Serialized;
        deserialize: (serialized: Serialized) => any;
    };
    topo: any;
};

/**
 * The algoritm is learnt from
 * https://franklinta.com/2014/09/08/computing-css-matrix3d-transforms/
 * And we made some optimization for matrix inversion.
 * Other similar approaches:
 * "cv::getPerspectiveTransform", "Direct Linear Transformation".
 */
/**
 * Usage:
 * ```js
 * const transformer = buildTransformer(
 *     [10, 44, 100, 44, 100, 300, 10, 300],
 *     [50, 54, 130, 14, 140, 330, 14, 220]
 * );
 * ```
 *
 * @param src source four points, [x0, y0, x1, y1, x2, y2, x3, y3]
 * @param dest destination four points, [x0, y0, x1, y1, x2, y2, x3, y3]
 * @return transformer If fail, return null/undefined.
 */
export  function buildTransformer(src: number[], dest: number[]): number[] | undefined;

/**
 * 透视投影转3d css 矩阵
 * Usage:
 * ```js
 * const transformer = buildTransformerMatrix3d(
 *     [10, 44, 100, 44, 100, 300, 10, 300],
 *     [50, 54, 130, 14, 140, 330, 14, 220]
 * );
 * ```
 *
 * @param src source four points, [x0, y0, x1, y1, x2, y2, x3, y3]
 * @param dest destination four points, [x0, y0, x1, y1, x2, y2, x3, y3]
 */
export  function buildTransformerMatrix3d(src: number[], dest: number[]): string | undefined;

/**
 * 计算多边形面积
 * @param points
 * @return {number}
 */
export  function calcPolygonArea(points: GeoPoint[]): number;

/**
 * 返回多边形的有符号的面积。正区域为外环，具有顺时针绕组。负区域为内环，按逆时针顺序排列。
 * @param ring
 * @return {number}
 */
export  function calculateSignedArea(ring: GeoPoint[]): number;

export  type CameraFunctionSpecificationEx<T> = {
    type: "exponential";
    stops: Array<[number, T]>;
} | {
    type: "interval";
    stops: Array<[number, T]>;
};

export  const circIn: Easing;

export  const circInOut: Easing;

/**
 * 创建圆符号图层.
 *
 **/
export  class Circle extends OverlayLayerBase {
    options: CircleOptions;
    constructor(options: CircleOptions);
    addTo(map: Map, beforeId?: string): void;
    /** 替换 GeoJSON 图层的当前数据。
     @param {GeoJSON} [data] GeoJSON object to set. If not provided, defaults to an empty FeatureCollection.
     */
    setData(data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any): void;
    setCircleSortKey(value: DataDrivenPropertyValueSpecification<number>): this;
    getCircleSortKey(): DataDrivenPropertyValueSpecification<number>;
    setVisibility(value: "visible" | "none"): this;
    getVisibility(): "visible" | "none";
    setCircleRadius(value: DataDrivenPropertyValueSpecification<number>): this;
    getCircleRadius(): DataDrivenPropertyValueSpecification<number>;
    setCircleColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    getCircleColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    setCircleBlur(value: DataDrivenPropertyValueSpecification<number>): this;
    getCircleBlur(): DataDrivenPropertyValueSpecification<number>;
    setCircleOpacity(value: DataDrivenPropertyValueSpecification<number>): this;
    getCircleOpacity(): DataDrivenPropertyValueSpecification<number>;
    setCircleTranslate(value: PropertyValueSpecificationEx<[number, number]>): this;
    getCircleTranslate(): PropertyValueSpecificationEx<[number, number]>;
    setCircleTranslateAnchor(value: PropertyValueSpecificationEx<"map" | "viewport">): this;
    getCircleTranslateAnchor(): PropertyValueSpecificationEx<"map" | "viewport">;
    setCirclePitchScale(value: PropertyValueSpecificationEx<"map" | "viewport">): this;
    getCirclePitchScale(): PropertyValueSpecificationEx<"map" | "viewport">;
    setCirclePitchAlignment(value: PropertyValueSpecificationEx<"map" | "viewport">): this;
    getCirclePitchAlignment(): PropertyValueSpecificationEx<"map" | "viewport">;
    setCircleStrokeWidth(value: DataDrivenPropertyValueSpecification<number>): this;
    getCircleStrokeWidth(): DataDrivenPropertyValueSpecification<number>;
    setCircleStrokeColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    getCircleStrokeColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    setCircleStrokeOpacity(value: DataDrivenPropertyValueSpecification<number>): this;
    getCircleStrokeOpacity(): DataDrivenPropertyValueSpecification<number>;
}

/**
 * 创建只有边框的圆或圆弧
 *
 **/
export  class CircleEdge extends Polyline {
    constructor(options: CircleEdgeOptions);
    addTo(map: Map, beforeId?: string): void;
    updateData(): void;
    /** 设置中心点。 */
    setCenter(value: GeoPointLike, bFocusUpdateData?: boolean): this;
    /** 得到中心点。 */
    getCenter(): GeoPointLike;
    /** 设置半径。 */
    setRadius(value: number, bFocusUpdateData?: boolean): this;
    /** 得到半径。 */
    getRadius(): number;
    /** 设置开始角度。 */
    setStartAngle(value: number, bFocusUpdateData?: boolean): this;
    /** 得到开始角度。 */
    getStartAngle(): number;
    /** 设置结束角度。 */
    setEndAngle(value: number, bFocusUpdateData?: boolean): this;
    /** 得到结束角度。 */
    getEndAngle(): number;
    /** 设置离散化的点的个数。 */
    setPoints(value: number, bFocusUpdateData?: boolean): this;
    /** 得到离散化的点的个数。 */
    getPoints(): number;
}

export  interface CircleEdgeOptions extends PolylineOptions {
    /** 中心点 */
    center: GeoPointLike;
    /** 半径 */
    radius: number;
    /** 开始角度 */
    startAngle?: number;
    endAngle?: number;
    points?: number;
    /** 属性数据 */
    properties?: object;
}

/**
 * 创建填充的圆或圆弧
 *
 **/
export  class CircleFill extends Polygon {
    constructor(options: CircleFillOptions);
    addTo(map: Map, beforeId?: string): void;
    updateData(): void;
    /** 设置中心点。 */
    setCenter(value: GeoPointLike, bFocusUpdateData?: boolean): this;
    /** 得到中心点。 */
    getCenter(): GeoPointLike;
    /** 设置半径。 */
    setRadius(value: number, bFocusUpdateData?: boolean): this;
    /** 得到半径。 */
    getRadius(): number;
    /** 设置开始角度。 */
    setStartAngle(value: number, bFocusUpdateData?: boolean): this;
    /** 得到开始角度。 */
    getStartAngle(): number;
    /** 设置结束角度。 */
    setEndAngle(value: number, bFocusUpdateData?: boolean): this;
    /** 得到结束角度。 */
    getEndAngle(): number;
    /** 设置离散化的点的个数。 */
    setPoints(value: number, bFocusUpdateData?: boolean): this;
    /** 得到离散化的点的个数。 */
    getPoints(): number;
}

export  interface CircleFillOptions extends PolygonOptions {
    /** 中心点 */
    center: GeoPointLike;
    /** 半径 */
    radius: number;
    /** 开始角度 */
    startAngle?: number;
    /** 终止角度 */
    endAngle?: number;
    /** 离散化的点的个数 */
    points?: number;
    /** 属性数据 */
    properties?: object;
}

export  type CircleLayerSpecification = {
    id: string;
    type: "circle";
    metadata?: unknown;
    source: string;
    "source-layer"?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    layout?: {
        "circle-sort-key"?: DataDrivenPropertyValueSpecification<number>;
        visibility?: "visible" | "none";
    };
    paint?: {
        "circle-radius"?: DataDrivenPropertyValueSpecification<number>;
        "circle-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "circle-blur"?: DataDrivenPropertyValueSpecification<number>;
        "circle-opacity"?: DataDrivenPropertyValueSpecification<number>;
        "circle-translate"?: PropertyValueSpecificationEx<[number, number]>;
        "circle-translate-anchor"?: PropertyValueSpecificationEx<"map" | "viewport">;
        "circle-pitch-scale"?: PropertyValueSpecificationEx<"map" | "viewport">;
        "circle-pitch-alignment"?: PropertyValueSpecificationEx<"map" | "viewport">;
        "circle-stroke-width"?: DataDrivenPropertyValueSpecification<number>;
        "circle-stroke-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "circle-stroke-opacity"?: DataDrivenPropertyValueSpecification<number>;
    };
};

export  type CircleLayerStyleProp = {
    metadata?: unknown;
    source?: string;
    sourceLayer?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    circleSortKey?: DataDrivenPropertyValueSpecification<number>;
    visibility?: "visible" | "none";
    circleRadius?: DataDrivenPropertyValueSpecification<number>;
    circleColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    circleBlur?: DataDrivenPropertyValueSpecification<number>;
    circleOpacity?: DataDrivenPropertyValueSpecification<number>;
    circleTranslate?: PropertyValueSpecificationEx<[number, number]>;
    circleTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    circlePitchScale?: PropertyValueSpecificationEx<"map" | "viewport">;
    circlePitchAlignment?: PropertyValueSpecificationEx<"map" | "viewport">;
    circleStrokeWidth?: DataDrivenPropertyValueSpecification<number>;
    circleStrokeColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    circleStrokeOpacity?: DataDrivenPropertyValueSpecification<number>;
};

export  interface CircleOptions extends OverlayLayerBaseOptions {
    data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any;
    circleSortKey?: DataDrivenPropertyValueSpecification<number>;
    circleRadius?: DataDrivenPropertyValueSpecification<number>;
    circleColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    circleBlur?: DataDrivenPropertyValueSpecification<number>;
    circleOpacity?: DataDrivenPropertyValueSpecification<number>;
    circleTranslate?: PropertyValueSpecificationEx<[number, number]>;
    circleTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    circlePitchScale?: PropertyValueSpecificationEx<"map" | "viewport">;
    circlePitchAlignment?: PropertyValueSpecificationEx<"map" | "viewport">;
    circleStrokeWidth?: DataDrivenPropertyValueSpecification<number>;
    circleStrokeColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    circleStrokeOpacity?: DataDrivenPropertyValueSpecification<number>;
}

export  const circOut: Easing;

export  const clamp: (min: number, max: number, v: number) => number;

/**
 * 根据范围裁剪多边形
 * @param points
 * @param bounds
 * @return {GeoPoint[]}
 */
export  function clipPolygon(points: GeoPoint[], bounds: GeoBounds): GeoPoint[];

/**
 * 根据范围裁剪线段
 * @param a
 * @param b
 * @param bounds
 * @return {GeoPoint[] | boolean}
 */
export  function clipSegment(a: GeoPoint, b: GeoPoint, bounds: GeoBounds): GeoPoint[] | Boolean;

/**
 * Deep clone of object.
 *
 * Like `JSON.parse(JSON.stringify(obj))`, but supports basic javascript types (string, number,
 * object), `Date` and `RegExp`s and cycles.
 *
 * Throws error if enounters object with `prototype` assuming that in general class instances
 * cannot be reliably cloned by generic algorithm.
 */
export  function cloneDeep<T>(obj: T): T;

/**
 * 点到多段线的最近点
 * @param p
 * @param points
 */
export  function closestPointOnPolyline(p: GeoPoint, points: GeoPoint[]): {
    closestLength: number;
    closestPoint: GeoPoint;
    closestIndex: number;
    closestPrePointDist: number;
};

/**
 * 点到多条线的最近点
 * @param p
 * @param lines
 */
export  function closestPointOnPolylines(p: GeoPoint, lines: GeoPoint[][]): {
    closestLength: number;
    closestPoint: GeoPoint;
    closestIndex: number;
    closestPointIndex: number;
    closestPrePointDist: number;
};

/**
 * 点到线段的最近点
 * @param p
 * @param p1
 * @param p2
 * @return {GeoPoint}
 */
export  function closestPointOnSegment(p: GeoPoint, p1: GeoPoint, p2: GeoPoint): GeoPoint;

export  type ColorSpecification = string;

export  class Compare extends Evented {
    constructor(a: Map, b: Map, container: Element | string, options?: {
        mousemove: boolean;
        orientation: 'vertical' | 'horizontal';
    });
    private _setPointerEvents;
    private _onDown;
    private _setPosition;
    private _onMove;
    private _onMouseUp;
    private _onTouchEnd;
    private _getX;
    private _getY;
    setSlider(x: number): void;
    remove(): void;
}

export  type CompositeFunctionSpecification<T> = {
    type: "exponential";
    stops: Array<[{
        zoom: number;
        value: number;
    }, T]>;
    property: string;
    default?: T;
} | {
    type: "interval";
    stops: Array<[{
        zoom: number;
        value: number;
    }, T]>;
    property: string;
    default?: T;
} | {
    type: "categorical";
    stops: Array<[{
        zoom: number;
        value: string | number | boolean;
    }, T]>;
    property: string;
    default?: T;
};

export  interface Config<T = unknown> {
    url?: string;
    method: keyof Methods;
    data?: Document | BodyInit;
    headers: {
        [key: string]: string;
    };
    dump: (data: T) => string;
    load: (str: string) => T;
    xmlHttpRequest: () => XMLHttpRequest;
    promise: (fn: () => Promise<unknown>) => Promise<unknown>;
    abort?: any;
    params?: string[][] | Record<string, string> | string | URLSearchParams;
    withCredentials: boolean;
    raw?: boolean;
    events?: {
        [key: string]: () => void;
    };
}

/**
 * 上下文菜单.
 *
 **/
export  class ContextMenu {
    private options;
    private menuControl;
    private position;
    /**
     * Creates a new ContextMenu menu
     * @param {object} opts options which build the menu e.g. position and items
     * @param {number} opts.width sets the width of the menu including children
     * @param {object} opts.event 事件对象
     * @param {theme} opts.theme 自定义的样式主题，支持dark和light，默认dark
     * @param {boolean} opts.isSticky sets how the menu apears, follow the mouse or sticky
     * @param {Array<ContextMenuItem>} opts.items sets the default items in the menu
     */
    constructor(opts: ContextMenuOptions);
    /**
     * Adds item to this ContextMenu menu instance
     * @param {ContextMenuItem} item item to add to the ContextMenu menu
     */
    add(item: any): void;
    /**
     * Makes this ContextMenu menu visible
     */
    show(): void;
    /**
     * Hides this ContextMenu menu
     */
    hide(): void;
    /**
     * Toggle visibility of menu
     */
    toggle(): void;
}

/**
 * 上下文菜单选项.
 *
 **/
export  interface ContextMenuOptions {
    /** 事件对象. */
    event: Event;
    /** 菜单宽度（包括子菜单),像素，默认150px. */
    width?: string;
    /** 菜单主题色.(dark和light,默认dark)*/
    theme?: string;
    /** 菜单外面容器的内部宽，用于菜单超时范围时自动调位置，默认是window大小宽 可通过 map.getContainer().getBoundingClientRect().width来设置 */
    innerWidth?: number;
    /** 菜单外面容器的内部宽，用于菜单超时范围时自动调位置，默认是window大小高 可通过 map.getContainer().getBoundingClientRect().height来设置 */
    innerHeight?: number;
    /** 子项 */
    items: ContextMenuSubItemOptions[];
}

/**
 * 上下文菜单子项选项.
 *
 **/
export  interface ContextMenuSubItemOptions {
    /** 子菜单类型. */
    type?: "custom" | "multi" | "Button" | "seperator" | "submenu" | "hovermenu" | "normal";
    /** 类型为'custom'时的自定义html内容 */
    markup?: string;
    /** 类型为'multi'时子菜单项*/
    items?: ContextMenuSubItemOptions[];
    /** 点击事件*/
    onClick?: Function;
    /** 菜单名称*/
    label?: string;
    /** 快捷菜单*/
    shortcut?: string;
    /** 是否能用*/
    enabled?: boolean;
    /** css图标*/
    cssIcon?: string;
    /** 图标*/
    icon?: string;
}

/**
 * transform
 *
 * @param {geojson|GeoPointLike|GeoPointLike[]|string} input
 * @returns {geojson|GeoPointLike | GeoPointLike[]} output
 */
 function convert<T extends GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]>(input: T | string, crsFrom: ((pt: GeoPoint) => GeoPoint) | CRSTypes, crsTo?: CRSTypes): T;

/**
 * 通过四参数进行坐标转换
 * @param pt 点
 * @param param 四参数
 * @return {GeoPoint}
 */
export  function coordTransfromByFourParamter(pt: GeoPoint, param: {
    dx: number;
    dy: number;
    scale: number;
    rotate: number;
}): GeoPoint;

/**
 * 通过四参数反算进行坐标转换
 * @param pt 点
 * @param param 四参数
 * @return {GeoPoint}
 */
export  function coordTransfromByInvFourParamter(pt: GeoPoint, param: {
    dx: number;
    dy: number;
    scale: number;
    rotate: number;
}): GeoPoint;

/**
 * 坐标转换得到四参数
 * @param srcArr 原始点数组
 * @param destArr 目标点数组
 * @param isSetRotateZero 是否设置旋转为零，默认false,如果为true,则只考虑平移和缩放
 * @param isConsiderPointOrder 不考虑点的次序(这样旋转角度方向总是上面，在-180,180之间）
 * @returns {{rotate: number, dx: number, dy: number, scale: number}}
 */
export  function coordTransfromGetFourParamter(srcArr: GeoPoint[], destArr: GeoPoint[], isSetRotateZero: boolean, isConsiderPointOrder?: boolean): {
    dx: number;
    dy: number;
    scale: number;
    rotate: number;
};

/**
 * 创建多边形动画图层
 * @param map 地图对象
 * @param path 线坐标(lngLat)
 * @param options 选项
 */
export  function createAnimateFillLayer(map: Map, path: LineGeoJsonInput | LineGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike[] | any, options?: IAnimateFillLayerOptions): ICreateFillAnimateLayerResult;

/**
 * 创建动画图片集
 * @param options 选项
 */
export  function createAnimateImages(options?: ICreateAnimateImagesOptions): Array<ImageData>;

/**
 * 创建多段线动画图层
 * @param map 地图对象
 * @param path 线坐标(lngLat)
 * @param options 选项
 */
export  function createAnimateLineLayer(map: Map, path: LineGeoJsonInput | LineGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike[] | any, options?: IAnimateLineLayerOptions): ICreateLineAnimateLayerResult;

/**
 * 创建符号动画图层
 * @param map 地图对象
 * @param path 符号坐标(lngLat)
 * @param options 选项
 */
export  function createAnimateSymbolLayer(map: Map, path: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any, options?: IAnimateSymbolLayerOptions): ICreateSymbolAnimateLayerResult;

export  function createAnimation<V = number>({ from, autoplay, driver, elapsed, repeat: repeatMax, repeatType, repeatDelay, onPlay, onStop, onComplete, onRepeat, onUpdate, ...options }: any): {
    stop: () => void;
    start: (reset?: boolean | undefined) => void;
};

export  const createAnticipate: (power: number) => Easing;

/**
 * 创建蚂蚁线动画图像集
 * @param options 选项
 */
export  function createAntPathAnimateImages(options?: ICreateAntPathAnimateLineLayerOptions): ImageData[];

/**
 * 创建蚂蚁线动画线图层
 * @param map 地图对象
 * @param path 线坐标(lngLat)
 * @param options 选项
 */
export  function createAntPathAnimateLineLayer(map: Map, path: LineGeoJsonInput | LineGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike[] | any, options?: ICreateAntPathAnimateLineLayerOptions): ICreateLineAnimateLayerResult;

/**
 * 创建箭头动画图像集
 * @param options 选项
 */
export  function createArrowAnimateImages(options?: ICreateArrowAnimateLineLayerOptions): ImageData[];

/**
 * 创建箭头动画线图层
 * @param map 地图对象
 * @param path 线坐标(lngLat)
 * @param options 选项
 */
export  function createArrowAnimateLineLayer(map: Map, path: LineGeoJsonInput | LineGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike[] | any, options?: ICreateArrowAnimateLineLayerOptions): ICreateLineAnimateLayerResult;

/**
 * Creates an attractor that, given a strength constant, origin and value,
 * will calculate value as attracted to origin.
 */
export  const createAttractor: (alterDisplacement?: Function) => (constant: number, origin: number, v: number) => number;

export  const createBackIn: (power: number) => Easing;

export  const createExpoIn: (power: number) => Easing;

/**
 * 创建一个 FrameAnimation 对象来启动和停止你的动画功能.
 * @example
 * const count = 0;
 *
 * const animation = createFrameAnimation(() => {
 *   context.clearRect(0, 0, width, height);
 *   context.font = "4rem monospace";
 *   context.textAlign = 'center';
 *   context.fillText(count, width / 2, height / 2);
 *
 *   count++;
 * });
 *
 * animation.start();
 * @param {function():void} callback - 处理动画的回调,如果返回true，表示结束动画，返回false表示继续动画， .
 * @returns {{readonly running: boolean, stop: () => void, start: () => void} | boolean}
 * @param stopCallBack 结束动画的回调，参数表示是取消（true)，还是正常结束(false)
 * @param fps 一秒运行多少帧，用来控制速度，如为0，则默认为系统帧率
 */
export  function createFrameAnimation(callback: (status: FrameAnimationStatus) => boolean, fps?: number, stopCallBack?: (status: FrameAnimationStatus) => void): FrameAnimation;

/**
 * 创建geoson格式的线
 * @param input
 * @return {{features: any[], type: string}}
 */
export  function createLineGeoJson(input: LineGeoJsonInput | LineGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike[] | any): GeoJsonGeomertry;

/**
 * 创建一个Makrer对象，相当于new Marker()
 */
export  function createMarker(options?: createMarkerOptions): Marker;

export  interface createMarkerOptions extends MarkerOptions {
    /** LngLat值. */
    lngLat?: LngLatLike;
    /** 显示的最小级别. */
    minZoom?: number;
    /** 显示的最大级别. */
    maxZoom?: number;
    /** 设置能缩放的最大级别。如果小于这个级别，div将根据缩小级别自动缩小比例。默认不会自动缩放 */
    scaleMaxZoom?: number;
    /** 高度值. */
    height?: number;
    /** 设置当marker不在当前地图视图范围内时，将自动移除。进入视图范围内时，将自动增加上*/
    removeWhenNoInMapView?: boolean;
    /** 设置当marker不在当前地图视图范围内时，将自动移除。范围向外扩的像素范围，默认500px，向视图范围往外扩些像素，在平移的时候，能看到marker，体验效果好些。*/
    removeWhenNoInMapViewPadding?: boolean;
}

export  function createObjectOffset(): {
    offsetLines(dist: number): any;
    offset(dist: number): any;
    margin(dist: number): any;
    padding(dist: number): any;
    data(vertices: any): any;
};

export  function createObjectPolygonUtil(): {
    diff(polygonA: Array<Array<Number>>, polygonB: Array<Array<Number>>): Array<Array<Number>> | null;
    union(polygonA: Array<Array<Number>>, polygonB: Array<Array<Number>>): Array<Array<Number>> | null;
    intersection(polygonA: Array<Array<Number>>, polygonB: Array<Array<Number>>): Array<Array<Number>> | null;
};

/**
 * 创建geoson格式的点
 * @param input
 * @return {{features: any[], type: string}}
 */
export  function createPointGeoJson(input: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any): GeoJsonGeomertry;

/**
 * 创建geoson格式的多边形
 * @param input
 * @return {{features: any[], type: string}}
 */
export  function createPolygonGeoJson(input: LineGeoJsonInput | LineGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike[] | any): GeoJsonGeomertry;

 enum CRSTypes {
    WGS84 = "WGS84",
    WGS1984 = "WGS84",
    EPSG4326 = "WGS84",
    GCJ02 = "GCJ02",
    AMap = "GCJ02",
    BD09 = "BD09",
    BD09LL = "BD09",
    Baidu = "BD09",
    BMap = "BD09",
    BD09MC = "BD09MC",
    BD09Meter = "BD09MC",
    EPSG3857 = "EPSG3857",
    EPSG900913 = "EPSG3857",
    EPSG102100 = "EPSG3857",
    WebMercator = "EPSG3857",
    WM = "EPSG3857"
}

export  function cubicBezier(mX1: number, mY1: number, mX2: number, mY2: number): any;

 type CurvePoint = [number, number];

export  type DataDrivenPropertyValueSpecification<T> = T | CameraFunctionSpecificationEx<T> | SourceFunctionSpecification<T> | CompositeFunctionSpecification<T> | ExpressionSpecificationEx;

/**
 * `Db2dPolyline` 二维多段线实体.
 *
 */
export  class Db2dPolyline extends DbCurve {
    /** 是否闭合. */
    closed?: boolean;
    /** 高程. */
    elevation?: number;
    /** 2d折线类型*/
    polyType?: Poly2dType;
    /** 坐标. */
    points?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDb2dPolyline);
}

/**
 * `Db2LineAngularDimension` 角度标注[两条线]实体.
 *
 */
export  class Db2LineAngularDimension extends DbDimension {
    /** 圆弧点位置. */
    arcPoint?: Array<[number, number, number?]>;
    /** 线1起点. */
    xLine1Start?: Array<[number, number, number?]>;
    /** 线1终点. */
    xLine1End?: Array<[number, number, number?]>;
    /** 线2起点. */
    xLine2Start?: Array<[number, number, number?]>;
    /** 线2终点. */
    xLine2End?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDb2LineAngularDimension);
}

/**
 * `Db3dPolyline` 三维多段线实体.
 *
 */
export  class Db3dPolyline extends DbCurve {
    /** 是否闭合. */
    closed?: boolean;
    /** 3d折线类型*/
    polyType?: Poly3dType;
    /** 坐标. */
    points?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDb3dPolyline);
}

/**
 * `Db3PointAngularDimension` 角度标注[三点]实体.
 *
 */
export  class Db3PointAngularDimension extends DbDimension {
    /** 圆弧点位置. */
    arcPoint?: Array<[number, number, number?]>;
    /** 中点. */
    centerPoint?: Array<[number, number, number?]>;
    /** 点1. */
    xLine1Point?: Array<[number, number, number?]>;
    /** 点2. */
    xLine2Point?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDb3PointAngularDimension);
}

/**
 * `DbAlignedDimension` 对齐标注实体.
 *
 */
export  class DbAlignedDimension extends DbDimension {
    /** 线1点. */
    xLine1Point?: Array<[number, number, number?]>;
    /** 线2点. */
    xLine2Point?: Array<[number, number, number?]>;
    /** 设置定义此dimension实体尺寸线位置的WCS点. */
    dimLinePoint?: Array<[number, number, number?]>;
    /** 设置此实体的符号高度。. */
    jogSymbolHeight?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbAlignedDimension);
}

/**
 * `DbArc` 圆弧实体.
 *
 */
export  class DbArc extends DbCurve {
    /** 中心坐标. */
    center?: [number, number, number?];
    /** 半径. */
    radius?: number;
    /** 开始弧度. */
    startAngle?: number;
    /** 结束弧度. */
    endAngle?: number;
    /** 厚度. */
    thickness?: number;
    /** 法向量. */
    normal?: [number, number, number?];
    /**
     * 构造函数
     */
    constructor(prop?: IDbArc);
}

/**
 * `DbArcDimension` 圆弧标注实体.
 *
 */
export  class DbArcDimension extends DbDimension {
    /** 线1点. */
    xLine1Point?: Array<[number, number, number?]>;
    /** 线2点. */
    xLine2Point?: Array<[number, number, number?]>;
    /** 中心点. */
    centerPoint?: Array<[number, number, number?]>;
    /** 圆弧点. */
    arcPoint?: Array<[number, number, number?]>;
    /** 文本中使用的弧符号的类型。 0 弧符号在文本前面;   1 弧线符号在文字上方;   2  没有符号. */
    arcSymbolType?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbArcDimension);
}

/**
 * `DbBlock` 块定义.
 *
 */
export  class DbBlock {
    /** 块名称. */
    name?: string;
    /** 设置此块的参照的缩放特征. */
    scaling?: number;
    /** 设置此块的块插入单位 . */
    insertUnits?: number;
    /** 原点。 . */
    origin?: [number, number, number?];
    /** 备注. */
    comments?: string;
    /** 是否可炸开. */
    explodable?: boolean;
    /** 由哪些实体创建而成. */
    entitys?: IDbEntity[];
    /**
     * 构造函数
     */
    constructor(prop?: IDbBlock);
}

/**
 * `DbBlockReference` 块参照实体.
 *
 */
export  class DbBlockReference extends DbEntity {
    /** 块名称. */
    blockname?: string;
    /** 参考外部图形，形式为 mapid/version,如 exam/v1. */
    ref?: string;
    /** 坐标. */
    position?: [number, number, number?];
    /** 法向量. */
    normal?: [number, number, number?];
    /** 旋转角度. */
    rotation?: number;
    /** 缩放因子. */
    scaleFactors?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbBlockReference);
}

/**
 * `DbCircle` 圆实体.
 *
 */
export  class DbCircle extends DbCurve {
    /** 中心坐标. */
    center?: [number, number, number?];
    /** 半径. */
    radius?: number;
    /** 厚度. */
    thickness?: number;
    /** 法向量. */
    normal?: [number, number, number?];
    /**
     * 构造函数
     */
    constructor(prop?: IDbCircle);
}

/**
 * `DbCurve` 曲线实体.
 *
 */
export  class DbCurve extends DbEntity {
    /**
     * 构造函数
     */
    constructor(prop?: IDbCurve);
}

/**
 * `DbDiametricDimension` 直径标注实体.
 *
 */
export  class DbDiametricDimension extends DbDimension {
    /** 圆上1点. */
    chordPoint?: Array<[number, number, number?]>;
    /** 圆上2点. */
    farChordPoint?: Array<[number, number, number?]>;
    /** 引线长度. */
    leaderLength?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbDiametricDimension);
}

/**
 * `DbDimension` 标注实体.
 *
 */
export  class DbDimension extends DbEntity {
    /** 标注样式. */
    dimStyle?: string;
    /** 文字位置. */
    textPosition?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDbDimension);
}

/**
 * `DbDocument` 地图数据库文档.
 *
 */
export  class DbDocument {
    /** 来源于哪个图，会在此图的上面进行修改或新增删除，格式如 形式为 mapid/version,如 exam/v1 . */
    from?: string;
    /** 来源于哪个图时有效，表示从此图中选择指定的图层，不在指定的图层将不会显示 */
    pickLayers?: string[];
    /** 来源于哪个图时有效，表示从此图中选择指定的实体ID，不在指定的实体ID将不会显示 */
    pickEntitys?: string[];
    /** 文档环境，用于设置是否显示线宽等设置, 设置线宽为 LWDISPLAY ,true显示或 false不显示线宽*/
    environment?: Record<string, any>;
    /** 实体集. */
    entitys?: IDbEntity[];
    /** 图层集. */
    layers?: IDbLayer[];
    /** 文字样式. */
    textStyles?: IDbTextStyle[];
    /** 标注样式. */
    dimStyles?: IDbDimStyle[];
    /** 线型. */
    linetypes?: IDbLinetype[];
    /** 块定义. */
    blocks?: IDbBlock[];
    /**
     * 构造函数
     */
    constructor(prop?: IDbDocument);
    /**
     * 增加实体
     * @param entity
     */
    appendEntity(entity: IDbEntity | IDbEntity[]): void;
    /**
     * 增加图层
     * @param layer
     */
    appendLayer(layer: IDbLayer | IDbLayer[]): void;
    /**
     * 增加样式样式
     * @param textStyle
     */
    appendTextStyle(textStyle: IDbTextStyle | IDbTextStyle[]): void;
    /**
     * 增加标注样式
     * @param dimStyle
     */
    appendDimStyle(dimStyle: IDbDimStyle | IDbDimStyle[]): void;
    /**
     * 增加线型
     * @param linetype
     */
    appendLinetype(linetype: IDbLinetype | IDbLinetype[]): void;
    /**
     * 增加块
     * @param block
     */
    appendBlock(block: IDbBlock | IDbBlock[]): void;
    /**
     * 转成文档字符串
     * @param content 如果传入了内容，则以content为主。json格式
     * @return {string}
     */
    toDoc(content?: string): string;
}

/**
 * `DbEllipse` 椭圆实体.
 *
 */
export  class DbEllipse extends DbCurve {
    /** 中心坐标. */
    center?: [number, number, number?];
    /** 主轴方向. */
    minorAxis?: [number, number, number?];
    /** 开始弧度. */
    startAngle?: number;
    /** 结束弧度. */
    endAngle?: number;
    /** 短轴和长轴的比例. */
    radiusRatio?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbEllipse);
}

/**
 * `DbEntity` 实体基类.
 *
 */
export  abstract class DbEntity implements IDbEntity {
    /** 类型. */
    typename?: string;
    /** 颜色. */
    color?: number;
    /** 颜色索引. */
    colorIndex?: number;
    /** 图层. */
    layer?: string;
    /** 线型. */
    linetype?: string;
    /** 线型比例. */
    linetypeScale?: number;
    /** 线宽. */
    lineWidth?: number;
    /** 透明度. [0-255][0完全透明,255完全不透明]*/
    alpha?: number;
    /** 可见. */
    visibility?: boolean;
    /** 矩阵. */
    matrix?: IDbMatrixOp[];
    /** 扩展数据. */
    xdata?: string;
    /**
     * 构造函数
     * @param prop
     */
    protected constructor(prop?: IDbEntity);
}

/**
 * `DbHatch` 图案实体.
 *
 */
export  class DbHatch extends DbEntity {
    /** 高程. */
    elevation?: number;
    /** 填充图案, 缺省 SOLID */
    pattern?: string;
    /** 坐标. */
    points?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDbHatch);
}

/**
 * `DbLayer` 图层.
 *
 */
export  class DbLayer {
    /** 图层名称. */
    name?: string;
    /** 图层颜色索引. */
    color?: number;
    /** 图层线型，缺省 CONTINUOUS . */
    linetype?: string;
    /**
     * 构造函数
     */
    constructor(prop?: IDbLayer);
}

/**
 * `DbLine` 线实体.
 *
 */
export  class DbLine extends DbEntity implements IDbLine {
    /** 起点. */
    start?: [number, number, number?];
    /** 终点. */
    end?: [number, number, number?];
    /** 厚度. */
    thickness?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbLine);
}

/**
 * `DbLineType` 线型.
 *
 */
export  class DbLineType {
    /** 线型名称. */
    name?: string;
    /** 评论. */
    comments?: string;
    /** 线型样式 . */
    style?: IDbLinetypeStyle[];
    /**
     * 构造函数
     */
    constructor(prop?: IDbLinetype);
}

/**
 * `DbMText` 多行文本实体.
 *
 */
export  class DbMText extends DbEntity {
    /** 宽. */
    width?: number;
    /** 高. */
    height?: number;
    /** 旋转角度. */
    rotation?: number;
    /** 文本高. */
    textHeight?: number;
    /** 文本内容. */
    contents?: string;
    /** 位置. */
    location?: [number, number, number?];
    /** 对齐方式. */
    attachment?: MTextAttachmentPoint;
    /** 文本样式. */
    textStyle?: string;
    /**
     * 构造函数
     */
    constructor(prop?: IDbMText);
}

/**
 * `DbOrdinateDimension`  坐标标注实体.
 *
 */
export  class DbOrdinateDimension extends DbDimension {
    /** 基点. */
    origin?: Array<[number, number, number?]>;
    /** 定义点. */
    definingPoint?: Array<[number, number, number?]>;
    /** 引线点. */
    leaderEndPoint?: Array<[number, number, number?]>;
    /** 是否用X轴. */
    useXAxis?: boolean;
    /**
     * 构造函数
     */
    constructor(prop?: IDbOrdinateDimension);
}

/**
 * `DbPolyline` 多段线实体.
 *
 */
export  class DbPolyline extends DbCurve {
    /** 是否闭合. */
    closed?: boolean;
    /** 高程. */
    elevation?: number;
    /** 坐标. */
    points?: Array<[number, number, number?]>;
    /** 凸度. */
    bulge?: number[];
    /** 起点宽. */
    startWidth?: number[];
    /** 终点宽. */
    endWidth?: number[];
    /**
     * 构造函数
     */
    constructor(prop?: IDbPolyline);
}

/**
 * `DbRadialDimension` 半径标注实体
 *
 */
export  class DbRadialDimension extends DbDimension {
    /** 中心点. */
    center?: Array<[number, number, number?]>;
    /** 圆上点. */
    chordPoint?: Array<[number, number, number?]>;
    /** 引线长度. */
    leaderLength?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbRadialDimension);
}

/**
 * `DbRadialDimensionLarge` 半径折线标注实体.
 *
 */
export  class DbRadialDimensionLarge extends DbDimension {
    /** 中心点. */
    center?: Array<[number, number, number?]>;
    /** 圆上点. */
    chordPoint?: Array<[number, number, number?]>;
    /** 设置由该Dimension实体确定尺寸的弧的WCS覆盖中心。. */
    overrideCenter?: Array<[number, number, number?]>;
    /** 设置此Dimension实体的折角点。. */
    jogPoint?: Array<[number, number, number?]>;
    /** 设置此Dimension实体的折角。. */
    jogAngle?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbRadialDimensionLarge);
}

/**
 * `DbRasterImage` 栅格图像实体.
 *
 */
export  class DbRasterImage extends DbEntity {
    /** 明亮度 [0.0 .. 100.0] */
    brightness?: number;
    /** 图片url地址. */
    sourceHttpUrl?: string;
    /** 源图片宽. */
    pixelWidth?: number;
    /** 源图片高. */
    pixelHeight?: number;
    /** 单位. */
    units?: RasterImageUnits;
    /** x轴每像素代表长度. */
    xPelsPerUnit?: number;
    /** y轴每像素代表长度. */
    yPelsPerUnit?: number;
    /** 宽. */
    width?: number;
    /** 高. */
    height?: number;
    /** 位置. */
    position?: [number, number, number?];
    /** 是否显示. */
    imageDisplayOptShow?: boolean;
    /** 是否裁剪. */
    imageDisplayOptClip?: boolean;
    /** 是否对齐. */
    imageDisplayOptShowUnAligned?: boolean;
    /** 是否透明. */
    imageDisplayOptTransparent?: boolean;
    /**
     * 构造函数
     */
    constructor(prop?: IDbRasterImage);
}

/**
 * `DbRotatedDimension` 转角标注实体.
 *
 */
export  class DbRotatedDimension extends DbDimension {
    /** 线上点1. */
    xLine1Point?: Array<[number, number, number?]>;
    /** 线上点2. */
    xLine2Point?: Array<[number, number, number?]>;
    /** 设置定义此dimension实体尺寸线位置的WCS点。. */
    dimLinePoint?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDbRotatedDimension);
}

/**
 * `DbShape` 型实体
 *
 */
export  class DbShape extends DbEntity {
    /** 旋转角度. */
    rotation?: number;
    /** 位置. */
    position?: [number, number, number?];
    /** 大小. */
    size?: number;
    /** 法向量. */
    normal?: [number, number, number?];
    /** 型名称. */
    name?: string;
    /**
     * 构造函数
     */
    constructor(prop?: IDbShape);
}

/**
 * `DbSpline` 样条曲线实体.
 *
 */
export  class DbSpline extends DbCurve {
    /** the curve fitting tolerance for this Spline entity. */
    fitTol?: number;
    /** Increased the degree of this spline to the specified value. */
    degree?: number;
    /** 拟合点. */
    fitPoints?: Array<[number, number, number?]>;
    /** 控制点. */
    controlPoints?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDbSpline);
}

/**
 * `DbText` 文本实体.
 *
 */
export  class DbText extends DbEntity {
    /** 高. */
    height?: number;
    /** 旋转角度. */
    rotation?: number;
    /** 文本内容， 同contents. */
    text?: string;
    /** 文本内容， 同text. */
    contents?: string;
    /** 位置. */
    position?: [number, number, number?];
    /** 文本样式. */
    textStyle?: string;
    /** 水平模式. */
    horizontalMode?: DbTextHorzMode;
    /** 垂直模式. */
    verticalMode?: DbTextVertMode;
    /**
     * 构造函数
     */
    constructor(prop?: IDbText);
}

 enum DbTextHorzMode {
    kTextLeft = 0,
    kTextCenter = 1,
    kTextRight = 2,
    kTextAlign = 3,
    kTextMid = 4,
    kTextFit = 5
}

/**
 * `DbTextStyle` 文字样式.
 *
 */
export  class DbTextStyle {
    /** 文字样式名称. */
    name?: string;
    /** 是否型文件. */
    isShapeFile?: boolean;
    /** 文本大小 . */
    textSize?: number;
    /** x轴缩放 . */
    xScale?: number;
    /** 设置最近使用此文本样式创建的文本的先前大小 . */
    priorSize?: number;
    /** 设置字母的倾斜角度。正角度顺时针（向右）倾斜字母。负值使字母逆时针倾斜（向左）。通过将值2*PI相加，将负值转换为其正当量。 默认情况下，初始值为0.0. */
    obliquingAngle?: number;
    /** 字体文件名 . */
    fileName?: string;
    /** 字体 . */
    typeFace?: string;
    /** 是否粗体 . */
    bold?: boolean;
    /** 是否斜体 . */
    italic?: boolean;
    /** 字符集标识符，缺省0 . */
    charset?: number;
    /** 字符间距和族，缺省34 . */
    pitchAndFamily?: number;
    /**
     * 构造函数
     */
    constructor(prop?: IDbTextStyle);
}

 enum DbTextVertMode {
    kTextBase = 0,
    kTextBottom = 1,
    kTextVertMid = 2,
    kTextTop = 3
}

/**
 * `DbWipeout` 遮罩实体.
 *
 */
export  class DbWipeout extends DbRasterImage {
    /** 坐标. */
    points?: Array<[number, number, number?]>;
    /**
     * 构造函数
     */
    constructor(prop?: IDbWipeout);
}

export  function decay({ velocity, from, power, timeConstant, restDelta, modifyTarget }: DecayOptions): any;

export  interface DecayOptions {
    from?: number;
    to?: number;
    velocity?: number;
    power?: number;
    timeConstant?: number;
    modifyTarget?: (target: number) => number;
    restDelta?: number;
}

/**
 * deck.gl图层.
 *
 **/
export  class DeckLayer extends Evented implements CustomLayerInterface {
    id: string;
    deckNs: object;
    layer: object;
    type: "custom";
    renderingMode?: "2d" | "3d" | undefined;
    constructor(props: any);
    onAdd(map: any, gl: any): void;
    onRemove(): void;
    setProps(props: any): void;
    render(gl: any, matrix: any): void;
}

export  const degreesToRadians: (degrees: number) => number;

/**
 * 角度转弧度
 * @param a
 * @return {number}
 */
export  function degToRad(a: number): number;

/**
 * 扩散的点.
 */
export  class DiffusedApertureMarker extends MarkerBase {
    constructor(features: FeatureCollection | {
        lngLat: LngLatLike;
        text?: string;
    }, options?: AnimateMarkerLayerOption);
    setMarkersWidth(width: number, index?: number): void;
    setMarkersColors(colors: string[], index?: number): void;
    _createMarker(): void;
}

 type Direction = "start" | "end";

export  function distance<P extends Point23D | number>(a: P, b: P): number;

/**
 * 在一个地理范围内创建一个随缩放而缩放的div的覆盖物
 * 注：如果是svg，则需设置为 viewBox="0 0 width height" preserveAspectRatio="xMinYMin meet", updateDivSize选项设置为true
 **/
export  class DivOverlay {
    options: DivOverlayOptions;
    _map?: Map;
    isShow: boolean;
    minZoom: number;
    maxZoom: number;
    maxPitch: number;
    isRemoved: boolean;
    parentContainer?: HTMLElement;
    constructor(options: DivOverlayOptions);
    addTo(map: Map, insertId?: string | HTMLElement): void;
    private _isShow;
    private _add;
    private _remove;
    /**
     * 设置是否显示隐藏
     * @param visible 是否显示
     * @param isDisplay true的话，表示用style的display去控制隐藏显示，dom还在文档中。false的话，会从文档动态清空增加
     */
    setVisible(visible?: boolean, isDisplay?: boolean): void;
    remove(): void;
    updateBounds(bounds: [GeoPointLike, GeoPointLike, GeoPointLike, GeoPointLike] | GeoBounds): void;
    updateSize(width: number, height: number): void;
    private _updateZoom;
    private _updateDivSize;
    private _adjustCoord;
    private _update;
}

export  interface DivOverlayOptions {
    /** 范围，四个点坐标 */
    bounds: [GeoPointLike, GeoPointLike, GeoPointLike, GeoPointLike] | GeoBounds;
    /** html元素 */
    element: HTMLElement;
    /** 元素宽 */
    width: number;
    /** 元素高 */
    height: number;
    /** 显示最大级别 */
    minZoom?: number;
    /** 显示最小级别 */
    maxZoom?: number;
    /** 显示最大倾斜角 */
    maxPitch?: number;
    /** 自动更新div大小，（如果需要svg放大，需要设置为true) */
    updateDivSize?: boolean;
    /** 放大div时，最大的div大小，超过了就像素放大了 */
    maxDivSize?: number;
}

export  namespace Dom {
    export function create(tagName: string, className?: string, container?: HTMLElement): HTMLElement;
    export function createNS(namespaceURI: string, tagName: string): Element;
    export function disableDrag(): void;
    export function enableDrag(): void;
    export function setTransform(el: HTMLElement, value: string): void;
    export function addEventListener(target: any, type: any, callback: any, options?: {
        passive?: boolean;
        capture?: boolean;
    }): void;
    export function removeEventListener(target: any, type: any, callback: any, options?: {
        passive?: boolean;
        capture?: boolean;
    }): void;
    export function suppressClick(): void;
    export function mousePos(el: HTMLElement, e: MouseEvent | WheelEvent): GeoPoint;
    export function touchPos(el: HTMLElement, touches: TouchList): GeoPoint[];
    export function mouseButton(e: MouseEvent): number;
    export function remove(node: HTMLElement): void;
    export function hasClass(el: HTMLElement, name: string): boolean;
    export function addClass(el: HTMLElement, name: string): void;
    export function removeClass(el: HTMLElement, name: string): void;
    export function setClass(el: HTMLElement, name: string): void;
    export function getClass(el: HTMLElement): any;
    export type Anchor = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    const anchorTranslate: Record<Anchor, string>;
}

export  const Draw: {
    /** 工具类. */
    Tool: (options?: IDrawOptions | undefined) => IDrawTool | any;
    /** 缺省配置项. */
    defaultOptions: () => any;
    /** 模式. */
    modes: Record<string, any>;
    /** 绘制动作. */
    actionDraw: (map: any, modename: string, options?: Record<string, any> | undefined) => any;
    /** 绘制圆动作. */
    actionDrawCircle: (map: any, options?: Record<string, any> | undefined) => any;
    /** 绘制线动作. */
    actionDrawLineSting: (map: any, options?: Record<string, any> | undefined) => any;
    /** 绘制点动作. */
    actionDrawPoint: (map: any, options?: Record<string, any> | undefined) => any;
    /** 绘制多边形动作. */
    actionDrawPolygon: (map: any, options?: Record<string, any> | undefined) => any;
    /** 绘制矩形动作. */
    actionDrawRectangle: (map: any, options?: Record<string, any> | undefined) => any;
    /** 绘制斜矩形动作. */
    actionDrawSlantRectangle: (map: any, options?: Record<string, any> | undefined) => any;
    /** 选择实体. 如果只能选择一个实体，options选项请输入selectSingle为true*/
    actionSelect: (map: any, draw: any, options?: Record<string, any> | undefined) => any;
};

export  type Driver = (update: Update) => DriverControls;

/**
 * Drivers accept a update function and call it at an interval. This interval
 * could be a synchronous loop, a setInterval, or tied to the device's framerate.
 */
export  interface DriverControls {
    start: () => void;
    stop: () => void;
}

export  const easeIn: Easing;

export  const easeInOut: Easing;

export  const easeOut: Easing;

export  type Easing = (v: number) => number;

export  type EasingModifier = (easing: Easing) => Easing;

 type EdgeWeight = number;

/**
 * 创建只有边框的椭圆或椭圆弧
 *
 **/
export  class EllipseEdge extends Polyline {
    constructor(options: EllipseEdgeOptions);
    addTo(map: Map, beforeId?: string): void;
    updateData(): void;
    /** 设置中心点。 */
    setCenter(value: GeoPointLike, bFocusUpdateData?: boolean): this;
    /** 得到中心点。 */
    getCenter(): GeoPointLike;
    /** 设置长轴半径。 */
    setMajorAxisRadius(value: number, bFocusUpdateData?: boolean): this;
    /** 得到长轴半径。 */
    getMajorAxisRadius(): number;
    /** 设置短轴半径。 */
    setMinorAxisRadius(value: number, bFocusUpdateData?: boolean): this;
    /** 得到短轴半径。 */
    getMinorAxisRadius(): number;
    /** 设置开始角度。 */
    setStartAngle(value: number, bFocusUpdateData?: boolean): this;
    /** 得到开始角度。 */
    getStartAngle(): number;
    /** 设置结束角度。 */
    setEndAngle(value: number, bFocusUpdateData?: boolean): this;
    /** 得到结束角度。 */
    getEndAngle(): number;
    /** 设置离散化的点的个数。 */
    setPoints(value: number, bFocusUpdateData?: boolean): this;
    /** 得到离散化的点的个数。 */
    getPoints(): number;
}

export  interface EllipseEdgeOptions extends PolylineOptions {
    /** 中心点 */
    center: GeoPointLike;
    /** 长轴半径 */
    majorAxisRadius: number;
    /** 短轴半径 */
    minorAxisRadius: number;
    /** 开始角度 */
    startAngle?: number;
    endAngle?: number;
    points?: number;
    /** 属性数据 */
    properties?: object;
}

/**
 * 创建填充的的椭圆或椭圆弧
 *
 **/
export  class EllipseFill extends Polygon {
    constructor(options: EllipseFillOptions);
    addTo(map: Map, beforeId?: string): void;
    updateData(): void;
    /** 设置中心点。 */
    setCenter(value: GeoPointLike, bFocusUpdateData?: boolean): this;
    /** 得到中心点。 */
    getCenter(): GeoPointLike;
    /** 设置长轴半径。 */
    setMajorAxisRadius(value: number, bFocusUpdateData?: boolean): this;
    /** 得到长轴半径。 */
    getMajorAxisRadius(): number;
    /** 设置短轴半径。 */
    setMinorAxisRadius(value: number, bFocusUpdateData?: boolean): this;
    /** 得到短轴半径。 */
    getMinorAxisRadius(): number;
    /** 设置开始角度。 */
    setStartAngle(value: number, bFocusUpdateData?: boolean): this;
    /** 得到开始角度。 */
    getStartAngle(): number;
    /** 设置结束角度。 */
    setEndAngle(value: number, bFocusUpdateData?: boolean): this;
    /** 得到结束角度。 */
    getEndAngle(): number;
    /** 设置离散化的点的个数。 */
    setPoints(value: number, bFocusUpdateData?: boolean): this;
    /** 得到离散化的点的个数。 */
    getPoints(): number;
}

export  interface EllipseFillOptions extends PolygonOptions {
    /** 中心点 */
    center: GeoPointLike;
    /** 长轴半径 */
    majorAxisRadius: number;
    /** 短轴半径 */
    minorAxisRadius: number;
    /** 开始角度 */
    startAngle?: number;
    endAngle?: number;
    points?: number;
    /** 属性数据 */
    properties?: object;
}

/**
 * 实体颜色转html颜色
 * @param color 实体颜色
 * @param darkMode  样式是否为暗黑框
 * @param alpha 透明度的值
 * @return {string}
 */
export  function entColorToHtmlColor(color: number | string, darkMode?: boolean, alpha?: number): string;

 enum EpsgCrsTypes {
    Beijing54 = "Beijing54",
    Xian80 = "Xian80",
    CGCS2000 = "CGCS2000",
    Wgs84 = "Wgs84",
    Merc3857 = "Merc3857"
}

export  const EPSILON = 1e-8;

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
export  function equals(a: number, b: number): boolean;

export  const EVENTS: {
    READY_STATE_CHANGE: string;
    LOAD_START: string;
    PROGRESS: string;
    ABORT: string;
    ERROR: string;
    LOAD: string;
    TIMEOUT: string;
    LOAD_END: string;
};

export  interface Events {
    READY_STATE_CHANGE: "readystatechange";
    LOAD_START: "loadstart";
    PROGRESS: "progress";
    ABORT: "abort";
    ERROR: "error";
    LOAD: "load";
    TIMEOUT: "timeout";
    LOAD_END: "loadend";
}

export  type ExpressionSpecificationEx = Array<unknown>;

/**
 * Given a destination object and optionally many source objects,
 * copy all properties from the source objects into the destination.
 * The last source object given overrides properties from previous
 * source objects.
 *
 * @param dest destination object
 * @param sources sources from which properties are pulled
 * @private
 */
export  function extend(dest: Object, ...sources: Object[]): Object;

/**
 * Feature
 *
 * https://tools.ietf.org/html/rfc7946#section-3.2
 * A Feature object represents a spatially bounded thing.
 * Every Feature object is a GeoJSON object no matter where it occurs in a GeoJSON text.
 */
 interface Feature<G = Geometry | GeometryCollection, P = Properties> extends GeoJSONObject {
    type: "Feature";
    geometry: G;
    /**
     * A value that uniquely identifies this feature in a
     * https://tools.ietf.org/html/rfc7946#section-3.2.
     */
    id?: Id;
    /**
     * Properties associated with this feature.
     */
    properties: P;
}

/**
 * Feature Collection
 *
 * https://tools.ietf.org/html/rfc7946#section-3.3
 * A GeoJSON object with the type 'FeatureCollection' is a FeatureCollection object.
 * A FeatureCollection object has a member with the name 'features'.
 * The value of 'features' is a JSON array. Each element of the array is a Feature object as defined above.
 * It is possible for this array to be empty.
 */
 interface FeatureCollection<G = Geometry | GeometryCollection, P = Properties> extends GeoJSONObject {
    type: "FeatureCollection";
    features: Array<Feature<G, P>>;
}

/**
 * 创建拉伸的多边形.
 *
 **/
export  class FillExtrusion extends OverlayLayerBase {
    options: FillExtrusionOptions;
    constructor(options: FillExtrusionOptions);
    addTo(map: Map, beforeId?: string): void;
    /** 替换 GeoJSON 图层的当前数据。
     @param {GeoJSON} [data] GeoJSON object to set. If not provided, defaults to an empty FeatureCollection.
     */
    setData(data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any): void;
    setFillExtrusionOpacity(value: PropertyValueSpecificationEx<number>): this;
    getFillExtrusionOpacity(): PropertyValueSpecificationEx<number>;
    setFillExtrusionColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    getFillExtrusionColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    setFillExtrusionTranslate(value: PropertyValueSpecificationEx<[number, number]>): this;
    getFillExtrusionTranslate(): PropertyValueSpecificationEx<[number, number]>;
    setFillExtrusionTranslateAnchor(value: PropertyValueSpecificationEx<"map" | "viewport">): this;
    getFillExtrusionTranslateAnchor(): PropertyValueSpecificationEx<"map" | "viewport">;
    setFillExtrusionPattern(value: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>): this;
    getFillExtrusionPattern(): DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    setFillExtrusionHeight(value: DataDrivenPropertyValueSpecification<number>): this;
    getFillExtrusionHeight(): DataDrivenPropertyValueSpecification<number>;
    setFillExtrusionBase(value: DataDrivenPropertyValueSpecification<number>): this;
    getFillExtrusionBase(): DataDrivenPropertyValueSpecification<number>;
    setFillExtrusionVerticalGradient(value: PropertyValueSpecificationEx<boolean>): this;
    getFillExtrusionVerticalGradient(): PropertyValueSpecificationEx<boolean>;
}

export  type FillExtrusionLayerSpecification = {
    id: string;
    type: "fill-extrusion";
    metadata?: unknown;
    source: string;
    "source-layer"?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    layout?: {
        visibility?: "visible" | "none";
    };
    paint?: {
        "fill-extrusion-opacity"?: PropertyValueSpecificationEx<number>;
        "fill-extrusion-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "fill-extrusion-translate"?: PropertyValueSpecificationEx<[number, number]>;
        "fill-extrusion-translate-anchor"?: PropertyValueSpecificationEx<"map" | "viewport">;
        "fill-extrusion-pattern"?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
        "fill-extrusion-height"?: DataDrivenPropertyValueSpecification<number>;
        "fill-extrusion-base"?: DataDrivenPropertyValueSpecification<number>;
        "fill-extrusion-vertical-gradient"?: PropertyValueSpecificationEx<boolean>;
    };
};

export  type FillExtrusionLayerStyleProp = {
    metadata?: unknown;
    source?: string;
    sourceLayer?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    visibility?: "visible" | "none";
    fillExtrusionOpacity?: PropertyValueSpecificationEx<number>;
    fillExtrusionColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    fillExtrusionTranslate?: PropertyValueSpecificationEx<[number, number]>;
    fillExtrusionTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    fillExtrusionPattern?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    fillExtrusionHeight?: DataDrivenPropertyValueSpecification<number>;
    fillExtrusionBase?: DataDrivenPropertyValueSpecification<number>;
    fillExtrusionVerticalGradient?: PropertyValueSpecificationEx<boolean>;
};

export  interface FillExtrusionOptions extends OverlayLayerBaseOptions {
    data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any;
    fillExtrusionOpacity?: PropertyValueSpecificationEx<number>;
    fillExtrusionColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    fillExtrusionTranslate?: PropertyValueSpecificationEx<[number, number]>;
    fillExtrusionTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    fillExtrusionPattern?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    fillExtrusionHeight?: DataDrivenPropertyValueSpecification<number>;
    fillExtrusionBase?: DataDrivenPropertyValueSpecification<number>;
    fillExtrusionVerticalGradient?: PropertyValueSpecificationEx<boolean>;
}

export  type FillLayerSpecification = {
    id: string;
    type: "fill";
    metadata?: unknown;
    source: string;
    "source-layer"?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    layout?: {
        "fill-sort-key"?: DataDrivenPropertyValueSpecification<number>;
        visibility?: "visible" | "none";
    };
    paint?: {
        "fill-antialias"?: PropertyValueSpecificationEx<boolean>;
        "fill-opacity"?: DataDrivenPropertyValueSpecification<number>;
        "fill-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "fill-outline-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "fill-translate"?: PropertyValueSpecificationEx<[number, number]>;
        "fill-translate-anchor"?: PropertyValueSpecificationEx<"map" | "viewport">;
        "fill-pattern"?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    };
};

export  type FillLayerStyleProp = {
    metadata?: unknown;
    source?: string;
    sourceLayer?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    visibility?: "visible" | "none";
    fillSortKey?: DataDrivenPropertyValueSpecification<number>;
    fillAntialias?: PropertyValueSpecificationEx<boolean>;
    fillOpacity?: DataDrivenPropertyValueSpecification<number>;
    fillColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    fillOutlineColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    fillTranslate?: PropertyValueSpecificationEx<[number, number]>;
    fillTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    fillPattern?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
};

export  type FilterSpecification = ["has", string] | ["!has", string] | ["==", string, string | number | boolean] | ["!=", string, string | number | boolean] | [">", string, string | number | boolean] | [">=", string, string | number | boolean] | ["<", string, string | number | boolean] | ["<=", string, string | number | boolean] | Array<string | FilterSpecification>;

/**
 * 给定所有路线、起始点、终点生成最短路径
 * @param startPoint 起点
 * @param endPoint 终点
 * @param lines 坐标，请转成几何坐标，再传入
 * @param precision 误差，小数点后几位， 以为相同, 如果两个点的坐标距离小于此值，则认为是同一个节点
 * @param hasDirection 是否考虑方向
 */
export  function findShortestPath(startPoint: GeoPoint, endPoint: GeoPoint, lines: Array<{
    points: GeoPoint[];
    id?: string;
    weight?: number;
}>, precision?: number, hasDirection?: boolean): {
    startPoint: {
        closestLength: number;
        closestPoint: GeoPoint;
        closestIndex: number;
        closestPointIndex: number;
        closestPrePointDist: number;
    };
    endPoint: {
        closestLength: number;
        closestPoint: GeoPoint;
        closestIndex: number;
        closestPointIndex: number;
        closestPrePointDist: number;
    };
    route: any[];
    routeDetail: {
        points: any[];
        index: any;
        reverse: boolean;
    }[];
    error?: undefined;
} | {
    error: any;
    startPoint?: undefined;
    endPoint?: undefined;
    route?: undefined;
    routeDetail?: undefined;
};

/**
 * 荧光点.
 */
export  class FluorescenceMarker extends MarkerBase {
    constructor(features: FeatureCollection | {
        lngLat: LngLatLike;
        text?: string;
    }, options?: AnimateMarkerLayerOption);
    setMarkersWidth(width: number, index?: number): void;
    setMarkersColors(colors: string[], index?: number): void;
    _createMarker(): void;
    private _setFluorescenceWidth;
    private _setFluorescenceColor;
}

export  type FogSpecification = {
    range?: PropertyValueSpecificationEx<[number, number]>;
    color?: PropertyValueSpecificationEx<ColorSpecification>;
    "horizon-blend"?: PropertyValueSpecificationEx<number>;
};

export  type FormattedSpecification = string;

/**
 * @property {Boolean} running - Getter that indicates if animation is running.
 * @property {function():void} stop - Stops the animation.
 * @property {function():void} start - Starts the animation.
 */
export  interface FrameAnimation {
    /**
     * A getter property that indicates if animation is running.
     */
    readonly running: boolean;
    /**
     * A getter property that indicates if animation is running.
     */
    readonly status: FrameAnimationStatus;
    /**
     * Stops the animation.
     */
    stop: () => void;
    /**
     * Starts the animation.
     */
    start: () => void;
    /**
     * pause the animation.
     */
    pause: () => void;
    /**
     * 一秒运行多少帧，用来控制速度
     */
    changeFps: (fps: number) => void;
}

export  enum FrameAnimationStatus {
    /** 运行. */
    Run = 0,
    /** 停止（用户主动调用stop). */
    Stop = 1,
    /** 暂停. */
    Pause = 2,
    /** 结束 (回调函数中返回true). */
    End = 3
}

/**
 * `GeoBounds` 地理范围.
 */
export  class GeoBounds {
    min: GeoPoint;
    max: GeoPoint;
    constructor(min?: GeoPoint, max?: GeoPoint);
    /**
     * 根据数组创建 `GeoBounds`.
     *
     * Example:
     * ```typescript
     * const b = GeoBounds.fromArray(left, bottom, right, top);
     * ```
     */
    static fromArray(input: [number, number, number, number]): GeoBounds;
    /**
     * 根据数组创建 `GeoBounds`.
     *
     * Example:
     * ```typescript
     * const b = GeoBounds.fromString("[1,2,3,4]");
     * ```
     */
    static fromString(input: string): GeoBounds;
    /**
     * 根据数据范围来生成bounds
     * @param input
     * @return {GeoBounds}
     */
    static fromDataExtent(input: GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]): GeoBounds;
    /**
     * 根据中心点和长，宽生成bounds
     * @return {GeoBounds}
     * @param center 中心点
     * @param width 宽
     * @param height 高，不输入时与宽一样
     */
    static fromCenterWH(center: GeoPointLike, width: number, height?: number): GeoBounds;
    /**
     * 设置包围盒范围
     *
     * @param min 最小值
     * @param max 最大值
     */
    set(min: GeoPoint, max: GeoPoint): void;
    /**
     * 得到中心点
     * @return {GeoPoint}
     */
    center(): GeoPoint;
    /**
     * 生成一个随机点
     * @return {GeoPoint}
     * @param xRatio x轴范围比例 缺省 0.6
     * @param yRatio y轴范围比例 缺省 0.6
     */
    randomPoint(xRatio?: number, yRatio?: number): GeoPoint;
    /**
     * 生成一个随机点序列
     * @return {GeoPoint}
     * @param xRatio x轴范围比例 缺省 0.6
     * @param yRatio y轴范围比例 缺省 0.6
     * @param minPointCount 最少的点数
     * @param maxPointCount 最多的点数
     */
    randomPoints(minPointCount: number, maxPointCount: number, xRatio?: number, yRatio?: number): GeoPoint[];
    /**
     * 生成一个随机geojson点集合
     * @return {GeoPoint}
     * @param xRatio x轴范围比例 缺省 0.6
     * @param yRatio y轴范围比例 缺省 0.6
     * @param count 点的数目
     * @param propertiesCb 属性回调函数
     */
    randomGeoJsonPointCollection(count: number, xRatio?: number, yRatio?: number, propertiesCb?: (index: number) => Object): GeoJsonGeomertry;
    /**
     * 生成一个随机geojson线集合
     * @return {GeoPoint}
     * @param xRatio x轴范围比例 缺省 0.6
     * @param yRatio y轴范围比例 缺省 0.6
     * @param maxLineCount 最多线的数目
     * @param maxPointCount 每条线最多的点的数目
     * @param propertiesCb 属性回调函数
     */
    randomGeoJsonLineCollection(maxLineCount: number, maxPointCount: number, xRatio?: number, yRatio?: number, propertiesCb?: (index: number) => Object): GeoJsonGeomertry;
    /**
     * 生成一个随机geojson多边形集合
     * @return {GeoPoint}
     * @param xRatio x轴范围比例 缺省 0.6
     * @param yRatio y轴范围比例 缺省 0.6
     * @param maxPolygonCount 最多多边形的数目
     * @param maxPointCount 每条线最多的点的数目
     * @param propertiesCb 属性回调函数
     */
    randomGeoJsonPolygonCollection(maxPolygonCount: number, maxPointCount: number, xRatio?: number, yRatio?: number, propertiesCb?: (index: number) => Object): GeoJsonGeomertry;
    /**
     * 返回数组
     *
     * @returns {Array} The coordinates represented as a array of the format `[minx, miny, maxx, maxy]'`.
     *
     */
    toArray(): number[];
    /**
     * 返回点数组，包括四个顶点
     *
     * @returns {Array} The coordinates represented as a array of the format `[[minx,maxy], [maxx,maxy], [maxx,miny], [minx,miny]]'`.
     *
     */
    toPointArray(): Array<[number, number]>;
    /**
     * 返回字符串.
     *
     * @returns {string} The coordinates represented as a string of the format `minx, miny, maxx, maxy'`.
     *
     */
    toString(fixed?: number): string;
    /**
     *  克隆
     *
     */
    clone(): GeoBounds;
    /**
     * 变成正方形，使宽高相等
     * @param isLatlng 是否是经纬度
     * @param isMinValue 是否取宽高的最小值或最大值，默认最大值
     * @return{GeoBounds}
     */
    square(isLatlng?: boolean, isMinValue?: boolean): GeoBounds;
    /**
     *  获取宽度
     *
     */
    width(): number;
    /**
     *  获取高度
     *
     */
    height(): number;
    /**
     *  按照比例扩大/缩小出一个新的 GeoBounds。
     * @param ratio 比例
     * @param origin 扩大时的基准点，默认为当前 bounds 的中心点
     */
    scale(ratio: number, origin?: GeoPoint | null): GeoBounds;
    /**
     *  按照XY比例扩大/缩小出一个新的 GeoBounds。
     * @param ratioX X比例
     * @param ratioY Y比例
     * @param origin 扩大时的基准点，默认为当前 bounds 的中心点
     */
    scaleXY(ratioX: number, ratioY: number, origin?: GeoPoint | null): GeoBounds;
    /**
     * 位移包围盒
     * @param dx
     * @param dy
     */
    translate(dx: number, dy: number): void;
    /**
     * 更新包围盒
     * @param vertices
     */
    update(vertices: GeoPoint[]): void;
    /**
     * 根据子包围盒更新包围盒
     * @param bounds
     */
    updateByBounds(bounds: GeoBounds[] | GeoBounds): void;
    /**
     * 两包围盒求交集
     * @param b
     */
    intersect(b: GeoBounds): GeoBounds | null;
    /**
     * 求多个包围盒的并集
     * @param bound
     */
    union(bound: GeoBounds): GeoBounds;
    /**
     * 判断与另一个包围盒是否相交
     * @param bound
     */
    isIntersect(bound: GeoBounds): boolean;
    /**
     * 求一个包围盒是否包含另一个包围盒
     * @param bound
     */
    isContains(bound: GeoBounds): boolean;
    /**
     * 查看点是否在包围盒中
     * @param point
     */
    contains(point: GeoPoint): boolean;
    /**
     * Returns the value in the interval that is nearest to `targetValue`.
     *
     * @ignore
     * @param interval        The interval to find the value within.
     * @param targetValue     The value to get nearest to.
     * @param includeInterior If false, the value will either be [[min]] or [[max]].
     *                        If true, the value may be any number between [[min]] and [[max]].
     */
    private closestInterval;
    /**
     * 查找边界框上最近的点并返回该点.
     * @param testPoint       点.
     * @param includeInterior 如果为true，则最近的点可以位于边界框内。如果为false，则最近的点只能位于边界框的外边缘上.
     */
    closestPoint(testPoint: GeoPoint, includeInterior?: boolean): GeoPoint;
}

/**
 * new一个GeoBounds实例
 * @param min
 * @param max
 */
export  function geoBounds(min?: GeoPoint, max?: GeoPoint): GeoBounds;

/**
 * GeoJSON
 *
 * All GeoJSON objects
 */
 type GeoJsonGeomertry = Feature | FeatureCollection | Geometry | GeometryCollection;

/**
 * GeoJSON Object
 *
 * https://tools.ietf.org/html/rfc7946#section-3
 * The GeoJSON specification also allows [foreign members](https://tools.ietf.org/html/rfc7946#section-6.1)
 * Developers should use '&' type in TypeScript or extend the interface to add these foreign members.
 */
 interface GeoJSONObject {
    /**
     * Specifies the type of GeoJSON object.
     */
    type: string;
    /**
     * Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections.
     * https://tools.ietf.org/html/rfc7946#section-5
     */
    bbox?: BBox;
}

export  type GeoJSONSourceSpecification = {
    type: "geojson";
    data?: unknown;
    maxzoom?: number;
    attribution?: string;
    buffer?: number;
    filter?: unknown;
    tolerance?: number;
    cluster?: boolean;
    clusterRadius?: number;
    clusterMaxZoom?: number;
    clusterMinPoints?: number;
    clusterProperties?: unknown;
    lineMetrics?: boolean;
    generateId?: boolean;
    promoteId?: PromoteIdSpecificationEx;
};

/**
 * Geometry
 *
 * https://tools.ietf.org/html/rfc7946#section-3
 */
 interface Geometry extends GeoJSONObject {
    coordinates: Position | Position[] | Position[][] | Position[][][];
}

/**
 * GeometryCollection
 *
 * https://tools.ietf.org/html/rfc7946#section-3.1.8
 *
 * A GeoJSON object with type 'GeometryCollection' is a Geometry object.
 * A GeometryCollection has a member with the name 'geometries'.
 * The value of 'geometries' is an array.  Each element of this array is a GeoJSON Geometry object.
 * It is possible for this array to be empty.
 */
 interface GeometryCollection extends GeometryObject {
    type: "GeometryCollection";
    geometries: Array<GeometryPoint | LineString | Polygon_2 | MultiPoint | MultiLineString | MultiPolygon>;
}

/**
 * Geometry Object
 *
 * https://tools.ietf.org/html/rfc7946#section-3
 */
 interface GeometryObject extends GeoJSONObject {
    type: GeometryTypes;
}

/**
 * Point Geometry Object
 *
 * https://tools.ietf.org/html/rfc7946#section-3.1.2
 */
 interface GeometryPoint extends GeometryObject {
    type: "GeometryPoint";
    coordinates: Position;
}

/**
 * GeometryTypes
 *
 * https://tools.ietf.org/html/rfc7946#section-1.4
 * The valid values for the 'type' property of GeoJSON geometry objects.
 */
 type GeometryTypes = "GeometryPoint" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon" | "GeometryCollection";

/**
 * `GeoPoint` 地理坐标.
 */
export  class GeoPoint {
    /**
     * 根据不同的类型创建地理坐标 {@link GeoPoint} .
     *
     * Example:
     * ```typescript
     * const p1 = GeoPoint.convert(new GeoPoint(x, y, z));
     * const p2 = GeoPoint.convert([x, y]);
     * const p3 = GeoPoint.convert([x, y, z]);
     * const p4 = GeoPoint.convert(lng: -73.9749, lat: 40.7736});
     * const p5 = GeoPoint.convert(lon: -73.9749, lat: 40.7736});
     * ```
     *
     * @param input - Either [[GeoPointLike]], {@link GeoPointLike}
     * or {@link GeoPointLike} object literal.
     */
    static convert(input: GeoPointLike): GeoPoint;
    /**
     * 根据字符串创建 `GeoPoint`.
     *
     * Example:
     * ```typescript
     * const b = GeoPoint.fromString("1,2");
     * ```
     */
    static fromString(input: string): GeoPoint;
    /** 坐标X. */
    x: number;
    /** 坐标y. */
    y: number;
    /** 坐标z(可选）. */
    z?: number;
    /**
     *  `GeoPoint` 构造函数
     *
     * @param x - x坐标.
     * @param y - y坐标.
     * @param z - z坐标(可选）.
     */
    constructor(x: number, y: number, z?: number);
    /**
     *  克隆一个坐标
     *
     */
    clone(): GeoPoint;
    private _add;
    /**
     * 返回数组
     *
     * @returns {Array<number>} The coordinates represeted as an array of x and y.
     * ```typescript
     * var ll = new vjmap.GeoPoint(-73.9749, 40.7736);
     * ll.toArray(); // = [-73.9749, 40.7736]
     * ```
     */
    toArray(): number[];
    /**
     * 返回字符串.
     * @param fixed
     * @returns {string} The coordinates represented as a string of the format `'x, y, z?'`.
     * ```typescript
     * var ll = new vjmap.GeoPoint(-73.9749, 40.7736);
     * ll.toString(); // = "GeoPoint(-73.9749, 40.7736)"
     * ```
     */
    toString(fixed?: number): string;
    /**
     * 后小数点几位取整
     * @param fixed
     * @return {GeoPoint}
     */
    round(fixed?: number): GeoPoint;
    roundStr(fixed?: number): string;
    /**
     * 两个点相加.
     *
     * @param p - 要相加的点.
     */
    add(p: GeoPoint): GeoPoint;
    private _sub;
    /**
     * 两个点相减.
     *
     * @param p - 要相减的点.
     */
    sub(p: GeoPoint): GeoPoint;
    lengthSq(): number;
    private _multByPoint;
    /**
     * 两个点相乘.
     *
     * @param p - 要相乘的点.
     */
    multByPoint(p: GeoPoint): GeoPoint;
    private _divByPoint;
    /**
     * 两个点相除.
     *
     * @param p - 要相除的点.
     */
    divByPoint(p: GeoPoint): GeoPoint;
    dot(p: GeoPoint): number;
    lerp(v: GeoPoint, alpha: number): this;
    private _mult;
    /**
     * 乘一个系数.
     *
     * @param k - 系数.
     */
    mult(k: number): GeoPoint;
    private _div;
    /**
     * 除一个系数.
     *
     * @param k - 系数.
     */
    div(k: number): GeoPoint;
    private _rotate;
    /**
     * 旋转.
     *
     * @param angle - 弧度.
     */
    rotate(angle: number): GeoPoint;
    private _rotateAround;
    /**
     * 绕一个点旋转.
     *
     * @param angle - 弧度.
     * @param p - 围绕的点.
     */
    roateAround(angle: number, p: GeoPoint): GeoPoint;
    private _matMult;
    /**
     * 乘一个矩阵.
     *
     * @param m - 矩阵值.
     */
    matMult(m: number[]): GeoPoint;
    private _unit;
    /**
     * 单位长度.
     *
     */
    unit(): GeoPoint;
    private _perp;
    /**
     * 投影 [x,y] = [-y, x].
     *
     */
    perp(): GeoPoint;
    private _round;
    /**
     * 四舍五入取整.
     *
     */
    roundInt(): GeoPoint;
    /**
     * 长度.
     *
     */
    mag(): number;
    /**
     * 判断是否相等
     * @param other 另外一个点
     * @param dotErr 允许误差的小数点后几位，默认8位
     * @return {boolean}
     */
    equals(other: GeoPoint, dotErr?: number): boolean;
    /**
     * 是否相等（判断z).
     *
     */
    equalsZ(other: GeoPoint): boolean;
    /**
     * 两点之间距离.
     *
     */
    distanceTo(p: GeoPoint): number;
    /**
     * 两点之间距离平方.
     *
     */
    distSqr(p: GeoPoint): number;
    /**
     * 角度.
     *
     */
    angle(): number;
    /**
     * 距一个点的角度
     *
     */
    angleTo(b: GeoPoint): number;
    /**
     * 距一个点的interiorAngle
     *
     */
    angleWith(b: GeoPoint): number;
    /**
     * 距一个点的interiorAngle
     *
     */
    angleWithSep(x: number, y: number): number;
    /**
     * 对一个点围绕一个基点进行缩放旋转平移操作.
     * @param basePt 围绕的基点坐标
     * @param destPt 要平移至的目的地坐标
     * @param scale 缩放比例，默认1.0
     * @param angle 旋转角度，逆时针，默认0
     * @return {GeoPoint}
     *
     */
    transform(basePt: GeoPoint, destPt: GeoPoint, scale?: number, angle?: number): this;
}

/**
 * new一个GeoPoint实例
 * @param input
 * @return {GeoPoint}
 */
export  function geoPoint(input: GeoPointLike): GeoPoint;

export  type GeoPointLike = [number, number] | [number, number, number] | GeoPoint | {
    x: number;
    y: number;
    z?: number;
} | {
    lng: number;
    lat: number;
} | {
    lon: number;
    lat: number;
};

/**
 * `GeoProjection` 地理坐标投影.
 *
 * Example:
 * ```typescript
 * const mapExtent = new GeoBounds(new GeoPoint(10, 20), new GeoPoint(80, 90));
 * const prj = new GeoProjection(mapExtent);
 * const pt = [30, 30];
 * const latlng = prj.toLngLat(pt);
 * const pt_geo = prj.fromLngLat(latlng);
 * const mkt = prj.toMercator(pt);
 * const pt_mkt = prj.fromMercator(mkt);
 * ```
 */
export  class GeoProjection extends Projection {
    /** 地图地理范围. */
    mapExtent: GeoBounds;
    private _ratio_x;
    private _ratio_y;
    /**
     *  `GeoBounds` 构造函数
     *
     * @extent extent - 地图地理范围.
     */
    constructor(extent: GeoBounds);
    /**
     *  设置地图范围
     *
     * @extent extent - 地图地理范围.
     */
    setExtent(extent: GeoBounds): void;
    /**
     * 坐标转墨卡托(epsg:3857)
     * @param input 坐标点
     * @return {[number, number]}
     */
    toMercator(input: GeoPointLike): [number, number];
    /**
     * 墨卡托(epsg:3857)转坐标
     * @param input 墨卡托坐标点
     * @return {[number, number]}
     */
    fromMercator(input: GeoPointLike): [number, number];
    /**
     * 地图地理坐标转经纬度
     * @param input 地理坐标点
     * @return {[number, number]}
     */
    toLngLat(input: GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]): LngLatLike;
    /**
     * 经纬度转地图地理坐标
     * @param input 经纬度坐标点
     * @return {GeoPoint}
     */
    fromLngLat(input: GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]): GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[];
    /**
     * 得到地图范围
     * @return {GeoBounds}
     */
    getMapExtent(): GeoBounds;
    /**
     * 把距离转化为米
     * @param dist
     */
    toMeter(dist: number): number;
    /**
     * 把米转化为距离
     * @param meter
     */
    fromMeter(meter: number): number;
}

/**
 *计算贝塞尔曲线的长度
 * @param bezierCurve 贝塞尔曲线
 * @param precision 需要的计算精度
 * @param recursiveCount 迭代次数
 */
export  function getBezierCurveLength(bezierCurve: BezierCurve, precision?: number, recursiveCount?: number): number;

/**
 *  得到圆或圆弧的离散化的多边形的geojson的形式
 * @param center 中心点
 * @param radius 半径
 * @param points 离散化的个数
 * @param startAngle 开始角度
 * @param endAngle 结束角度
 * @param includeCenterWhenArc 如果是圆弧时，最后一个点加上中心点
 * @return {{geometry: {coordinates: [number[][]], type: string}, type: string, properties: {}}}
 */
export  function getCircleFeature(center: GeoPointLike, radius: number, points?: number, startAngle?: number, endAngle?: number, includeCenterWhenArc?: boolean): GeoJsonGeomertry;

/**
 *  得到圆或圆弧的离散化的多边形的点
 * @param center 中心点
 * @param radius 半径
 * @param points 离散化的个数
 * @param startAngle 开始角度
 * @param endAngle 结束角度
 * @param includeCenterWhenArc 如果是圆弧时，最后一个点加上中心点
 */
export  function getCirclePolygonCoordinates(center: GeoPointLike, radius: number, points?: number, startAngle?: number, endAngle?: number, includeCenterWhenArc?: boolean): number[][];

export  function _getEdgeIntersection(a: GeoPoint, b: GeoPoint, code: number, bounds: GeoBounds): GeoPoint;

/**
 *  得到圆或圆弧的离散化的多边形的geojson的形式
 * @param center 中心点
 * @param majorAxisRadius: number,
 * @param minorAxisRadius: number,
 * @param points 离散化的个数
 * @param startAngle 开始角度
 * @param endAngle 结束角度
 * @param includeCenterWhenArc 如果是圆弧时，最后一个点加上中心点
 * @return {{geometry: {coordinates: [number[][]], type: string}, type: string, properties: {}}}
 */
export  function getEllipseFeature(center: GeoPointLike, majorAxisRadius: number, minorAxisRadius: number, points?: number, startAngle?: number, endAngle?: number, includeCenterWhenArc?: boolean): GeoJsonGeomertry;

/**
 *  得到椭圆或椭圆弧的离散化的多边形的点
 * @param center 中心点
 * @param points 离散化的个数
 * @param startAngle 开始角度
 * @param endAngle 结束角度
 * @param includeCenterWhenArc 如果是椭/圆弧时，最后一个点加上中心点
 * @param majorAxisRadius 长轴半径
 * @param minorAxisRadius 短轴半径
 * @return {any[]}
 */
export  function getEllipsePolygonCoordinates(center: GeoPointLike, majorAxisRadius: number, minorAxisRadius: number, points?: number, startAngle?: number, endAngle?: number, includeCenterWhenArc?: boolean): number[][];

/**
 * 根据外包矩形创建 `GeoBounds`.
 *
 * Example:
 * ```typescript
 * const b = vjmap.getEnvelopBounds('POLYGON((3466315.697899 6704304.297588, 3466315.697899 7784496.211226, 4546475.901198 7784496.211226, 4546475.901198 6704304.297588, 3466315.697899 6704304.297588))', prj);
 * ```
 */
export  function getEnvelopBounds(envelop: string, prj: Projection_2): GeoBounds;

/**
 * 根据带系和坐标系来得到proj4的参数
 * @param crs 投影坐标类型
 * @param lon 如果为北京54,西安80，2000坐标，需要传入8位的经度坐标，或者带系前两位。如果是wgs84或3857，则不需要传入
 * @returns {null | {epsg: string, proj: string}}
 */
 function getEpsgParam(crs: EpsgCrsTypes, lon?: number): {
    epsg: string;
    proj: string;
} | null;

/**
 * 获取一个geojson的
 * @param data 输入值
 * @return {GeoBounds} 获取的范围值
 */
export  function getGeoBounds<T extends GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]>(data: T | string): GeoBounds;

/**
 * Get first defined value.
 *
 * Specialized "replacement" for `a || b || c` used frequently to get value from various sources
 * (defaults, configs  constants).
 * In contrast to `||`, this function provides proper typing for usual use cases (constant as last
 * argument) and correct treatment of `null` and `undefined`.
 *
 * If last parameter is "defined" then return type is `T`, otherwise return type is `T | undefined`.
 *
 * Usage example:
 *
 *     interface Config {
 *         x?: number;
 *     }
 *     const someConfig: Config = {};
 *     const val: number | undefined = undefined;
 *     const DEFAULT = 5;
 *     const x = getOptionValue(val, someConfig.x, DEFAULT);
 *         // typeof x === 'number' because DEFAULT is defined
 *     const y = getOptionValue(val, someConfig.x);
 *         // typeof y === 'number | undefined' because someConfig.x is possibly undefined
 */
export  function getOptionValue<T>(a: T): T;

export  function getOptionValue<T>(a: T | undefined, b: T): T;

export  function getOptionValue<T>(a: T | undefined, b: T | undefined, c: T): T;

export  function getOptionValue<T>(a: T | undefined, b: T | undefined, c: T | undefined, d: T): T;

export  function getOptionValue<T>(...values: Array<T | undefined>): T | undefined;

/**
 * 具有深度优先搜索和拓扑排序的图数据结构。
 *
 * @example
 * var graph = Graph()
 * .addEdge("s", "t", 10)
 * .addEdge("s", "y", 5)
 * .addEdge("s", "y", 4)
 * .addEdge("t", "y", 2)
 * .addEdge("y", "t", 3)
 * .addEdge("t", "x", 1)
 * .addEdge("y", "x", 9)
 * .addEdge("y", "z", 2)
 * .addEdge("x", "z", 4)
 * .addEdge("z", "x", 6);
 * var res = graph.shortestPath("s", "z")
 */
export  function Graph(serialized?: Serialized): {
    addNode: (node: NodeId) => any;
    removeNode: (node: NodeId) => any;
    nodes: () => NodeId[];
    adjacent: (node: NodeId) => NodeId[];
    addEdge: (u: NodeId, v: NodeId, weight?: number | undefined) => any;
    removeEdge: (u: NodeId, v: NodeId) => any;
    hasEdge: (u: NodeId, v: NodeId) => boolean;
    setEdgeWeight: (u: NodeId, v: NodeId, weight: EdgeWeight) => any;
    getEdgeWeight: (u: NodeId, v: NodeId) => EdgeWeight;
    indegree: (node: NodeId) => number;
    outdegree: (node: NodeId) => number;
    depthFirstSearch: (sourceNodes?: string[] | undefined, includeSourceNodes?: boolean, errorOnCycle?: boolean) => string[];
    hasCycle: () => boolean;
    lowestCommonAncestors: (node1: NodeId, node2: NodeId) => string[];
    topologicalSort: (sourceNodes?: string[] | undefined, includeSourceNodes?: boolean) => string[];
    shortestPath: (source: NodeId, destination: NodeId) => string[] & {
        weight?: number | undefined;
    };
    serialize: () => Serialized;
    deserialize: (serialized: Serialized) => any;
};

/**
 * 发光的光环.
 */
export  class HaloRingMarker extends MarkerBase {
    constructor(features: FeatureCollection | {
        lngLat: LngLatLike;
        text?: string;
    }, options?: AnimateMarkerLayerOption);
    setMarkersWidth(width: number, index?: number): void;
    setMarkersColors(colors: string[], index?: number): void;
    _createMarker(): void;
    private _createMakerElement;
}

/**
 * 创建热力图图层.
 *
 **/
export  class Heatmap extends OverlayLayerBase {
    options: HeatmapOptions;
    constructor(options: HeatmapOptions);
    addTo(map: Map, beforeId?: string): void;
    /** 替换 GeoJSON 图层的当前数据。
     @param {GeoJSON} [data] GeoJSON object to set. If not provided, defaults to an empty FeatureCollection.
     */
    setData(data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any): void;
    setHeatmapRadius(value: DataDrivenPropertyValueSpecification<number>): this;
    getHeatmapRadius(): DataDrivenPropertyValueSpecification<number>;
    setHeatmapWeight(value: DataDrivenPropertyValueSpecification<number>): this;
    getHeatmapWeight(): DataDrivenPropertyValueSpecification<number>;
    setHeatmapIntensity(value: PropertyValueSpecificationEx<number>): this;
    getHeatmapIntensity(): PropertyValueSpecificationEx<number>;
    setHeatmapColor(value: ExpressionSpecificationEx): this;
    getHeatmapColor(): ExpressionSpecificationEx;
    setHeatmapOpacity(value: PropertyValueSpecificationEx<number>): this;
    getHeatmapOpacity(): PropertyValueSpecificationEx<number>;
}

export  type HeatmapLayerSpecification = {
    id: string;
    type: "heatmap";
    metadata?: unknown;
    source: string;
    "source-layer"?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    layout?: {
        visibility?: "visible" | "none";
    };
    paint?: {
        "heatmap-radius"?: DataDrivenPropertyValueSpecification<number>;
        "heatmap-weight"?: DataDrivenPropertyValueSpecification<number>;
        "heatmap-intensity"?: PropertyValueSpecificationEx<number>;
        "heatmap-color"?: ExpressionSpecificationEx;
        "heatmap-opacity"?: PropertyValueSpecificationEx<number>;
    };
};

export  type HeatmapLayerStyleProp = {
    metadata?: unknown;
    source?: string;
    sourceLayer?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    visibility?: "visible" | "none";
    heatmapRadius?: DataDrivenPropertyValueSpecification<number>;
    heatmapWeight?: DataDrivenPropertyValueSpecification<number>;
    heatmapIntensity?: PropertyValueSpecificationEx<number>;
    heatmapColor?: ExpressionSpecificationEx;
    heatmapOpacity?: PropertyValueSpecificationEx<number>;
};

export  interface HeatmapOptions extends OverlayLayerBaseOptions {
    data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any;
    heatmapRadius?: DataDrivenPropertyValueSpecification<number>;
    heatmapWeight?: DataDrivenPropertyValueSpecification<number>;
    heatmapIntensity?: PropertyValueSpecificationEx<number>;
    heatmapColor?: ExpressionSpecificationEx;
    heatmapOpacity?: PropertyValueSpecificationEx<number>;
}

/**
 * 十六进制字符串转二进制字符串(可用于协同图形，图层开头显示设置的转换)
 * @param strHex 十进制的内容
 * @param isPadding 前面是否自动0，默认true
 * @param reverse 结果倒序，默认true
 */
export  function hexToBinStr(strHex: string, isPadding?: boolean, reverse?: boolean): string;

export  type HillshadeLayerSpecification = {
    id: string;
    type: "hillshade";
    metadata?: unknown;
    source: string;
    "source-layer"?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    layout?: {
        visibility?: "visible" | "none";
    };
    paint?: {
        "hillshade-illumination-direction"?: PropertyValueSpecificationEx<number>;
        "hillshade-illumination-anchor"?: PropertyValueSpecificationEx<"map" | "viewport">;
        "hillshade-exaggeration"?: PropertyValueSpecificationEx<number>;
        "hillshade-shadow-color"?: PropertyValueSpecificationEx<ColorSpecification>;
        "hillshade-highlight-color"?: PropertyValueSpecificationEx<ColorSpecification>;
        "hillshade-accent-color"?: PropertyValueSpecificationEx<ColorSpecification>;
    };
};

export  type HillshadeLayerStyleProp = {
    metadata?: unknown;
    source?: string;
    sourceLayer?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    visibility?: "visible" | "none";
    hillshadeIlluminationDirection?: PropertyValueSpecificationEx<number>;
    hillshadeIlluminationAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    hillshadeExaggeration?: PropertyValueSpecificationEx<number>;
    hillshadeShadowColor?: PropertyValueSpecificationEx<ColorSpecification>;
    hillshadeHighlightColor?: PropertyValueSpecificationEx<ColorSpecification>;
    hillshadeAccentColor?: PropertyValueSpecificationEx<ColorSpecification>;
};

/**
 * html颜色转实体颜色
 * @param color html
 * @return {number}
 */
export  function htmlColorToEntColor(color: string): number;

export  const httpHelper: {
    configure: (opts: Partial<Config>) => void;
    event: {
        READY_STATE_CHANGE: string;
        LOAD_START: string;
        PROGRESS: string;
        ABORT: string;
        ERROR: string;
        LOAD: string;
        TIMEOUT: string;
        LOAD_END: string;
    };
    methods: Methods;
    rqeust: (args: Partial<Config>) => Promise<any>;
    get: (url: string, params?: Record<string, any> | undefined, args?: Partial<Config<unknown>> | undefined) => Promise<any>;
    put: (url: string, data: any, args?: Partial<Config<unknown>> | undefined) => Promise<any>;
    post: (url: string, data: any, args?: Partial<Config<unknown>> | undefined) => Promise<any>;
    patch: (url: string, data: any, args?: Partial<Config<unknown>> | undefined) => Promise<any>;
    del: (url: string, args?: Partial<Config<unknown>> | undefined) => Promise<any>;
    options: (url: string, args?: Partial<Config<unknown>> | undefined) => Promise<any>;
};

export  interface IAnimateFillLayerOptions extends Omit<PolygonOptions, "data"> {
    /** 动画图集. */
    animateImages?: Array<HTMLImageElement | string | ArrayBufferView | {
        width: number;
        height: number;
        data: Uint8Array | Uint8ClampedArray;
    } | ImageData | ImageBitmap>;
    /** 创建的图层位于哪个图层之前. */
    layerBefore?: string;
}

export  interface IAnimateLineLayerOptions extends Omit<PolylineOptions, "data"> {
    /** 动画图集. */
    animateImages?: Array<HTMLImageElement | string | ArrayBufferView | {
        width: number;
        height: number;
        data: Uint8Array | Uint8ClampedArray;
    } | ImageData | ImageBitmap>;
    /** 速度，默认1. */
    speed?: number;
    /** 开始时自动动画，默认true. */
    startAutoAnimation?: boolean;
    /** 创建的图层位于哪个图层之前. */
    layerBefore?: string;
}

export  interface IAnimateSymbolLayerOptions extends Omit<SymbolOptions, "data"> {
    /** 动画图集. */
    animateImages?: Array<HTMLImageElement | string | ArrayBufferView | {
        width: number;
        height: number;
        data: Uint8Array | Uint8ClampedArray;
    } | ImageData | ImageBitmap>;
    /** 速度，默认1. */
    speed?: number;
    /** 开始时自动动画，默认true. */
    startAutoAnimation?: boolean;
    /** 创建的图层位于哪个图层之前. */
    layerBefore?: string;
}

export  interface IAnimateVectorLayerOptions {
    /** 动画图集. */
    animateImages?: Array<HTMLImageElement | string | ArrayBufferView | {
        width: number;
        height: number;
        data: Uint8Array | Uint8ClampedArray;
    } | ImageData | ImageBitmap>;
    /** 速度，默认1. */
    speed?: number;
    /** 开始时自动动画，默认true. */
    startAutoAnimation?: boolean;
}

export  interface IAnimateVectorLayerResult {
    /** 开始动画函数. */
    startAnimation: () => void;
    /** 结束动画函数. */
    stopAnimation: () => void;
    /** 移除. */
    remove: () => void;
    /** 设置速度. */
    setSpeed: (speed: number) => void;
    /** 更新动画图片集. */
    updateImages: (images: Array<HTMLImageElement | string | ArrayBufferView | {
        width: number;
        height: number;
        data: Uint8Array | Uint8ClampedArray;
    } | ImageData | ImageBitmap>) => void;
}

/**
 * 组合新地图参数
 */
export  interface IComposeNewMap {
    /** 地图ID. */
    mapid: string;
    /** 地图版本(为空时采用当前打开的地图版本). */
    version?: string;
    /** 地图裁剪范围，范围如[x1,y1,x2,y2]， 为空的话，表示不裁剪 */
    clipbounds?: [number, number, number, number];
    /** 选择是包含还是相交（默认false表示包含，true相交） */
    selByCrossing?: boolean;
    /** 四参数(x偏移,y偏移,缩放，旋转弧度)，可选，对坐标最后进行修正*/
    fourParameter?: [number, number, number, number];
    /** 要显示的图层名称，为空的时候，表示全部图层 */
    layers?: string[];
    /** 生新成图的图层名称前缀 */
    layerPrefix?: string;
    /** 生新成图的图层名称后缀 */
    layerSuffix?: string;
    /** 保存的文件名称，为空的时候，自根据参数自动生成 */
    savefilename?: string;
}

/**
 * 条件查询实体参数
 */
export  interface IConditionQueryFeatures extends IQueryBaseFeatures {
    /** 条件. */
    condition: string;
    /** 范围. */
    bounds?: [number, number, number, number];
    /** 记录开始位置. */
    beginpos?: number;
    /** 是否返回几何数据,为了性能问题，realgeom为false时，如果返回条数大于1.只会返回每个实体的外包矩形，如果条数为1的话，会返回此实体的真实geojson；realgeom为true时每条都会返回实体的geojson */
    includegeom?: boolean;
    /** 是否返回真实实体几何geojson.与 includegeom参数，结合使用。参考includegeom的用法*/
    realgeom?: boolean;
    /** 是否为包含关系, true为包含关系,false为相交关系，默认false. (传入了bounds进行范围查询时有效)*/
    isContains?: boolean;
}

export  interface ICreateAnimateImagesOptions {
    /** 画片宽(2的n次幂，如2,4,8, 16, 32....).默认64 */
    canvasWidth?: number;
    /** 画片高(2的n次幂，如2,4,8, 16, 32....).默认32 */
    canvasHeight?: number;
    /** 绘制内容回调(此函数只需绘制第一帧，其作帧图片会根据移动方向和帧数自动计算出来). */
    draw?: (context: CanvasRenderingContext2D, width: number, height: number, opts: ICreateAnimateImagesOptions) => void;
    /** 每帧内容回调(此函数每帧都会调用，需要根据不同的帧数生成不同的图片，与上面的draw冲突，如果设置了drawFrame，则上面的draw函数无效). */
    drawFrame?: (context: CanvasRenderingContext2D, width: number, height: number, frameCount: number, curFrameIndex: number, opts: ICreateAnimateImagesOptions) => void;
    /** 要生成的动画图片帧的个数.默认2 */
    frameCount?: number;
    /** 方向是否反向. */
    directionReverse?: boolean;
    /** 是否y方向生成动画图片集. */
    yAxis?: boolean;
    /** 来源图片. */
    fromImage?: HTMLImageElement;
    /** 来源图片中精灵图所占宽. */
    spriteWidth?: number;
    /** 来源图片中精灵图所占高. */
    spriteHeight?: number;
    /** 生成的动画图片集中从第几个开始，默认0. */
    from?: number;
    /** 生成的动画图片集中到第几个结束，默认数组最后一个.. */
    to?: number;
    /** 其他数据. */
    [key: string]: any;
}

export  interface ICreateAnimateLayerResult {
    /** 数据源ID. */
    sourceId: string;
    /** 图层ID. */
    layerId: string;
    /** 开始动画函数. */
    startAnimation: () => void;
    /** 结束动画函数. */
    stopAnimation: () => void;
    /** 移除. */
    remove: () => void;
    /** 设置速度. */
    setSpeed: (speed: number) => void;
    /** 更新数据. */
    updateData: (input: LineGeoJsonInput | LineGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike[] | any) => void;
    /** 更新动画图片集. */
    updateImages: (images: Array<HTMLImageElement | string | ArrayBufferView | {
        width: number;
        height: number;
        data: Uint8Array | Uint8ClampedArray;
    } | ImageData | ImageBitmap>) => void;
    /** 创建动画图片集. */
    createAnimateImages: (options: ICreateAnimateImagesOptions) => Array<ImageData>;
}

export  interface ICreateAntPathAnimateLineLayerOptions extends IAnimateLineLayerOptions, ICreateAnimateImagesOptions {
    /** 填充背景颜色1. */
    fillColor1?: string | CanvasGradient | CanvasPattern;
    /** 填充背景颜色1. */
    fillColor2?: string | CanvasGradient | CanvasPattern;
}

export  interface ICreateArrowAnimateLineLayerOptions extends IAnimateLineLayerOptions, ICreateAnimateImagesOptions {
    /** 箭头填充背景颜色. */
    arrowFillColor?: string | CanvasGradient | CanvasPattern;
    /** 箭头颜色. */
    arrowStrokeColor?: string | CanvasGradient | CanvasPattern;
    /** 箭头线宽. */
    arrowStrokeWidth?: number;
    /** 箭头宽(默认为画布的一半). */
    arrowWidth?: number;
}

/**
 * 获取创建实体的几何数据
 */
export  interface ICreateEntitiesGeomData {
    /** 文件文档. */
    filedoc: string;
    /** 图形范围.如果不填的话，则使用全图范围 */
    mapBounds?: [number, number, number, number];
    /** 渲染精度，默认1，有时候图形特别大导致圆或圆弧精度不够时,不够光滑，可以先清空之前的缓存数据，再重新上传时，改变渲染精度来使圆或圆弧光滑些。注：提高精度会导致空间数据文件增大，渲染性能下降 */
    renderAccuracy?: number;
    /** 返回的数据中排除属性数据( 默认true) */
    excludeAttribute?: boolean;
}

export  interface ICreateFillAnimateLayerResult extends ICreateAnimateLayerResult {
    polygon: Polygon;
}

export  interface ICreateLineAnimateLayerResult extends ICreateAnimateLayerResult {
    polyline: Polyline;
}

export  interface ICreateSymbolAnimateLayerResult extends ICreateAnimateLayerResult {
    symbol: Symbol_2;
}

/**
 * Id
 *
 * https://tools.ietf.org/html/rfc7946#section-3.2
 * If a Feature has a commonly used identifier, that identifier SHOULD be included as a member of
 * the Feature object with the name 'id', and the value of this member is either a JSON string or number.
 */
 type Id = string | number;

/**
 * 2d折线实体类型接口
 */
 interface IDb2dPolyline extends IDbCurve {
    /** 是否闭合. */
    closed?: boolean;
    /** 高程. */
    elevation?: number;
    /** 2d折线类型*/
    polyType?: Poly2dType;
    /** 坐标. */
    points?: Array<[number, number, number?]>;
}

/**
 * 角度标注[两条线]实体类型接口
 */
 interface IDb2LineAngularDimension extends IDbDimension {
    /** 圆弧点位置. */
    arcPoint?: Array<[number, number, number?]>;
    /** 线1起点. */
    xLine1Start?: Array<[number, number, number?]>;
    /** 线1终点. */
    xLine1End?: Array<[number, number, number?]>;
    /** 线2起点. */
    xLine2Start?: Array<[number, number, number?]>;
    /** 线2终点. */
    xLine2End?: Array<[number, number, number?]>;
}

/**
 * 3d折线实体类型接口
 */
 interface IDb3dPolyline extends IDbCurve {
    /** 是否闭合. */
    closed?: boolean;
    /** 3d折线类型*/
    polyType?: Poly3dType;
    /** 坐标. */
    points?: Array<[number, number, number?]>;
}

/**
 * 角度标注[三点]实体类型接口
 */
 interface IDb3PointAngularDimension extends IDbDimension {
    /** 圆弧点位置. */
    arcPoint?: Array<[number, number, number?]>;
    /** 中点. */
    centerPoint?: Array<[number, number, number?]>;
    /** 点1. */
    xLine1Point?: Array<[number, number, number?]>;
    /** 点2. */
    xLine2Point?: Array<[number, number, number?]>;
}

/**
 * 对齐标注实体类型接口
 */
 interface IDbAlignedDimension extends IDbDimension {
    /** 线1点. */
    xLine1Point?: Array<[number, number, number?]>;
    /** 线2点. */
    xLine2Point?: Array<[number, number, number?]>;
    /** 设置定义此dimension实体尺寸线位置的WCS点. */
    dimLinePoint?: Array<[number, number, number?]>;
    /** 设置此实体的符号高度。. */
    jogSymbolHeight?: number;
}

/**
 * 圆弧实体类型接口
 */
 interface IDbArc extends IDbCurve {
    /** 中心坐标. */
    center?: [number, number, number?];
    /** 半径. */
    radius?: number;
    /** 开始弧度. */
    startAngle?: number;
    /** 结束弧度. */
    endAngle?: number;
    /** 厚度. */
    thickness?: number;
    /** 法向量. */
    normal?: [number, number, number?];
}

/**
 * 圆弧标注实体类型接口
 */
 interface IDbArcDimension extends IDbDimension {
    /** 线1点. */
    xLine1Point?: Array<[number, number, number?]>;
    /** 线2点. */
    xLine2Point?: Array<[number, number, number?]>;
    /** 中心点. */
    centerPoint?: Array<[number, number, number?]>;
    /** 圆弧点. */
    arcPoint?: Array<[number, number, number?]>;
    /** 文本中使用的弧符号的类型。 0 弧符号在文本前面;   1 弧线符号在文字上方;   2  没有符号. */
    arcSymbolType?: number;
}

/**
 * 块定义接口
 */
 interface IDbBlock {
    /** 块名称. */
    name?: string;
    /** 设置此块的参照的缩放特征. */
    scaling?: number;
    /** 设置此块的块插入单位 . */
    insertUnits?: number;
    /** 原点。 . */
    origin?: Array<[number, number, number?]>;
    /** 备注. */
    comments?: string;
    /** 是否可炸开. */
    explodable?: boolean;
    /** 由哪些实体创建而成. */
    entitys?: IDbEntity[];
}

/**
 * 块参照实体类型接口
 */
 interface IDbBlockReference extends IDbEntity {
    /** 块名称. */
    blockname?: string;
    /** 参考外部图形，形式为 mapid/version,如 exam/v1. */
    ref?: string;
    /** 坐标. */
    position?: [number, number, number?];
    /** 法向量. */
    normal?: [number, number, number?];
    /** 旋转角度. */
    rotation?: number;
    /** 缩放因子. */
    scaleFactors?: number;
}

/**
 * 圆实体类型接口
 */
 interface IDbCircle extends IDbCurve {
    /** 中心坐标. */
    center?: [number, number, number?];
    /** 半径. */
    radius?: number;
    /** 厚度. */
    thickness?: number;
    /** 法向量. */
    normal?: [number, number, number?];
}

/**
 * 曲线实体类型接口
 */
 interface IDbCurve extends IDbEntity {
}

/**
 * 直径标注实体类型接口
 */
 interface IDbDiametricDimension extends IDbDimension {
    /** 圆上1点. */
    chordPoint?: Array<[number, number, number?]>;
    /** 圆上2点. */
    farChordPoint?: Array<[number, number, number?]>;
    /** 引线长度. */
    leaderLength?: number;
}

/**
 * 标注实体类型接口
 */
 interface IDbDimension extends IDbEntity {
    /** 标注样式. */
    dimStyle?: string;
    /** 文字位置. */
    textPosition?: Array<[number, number, number?]>;
}

/**
 * 标注样式接口
 */
 interface IDbDimStyle {
    /** 样式名称. */
    name?: string;
    /** 文字样式名称. */
    textStyle?: string;
    /** 尺寸线箭头块的显示 . */
    dimsah?: boolean;
    /** 符号和箭头1 .“” 实心闭合,“_DOT” 点,“_DOTSMALL” 小点,“_DOTBLANK” 空心点,“_ORIGIN” 指示原点,“_ORIGIN2” 指示原点 2,“_OPEN” 打开,“_OPEN90” 直角,“_OPEN30” 30 度角,“_CLOSED” 闭合,“_SMALL” 空心小点,“_NONE” 无,“_OBLIQUE” 倾斜,“_BOXFILLED” 填充框,“_BOXBLANK” 框,“_CLOSEDBLANK” 空心闭合,“_DATUMFILLED” 实心基准三角形,“_DATUMBLANK” 基准三角形,“_INTEGRAL” 完整标记,“_ARCHTICK” 建筑标记*/
    dimblk1?: string;
    /** 符号和箭头2 .同dimblk1 */
    dimblk2?: string;
}

/**
 * DB文档定义接口
 */
 interface IDbDocument {
    /** 来源于哪个图，会在此图的上面进行修改或新增删除，格式如 形式为 mapid/version,如 exam/v1 . */
    from?: string;
    /** 实体集. */
    entitys?: IDbEntity[];
    /** 图层集. */
    layers?: IDbLayer[];
    /** 文字样式. */
    textStyles?: IDbTextStyle[];
    /** 标注样式. */
    dimStyles?: IDbDimStyle[];
    /** 线型. */
    linetypes?: IDbLinetype[];
    /** 块定义. */
    blocks?: IDbBlock[];
}

/**
 * 椭圆实体类型接口
 */
 interface IDbEllipse extends IDbCurve {
    /** 中心坐标. */
    center?: [number, number, number?];
    /** 主轴方向. */
    minorAxis?: [number, number, number?];
    /** 开始弧度. */
    startAngle?: number;
    /** 结束弧度. */
    endAngle?: number;
    /** 短轴和长轴的比例. */
    radiusRatio?: number;
}

/**
 * 实体类型接口
 */
 interface IDbEntity {
    /** 类型. */
    typename?: string;
    /** 颜色. */
    color?: number;
    /** 颜色索引. */
    colorIndex?: number;
    /** 图层. */
    layer?: string;
    /** 线型. */
    linetype?: string;
    /** 线型比例. */
    linetypeScale?: number;
    /** 线宽. */
    lineWidth?: number;
    /** 透明度. [0-255][0完全透明,255完全不透明]*/
    alpha?: number;
    /** 可见. */
    visibility?: boolean;
    /** 矩阵. */
    matrix?: IDbMatrixOp[];
    /** 扩展数据. */
    xdata?: string;
    /** 实体句柄，如传了实体句柄，是表示修改此实体. */
    objectid?: string;
    /** 是否删除此实体. */
    delete?: boolean;
}

/**
 * 填充实体类型接口
 */
 interface IDbHatch extends IDbEntity {
    /** 高程. */
    elevation?: number;
    /** 填充图案, 缺省 SOLID */
    pattern?: string;
    /** 坐标. */
    points?: Array<[number, number, number?]>;
}

/**
 * 图层接口
 */
 interface IDbLayer {
    /** 图层名称. */
    name?: string;
    /** 图层颜色索引. */
    color?: number;
    /** 图层线型，缺省 CONTINUOUS . */
    linetype?: string;
}

/**
 * 线实体类型接口
 */
 interface IDbLine extends IDbEntity {
    /** 起点. */
    start?: [number, number, number?];
    /** 终点. */
    end?: [number, number, number?];
    /** 厚度. */
    thickness?: number;
}

/**
 * 线型接口
 */
 interface IDbLinetype {
    /** 线型名称. */
    name?: string;
    /** 评论. */
    comments?: string;
    /** 线型样式 . */
    style?: IDbLinetypeStyle[];
}

/**
 * 线型样式接口
 */
 interface IDbLinetypeStyle {
    /** 方法. */
    method?: IDbLinetypeStyleMethod;
    /** 参数. */
    parameter?: string;
}

 enum IDbLinetypeStyleMethod {
    /** [int count] . */
    numDashes = "numDashes",
    /** [double dPatLen] . */
    patternLength = "patternLength",
    /** [int dashIndex, double dashLength ]. */
    dashLengthAt = "dashLengthAt",
    /** [int dashIndex, string idTextStyle] . */
    shapeStyleAt = "shapeStyleAt",
    /** [int dashIndex, [int, int] shapeOffset] . */
    shapeOffsetAt = "shapeOffsetAt",
    /** [int dashIndex, string textString] . */
    textAt = "textAt",
    /** [ int dashIndex, double shapeScale] . */
    shapeScaleAt = "shapeScaleAt",
    /** [int dashIndex, int shapeNumber] . */
    shapeNumberAt = "shapeNumberAt",
    /** [int dashIndex, double shapeRotation] . */
    shapeRotationAt = "shapeRotationAt",
    /** [ bool bScaleToFit] . */
    isScaledToFit = "isScaledToFit"
}

/**
 * 矩阵操作接口
 */
 interface IDbMatrixOp {
    /** 操作名称. */
    op?: IDbMatrixOpName;
    /** 平移的向量. */
    vector?: [number, number, number?];
    /** 缩放大小 . */
    scale?: number;
    /** 旋转的角度 . */
    angle?: number;
    /** 基点. */
    origin?: [number, number, number?];
}

 enum IDbMatrixOpName {
    /** 平移 . */
    translation = "translation",
    /** 缩放 . */
    scale = "scale",
    /** rotate. */
    rotate = "rotate"
}

/**
 * 多行文本实体类型接口
 */
 interface IDbMText extends IDbEntity {
    /** 宽. */
    width?: number;
    /** 高. */
    height?: number;
    /** 旋转角度. */
    rotation?: number;
    /** 文本高. */
    textHeight?: number;
    /** 文本内容. */
    contents?: string;
    /** 位置. */
    location?: [number, number, number?];
    /** 对齐方式. */
    attachment?: MTextAttachmentPoint;
    /** 文本样式. */
    textStyle?: string;
}

/**
 * 坐标标注实体类型接口
 */
 interface IDbOrdinateDimension extends IDbDimension {
    /** 基点. */
    origin?: Array<[number, number, number?]>;
    /** 定义点. */
    definingPoint?: Array<[number, number, number?]>;
    /** 引线点. */
    leaderEndPoint?: Array<[number, number, number?]>;
    /** 是否用X轴. */
    useXAxis?: boolean;
}

/**
 * 折线实体类型接口
 */
 interface IDbPolyline extends IDbCurve {
    /** 是否闭合. */
    closed?: boolean;
    /** 高程. */
    elevation?: number;
    /** 坐标. */
    points?: Array<[number, number, number?]>;
    /** 凸度. */
    bulge?: number[];
    /** 起点宽. */
    startWidth?: number[];
    /** 终点宽. */
    endWidth?: number[];
}

/**
 * 半径标注实体类型接口
 */
 interface IDbRadialDimension extends IDbDimension {
    /** 中心点. */
    center?: Array<[number, number, number?]>;
    /** 圆上点. */
    chordPoint?: Array<[number, number, number?]>;
    /** 引线长度. */
    leaderLength?: number;
}

/**
 * 半径折线标注实体类型接口
 */
 interface IDbRadialDimensionLarge extends IDbDimension {
    /** 中心点. */
    center?: Array<[number, number, number?]>;
    /** 圆上点. */
    chordPoint?: Array<[number, number, number?]>;
    /** 设置由该Dimension实体确定尺寸的弧的WCS覆盖中心。. */
    overrideCenter?: Array<[number, number, number?]>;
    /** 设置此Dimension实体的折角点。. */
    jogPoint?: Array<[number, number, number?]>;
    /** 设置此Dimension实体的折角。. */
    jogAngle?: number;
}

/**
 * 栅格图片实体类型接口
 */
 interface IDbRasterImage extends IDbEntity {
    /** 明亮度 [0.0 .. 100.0] */
    brightness?: number;
    /** 图片url地址. */
    sourceHttpUrl?: string;
    /** 源图片宽. */
    pixelWidth?: number;
    /** 源图片高. */
    pixelHeight?: number;
    /** 单位. */
    units?: RasterImageUnits;
    /** x轴每像素代表长度. */
    xPelsPerUnit?: number;
    /** y轴每像素代表长度. */
    yPelsPerUnit?: number;
    /** 宽. */
    width?: number;
    /** 高. */
    height?: number;
    /** 位置. */
    position?: [number, number, number?];
    /** 是否显示. */
    imageDisplayOptShow?: boolean;
    /** 是否裁剪. */
    imageDisplayOptClip?: boolean;
    /** 是否对齐. */
    imageDisplayOptShowUnAligned?: boolean;
    /** 是否透明. */
    imageDisplayOptTransparent?: boolean;
}

/**
 * 转角标注实体类型接口
 */
 interface IDbRotatedDimension extends IDbDimension {
    /** 线上点1. */
    xLine1Point?: Array<[number, number, number?]>;
    /** 线上点2. */
    xLine2Point?: Array<[number, number, number?]>;
    /** 设置定义此dimension实体尺寸线位置的WCS点。. */
    dimLinePoint?: Array<[number, number, number?]>;
}

/**
 * 型实体类型接口
 */
 interface IDbShape extends IDbEntity {
    /** 旋转角度. */
    rotation?: number;
    /** 位置. */
    position?: [number, number, number?];
    /** 大小. */
    size?: number;
    /** 法向量. */
    normal?: [number, number, number?];
    /** 型名称. */
    name?: string;
}

/**
 * 样条曲线实体类型接口
 */
 interface IDbSpline extends IDbCurve {
    /** the curve fitting tolerance for this Spline entity. */
    fitTol?: number;
    /** Increased the degree of this spline to the specified value. */
    degree?: number;
    /** 拟合点. */
    fitPoints?: Array<[number, number, number?]>;
    /** 控制点. */
    controlPoints?: Array<[number, number, number?]>;
}

/**
 * 单行文本实体类型接口
 */
 interface IDbText extends IDbEntity {
    /** 高. */
    height?: number;
    /** 旋转角度. */
    rotation?: number;
    /** 文本内容， 同contents. */
    text?: string;
    /** 文本内容， 同text. */
    contents?: string;
    /** 宽度因子. */
    widthFactor?: number;
    /** 位置. */
    position?: [number, number, number?];
    /** 文本样式. */
    textStyle?: string;
    /** 水平模式. */
    horizontalMode?: DbTextHorzMode;
    /** 垂直模式. */
    verticalMode?: DbTextVertMode;
}

/**
 * 文字样式接口
 */
 interface IDbTextStyle {
    /** 文字样式名称. */
    name?: string;
    /** 是否型文件. */
    isShapeFile?: boolean;
    /** 文本大小 . */
    textSize?: number;
    /** x轴缩放 . */
    xScale?: number;
    /** 设置最近使用此文本样式创建的文本的先前大小 . */
    priorSize?: number;
    /** 设置字母的倾斜角度。正角度顺时针（向右）倾斜字母。负值使字母逆时针倾斜（向左）。通过将值2*PI相加，将负值转换为其正当量。 默认情况下，初始值为0.0. */
    obliquingAngle?: number;
    /** 字体文件名 . */
    fileName?: string;
    /** 字体 . */
    typeFace?: string;
    /** 是否粗体 . */
    bold?: boolean;
    /** 是否斜体 . */
    italic?: boolean;
    /** 字符集标识符，缺省0 . */
    charset?: number;
    /** 字符间距和族，缺省34 . */
    pitchAndFamily?: number;
}

/**
 * 遮罩实体类型接口
 */
 interface IDbWipeout extends IDbRasterImage {
    /** 坐标. */
    points?: Array<[number, number, number?]>;
}

/**
 * 清空地图缓存接口
 */
export  interface IDeleteCache {
    /** 地图ID(为空时采用当前打开的mapid). */
    mapid?: string;
    /** 地图版本(为空时采用当前打开的地图版本, 如清空所有版本缓存，输入"*"号). */
    version?: string;
    /** 匹配的键值. */
    key?: string;
}

/**
 * 删除地图样式接口
 */
export  interface IDeleteStyle {
    /** 地图ID(为空时采用当前打开的mapid). */
    mapid?: string;
    /** 地图版本(为空时采用当前打开的地图版本, 如删除所有版本，输入"*"号). */
    version?: string;
    /** 样式名称.如删除所有样式，输入"*"号； 删除所有系统产生的样式，输入 "a*"；内存打开的样式,输入"m*";几何打开的样式输入 "s*"*/
    styleid: string;
    /** 是否只清空数据, false 删除表和数据; true 只删除数据. */
    onlycleardata: boolean;
}

export  interface IDraw {
    /** 工具类. */
    Tool: (options?: IDrawOptions) => IDrawTool | any;
    /** 缺省配置项. */
    defaultOptions: () => any;
    /** 模式. */
    modes: Record<string, any>;
    /** 绘制动作. */
    actionDraw: (map: any, modename: string, options?: Record<string, any>) => any;
    /** 绘制圆动作. */
    actionDrawCircle: (map: any, options?: Record<string, any>) => any;
    /** 绘制线动作. */
    actionDrawLineSting: (map: any, options?: Record<string, any>) => any;
    /** 绘制点动作. */
    actionDrawPoint: (map: any, options?: Record<string, any>) => any;
    /** 绘制多边形动作. */
    actionDrawPolygon: (map: any, options?: Record<string, any>) => any;
    /** 绘制矩形动作. */
    actionDrawRectangle: (map: any, options?: Record<string, any>) => any;
    /** 绘制斜矩形动作. */
    actionDrawSlantRectangle: (map: any, options?: Record<string, any>) => any;
    /** 选择实体. 如果只能选择一个实体，options选项请输入selectSingle为true*/
    actionSelect: (map: any, draw: any, options?: Record<string, any>) => any;
}

export  interface IDrawOptions {
    addControls?: any[];
    controls?: Record<string, boolean>;
    guides?: boolean;
    modes?: Record<string, any>;
    snap?: true;
    api: {
        getSnapFeatures: any;
        [key: string]: any;
    };
    snapOptions: {
        snapGridPx?: number;
        snapPx?: number;
        snapToMidPoints?: boolean;
        snapVertexPriorityDistance?: number;
    };
    styles?: any[];
    userProperties?: boolean;
    [key: string]: any;
}

export  interface IDrawTool {
    /** 此方法采用 GeoJSON Feature、FeatureCollection 或 Geometry 并将其添加到 Draw。它返回一个 id 数组，用于与添加的功能进行交互。如果某个功能没有自己的 id，则会自动生成一个 **/
    add: (geojson: any) => Array<string>;
    /**将绘图更改为另一种模式。返回用于链接的绘制实例 */
    changeMode: (mode: string, modeOptions: any) => IDrawTool;
    /** 调用当前模式的combineFeatures操作。返回用于链接的绘制实例 */
    combineFeatures: () => IDrawTool;
    /** 删除具有指定 ID 的功能。返回用于链接的绘制实例*/
    delete: (featureIds: string[] | string) => IDrawTool;
    /** 删除所有功能。返回用于链接的绘制实例 */
    deleteAll: () => IDrawTool;
    /** 在当前模式下执行动作 */
    doAction: (actionName: string) => any;
    /** 强制刷新 */
    forceRefresh: () => any;
    /** 返回 Draw 中具有指定 id 的 GeoJSON 功能，或者undefined如果 id 不匹配任何功能 */
    get: (id: string) => any;
    /** 返回所有功能的 FeatureCollection */
    getAll: () => FeatureCollection;
    /** 返回当前在指定点呈现的功能的功能 ID 数组。*/
    getFeatureIdsAt: (point: {
        x: number;
        y: number;
    }) => Array<string>;
    /** 返回 Draw 的当前模式 */
    getMode: () => string;
    /** 返回当前选择的所有功能的 FeatureCollection */
    getSelected: () => FeatureCollection;
    /** 返回当前所选功能的功能 ID 数组 */
    getSelectedIds: () => Array<string>;
    /** 返回代表当前选择的所有顶点的 FeatureCollection 点 */
    getSelectedPoints: () => FeatureCollection;
    /** 内部变量模式值 */
    modes: Record<string, any>;
    /** 增加时回调接口 */
    onAdd: (map: any) => any;
    /** 移除时回调接口 */
    onRemove: () => any;
    /** 内部变量选项值 */
    options: Record<string, any>;
    redo: () => any;
    /** 将 Draw 的功能设置为指定的 FeatureCollection */
    set: (featureCollection: FeatureCollection) => Array<string>;
    /** 设置具有指定 id 的要素的属性值。返回用于链接的绘制实例 */
    setFeatureProperty: (featureId: string, property: string, value: any) => IDrawTool;
    /** 调用当前模式的删除trash操作。返回用于链接的绘制实例 */
    trash: () => IDrawTool;
    uncombineFeatures: () => IDrawTool;
    undo: () => any;
}

/**
 * 表达式查询实体参数
 */
export  interface IExprQueryFeatures extends IQueryBaseFeatures {
    /** 表达式. */
    expr: string;
    /** 记录开始位置. */
    beginpos?: number;
    /** 启动cache(内存打开的图形有效). */
    useCache?: boolean;
}

export  type ImageSourceSpecification = {
    type: "image";
    url: string;
    coordinates: [[number, number], [number, number], [number, number], [number, number]];
};

/**
 * 比较地图不同
 */
export  interface IMapDiff {
    /** 地图一ID. */
    mapid1: string;
    /** 地图一版本(为空时采用当前打开的地图版本). */
    version1?: string;
    /** 地图一样式图层. */
    layer1?: string;
    /** 地图二ID. */
    mapid2: string;
    /** 地图二版本(为空时采用当前打开的地图版本). */
    version2?: string;
    /** 地图二样式图层. */
    layer2?: string;
    /** 不比较新增部分. */
    noCompareNew?: boolean;
    /** 不比较删除部分. */
    noCompareDelete?: boolean;
    /** 比较大小. */
    size?: number;
    /** 比较单元大小. */
    cellsize?: number;
    /** 不同的像素最小值. */
    diffMinPixel?: number;
    /** 不同的透明最小值. */
    diffMinAlpha?: number;
    /** 不同的颜色最小值. */
    diffMinColor?: number;
}

/**
 * 地图图层
 */
export  interface IMapLayer {
    /** 图层名称. */
    name: string;
    /** 颜色. */
    color: string;
    /** 图层索引. */
    index: number;
    /** 是否冻结. */
    isFrozen: boolean;
    /** 是否锁定. */
    isLocked: boolean;
    /** 图层是否关闭. */
    isOff: boolean;
    /** 线宽. */
    lineWeight: number;
}

/**
 * 地图样式参数参数
 */
export  interface IMapStyleParam {
    /** 样式名称. */
    name?: string;
    /** 要开的图层索引列表，格式如[0,1,3]. */
    layeron?: string | number[];
    /** 要关的图层索引列表，格式如[2,4]. layeron与layeroff只要输入一个即可*/
    layeroff?: string | number[];
    /** 地图裁剪范围，范围如[x1,y1,x2,y2].如果只需入了数值的话，表示是缩放倍数 */
    clipbounds?: [number, number, number, number] | number;
    /** 颜色. */
    backcolor?: number;
    /** 线宽，格式如[1，1，1，1，0].表式第1，2，3，4级线宽开，第5级线宽关，大于第5级的，以最后设置的级别状态为主，所以也是关。如为空，则和原图线宽显示状态相同 */
    lineweight?: string;
    /** 表达式. */
    expression?: string;
}

export  function inertia({ from, velocity, min, max, power, timeConstant, bounceStiffness, bounceDamping, restDelta, modifyTarget, driver, onUpdate, onComplete, onStop }: InertiaOptions): {
    stop: () => void;
};

export  interface InertiaOptions extends DecayOptions {
    bounceStiffness?: number;
    bounceDamping?: number;
    min?: number;
    max?: number;
    restSpeed?: number;
    restDelta?: number;
    driver?: Driver;
    onUpdate?: (v: number) => void;
    onComplete?: () => void;
    onStop?: () => void;
}

/**
 * Create a function that maps from a numerical input array to a generic output array.
 *
 * Accepts:
 *   - Numbers
 *   - Colors (hex, hsl, hsla, rgb, rgba)
 *   - Complex (combinations of one or more numbers or strings)
 *
 * ```jsx
 * const mixColor = interpolate([0, 1], ['#fff', '#000'])
 *
 * mixColor(0.5) // 'rgba(128, 128, 128, 1)'
 * ```
 *
 * @public
 */
export  function interpolate<T>(input: number[], output: T[], { clamp: isClamp, ease, mixer }?: InterpolateOptions<T>): (v: number) => T;

/**
 * @param points 要插值的（多段）线的顶点(输入必须为经纬度).
 * @param number 沿线插入的点数；这包括端点，并且有效最小值为 2（如果给出较小的数字，则仍将返回端点）.
 * @param offsetDist 一个可选的垂直距离，用于从线段偏移每个点，否则它会位于.
 * @param minGap 在后续插值点之间保持可选的最小间隙；如果一组“number”点的后续点之间的投影间隙低于此值，则“number”将减小到合适的值.
 * @param includeSrcPoint 包括原有点
 * @param isLngLat 点坐标序列是否是经纬度坐标
 * @return {any[]}
 */
export  function interpolateLineRange(points: GeoPointLike[] | any, number: number, isLngLat?: boolean, offsetDist?: number, minGap?: number, includeSrcPoint?: boolean): any[];

 interface InterpolateOptions<T> {
    clamp?: boolean;
    ease?: MixEasing;
    mixer?: MixerFactory<T>;
}

/**
 * 通过比例(0-1)的值，得到坐标序列的点坐标的值
 * @param points
 * @param isLngLat
 * @param ratio
 * @return {any[]}
 */
export  function interpolatePointsByRatio(points: GeoPointLike[] | any, ratio: number, isLngLat?: boolean): any[];

/**
 * 地图打开参数
 */
export  interface IOpenMapBaseParam {
    /** 地图ID. */
    mapid: string;
    /** 地图打开方式(缺省: GeomRender) . */
    mapopenway?: MapOpenWay;
    /** 文件唯一ID. 地图ID第一次打开时，需传递fileid */
    fileid?: string;
    /** 文件文档. */
    filedoc?: string;
    /** 文件名称. */
    filename?: string;
    /** 上传时的文件名. */
    uploadname?: string;
    /** 秘钥(第一次上传打开图时有效，表示此图需要密码保护). */
    secretKey?: string;
    /** 访问权限的key，权限小于secretKey，不能对图进行删除等操作. */
    accessKey?: string;
    /** 要求输入密码回调. */
    cbInputPassword?: (param: {
        mapid: string;
        isPasswordError: boolean;
        tryPasswordCount: number;
        result: any;
    }) => Promise<string>;
    /** 地图来源参数. */
    mapfrom?: string;
    /** 地图依赖项. */
    mapdependencies?: string;
    /** 地图来源参数(这是子项的设置，与mapfrom不同的是，这个没有转化为基础图形，有可能还有依赖关系）.如与mapfrom一样的话，则为空 */
    subfrom?: string;
    /** 地图依赖项(这是子项的设置，与mapdependencies不同的是，这个没有转化为基础图形，有可能还有依赖关系）.如与mapdependencies一样的话，则为空  */
    subdependencies?: string;
    /** 渲染精度，默认1，有时候图形特别大导致圆或圆弧精度不够时,不够光滑，可以先清空之前的缓存数据，再重新上传时，改变渲染精度来使圆或圆弧光滑些。注：提高精度会导致空间数据文件增大，渲染性能下降 */
    renderAccuracy?: number;
    /** 样式. */
    style?: IMapStyleParam;
}

/**
 * 地图打开参数
 */
export  interface IOpenMapParam extends IOpenMapBaseParam {
    /** 版本号(缺省: "" ). */
    version?: string;
    /** 图层名称，组合图层用英文逗号分开 */
    layer?: string;
    /** 布局索引 (从1开始)，默认为0，表示是模型空间 */
    layoutIndex?: number;
}

/**
 * 地图打开返回成功参数
 */
export  interface IOpenMapResponse {
    /** 地图ID. */
    mapid?: string;
    /** 版本号(缺省: "" ). */
    version?: string;
    /** 图层名称 */
    layer?: string;
    /** 地图打开方式(缺省: GeomRender) . */
    mapopenway?: MapOpenWay;
    /** DbID. */
    dbid?: string;
    /** 文件唯一ID. */
    fileid?: string;
    /** 文件名称. */
    filename?: string;
    /** 地图范围(如果通过clipBounds打开，则是clipBounds的范围). */
    bounds?: GeoBounds;
    /** 地图范围(地图的范围，如果没有通过clipBounds打开,则为空). */
    mapBounds?: GeoBounds;
    /** 数据库地图范围*/
    dbBounds?: GeoBounds;
    /** 图层样式. */
    styles?: any;
    /** 图层列表. */
    layers?: any;
    /** 状态. */
    status?: string;
    /** 暗黑模式(背景色为黑时). */
    darkMode?: boolean;
    /** 类型. */
    type?: string;
    /** ucs基点坐标. */
    ucsorg?: string;
    /** 上传的文件名. */
    uploadname?: string;
    /** 描述. */
    description?: string;
    /** 所有布局. */
    layouts?: string[];
    /** 地图来源参数. */
    mapfrom?: string;
    /** 地图依赖项. */
    mapdependencies?: string;
    /** 地图来源参数(这是子项的设置，与mapfrom不同的是，这个没有转化为基础图形，有可能还有依赖关系）.如与mapfrom一样的话，则为空 */
    subfrom?: string;
    /** 地图依赖项(这是子项的设置，与mapdependencies不同的是，这个没有转化为基础图形，有可能还有依赖关系）.如与mapdependencies一样的话，则为空  */
    subdependencies?: string;
    /** 渲染精度，默认1，有时候图形特别大导致圆或圆弧精度不够时,不够光滑，可以先清空之前的缓存数据，再重新上传时，改变渲染精度来使圆或圆弧光滑些。注：提高精度会导致空间数据文件增大，渲染性能下降 */
    renderAccuracy?: number;
    /** 初始视图缩放倍数，bounds * initViewScale = dbBounds */
    initViewScale?: number;
    /** 初始视图. */
    view?: {
        /** 初始视图中心点. */
        center?: [number, number];
        /** 初始视图级别. */
        zoom?: number;
        /** 初始视图方位角. */
        bearing?: number;
    };
}

/**
 * 点查询实体参数
 */
export  interface IPointQueryFeatures extends IQueryBaseFeatures {
    /** 查询的坐标X. */
    x: number;
    /** 查询的坐标Y. */
    y: number;
    /** 像素大小. */
    pixelsize?: number;
    /** 条件. */
    condition?: string;
    /** 返回最大的几何字节数. */
    maxGeomBytesSize?: number;
    /** 当前一个像素表示多少几何长度，如果输入了此值，则为此值为主，否则，根据输入的zoom值后台自动计算. */
    pixelToGeoLength?: number;
}

/**
 * 查询实体参数
 */
export  interface IQueryBaseFeatures {
    /** 当前级别. */
    zoom?: number;
    /** 地图ID(为空时采用当前打开的mapid). */
    mapid?: string;
    /** 地图版本(为空时采用当前打开的地图版本). */
    version?: string;
    /** 图层名称（为空时采用当前打开的地图图层名称). */
    layer?: string;
    /** 返回最多的记录条数. */
    limit?: number;
    /** 是返回的字段列表，多个之是用逗号,分开,如. "name,objectid" */
    fields?: string;
    /** 是否为几何图形查询. */
    geom?: boolean;
    /** GeoJSON几何数据简化墨托卡距离，默认为零，不简化。例如允许10级别以上一个像素级别的误差，可用 map.pixelToGeoLength(1, 10) * vjmap.Projection.EQUATORIAL_SEMIPERIMETER * 2 / map.getGeoBounds(1.0).width() */
    simplifyTolerance?: boolean;
}

/**
 * 矩形查询实体参数
 */
export  interface IRectQueryFeatures extends IQueryBaseFeatures {
    /** 查询的坐标X1. */
    x1: number;
    /** 查询的坐标Y1. */
    y1: number;
    /** 查询的坐标X2. */
    x2: number;
    /** 查询的坐标Y2. */
    y2: number;
    /** 条件. */
    condition?: string;
    /** 返回最大的几何字节数. */
    maxGeomBytesSize?: number;
}

export  interface IRequest {
    get: (url: string, params?: Record<string, any>, args?: Partial<Config>) => Promise<any>;
    put: (url: string, data: any, args?: Partial<Config>) => Promise<any>;
    post: (url: string, data: any, args?: Partial<Config>) => Promise<any>;
    patch: (url: string, data: any, args?: Partial<Config>) => Promise<any>;
    del: (url: string, args?: Partial<Config>) => Promise<any>;
    options: (url: string, args?: Partial<Config>) => Promise<any>;
}

/**
 * 多边形是否闭合
 * @param points
 * @return {boolean}
 */
export  function isClosedPolygon(points: GeoPoint[]): boolean;

/**
 * 指示提供的点是按逆时针（真）还是顺时针（假）顺序排列
 * @param a
 * @param b
 * @param c
 * @return {boolean}
 */
export  function isCounterClockwise(a: GeoPoint, b: GeoPoint, c: GeoPoint): boolean;

/**
 * A {@link GeoPointLike} object, an array of two numbers representing longitude and latitude,
 * or an object with `lng` and `lat` or `lon` and `lat` properties.
 *
 * Example:
 * ```typescript
 * const center = { lat: 53.3, lng: 13.4 };
 * mapView.geoCenter = GeoCoordinates.fromLatLng(center);
 * ```
 */
export  function isGeoPointLike(geoPoint: any): geoPoint is GeoPointLike;

/**
 * 获取图片切片缓存级别
 */
export  interface ISliceCacheZoom {
    /** 地图ID(为空时采用当前打开的mapid). */
    mapid?: string;
    /** 地图版本(为空时采用当前打开的地图版本). */
    version?: string;
    /** 图层名称（为空时采用当前打开的地图图层名称) */
    layer?: string;
    /** 是否是矢量切片，如果否则为栅格瓦片切片 */
    ismvt: boolean;
}

/**
 * 对图层进行切片
 */
export  interface ISliceLayer {
    /** 地图ID(为空时采用当前打开的mapid). */
    mapid?: string;
    /** 地图版本(为空时采用当前打开的地图版本). */
    version?: string;
    /** 图层名称（为空时采用当前打开的地图图层名称).如果为数组时，表示对多个图层进行切片 */
    layer: string | string[];
    /** 级别（切的第几级）, 如果为数组时，layer也必须是数组，一一对应 */
    zoom: number | number[];
    /** 是否是矢量切片，如果否则为栅格瓦片切片. 如果为数组时，layer也必须是数组，一一对应 */
    ismvt: boolean | boolean[];
    /** 是否取消对此图层的切片（正在切时有效）. */
    iscancel?: boolean;
    /** 是否取消所有的切片（正在切时有效）. */
    isAllCancel?: boolean;
    /** 批处理的条数（默认10000）. */
    batchNum?: number;
    /** 空闲一次批处理等待时间（默认1ms）. */
    idleBatchSleepMs?: number;
    /** 繁忙时一次批处理等待时间（默认10000ms）. */
    busyBatchSleepMs?: number;
}

export  const isPoint: (point: Object) => point is Point23D;

export  const isPoint3D: (point: Point23D) => point is Point3D;

/**
 * 判断点是否在多边形内。
 * @param pos 点
 * @param polygon 多边形坐标
 * @return {boolean}
 */
export  const isPointInPolygon: (pos: GeoPoint, polygon: GeoPoint[]) => boolean;

/**
 * 判断是否为零
 * @param value 值
 * @param precision 精度，缺省1e-6
 */
export  function isZero(value: number, precision?: number): boolean;

/**
 * 地图瓦片参数
 */
export  interface ITileUrlParam {
    /** 地图ID. */
    mapid?: string;
    /** 版本号. */
    version?: string;
    /** 图层名称. */
    layer?: string;
    /** 文件唯一ID. */
    fileid?: string;
}

/**
 * 更新地图参数
 */
export  interface IUpdateMapParam extends IOpenMapBaseParam {
    /** 是否删除老版本(缺省: false ). */
    deleteOldVersion?: boolean;
}

/**
 * 更新样式接口
 */
export  interface IUpdateStyle {
    /** 地图ID(为空时采用当前打开的mapid). */
    mapid?: string;
    /** 地图版本(为空时采用当前打开的地图版本). */
    version?: string;
    /** 样式名称. */
    name?: string;
    /** 要开的图层索引列表，格式如[0,1,3]. */
    layeron?: string | number[];
    /** 要关的图层索引列表，格式如[2,4]. layeron与layeroff只要输入一个即可*/
    layeroff?: string | number[];
    /** 地图裁剪范围，范围如[x1,y1,x2,y2].如果只有数字的话，表示是缩放系数 */
    clipbounds?: [number, number, number, number] | number;
    /** 颜色. */
    backcolor?: number;
    /** 线宽，格式如[1，1，1，1，0].表式第1，2，3，4级线宽开，第5级线宽关，大于第5级的，以最后设置的级别状态为主，所以也是关。如为空，则和原图线宽显示状态相同 */
    lineweight?: string;
    /** 表达式. */
    expression?: string;
}

/**
 * wms服务url地址接口
 */
export  interface IWmsTileUrl {
    /** 地图ID(为空时采用当前打开的mapid)， 为数组时表时同时请求多个. */
    mapid?: string | string[];
    /** 地图版本(为空时采用当前打开的地图版本). */
    version?: string | string[];
    /** 图层名称（为空时采用当前打开的地图图层名称). */
    layers?: string | string[];
    /** 范围，缺省{bbox-epsg-3857}. (如果要获取地图cad一个范围的wms数据无需任何坐标转换，将此范围填cad范围,srs,crs,mapbounds填为空).*/
    bbox?: string;
    /** 当前坐标系,缺省(EPSG:3857). */
    srs?: string;
    /** cad图的坐标系，为空的时候由元数据坐标系决定. */
    crs?: string | string[];
    /** 地理真实范围，如有值时,srs将不起作用 */
    mapbounds?: string;
    /** 宽. */
    width?: number;
    /** 高. */
    height?: number;
    /** 是否透明. */
    transparent?: boolean;
    /** 不透明时的背景颜色，默认为白色。格式必须为rgb(r,g,b)或rgba(r,g,b,a),a不透明应该是255. */
    backgroundColor?: string;
    /** 四参数(x偏移,y偏移,缩放，旋转弧度)，可选，对坐标最后进行修正*/
    fourParameter?: string | string[];
    /** 是否是矢量瓦片. */
    mvt?: boolean;
    /** 是否考虑旋转，在不同坐标系中转换是需要考虑。默认自动考虑是否需要旋转. */
    useImageRotate?: boolean;
    /** 旋转时图像处理算法. 1或2,默认自动选择（旋转时有用）*/
    imageProcessAlg?: number;
    /** 当前互联网底图地图类型 WGS84(84坐标，如天地图，osm), GCJ02(火星坐标，如高德，腾讯地图)， BD09LL(百度经纬度坐标，如百度地图)， BD09MC(百度墨卡托米制坐标，如百度地图)*/
    webMapType?: "WGS84" | "GCJ02" | "BD09LL" | "BD09MC";
}

export  const kebabCase: (s: any) => any;

export  interface KeyframeOptions<V = number> {
    to: V | V[];
    from?: V;
    duration?: number;
    ease?: Easing | Easing[];
    offset?: number[];
}

export  function keyframes<V>({ from, to, ease, offset, duration }: KeyframeOptions): any;

export  type LayerCallback = (arg0: {}) => void;

export  type LayerRef = string | string[] | RegExp | ((arg0: LayerSpecification) => boolean);

export  type LayerRefFunc = (arg0: LayerRef, ...args: any[]) => void;

export  type LayerRefFunc0 = (arg0: LayerRef) => void;

export  type LayerRefFunc1<T1> = (arg0: LayerRef, arg1: T1) => void;

export  type LayerRefFunc2<T1, T2> = (arg0: LayerRef, arg1: T1, arg2: T2) => void;

export  type LayerRefFunc3<T1, T2, T3> = (arg0: LayerRef, arg1: T1, arg2: T2, arg3: T3) => void;

export  type LayerSpecification = FillLayerSpecification | LineLayerSpecification | SymbolLayerSpecification | CircleLayerSpecification | HeatmapLayerSpecification | FillExtrusionLayerSpecification | RasterLayerSpecification | HillshadeLayerSpecification | BackgroundLayerSpecification | SkyLayerSpecification;

export  type LightSpecification = {
    anchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    position?: PropertyValueSpecificationEx<[number, number, number]>;
    color?: PropertyValueSpecificationEx<ColorSpecification>;
    intensity?: PropertyValueSpecificationEx<number>;
};

export  const linear: Easing;

export  interface LineGeoJsonInput {
    points: GeoPointLike[];
    properties?: object;
}

export  type LineLayerSpecification = {
    id: string;
    type: "line";
    metadata?: unknown;
    source: string;
    "source-layer"?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    layout?: {
        "line-cap"?: DataDrivenPropertyValueSpecification<"butt" | "round" | "square">;
        "line-join"?: DataDrivenPropertyValueSpecification<"bevel" | "round" | "miter">;
        "line-miter-limit"?: PropertyValueSpecificationEx<number>;
        "line-round-limit"?: PropertyValueSpecificationEx<number>;
        "line-sort-key"?: DataDrivenPropertyValueSpecification<number>;
        visibility?: "visible" | "none";
    };
    paint?: {
        "line-opacity"?: DataDrivenPropertyValueSpecification<number>;
        "line-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "line-translate"?: PropertyValueSpecificationEx<[number, number]>;
        "line-translate-anchor"?: PropertyValueSpecificationEx<"map" | "viewport">;
        "line-width"?: DataDrivenPropertyValueSpecification<number>;
        "line-gap-width"?: DataDrivenPropertyValueSpecification<number>;
        "line-offset"?: DataDrivenPropertyValueSpecification<number>;
        "line-blur"?: DataDrivenPropertyValueSpecification<number>;
        "line-dasharray"?: DataDrivenPropertyValueSpecification<Array<number>>;
        "line-pattern"?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
        "line-gradient"?: ExpressionSpecificationEx;
    };
};

export  type LineLayerStyleProp = {
    metadata?: unknown;
    source?: string;
    sourceLayer?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    lineCap?: DataDrivenPropertyValueSpecification<"butt" | "round" | "square">;
    lineJoin?: DataDrivenPropertyValueSpecification<"bevel" | "round" | "miter">;
    lineMiterMimit?: PropertyValueSpecificationEx<number>;
    lineRoundLimit?: PropertyValueSpecificationEx<number>;
    lineSortKey?: DataDrivenPropertyValueSpecification<number>;
    visibility?: "visible" | "none";
    lineOpacity?: DataDrivenPropertyValueSpecification<number>;
    lineColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    lineTranslate?: PropertyValueSpecificationEx<[number, number]>;
    lineTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    lineWidth?: DataDrivenPropertyValueSpecification<number>;
    lineGapWidth?: DataDrivenPropertyValueSpecification<number>;
    lineOffset?: DataDrivenPropertyValueSpecification<number>;
    lineBlur?: DataDrivenPropertyValueSpecification<number>;
    lineDasharray?: DataDrivenPropertyValueSpecification<Array<number>>;
    linePattern?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    lineGradient?: ExpressionSpecificationEx;
};

/**
 * 线被另外一条线分开多条线段，返回新的线段
 * @param line
 * @param splitLine
 * @param dotErr 允许误差的小数点后几位，默认6位
 * @return {any[] | GeoPoint[][]}
 */
export  function lineSplit(line: GeoPoint[], splitLine: GeoPoint[], dotErr?: number): GeoPoint[][];

/**
 * LineString Geometry Object
 *
 * https://tools.ietf.org/html/rfc7946#section-3.1.4
 */
 interface LineString extends GeometryObject {
    type: "LineString";
    coordinates: Position[];
}

/**
 * `LnglatProjection` 经纬度坐标投影.
 *
 * Example:
 * ```typescript
 * const mapExtent = new GeoBounds(new GeoPoint(10, 20), new GeoPoint(80, 90));
 * const prj = new LnglatProjection(mapExtent);
 * const pt = [30, 30];
 * const latlng = prj.toLngLat(pt);
 * const pt_geo = prj.fromLngLat(latlng);
 * const mkt = prj.toMercator(pt);
 * const pt_mkt = prj.fromMercator(mkt);
 * ```
 */
export  class LnglatProjection extends Projection {
    /** 地图地理范围. */
    mapExtent: GeoBounds;
    /**
     *  `GeoBounds` 构造函数
     *
     * @extent extent - 地图地理范围.
     */
    constructor();
    /**
     *  设置地图范围
     *
     * @extent extent - 地图地理范围.
     */
    setExtent(extent: GeoBounds): void;
    /**
     * 坐标转墨卡托(epsg:3857)
     * @param input 坐标点
     * @return {[number, number]}
     */
    toMercator(input: GeoPointLike): [number, number];
    /**
     * 墨卡托(epsg:3857)转坐标
     * @param input 墨卡托坐标点
     * @return {[number, number]}
     */
    fromMercator(input: GeoPointLike): [number, number];
    /**
     * 地图地理坐标转经纬度
     * @param input 地理坐标点
     * @return {[number, number]}
     */
    toLngLat(input: GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]): LngLatLike;
    /**
     * 经纬度转地图地理坐标
     * @param input 经纬度坐标点
     * @return {GeoPoint}
     */
    fromLngLat(input: GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]): GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[];
    /**
     * 得到地图范围
     * @return {GeoBounds}
     */
    getMapExtent(): GeoBounds;
    /**
     * 把距离转化为米
     * @param dist
     */
    toMeter(dist: number): number;
    /**
     * 把米转化为距离
     * @param meter
     */
    fromMeter(meter: number): number;
}

export  class MapGlUtils {
    constructor();
    static init(map: any, bindToMap: any): any;
    static newMap(params?: {}, options?: {}): Promise<Map>;
}

export  enum MapOpenWay {
    /** 内存模式. */
    Memory = "Memory",
    /** 存储为几何数据再渲染模式 */
    GeomRender = "GeomRender"
}

 class MarkerBase {
    protected options: AnimateMarkerLayerOption;
    protected markersElement: any;
    protected features: FeatureCollection | {
        lngLat: LngLatLike;
        text?: string;
    };
    constructor(features: FeatureCollection | {
        lngLat: LngLatLike;
        text?: string;
    }, options?: AnimateMarkerLayerOption);
    setFeatures(features: FeatureCollection): void;
    getMarkersElement(): any;
    getElement(index?: number): any;
    getLngLat(index?: number): any;
    createMarker(options?: createMarkerOptions, index?: number): Marker;
    setMarkersTextField(textField: string): void;
    setMarkersText(text: string, index?: number): void;
    setMarkersTextFontSize(textFontSize: number, index?: number): void;
    setMarkersTextColor(textColor: string, index?: number): void;
    protected _getColorWithOpacity(color: string, opacity: string | number): string;
    protected _getTextContainer(feature: any, className: string): HTMLDivElement | null;
    set16ToRgb(str: string): string;
    getColorWithOpacity(color: string, opacity: string | number): string;
}

/**
 * 创建文本组件.
 */
export  class MarkerCluster extends Evented {
    private options;
    private markers;
    private markersOnScreen;
    private _map;
    private _hidden;
    private data;
    /**
     * 构造函数
     * @param options
     */
    constructor(options: MarkerClusterOptions);
    /**
     * 将 `MarkerCluster` 附加到 `Map` 对象。
     */
    addTo(map: Map): MarkerCluster;
    /**
     * 更新数据。
     */
    updateData(data: FeatureCollection | MarkerClusterData[]): void;
    /**
     * 获取数据。
     */
    getData(): MarkerClusterData[];
    /**
     * 更新markers。
     */
    updateMarkers(): void;
    /**
     * 从地图中删除。
     */
    remove(): void;
    /**
     * 显示
     */
    show(): void;
    /**
     * 隐藏
     */
    hide(): void;
    allowOverlap(bAllowOverlap: boolean): void;
    allowOverlapMaxZoom(zoom: number): void;
}

export  interface MarkerClusterData {
    point: GeoPointLike;
    properties?: Record<string, any>;
    [propName: string]: any;
}

export  interface MarkerClusterOptions {
    /** 数据内容.(传入坐标为CAD地理坐标) */
    data: FeatureCollection | MarkerClusterData[];
    createMarker: (curMarkerData: MarkerClusterData, clusterMarkersData: MarkerClusterData[]) => Marker | Text_2;
    updateMarker?: (curMarkerData: MarkerClusterData, clusterMarkersData: MarkerClusterData[], marker: Marker) => Marker | Text_2 | undefined;
    /** 是否允许重叠，默认false. */
    allowOverlap?: boolean;
    /** 离相机最近的在显示在前面，默认false. */
    cameraNearFront?: boolean;
    /** 允许重叠的最大缩放级别，小于或等于此级别才会处理重叠，超过此级时会全部显示当前所有的(如果不允许重叠时有效).默认4级*/
    allowOverlapMaxZoom?: number;
    /** marker div的像素宽，用于计算重叠时需要，默认40. 如果在data的properties设置了属性markerWidth，则以data设置的为准*/
    markerWidth?: number;
    /** marker div的像素高，用于计算重叠时需要，默认40. 如果在data的properties设置了属性markerHeight，则以data设置的为准 */
    markerHeight?: number;
}

export  namespace mat2 {
    export type valueType = mat2type;
    /**
     * Creates a new identity mat2
     *
     * @returns {mat2} a new 2x2 matrix
     */
    export function create(): Float32Array;
    /**
     * Creates a new mat2 initialized with values from an existing matrix
     *
     * @param {ReadonlyMat2} a matrix to clone
     * @returns {mat2} a new 2x2 matrix
     */
    export function clone(a: mat2type): Float32Array;
    /**
     * Copy the values from one mat2 to another
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the source matrix
     * @returns {mat2} out
     */
    export function copy(out: mat2type, a: mat2type): mat2type;
    /**
     * Set a mat2 to the identity matrix
     *
     * @param {mat2} out the receiving matrix
     * @returns {mat2} out
     */
    export function identity(out: mat2type): mat2type;
    /**
     * Create a new mat2 with the given values
     *
     * @param {Number} m00 Component in column 0, row 0 position (index 0)
     * @param {Number} m01 Component in column 0, row 1 position (index 1)
     * @param {Number} m10 Component in column 1, row 0 position (index 2)
     * @param {Number} m11 Component in column 1, row 1 position (index 3)
     * @returns {mat2} out A new 2x2 matrix
     */
    export function fromValues(m00: number, m01: number, m10: number, m11: number): mat2type;
    /**
     * Set the components of a mat2 to the given values
     *
     * @param {mat2} out the receiving matrix
     * @param {Number} m00 Component in column 0, row 0 position (index 0)
     * @param {Number} m01 Component in column 0, row 1 position (index 1)
     * @param {Number} m10 Component in column 1, row 0 position (index 2)
     * @param {Number} m11 Component in column 1, row 1 position (index 3)
     * @returns {mat2} out
     */
    export function set(out: mat2type, m00: number, m01: number, m10: number, m11: number): mat2type;
    /**
     * Transpose the values of a mat2
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the source matrix
     * @returns {mat2} out
     */
    export function transpose(out: mat2type, a: mat2type): mat2type;
    /**
     * Inverts a mat2
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the source matrix
     * @returns {mat2} out
     */
    export function invert(out: mat2type, a: mat2type): mat2type | null;
    /**
     * Calculates the adjugate of a mat2
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the source matrix
     * @returns {mat2} out
     */
    export function adjoint(out: mat2type, a: mat2type): mat2type;
    /**
     * Calculates the determinant of a mat2
     *
     * @param {ReadonlyMat2} a the source matrix
     * @returns {Number} determinant of a
     */
    export function determinant(a: mat2type): number;
    /**
     * Multiplies two mat2's
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the first operand
     * @param {ReadonlyMat2} b the second operand
     * @returns {mat2} out
     */
    export function multiply(out: mat2type, a: mat2type, b: mat2type): mat2type;
    /**
     * Rotates a mat2 by the given angle
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat2} out
     */
    export function rotate(out: mat2type, a: mat2type, rad: number): mat2type;
    /**
     * Scales the mat2 by the dimensions in the given vec2
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the matrix to rotate
     * @param {ReadonlyVec2} v the vec2 to scale the matrix by
     * @returns {mat2} out
     **/
    export function scale(out: mat2type, a: mat2type, v: mat2type): mat2type;
    /**
     * Creates a matrix from a given angle
     * This is equivalent to (but much faster than):
     *
     *     mat2.identity(dest);
     *     mat2.rotate(dest, dest, rad);
     *
     * @param {mat2} out mat2 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat2} out
     */
    export function fromRotation(out: mat2type, rad: number): mat2type;
    /**
     * Creates a matrix from a vector scaling
     * This is equivalent to (but much faster than):
     *
     *     mat2.identity(dest);
     *     mat2.scale(dest, dest, vec);
     *
     * @param {mat2} out mat2 receiving operation result
     * @param {ReadonlyVec2} v Scaling vector
     * @returns {mat2} out
     */
    export function fromScaling(out: mat2type, v: mat2type): mat2type;
    /**
     * Returns a string representation of a mat2
     *
     * @param {ReadonlyMat2} a matrix to represent as a string
     * @returns {String} string representation of the matrix
     */
    export function str(a: mat2type): string;
    /**
     * Returns Frobenius norm of a mat2
     *
     * @param {ReadonlyMat2} a the matrix to calculate Frobenius norm of
     * @returns {Number} Frobenius norm
     */
    export function frob(a: mat2type): number;
    /**
     * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
     * @param {ReadonlyMat2} L the lower triangular matrix
     * @param {ReadonlyMat2} D the diagonal matrix
     * @param {ReadonlyMat2} U the upper triangular matrix
     * @param {ReadonlyMat2} a the input matrix to factorize
     */
    export function LDU(L: mat2type, D: mat2type, U: mat2type, a: mat2type): mat2type[];
    /**
     * Adds two mat2's
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the first operand
     * @param {ReadonlyMat2} b the second operand
     * @returns {mat2} out
     */
    export function add(out: mat2type, a: mat2type, b: mat2type): mat2type;
    /**
     * Subtracts matrix b from matrix a
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the first operand
     * @param {ReadonlyMat2} b the second operand
     * @returns {mat2} out
     */
    export function subtract(out: mat2type, a: mat2type, b: mat2type): mat2type;
    /**
     * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
     *
     * @param {ReadonlyMat2} a The first matrix.
     * @param {ReadonlyMat2} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    export function exactEquals(a: mat2type, b: mat2type): boolean;
    /**
     * Returns whether or not the matrices have approximately the same elements in the same position.
     *
     * @param {ReadonlyMat2} a The first matrix.
     * @param {ReadonlyMat2} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    export function equals(a: mat2type, b: mat2type): boolean;
    /**
     * Multiply each element of the matrix by a scalar.
     *
     * @param {mat2} out the receiving matrix
     * @param {ReadonlyMat2} a the matrix to scale
     * @param {Number} b amount to scale the matrix's elements by
     * @returns {mat2} out
     */
    export function multiplyScalar(out: mat2type, a: mat2type, b: number): mat2type;
    /**
     * Adds two mat2's after multiplying each element of the second operand by a scalar value.
     *
     * @param {mat2} out the receiving vector
     * @param {ReadonlyMat2} a the first operand
     * @param {ReadonlyMat2} b the second operand
     * @param {Number} scale the amount to scale b's elements by before adding
     * @returns {mat2} out
     */
    export function multiplyScalarAndAdd(out: mat2type, a: mat2type, b: mat2type, scale: number): mat2type;
}

export  namespace mat2d {
    export type valueType = mat2dtype;
    /**
     * Creates a new identity mat2d
     *
     * @returns {mat2d} a new 2x3 matrix
     */
    export function create(): mat2dtype;
    /**
     * Creates a new mat2d initialized with values from an existing matrix
     *
     * @param {ReadonlyMat2d} a matrix to clone
     * @returns {mat2d} a new 2x3 matrix
     */
    export function clone(a: mat2dtype): mat2dtype;
    /**
     * Copy the values from one mat2d to another
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the source matrix
     * @returns {mat2d} out
     */
    export function copy(out: mat2dtype, a: mat2dtype): mat2dtype;
    /**
     * Set a mat2d to the identity matrix
     *
     * @param {mat2d} out the receiving matrix
     * @returns {mat2d} out
     */
    export function identity(out: mat2dtype): mat2dtype;
    /**
     * Create a new mat2d with the given values
     *
     * @param {Number} a Component A (index 0)
     * @param {Number} b Component B (index 1)
     * @param {Number} c Component C (index 2)
     * @param {Number} d Component D (index 3)
     * @param {Number} tx Component TX (index 4)
     * @param {Number} ty Component TY (index 5)
     * @returns {mat2d} A new mat2d
     */
    export function fromValues(a: number, b: number, c: number, d: number, tx: number, ty: number): mat2dtype;
    /**
     * Set the components of a mat2d to the given values
     *
     * @param {mat2d} out the receiving matrix
     * @param {Number} a Component A (index 0)
     * @param {Number} b Component B (index 1)
     * @param {Number} c Component C (index 2)
     * @param {Number} d Component D (index 3)
     * @param {Number} tx Component TX (index 4)
     * @param {Number} ty Component TY (index 5)
     * @returns {mat2d} out
     */
    export function set(out: mat2dtype, a: number, b: number, c: number, d: number, tx: number, ty: number): mat2dtype;
    /**
     * Inverts a mat2d
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the source matrix
     * @returns {mat2d} out
     */
    export function invert(out: mat2dtype, a: mat2dtype): mat2dtype | null;
    /**
     * Calculates the determinant of a mat2d
     *
     * @param {ReadonlyMat2d} a the source matrix
     * @returns {Number} determinant of a
     */
    export function determinant(a: mat2dtype): number;
    /**
     * Multiplies two mat2d's
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the first operand
     * @param {ReadonlyMat2d} b the second operand
     * @returns {mat2d} out
     */
    export function multiply(out: mat2dtype, a: mat2dtype, b: mat2dtype): mat2dtype;
    /**
     * Rotates a mat2d by the given angle
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat2d} out
     */
    export function rotate(out: mat2dtype, a: mat2dtype, rad: number): mat2dtype;
    /**
     * Scales the mat2d by the dimensions in the given vec2
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the matrix to translate
     * @param {ReadonlyVec2} v the vec2 to scale the matrix by
     * @returns {mat2d} out
     **/
    export function scale(out: mat2dtype, a: mat2dtype, v: mat2dtype): mat2dtype;
    /**
     * Translates the mat2d by the dimensions in the given vec2
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the matrix to translate
     * @param {ReadonlyVec2} v the vec2 to translate the matrix by
     * @returns {mat2d} out
     **/
    export function translate(out: mat2dtype, a: mat2dtype, v: mat2dtype): mat2dtype;
    /**
     * Creates a matrix from a given angle
     * This is equivalent to (but much faster than):
     *
     *     mat2d.identity(dest);
     *     mat2d.rotate(dest, dest, rad);
     *
     * @param {mat2d} out mat2d receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat2d} out
     */
    export function fromRotation(out: mat2dtype, rad: number): mat2dtype;
    /**
     * Creates a matrix from a vector scaling
     * This is equivalent to (but much faster than):
     *
     *     mat2d.identity(dest);
     *     mat2d.scale(dest, dest, vec);
     *
     * @param {mat2d} out mat2d receiving operation result
     * @param {ReadonlyVec2} v Scaling vector
     * @returns {mat2d} out
     */
    export function fromScaling(out: mat2dtype, v: mat2dtype): mat2dtype;
    /**
     * Creates a matrix from a vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat2d.identity(dest);
     *     mat2d.translate(dest, dest, vec);
     *
     * @param {mat2d} out mat2d receiving operation result
     * @param {ReadonlyVec2} v Translation vector
     * @returns {mat2d} out
     */
    export function fromTranslation(out: mat2dtype, v: mat2dtype): mat2dtype;
    /**
     * Returns a string representation of a mat2d
     *
     * @param {ReadonlyMat2d} a matrix to represent as a string
     * @returns {String} string representation of the matrix
     */
    export function str(a: mat2dtype): string;
    /**
     * Returns Frobenius norm of a mat2d
     *
     * @param {ReadonlyMat2d} a the matrix to calculate Frobenius norm of
     * @returns {Number} Frobenius norm
     */
    export function frob(a: mat2dtype): number;
    /**
     * Adds two mat2d's
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the first operand
     * @param {ReadonlyMat2d} b the second operand
     * @returns {mat2d} out
     */
    export function add(out: mat2dtype, a: mat2dtype, b: mat2dtype): mat2dtype;
    /**
     * Subtracts matrix b from matrix a
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the first operand
     * @param {ReadonlyMat2d} b the second operand
     * @returns {mat2d} out
     */
    export function subtract(out: mat2dtype, a: mat2dtype, b: mat2dtype): mat2dtype;
    /**
     * Multiply each element of the matrix by a scalar.
     *
     * @param {mat2d} out the receiving matrix
     * @param {ReadonlyMat2d} a the matrix to scale
     * @param {Number} b amount to scale the matrix's elements by
     * @returns {mat2d} out
     */
    export function multiplyScalar(out: mat2dtype, a: mat2dtype, b: number): mat2dtype;
    /**
     * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
     *
     * @param {mat2d} out the receiving vector
     * @param {ReadonlyMat2d} a the first operand
     * @param {ReadonlyMat2d} b the second operand
     * @param {Number} scale the amount to scale b's elements by before adding
     * @returns {mat2d} out
     */
    export function multiplyScalarAndAdd(out: mat2dtype, a: mat2dtype, b: mat2dtype, scale: number): mat2dtype;
    /**
     * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
     *
     * @param {ReadonlyMat2d} a The first matrix.
     * @param {ReadonlyMat2d} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    export function exactEquals(a: mat2dtype, b: mat2dtype): boolean;
    /**
     * Returns whether or not the matrices have approximately the same elements in the same position.
     *
     * @param {ReadonlyMat2d} a The first matrix.
     * @param {ReadonlyMat2d} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    export function equals(a: mat2dtype, b: mat2dtype): boolean;
}

export  type mat2dtype = [number, number, number, number, number, number] | Float32Array;

export  type mat2type = [number, number, number, number] | Float32Array;

export  namespace mat3 {
    export type valueType = mat3type;
    /**
     * Creates a new identity mat3
     *
     * @returns {mat3} a new 3x3 matrix
     */
    export function create(): mat3type;
    /**
     * Copies the upper-left 3x3 values into the given mat3.
     *
     * @param {mat3} out the receiving 3x3 matrix
     * @param {mat4} a   the source 4x4 matrix
     * @returns {mat3} out
     */
    export function fromMat4(out: mat3type, a: mat3type): mat3type;
    /**
     * Creates a new mat3 initialized with values from an existing matrix
     *
     * @param {mat3} a matrix to clone
     * @returns {mat3} a new 3x3 matrix
     */
    export function clone(a: mat3type): mat3type;
    /**
     * Copy the values from one mat3 to another
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the source matrix
     * @returns {mat3} out
     */
    export function copy(out: mat3type, a: mat3type): mat3type;
    /**
     * Create a new mat3 with the given values
     *
     * @param {Number} m00 Component in column 0, row 0 position (index 0)
     * @param {Number} m01 Component in column 0, row 1 position (index 1)
     * @param {Number} m02 Component in column 0, row 2 position (index 2)
     * @param {Number} m10 Component in column 1, row 0 position (index 3)
     * @param {Number} m11 Component in column 1, row 1 position (index 4)
     * @param {Number} m12 Component in column 1, row 2 position (index 5)
     * @param {Number} m20 Component in column 2, row 0 position (index 6)
     * @param {Number} m21 Component in column 2, row 1 position (index 7)
     * @param {Number} m22 Component in column 2, row 2 position (index 8)
     * @returns {mat3} A new mat3
     */
    export function fromValues(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): mat3type;
    /**
     * Set the components of a mat3 to the given values
     *
     * @param {mat3} out the receiving matrix
     * @param {Number} m00 Component in column 0, row 0 position (index 0)
     * @param {Number} m01 Component in column 0, row 1 position (index 1)
     * @param {Number} m02 Component in column 0, row 2 position (index 2)
     * @param {Number} m10 Component in column 1, row 0 position (index 3)
     * @param {Number} m11 Component in column 1, row 1 position (index 4)
     * @param {Number} m12 Component in column 1, row 2 position (index 5)
     * @param {Number} m20 Component in column 2, row 0 position (index 6)
     * @param {Number} m21 Component in column 2, row 1 position (index 7)
     * @param {Number} m22 Component in column 2, row 2 position (index 8)
     * @returns {mat3} out
     */
    export function set(out: mat3type, m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): mat3type;
    /**
     * Set a mat3 to the identity matrix
     *
     * @param {mat3} out the receiving matrix
     * @returns {mat3} out
     */
    export function identity(out: mat3type): mat3type;
    /**
     * Transpose the values of a mat3
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the source matrix
     * @returns {mat3} out
     */
    export function transpose(out: mat3type, a: mat3type): mat3type;
    /**
     * Inverts a mat3
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the source matrix
     * @returns {mat3} out
     */
    export function invert(out: mat3type, a: mat3type): mat3type | null;
    /**
     * Calculates the adjugate of a mat3
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the source matrix
     * @returns {mat3} out
     */
    export function adjoint(out: mat3type, a: mat3type): mat3type;
    /**
     * Calculates the determinant of a mat3
     *
     * @param {mat3} a the source matrix
     * @returns {Number} determinant of a
     */
    export function determinant(a: mat3type): number;
    /**
     * Multiplies two mat3's
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the first operand
     * @param {mat3} b the second operand
     * @returns {mat3} out
     */
    export function multiply(out: mat3type, a: mat3type, b: mat3type): mat3type;
    /**
     * Alias for {@link mat3.multiply}
     * @function
     */
    /**
     * Translate a mat3 by the given vector
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the matrix to translate
     * @param {vec2} v vector to translate by
     * @returns {mat3} out
     */
    export function translate(out: mat3type, a: mat3type, v: vec2type): mat3type;
    /**
     * Rotates a mat3 by the given angle
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat3} out
     */
    export function rotate(out: mat3type, a: mat3type, rad: number): mat3type;
    /**
     * Scales the mat3 by the dimensions in the given vec2
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the matrix to rotate
     * @param {vec2} v the vec2 to scale the matrix by
     * @returns {mat3} out
     */
    export function scale(out: mat3type, a: mat3type, v: vec2type): mat3type;
    /**
     * Creates a matrix from a vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat3.identity(dest);
     *     mat3.translate(dest, dest, vec);
     *
     * @param {mat3} out mat3 receiving operation result
     * @param {vec2} v Translation vector
     * @returns {mat3} out
     */
    export function fromTranslation(out: mat3type, v: vec2type): mat3type;
    /**
     * Creates a matrix from a given angle
     * This is equivalent to (but much faster than):
     *
     *     mat3.identity(dest);
     *     mat3.rotate(dest, dest, rad);
     *
     * @param {mat3} out mat3 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat3} out
     */
    export function fromRotation(out: mat3type, rad: number): mat3type;
    /**
     * Creates a matrix from a vector scaling
     * This is equivalent to (but much faster than):
     *
     *     mat3.identity(dest);
     *     mat3.scale(dest, dest, vec);
     *
     * @param {mat3} out mat3 receiving operation result
     * @param {vec2} v Scaling vector
     * @returns {mat3} out
     */
    export function fromScaling(out: mat3type, v: vec2type): mat3type;
    /**
     * Copies the values from a mat2d into a mat3
     *
     * @param {mat3} out the receiving matrix
     * @param {mat2d} a the matrix to copy
     * @returns {mat3} out
     */
    export function fromMat2d(out: mat3type, a: mat2dtype): mat3type;
    /**
     * Calculates a 3x3 matrix from the given quaternion
     *
     * @param {mat3} out mat3 receiving operation result
     * @param {quat} q Quaternion to create matrix from
     *
     * @returns {mat3} out
     */
    export function fromQuat(out: mat3type, q: quattype): mat3type;
    /**
     * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
     *
     * @param {mat3} out mat3 receiving operation result
     * @param {mat4} a Mat4 to derive the normal matrix from
     *
     * @returns {mat3} out
     */
    export function normalFromMat4(out: mat3type, a: mat4type): mat3type | null;
    /**
     * Returns a string representation of a mat3
     *
     * @param {mat3} a matrix to represent as a string
     * @returns {String} string representation of the matrix
     */
    export function str(a: mat3type): string;
    /**
     * Returns Frobenius norm of a mat3
     *
     * @param {mat3} a the matrix to calculate Frobenius norm of
     * @returns {Number} Frobenius norm
     */
    export function frob(a: mat3type): number;
    /**
     * Adds two mat3's
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the first operand
     * @param {mat3} b the second operand
     * @returns {mat3} out
     */
    export function add(out: mat3type, a: mat3type, b: mat3type): mat3type;
    /**
     * Subtracts matrix b from matrix a
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the first operand
     * @param {mat3} b the second operand
     * @returns {mat3} out
     */
    export function subtract(out: mat3type, a: mat3type, b: mat3type): mat3type;
    /**
     * Alias for {@link mat3.subtract}
     * @function
     */
    /**
     * Multiply each element of the matrix by a scalar.
     *
     * @param {mat3} out the receiving matrix
     * @param {mat3} a the matrix to scale
     * @param {Number} b amount to scale the matrix's elements by
     * @returns {mat3} out
     */
    export function multiplyScalar(out: mat3type, a: mat3type, b: number): mat3type;
    /**
     * Adds two mat3's after multiplying each element of the second operand by a scalar value.
     *
     * @param {mat3} out the receiving vector
     * @param {mat3} a the first operand
     * @param {mat3} b the second operand
     * @param {Number} s the amount to scale b's elements by before adding
     * @returns {mat3} out
     */
    export function multiplyScalarAndAdd(out: mat3type, a: mat3type, b: mat3type, s: number): mat3type;
    /**
     * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
     *
     * @param {mat3} a The first matrix.
     * @param {mat3} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    export function exactEquals(a: mat3type, b: mat3type): boolean;
    /**
     * Returns whether or not the matrices have approximately the same elements in the same position.
     *
     * @param {mat3} a The first matrix.
     * @param {mat3} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    export function equals(a: mat3type, b: mat3type): boolean;
}

export  type mat3type = [number, number, number, number, number, number, number, number, number] | Float32Array;

export  namespace mat4 {
    export type valueType = mat4type;
    /**
     * Creates a new identity mat4
     *
     * @returns {mat4} a new 4x4 matrix
     */
    export function create(): mat4type;
    /**
     * Creates a new mat4 initialized with values from an existing matrix
     *
     * @param {mat4} a matrix to clone
     * @returns {mat4} a new 4x4 matrix
     */
    export function clone(a: mat4type): mat4type;
    /**
     * Copy the values from one mat4 to another
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the source matrix
     * @returns {mat4} out
     */
    export function copy(out: mat4type, a: mat4type): mat4type;
    /**
     * Create a new mat4 with the given values
     *
     * @param {Number} m00 Component in column 0, row 0 position (index 0)
     * @param {Number} m01 Component in column 0, row 1 position (index 1)
     * @param {Number} m02 Component in column 0, row 2 position (index 2)
     * @param {Number} m03 Component in column 0, row 3 position (index 3)
     * @param {Number} m10 Component in column 1, row 0 position (index 4)
     * @param {Number} m11 Component in column 1, row 1 position (index 5)
     * @param {Number} m12 Component in column 1, row 2 position (index 6)
     * @param {Number} m13 Component in column 1, row 3 position (index 7)
     * @param {Number} m20 Component in column 2, row 0 position (index 8)
     * @param {Number} m21 Component in column 2, row 1 position (index 9)
     * @param {Number} m22 Component in column 2, row 2 position (index 10)
     * @param {Number} m23 Component in column 2, row 3 position (index 11)
     * @param {Number} m30 Component in column 3, row 0 position (index 12)
     * @param {Number} m31 Component in column 3, row 1 position (index 13)
     * @param {Number} m32 Component in column 3, row 2 position (index 14)
     * @param {Number} m33 Component in column 3, row 3 position (index 15)
     * @returns {mat4} A new mat4
     */
    export function fromValues(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): mat4type;
    /**
     * Set the components of a mat4 to the given values
     *
     * @param {mat4} out the receiving matrix
     * @param {Number} m00 Component in column 0, row 0 position (index 0)
     * @param {Number} m01 Component in column 0, row 1 position (index 1)
     * @param {Number} m02 Component in column 0, row 2 position (index 2)
     * @param {Number} m03 Component in column 0, row 3 position (index 3)
     * @param {Number} m10 Component in column 1, row 0 position (index 4)
     * @param {Number} m11 Component in column 1, row 1 position (index 5)
     * @param {Number} m12 Component in column 1, row 2 position (index 6)
     * @param {Number} m13 Component in column 1, row 3 position (index 7)
     * @param {Number} m20 Component in column 2, row 0 position (index 8)
     * @param {Number} m21 Component in column 2, row 1 position (index 9)
     * @param {Number} m22 Component in column 2, row 2 position (index 10)
     * @param {Number} m23 Component in column 2, row 3 position (index 11)
     * @param {Number} m30 Component in column 3, row 0 position (index 12)
     * @param {Number} m31 Component in column 3, row 1 position (index 13)
     * @param {Number} m32 Component in column 3, row 2 position (index 14)
     * @param {Number} m33 Component in column 3, row 3 position (index 15)
     * @returns {mat4} out
     */
    export function set(out: mat4type, m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): mat4type;
    /**
     * Set a mat4 to the identity matrix
     *
     * @param {mat4} out the receiving matrix
     * @returns {mat4} out
     */
    export function identity(out: mat4type): mat4type;
    /**
     * Transpose the values of a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the source matrix
     * @returns {mat4} out
     */
    export function transpose(out: mat4type, a: mat4type): mat4type;
    /**
     * Inverts a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the source matrix
     * @returns {mat4} out
     */
    export function invert(out: mat4type, a: mat4type): mat4type | null;
    /**
     * Calculates the adjugate of a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the source matrix
     * @returns {mat4} out
     */
    export function adjoint(out: mat4type, a: mat4type): mat4type;
    /**
     * Calculates the determinant of a mat4
     *
     * @param {mat4} a the source matrix
     * @returns {Number} determinant of a
     */
    export function determinant(a: mat4type): number;
    /**
     * Multiplies two mat4s
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the first operand
     * @param {mat4} b the second operand
     * @returns {mat4} out
     */
    export function multiply(out: mat4type, a: mat4type, b: mat4type): mat4type;
    /**
     * Alias for {@link mat4.multiply}
     * @function
     */
    /**
     * Translate a mat4 by the given vector
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the matrix to translate
     * @param {vec3} v vector to translate by
     * @returns {mat4} out
     */
    export function translate(out: mat4type, a: mat4type, v: vec3type): mat4type;
    /**
     * Scales the mat4 by the dimensions in the given vec3 not using vectorization
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the matrix to scale
     * @param {vec3} v the vec3 to scale the matrix by
     * @returns {mat4} out
     */
    export function scale(out: mat4type, a: mat4type, v: vec3type): mat4type;
    /**
     * Rotates a mat4 by the given angle around the given axis
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @param {vec3} axis the axis to rotate around
     * @returns {mat4} out
     */
    export function rotate(out: mat4type, a: mat4type, rad: number, axis: vec3type): mat4type | null;
    /**
     * Rotates a matrix by the given angle around the X axis
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */
    export function rotateX(out: mat4type, a: mat4type, rad: number): mat4type;
    /**
     * Rotates a matrix by the given angle around the Y axis
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */
    export function rotateY(out: mat4type, a: mat4type, rad: number): mat4type;
    /**
     * Rotates a matrix by the given angle around the Z axis
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */
    export function rotateZ(out: mat4type, a: mat4type, rad: number): mat4type;
    /**
     * Creates a matrix from a vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, dest, vec);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {vec3} v Translation vector
     * @returns {mat4} out
     */
    export function fromTranslation(out: mat4type, v: vec3type): mat4type;
    /**
     * Creates a matrix from a vector scaling
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.scale(dest, dest, vec);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {vec3} v Scaling vector
     * @returns {mat4} out
     */
    export function fromScaling(out: mat4type, v: vec3type): mat4type;
    /**
     * Creates a matrix from a given angle around a given axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotate(dest, dest, rad, axis);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @param {vec3} axis the axis to rotate around
     * @returns {mat4} out
     */
    export function fromRotation(out: mat4type, rad: number, axis: vec3type): mat4type | null;
    /**
     * Creates a matrix from the given angle around the X axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateX(dest, dest, rad);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */
    export function fromXRotation(out: mat4type, rad: number): mat4type;
    /**
     * Creates a matrix from the given angle around the Y axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateY(dest, dest, rad);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */
    export function fromYRotation(out: mat4type, rad: number): mat4type;
    /**
     * Creates a matrix from the given angle around the Z axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateZ(dest, dest, rad);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */
    export function fromZRotation(out: mat4type, rad: number): mat4type;
    /**
     * Creates a matrix from a quaternion rotation and vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     var quatMat = mat4.create();
     *     quat.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {quat} q Rotation quaternion
     * @param {vec3} v Translation vector
     * @returns {mat4} out
     */
    export function fromRotationTranslation(out: mat4type, q: quattype, v: vec3type): mat4type;
    /**
     * Returns the translation vector component of a transformation
     *  matrix. If a matrix is built with fromRotationTranslation,
     *  the returned vector will be the same as the translation vector
     *  originally supplied.
     * @param  {vec3} out Vector to receive translation component
     * @param  {mat4} mat Matrix to be decomposed (input)
     * @return {vec3} out
     */
    export function getTranslation(out: vec3type, mat: mat4type): vec3type;
    /**
     * Returns the scaling factor component of a transformation
     *  matrix. If a matrix is built with fromRotationTranslationScale
     *  with a normalized Quaternion paramter, the returned vector will be
     *  the same as the scaling vector
     *  originally supplied.
     * @param  {vec3} out Vector to receive scaling factor component
     * @param  {mat4} mat Matrix to be decomposed (input)
     * @return {vec3} out
     */
    export function getScaling(out: vec3type, mat: mat4type): vec3type;
    /**
     * Returns a quaternion representing the rotational component
     *  of a transformation matrix. If a matrix is built with
     *  fromRotationTranslation, the returned quaternion will be the
     *  same as the quaternion originally supplied.
     * @param {quat} out Quaternion to receive the rotation component
     * @param {mat4} mat Matrix to be decomposed (input)
     * @return {quat} out
     */
    export function getRotation(out: vec4type, mat: mat4type): quattype;
    /**
     * Creates a matrix from a quaternion rotation, vector translation and vector scale
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     var quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *     mat4.scale(dest, scale)
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {quat} q Rotation quaternion
     * @param {vec3} v Translation vector
     * @param {vec3} s Scaling vector
     * @returns {mat4} out
     */
    export function fromRotationTranslationScale(out: mat4type, q: quattype, v: vec3type, s: vec3type): mat4type;
    /**
     * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     mat4.translate(dest, origin);
     *     var quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *     mat4.scale(dest, scale)
     *     mat4.translate(dest, negativeOrigin);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {quat4} q Rotation quaternion
     * @param {vec3} v Translation vector
     * @param {vec3} s Scaling vector
     * @param {vec3} o The origin vector around which to scale and rotate
     * @returns {mat4} out
     */
    export function fromRotationTranslationScaleOrigin(out: mat4type, q: quattype, v: vec3type, s: vec3type, o: vec3type): mat4type;
    /**
     * Calculates a 4x4 matrix from the given quaternion
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {quat} q Quaternion to create matrix from
     *
     * @returns {mat4} out
     */
    export function fromQuat(out: mat4type, q: quattype): mat4type;
    /**
     * Generates a frustum matrix with the given bounds
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {Number} left Left bound of the frustum
     * @param {Number} right Right bound of the frustum
     * @param {Number} bottom Bottom bound of the frustum
     * @param {Number} top Top bound of the frustum
     * @param {Number} near Near bound of the frustum
     * @param {Number} far Far bound of the frustum
     * @returns {mat4} out
     */
    export function frustum(out: mat4type, left: number, right: number, bottom: number, top: number, near: number, far: number): mat4type;
    /**
     * Generates a perspective projection matrix with the given bounds
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {number} fovy Vertical field of view in radians
     * @param {number} aspect Aspect ratio. typically viewport width/height
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @returns {mat4} out
     */
    export function perspective(out: mat4type, fovy: number, aspect: number, near: number, far: number): mat4type;
    /**
     * Generates a perspective projection matrix with the given field of view.
     * This is primarily useful for generating projection matrices to be used
     * with the still experiemental WebVR API.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @returns {mat4} out
     */
    export function perspectiveFromFieldOfView(out: mat4type, fov: {
        upDegrees: number;
        downDegrees: number;
        leftDegrees: number;
        rightDegrees: number;
    }, near: number, far: number): mat4type;
    /**
     * Generates a orthogonal projection matrix with the given bounds
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {number} left Left bound of the frustum
     * @param {number} right Right bound of the frustum
     * @param {number} bottom Bottom bound of the frustum
     * @param {number} top Top bound of the frustum
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @returns {mat4} out
     */
    export function ortho(out: mat4type, left: number, right: number, bottom: number, top: number, near: number, far: number): mat4type;
    /**
     * Generates a look-at matrix with the given eye position, focal point, and up axis
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {vec3} eye Position of the viewer
     * @param {vec3} center Point the viewer is looking at
     * @param {vec3} up vec3 pointing up
     * @returns {mat4} out
     */
    export function lookAt(out: mat4type, eye: vec3type, center: vec3type, up: vec3type): mat4type;
    /**
     * Returns a string representation of a mat4
     *
     * @param {mat4} a matrix to represent as a string
     * @returns {String} string representation of the matrix
     */
    export function str(a: mat4type): string;
    /**
     * Returns Frobenius norm of a mat4
     *
     * @param {mat4} a the matrix to calculate Frobenius norm of
     * @returns {Number} Frobenius norm
     */
    export function frob(a: mat4type): number;
    /**
     * Adds two mat4's
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the first operand
     * @param {mat4} b the second operand
     * @returns {mat4} out
     */
    export function add(out: mat4type, a: mat4type, b: mat4type): mat4type;
    /**
     * Subtracts matrix b from matrix a
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the first operand
     * @param {mat4} b the second operand
     * @returns {mat4} out
     */
    export function subtract(out: mat4type, a: mat4type, b: mat4type): mat4type;
    /**
     * Alias for {@link mat4.subtract}
     * @function
     */
    /**
     * Multiply each element of the matrix by a scalar.
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the matrix to scale
     * @param {Number} b amount to scale the matrix's elements by
     * @returns {mat4} out
     */
    export function multiplyScalar(out: mat4type, a: mat4type, b: number): mat4type;
    /**
     * Adds two mat4's after multiplying each element of the second operand by a scalar value.
     *
     * @param {mat4} out the receiving vector
     * @param {mat4} a the first operand
     * @param {mat4} b the second operand
     * @param {Number} s the amount to scale b's elements by before adding
     * @returns {mat4} out
     */
    export function multiplyScalarAndAdd(out: mat4type, a: mat4type, b: mat4type, s: number): mat4type;
    /**
     * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
     *
     * @param {mat4} a The first matrix.
     * @param {mat4} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    export function exactEquals(a: mat4type, b: mat4type): boolean;
    /**
     * Returns whether or not the matrices have approximately the same elements in the same position.
     *
     * @param {mat4} a The first matrix.
     * @param {mat4} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    export function equals(a: mat4type, b: mat4type): boolean;
}

export  type mat4type = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] | Float32Array;

export  namespace Math2D {
    /**
     * Alternative 2D box object with less memory impact (four numbers instead of two min/max
     * objects with two numbers each). Should be faster.
     */
    export class Box {
        x: number;
        y: number;
        w: number;
        h: number;
        /**
         * Alternative 2D box object with less memory impact (four numbers instead of two min/max
         * objects with two numbers each). Should be faster.
         *
         * @param x - New X value.
         * @param y - New y value.
         * @param w - New w value.
         * @param h - New h value.
         */
        constructor(x?: number, y?: number, w?: number, h?: number);
        /**
         * Set new values to all properties of the box.
         *
         * @param x - New X value.
         * @param y - New y value.
         * @param w - New w value.
         * @param h - New h value.
         */
        set(x: number, y: number, w: number, h: number): void;
        /**
         * Test box for inclusion of point.
         *
         * @param x - X coordinate of point.
         * @param y - Y coordinate of point.
         */
        contains(x: number, y: number): boolean;
        /**
         * Test box for inclusion of another box.
         *
         * @param other - Box 2 to test for inclusion.
         */
        containsBox(other: Box): boolean;
        /**
         * Test two boxes for intersection.
         *
         * @param other - Box 2 to test for intersection.
         */
        intersects(other: Box): boolean;
    }
    /**
     * Box to store UV coordinates.
     */
    export interface UvBox {
        s0: number;
        t0: number;
        s1: number;
        t1: number;
    }
    /**
     * Compute squared distance between two 2D points `a` and `b`.
     *
     * @param ax - Point a.x
     * @param ay - Point a.y
     * @param bx - Point b.x
     * @param by - Point b.y
     * @returns Squared distance between the two points
     */
    export function distSquared(ax: number, ay: number, bx: number, by: number): number;
    /**
     * Compute distance between two 2D points `a` and `b`.
     *
     * @param ax - Point a.x
     * @param ay - Point a.y
     * @param bx - Point b.x
     * @param by - Point b.y
     * @returns {number} between the two points
     * @param az
     * @param bz
     */
    export function dist(ax: number, ay: number, bx: number, by: number, az?: number, bz?: number): number;
    /**
     * 求线的距离
     * @param pts
     * @return {number}
     */
    export function lineDist(pts: GeoPointLike[]): number;
    /**
     * Computes the squared length of a line.
     *
     * @param line - An array of that forms a line via [x,y,z,x,y,z,...] tuples.
     */
    export function computeSquaredLineLength(line: number[]): number;
    /**
     * Compute squared distance between a 2D point and a 2D line segment.
     *
     * @param px - Test point X
     * @param py - Test point y
     * @param l0x - Line segment start X
     * @param l0y - Line segment start Y
     * @param l1x - Line segment end X
     * @param l1y - Line segment end Y
     * @returns Squared distance between point and line segment
     */
    export function distToSegmentSquared(px: number, py: number, l0x: number, l0y: number, l1x: number, l1y: number): number;
    /**
     * Finds the intersections of a line and a circle.
     *
     * @param xLine1 - abscissa of first line point.
     * @param yLine1 - ordinate of second line point.
     * @param xLine2 - abscissa of second line point.
     * @param yLine2 - ordinate of second line point.
     * @param radius - circle radius.
     * @param xCenter - abscissa of circle center.
     * @param yCenter - ordinate of circle center.
     * @returns coordinates of the intersections (1 if the line is tangent to the circle, 2
     * if it's secant) or undefined if there's no intersection.
     */
    export function intersectLineAndCircle(xLine1: number, yLine1: number, xLine2: number, yLine2: number, radius: number, xCenter?: number, yCenter?: number): {
        x1: number;
        y1: number;
        x2?: number;
        y2?: number;
    } | undefined;
    /**
     * Computes the intersection point between two lines.
     *
     * @remarks
     * This functions computes the
     * {@link https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
     *    | line-line intersection} of two lines given two points on each line.
     *
     * @param x1 - x coordinate of the first point of the first line.
     * @param y1 - y coordinate of the first point of the first line.
     * @param x2 - x coordinate of the second point of the first line.
     * @param y2 - y coordinate of the second point of the first line.
     * @param x3 - x coordinate of the first point of the second line.
     * @param y3 - y coordinate of the first point of the second line.
     * @param x4 - x coordinate of the second point of the second line.
     * @param y4 - y coordinate of the second point of the second line.
     * @param result - The resulting point.
     */
    export function intersectLines(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, result?: Vec2Like): Vec2Like | undefined;
}

export  namespace MathUtils {
    /**
     * Ensures that input value fits in a given range.
     *
     * @param value - The value to be clamped.
     * @param min - Minimum value.
     * @param max - Maximum value.
     *
     * @returns Clamped value.
     */
    export function clamp(value: number, min: number, max: number): number;
    /**
     * constrain n to the given range, excluding the minimum, via modular arithmetic
     *
     * @param n value
     * @param min the minimum value to be returned, (isMin is false, exclusive, is true inclusive)
     * @param max the maximum value to be returned, (isMin is false, inclusive, is true exclusive)
     * @returns {number} number
     * @param isMin
     */
    export function wrap(n: number, min: number, max: number, isMin?: boolean): number;
    /**
     * Returns a smooth interpolation between the values edge0 and edge1 based on the interpolation
     * factor x. `0 <= x <= 1`.
     * @see https://en.wikipedia.org/wiki/Smoothstep
     *
     * @param edge0 -
     * @param edge1 -
     * @param x -
     */
    export function smoothStep(edge0: number, edge1: number, x: number): number;
    /**
     * Returns a smooth interpolation between the values edge0 and edge1 based on the interpolation
     * factor x. `0 <= x <= 1`.
     *
     * Improved version by Ken Perlin, which has zero 1st- and 2nd-order derivatives at `x = 0` and
     * `x = 1`:
     *
     * @see https://en.wikipedia.org/wiki/Smoothstep
     *
     * @param edge0 -
     * @param edge1 -
     * @param x -
     */
    export function smootherStep(edge0: number, edge1: number, x: number): number;
    /**
     * Maps a number from one range to another.
     *
     * @param val - The incoming value to be converted.
     * @param inMin - Lower bound of the value's current range.
     * @param inMax - Upper bound of the value's current range.
     * @param outMin - Lower bound of the value's target range.
     * @param outMax - Upper bound of the value's target range.
     */
    export function map(val: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
    /**
     * Returns the smaller of the two given numbers. Both numbers may be undefined, in which case
     * the result is undefined. If only one of the numbers is undefined, the other number is
     * returned.
     *
     * @param a - First number.
     * @param b - Second number.
     */
    export function min2(a: number | undefined, b: number | undefined): number | undefined;
    /**
     * 线性插值
     * @param v1
     * @param v2
     * @param value
     * @return {number}
     */
    export function lerp(v1: number, v2: number, value: number): number;
    /**
     * Returns the larger of the two given numbers. Both numbers may be undefined, in which case
     * the result is undefined. If only one of the numbers is undefined, the other number is
     * returned.
     *
     * @param a - First number.
     * @param b - Second number.
     */
    export function max2(a: number | undefined, b: number | undefined): number | undefined;
    /**
     * Checks if the value of a given number is inside an upper or lower bound. The bounds may be
     * undefined, in which case their value is ignored.
     *
     * @param value - Value to check.
     * @param lowerBound - The lower bound to check the value against.
     * @param upperBound - The upper bound to check the value against.
     *
     * @returns `true` if value is inside the bounds or if the bounds are `undefined`, `false`
     *          otherwise.
     */
    export function isClamped(value: number, lowerBound: number | undefined, upperBound: number | undefined): boolean;
    /**
     * Smoothly interpolates between two values using cubic formula
     *
     * @param startValue -
     * @param endValue -
     * @param time -
     * @returns Result of the interpolation within the range of `[startValue, endValue]`
     */
    export function easeInOutCubic(startValue: number, endValue: number, time: number): number;
    /**
     * 判断两个数是否相等
     * @param dotErr 允许误差的小数点后几位，默认8位
     * @return {boolean}
     * @param num1
     * @param num2
     */
    export function equals(num1: number, num2: number, dotErr?: number): boolean;
}

/**
 * 求不同级级别下，每米表示多少像素
 * @param zoomLevel 级别从0表示
 * @param latitude 纬度
 * @return {number}
 */
export  function metersPerPixel(zoomLevel: number, latitude?: number): number;

export  const METHODS: Methods;

export  interface Methods {
    GET: "GET";
    POST: "POST";
    PUT: "PUT";
    DELETE: "DELETE";
    PATCH: "PATCH";
    OPTIONS: "OPTIONS";
    HEAD: "HEAD";
}

export  class MiniMapControl {
    private _ticking;
    private _lastMouseMoveEvent;
    private _parentMap;
    private _isDragging;
    private _isCursorOverFeature;
    private _previousPoint;
    private _currentPoint;
    private _trackingRectCoordinates;
    private options;
    private _container;
    private _miniMap;
    private _trackingRect;
    constructor(options: MiniMapControlOption);
    onAdd(parentMap: Map): HTMLElement;
    _updateMapExtent(data: any): void;
    onRemove(): void;
    getMap(): Map;
    getDefaultPosition(): string;
    _load(): void;
    _mouseDown(e: any): void;
    _mouseMove(e: any): void;
    _mouseUp(): void;
    _moveTrackingRect(offset: any): any;
    _setTrackingRectBounds(bounds: any): void;
    _convertBoundsToPoints(bounds: any): void;
    _update(e: any): void;
    _zoomAdjust(): void;
    _createContainer(parentMap: Map): HTMLDivElement;
    _preventDefault(e: any): void;
}

export  interface MiniMapControlOption {
    id?: string;
    width?: string;
    height?: string;
    style?: Style | string;
    center?: [number, number];
    zoom?: number;
    zoomAdjust?: null;
    lineColor?: string;
    lineWidth?: number;
    lineOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    dragPan?: boolean;
    scrollZoom?: boolean;
    boxZoom?: boolean;
    dragRotate?: boolean;
    keyboard?: boolean;
    doubleClickZoom?: boolean;
    touchZoomRotate?: boolean;
    maxBounds?: LngLatBounds;
    containerStyle?: Partial<CSSStyleDeclaration>;
}

export  const mirrorEasing: EasingModifier;

 type Mix<T> = (v: number) => T;

export  const mix: (from: number, to: number, progress: number) => number;

export  const mixColor: (from: any | string, to: any | string) => (v: number) => any;

 type MixComplex = (p: number) => string;

export  const mixComplex: (origin: string, target: string) => MixComplex;

 type MixEasing = Easing | Easing[];

 type MixerFactory<T> = (from: T, to: T) => Mix<T>;

export  class MousePositionControl {
    private readonly digits;
    private readonly trackCenter;
    private readonly labelFormat;
    private coord;
    private readonly showLatLng;
    private readonly showZoom;
    private readonly showBearing;
    private readonly showPitch;
    private container;
    private panel;
    private map;
    private prj;
    private readonly style;
    constructor(options?: MousePositionControlOption);
    insertControl(): void;
    defaultLabelFormat(lng: number, lat: number, x: number, y: number): string;
    onMouseMove(evt?: any): void;
    onAdd(map: Map): HTMLElement;
    onRemove(): void;
    getDefaultPosition(): string;
}

export  interface MousePositionControlOption {
    digits?: number;
    trackCenter?: boolean;
    labelFormat?: (lng: number, lat: number, x: number, y: number, map?: Map) => string;
    projection?: Projection | undefined;
    style?: {
        border: string;
        backgroundColor: string;
    };
    showLatLng?: boolean;
    showZoom?: boolean;
    showBearing?: boolean;
    showPitch?: boolean;
}

 enum MTextAttachmentPoint {
    kTopLeft = 1,
    kTopCenter = 2,
    kTopRight = 3,
    kMiddleLeft = 4,
    kMiddleCenter = 5,
    kMiddleRight = 6,
    kBottomLeft = 7,
    kBottomCenter = 8,
    kBottomRight = 9,
    kBaseLeft = 10,
    kBaseCenter = 11,
    kBaseRight = 12,
    kBaseAlign = 13,
    kBottomAlign = 14,
    kMiddleAlign = 15,
    kTopAlign = 16,
    kBaseFit = 17,
    kBottomFit = 18,
    kMiddleFit = 19,
    kTopFit = 20,
    kBaseMid = 21,
    kBottomMid = 22,
    kMiddleMid = 23,
    kTopMid = 24
}

/**
 * 多条线之间根据交点相互分开,返回相交后的所有线段，请确保每条线段不要自相交
 * @param lines
 * @param dotErr 允许误差的小数点后几位，默认6位
 */
export  function multiLineSplit(lines: GeoPoint[][], dotErr?: number): GeoPoint[][];

/**
 * MultiLineString Geometry Object
 *
 * https://tools.ietf.org/html/rfc7946#section-3.1.5
 */
 interface MultiLineString extends GeometryObject {
    type: "MultiLineString";
    coordinates: Position[][];
}

/**
 * MultiPoint Geometry Object
 *
 * https://tools.ietf.org/html/rfc7946#section-3.1.3
 */
 interface MultiPoint extends GeometryObject {
    type: "MultiPoint";
    coordinates: Position[];
}

/**
 * MultiPolygon Geometry Object
 *
 * https://tools.ietf.org/html/rfc7946#section-3.1.7
 */
 interface MultiPolygon extends GeometryObject {
    type: "MultiPolygon";
    coordinates: Position[][][];
}

 type NodeId = string;

export  type OffHandler = () => void;

export  function offsetPointLine(points: GeoPoint[], distance: number): any[];

export  function offsetPoints(pts: GeoPointLike[], options: {
    smoothFactor?: number;
    offset: number;
}): any[];

/**
 * 打开地图的深色背景样式，值为 {backcolor: 0}
 */
export  function openMapDarkStyle(): IMapStyleParam;

/**
 * 打开地图的浅色色背景样式，值为 {backcolor: 0xFFFFFF}
 */
export  function openMapLightStyle(): IMapStyleParam;

export  class OverlayLayerBase {
    sourceId?: string;
    layerId?: string;
    _map?: Map;
    constructor();
    addTo(map: Map, beforeId?: string): void;
    /**
     * 获取数据源ID
     * @return {string | undefined}
     */
    getSourceId(): string | undefined;
    /**
     * 获取图层ID
     * @return {string | undefined}
     */
    getLayerId(): string | undefined;
    /**
     * 获取数据源的数据
     * @return {GeoJsonGeomertry | undefined}
     */
    getData(): GeoJsonGeomertry | undefined;
    remove(): void;
    /** 每当鼠标悬停在这些图层上时，将地图的光标设置为“指针”。
     @returns A function to remove the handler.
     * @param layerOrLayers
     */
    hoverPointer(): void;
    /**
     每当将鼠标悬停在这些图层中的某个特征上时，更新连接源 [s] 中特征的特征状态。
     * @param enterCb
     * @param leaveCb
     */
    hoverFeatureState(enterCb?: (arg0: {}) => void, leaveCb?: (arg0: {}) => void): void;
    /** 将鼠标悬停在这些图层中的某个要素上时，会显示一个弹出窗口。
     @param htmlFunc Function that receives feature and popup, returns HTML.
     @param {Object<PopupOptions>} popupOptions Options passed to `Popup()` to customise popup.
     @example hoverPopup(f => `<h3>${f.properties.Name}</h3> ${f.properties.Description}`, { anchor: 'left' });
     */
    hoverPopup(htmlFunc: any, popupOptions?: PopupOptions): any;
    /** 每当单击这些图层中的要素时都会显示一个弹出窗口。
     @param htmlFunc Function that receives feature and popup, returns HTML.
     @param {Object<PopupOptions>} popupOptions Options passed to `Popup()` to customise popup.

     @returns A function that removes the handler.
     @example clickPopup(f => `<h3>${f.properties.Name}</h3> ${f.properties.Description}`, { maxWidth: 500 });

     */
    clickPopup(htmlFunc: (arg0: {}) => void, popupOptions?: PopupOptions): any;
    /** 每当单击这些图层中的要素时都会触发回调。
     @param {function} cb Callback that receives event with .features property
     @returns A function that removes the handler.
     */
    clickLayer(cb: any): any;
    /** 当鼠标悬停在这些图层中的要素上时触发回调。
     @returns A function to remove the handler.
     */
    hoverLayer(cb: any): any;
    /**
     * 使给定的图层可见。
     * @param layer
     */
    show(): void;
    /**
     * 使给定的图层不可见。
     * @param layer
     */
    hide(): void;
    /** 根据参数使给定的图层隐藏或可见。
     @param {boolean} state True for visible, false for hidden.
     */
    toggle(state: boolean): boolean;
    /** 在一个或多个图层上设置绘制或布局属性。
     @example setProperty('fillOpacity', 0.5)
     */
    setProperty(prop: string | object, value?: any): void;
    /** 根据样式规范，获取给定图层 ID 的图层定义。
     */
    getLayerStyle(): LayerSpecification;
    /**
     * 设置图层样式
     * @param layer
     * @param style
     */
    setLayerStyle(style: any): void;
    /** 替换一个图层的过滤器。
     @param {Array} filter New filter to set.
     @example setFilter(['==','level','0']]);
     */
    setFilter(filter: FilterSpecification): void;
}

export  interface OverlayLayerBaseOptions {
    sourceId?: string;
    sourceLayer?: string;
    layerId?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: any;
    visibility?: "visible" | "none";
    isHoverPointer?: boolean;
    isHoverFeatureState?: boolean;
}

export  interface PhysicsSpringOptions {
    velocity?: number;
    stiffness?: number;
    damping?: number;
    mass?: number;
}

/**
 * Pick `props` from `object.
 *
 * Runtime version of `Pick<T,K>`.
 */
export  function pick<T extends object, K extends keyof T>(object: T, props: K[]): Pick<T, K>;

export  const pipe: (...transformers: Function[]) => Function;

/**
 * 不同级别下根据米数来求像素值
 * @param meters 米
 * @param zoomLevel 级别从0表示
 * @param latitude 纬度
 * @return {number}
 */
export  function pixelValue(meters: number, zoomLevel: number, latitude?: number): number;

export  interface PlaybackControls {
    stop: () => void;
}

/**
 * Playback options common to all animations.
 */
export  interface PlaybackOptions<V> {
    /**
     * Whether to autoplay the animation when animate is called. If
     * set to false, the animation must be started manually via the returned
     * play method.
     */
    autoplay?: boolean;
    driver?: Driver;
    elapsed?: number;
    from?: V;
    repeat?: number;
    repeatType?: "loop" | "reverse" | "mirror";
    repeatDelay?: number;
    type?: "spring" | "decay" | "keyframes";
    onUpdate?: (latest: V) => void;
    onPlay?: () => void;
    onComplete?: () => void;
    onRepeat?: () => void;
    onStop?: () => void;
}

 type Point23D = Point2D | Point3D;

 interface Point2D {
    x: number;
    y: number;
}

 type Point3D = Point2D & {
    z: number;
};

export  const pointFromVector: (origin: Point2D, angle: number, distance: number) => {
    x: number;
    y: number;
};

export  interface PointGeoJsonInput {
    point: GeoPointLike;
    properties?: object;
}

/**
 * 点到线段的距离
 * @param p
 * @param p1
 * @param p2
 * @return {number}
 */
export  function pointToSegmentDistance(p: GeoPoint, p1: GeoPoint, p2: GeoPoint): number;

/**
 * 2d折线类型接口
 */
 enum Poly2dType {
    k2dSimplePoly = 0,
    k2dFitCurvePoly = 1,
    k2dQuadSplinePoly = 2,
    k2dCubicSplinePoly = 3
}

/**
 * 3d折线类型接口
 */
 enum Poly3dType {
    k3dSimplePoly = 0,
    k3dQuadSplinePoly = 1,
    k3dCubicSplinePoly = 2
}

/**
 * 创建多边形.
 *
 **/
export  class Polygon extends OverlayLayerBase {
    options: PolygonOptions;
    constructor(options: PolygonOptions);
    addTo(map: Map, beforeId?: string): void;
    /** 替换 GeoJSON 图层的当前数据。
     @param {GeoJSON} [data] GeoJSON object to set. If not provided, defaults to an empty FeatureCollection.
     */
    setData(data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any): void;
    /** 为一层或多层设置`fill-sort-key`布局属性。 */
    setFillSortKey(value: DataDrivenPropertyValueSpecification<number>): this;
    /** 为一个或多个图层设置`fill-antialias` 绘制属性。 */
    setFillAntialias(value: PropertyValueSpecificationEx<boolean>): this;
    /** 为一个或多个图层设置`fill-opacity` 绘画属性。 */
    setFillOpacity(value: DataDrivenPropertyValueSpecification<number>): this;
    /** 为一个或多个图层设置`fill-color` 绘画属性。 */
    setFillColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    /** 为一个或多个图层设置`fill-outline-color` 绘画属性。*/
    setFillOutlineColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    /** 为一个或多个图层设置`fill-translate` 绘制属性。 */
    setFillTranslate(value: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>): this;
    /** 为一个或多个图层设置`fill-translate-anchor` 绘制属性。 */
    setFillTranslateAnchor(value: PropertyValueSpecificationEx<"map" | "viewport">): this;
    /** 为一个或多个图层设置`fill-pattern` 绘制属性。 */
    setFillPattern(value: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>): this;
    /** 获取图层的`fill-sort-key` 布局属性. */
    getFillSortKey(): DataDrivenPropertyValueSpecification<number>;
    /** 获取图层的“填充抗锯齿”绘制属性。 */
    getFillAntialias(): PropertyValueSpecificationEx<boolean>;
    /** 获取图层的 `fill-opacity` 绘制属性。 */
    getFillOpacity(): DataDrivenPropertyValueSpecification<number>;
    /** 获取图层的 `fill-color` 绘制属性。 */
    getFillColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    /** 获取图层的 `fill-outline-color` 绘制属性。 */
    getFillOutlineColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    /** 获取图层的 `fill-translate` 绘制属性。 */
    getFillTranslate(): PropertyValueSpecificationEx<[number, number]>;
    /** 获取图层的 `fill-translate-anchor` 绘制属性。 */
    getFillTranslateAnchor(): PropertyValueSpecificationEx<"map" | "viewport">;
    /** 获取图层的`fill-pattern` 绘制属性。 */
    getFillPattern(): DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
}

/**
 * Polygon Geometry Object
 *
 * https://tools.ietf.org/html/rfc7946#section-3.1.6
 */
 interface Polygon_2 extends GeometryObject {
    type: "Polygon";
    coordinates: Position[][];
}

/**
 * 根据 [x,y] 坐标列表计算多边形的质心。
 * @return {GeoPoint}
 * @param vertices 顶点坐标
 */
export  function polygonCentroid(vertices: GeoPoint[]): GeoPoint;

/**
 * 根据格林公式判断多边形是否为顺时针
 *
 * @returns {boolean} false:逆时针
 * @param points
 */
export  function polygonIsClockwise(points: GeoPoint[]): boolean;

export  interface PolygonOptions extends OverlayLayerBaseOptions {
    data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any;
    fillSortKey?: DataDrivenPropertyValueSpecification<number>;
    fillAntialias?: PropertyValueSpecificationEx<boolean>;
    fillOpacity?: DataDrivenPropertyValueSpecification<number>;
    fillColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    fillOutlineColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    fillTranslate?: PropertyValueSpecificationEx<[number, number]>;
    fillTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    fillPattern?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
}

/**
 * 创建多段线.
 *
 **/
export  class Polyline extends OverlayLayerBase {
    options: PolylineOptions;
    constructor(options: PolylineOptions);
    addTo(map: Map, beforeId?: string): void;
    /** 替换 GeoJSON 图层的当前数据。
     @param {GeoJSON} [data] GeoJSON object to set. If not provided, defaults to an empty FeatureCollection.
     */
    setData(data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any): void;
    setLineCap(value: DataDrivenPropertyValueSpecification<"butt" | "round" | "square">): this;
    getLineCap(): DataDrivenPropertyValueSpecification<"butt" | "round" | "square">;
    setLineJoin(value: DataDrivenPropertyValueSpecification<"bevel" | "round" | "miter">): this;
    getLineJoin(): DataDrivenPropertyValueSpecification<"bevel" | "round" | "miter">;
    setLineMiterMimit(value: PropertyValueSpecificationEx<number>): this;
    getLineMiterMimit(): PropertyValueSpecificationEx<number>;
    setLineRoundLimit(value: PropertyValueSpecificationEx<number>): this;
    getLineRoundLimit(): PropertyValueSpecificationEx<number>;
    setLineSortKey(value: DataDrivenPropertyValueSpecification<number>): this;
    getLineSortKey(): DataDrivenPropertyValueSpecification<number>;
    setLineOpacity(value: DataDrivenPropertyValueSpecification<number>): this;
    getLineOpacity(): DataDrivenPropertyValueSpecification<number>;
    setLineColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    getLineColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    setLineTranslate(value: PropertyValueSpecificationEx<[number, number]>): this;
    getLineTranslate(): PropertyValueSpecificationEx<[number, number]>;
    setLineTranslateAnchor(value: PropertyValueSpecificationEx<"map" | "viewport">): this;
    getLineTranslateAnchor(): PropertyValueSpecificationEx<"map" | "viewport">;
    setLineWidth(value: DataDrivenPropertyValueSpecification<number>): this;
    getLineWidth(): DataDrivenPropertyValueSpecification<number>;
    setLineGapWidth(value: DataDrivenPropertyValueSpecification<number>): this;
    getLineGapWidth(): DataDrivenPropertyValueSpecification<number>;
    setLineOffset(value: DataDrivenPropertyValueSpecification<number>): this;
    getLineOffset(): DataDrivenPropertyValueSpecification<number>;
    setLineBlur(value: DataDrivenPropertyValueSpecification<number>): this;
    getLineBlur(): DataDrivenPropertyValueSpecification<number>;
    setLineDasharray(value: DataDrivenPropertyValueSpecification<number[]>): this;
    getLineDasharray(): DataDrivenPropertyValueSpecification<number[]>;
    setLinePattern(value: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>): this;
    getLinePattern(): DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    setLineGradient(value: ExpressionSpecificationEx): this;
    getLineGradient(): ExpressionSpecificationEx;
}

/**
 * 创建箭头多段线.
 *
 **/
export  class PolylineArrow {
    options: PolylineArrowOptions;
    id: string;
    animateFun: Function | null;
    animatedPointIdx: number;
    geojson: any;
    type: string;
    lineArrowImageName: string;
    borderGeoJson: any;
    lineGeojson: any;
    strokeImageName: string | undefined;
    private _layers;
    private _map;
    private readonly _timeout;
    private readonly _interval;
    private _mapStyleCursor;
    constructor(options: PolylineArrowOptions);
    init(): void;
    createGeojson(): void;
    _createLineGeojson(): void;
    _createBorderLine(): void;
    _creatDirLine(): void;
    getLength(): number;
    getBounds(): GeoBounds;
    getId(): string;
    remove(): void;
    _addStrokeImage(): void;
    setStrokeImage(strokeImage: string): void;
    addTo(map: Map, beforeId?: string): void;
    _addShowDirFun(): void;
    _addLayer(): void;
    setCursor(cursor?: string): void;
    _mouseenterCallbackFun(): void;
    _mouseleaveCallbackFun(): void;
    setPath(val: GeoPointLike[]): void;
    getPath(): any;
    /**
     * 开启动画
     * @param step 把线段分成多少段
     * @param fps 每一秒跑多少段
     * @param isLoop 是否循环
     * @param stopCallBack 结束回调
     * @param onFrameCallBack 每一帧的回调
     * @return {FrameAnimation}
     */
    animate(step?: number, fps?: number, isLoop?: boolean, stopCallBack?: (status: FrameAnimationStatus) => void, onFrameCallBack?: (status: FrameAnimationStatus, context: any) => void): FrameAnimation;
    on(type: any, listener: EventedListener): void;
    once(type: any, listener: EventedListener): void;
    off(type: any, listener: EventedListener): void;
    setOptions(options: PolylineArrowOptions): void;
    _updateLineStyle(options: any): void;
    getOptions(): PolylineArrowOptions;
    setColor(color: any): void;
    setOpacity(val: any): void;
    setWeight(val: any): void;
    setBorderColor(value: any): void;
    setBorderOpacity(val: any): void;
    setBorderWidth(weight: any): void;
    show(): void;
    hide(): void;
    addDir(): void;
    removeDir(): void;
    hideDir(): void;
    showDir(): void;
}

export  interface PolylineArrowOptions {
    minZoom?: number;
    maxZoom?: number;
    borderGapWidth?: number;
    lineGapWidth?: number;
    borderBlur?: number;
    lineBlur?: number;
    borderGradient?: string;
    lineGradient?: string;
    borderOffset?: number;
    lineOffset?: number;
    borderTranslateAnchor?: string;
    lineTranslateAnchor?: string;
    borderMiterLimit?: number;
    lineMiterLimit?: number;
    lineSortKey?: number;
    showDir?: boolean;
    lineCap?: string;
    lineColor?: string;
    lineWidth?: number;
    strokeDasharray?: number[];
    strokeImage?: string;
    lineJoin?: string;
    lineOpacity?: number;
    lineTranslate?: number[];
    showBorder?: boolean;
    borderWidth?: number;
    borderOpacity?: number;
    borderColor?: string;
    visible?: boolean;
    strokeStyle?: string;
    animated?: boolean;
    dirSize?: number;
    dirLayout?: object;
    dirIconColor?: string;
    dirSpacing?: number;
    beforeId?: string;
    cursor?: string;
    zIndex?: number;
    dirImageSrc?: string;
    dirImageWidth?: number;
    dirImageHeight?: number;
    dirImageColor?: string;
    map?: Map;
    path?: GeoPointLike[] | any;
}

/**
 * 把多段线往外扩展成多边形
 * @param pts
 * @param options
 */
export  function polylineMarginToPolygon(pts: GeoPointLike[], options: {
    smoothFactor?: number;
    offset: number;
    arcSegments?: number;
}): any;

export  interface PolylineOptions extends OverlayLayerBaseOptions {
    data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any;
    lineCap?: DataDrivenPropertyValueSpecification<"butt" | "round" | "square">;
    lineJoin?: DataDrivenPropertyValueSpecification<"bevel" | "round" | "miter">;
    lineMiterMimit?: PropertyValueSpecificationEx<number>;
    lineRoundLimit?: PropertyValueSpecificationEx<number>;
    lineSortKey?: DataDrivenPropertyValueSpecification<number>;
    lineOpacity?: DataDrivenPropertyValueSpecification<number>;
    lineColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    lineTranslate?: PropertyValueSpecificationEx<[number, number]>;
    lineTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    lineWidth?: DataDrivenPropertyValueSpecification<number>;
    lineGapWidth?: DataDrivenPropertyValueSpecification<number>;
    lineOffset?: DataDrivenPropertyValueSpecification<number>;
    lineBlur?: DataDrivenPropertyValueSpecification<number>;
    lineDasharray?: DataDrivenPropertyValueSpecification<number[]>;
    linePattern?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    lineGradient?: ExpressionSpecificationEx;
}

/**
 * @description 将折线转换为贝塞尔曲线
 * @param {CurvePoint[]} polyline 组成折线的一组点
 * @param {boolean} close    闭合曲线
 * @param {number} offsetA   光滑程度A
 * @param {number} offsetB   光滑程度B
 * @return {BezierCurve} 一组贝塞尔曲线（无效输入将返回false）
 */
export  function polylineToBezierCurve(polyline: CurvePoint[], close?: boolean, offsetA?: number, offsetB?: number): BezierCurve;

/**
 * Position
 *
 * https://tools.ietf.org/html/rfc7946#section-3.1.1
 * Array should contain between two and three elements.
 * The previous GeoJSON specification allowed more elements (e.g., which could be used to represent M values),
 * but the current specification only allows X, Y, and (optionally) Z to be defined.
 */
 type Position = [number, number] | [number, number, number];

export  const progress: (from: number, to: number, value: number) => number;

/**
 * `GeoPoint` 地理坐标.
 */
export  abstract class Projection {
    /** The equatorial semi perimeter in meters. */
    static EQUATORIAL_SEMIPERIMETER: number;
    /** The equatorial semi perimeter in meters. */
    static EARTH_BOUNDS: [number, number, number, number];
    /**
     * 经纬度转墨卡托 .
     */
    static lngLat2Mercator(input: GeoPointLike): [number, number];
    /**
     * 墨卡托转经纬度 .
     */
    static mercator2LngLat(input: GeoPointLike): [number, number];
    /**
     * 坐标转墨卡托(epsg:3857)
     * @param input 坐标点
     * @return {[number, number]}
     */
    abstract toMercator(input: GeoPointLike): [number, number];
    /**
     * 墨卡托(epsg:3857)转坐标
     * @param input 墨卡托坐标点
     * @return {[number, number]}
     */
    abstract fromMercator(input: GeoPointLike): [number, number];
    /**
     * 地图地理坐标转经纬度
     * @param input 地理坐标点
     * @return {[number, number]}
     */
    abstract toLngLat(input: GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]): LngLatLike;
    /**
     * 经纬度转地图地理坐标
     * @param input 经纬度坐标点
     * @return {GeoPoint}
     */
    abstract fromLngLat(input: GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[]): GeoJsonGeomertry | GeoPoint | GeoPointLike | GeoPointLike[];
    /**
     * 得到地图范围
     * @return {GeoBounds}
     */
    abstract getMapExtent(): GeoBounds;
    /**
     * 把距离转化为米
     * @param dist
     */
    abstract toMeter(dist: number): number;
    /**
     * 把米转化为距离
     * @param meter
     */
    abstract fromMeter(meter: number): number;
}

export  type PromoteIdSpecificationEx = Record<string, string> | string;

/**
 * Properties
 *
 * https://tools.ietf.org/html/rfc7946#section-3.2
 * A Feature object has a member with the name 'properties'.
 * The value of the properties member is an object (any JSON object or a JSON null value).
 */
 type Properties = {
    [name: string]: any;
} | null;

export  type PropertyValueSpecificationEx<T> = T | CameraFunctionSpecificationEx<T> | ExpressionSpecificationEx;

export  type PropName = string;

export  type PropValue = string | any[] | null | number | {};

export  namespace quat {
    export type valueType = quattype;
    /**
     * Creates a new identity quat
     *
     * @returns {quat} a new quaternion
     */
    export function create(): quattype;
    /**
     * Sets a quaternion to represent the shortest rotation from one
     * vector to another.
     *
     * Both vectors are assumed to be unit length.
     *
     * @param {quat} out the receiving quaternion.
     * @param {vec3} a the initial vector
     * @param {vec3} b the destination vector
     * @returns {quat} out
     */
    export function rotationTo(out: quattype, a: vec3type, b: vec3type): quattype;
    /**
     * Sets the specified quaternion with values corresponding to the given
     * axes. Each axis is a vec3 and is expected to be unit length and
     * perpendicular to all other specified axes.
     *
     * @param {vec3} view  the vector representing the viewing direction
     * @param {vec3} right the vector representing the local "right" direction
     * @param {vec3} up    the vector representing the local "up" direction
     * @returns {quat} out
     */
    export function setAxes(out: quattype, view: vec3type, right: vec3type, up: vec3type): quattype;
    /**
     * Creates a new quat initialized with values from an existing quaternion
     *
     * @param {quat} a quaternion to clone
     * @returns {quat} a new quaternion
     * @function
     */
    const clone: typeof vec4.clone;
    /**
     * Creates a new quat initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @param {Number} w W component
     * @returns {quat} a new quaternion
     * @function
     */
    const fromValues: typeof vec4.fromValues;
    /**
     * Copy the values from one quat to another
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a the source quaternion
     * @returns {quat} out
     * @function
     */
    const copy: typeof vec4.copy;
    /**
     * Set the components of a quat to the given values
     *
     * @param {quat} out the receiving quaternion
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @param {Number} w W component
     * @returns {quat} out
     * @function
     */
    const set: typeof vec4.set;
    /**
     * Set a quat to the identity quaternion
     *
     * @param {quat} out the receiving quaternion
     * @returns {quat} out
     */
    export function identity(out: quattype): quattype;
    /**
     * Sets a quat from the given angle and rotation axis,
     * then returns it.
     *
     * @param {quat} out the receiving quaternion
     * @param {vec3} axis the axis around which to rotate
     * @param {Number} rad the angle in radians
     * @returns {quat} out
     */
    export function setAxisAngle(out: quattype, axis: vec3type, rad: number): quattype;
    /**
     * Gets the rotation axis and angle for a given
     *  quaternion. If a quaternion is created with
     *  setAxisAngle, this method will return the same
     *  values as providied in the original parameter list
     *  OR functionally equivalent values.
     * Example: The quaternion formed by axis [0, 0, 1] and
     *  angle -90 is the same as the quaternion formed by
     *  [0, 0, 1] and 270. This method favors the latter.
     * @param  {vec3} outAxis  Vector receiving the axis of rotation
     * @param  {quat} q     Quaternion to be decomposed
     * @return {Number}     Angle, in radians, of the rotation
     */
    export function getAxisAngle(outAxis: vec3type, q: quattype): number;
    /**
     * Adds two quat's
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a the first operand
     * @param {quat} b the second operand
     * @returns {quat} out
     * @function
     */
    const add: typeof vec4.add;
    /**
     * Multiplies two quat's
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a the first operand
     * @param {quat} b the second operand
     * @returns {quat} out
     */
    export function multiply(out: quattype, a: quattype, b: quattype): quattype;
    /**
     * Alias for {@link quat.multiply}
     * @function
     */
    /**
     * Scales a quat by a scalar number
     *
     * @param {quat} out the receiving vector
     * @param {quat} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {quat} out
     * @function
     */
    const scale: typeof vec4.scale;
    /**
     * Rotates a quaternion by the given angle about the X axis
     *
     * @param {quat} out quat receiving operation result
     * @param {quat} a quat to rotate
     * @param {number} rad angle (in radians) to rotate
     * @returns {quat} out
     */
    export function rotateX(out: quattype, a: quattype, rad: number): quattype;
    /**
     * Rotates a quaternion by the given angle about the Y axis
     *
     * @param {quat} out quat receiving operation result
     * @param {quat} a quat to rotate
     * @param {number} rad angle (in radians) to rotate
     * @returns {quat} out
     */
    export function rotateY(out: quattype, a: quattype, rad: number): quattype;
    /**
     * Rotates a quaternion by the given angle about the Z axis
     *
     * @param {quat} out quat receiving operation result
     * @param {quat} a quat to rotate
     * @param {number} rad angle (in radians) to rotate
     * @returns {quat} out
     */
    export function rotateZ(out: quattype, a: quattype, rad: number): quattype;
    /**
     * Calculates the W component of a quat from the X, Y, and Z components.
     * Assumes that quaternion is 1 unit in length.
     * Any existing W component will be ignored.
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a quat to calculate W component of
     * @returns {quat} out
     */
    export function calculateW(out: quattype, a: quattype): quattype;
    /**
     * Calculates the dot product of two quat's
     *
     * @param {quat} a the first operand
     * @param {quat} b the second operand
     * @returns {Number} dot product of a and b
     * @function
     */
    const dot: typeof vec4.dot;
    /**
     * Performs a linear interpolation between two quat's
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a the first operand
     * @param {quat} b the second operand
     * @param {Number} t interpolation amount between the two inputs
     * @returns {quat} out
     * @function
     */
    const lerp: typeof vec4.lerp;
    /**
     * Performs a spherical linear interpolation between two quat
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a the first operand
     * @param {quat} b the second operand
     * @param {Number} t interpolation amount between the two inputs
     * @returns {quat} out
     */
    export function slerp(out: quattype, a: quattype, b: quattype, t: number): quattype;
    /**
     * Performs a spherical linear interpolation with two control points
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a the first operand
     * @param {quat} b the second operand
     * @param {quat} c the third operand
     * @param {quat} d the fourth operand
     * @param {Number} t interpolation amount
     * @returns {quat} out
     */
    export function sqlerp(out: quattype, a: quattype, b: quattype, c: quattype, d: quattype, t: number): quattype;
    /**
     * Calculates the inverse of a quat
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a quat to calculate inverse of
     * @returns {quat} out
     */
    export function invert(out: quattype, a: quattype): quattype;
    /**
     * Calculates the conjugate of a quat
     * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a quat to calculate conjugate of
     * @returns {quat} out
     */
    export function conjugate(out: quattype, a: quattype): quattype;
    /**
     * Calculates the length of a quat
     *
     * @param {quat} a vector to calculate length of
     * @returns {Number} length of a
     * @function
     */
    const length: typeof vec4.length;
    /**
     * Alias for {@link quat.length}
     * @function
     */
    /**
     * Calculates the squared length of a quat
     *
     * @param {quat} a vector to calculate squared length of
     * @returns {Number} squared length of a
     * @function
     */
    const squaredLength: typeof vec4.squaredLength;
    /**
     * Alias for {@link quat.squaredLength}
     * @function
     */
    /**
     * Normalize a quat
     *
     * @param {quat} out the receiving quaternion
     * @param {quat} a quaternion to normalize
     * @returns {quat} out
     * @function
     */
    const normalize: typeof vec4.normalize;
    /**
     * Creates a quaternion from the given 3x3 rotation matrix.
     *
     * NOTE: The resultant quaternion is not normalized, so you should be sure
     * to renormalize the quaternion yourself where necessary.
     *
     * @param {quat} out the receiving quaternion
     * @param {mat3} m rotation matrix
     * @returns {quat} out
     * @function
     */
    export function fromMat3(out: quattype, m: mat3type): quattype;
    /**
     * Returns a string representation of a quatenion
     *
     * @param {quat} a vector to represent as a string
     * @returns {String} string representation of the vector
     */
    export function str(a: quattype): string;
    /**
     * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
     *
     * @param {quat} a The first quaternion.
     * @param {quat} b The second quaternion.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    const exactEquals: typeof vec4.exactEquals;
    /**
     * Returns whether or not the quaternions have approximately the same elements in the same position.
     *
     * @param {quat} a The first vector.
     * @param {quat} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    const equals: typeof vec4.equals;
}

export  type quattype = [number, number, number, number] | Float32Array;

export  const radiansToDegrees: (radians: number) => number;

/**
 * 弧度转角度
 * @param a
 */
export  function radToDeg(a: number): number;

/**
 * 生成一个区间的随机总数
 * @param n
 * @param m
 * @return {number}
 */
export  function randInt(n: number, m: number): number;

/**
 * 生成随机颜色
 * @return {string}
 */
export  function randomColor(): string;

/**
 * 生成随机ID
 * @param length
 * @return {string}
 */
export  function RandomID(length?: number): string;

export  type RasterDEMSourceSpecification = {
    type: "raster-dem";
    url?: string;
    tiles?: Array<string>;
    bounds?: [number, number, number, number];
    minzoom?: number;
    maxzoom?: number;
    tileSize?: number;
    attribution?: string;
    encoding?: "terrarium";
    volatile?: boolean;
};

 enum RasterImageUnits {
    /** No measurement units are used. */
    kNone = 0,
    /** Millimeters are used. */
    kMillimeter = 1,
    /** Centimeters are used. */
    kCentimeter = 2,
    /** Meters are used. */
    kMeter = 3,
    /** Kilometers are used. */
    kKilometer = 4,
    /** Inches are used. */
    kInch = 5,
    /** Foots are used. */
    kFoot = 6,
    /** Yards are used. */
    kYard = 7,
    /** Miles are used. */
    kMile = 8,
    /** Microinches are used. */
    kMicroinches = 9,
    /** Mils (thousandths of an inch) are used. */
    kMils = 10,
    /** Angstroms (10^-10 of a meter or ten-billionths of a meter) are used. */
    kAngstroms = 11,
    /** Nanometers are used. */
    kNanometers = 12,
    /** Microns are used. */
    kMicrons = 13,
    /** Decimeters are used. */
    kDecimeters = 14,
    /** Dekameters (10 meters) are used. */
    kDekameters = 15,
    /** Hectometers (10^2 meters) are used. */
    kHectometers = 16,
    /** Gigameters (10^9 meters) are used. */
    kGigameters = 17,
    /** Astronominal units (149597870700 meters) are used. */
    kAstronomical = 18,
    /** Light years (9460730472580800 meters) are used. */
    kLightYears = 19,
    /** Parsecs (approx 3.261563777 light years) are used. */
    kParsecs = 20
}

export  type RasterLayerSpecification = {
    id: string;
    type: "raster";
    metadata?: unknown;
    source: string;
    "source-layer"?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    layout?: {
        visibility?: "visible" | "none";
    };
    paint?: {
        "raster-opacity"?: PropertyValueSpecificationEx<number>;
        "raster-hue-rotate"?: PropertyValueSpecificationEx<number>;
        "raster-brightness-min"?: PropertyValueSpecificationEx<number>;
        "raster-brightness-max"?: PropertyValueSpecificationEx<number>;
        "raster-saturation"?: PropertyValueSpecificationEx<number>;
        "raster-contrast"?: PropertyValueSpecificationEx<number>;
        "raster-resampling"?: PropertyValueSpecificationEx<"linear" | "nearest">;
        "raster-fade-duration"?: PropertyValueSpecificationEx<number>;
    };
};

export  type RasterLayerStyleProp = {
    metadata?: unknown;
    source?: string;
    sourceLayer?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    visibility?: "visible" | "none";
    rasterOpacity?: PropertyValueSpecificationEx<number>;
    rasterHueRotate?: PropertyValueSpecificationEx<number>;
    rasterBrightnessMin?: PropertyValueSpecificationEx<number>;
    rasterBrightnessMax?: PropertyValueSpecificationEx<number>;
    rasterSaturation?: PropertyValueSpecificationEx<number>;
    rasterContrast?: PropertyValueSpecificationEx<number>;
    rasterResampling?: PropertyValueSpecificationEx<"linear" | "nearest">;
    rasterFadeDuration?: PropertyValueSpecificationEx<number>;
};

export  type RasterSourceSpecification = {
    type: "raster";
    url?: string;
    tiles?: Array<string>;
    bounds?: [number, number, number, number];
    minzoom?: number;
    maxzoom?: number;
    tileSize?: number;
    scheme?: "xyz" | "tms";
    attribution?: string;
    volatile?: boolean;
};

export  abstract class ReglBaseLayer extends Evented implements CustomLayerInterface {
    id: string;
    type: 'custom';
    map: Map;
    regl: any;
    renderAnimation?: boolean;
    protected abstract getReglInitialization(gl: WebGLRenderingContext): any;
    protected abstract init(map: Map, gl: WebGLRenderingContext): void;
    protected abstract frame(gl: WebGLRenderingContext, matrix: Array<number>, context?: any): void;
    protected abstract remove(map: Map, gl: WebGLRenderingContext): void;
    triggerRepaint(): void;
    onAdd(map: Map, gl: WebGLRenderingContext): void;
    onRemove(map: Map, gl: WebGLRenderingContext): void;
    /**
     * NOTE: map won't call it every frame.
     *
     * @param gl
     * @param matrix
     */
    render(gl: WebGLRenderingContext, matrix: Array<number>): void;
    prerender(gl: WebGLRenderingContext, matrix: Array<number>): void;
}

export  type ResolvedImageSpecification = string;

 interface Response_2 {
    status: number;
    response: Record<string, unknown>;
    data?: string | Record<string, unknown>;
    xhr: XMLHttpRequest;
}
export { Response_2 as Response }

export  const reverseEasing: EasingModifier;

/**
 * 旋转的光环.
 */
export  class RotatingApertureMarker extends MarkerBase {
    constructor(features: FeatureCollection | {
        lngLat: LngLatLike;
        text?: string;
    }, options?: AnimateMarkerLayerOption);
    setMarkersWidth(width: number, index?: number): void;
    setMarkersColors(colors: string[], index?: number): void;
    _createMarker(): void;
    private _createMakerElement;
    private _getDotsStyleObj;
}

/**
 * 旋转的文本框.
 */
export  class RotatingTextBorderMarker extends MarkerBase {
    constructor(features: FeatureCollection | {
        lngLat: LngLatLike;
        text?: string;
    }, options?: AnimateMarkerLayerOption);
    setMarkersWidth(width: number): void;
    setMarkersHeight(height: number): void;
    setMarkersTextField(textField: string, index?: number): void;
    setMarkersTextColor(textColor: string, index?: number): void;
    setMarkersTextFontSize(textFontSize: number, index?: number): void;
    setMarkersColors(colors: string[], index?: number): void;
    _createMarker(): void;
    _setMarkerContainerProperty(properties: any, index?: number): void;
}

/**
 * L7图层，可参考https://l7.antv.vision/.
 * 返回一个场景对象
 * @param L7 L7命名空间
 * @param map
 * @param option
 * @return {(L7: any, map: Map, option?: object) => any}
 **/
export  function Scene(L7: any, map: Map, option?: object): {
    getServiceContainer(): any;
    getSize(): [number, number];
    getMinZoom(): number;
    getMaxZoom(): number;
    getType(): string;
    getMapContainer(): HTMLElement | null;
    getMapCanvasContainer(): HTMLElement;
    getMapService(): any;
    exportPng(type?: 'png' | 'jpg'): string;
    exportMap(type?: 'png' | 'jpg'): string;
    registerRenderService(render: any): void;
    setBgColor(color: string): void;
    addLayer(layer: any): void;
    getLayers(): any[];
    getLayer(id: string): any | undefined;
    getLayerByName(name: string): any | undefined;
    removeLayer(layer: any, parentLayer?: any): void;
    removeAllLayer(): void;
    render(): void;
    setEnableRender(flag: boolean): void;
    /**
     * 为 layer/point/text 支持 iconfont 模式支持
     * @param fontUnicode
     * @param name
     */
    addIconFont(name: string, fontUnicode: string): void;
    addIconFonts(options: string[][]): void;
    /**
     * 用户自定义添加第三方字体
     * @param fontFamily
     * @param fontPath
     */
    addFontFace(fontFamily: string, fontPath: string): void;
    addImage(id: string, img: any): void;
    hasImage(id: string): boolean;
    removeImage(id: string): void;
    addIconFontGlyphs(fontFamily: string, glyphs: any[]): void;
    addControl(ctr: any): void;
    removeControl(ctr: any): void;
    getControlByName(name: string): any | undefined;
    addMarker(marker: any): void;
    addMarkerLayer(layer: any): void;
    removeMarkerLayer(layer: any): void;
    removeAllMakers(): void;
    addPopup(popup: any): void;
    on(type: string, handle: (...args: any[]) => void): void;
    once(type: string, handle: (...args: any[]) => void): void;
    off(type: string, handle: (...args: any[]) => void): void;
    getZoom(): number;
    getCenter(options?: any): any;
    setCenter(center: [number, number], options?: any): void;
    getPitch(): number;
    setPitch(pitch: number): void;
    getRotation(): number;
    getBounds(): any;
    setRotation(rotation: number): void;
    zoomIn(): void;
    zoomOut(): void;
    panTo(p: any): void;
    panBy(x: number, y: number): void;
    getContainer(): HTMLElement | null;
    setZoom(zoom: number): void;
    fitBounds(bound: any, options?: unknown): void;
    setZoomAndCenter(zoom: number, center: any): void;
    setMapStyle(style: any): void;
    setMapStatus(options: Partial<any>): void;
    pixelToLngLat(pixel: any): any;
    lngLatToPixel(lnglat: any): any;
    containerToLngLat(pixel: any): any;
    lngLatToContainer(lnglat: any): any;
    destroy(): void;
    registerPostProcessingPass(constructor: new (...args: any[]) => any, name: string): void;
    enableShaderPick(): void;
    diasbleShaderPick(): void;
    getPointSizeRange(): Float32Array;
};

export  interface ScriptDefaultOptions {
    src: string;
    strategy?: string;
    injectLocation?: string;
    async?: boolean;
}

/**
 * 线段相交
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param x3
 * @param y3
 * @param x4
 * @param y4
 * @return {{result: string, status: boolean} | {result: string, status: boolean} | {x: number, y: number, status: boolean, ratio: number} | {result: string, status: boolean}}
 */
export  function segmentIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): {
    result: string;
    status: boolean;
    x?: undefined;
    y?: undefined;
    ratio?: undefined;
} | {
    status: boolean;
    x: number;
    y: number;
    ratio: number;
    result?: undefined;
};

 interface Serialized {
    nodes: Array<{
        id: NodeId;
    }>;
    links: Array<{
        source: NodeId;
        target: NodeId;
        weight: EdgeWeight;
    }>;
}

/**
 * `Service` 服务类.
 *
 */
export  class Service {
    /**
     * 服务器地址
     * @type {string}
     */
    serverUrl: string;
    /**
     * 访问凭证
     * @type {string}
     */
    accessToken: string;
    private readonly _reqImpl;
    private _cur_map_param;
    private readonly _svr_url_map;
    private readonly _svr_url_service;
    private _secretKeys?;
    private _accessKeys?;
    /**
     * 构造函数
     * @param url 服务地址
     * @param token 访问凭证
     * @param req 请求的方法实现（默认内部实现)
     */
    constructor(url: string, token?: string, req?: IRequest);
    private _url;
    /**
     * 得到服务地址
     * @param u 要拼接的地址
     * @return string
     */
    serviceUrl(u: string): string;
    /**
     * 密码转换为秘钥
     * @param pwd 密码
     */
    pwdToSecretKey(pwd: string): string;
    /**
     * 增加秘钥key
     * @param key key值
     */
    addSecretKey(key: string): Set<string>;
    /**
     * 移除秘钥key, 如果key为undefined时，则移除所有的
     * @param key key值
     */
    removeSecretKey(key: string): Set<string> | undefined;
    /**
     * 增加访问key
     * @param key key值
     */
    addAccessKey(key: string): Set<string>;
    /**
     * 移除访问key, 如果key为undefined时，则移除所有的
     * @param key key值
     */
    removeAccessKey(key: string): void;
    private _to_layer_string;
    private _addTokenHeader;
    private _get;
    private _post;
    private _del;
    /**
     * 把图层名称数组转成图层索引数组
     * @param layernames 图层名称数组
     * @param layers 图层列表
     * @return {number[]}
     */
    toLayerIndex(layernames: string[], layers: any[]): number[];
    private _waitOpenMap;
    /**
     * 设置打开地图参数
     */
    setCurrentMapParam(param: IOpenMapResponse): IOpenMapResponse | null;
    /**
     * 当前地图参数
     */
    currentMapParam(): IOpenMapResponse | null;
    /**
     * 打开图
     * @param param
     * @param isWaitFinish 是否等待打开完成
     * @return {Promise<any>}
     */
    openMap(param: IOpenMapParam, isWaitFinish?: boolean): Promise<any>;
    /**
     * 更新地图
     * @param param
     * @param isWaitFinish 是否等待打开完成
     */
    updateMap(param: IUpdateMapParam, isWaitFinish?: boolean): Promise<any>;
    /**
     * 字体地址
     * @param param
     */
    glyphsUrl(): string;
    /**
     * 服务根地址
     */
    baseUrl(): string;
    /**
     * 精灵图片名称
     * @param name 精灵名称
     */
    spriteUrl(name: string): string;
    /**
     * 设置精灵图片名称
     * @param name 精灵名称
     */
    setSprite(name: string): string;
    /**
     * 空白瓦片地址
     */
    blankTileUrl(): string;
    /**
     * 二维码图片地址
     * @param content 生成二维码的内容
     * @param size 生成二维码的大小，默认256
     */
    qrcodeUrl(content: string, size?: number): string;
    /**
     * 栅格瓦片地址
     * @param param
     */
    rasterTileUrl(param?: ITileUrlParam): string;
    /**
     * 矢量瓦片地址
     * @param param
     */
    vectorTileUrl(param?: ITileUrlParam): string;
    /**
     * 检查文件是否上传过
     * @param filemd5 文件md5值
     */
    checkFileHasUpload(filemd5: string): Promise<any>;
    /**
     * 返回上传文件的url地址
     * @return {string}
     */
    uploadUrl(): string;
    /**
     * 获取字符串的Md5值
     * @param str
     * @return {string}
     */
    strMd5(str: string): string;
    /**
     * 得到style的版本号
     */
    styleVersion(): number;
    /**
     * 获取文件的Md5值
     * @param file
     * @return {Promise<any>}
     */
    fileMd5(file: File): Promise<any>;
    /**
     * 上传地图
     * @param file
     * @return {Promise<any>}
     */
    uploadMap(file: File): Promise<any>;
    /**
     * 执行命令
     * @return {string}
     */
    execCommand(cmdname: string, param?: Record<string, any>, mapid?: string, version?: string, useGet?: boolean): Promise<any>;
    /**
     * 获取地图元数据
     * @param mapid 地图ID ，为空, 则为当前打开的图形
     * @param version 版本号，为空 则为当前打开的版本;
     */
    metadata(mapid?: string, version?: string): Promise<any>;
    /**
     * 获取所有地图信息
     * @param mapid 地图ID，为空，则获取所有的；如果不想一次性获取，可通过传入分页对象获取，如{curPage: 1, pageCount: 10}
     * @param version 版本号，为空，则获取最新的; * 则获取所有的版本
     */
    listMaps(mapid?: string | {
        curPage: number;
        pageCount: number;
    }, version?: string): Promise<any>;
    /**
     * 等待地图打开完成
     * @param mapid 地图ID
     * @param version 地图版本号
     * @param tryTime 每次尝试时间间隔(秒)
     * @param maxTryTimes 最大尝试次数
     * @return {Promise<void>}
     */
    waitMapOpenFinish(mapid: string, version: string, tryTime?: number, maxTryTimes?: number): Promise<any>;
    /**
     * 处理查询结果
     * @param param 参数
     * @param cb 结果中每个点的处理回调。如果返回空的话，则用默认处理方法
     */
    processQueryResult(param: any, cb?: (point: [number, number]) => [number, number] | null | undefined): any;
    /**
     * 处理查询结果
     * @private
     */
    private _processQueryResult;
    /**
     * 点查询实体
     * @param param 参数
     * @param cb 结果中每个点的处理回调。如果返回空的话，则用默认处理方法
     */
    pointQueryFeature(param: IPointQueryFeatures, cb?: (point: [number, number]) => [number, number] | null | undefined): Promise<any>;
    /**
     * 矩形查询实体
     * @param param 参数
     * @param cb 结果中每个点的处理回调。如果返回空的话，则用默认处理方法
     */
    rectQueryFeature(param: IRectQueryFeatures, cb?: (point: [number, number]) => [number, number] | null | undefined): Promise<any>;
    /**
     * 表达式查询实体
     * @param param 参数
     * @param cb 结果中每个点的处理回调。如果返回空的话，则用默认处理方法
     */
    exprQueryFeature(param: IExprQueryFeatures, cb?: (point: [number, number]) => [number, number] | null | undefined): Promise<any>;
    /**
     * 条件查询实体
     * @param param 参数
     * @param cb 结果中每个点的处理回调。如果返回空的话，则用默认处理方法
     */
    conditionQueryFeature(param: IConditionQueryFeatures, cb?: (point: [number, number]) => [number, number] | null | undefined): Promise<any>;
    /**
     * 得到地图图层集合，调用前请确保地图已打开，否则会抛异常
     */
    getMapLayers(): IMapLayer[];
    /**
     * 切换图层
     * @param visibleLayers 让可见的图层列表数组
     * @return {Promise<void>}
     */
    cmdSwitchLayers(visibleLayers: string[]): Promise<any>;
    /**
     * 更新样式
     * @param param 样式参数
     * @return {Promise<any>}
     *
     *
     * Example:
     * ```typescript
     * const res = svc.cmdUpdateStyle({
     *     name: "style1",
     *     layeron: [0,1,2,4,5,6,7,8,9],
     *     layeroff: "",
     *     clipbounds: "",
     *     backcolor: 0,
     *     lineweight:[1,1,0]
     *     expression: "gOutColorRed := gInColorGreen;gOutColorGreen := gInColorBlue;gOutColorBlue := gInColorRed;gOutColorAlpha := gInColorAlpha;"
     * });
     * ```
     */
    cmdUpdateStyle(param: IUpdateStyle): Promise<any>;
    /**
     * 对图层进行切片缓存
     * @param param
     * @return {Promise<any>}
     */
    cmdSliceLayer(param: ISliceLayer): Promise<any>;
    /**
     * 获取样式图层名
     * @param style 样式参数
     * @param mapid 地图ID
     * @param version 版本号，为空，则获取最新的;
     * @param isGeomLayer 几何渲染图层优先(默认true)
     * @return {Promise<any>}
     */
    createStyle(style: IMapStyleParam, mapid?: string, version?: string, isGeomLayer?: boolean): Promise<any>;
    /**
     * 获取已缓存的切片级别
     * @param param 参数
     * @return {Promise<any>}
     */
    getSliceCacheZoom(param: ISliceCacheZoom): Promise<any>;
    /**
     * 获取样式图层名
     * @param mapid 地图ID
     * @param version 版本号，为空，则获取最新的;
     * @param isGeomLayer 几何渲染图层优先(默认true)
     * @param name 有名称时，根据名称来查找;
     * @return {Promise<any>}
     */
    getStyleLayerName(mapid: string, version?: string, isGeomLayer?: boolean, name?: string): Promise<any>;
    /**
     * 获取图的缩略图
     * @param mapid
     * @param version
     * @param width
     * @param height
     */
    thumbnailUrl(mapid?: string, version?: string, width?: number, height?: number): string;
    wmsTileUrl(param: IWmsTileUrl): string;
    /**
     * 删除地图
     * @return {Promise<any>}
     * @param mapid 地图ID
     * @param version 版本号，如删除所有版本，输入"*"号
     * @param retainVersionMaxCount 删除所有版本时，保留的最新的版本总数。如总共有10个版本，retainVersionMaxCount为3时，会保存最新的3个版本，其余的都会删除
     */
    cmdDeleteMap(mapid: string, version: string, retainVersionMaxCount?: number): Promise<any>;
    /**
     * 获取地图的AccessKey，获取之前请确保已成功打开了地图
     * @param mapid 地图ID
     * @param key secretKey秘钥和超级管理员superKey
     * @return {Promise<any>}
     */
    cmdGetAccessKey(mapid: string, key: string): Promise<any>;
    /**
     * 重置地图的AccessKey，获取之前请确保已成功打开了地图
     * @param mapid 地图ID
     * @param key secretKey秘钥和超级管理员superKey
     * @return {Promise<any>}
     */
    cmdResetAccessKey(mapid: string, key: string): Promise<any>;
    /**
     * 重置地图的密码，如果之前有密码，则是修改密码。如果之前没有密码，则是把此地图设置了密码保护。如果设置密码为空，则取消对此地图的密码保护。
     * @param mapid 地图ID
     * @param key 旧的secretKey秘钥和超级管理员superKey
     * @param newKey 新的secretKey秘钥
     * @return {Promise<any>}
     */
    cmdSetMapPassword(mapid: string, key: string, newKey: string): Promise<any>;
    /**
     * 地图ID重命名
     * @return {Promise<any>}
     * @param oldMapID 旧地图ID
     * @param newMapID 新地图ID
     */
    cmdRenameMap(oldMapID: string, newMapID: string): Promise<any>;
    /**
     * 清空地图的几何和瓦片缓存数据
     * @return {Promise<any>}
     * @param mapid 地图ID
     * @param version 版本号
     */
    cmdClearMapCache(mapid: string, version: string): Promise<any>;
    /**
     * 清空地图的瓦片缓存数据
     * @return {Promise<any>}
     * @param mapid 地图ID
     * @param version 版本号
     */
    cmdClearTileCache(mapid: string, version: string): Promise<any>;
    /**
     * 删除地图样式
     * @return {Promise<any>}
     * @param param 样式接口
     */
    cmdDeleteStyle(param: IDeleteStyle): Promise<any>;
    /**
     * 删除地图缓存
     * @return {Promise<any>}
     * @param param 缓存接口
     */
    cmdDeleteCache(param: IDeleteCache): Promise<any>;
    /**
     * 获取当前运行状态
     * @return {Promise<any>}
     * @param bDetail 是否需要细节 (默认false)
     */
    cmdRunStatus(bDetail?: boolean): Promise<any>;
    /**
     * 获取服务后台常量设置
     * @return {Promise<any>}
     */
    getConstData(): Promise<any>;
    /**
     * 空白栅格style
     * @param minzoom 最小级别，缺省0
     * @param maxzoom 最大级别，缺省24
     * @param prefix 前缀，缺省rasterBlank
     */
    rasterBlankStyle(minzoom?: number, maxzoom?: number, prefix?: string): Style;
    /**
     * 获取栅格图层ID
     * @param prefix
     * @return {string}
     */
    rasterLayerId(prefix?: string): string;
    /**
     * 获取栅格源ID
     * @param prefix
     * @return {string}
     */
    rasterSourceId(prefix?: string): string;
    /**
     * 栅格style
     * @param tileUrl 栅格瓦片地址
     * @param minzoom 最小级别，缺省0
     * @param maxzoom 最大级别，缺省24
     * @param prefix 前缀，缺省raster
     */
    rasterStyle(tileUrl?: string, minzoom?: number, maxzoom?: number, prefix?: string): Style;
    /**
     * 矢量style
     * @param tileUrl 矢量瓦片地址 或者为一个Object，为Object时，设置项为参数的每个项值，做为一个参数传入
     * @param minzoom 最小级别，缺省0
     * @param maxzoom 最大级别，缺省24
     * @param prefix 前缀，缺省vector
     * @param hoverColor 高亮时颜色，缺省rgba(0,0,255,255)
     * @param hoverOpacity 高亮时透明度,缺省0.5
     * @param hoverLineWidth 高亮时线宽,缺省3
     * @param customColorCaseExpr 自定义颜色表达式，必须为数组[条件1，值，条件2，值,...]，如[['==', ['feature-state', 'status'], 'alarm'], '#ff0000', ['==', ['feature-state', 'status'], 'normal'], '#00ff00'],缺省默认
     * @param customOpacityCaseExpr 自定义透明度表达式，必须为数组,缺省默认
     * @param customLineWidthCaseExpr 自定义线宽表达式，必须为数组,缺省默认
     */
    vectorStyle(tileUrl?: string | Record<string, any>, minzoom?: number, maxzoom?: number, prefix?: string, hoverColor?: string, hoverOpacity?: number, hoverLineWidth?: number, customColorCaseExpr?: any[], customOpacityCaseExpr?: any[], customLineWidthCaseExpr?: any[]): Style;
    /**
     * 得到所有矢量字体名称
     * @return {Promise<any>}
     */
    getFontsCapacity(): Promise<{}>;
    /**
     * 清空服务器缓存数据
     * @return {Promise<any>}
     * @param prefix key前缀
     */
    clearCache(prefix?: string): Promise<{}>;
    /**
     * 获取服务器地图服务地址
     * @param tileProvider
     * @return {string}
     */
    webMapUrl(tileProvider: {
        tileCrs?: "gcj02" | "wgs84";
        tileSize?: number;
        tileRetina?: number;
        tileMaxZoom?: number;
        tileUrl: string | string[];
        tileShards?: string;
        tileToken?: string | string[];
        tileFlipY?: boolean;
        mapbounds?: string;
        fourParameterBefore?: string;
        fourParameterAfter?: string;
        srs?: string;
    }): string;
    /**
     * 组合成新地图
     * @param param 组合参数
     * @return {Promise<any>}
     */
    composeNewMap(param: IComposeNewMap | IComposeNewMap[]): Promise<any>;
    /**
     * 比较地图不同
     * @param param 组合参数
     * @return {Promise<any>}
     */
    cmdMapDiff(param: IMapDiff): Promise<any>;
    /**
     * 获取创建实体的几何数据
     * @param param 参数
     * @param cb 结果中每个点的处理回调。如果返回空的话，则用默认处理方法
     * @return {Promise<any>}
     */
    cmdCreateEntitiesGeomData(param: ICreateEntitiesGeomData, cb?: (point: [number, number]) => [number, number] | null | undefined): Promise<any>;
    /**
     * 坐标转换
     * @return {Promise<any>}
     * @param srs 源坐标系名称，如 EPSG:4326
     * @param crs 目标坐标系名称，如 EPSG:3857
     * @param points 要转换的坐标
     * @param fourParameter 四参数(x偏移,y偏移,缩放，旋转弧度)，可选，对坐标最后进行修正
     */
    cmdTransform(srs: string, crs: string, points: GeoPoint | GeoPoint[], fourParameter?: string | string[]): Promise<any>;
    /**
     * 保存用户自定义数据
     * @param key 键名(必须唯一，否则会覆盖之前的数据，同类型的key前缀尽量一样)，如果是数组的话，可以批量
     * @param value 键值
     * @param ttl 有效时间，单位秒，默认长期有效
     */
    saveCustomData(key: string | {
        key: string;
        value: any;
        ttl?: number;
    }[], value?: any, ttl?: number): Promise<any>;
    /**
     * 获取用户自定义数据
     * @param key 键名，如果是数组的话，可以查询
     */
    getCustomData(key: string | string[]): Promise<any>;
    /**
     * 通过前缀获取用户自定义数据的键值
     * @param prefix 键名前缀
     */
    getCustomDataKeysByPrefix(prefix: string): Promise<any>;
    /**
     * 删除用户自定义数据
     * @param key 键名，如果是数组的话，可以查询
     * @param isPrefix 是否删除所有前缀为key的所有键值，默认false
     */
    deleteCustomData(key: string | string[], isPrefix?: boolean): Promise<any>;
}

/**
 * 简化点坐标
 * @param points
 * @param tolerance
 * @return {GeoPoint[]}
 */
export  function simplify(points: GeoPoint[], tolerance?: number): GeoPoint[];

/**
 * 创建天空图层.
 *
 **/
export  class SkyLayer extends OverlayLayerBase {
    options: SkyLayerOptions;
    constructor(options: SkyLayerOptions);
    addTo(map: Map, beforeId?: string): void;
    setSkyType(value: PropertyValueSpecificationEx<"gradient" | "atmosphere">): this;
    getSkyType(): PropertyValueSpecificationEx<"gradient" | "atmosphere">;
    setSkyAtmosphereSun(value: PropertyValueSpecificationEx<[number, number]>): this;
    getSkyAtmosphereSun(): PropertyValueSpecificationEx<[number, number]>;
    setSkyAtmosphereSunIntensity(value: number): this;
    getSkyAtmosphereSunIntensity(): number;
    setSkyGradientCenter(value: PropertyValueSpecificationEx<[number, number]>): this;
    getSkyGradientCenter(): PropertyValueSpecificationEx<[number, number]>;
    setSkyGradientRadius(value: PropertyValueSpecificationEx<number>): this;
    getSkyGradientRadius(): PropertyValueSpecificationEx<number>;
    setSkyGradient(value: ExpressionSpecificationEx): this;
    getSkyGradient(): ExpressionSpecificationEx;
    setSkyAtmosphereHaloColor(value: ColorSpecification): this;
    getSkyAtmosphereHaloColor(): ColorSpecification;
    setSkyAtmosphereColor(value: ColorSpecification): this;
    getSkyAtmosphereColor(): ColorSpecification;
    setSkyOpacity(value: PropertyValueSpecificationEx<number>): this;
    getSkyOpacity(): PropertyValueSpecificationEx<number>;
}

export  interface SkyLayerOptions extends OverlayLayerBaseOptions {
    skyType?: PropertyValueSpecificationEx<"gradient" | "atmosphere">;
    skyAtmosphereSun?: PropertyValueSpecificationEx<[number, number]>;
    skyAtmosphereSunIntensity?: number;
    skyGradientCenter?: PropertyValueSpecificationEx<[number, number]>;
    skyGradientRadius?: PropertyValueSpecificationEx<number>;
    skyGradient?: ExpressionSpecificationEx;
    skyAtmosphereHaloColor?: ColorSpecification;
    skyAtmosphereColor?: ColorSpecification;
    skyOpacity?: PropertyValueSpecificationEx<number>;
}

export  type SkyLayerSpecification = {
    id: string;
    type: "sky";
    metadata?: unknown;
    minzoom?: number;
    maxzoom?: number;
    layout?: {
        visibility?: "visible" | "none";
    };
    paint?: {
        "sky-type"?: PropertyValueSpecificationEx<"gradient" | "atmosphere">;
        "sky-atmosphere-sun"?: PropertyValueSpecificationEx<[number, number]>;
        "sky-atmosphere-sun-intensity"?: number;
        "sky-gradient-center"?: PropertyValueSpecificationEx<[number, number]>;
        "sky-gradient-radius"?: PropertyValueSpecificationEx<number>;
        "sky-gradient"?: ExpressionSpecificationEx;
        "sky-atmosphere-halo-color"?: ColorSpecification;
        "sky-atmosphere-color"?: ColorSpecification;
        "sky-opacity"?: PropertyValueSpecificationEx<number>;
    };
};

export  const smooth: (strength?: number) => (v: number) => number;

export  const smoothFrame: (prevValue: number, nextValue: number, duration: number, smoothing?: number) => number;

export  const snap: (points: number | number[]) => (v: number) => number | undefined;

export  type SourceBoundUtils = MapGlUtils;

export  type SourceFunctionSpecification<T> = {
    type: "exponential";
    stops: Array<[number, T]>;
    property: string;
    default?: T;
} | {
    type: "interval";
    stops: Array<[number, T]>;
    property: string;
    default?: T;
} | {
    type: "categorical";
    stops: Array<[string | number | boolean, T]>;
    property: string;
    default?: T;
} | {
    type: "identity";
    property: string;
    default?: T;
};

export  type SourceOrData = SourceSpecification | string | GeoJsonGeomertry;

export  type SourceRef = LayerRef;

export  type SourceRefFunc0 = (arg0: SourceRef) => void;

export  type SourceRefFunc1<T1> = (arg0: SourceRef, arg1: T1) => void;

export  type SourceRefFunc2<T1, T2> = (arg0: SourceRef, arg1: T1, arg2: T2) => void;

export  type SourceRefFunc3<T1, T2, T3> = (arg0: SourceRef, arg1: T1, arg2: T2, arg3: T3) => void;

export  type SourceSpecification = VectorSourceSpecification | RasterSourceSpecification | RasterDEMSourceSpecification | GeoJSONSourceSpecification | VideoSourceSpecification | ImageSourceSpecification;

/**
 * This is based on the spring implementation of Wobble https://github.com/skevy/wobble
 */
export  function spring({ from, to, restSpeed, restDelta, ...options }: SpringOptions): any;

export  namespace spring {
    var needsInterpolation: (a: any, b: any) => boolean;
}

export  interface SpringOptions extends PhysicsSpringOptions {
    from?: number;
    to?: number;
    duration?: number;
    bounce?: number;
    restSpeed?: number;
    restDelta?: number;
}

export  const steps: (steps: number, direction?: Direction) => Easing;

export  type StyleSpecification = {
    version: 8;
    name?: string;
    metadata?: unknown;
    center?: Array<number>;
    zoom?: number;
    bearing?: number;
    pitch?: number;
    light?: LightSpecification;
    terrain?: TerrainSpecificationEx;
    fog?: FogSpecification;
    sources: Record<string, SourceSpecification>;
    sprite?: string;
    glyphs?: string;
    transition?: TransitionSpecification;
    layers: Array<LayerSpecification>;
};

export  interface SvgElementOptions {
    /**  元素字符串内容，地理坐标用{{x,y}}来表示，长度用{{r}}来代表 */
    html: string;
    /** 事件，在回调函数里，响应要处理的事件，每次更新图形会重新执行 */
    event?: (svgParentElement: SVGSVGElement) => {};
    /** 元素地理范围，如果不填，会根据传入的坐标自动计算，但对于一些复杂的图形，需传入， */
    bounds?: GeoBounds | [number, number, number, number];
    /**  是否不显示 */
    hidden?: boolean;
    /**  最小缩放级别 */
    minZoom?: number;
    /**  最大缩放级别 */
    maxZoom?: boolean;
    /**  id */
    id?: string | number;
}

/**
 * 在一个地理范围内创建一个随缩放而缩放的svg的覆盖物，(注：svg覆盖物性能低，不建议大量使用，同时在级别特别大时会导致失真，在倾斜角很大时会导致不可见)
 **/
export  class SvgOverlay {
    options: SvgOverlayOptions;
    divOverlay: DivOverlay;
    elements: SvgElementOptions[];
    private _map;
    private bounds;
    private svgParentElement;
    constructor(options?: SvgOverlayOptions);
    addTo(map: Map, insertId?: string | HTMLElement): void;
    remove(): void;
    /**
     * 增加svg元素
     * @param element 要增加的元素
     * @param noUpdate 不立即更新
     */
    addElement(element: SvgElementOptions | string, noUpdate?: boolean): void;
    /**
     * 增加svg元素
     * @param elements 多个元素内容
     * @param noUpdate 不立即更新
     */
    addElements(elements: SvgElementOptions[], noUpdate?: boolean): void;
    /**
     * 获取svg获取
     */
    getSvgContainer(): SVGSVGElement;
    /**
     * 获取所有的元素
     */
    getElements(): SvgElementOptions[];
    /**
     * 移动一个元素
     */
    removeElements(id: string[] | string): SvgElementOptions[];
    /**
     * 更新一个元素
     */
    updateElements(elements: SvgElementOptions[] | SvgElementOptions): SvgElementOptions[];
    /**
     * 更新
     */
    private update;
    /**
     * 圆心半径属性字符串
     */
    static attr_cx_cy_r(cx: number, cy: number, r: number): string;
    /**
     * 椭圆心半径属性字符串
     */
    static attr_cx_cy_rx_ry(cx: number, cy: number, rx: number, ry: number): string;
    /**
     * 直线坐标属性字符串
     */
    static attr_x1_y1_x2_y2(x1: number, y1: number, x2: number, y2: number): string;
    /**
     * 坐标宽高属性字符串
     */
    static attr_x_y_w_h(x: number, y: number, w: number, h: number): string;
    /**
     * 坐标属性字符串
     */
    static attr_x_y(x: number, y: number): string;
    /**
     * 字体属性字符串
     */
    static attr_fontsize(fontsize: number): string;
    /**
     * 和长度有关属性字符串
     */
    static attr_length(len: number): string;
    /**
     * 和点坐标有关属性字符串
     */
    static attr_point(point: GeoPoint, joinComma?: boolean): string;
    /**
     * 坐标序列属性字符串
     */
    static attr_points(points: GeoPoint[]): string;
    /**
     * 路径序列属性字符串
     */
    static attr_path(points: GeoPoint[]): string;
}

export  interface SvgOverlayOptions {
    /** 显示最大级别 */
    minZoom?: number;
    /** 显示最小级别 */
    maxZoom?: number;
    /** 显示最大倾斜角 */
    maxPitch?: number;
    /** 自动更新div大小，（如果需要svg放大，需要设置为true) */
    updateDivSize?: boolean;
    /** 放大div时，最大的div大小，超过了就像素放大了 */
    maxDivSize?: number;
    /** 当移动结束时不自动更新范围 */
    noUpdateBoundsWhenMoveend?: boolean;
    /** 类名 */
    divClassName?: string;
    /** svg初始化时最大像素宽,默认1000 */
    svgMaxWidth?: number;
    /** svg初始化时最大像素高,默认1000 */
    svgMaxHeight?: number;
    /** svg初始化时Offset像素距离,默认100 */
    svgOffset?: number;
}

/**
 * 创建符号图层.
 *
 **/
 class Symbol_2 extends OverlayLayerBase {
    options: SymbolOptions;
    constructor(options: SymbolOptions);
    addTo(map: Map, beforeId?: string): void;
    /** 替换 GeoJSON 图层的当前数据。
     @param {GeoJSON} [data] GeoJSON object to set. If not provided, defaults to an empty FeatureCollection.
     */
    setData(data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any): void;
    setSymbolPlacement(value: PropertyValueSpecificationEx<"point" | "line" | "line-center">): this;
    getSymbolPlacement(): PropertyValueSpecificationEx<"point" | "line" | "line-center">;
    setSymbolSpacing(value: PropertyValueSpecificationEx<number>): this;
    getSymbolSpacing(): PropertyValueSpecificationEx<number>;
    setSymbolAvoidEdges(value: PropertyValueSpecificationEx<boolean>): this;
    getSymbolAvoidEdges(): PropertyValueSpecificationEx<boolean>;
    setSymbolSortKey(value: DataDrivenPropertyValueSpecification<number>): this;
    getSymbolSortKey(): DataDrivenPropertyValueSpecification<number>;
    setSymbolZOrder(value: PropertyValueSpecificationEx<"auto" | "viewport-y" | "source">): this;
    getSymbolZOrder(): PropertyValueSpecificationEx<"auto" | "viewport-y" | "source">;
    setIconAllowOverlap(value: PropertyValueSpecificationEx<boolean>): this;
    getIconAllowOverlap(): PropertyValueSpecificationEx<boolean>;
    setIconIgnorePlacement(value: PropertyValueSpecificationEx<boolean>): this;
    getIconIgnorePlacement(): PropertyValueSpecificationEx<boolean>;
    setIconOptional(value: PropertyValueSpecificationEx<boolean>): this;
    getIconOptional(): PropertyValueSpecificationEx<boolean>;
    setIconRotationAlignment(value: PropertyValueSpecificationEx<"map" | "viewport" | "auto">): this;
    getIconRotationAlignment(): PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    setIconSize(value: DataDrivenPropertyValueSpecification<number>): this;
    getIconSize(): DataDrivenPropertyValueSpecification<number>;
    setIconTextFit(value: PropertyValueSpecificationEx<"none" | "width" | "height" | "both">): this;
    getIconTextFit(): PropertyValueSpecificationEx<"none" | "width" | "height" | "both">;
    setIconTextFitPadding(value: PropertyValueSpecificationEx<[number, number, number, number]>): this;
    getIconTextFitPadding(): PropertyValueSpecificationEx<[number, number, number, number]>;
    setIconImage(value: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>): this;
    getIconImage(): DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    setIconRotate(value: DataDrivenPropertyValueSpecification<number>): this;
    getIconRotate(): DataDrivenPropertyValueSpecification<number>;
    setIconPadding(value: PropertyValueSpecificationEx<number>): this;
    getIconPadding(): PropertyValueSpecificationEx<number>;
    setIconKeepUpright(value: PropertyValueSpecificationEx<boolean>): this;
    getIconKeepUpright(): PropertyValueSpecificationEx<boolean>;
    setIconOffset(value: DataDrivenPropertyValueSpecification<[number, number]>): this;
    getIconOffset(): DataDrivenPropertyValueSpecification<[number, number]>;
    setIconAnchor(value: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">): this;
    getIconAnchor(): DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
    setIconPitchAlignment(value: PropertyValueSpecificationEx<"map" | "viewport" | "auto">): this;
    getIconPitchAlignment(): PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    setTextPitchAlignment(value: PropertyValueSpecificationEx<"map" | "viewport" | "auto">): this;
    getTextPitchAlignment(): PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    setTextRotationAlignment(value: PropertyValueSpecificationEx<"map" | "viewport" | "auto">): this;
    getTextRotationAlignment(): PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    setTextField(value: DataDrivenPropertyValueSpecification<FormattedSpecification>): this;
    getTextField(): DataDrivenPropertyValueSpecification<FormattedSpecification>;
    setTextFont(value: DataDrivenPropertyValueSpecification<string[]>): this;
    getTextFont(): DataDrivenPropertyValueSpecification<string[]>;
    setTextSize(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextSize(): DataDrivenPropertyValueSpecification<number>;
    setTextMaxWidth(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextMaxWidth(): DataDrivenPropertyValueSpecification<number>;
    setTextLineHeight(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextLineHeight(): DataDrivenPropertyValueSpecification<number>;
    setTextLetterSpacing(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextLetterSpacing(): DataDrivenPropertyValueSpecification<number>;
    setTextJustify(value: DataDrivenPropertyValueSpecification<"auto" | "left" | "center" | "right">): this;
    getTextJustify(): DataDrivenPropertyValueSpecification<"auto" | "left" | "center" | "right">;
    setTextRadialOffset(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextRadialOffset(): DataDrivenPropertyValueSpecification<number>;
    setTextVariableAnchor(value: PropertyValueSpecificationEx<Array<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">>): this;
    getTextVariableAnchor(): PropertyValueSpecificationEx<Array<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">>;
    setTextAnchor(value: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">): this;
    getTextAnchor(): DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
    setTextMaxAngle(value: PropertyValueSpecificationEx<number>): this;
    getTextMaxAngle(): PropertyValueSpecificationEx<number>;
    setTextWritingMode(value: PropertyValueSpecificationEx<Array<"horizontal" | "vertical">>): this;
    getTextWritingMode(): PropertyValueSpecificationEx<Array<"horizontal" | "vertical">>;
    setTextRotate(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextRotate(): DataDrivenPropertyValueSpecification<number>;
    setTextPadding(value: PropertyValueSpecificationEx<number>): this;
    getTextPadding(): PropertyValueSpecificationEx<number>;
    setTextKeepUpright(value: PropertyValueSpecificationEx<boolean>): this;
    getTextKeepUpright(): PropertyValueSpecificationEx<boolean>;
    setTextTransform(value: DataDrivenPropertyValueSpecification<"none" | "uppercase" | "lowercase">): this;
    getTextTransform(): DataDrivenPropertyValueSpecification<"none" | "uppercase" | "lowercase">;
    setTextOffset(value: DataDrivenPropertyValueSpecification<[number, number]>): this;
    getTextOffset(): DataDrivenPropertyValueSpecification<[number, number]>;
    setTextAllowOverlap(value: PropertyValueSpecificationEx<boolean>): this;
    getTextAllowOverlap(): PropertyValueSpecificationEx<boolean>;
    setTextIgnorePlacement(value: PropertyValueSpecificationEx<boolean>): this;
    getTextIgnorePlacement(): PropertyValueSpecificationEx<boolean>;
    setTextOptional(value: PropertyValueSpecificationEx<boolean>): this;
    getTextOptional(): PropertyValueSpecificationEx<boolean>;
    setIconOpacity(value: DataDrivenPropertyValueSpecification<number>): this;
    getIconOpacity(): DataDrivenPropertyValueSpecification<number>;
    setIconColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    getIconColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    setIconHaloColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    getIconHaloColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    setIconHaloWidth(value: DataDrivenPropertyValueSpecification<number>): this;
    getIconHaloWidth(): DataDrivenPropertyValueSpecification<number>;
    setIconHaloBlur(value: DataDrivenPropertyValueSpecification<number>): this;
    getIconHaloBlur(): DataDrivenPropertyValueSpecification<number>;
    setIconTranslate(value: PropertyValueSpecificationEx<[number, number]>): this;
    getIconTranslate(): PropertyValueSpecificationEx<[number, number]>;
    setIconTranslateAnchor(value: PropertyValueSpecificationEx<"map" | "viewport">): this;
    getIconTranslateAnchor(): PropertyValueSpecificationEx<"map" | "viewport">;
    setTextOpacity(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextOpacity(): DataDrivenPropertyValueSpecification<number>;
    setTextColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    getTextColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    setTextHaloColor(value: DataDrivenPropertyValueSpecification<ColorSpecification>): this;
    getTextHaloColor(): DataDrivenPropertyValueSpecification<ColorSpecification>;
    setTextHaloWidth(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextHaloWidth(): DataDrivenPropertyValueSpecification<number>;
    setTextHaloBlur(value: DataDrivenPropertyValueSpecification<number>): this;
    getTextHaloBlur(): DataDrivenPropertyValueSpecification<number>;
    setTextTranslate(value: PropertyValueSpecificationEx<[number, number]>): this;
    getTextTranslate(): PropertyValueSpecificationEx<[number, number]>;
    setTextTranslateAnchor(value: PropertyValueSpecificationEx<"map" | "viewport">): this;
    getTextTranslateAnchor(): PropertyValueSpecificationEx<"map" | "viewport">;
}
export { Symbol_2 as Symbol }

export  type SymbolLayerSpecification = {
    id: string;
    type: "symbol";
    metadata?: unknown;
    source: string;
    "source-layer"?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    layout?: {
        "symbol-placement"?: PropertyValueSpecificationEx<"point" | "line" | "line-center">;
        "symbol-spacing"?: PropertyValueSpecificationEx<number>;
        "symbol-avoid-edges"?: PropertyValueSpecificationEx<boolean>;
        "symbol-sort-key"?: DataDrivenPropertyValueSpecification<number>;
        "symbol-z-order"?: PropertyValueSpecificationEx<"auto" | "viewport-y" | "source">;
        "icon-allow-overlap"?: PropertyValueSpecificationEx<boolean>;
        "icon-ignore-placement"?: PropertyValueSpecificationEx<boolean>;
        "icon-optional"?: PropertyValueSpecificationEx<boolean>;
        "icon-rotation-alignment"?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
        "icon-size"?: DataDrivenPropertyValueSpecification<number>;
        "icon-text-fit"?: PropertyValueSpecificationEx<"none" | "width" | "height" | "both">;
        "icon-text-fit-padding"?: PropertyValueSpecificationEx<[number, number, number, number]>;
        "icon-image"?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
        "icon-rotate"?: DataDrivenPropertyValueSpecification<number>;
        "icon-padding"?: PropertyValueSpecificationEx<number>;
        "icon-keep-upright"?: PropertyValueSpecificationEx<boolean>;
        "icon-offset"?: DataDrivenPropertyValueSpecification<[number, number]>;
        "icon-anchor"?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
        "icon-pitch-alignment"?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
        "text-pitch-alignment"?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
        "text-rotation-alignment"?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
        "text-field"?: DataDrivenPropertyValueSpecification<FormattedSpecification>;
        "text-font"?: DataDrivenPropertyValueSpecification<Array<string>>;
        "text-size"?: DataDrivenPropertyValueSpecification<number>;
        "text-max-width"?: DataDrivenPropertyValueSpecification<number>;
        "text-line-height"?: DataDrivenPropertyValueSpecification<number>;
        "text-letter-spacing"?: DataDrivenPropertyValueSpecification<number>;
        "text-justify"?: DataDrivenPropertyValueSpecification<"auto" | "left" | "center" | "right">;
        "text-radial-offset"?: DataDrivenPropertyValueSpecification<number>;
        "text-variable-anchor"?: PropertyValueSpecificationEx<Array<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">>;
        "text-anchor"?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
        "text-max-angle"?: PropertyValueSpecificationEx<number>;
        "text-writing-mode"?: PropertyValueSpecificationEx<Array<"horizontal" | "vertical">>;
        "text-rotate"?: DataDrivenPropertyValueSpecification<number>;
        "text-padding"?: PropertyValueSpecificationEx<number>;
        "text-keep-upright"?: PropertyValueSpecificationEx<boolean>;
        "text-transform"?: DataDrivenPropertyValueSpecification<"none" | "uppercase" | "lowercase">;
        "text-offset"?: DataDrivenPropertyValueSpecification<[number, number]>;
        "text-allow-overlap"?: PropertyValueSpecificationEx<boolean>;
        "text-ignore-placement"?: PropertyValueSpecificationEx<boolean>;
        "text-optional"?: PropertyValueSpecificationEx<boolean>;
        visibility?: "visible" | "none";
    };
    paint?: {
        "icon-opacity"?: DataDrivenPropertyValueSpecification<number>;
        "icon-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "icon-halo-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "icon-halo-width"?: DataDrivenPropertyValueSpecification<number>;
        "icon-halo-blur"?: DataDrivenPropertyValueSpecification<number>;
        "icon-translate"?: PropertyValueSpecificationEx<[number, number]>;
        "icon-translate-anchor"?: PropertyValueSpecificationEx<"map" | "viewport">;
        "text-opacity"?: DataDrivenPropertyValueSpecification<number>;
        "text-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "text-halo-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
        "text-halo-width"?: DataDrivenPropertyValueSpecification<number>;
        "text-halo-blur"?: DataDrivenPropertyValueSpecification<number>;
        "text-translate"?: PropertyValueSpecificationEx<[number, number]>;
        "text-translate-anchor"?: PropertyValueSpecificationEx<"map" | "viewport">;
    };
};

export  type SymbolLayerStyleProp = {
    metadata?: unknown;
    source?: string;
    sourceLayer?: string;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
    symbolPlacement?: PropertyValueSpecificationEx<"point" | "line" | "line-center">;
    symbolSpacing?: PropertyValueSpecificationEx<number>;
    symbolAvoidEdges?: PropertyValueSpecificationEx<boolean>;
    symbolSortKey?: DataDrivenPropertyValueSpecification<number>;
    symbolZOrder?: PropertyValueSpecificationEx<"auto" | "viewport-y" | "source">;
    iconAllowOverlap?: PropertyValueSpecificationEx<boolean>;
    iconIgnorePlacement?: PropertyValueSpecificationEx<boolean>;
    iconOptional?: PropertyValueSpecificationEx<boolean>;
    iconRotationAlignment?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    iconSize?: DataDrivenPropertyValueSpecification<number>;
    iconTextFit?: PropertyValueSpecificationEx<"none" | "width" | "height" | "both">;
    iconTextFitPadding?: PropertyValueSpecificationEx<[number, number, number, number]>;
    iconImage?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    iconRotate?: DataDrivenPropertyValueSpecification<number>;
    iconPadding?: PropertyValueSpecificationEx<number>;
    iconKeepUpright?: PropertyValueSpecificationEx<boolean>;
    iconOffset?: DataDrivenPropertyValueSpecification<[number, number]>;
    iconAnchor?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
    iconPitchAlignment?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    textPitchAlignment?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    textRotationAlignment?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    textField?: DataDrivenPropertyValueSpecification<FormattedSpecification>;
    textFont?: DataDrivenPropertyValueSpecification<Array<string>>;
    textSize?: DataDrivenPropertyValueSpecification<number>;
    textMaxWidth?: DataDrivenPropertyValueSpecification<number>;
    textLineHeight?: DataDrivenPropertyValueSpecification<number>;
    textLetterSpacing?: DataDrivenPropertyValueSpecification<number>;
    textJustify?: DataDrivenPropertyValueSpecification<"auto" | "left" | "center" | "right">;
    textRadialOffset?: DataDrivenPropertyValueSpecification<number>;
    textVariableAnchor?: PropertyValueSpecificationEx<Array<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">>;
    textAnchor?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
    textMaxAngle?: PropertyValueSpecificationEx<number>;
    textWritingMode?: PropertyValueSpecificationEx<Array<"horizontal" | "vertical">>;
    textRotate?: DataDrivenPropertyValueSpecification<number>;
    textPadding?: PropertyValueSpecificationEx<number>;
    textKeepUpright?: PropertyValueSpecificationEx<boolean>;
    textTransform?: DataDrivenPropertyValueSpecification<"none" | "uppercase" | "lowercase">;
    textOffset?: DataDrivenPropertyValueSpecification<[number, number]>;
    textAllowOverlap?: PropertyValueSpecificationEx<boolean>;
    textIgnorePlacement?: PropertyValueSpecificationEx<boolean>;
    textOptional?: PropertyValueSpecificationEx<boolean>;
    visibility?: "visible" | "none";
    iconOpacity?: DataDrivenPropertyValueSpecification<number>;
    iconColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    iconHaloColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    iconHaloWidth?: DataDrivenPropertyValueSpecification<number>;
    iconHaloBlur?: DataDrivenPropertyValueSpecification<number>;
    iconTranslate?: PropertyValueSpecificationEx<[number, number]>;
    iconTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    textOpacity?: DataDrivenPropertyValueSpecification<number>;
    textColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    textHaloColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    textHaloWidth?: DataDrivenPropertyValueSpecification<number>;
    textHaloBlur?: DataDrivenPropertyValueSpecification<number>;
    textTranslate?: PropertyValueSpecificationEx<[number, number]>;
    textTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
};

export  interface SymbolOptions extends OverlayLayerBaseOptions {
    data: PointGeoJsonInput | PointGeoJsonInput[] | GeoJsonGeomertry | GeoPointLike | any;
    symbolPlacement?: PropertyValueSpecificationEx<"point" | "line" | "line-center">;
    symbolSpacing?: PropertyValueSpecificationEx<number>;
    symbolAvoidEdges?: PropertyValueSpecificationEx<boolean>;
    symbolSortKey?: DataDrivenPropertyValueSpecification<number>;
    symbolZOrder?: PropertyValueSpecificationEx<"auto" | "viewport-y" | "source">;
    iconAllowOverlap?: PropertyValueSpecificationEx<boolean>;
    iconIgnorePlacement?: PropertyValueSpecificationEx<boolean>;
    iconOptional?: PropertyValueSpecificationEx<boolean>;
    iconRotationAlignment?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    iconSize?: DataDrivenPropertyValueSpecification<number>;
    iconTextFit?: PropertyValueSpecificationEx<"none" | "width" | "height" | "both">;
    iconTextFitPadding?: PropertyValueSpecificationEx<[number, number, number, number]>;
    iconImage?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    iconRotate?: DataDrivenPropertyValueSpecification<number>;
    iconPadding?: PropertyValueSpecificationEx<number>;
    iconKeepUpright?: PropertyValueSpecificationEx<boolean>;
    iconOffset?: DataDrivenPropertyValueSpecification<[number, number]>;
    iconAnchor?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
    iconPitchAlignment?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    textPitchAlignment?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    textRotationAlignment?: PropertyValueSpecificationEx<"map" | "viewport" | "auto">;
    textField?: DataDrivenPropertyValueSpecification<FormattedSpecification>;
    textFont?: DataDrivenPropertyValueSpecification<string[]>;
    textSize?: DataDrivenPropertyValueSpecification<number>;
    textMaxWidth?: DataDrivenPropertyValueSpecification<number>;
    textLineHeight?: DataDrivenPropertyValueSpecification<number>;
    textLetterSpacing?: DataDrivenPropertyValueSpecification<number>;
    textJustify?: DataDrivenPropertyValueSpecification<"auto" | "left" | "center" | "right">;
    textRadialOffset?: DataDrivenPropertyValueSpecification<number>;
    textVariableAnchor?: PropertyValueSpecificationEx<Array<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">>;
    textAnchor?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
    textMaxAngle?: PropertyValueSpecificationEx<number>;
    textWritingMode?: PropertyValueSpecificationEx<Array<"horizontal" | "vertical">>;
    textRotate?: DataDrivenPropertyValueSpecification<number>;
    textPadding?: PropertyValueSpecificationEx<number>;
    textKeepUpright?: PropertyValueSpecificationEx<boolean>;
    textTransform?: DataDrivenPropertyValueSpecification<"none" | "uppercase" | "lowercase">;
    textOffset?: DataDrivenPropertyValueSpecification<[number, number]>;
    textAllowOverlap?: PropertyValueSpecificationEx<boolean>;
    textIgnorePlacement?: PropertyValueSpecificationEx<boolean>;
    textOptional?: PropertyValueSpecificationEx<boolean>;
    iconOpacity?: DataDrivenPropertyValueSpecification<number>;
    iconColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    iconHaloColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    iconHaloWidth?: DataDrivenPropertyValueSpecification<number>;
    iconHaloBlur?: DataDrivenPropertyValueSpecification<number>;
    iconTranslate?: PropertyValueSpecificationEx<[number, number]>;
    iconTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
    textOpacity?: DataDrivenPropertyValueSpecification<number>;
    textColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    textHaloColor?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    textHaloWidth?: DataDrivenPropertyValueSpecification<number>;
    textHaloBlur?: DataDrivenPropertyValueSpecification<number>;
    textTranslate?: PropertyValueSpecificationEx<[number, number]>;
    textTranslateAnchor?: PropertyValueSpecificationEx<"map" | "viewport">;
}

/**
 * 同步两张地图的移动。
 *
 */
export  function syncMaps(...args: Map[]): () => void;

export  type TerrainSpecificationEx = {
    source: string;
    exaggeration?: PropertyValueSpecificationEx<number>;
};

/**
 * 创建文本组件.
 *
 * @param {Object} [options]
 * @param {object}  [options.text] 文字内容
 * @param {object}  [options.style] 文字样式
 * @param {HTMLElement} [options.element] 用作文本的 DOM 元素。
 * @param {string} [options.anchor='center'] 一个字符串，指示应该放置在最靠近坐标的标记部分。选项有“center”、“top”、“bottom”、“left”、“right”、“top-left”、“top-right”、“top-right” “左下”和“右下”.
 * @param {PointLike} [options.offset] 作为要应用的对象相对于元素中心的偏移量（以像素为单位）。负数表示向左和向上.
 * @param {string} [options.color='#3FB1CE'] 如果未提供`options.element`.
 * @param {number} [options.scale=1] 如果未提供`options.element`，则用于默认文本的比例。.
 * @param {boolean} [options.draggable=false] 一个布尔值，指示是否可以将文本拖动到地图上的新位置.
 * @param {number} [options.clickTolerance=0] 用户在单击文本期间可以移动鼠标指针以将其视为有效单击（与文本拖动相反）的最大像素数。默认是继承地图的`clickTolerance`.
 * @param {number} [options.rotation=0] 文本相对于其各自的“rotationAlignment”设置的旋转角度（以度为单位）。正值将顺时针旋转文本.
 * @param {string} [options.pitchAlignment='auto'] `map` 将 `Text` 与地图平面对齐。 `viewport` 将 `Text` 与视口平面对齐。 `auto` 自动匹配 `rotationAlignment` 的值.
 * @param {string} [options.rotationAlignment='auto'] `map` 对齐 `Text` 相对于地图的旋转，在地图旋转时保持方位。 `viewport` 对齐 `Text` 相对于视口的旋转，与地图旋转无关。 `auto` 等价于 `viewport`.
 * @example
 * // Create a new Text.
 * const text = new vjmap.Text({text: "abc“})
 *     .setLngLat([30.5, 50.5])
 *     .addTo(map);
 * @example
 * // Set text options.
 * const text = new vjmap.Text({
 *     text: "abc“,
 *     draggable: true
 * }).setLngLat([30.5, 50.5])
 *     .addTo(map);
 */
 class Text_2 extends Evented {
    private readonly _marker;
    _textContainerDom: HTMLElement;
    _style: object;
    /**
     * 构造函数
     * @param options
     */
    constructor(options?: TextOptions);
    /**
     * 将 `Text` 附加到 `Map` 对象。
     *
     * @param {Map}  map to add the text to.
     * @returns {Text} Returns itself to allow for method chaining.
     * @example
     * const text = new vjmap.Text({text: "abc"})
     *     .setLngLat([30.5, 50.5])
     *     .addTo(map); // add the text to the map
     */
    addTo(map: Map): Text_2;
    /**
     * 从地图中删除文本。
     *
     * @example
     * const text = new vjmap.Text().addTo(map);
     * text.remove();
     * @returns {Text} Returns itself to allow for method chaining.
     */
    remove(): Text_2;
    /**
     * 得到经纬度
     * @return {any}
     */
    getLngLat(): LngLatLike;
    /**
     * 设置经纬度
     * @param lnglat
     * @return {this}
     */
    setLngLat(lnglat: LngLatLike): Text_2;
    /**
     * 返回 `Text` 的 HTML 元素。
     *
     * @returns {HTMLElement} Returns the text element.
     * @example
     * const element = text.getElement();
     */
    getElement(): HTMLElement;
    /**
     * Binds a `Popup` to the `Text`
     * @param popup
     * @return {this}
     */
    setPopup(popup?: Popup): Text_2;
    /**
     * 返回绑定到 `Text` 的 `Popup` 实例。
     *
     * @returns {Popup} Returns the popup.
     */
    getPopup(): Popup;
    /**
     * 根据 `Popup` 的当前状态打开或关闭绑定到 `Text` 的 `Popup` 实例.
     *
     * @returns {Text} Returns itself to allow for method chaining.
     */
    togglePopup(): Text_2;
    /**
     * 获取文本的偏移量.
     *
     * @returns {Point} The text's screen coordinates in pixels.
     */
    getOffset(): number;
    /**
     * 设置文本的偏移量.
     *
     * @param {PointLike} offset 以像素为单位的偏移量，作为 PointLike 对象相对于元素的中心应用。负数表示向左和向上。
     * @returns {Text} Returns itself to allow for method chaining.
     */
    setOffset(offset: PointLike): Text_2;
    /**
     * 设置文本的 `draggable` 属性和功能.
     *
     * @param {boolean} [shouldBeDraggable=false] Turns drag functionality on/off.
     * @returns {Text} Returns itself to allow for method chaining.
     */
    setDraggable(shouldBeDraggable: boolean): Text_2;
    /**
     * 如果可以拖动文本，则返回 true。
     *
     * @returns {boolean} True if the text is draggable.
     */
    isDraggable(): boolean;
    /**
     * Sets the `rotation` property of the text.
     *
     * @param {number} [rotation=0] 文本相对于其各自设置的旋转角度（顺时针，以度为单位）.
     * @returns {Text} Returns itself to allow for method chaining.
     */
    setRotation(rotation: number): Text_2;
    /**
     * 返回文本的当前旋转角度（以度为单位）.
     *
     * @returns {number} The current rotation angle of the text.
     */
    getRotation(): number;
    /**
     * 设置文本的 `rotationAlignment` 属性.
     *
     * @param {string} [alignment='auto'] 设置文本的 `rotationAlignment` 属性.
     * @returns {Text} Returns itself to allow for method chaining.
     */
    setRotationAlignment(alignment: string): this;
    /**
     * 返回文本的当前 `rotationAlignment` 属性.
     *
     * @returns {string} The current rotational alignment of the text.
     */
    getRotationAlignment(): string;
    /**
     * 设置文本的 `pitchAlignment` 属性.
     *
     * @param {string} [alignment] 设置文本的 `pitchAlignment` 属性。如果alignment是'auto'，它会自动匹配'rotationAlignment'.
     * @returns {Text} Returns itself to allow for method chaining.
     */
    setPitchAlignment(alignment: string): Text_2;
    /**
     * 返回文本的当前 `pitchAlignment` 属性.
     *
     * @returns {string} The current pitch alignment of the text in degrees.
     */
    getPitchAlignment(): string;
    /**
     * 设置动画
     * @param animationType
     * MAP_ANIMATION_NONE 无动画
     * MAP_ANIMATION_BOUNCE 弹跳
     * MAP_ANIMATION_DROP 坠落
     */
    setAnimation(animationType: string): void;
    /**
     * 显示
     */
    show(): void;
    /**
     * 隐藏
     */
    hide(): void;
    /**
     * 设置光标
     * @param cur 光标名称
     */
    setCursor(cur: string): void;
    /**
     * 设置文本内容
     * @param txt
     */
    setText(txt: string): Text_2;
    /**
     * 得到文本内容
     */
    getText(): string;
    /**
     * 设置文本样式
     * @param style
     */
    setStyle(style?: object): Text_2;
    /**
     * 得到文本样式
     */
    getStyle(): object;
}
export { Text_2 as Text }

export  interface TextOptions extends MarkerOptions {
    /** 文本内容. */
    text?: string;
    /** 文本样式. */
    style?: object;
}

export  interface ThreeJsContext {
    repaint(): void;
    createSkyLayer(): void;
    createTerrainLayer(): void;
    sphere(options: any): any;
    line(options: any): any;
    label(options: any): any;
    tooltip(options: any): any;
    tube(options: any): any;
    extrusion(options: any): any;
    Object3D(options: any): any;
    projectToWorld(coords: any): any;
    unprojectFromWorld(v3: any): any;
    projectedUnitsPerMeter(lat: any): any;
    getFeatureCenter(feature: any, obj: any, level: number): any;
    getObjectHeightOnFloor(coords: any, obj: any, level: number): any;
    queryRenderedFeatures(point: any): any;
    findParent3DObject(mesh: any): any;
    setLayoutProperty(layerId: string, name: string, value: any): any;
    setLayerZoomRange(layerId: string, minZoomLayer: number, maxZoomLayer: number): any;
    setLayerHeigthProperty(layerId: string, level: number): any;
    setObjectsScale(): any;
    setStyle(styleId: string, options: any): any;
    toggleLayer(layerId: string, visible?: boolean): any;
    toggle(layerId: string, visible?: boolean): any;
    update(): any;
    add(obj: any, layerId?: string, sourceId?: string): any;
    removeByName(name: string): any;
    remove(obj: any): any;
    clear(layerId?: string, dispose?: boolean): any;
    removeLayer(layerId: string): any;
    getSunPosition(date: any, coords: any): any;
    getSunTimes(date: any, coords: any): any;
    setBuildingShadows(options: any): any;
    setSunlight(newDate: any, coords: any): any;
    getSunSky(date: any, sunPos: any): any;
    updateSunSky(sunPos: any): any;
    updateSunGround(sunPos: any): any;
    updateLightHelper(): any;
    dispose(): any;
    defaultLights(): any;
    realSunlight(helper?: boolean): any;
    setDefaultView(options: any, defOptions: any): any;
    memory(): any;
    programs(): any;
    /**
     * 地图几何坐标转threejs世界坐标.
     **/
    mapToWorld(coords: any): any;
    /**
     * threejs世界坐标地转图几何坐标.
     **/
    mapToWorldLength(coords: any): any;
    /**
     * 地图几何长度转threejs世界坐标长度.
     **/
    mapToWorldLength(len: number): number;
    /**
     * threejs世界坐标长度转地图几何长度.
     **/
    worldToMapLength(len: number): number;
    /**
     * threejs世界坐标总长度.
     **/
    getWorldSize(): number;
    /**
     * 加载材质，要使用base64图片，返回 `THREE.Texture` 对象.
     **/
    loadTexture(img: string, defaultImg?: string): any;
    /**
     * 创建一个四棱锥
     **/
    coneMesh(co: GeoPoint, opts?: {
        size?: number;
        height?: number;
        color?: string | number;
        animation?: boolean;
        animationUpDown?: boolean;
        obj3dOpts?: object;
    }): any;
    /**
     * 创建一个立体光墙
     **/
    wall(pts: GeoPoint[], opts?: {
        height?: number;
        flyline?: boolean;
        repeatX?: number;
        repeatY?: number;
        offsetX?: number;
        offsetY?: number;
        color1?: string | number;
        texture1?: string;
        color2?: string | number;
        texture2?: string;
        opacity?: number;
        obj3dOpts?: object;
    }): any;
    /**
     * 创建一个波动光圈
     **/
    wave(co: GeoPoint, opts?: {
        size?: number;
        color?: string | number;
        texture?: string;
        speed?: number;
    }): any;
    /**
     * 创建一个径向渐变球
     **/
    radialGradient(co: GeoPoint, opts?: {
        size?: number;
        color?: string | number | any;
        speed?: number;
    }): any;
    /**
     * 创建一个扫描雷达
     **/
    radar(co: GeoPoint, opts?: {
        size?: number;
        color1?: string | number;
        texture1: string;
        color2?: string | number;
        texture2: string;
        speed?: number;
    }): any;
    /**
     * 创建一个波动光圈
     **/
    waveWall(co: GeoPoint, opts?: {
        size?: number;
        height?: number;
        color?: string | number;
        texture?: string;
        speed?: number;
        opacity?: number;
    }): any;
    /**
     *  创建一条飞行线
     **/
    flyline(opts: {
        source: GeoPoint;
        target: GeoPoint;
        height?: number;
        size?: number;
        color: string | number;
        color2?: string | number;
        count?: number;
        range?: number;
        opacity?: number;
        speed?: number;
    }): any;
}

export  interface ThreeJsContextOptions {
    defaultLights?: boolean;
    realSunlight?: boolean;
    realSunlightHelper?: boolean;
    passiveRendering?: boolean;
    preserveDrawingBuffer?: boolean;
    enableSelectingFeatures?: boolean;
    enableSelectingObjects?: boolean;
    enableDraggingObjects?: boolean;
    enableRotatingObjects?: boolean;
    enableTooltips?: boolean;
    multiLayer?: boolean;
    orthographic?: boolean;
    fov?: number;
    sky?: boolean;
    terrain?: boolean;
}

/**
 * threejs图层.
 *
 **/
export  class ThreeLayer extends Evented implements CustomLayerInterface {
    id: string;
    type: "custom";
    renderingMode?: "2d" | "3d" | undefined;
    context: ThreeJsContext;
    constructor(options: ThreeLayerOptions);
    onAdd(map: any, gl: any): void;
    onRemove(): void;
    render(gl: any, matrix: any): void;
}

export  interface ThreeLayerOptions {
    id?: string;
    context: ThreeJsContext;
    onAdd?: (map: any, gl: any) => void;
    onRemove?: () => void;
    render?: (gl: any, matrix: any) => void;
}

export  const toDecimal: (num: number, precision?: number) => number;

/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */
export  function toRadian(a: number): number;

export  const transform: {
    CRSTypes: typeof CRSTypes;
    convert: typeof convert;
    EpsgCrsTypes: typeof EpsgCrsTypes;
    getEpsgParam: typeof getEpsgParam;
};

export  type TransitionSpecification = {
    duration?: number;
    delay?: number;
};

/**
 * An update function. It accepts a timestamp used to advance the animation.
 */
 type Update = (timestamp: number) => void;

export  const upperCamelCase: (s: any) => any;

/**
 * utf8转unicode
 * @param strUtf8 utf8的内容
 */
export  function utf8ToUnicode(strUtf8: string): string;

export  namespace vec2 {
    export type valueType = vec2type;
    /**
     * Creates a new, empty vec2
     *
     * @returns {vec2} a new 2D vector
     */
    export function create(): vec2type;
    /**
     * Creates a new vec2 initialized with values from an existing vector
     *
     * @param {ReadonlyVec2} a vector to clone
     * @returns {vec2} a new 2D vector
     */
    export function clone(a: vec2type): vec2type;
    /**
     * Creates a new vec2 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @returns {vec2} a new 2D vector
     */
    export function fromValues(x: number, y: number): vec2type;
    /**
     * Copy the values from one vec2 to another
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the source vector
     * @returns {vec2} out
     */
    export function copy(out: vec2type, a: vec2type): vec2type;
    /**
     * Set the components of a vec2 to the given values
     *
     * @param {vec2} out the receiving vector
     * @param {Number} x X component
     * @param {Number} y Y component
     * @returns {vec2} out
     */
    export function set(out: vec2type, x: number, y: number): vec2type;
    /**
     * Adds two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {vec2} out
     */
    export function add(out: vec2type, a: vec2type, b: vec2type): vec2type;
    /**
     * Subtracts vector b from vector a
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {vec2} out
     */
    export function subtract(out: vec2type, a: vec2type, b: vec2type): vec2type;
    /**
     * Multiplies two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {vec2} out
     */
    export function multiply(out: vec2type, a: vec2type, b: vec2type): vec2type;
    /**
     * Divides two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {vec2} out
     */
    export function divide(out: vec2type, a: vec2type, b: vec2type): vec2type;
    /**
     * Math.ceil the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a vector to ceil
     * @returns {vec2} out
     */
    export function ceil(out: vec2type, a: vec2type): vec2type;
    /**
     * Math.floor the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a vector to floor
     * @returns {vec2} out
     */
    export function floor(out: vec2type, a: vec2type): vec2type;
    /**
     * Returns the minimum of two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {vec2} out
     */
    export function min(out: vec2type, a: vec2type, b: vec2type): vec2type;
    /**
     * Returns the maximum of two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {vec2} out
     */
    export function max(out: vec2type, a: vec2type, b: vec2type): vec2type;
    /**
     * Math.round the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a vector to round
     * @returns {vec2} out
     */
    export function round(out: vec2type, a: vec2type): vec2type;
    /**
     * Scales a vec2 by a scalar number
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec2} out
     */
    export function scale(out: vec2type, a: vec2type, b: number): vec2type;
    /**
     * Adds two vec2's after scaling the second operand by a scalar value
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @param {Number} scale the amount to scale b by before adding
     * @returns {vec2} out
     */
    export function scaleAndAdd(out: vec2type, a: vec2type, b: vec2type, scale: number): vec2type;
    /**
     * Calculates the euclidian distance between two vec2's
     *
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {Number} distance between a and b
     */
    export function distance(a: vec2type, b: vec2type): number;
    /**
     * Calculates the squared euclidian distance between two vec2's
     *
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {Number} squared distance between a and b
     */
    export function squaredDistance(a: vec2type, b: vec2type): number;
    /**
     * Calculates the length of a vec2
     *
     * @param {ReadonlyVec2} a vector to calculate length of
     * @returns {Number} length of a
     */
    export function length(a: vec2type): number;
    /**
     * Calculates the squared length of a vec2
     *
     * @param {ReadonlyVec2} a vector to calculate squared length of
     * @returns {Number} squared length of a
     */
    export function squaredLength(a: vec2type): number;
    /**
     * Negates the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a vector to negate
     * @returns {vec2} out
     */
    export function negate(out: vec2type, a: vec2type): vec2type;
    /**
     * Returns the inverse of the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a vector to invert
     * @returns {vec2} out
     */
    export function inverse(out: vec2type, a: vec2type): vec2type;
    /**
     * Normalize a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a vector to normalize
     * @returns {vec2} out
     */
    export function normalize(out: vec2type, a: vec2type): vec2type;
    /**
     * Calculates the dot product of two vec2's
     *
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {Number} dot product of a and b
     */
    export function dot(a: vec2type, b: vec2type): number;
    /**
     * Computes the cross product of two vec2's
     * Note that the cross product must by definition produce a 3D vector
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @returns {vec3} out
     */
    export function cross(out: vec2type, a: vec2type, b: vec2type): vec2type;
    /**
     * Performs a linear interpolation between two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the first operand
     * @param {ReadonlyVec2} b the second operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {vec2} out
     */
    export function lerp(out: vec2type, a: vec2type, b: vec2type, t: number): vec2type;
    /**
     * Generates a random vector with the given scale
     *
     * @param {vec2} out the receiving vector
     * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
     * @returns {vec2} out
     */
    export function random(out: vec2type, scale: number): vec2type;
    /**
     * Transforms the vec2 with a mat2
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the vector to transform
     * @param {ReadonlyMat2} m matrix to transform with
     * @returns {vec2} out
     */
    export function transformMat2(out: vec2type, a: vec2type, m: vec2type): vec2type;
    /**
     * Transforms the vec2 with a mat2d
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the vector to transform
     * @param {ReadonlyMat2d} m matrix to transform with
     * @returns {vec2} out
     */
    export function transformMat2d(out: vec2type, a: vec2type, m: vec2type): vec2type;
    /**
     * Transforms the vec2 with a mat3
     * 3rd vector component is implicitly '1'
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the vector to transform
     * @param {ReadonlyMat3} m matrix to transform with
     * @returns {vec2} out
     */
    export function transformMat3(out: vec2type, a: vec2type, m: vec2type): vec2type;
    /**
     * Transforms the vec2 with a mat4
     * 3rd vector component is implicitly '0'
     * 4th vector component is implicitly '1'
     *
     * @param {vec2} out the receiving vector
     * @param {ReadonlyVec2} a the vector to transform
     * @param {ReadonlyMat4} m matrix to transform with
     * @returns {vec2} out
     */
    export function transformMat4(out: vec2type, a: vec2type, m: vec2type): vec2type;
    /**
     * Rotate a 2D vector
     * @param {vec2} out The receiving vec2
     * @param {ReadonlyVec2} a The vec2 point to rotate
     * @param {ReadonlyVec2} b The origin of the rotation
     * @param {Number} rad The angle of rotation in radians
     * @returns {vec2} out
     */
    export function rotate(out: vec2type, a: vec2type, b: vec2type, rad: number): vec2type;
    /**
     * Get the angle between two 2D vectors
     * @param {ReadonlyVec2} a The first operand
     * @param {ReadonlyVec2} b The second operand
     * @returns {Number} The angle in radians
     */
    export function angle(a: vec2type, b: vec2type): number;
    /**
     * Set the components of a vec2 to zero
     *
     * @param {vec2} out the receiving vector
     * @returns {vec2} out
     */
    export function zero(out: vec2type): vec2type;
    /**
     * Returns a string representation of a vector
     *
     * @param {ReadonlyVec2} a vector to represent as a string
     * @returns {String} string representation of the vector
     */
    export function str(a: vec2type): string;
    /**
     * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
     *
     * @param {ReadonlyVec2} a The first vector.
     * @param {ReadonlyVec2} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    export function exactEquals(a: vec2type, b: vec2type): boolean;
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     *
     * @param {ReadonlyVec2} a The first vector.
     * @param {ReadonlyVec2} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    export function equals(a: vec2type, b: vec2type): boolean;
    /**
     * Perform some operation over an array of vec2s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */
    const forEach: (a: any, stride: any, offset: any, count: any, fn: any, arg: any) => any;
}

 interface Vec2Like {
    x: number;
    y: number;
}

export  type vec2type = [number, number] | Float32Array;

export  namespace vec3 {
    export type valueType = vec3type;
    /**
     * Creates a new, empty vec3
     *
     * @returns {vec3} a new 3D vector
     */
    export function create(): vec3type;
    /**
     * Creates a new vec3 initialized with values from an existing vector
     *
     * @param {vec3} a vector to clone
     * @returns {vec3} a new 3D vector
     */
    export function clone(a: vec3type): vec3type;
    /**
     * Creates a new vec3 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @returns {vec3} a new 3D vector
     */
    export function fromValues(x: number, y: number, z: number): vec3type;
    /**
     * Copy the values from one vec3 to another
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the source vector
     * @returns {vec3} out
     */
    export function copy(out: vec3type, a: vec3type): vec3type;
    /**
     * Set the components of a vec3 to the given values
     *
     * @param {vec3} out the receiving vector
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @returns {vec3} out
     */
    export function set(out: vec3type, x: number, y: number, z: number): vec3type;
    /**
     * Adds two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    export function add(out: vec3type, a: vec3type, b: vec3type): vec3type;
    /**
     * Subtracts vector b from vector a
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    export function subtract(out: vec3type, a: vec3type, b: vec3type): vec3type;
    /**
     * Alias for {@link vec3.subtract}
     * @function
     */
    /**
     * Multiplies two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    export function multiply(out: vec3type, a: vec3type, b: vec3type): vec3type;
    /**
     * Alias for {@link vec3.multiply}
     * @function
     */
    /**
     * Divides two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    export function divide(out: vec3type, a: vec3type, b: vec3type): vec3type;
    /**
     * Alias for {@link vec3.divide}
     * @function
     */
    /**
     * Math.ceil the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to ceil
     * @returns {vec3} out
     */
    export function ceil(out: vec3type, a: vec3type): vec3type;
    /**
     * Math.floor the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to floor
     * @returns {vec3} out
     */
    export function floor(out: vec3type, a: vec3type): vec3type;
    /**
     * Returns the minimum of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    export function min(out: vec3type, a: vec3type, b: vec3type): vec3type;
    /**
     * Returns the maximum of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    export function max(out: vec3type, a: vec3type, b: vec3type): vec3type;
    /**
     * Math.round the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to round
     * @returns {vec3} out
     */
    export function round(out: vec3type, a: vec3type): vec3type;
    /**
     * Scales a vec3 by a scalar number
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec3} out
     */
    export function scale(out: vec3type, a: vec3type, b: number): vec3type;
    /**
     * Adds two vec3's after scaling the second operand by a scalar value
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @param {Number} s the amount to scale b by before adding
     * @returns {vec3} out
     */
    export function scaleAndAdd(out: vec3type, a: vec3type, b: vec3type, s: number): vec3type;
    /**
     * Calculates the euclidian distance between two vec3's
     *
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {Number} distance between a and b
     */
    export function distance(a: vec3type, b: vec3type): number;
    /**
     * Alias for {@link vec3.distance}
     * @function
     */
    /**
     * Calculates the squared euclidian distance between two vec3's
     *
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {Number} squared distance between a and b
     */
    export function squaredDistance(a: vec3type, b: vec3type): number;
    /**
     * Alias for {@link vec3.squaredDistance}
     * @function
     */
    /**
     * Calculates the length of a vec3
     *
     * @param {vec3} a vector to calculate length of
     * @returns {Number} length of a
     */
    export function length(a: vec3type): number;
    /**
     * Alias for {@link vec3.length}
     * @function
     */
    /**
     * Calculates the squared length of a vec3
     *
     * @param {vec3} a vector to calculate squared length of
     * @returns {Number} squared length of a
     */
    export function squaredLength(a: vec3type): number;
    /**
     * Alias for {@link vec3.squaredLength}
     * @function
     */
    /**
     * Negates the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to negate
     * @returns {vec3} out
     */
    export function negate(out: vec3type, a: vec3type): vec3type;
    /**
     * Returns the inverse of the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to invert
     * @returns {vec3} out
     */
    export function inverse(out: vec3type, a: vec3type): vec3type;
    /**
     * Normalize a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to normalize
     * @returns {vec3} out
     */
    export function normalize(out: vec3type, a: vec3type): vec3type;
    /**
     * Calculates the dot product of two vec3's
     *
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {Number} dot product of a and b
     */
    export function dot(a: vec3type, b: vec3type): number;
    /**
     * Computes the cross product of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    export function cross(out: vec3type, a: vec3type, b: vec3type): vec3type;
    /**
     * Performs a linear interpolation between two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @param {Number} t interpolation amount between the two inputs
     * @returns {vec3} out
     */
    export function lerp(out: vec3type, a: vec3type, b: vec3type, t: number): vec3type;
    /**
     * Performs a hermite interpolation with two control points
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @param {vec3} c the third operand
     * @param {vec3} d the fourth operand
     * @param {Number} t interpolation amount between the two inputs
     * @returns {vec3} out
     */
    export function hermite(out: vec3type, a: vec3type, b: vec3type, c: vec3type, d: vec3type, t: number): vec3type;
    /**
     * Performs a bezier interpolation with two control points
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @param {vec3} c the third operand
     * @param {vec3} d the fourth operand
     * @param {Number} t interpolation amount between the two inputs
     * @returns {vec3} out
     */
    export function bezier(out: vec3type, a: vec3type, b: vec3type, c: vec3type, d: vec3type, t: number): vec3type;
    /**
     * Generates a random vector with the given scale
     *
     * @param {vec3} out the receiving vector
     * @param {Number} [s] Length of the resulting vector. If ommitted, a unit vector will be returned
     * @returns {vec3} out
     */
    export function random(out: vec3type, s?: number): vec3type;
    /**
     * Transforms the vec3 with a mat4.
     * 4th vector component is implicitly '1'
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to transform
     * @param {mat4} m matrix to transform with
     * @returns {vec3} out
     */
    export function transformMat4(out: vec3type, a: vec3type, m: mat4type): vec3type;
    /**
     * Transforms the vec3 with a mat3.
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to transform
     * @param {mat4} m the 3x3 matrix to transform with
     * @returns {vec3} out
     */
    export function transformMat3(out: vec3type, a: vec3type, m: mat4type): vec3type;
    /**
     * Transforms the vec3 with a quat
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to transform
     * @param {quat} q quaternion to transform with
     * @returns {vec3} out
     */
    export function transformQuat(out: vec3type, a: vec3type, q: quattype): vec3type;
    /**
     * Rotate a 3D vector around the x-axis
     * @param {vec3} out The receiving vec3
     * @param {vec3} a The vec3 point to rotate
     * @param {vec3} b The origin of the rotation
     * @param {Number} c The angle of rotation
     * @returns {vec3} out
     */
    export function rotateX(out: vec3type, a: vec3type, b: vec3type, c: number): vec3type;
    /**
     * Rotate a 3D vector around the y-axis
     * @param {vec3} out The receiving vec3
     * @param {vec3} a The vec3 point to rotate
     * @param {vec3} b The origin of the rotation
     * @param {Number} c The angle of rotation
     * @returns {vec3} out
     */
    export function rotateY(out: vec3type, a: vec3type, b: vec3type, c: number): vec3type;
    /**
     * Rotate a 3D vector around the z-axis
     * @param {vec3} out The receiving vec3
     * @param {vec3} a The vec3 point to rotate
     * @param {vec3} b The origin of the rotation
     * @param {Number} c The angle of rotation
     * @returns {vec3} out
     */
    export function rotateZ(out: vec3type, a: vec3type, b: vec3type, c: number): vec3type;
    /**
     * Perform some operation over an array of vec3s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */
    export function forEach(a: vec3type, stride: number, offset: number, count: number, fn: (out: vec3type, vec: vec3type, arg: any) => void, arg?: any): any;
    /**
     * Get the angle between two 3D vectors
     * @param {vec3} a The first operand
     * @param {vec3} b The second operand
     * @returns {Number} The angle in radians
     */
    export function angle(a: vec3type, b: vec3type): number;
    /**
     * Returns a string representation of a vector
     *
     * @param {vec3} a vector to represent as a string
     * @returns {String} string representation of the vector
     */
    export function str(a: vec3type): string;
    /**
     * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
     *
     * @param {vec3} a The first vector.
     * @param {vec3} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    export function exactEquals(a: vec3type, b: vec3type): boolean;
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     *
     * @param {vec3} a The first vector.
     * @param {vec3} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    export function equals(a: vec3type, b: vec3type): boolean;
}

export  type vec3type = [number, number, number] | Float32Array;

export  namespace vec4 {
    export type valueType = vec4type;
    /**
     * Creates a new, empty vec4
     *
     * @returns {vec4} a new 4D vector
     */
    export function create(): vec4type;
    /**
     * Creates a new vec4 initialized with values from an existing vector
     *
     * @param {vec4} a vector to clone
     * @returns {vec4} a new 4D vector
     */
    export function clone(a: vec4type): vec4type;
    /**
     * Creates a new vec4 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @param {Number} w W component
     * @returns {vec4} a new 4D vector
     */
    export function fromValues(x: number, y: number, z: number, w: number): vec4type;
    /**
     * Copy the values from one vec4 to another
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the source vector
     * @returns {vec4} out
     */
    export function copy(out: vec4type, a: vec4type): vec4type;
    /**
     * Set the components of a vec4 to the given values
     *
     * @param {vec4} out the receiving vector
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @param {Number} w W component
     * @returns {vec4} out
     */
    export function set(out: vec4type, x: number, y: number, z: number, w: number): vec4type;
    /**
     * Adds two vec4's
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {vec4} out
     */
    export function add(out: vec4type, a: vec4type, b: vec4type): vec4type;
    /**
     * Subtracts vector b from vector a
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {vec4} out
     */
    export function subtract(out: vec4type, a: vec4type, b: vec4type): vec4type;
    /**
     * Alias for {@link vec4.subtract}
     * @function
     */
    /**
     * Multiplies two vec4's
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {vec4} out
     */
    export function multiply(out: vec4type, a: vec4type, b: vec4type): vec4type;
    /**
     * Alias for {@link vec4.multiply}
     * @function
     */
    /**
     * Divides two vec4's
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {vec4} out
     */
    export function divide(out: vec4type, a: vec4type, b: vec4type): vec4type;
    /**
     * Alias for {@link vec4.divide}
     * @function
     */
    /**
     * Math.ceil the components of a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a vector to ceil
     * @returns {vec4} out
     */
    export function ceil(out: vec4type, a: vec4type): vec4type;
    /**
     * Math.floor the components of a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a vector to floor
     * @returns {vec4} out
     */
    export function floor(out: vec4type, a: vec4type): vec4type;
    /**
     * Returns the minimum of two vec4's
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {vec4} out
     */
    export function min(out: vec4type, a: vec4type, b: vec4type): vec4type;
    /**
     * Returns the maximum of two vec4's
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {vec4} out
     */
    export function max(out: vec4type, a: vec4type, b: vec4type): vec4type;
    /**
     * Math.round the components of a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a vector to round
     * @returns {vec4} out
     */
    export function round(out: vec4type, a: vec4type): vec4type;
    /**
     * Scales a vec4 by a scalar number
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec4} out
     */
    export function scale(out: vec4type, a: vec4type, b: number): vec4type;
    /**
     * Adds two vec4's after scaling the second operand by a scalar value
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @param {Number} s the amount to scale b by before adding
     * @returns {vec4} out
     */
    export function scaleAndAdd(out: vec4type, a: vec4type, b: vec4type, s: number): vec4type;
    /**
     * Calculates the euclidian distance between two vec4's
     *
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {Number} distance between a and b
     */
    export function distance(a: vec4type, b: vec4type): number;
    /**
     * Alias for {@link vec4.distance}
     * @function
     */
    /**
     * Calculates the squared euclidian distance between two vec4's
     *
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {Number} squared distance between a and b
     */
    export function squaredDistance(a: vec4type, b: vec4type): number;
    /**
     * Alias for {@link vec4.squaredDistance}
     * @function
     */
    /**
     * Calculates the length of a vec4
     *
     * @param {vec4} a vector to calculate length of
     * @returns {Number} length of a
     */
    export function length(a: vec4type): number;
    /**
     * Alias for {@link vec4.length}
     * @function
     */
    /**
     * Calculates the squared length of a vec4
     *
     * @param {vec4} a vector to calculate squared length of
     * @returns {Number} squared length of a
     */
    export function squaredLength(a: vec4type): number;
    /**
     * Alias for {@link vec4.squaredLength}
     * @function
     */
    /**
     * Negates the components of a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a vector to negate
     * @returns {vec4} out
     */
    export function negate(out: vec4type, a: vec4type): vec4type;
    /**
     * Returns the inverse of the components of a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a vector to invert
     * @returns {vec4} out
     */
    export function inverse(out: vec4type, a: vec4type): vec4type;
    /**
     * Normalize a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a vector to normalize
     * @returns {vec4} out
     */
    export function normalize(out: vec4type, a: vec4type): vec4type;
    /**
     * Calculates the dot product of two vec4's
     *
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @returns {Number} dot product of a and b
     */
    export function dot(a: vec4type, b: vec4type): number;
    /**
     * Performs a linear interpolation between two vec4's
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the first operand
     * @param {vec4} b the second operand
     * @param {Number} t interpolation amount between the two inputs
     * @returns {vec4} out
     */
    export function lerp(out: vec4type, a: vec4type, b: vec4type, t: number): vec4type;
    /**
     * Generates a random vector with the given scale
     *
     * @param {vec4} out the receiving vector
     * @param {Number} [s] Length of the resulting vector. If ommitted, a unit vector will be returned
     * @returns {vec4} out
     */
    export function random(out: vec4type, s?: number): vec4type;
    /**
     * Transforms the vec4 with a mat4.
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the vector to transform
     * @param {mat4} m matrix to transform with
     * @returns {vec4} out
     */
    export function transformMat4(out: vec4type, a: vec4type, m: mat4type): vec4type;
    /**
     * Transforms the vec4 with a quat
     *
     * @param {vec4} out the receiving vector
     * @param {vec4} a the vector to transform
     * @param {quat} q quaternion to transform with
     * @returns {vec4} out
     */
    export function transformQuat(out: vec4type, a: vec4type, q: quattype): vec4type;
    /**
     * Perform some operation over an array of vec4s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */
    export function forEach(a: vec4type, stride: number, offset: number, count: number, fn: (out: vec4type, vec: vec4type, arg: any) => void, arg?: any): any;
    /**
     * Returns a string representation of a vector
     *
     * @param {vec4} a vector to represent as a string
     * @returns {String} string representation of the vector
     */
    export function str(a: vec4type): string;
    /**
     * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
     *
     * @param {vec4} a The first vector.
     * @param {vec4} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    export function exactEquals(a: vec4type, b: vec4type): boolean;
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     *
     * @param {vec4} a The first vector.
     * @param {vec4} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    export function equals(a: vec4type, b: vec4type): boolean;
}

export  type vec4type = [number, number, number, number] | Float32Array;

/**
 * 生成矢量等值面
 * @param {json} featureCollection：，已有点数据，geojson格式 (如果不填，为undefined时，表示获取的是算法本身对象）
 * @param {string} weight：必填，插值所依赖的属性中字段名称
 * @param {array} breaks：必填，等值面分级区间
 * @param params
 params:{
         model:'exponential','gaussian','spherical'，三选一，默认exponential
         sigma2: 0, // sigma2是σ²，对应高斯过程的方差参数，也就是这组数据z的距离，方差参数σ²的似然性反映了高斯过程中的误差，并应手动设置。一般设置为 0 ，其他数值设了可能会出空白图
         alpha: 100, // Alpha α对应方差函数的先验值，此参数可能控制钻孔扩散范围,越小范围越大,少量点效果明显，但点多了且分布均匀以后改变该数字即基本无效果了，默认设置为100
         canvas: HTMLCanvasElement, // 如果要渲染到画布上填这个
         xlim: number, // canvas有效
         ylim: number, // canvas有效
         colors:string[] // canvas有效 等值面分级区间
  }
 */
export  function vectorContour(featureCollection: FeatureCollection, weight: string, breaks: number[], params?: {
    model?: 'exponential' | 'gaussian' | 'spherical';
    sigma2?: number;
    alpha?: number;
    canvas?: HTMLCanvasElement;
    xlim?: number;
    ylim?: number;
    colors?: string[];
    extent?: [number, number, number, number];
}): {
    grid?: {
        grid: number[];
        n: number;
        m: number;
        xlim: number;
        ylim: number;
        zlim: number;
        x_resolution: number;
        y_resolution: number;
    };
    contour?: FeatureCollection;
    variogram?: any;
    alg?: any;
};

export  type VectorSourceSpecification = {
    type: "vector";
    url?: string;
    tiles?: Array<string>;
    bounds?: [number, number, number, number];
    scheme?: "xyz" | "tms";
    minzoom?: number;
    maxzoom?: number;
    attribution?: string;
    promoteId?: PromoteIdSpecificationEx;
    volatile?: boolean;
};

export  function velocityPerFrame(xps: number, frameDuration: number): number;

export  function velocityPerSecond(velocity: number, frameDuration: number): number;

export  type VideoSourceSpecification = {
    type: "video";
    urls: Array<string>;
    coordinates: [[number, number], [number, number], [number, number], [number, number]];
};

export  function WorkerExpose(target: any): void;

/**
 * 和一个Worker相关联
 * @param worker
 * @return {any}
 * @constructor
 */
export  function WorkerLink(worker: Worker): any;

/**
 * 将独立函数/类移动到工作线程的一种非常简单的方法。 或者，将 worker 中的对象或函数暴露给主线程。 所有调用都是异步的。与 async/await 配合使用效果很好
 *
 * Example:
 * ```typescript
 * function busyAdd(a, b) {
 *  let st = Date.now();
 *  while (true) {
 *    if ((Date.now() - st) > 2000) break;
 *  }
 *  return a + b;
 * }
 *
 * (async () => {
 *  let workerAdd = vjmap.WorkerProxy(busyAdd);
 *  console.log(await workerAdd(10, 20)); //30
 *  // the busyAdd is executed in a worker so
 *  // the UI does not get blocked
 * })();
 *
 * class Adder {
 * constructor() {
 *   this.count = 0;
 * }
 * add(a, b) {
 *  this.count++;
 *   return a + b;
 * }
 *}

 * (async () => {
 * let WAdder = vjmap.WorkerProxy(Adder);
 * let a = await new WAdder(); // instance created/running in worker
 * console.log(await a.count); // 0
 * console.log(await a.add(10, 20)); // 30
 * console.log(await a.count); // 1
 *})();
 *
 * // or:
 * // worker.js
 *
 *importScripts('https://cdn.jsdelivr.net/npm/moment@2.20.1/moment.min.js', '../dist/workly.js');
 *function friendlyTime(value) {
 *return moment(value).calendar(null, {
 *   sameDay: function (now) {
 *    if (now - this < 1000 * 60) {
 *       return "[Just now]";
 *    } else if (now - this < 1000 * 60 * 60) {
 *       return "[" + Math.round((now - this) / (1000 * 60)) + " mins ago]";
 *    } else {
 *      return '[Today at] LT'
 *    }
 *  }
 * });
 *}
 *vjmap.WorkerExpose(friendlyTime);
 *main.js
 *
 *(async () => {
 * let w = vjmap.WorkerProxy("./worker.js");
 *let now = Date.now();
 * console.log(now);
 * console.log(await w(now));
 *console.log(await w(now - (24 * 60 * 60 * 1000)));
 *console.log(await w(now - (4 * 24 * 60 * 60 * 1000)));
 *})();
 *
 *  function randAdd(a, b) {
 *      return randInt(a, b)  + 1000; // randInt这个函数是上下文传递进来的
 *  }
 *
 * let randAddFunc = vjmap.WorkerProxy(randAdd, {
 *    randInt: vjmap.randInt // 把主进程库的函数做为上下文传进去
 * });
 * console.log(await randAddFunc(100, 300));
 * ```
 * @param obj
 * @param funcContext 函数上下文，如果传入的obj是函数的话，需要把obj中函数里调用的函数名称和函数方法传进来
 * @return {any}
 * @constructor
 */
export  function WorkerProxy(obj: Function | string, funcContext?: Record<string, Function | string>): Function;

export  const wrap: (min: number, max: number, v: number) => number;


    export function supported(options?: { failIfMajorPerformanceCaveat?: boolean | undefined }): boolean;

    /**
     * Clears browser storage used by this library. Using this method flushes the Map tile cache that is managed by this library.
     * Tiles may still be cached by the browser in some cases.
     */
    export function clearStorage(callback?: (err?: Error) => void): void;

    export function setRTLTextPlugin(pluginURL: string, callback: (error: Error) => void, deferred?: boolean): void;
    export function getRTLTextPluginStatus(): PluginStatus;

    /**
     * Initializes resources like WebWorkers that can be shared across maps to lower load
     * times in some situations. `vjmap.workerUrl` and `vjmap.workerCount`, if being
     * used, must be set before `prewarm()` is called to have an effect.
     *
     * By default, the lifecycle of these resources is managed automatically, and they are
     * lazily initialized when a Map is first created. By invoking `prewarm()`, these
     * resources will be created ahead of time, and will not be cleared when the last Map
     * is removed from the page. This allows them to be re-used by new Map instances that
     * are created later. They can be manually cleared by calling
     * `vjmap.clearPrewarmedResources()`. This is only necessary if your web page remains
     * active but stops using maps altogether.
     *
     * This is primarily useful when using GL-JS maps in a single page app, wherein a user
     * would navigate between various views that can cause Map instances to constantly be
     * created and destroyed.
     */
    export function prewarm(): void;

    /**
     * Clears up resources that have previously been created by `vjmap.prewarm()`.
     * Note that this is typically not necessary. You should only call this function
     * if you expect the user of your app to not return to a Map view at any point
     * in your application.
     */
    export function clearPrewarmedResources(): void;

  export  type PluginStatus = 'unavailable' | 'loading' | 'loaded' | 'error';

  export  type LngLatLike = [number, number] | LngLat | { lng: number; lat: number } | { lon: number; lat: number };

  export  type LngLatBoundsLike = LngLatBounds | [LngLatLike, LngLatLike] | [number, number, number, number] | LngLatLike;
  export  type PointLike = Point | [number, number];
  export  type Offset = number | PointLike | { [_: string]: PointLike };

  export  type ExpressionName =
        // Types
        | 'array'
        | 'boolean'
        | 'collator'
        | 'format'
        | 'literal'
        | 'number'
        | 'number-format'
        | 'object'
        | 'string'
        | 'image'
        | 'to-boolean'
        | 'to-color'
        | 'to-number'
        | 'to-string'
        | 'typeof'
        // Feature data
        | 'feature-state'
        | 'geometry-type'
        | 'id'
        | 'line-progress'
        | 'properties'
        // Lookup
        | 'at'
        | 'get'
        | 'has'
        | 'in'
        | 'index-of'
        | 'length'
        | 'slice'
        // Decision
        | '!'
        | '!='
        | '<'
        | '<='
        | '=='
        | '>'
        | '>='
        | 'all'
        | 'any'
        | 'case'
        | 'match'
        | 'coalesce'
        | 'within'
        // Ramps, scales, curves
        | 'interpolate'
        | 'interpolate-hcl'
        | 'interpolate-lab'
        | 'step'
        // Variable binding
        | 'let'
        | 'var'
        // String
        | 'concat'
        | 'downcase'
        | 'is-supported-script'
        | 'resolved-locale'
        | 'upcase'
        // Color
        | 'rgb'
        | 'rgba'
        | 'to-rgba'
        // Math
        | '-'
        | '*'
        | '/'
        | '%'
        | '^'
        | '+'
        | 'abs'
        | 'acos'
        | 'asin'
        | 'atan'
        | 'ceil'
        | 'cos'
        | 'e'
        | 'floor'
        | 'ln'
        | 'ln2'
        | 'log10'
        | 'log2'
        | 'max'
        | 'min'
        | 'pi'
        | 'round'
        | 'sin'
        | 'sqrt'
        | 'tan'
        // Zoom, Heatmap
        | 'zoom'
        | 'heatmap-density';

  export  type Expression = [ExpressionName, ...any[]];

  export  type Anchor =
        | 'center'
        | 'left'
        | 'right'
        | 'top'
        | 'bottom'
        | 'top-left'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-right';

  export  type DragPanOptions = {
        linearity?: number;
        easing?: (t: number) => number;
        deceleration?: number;
        maxSpeed?: number;
    };

  export  type InteractiveOptions = { around?: 'center' };

    /**
     * Map
     */
    export class Map extends Evented {
        constructor(options?: MapOptions);

        /**
         * 设置地图右键上下文菜单，运行时将触发 上下文菜单将要打开`contextMenuPreOpen`, 上下文菜单已打开`contextMenuOpened`, 上下文菜单打开无内容`contextMenuNoContent`事件, 如果isInteracting()为true时，将不会弹出菜单，并会触发上下文取消contextMenuCancel事件
         * @param menu 获取菜单的函数
         * @param key 多次调用setMenu时，同样的key会覆盖之前的事件函数；有多个key时，调用次序为key的字母次序倒序；多次调用时，直到函数返回一个非null的ContextMenu为止
         */
        setMenu(menu?: (event: any) => ContextMenu | null, key?: string): void;


        /**
         * 更改地图栅格瓦片地址
         * @param map 地图对象
         * @param tiles 瓦片地址
         *  @param source 栅格源名称 缺省 raster-source
         */
        changeSourceTiles(tiles: string[] | string, source?: string): void;

        /**
         * 关联服务对象和投影对象
         * @param svc 服务对象
         * @param projection 投影对象
         * @param options 其他关联对象
         */
        attach(svc: Service, projection: Projection, options?: object): void;

        /**
         * 得到服务对象接口
         */
        getService(): Service;

        /**
         * 得到关联的选项
         */
        getAttachOptions(): object;

        /**
         * 设置投影接口
         * @param projection
         */
        setMapProjection(projection: Projection): void;

        /**
         * 得到投影接口
         */
        getMapProjection(): Projection;


        /**
         * 地图地理坐标转经纬度
         * @param input 地理坐标点
         * @return {[number, number]}
         */
        toLngLat<
            T extends
                | GeoJsonGeomertry
                | GeoPoint
                | GeoPointLike
                | GeoPointLike[]
                | LngLatBounds
                | any
        >(
            input: T
        ): any;

        /**
         * 经纬度转地图地理坐标
         * @param input 经纬度坐标点
         * @return {GeoPoint}
         */
        fromLngLat<
            T extends
                | GeoJsonGeomertry
                | GeoPoint
                | GeoPointLike
                | GeoPointLike[]
                | LngLatBounds
                | any
        >(
            input: T
        ): any;


        /**
         *
         * @param tileUrl  切换至矢量瓦片地址
         * @param rasterPrefix 栅格图层前缀，缺省raster
         * @param minzoom 最小级别，缺省0
         * @param maxzoom 最大级别，缺省24
         * @param vecotrPrefix 矢量图层前缀，缺省vector
         * @param hoverColor 高亮时颜色，缺省rgba(0,0,255,255)
         * @param hoverOpacity 高亮时透明度,缺省0.5
         * @param hoverLineWidth 高亮时线宽,缺省3
         */
        switchRasterToVectorStyle(
            tileUrl: string,
            rasterPrefix?: string,
            minzoom?: number,
            maxzoom?: number,
            vecotrPrefix?: string,
            hoverColor?: string,
            hoverOpacity?: number,
            hoverLineWidth?: number
        ): void;

        /**
         *
         * @param tileUrl 切换至栅格瓦片地址
         * @param vecotrPrefix 矢量图层前缀，缺省vector
         * @param minzoom 最小级别，缺省0
         * @param maxzoom 最大级别，缺省24
         * @param rasterPrefix 前缀，缺省raster
         */
        switchVectorToRasterStyle(
            tileUrl: string,
            vecotrPrefix?: string,
            minzoom?: number,
            maxzoom?: number,
            rasterPrefix?: string
        ): void;

        /**
         * 使矢量图层悬浮高亮
         * @param cb 回调
         * @param prefix 矢量图层名称前缀
         */
        enableVectorLayerHoverHighlight(
            cb?: (eventName: string, hoverFeature: any, hoverLayer: string, event: any) => void,
            prefix?: string
        ): void;

        /**
         * 不使矢量图层悬浮高亮
         * @param prefix 矢量图层名称前缀
         */
        disableVectorLayerHoverHighlight(prefix?: string): boolean;

        /**
         * 使图层点击高亮
         * @param svc 服务接口实例
         * @param cb 回调
         * @param HighlightColor?: string,
         * @param prefix 高亮图层名称前缀，缺省(highlight)
         * @param filterCb 结果过滤回调
         * @param enterQueryCb 进入查询前回调，可用来修改查询的参数，如坐标等
         */
        enableLayerClickHighlight(
            svc: Service,
            cb?: (res: any, event: any) => void,
            HighlightColor?: string,
            prefix?: string,
            filterCb?: (curResult: any, zoom?: number, x?: number, y?: number) => any,
            enterQueryCb?: (lngLat: LngLatLike) => IPointQueryFeatures
        ): void;

        /**
         * 不使图层点击高亮
         * @param prefix 高亮图层名称前缀，缺省(highlight)
         */
        disableLayerClickHighlight(prefix?: string): boolean;

        /**
         * 是否是矢量图层
         */
        hasVectorLayer(): boolean;



        /**
         * 切换图层
         * @param svc 服务接口实例
         * @param visibleLayers 让可见的图层列表数组
         * @return {Promise<void>}
         */
        switchLayers(svc: Service, visibleLayers: string[]): Promise<any>;

        /**
         * 更新样式
         * @param svc 服务接口实例
         * @param param 样式参数
         * @param noInheritFromCurStyle 不从当前样式继承,默认false,继承
         * @return {Promise<any>}
         *
         */
         updateStyle(svc: Service, param: IUpdateStyle, noInheritFromCurStyle?: boolean): Promise<any>;

        /**
         * 更新地图范围，重新生成投影对象
         * @param extent
         */
        updateMapExtent(extent: string | [number, number, number, number] | GeoBounds): Projection;

        /**
         * 缩放至地图范围
         * @param bounds  bounds 地图范围或地图全图比例(缺省0.4)
         * @param options
         * - **`Object`?** 除了以下字段之外，Options 还支持[AnimationOptions][195]和[CameraOptions][194]中的所有属性。
         * - `options.padding` **( `number`| [PaddingOptions][196] )？**添加到给定边界的填充量（以像素为单位）。
         * - `options.linear` **`boolean`**如果`true`，则地图使用 `Map#easeTo 进行转换`。如果`false`，则地图使用`Map#flyTo 进行转换`。有关可用选项的信息，请参阅这些函数和[AnimationOptions][195]。（可选，默认`false`）
         * - `options.easing` **功能？**动画过渡的缓动函数。请参阅`动画选项`。
         * - `options.offset` **[PointLike][166]**相对于地图中心的给定边界的中心，以像素为单位。（可选，默认`[0,0]`）
         * - `options.maxZoom` **`number`?** 当地图视图转换到指定边界时允许的最大缩放级别。
         * - `options.fitFillClip` **`boolean`?** 默认为窗口包含地图，如果要使地图占满窗口超出的部分裁剪，请设置为true。
         * @param eventData
         * - `eventData` **`Object`?** 要添加到此方法触发的事件的事件对象的附加属性。
         * @return {this}
         */
        fitMapBounds(bounds?: number | GeoBounds, options?: Record<string, any>, eventData?: any): Map;

        /**
         * 得到地图的地理范围
         * @param ratio  缺省0.4
         */
        getGeoBounds(ratio?: number): GeoBounds;

        /**
         * 得到地图的地理范围, 方法同getGeoBounds,相当于getGeoBounds(1.0)
         */
        getMapExtent(): GeoBounds;


        /**
         * 得到地图的容器的像素大小，返回[宽，高]
         */
        getCanvasSize(): [number, number];

        /**
         * 得到地图的所有marker
         */
        getMarkers(): Marker[];

        /**
         * 得到地图的所有DivOverlay
         */
        getDivOverlays(): DivOverlay[];

        /**
         * 得到地图的所有SvgOverlay
         */
        getSvgOverlays(): SvgOverlay[];

        /**
         * 清除所有marker包括Text,divOverlays，会触发`removeMarkers`事件, noIncludeDivOverlay移除不包括divOverlays
         */
        removeMarkers(noIncludeDivOverlay?: boolean): any;

        /**
         * 清除所有popups，会触发`removePopups`事件
         */
        removePopups(): any;

        /**
         * 经纬度坐标转像素坐标，不会返回无效值
         * @param lnglat
         * @param altitude 高度值(m)
         */
        projectEx(lnglat: LngLatLike, altitude?: number): Point;

        /**
         * 创建Threejs上下文，请确保已加载其插件
         * @param Options
         */
        createThreeJsContext(Options: ThreeJsContextOptions): ThreeJsContext;

        /**
         * 像素长度转高度值
         * @param len 像素长度
         * @param zoom 缩放级别
         */
        pixelToHeight(len: number, zoom: number): number

        /**
         * 地理长度转高度值
         * @param len 像素长度
         */
        geoLengthToHeight(len: number): number

        /**
         * 像素长度转地理长度
         * @param len 像素长度
         * @param zoom 缩放级别
         */
        pixelToGeoLength(len: number, zoom: number): number

        /**
         * 地理长度转像素长度
         * @param len 地理长度
         * @param zoom 缩放级别
         */
        geoToPixelLength(len: number, zoom: number): number

        /**
         * 地理长度转墨卡托长度
         * @param len 地理长度
         * @return number 墨卡托长度
         */
         geoToMercatorLength(len: number): number;


        /**
         * 墨卡托长度转地理长度
         * @param len 墨卡托长度
         * @param number 地理长度
         */
         mercatorToGeoLength(len: number): number;

        /**
         * 设置自定义键值
         * @param key 键
         * @param value 值
         */
        setCustomKeyValue(key: string, value: any): void

        /**
         * 得到自定义键值
         * @param key 键
         */
        getCustomKeyValue(key: string): any


        /**
         * 设置地图打开是否有错误
         * @param value 值
         */
        setError(value: any): void

        /**
         * 得到地图打开是否有错误
         */
        getError(): any

        /**
         * 切换地图，请确保之前打开过地图,开始前触发`mapopenstart`事件，打开后触发`mapopenfinish`事件
         * @param param 打开选项
         * @param isKeepOldLayers 是否保留之前的图层数据，默认false
         * @param isVectorStyle 是否为矢量样式
         * @param isSetCenter 是否默认设置为地图中心点
         * @param isFitBounds 默认是否缩放
         * @param source 数据源id，如果修改了默认的栅格或瓦片source，需要传此参数
         */
        switchMap(param: IOpenMapParam, isKeepOldLayers?:boolean, isVectorStyle?:boolean, isSetCenter?: boolean, isFitBounds?: boolean, source?: string): Promise<any>;

        /**
         * 根据外包矩形创建 `GeoBounds`.
         *
         * Example:
         * ```typescript
         * const b = map.getEnvelopBounds('POLYGON((3466315.697899 6704304.297588, 3466315.697899 7784496.211226, 4546475.901198 7784496.211226, 4546475.901198 6704304.297588, 3466315.697899 6704304.297588))');
         * ```
         */
        getEnvelopBounds(envelop: string): GeoBounds;


        /**
         * 获取实体的外包矩形范围
         * @param input 实体坐标，可以是点序列或GeoJson数据
         * @param isLngLat 坐标是否为经纬度坐标，如果为true，内部将转为CAD地理坐标.默认false
         * @return CAD坐标矩形范围
         */
        getFeatureBounds<
            T extends
                    | GeoJsonGeomertry
                | GeoPoint
                | GeoPointLike
                | GeoPointLike[]
                | LngLatBounds
                | any
            >(
            input: T,
            isLngLat?: boolean
        ): GeoBounds;

        /**
         * 是否正在交互
         */
         isInteracting(): boolean;

        /**
         * 设置是否正在交互
         */
         setIsInteracting(interacting: boolean): boolean;

        /**
         * 得到数据源ID的数据
         */
        getSourceData(sourceId: string): any;


        /**
         * 获取相机的位置
         * @param isMKT  是否返回墨卡托坐标，true（默认）墨卡托, false经纬度
         */
        getCameraPosition(isMKT?: boolean): LngLatLike


        /**
         * 得到绘制图层，不存在的话，将自动创建一个新的
         */
        getDrawLayer(options?: IDrawOptions): IDrawTool;

        /**
         * 创建一个新的绘制图层，每调用一次将自动创建一个
         */
        createDrawLayer(options?: IDrawOptions): IDrawTool;

        /**
         * 删除绘制图层,为空的话，将删除默认的由getDrawLayer创建的绘制图层
         */
        removeDrawLayer(layer?: IDrawTool): void;

        /**
         * 实体颜色转html颜色
         * @param color 实体颜色
         * @return {string}
         */
        entColorToHtmlColor(color: number): string

        /**
         * html颜色转实体颜色
         * @param color html 格式如 "#rrggbb"
         * @return {number}
         */
        htmlColorToEntColor(color: string): number

        /**
         * 加载image数据，可以是svg或base64图片
         * @param id id
         * @param data 数据
         * @param width 图片宽
         * @param height 图片高
         * @param options 选项
         * @return
         */
        addImageData(id: string, data: string, width: number, height: number, options?: Record<string, any>): Promise<any>
        

        /** 每当鼠标悬停在这些图层上时，将地图的光标设置为“指针”。
         @returns A function to remove the handler.
         * @param layerOrLayers
         */
        hoverPointer(layerOrLayers: LayerRef): void;

        /**
         每当将鼠标悬停在这些图层中的某个特征上时，更新连接源 [s] 中特征的特征状态。
         @param layer Layer(s) to add handler to.
         @param {string|Array} [source] Source whose features will be updated. If not provided, use the source defined for the layer.
         @param {string} [sourceLayer] Source layer (if using vector source)
         * @param enterCb
         * @param leaveCb
         */
        hoverFeatureState(
            layer: LayerRef,
            source?: string,
            sourceLayer?: string,
            enterCb?: (arg0: {}) => void,
            leaveCb?: (arg0: {}) => void
        ): void;

        /** 将鼠标悬停在这些图层中的某个要素上时，会显示一个弹出窗口。
         @param {string|Array<string>|RegExp|function} layers Layers to attach handler to.
         @param htmlFunc Function that receives feature and popup, returns HTML.
         @param {Object<PopupOptions>} popupOptions Options passed to `Popup()` to customise popup.
         @example hoverPopup('mylayer', f => `<h3>${f.properties.Name}</h3> ${f.properties.Description}`, { anchor: 'left' });
         */
        hoverPopup(
            layers: LayerRef,
            htmlFunc: LayerCallback,
            popupOptions?: PopupOptions
        ): OffHandler;

        /** 每当单击这些图层中的要素时都会显示一个弹出窗口。
         @param {string|Array<string>|RegExp|function} layers Layers to attach handler to.
         @param htmlFunc Function that receives feature and popup, returns HTML.
         @param {Object<PopupOptions>} popupOptions Options passed to `Popup()` to customise popup.

         @returns A function that removes the handler.
         @example clickPopup('mylayer', f => `<h3>${f.properties.Name}</h3> ${f.properties.Description}`, { maxWidth: 500 });

         */
        clickPopup(
            layers: LayerRef,
            htmlFunc: (arg0: {}) => void,
            popupOptions?: PopupOptions
        ): OffHandler;

        /** 每当单击这些图层中的要素时都会触发回调。
         @param {string|Array<string>|RegExp|function} layers Layers to attach handler to.
         @param {function} cb Callback that receives event with .features property
         @returns A function that removes the handler.
         */
        clickLayer(layers: LayerRef, cb: LayerCallback): OffHandler;

        /**
         在给定的一系列图层中的第一个中检测单击，并触发回调。
         @param {string|Array<string>|RegExp|function} layers Layers to attach handler to.
         @param cb Callback, receives `{ event, layer, feature, features }`.
         @param noMatchCb Callback when a click happens that misses all these layers. Receives `{ event }`.
         @returns A function to remove the handler.
         */
        clickOneLayer(
            layerRef: LayerRef,
            cb: LayerCallback,
            noMatchCb: LayerCallback | null | undefined
        ): OffHandler;

        /** 当鼠标悬停在这些图层中的要素上时触发回调。
         @param {string|Array<string>|RegExp|function} layers Layers to attach handler to.
         @returns A function to remove the handler.
         */
        hoverLayer(layers: LayerRef, cb: LayerCallback): OffHandler;

        /**
         * 增加一个图层，位于某图层之前
         * @param layerDef
         * @param beforeLayerId
         */
        mapAddLayerBefore(layerDef: LayerSpecification, beforeLayerId?: string): void;

        /** 添加一个图层，给定 id、来源、类型和属性。
         * @param id
         * @param source
         * @param type
         * @param props
         * @param before
         */
        addLayerEx(
            id: string,
            source: string,
            type: string,
            props: {},
            before: string | null | undefined
        ): SourceBoundUtils;

        /** 在某个图层之前添加一个图层，给定 id、来源、类型和属性。
         * @param id
         * @param source
         * @param type
         * @param props
         * @param before
         */
        addLayerBefore(
            id: string,
            source: SourceOrData,
            type: string,
            props: {},
            before?: string
        ): SourceBoundUtils | null | undefined;

        /**
         * 移除一个或多个图层
         * @param id
         */
        removeLayerEx(id: string | string[]): this;

        /**
         * 创建一个 GeoJSON 层。
         * @param id
         * @param geojson
         * @param props
         */
        addGeoJSONSource(
            id: string,
            geojson?: GeoJsonGeomertry,
            props?: GeoJSONSourceSpecification
        ): SourceBoundUtils;

        /**
         * 增加数据源
         * @param id
         * @param sourceDef
         */
        addSourceEx(id: string, sourceDef: SourceSpecification): SourceBoundUtils;

        /**
         * 获取一个数据源中的所有图层
         * @param source
         */
        layersBySource(source: string): string[];

        /**
         * 增加矢量数据源
         * @param sourceId
         * @param props
         * @param extraProps
         * @param data
         */
        addVectorSource(
            sourceId: string,
            props: object | string,
            extraProps: {},
            data?: string
        ): SourceBoundUtils;

        /**
         * 将 pascalCase 或 kebab-case 中的一组属性转换为具有布局和绘制属性的图层对象。
         * @param props
         */
        properties(props?: {}): {} | null | undefined;

        /**
         * layerStyle([id,] [source,] [type,] props)
         * @param args
         */
        layerStyle(...args: unknown[]): any;

        /**
         * 使给定的图层可见。
         * @param layer
         */
        show(layer: LayerRef): void;

        /**
         * 使给定的图层不可见。
         * @param layer
         */
        hide(layer: LayerRef): void;

        /** 根据参数使给定的图层隐藏或可见。
         @param {string|Array<string>|RegExp|function} Layer to toggle.
         @param {boolean} state True for visible, false for hidden.
         */
        toggle(Layer: LayerRef, state: boolean): boolean;

        /**
         * 使取决于给定源的所有图层可见。
         * @param source
         */
        showSource(source: string): void;

        /**
         * 使取决于给定源的所有图层不可见。
         * @param source
         */
        hideSource(source: string): void;

        /** 根据参数，使连接到给定源的给定层隐藏或可见.
         @param {string} sourceId Source[s] whose layers will be toggled.
         @param {boolean} state True for visible, false for hidden.*/
        toggleSource(sourceId: string, state: boolean): void;

        /**
         * 移除一个或多个源，首先移除所有依赖于它们的层。如果源不存在，则不会提示错误
         * @param source
         */
        removeSourceEx(source: string | string[]): void;

        /**
         * 地图加载时触发的回调，或者如果地图已经加载则立即触发
         * @param cb
         */
        onLoad(cb?: (arg0: void) => void): void | Promise<void>;

        /** 从 URL 添加用作符号图层的图像。
         @example loadImageEx('marker', '/assets/marker-pin@2x.png', { pixelRatio: 2})
         */
        loadImageEx(id: string, url: string, options?: object): any;

        /**
         * 锁定方向
         */
        lockOrientation(): void;

        /**
         * 获取正在使用的字体名称数组，由遍历样式决定。不会在所有可能的情况下检测字体。
         */
        fontsInUse(): string[];

        /** 添加一个类型为“line”的图层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addLineLayer(id: string, source: string, props: LineLayerStyleProp, before?: string): void;

        /** 添加一个类型为“fill”的图层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addFillLayer(id: string, source: string, props: FillLayerStyleProp, before?: string): void;

        /** 添加一个类型为“circle”的图层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addCircleLayer(
            id: string,
            source: string,
            props: CircleLayerStyleProp,
            before?: string
        ): void;

        /** 添加一个类型为“符号”的图层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addSymbolLayer(
            id: string,
            source: string,
            props: SymbolLayerStyleProp,
            before?: string
        ): void;

        /** 添加一个类型为`video`的层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addVideoLayer(id: string, source: string, props: object, before?: string): void;

        /**添加一个类型为 `raster` 的图层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addRasterLayer(
            id: string,
            source: string,
            props: RasterLayerStyleProp,
            before?: string
        ): void;

        /** 添加一个类型为“FillExtrusion”的层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addFillExtrusionLayer(
            id: string,
            source: string,
            props: FillExtrusionLayerStyleProp,
            before?: string
        ): void;

        /** 添加一个类型为“Heatmap”的图层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addHeatmapLayer(
            id: string,
            source: string,
            props: HeatmapLayerStyleProp,
            before?: string
        ): void;

        /** 添加一个类型为“hillshade”的图层。
         * @param id
         * @param props
         * @param before
         * @param source
         */
        addHillshadeLayer(
            id: string,
            source: string,
            props: HillshadeLayerStyleProp,
            before?: string
        ): void;

        /** 添加一个 `raster` 源
         @param sourceId ID of the new source.
         @param {object} props Properties defining the source, per the style spec.
         */
        addRasterSource(sourceId: string, props: RasterSourceSpecification): SourceBoundUtils;

        /** 添加一个 `raster-dem` 源
         @param sourceId ID of the new source.
         @param {object} props Properties defining the source, per the style spec.
         */
        addRasterDemSource(sourceId: string, props: RasterDEMSourceSpecification): SourceBoundUtils;

        /** 添加一个 `image` 源
         @param sourceId ID of the new source.
         @param {object} props Properties defining the source, per the style spec.
         */
        addImageSource(sourceId: string, props: ImageSourceSpecification): SourceBoundUtils;

        /** 添加“Video”源
         @param sourceId ID of the new source.
         @param {object} props Properties defining the source, per the style spec.
         */
        addVideoSource(sourceId: string, props: VideoSourceSpecification): SourceBoundUtils;

        /**
         * 设置图层属性
         * @param layerId
         * @param source
         * @param type
         * @param props
         * @param before
         */
        setLayer(
            layerId: string,
            source: string,
            type: string,
            props: SourceSpecification,
            before?: string
        ): SourceBoundUtils;

        /** 在一个或多个图层上设置绘制或布局属性。
         @example setProperty(['buildings-fill', 'parks-fill'], 'fillOpacity', 0.5)
         */
        setProperty(layer: LayerRef, prop: string | object, value?: PropValue): void;

        /** 根据样式规范，获取给定图层 ID 的图层定义。
         * @param layerId
         */
        getLayerStyle(layerId: string): LayerSpecification;

        /**
         * 设置图层样式
         * @param layer
         * @param style
         */
        setLayerStyle(
            layer:
                | LayerRef
                | {
                      id: string;
                  },
            style: {}
        ): void;

        /** 替换 GeoJSON 图层的当前数据。
         @param sourceId Id of the source being updated.
         @param {GeoJSON} [data] GeoJSON object to set. If not provided, defaults to an empty FeatureCollection.
         */
        setData(sourceId: string, data?: GeoJsonGeomertry): void;

        /** 替换一个图层层或多图层的过滤器。
         @param {string|Array<string>|RegExp|function} layers Layers to attach handler to.
         @param {Array} filter New filter to set.
         @example map.setFilterEx(['buildings-fill', 'buildings-outline', 'buildings-label'], ['==','level','0']]);
         */
        setFilterEx(layer: LayerRef, filter: FilterSpecification): void;

        /**
         * 设置图层至数据源
         * @param layerId
         * @param source
         * @param sourceLayer
         */
        setLayerSource(layerId: string, source: string, sourceLayer: string): void;

        /** 在样式的根上设置一个属性，例如 `light` 或 `transition`.
         * @param propName
         * @param val
         */
        setRootProperty(propName: string, val: PropValue): void;

        /** 设置过渡属性。
         @example setTransition({ duration: 500, delay: 100 })
         */
        setTransition(val: TransitionSpecification): void;

        /** 为一个或多个图层设置`fill-antialias` 绘制属性。 */
        setFillAntialias(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`fill-opacity` 绘画属性。 */
        setFillOpacity(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`fill-color` 绘画属性。 */
        setFillColor(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`fill-outline-color` 绘画属性。*/
        setFillOutlineColor(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`fill-translate` 绘制属性。 */
        setFillTranslate(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`fill-translate-anchor` 绘制属性。 */
        setFillTranslateAnchor(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`fill-pattern` 绘制属性。 */
        setFillPattern(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-extrusion-opacity` 绘画属性。 */
        setFillExtrusionOpacity(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-extrusion-color` 绘制属性。 */
        setFillExtrusionColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-extrusion-translate` 绘制属性。 */
        setFillExtrusionTranslate(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-extrusion-translate-anchor` 绘制属性。 */
        setFillExtrusionTranslateAnchor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-extrusion-pattern` 绘制属性。 */
        setFillExtrusionPattern(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-extrusion-height` 绘制属性。 */
        setFillExtrusionHeight(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-extrusion-base` 绘制属性。 */
        setFillExtrusionBase(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-extrusion-vertical-gradient`绘画属性。 */
        setFillExtrusionVerticalGradient(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`line-opacity` 绘制属性。 */
        setLineOpacity(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `line-color` 绘制属性。 */
        setLineColor(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `line-translate` 绘制属性。 */
        setLineTranslate(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `line-translate-anchor` 绘制属性。 */
        setLineTranslateAnchor(layer: LayerRef, value: any): void;

        /** 设置一个或多个图层的“线宽”绘制属性。 */
        setLineWidth(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`line-gap-width` 绘制属性。 */
        setLineGapWidth(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`line-offset` 绘制属性。 */
        setLineOffset(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `line-blur` 绘制属性。 */
        setLineBlur(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `line-dasharray` 绘制属性。 */
        setLineDasharray(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`line-pattern` 绘制属性。 */
        setLinePattern(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `line-gradient` 绘制属性。 */
        setLineGradient(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`circle-radius` 绘制属性。 */
        setCircleRadius(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`circle-color` 绘制属性。 */
        setCircleColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`circle-blur`绘画属性。 */
        setCircleBlur(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`circle-opacity` 绘制属性。 */
        setCircleOpacity(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `circle-translate` 绘制属性。 */
        setCircleTranslate(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `circle-translate-anchor` 绘制属性。 */
        setCircleTranslateAnchor(layer: LayerRef, value: any): void;

        /** 设置一个或多个图层的“circle-pitch-scale”绘制属性。 */
        setCirclePitchScale(layer: LayerRef, value: any): void;

        /** 为一层或多层设置“circle-pitch-alignment”绘制属性。 */
        setCirclePitchAlignment(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`circle-stroke-width` 绘制属性。 */
        setCircleStrokeWidth(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`circle-stroke-color` 绘画属性。 */
        setCircleStrokeColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`circle-stroke-opacity` 绘画属性。 */
        setCircleStrokeOpacity(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`heatmap-radius` 绘制属性。 */
        setHeatmapRadius(layer: LayerRef, value: any): void;

        /** 为一层或多层设置“热图权重”绘制属性。 */
        setHeatmapWeight(layer: LayerRef, value: any): void;

        /** 为一层或多层设置“热图强度”绘制属性。 */
        setHeatmapIntensity(layer: LayerRef, value: any): void;

        /** 为一层或多层设置“热图颜色”绘制属性。 */
        setHeatmapColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`heatmap-opacity` 绘制属性。 */
        setHeatmapOpacity(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`icon-opacity` 绘制属性。 */
        setIconOpacity(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`icon-color` 绘制属性。 */
        setIconColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-halo-color` 绘制属性。 */
        setIconHaloColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-halo-width` 绘制属性。 */
        setIconHaloWidth(layer: LayerRef, value: any): void;

        /** 为一层或多层设置 `icon-halo-blur` 绘制属性。 */
        setIconHaloBlur(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-translate` 绘制属性。 */
        setIconTranslate(layer: LayerRef, value: any): void;

        /** 为一层或多层设置 `icon-translate-anchor` 绘制属性。 */
        setIconTranslateAnchor(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-opacity` 绘制属性。 */
        setTextOpacity(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-color` 绘制属性。 */
        setTextColor(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-halo-color` 绘制属性。 */
        setTextHaloColor(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-halo-width` 绘制属性。 */
        setTextHaloWidth(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-halo-blur` 绘制属性。 */
        setTextHaloBlur(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-translate` 绘制属性。 */
        setTextTranslate(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-translate-anchor` 绘制属性。 */
        setTextTranslateAnchor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`raster-opacity` 绘制属性。 */
        setRasterOpacity(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`raster-hue-rotate` 绘制属性。 */
        setRasterHueRotate(layer: LayerRef, value: any): void;

        /** 为一层或多层设置 `raster-brightness-min` 绘制属性。 */
        setRasterBrightnessMin(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`raster-brightness-max` 绘制属性。 */
        setRasterBrightnessMax(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`raster-saturation` 绘制属性。 */
        setRasterSaturation(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`raster-contrast` 绘制属性。 */
        setRasterContrast(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`raster-resampling` 绘制属性。 */
        setRasterResampling(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`raster-fade-duration` 绘制属性。 */
        setRasterFadeDuration(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`hillshade-illumination-direction` 绘制属性。 */
        setHillshadeIlluminationDirection(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`hillshade-illumination-anchor` 绘制属性。 */
        setHillshadeIlluminationAnchor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`hillshade-exaggeration` 绘制属性。 */
        setHillshadeExaggeration(layer: LayerRef, value: any): void;

        /** 为一层或多层设置 `hillshade-shadow-color` 绘制属性。 */
        setHillshadeShadowColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`hillshade-highlight-color` 绘制属性。 */
        setHillshadeHighlightColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`hillshade-accent-color` 绘制属性。 */
        setHillshadeAccentColor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`background-color` 绘制属性。 */
        setBackgroundColor(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`background-pattern` 绘制属性。 */
        setBackgroundPattern(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`background-opacity` 绘制属性。 */
        setBackgroundOpacity(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置“可见性”布局属性。 */
        setVisibility(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`fill-sort-key`布局属性。 */
        setFillSortKey(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `circle-sort-key` 布局属性。 */
        setCircleSortKey(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `line-cap` 布局属性。 */
        setLineCap(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置“line-join”布局属性。 */
        setLineJoin(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置“line-miter-limit”布局属性。 */
        setLineMiterLimit(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`line-round-limit`布局属性。 */
        setLineRoundLimit(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`line-sort-key`布局属性。 */
        setLineSortKey(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `symbol-placement` 布局属性。 */
        setSymbolPlacement(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `symbol-spacing` 布局属性。 */
        setSymbolSpacing(layer: LayerRef, value: any): void;

        /** 为一层或多层设置 `symbol-avoid-edges` 布局属性。 */
        setSymbolAvoidEdges(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `symbol-sort-key` 布局属性。 */
        setSymbolSortKey(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `symbol-z-order` 布局属性。 */
        setSymbolZOrder(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-allow-overlap`布局属性。 */
        setIconAllowOverlap(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`icon-ignore-placement` 布局属性。 */
        setIconIgnorePlacement(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`icon-optional` 布局属性。 */
        setIconOptional(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`icon-rotation-alignment` 布局属性。 */
        setIconRotationAlignment(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-size`布局属性。 */
        setIconSize(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-text-fit`布局属性。 */
        setIconTextFit(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-text-fit-padding`布局属性。 */
        setIconTextFitPadding(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-image`布局属性。 */
        setIconImage(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-rotate`布局属性。 */
        setIconRotate(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-padding`布局属性。 */
        setIconPadding(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-keep-upright`布局属性。 */
        setIconKeepUpright(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-offset`布局属性。 */
        setIconOffset(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-anchor`布局属性。 */
        setIconAnchor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`icon-pitch-alignment`布局属性。 */
        setIconPitchAlignment(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-pitch-alignment` 布局属性。 */
        setTextPitchAlignment(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-rotation-alignment` 布局属性。 */
        setTextRotationAlignment(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-field` 布局属性。 */
        setTextField(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-font` 布局属性。 */
        setTextFont(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-size` 布局属性。 */
        setTextSize(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`text-max-width`布局属性。 */
        setTextMaxWidth(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`text-line-height`布局属性。 */
        setTextLineHeight(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`text-letter-spacing`布局属性。 */
        setTextLetterSpacing(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-justify` 布局属性。 */
        setTextJustify(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`text-radial-offset`布局属性。 */
        setTextRadialOffset(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`text-variable-anchor`布局属性。 */
        setTextVariableAnchor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`text-anchor`布局属性。 */
        setTextAnchor(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`text-max-angle`布局属性。 */
        setTextMaxAngle(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-writing-mode` 布局属性。 */
        setTextWritingMode(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-rotate` 布局属性。 */
        setTextRotate(layer: LayerRef, value: any): void;

        /** 为一层或多层设置`text-padding`布局属性。 */
        setTextPadding(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-keep-upright` 布局属性。 */
        setTextKeepUpright(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-transform` 布局属性。 */
        setTextTransform(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置 `text-offset` 布局属性。 */
        setTextOffset(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-allow-overlap` 布局属性。 */
        setTextAllowOverlap(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-ignore-placement` 布局属性。 */
        setTextIgnorePlacement(layer: LayerRef, value: any): void;

        /** 为一个或多个图层设置`text-optional` 布局属性。 */
        setTextOptional(layer: LayerRef, value: any): void;

        /** 获取图层的“填充抗锯齿”绘制属性。 */
        getFillAntialias(layer: LayerRef): any;

        /** 获取图层的 `fill-opacity` 绘制属性。 */
        getFillOpacity(layer: LayerRef): any;

        /** 获取图层的 `fill-color` 绘制属性。 */
        getFillColor(layer: LayerRef): any;

        /** 获取图层的 `fill-outline-color` 绘制属性。 */
        getFillOutlineColor(layer: LayerRef): any;

        /** 获取图层的 `fill-translate` 绘制属性。 */
        getFillTranslate(layer: LayerRef): any;

        /** 获取图层的 `fill-translate-anchor` 绘制属性。 */
        getFillTranslateAnchor(layer: LayerRef): any;

        /** 获取图层的`fill-pattern` 绘制属性。 */
        getFillPattern(layer: LayerRef): any;

        /** 获取图层的 `fill-extrusion-opacity` 绘画属性。 */
        getFillExtrusionOpacity(layer: LayerRef): any;

        /** 获取图层的`fill-extrusion-color` 绘画属性。 */
        getFillExtrusionColor(layer: LayerRef): any;

        /** 获取图层的`fill-extrusion-translate` 绘制属性。 */
        getFillExtrusionTranslate(layer: LayerRef): any;

        /** 获取图层的 `fill-extrusion-translate-anchor` 绘制属性。 */
        getFillExtrusionTranslateAnchor(layer: LayerRef): any;

        /** 获取图层的`fill-extrusion-pattern` 绘制属性。 */
        getFillExtrusionPattern(layer: LayerRef): any;

        /** 获取图层的`fill-extrusion-height` 绘制属性。*/
        getFillExtrusionHeight(layer: LayerRef): any;

        /** 获取图层的`fill-extrusion-base` 绘画属性。 */
        getFillExtrusionBase(layer: LayerRef): any;

        /** 获取图层的`fill-extrusion-vertical-gradient` 绘制属性。*/
        getFillExtrusionVerticalGradient(layer: LayerRef): any;

        /** 获取图层的 `line-opacity` 绘制属性。 */
        getLineOpacity(layer: LayerRef): any;

        /** 获取图层的 `line-color` 绘制属性。 */
        getLineColor(layer: LayerRef): any;

        /** 获取图层的 `line-translate` 绘制属性。 */
        getLineTranslate(layer: LayerRef): any;

        /** 获取图层的 `line-translate-anchor` 绘制属性。 */
        getLineTranslateAnchor(layer: LayerRef): any;

        /** 获取图层的“线宽”绘制属性。 */
        getLineWidth(layer: LayerRef): any;

        /** 获取图层的 `line-gap-width` 绘制属性。 */
        getLineGapWidth(layer: LayerRef): any;

        /** 获取图层的 `line-offset` 绘制属性。 */
        getLineOffset(layer: LayerRef): any;

        /** 获取图层的 `line-blur` 绘制属性。 */
        getLineBlur(layer: LayerRef): any;

        /** 获取图层的 `line-dasharray` 绘制属性。 */
        getLineDasharray(layer: LayerRef): any;

        /** 获取图层的 `line-pattern` 绘制属性。 */
        getLinePattern(layer: LayerRef): any;

        /** 获取图层的 `line-gradient` 绘制属性。 */
        getLineGradient(layer: LayerRef): any;

        /** 获取图层的 `circle-radius` 绘制属性。 */
        getCircleRadius(layer: LayerRef): any;

        /** 获取图层的 `circle-color` 绘制属性。 */
        getCircleColor(layer: LayerRef): any;

        /** 获取图层的 `circle-blur` 绘制属性。*/
        getCircleBlur(layer: LayerRef): any;

        /** 获取图层的 `circle-opacity` 绘制属性。 */
        getCircleOpacity(layer: LayerRef): any;

        /** 获取图层的 `circle-translate` 绘制属性。 */
        getCircleTranslate(layer: LayerRef): any;

        /** 获取图层的 `circle-translate-anchor` 绘制属性。 */
        getCircleTranslateAnchor(layer: LayerRef): any;

        /** 获取图层的 `circle-pitch-scale` 绘制属性。 */
        getCirclePitchScale(layer: LayerRef): any;

        /** 获取图层的 `circle-pitch-alignment` 绘制属性。 */
        getCirclePitchAlignment(layer: LayerRef): any;

        /** 获取图层的 `circle-stroke-width` 绘制属性。 */
        getCircleStrokeWidth(layer: LayerRef): any;

        /** 获取图层的 `circle-stroke-color` 绘画属性。 */
        getCircleStrokeColor(layer: LayerRef): any;

        /** Gets the `circle-stroke-opacity`  绘图属性. */
        getCircleStrokeOpacity(layer: LayerRef): any;

        /** Gets the `heatmap-radius`  绘图属性. */
        getHeatmapRadius(layer: LayerRef): any;

        /** Gets the `heatmap-weight`  绘图属性. */
        getHeatmapWeight(layer: LayerRef): any;

        /** Gets the `heatmap-intensity`  绘图属性. */
        getHeatmapIntensity(layer: LayerRef): any;

        /** Gets the `heatmap-color`  绘图属性. */
        getHeatmapColor(layer: LayerRef): any;

        /** Gets the `heatmap-opacity`  绘图属性. */
        getHeatmapOpacity(layer: LayerRef): any;

        /** Gets the `icon-opacity`  绘图属性. */
        getIconOpacity(layer: LayerRef): any;

        /** Gets the `icon-color`  绘图属性. */
        getIconColor(layer: LayerRef): any;

        /** Gets the `icon-halo-color`  绘图属性. */
        getIconHaloColor(layer: LayerRef): any;

        /** Gets the `icon-halo-width`  绘图属性. */
        getIconHaloWidth(layer: LayerRef): any;

        /** Gets the `icon-halo-blur`  绘图属性. */
        getIconHaloBlur(layer: LayerRef): any;

        /** Gets the `icon-translate`  绘图属性. */
        getIconTranslate(layer: LayerRef): any;

        /** Gets the `icon-translate-anchor`  绘图属性. */
        getIconTranslateAnchor(layer: LayerRef): any;

        /** Gets the `text-opacity`  绘图属性. */
        getTextOpacity(layer: LayerRef): any;

        /** Gets the `text-color`  绘图属性. */
        getTextColor(layer: LayerRef): any;

        /** Gets the `text-halo-color`  绘图属性. */
        getTextHaloColor(layer: LayerRef): any;

        /** Gets the `text-halo-width`  绘图属性. */
        getTextHaloWidth(layer: LayerRef): any;

        /** Gets the `text-halo-blur`  绘图属性. */
        getTextHaloBlur(layer: LayerRef): any;

        /** Gets the `text-translate`  绘图属性. */
        getTextTranslate(layer: LayerRef): any;

        /** Gets the `text-translate-anchor`  绘图属性. */
        getTextTranslateAnchor(layer: LayerRef): any;

        /** Gets the `raster-opacity`  绘图属性. */
        getRasterOpacity(layer: LayerRef): any;

        /** Gets the `raster-hue-rotate`  绘图属性. */
        getRasterHueRotate(layer: LayerRef): any;

        /** 获取图层的`raster-brightness-min`  绘图属性. */
        getRasterBrightnessMin(layer: LayerRef): any;

        /** 获取图层的`raster-brightness-max`  绘图属性. */
        getRasterBrightnessMax(layer: LayerRef): any;

        /** 获取图层的`raster-saturation`  绘图属性. */
        getRasterSaturation(layer: LayerRef): any;

        /** 获取图层的`raster-contrast`  绘图属性. */
        getRasterContrast(layer: LayerRef): any;

        /** 获取图层的`raster-resampling`  绘图属性. */
        getRasterResampling(layer: LayerRef): any;

        /** 获取图层的`raster-fade-duration`  绘图属性. */
        getRasterFadeDuration(layer: LayerRef): any;

        /** 获取图层的`hillshade-illumination-direction`  绘图属性. */
        getHillshadeIlluminationDirection(layer: LayerRef): any;

        /** 获取图层的`hillshade-illumination-anchor`  绘图属性. */
        getHillshadeIlluminationAnchor(layer: LayerRef): any;

        /** 获取图层的`hillshade-exaggeration`  绘图属性. */
        getHillshadeExaggeration(layer: LayerRef): any;

        /** 获取图层的`hillshade-shadow-color`  绘图属性. */
        getHillshadeShadowColor(layer: LayerRef): any;

        /** 获取图层的`hillshade-highlight-color`  绘图属性. */
        getHillshadeHighlightColor(layer: LayerRef): any;

        /** 获取图层的`hillshade-accent-color`  绘图属性. */
        getHillshadeAccentColor(layer: LayerRef): any;

        /** 获取图层的`background-color`  绘图属性. */
        getBackgroundColor(layer: LayerRef): any;

        /** 获取图层的`background-pattern`  绘图属性. */
        getBackgroundPattern(layer: LayerRef): any;

        /** 获取图层的`background-opacity`  绘图属性. */
        getBackgroundOpacity(layer: LayerRef): any;

        /** 获取图层的`visibility` 布局属性. */
        getVisibility(layer: LayerRef): any;

        /** 获取图层的`fill-sort-key` 布局属性. */
        getFillSortKey(layer: LayerRef): any;

        /** 获取图层的`circle-sort-key` 布局属性. */
        getCircleSortKey(layer: LayerRef): any;

        /** 获取图层的`line-cap` 布局属性. */
        getLineCap(layer: LayerRef): any;

        /** 获取图层的`line-join` 布局属性. */
        getLineJoin(layer: LayerRef): any;

        /** 获取图层的`line-miter-limit` 布局属性. */
        getLineMiterLimit(layer: LayerRef): any;

        /** 获取图层的`line-round-limit` 布局属性. */
        getLineRoundLimit(layer: LayerRef): any;

        /** 获取图层的`line-sort-key` 布局属性. */
        getLineSortKey(layer: LayerRef): any;

        /** 获取图层的`symbol-placement` 布局属性. */
        getSymbolPlacement(layer: LayerRef): any;

        /** 获取图层的 `symbol-spacing` 布局属性。 */
        getSymbolSpacing(layer: LayerRef): any;

        /** 获取图层的 `symbol-avoid-edges` 布局属性。 */
        getSymbolAvoidEdges(layer: LayerRef): any;

        /** 获取图层的 `symbol-sort-key` 布局属性。 */
        getSymbolSortKey(layer: LayerRef): any;

        /** 获取图层的 `symbol-z-order` 布局属性。 */
        getSymbolZOrder(layer: LayerRef): any;

        /** 获取图层的`icon-allow-overlap` 布局属性。 */
        getIconAllowOverlap(layer: LayerRef): any;

        /** 获取图层的`icon-ignore-placement` 布局属性。 */
        getIconIgnorePlacement(layer: LayerRef): any;

        /** 获取图层的`icon-optional` 布局属性。 */
        getIconOptional(layer: LayerRef): any;

        /** 获取图层的`icon-rotation-alignment` 布局属性。 */
        getIconRotationAlignment(layer: LayerRef): any;

        /** 获取图层的`icon-size` 布局属性。 */
        getIconSize(layer: LayerRef): any;

        /** 获取图层的`icon-text-fit` 布局属性。 */
        getIconTextFit(layer: LayerRef): any;

        /** 获取图层的`icon-text-fit-padding`布局属性。 */
        getIconTextFitPadding(layer: LayerRef): any;

        /** 获取图层的`icon-image` 布局属性。 */
        getIconImage(layer: LayerRef): any;

        /** 获取图层的`icon-rotate` 布局属性。 */
        getIconRotate(layer: LayerRef): any;

        /** 获取图层的`icon-padding`布局属性。 */
        getIconPadding(layer: LayerRef): any;

        /** 获取图层的 `icon-keep-upright` 布局属性。 */
        getIconKeepUpright(layer: LayerRef): any;

        /** 获取图层的`icon-offset`布局属性。 */
        getIconOffset(layer: LayerRef): any;

        /** 获取图层的`icon-anchor` 布局属性。 */
        getIconAnchor(layer: LayerRef): any;

        /** 获取图层的`icon-pitch-alignment` 布局属性。*/
        getIconPitchAlignment(layer: LayerRef): any;

        /** 获取图层的 `text-pitch-alignment` 布局属性。 */
        getTextPitchAlignment(layer: LayerRef): any;

        /**获取图层的 `text-rotation-alignment` 布局属性。 */
        getTextRotationAlignment(layer: LayerRef): any;

        /** 获取图层的“文本字段”布局属性。 */
        getTextField(layer: LayerRef): any;

        /** 获取图层的 `text-font` 布局属性。 */
        getTextFont(layer: LayerRef): any;

        /** 获取图层的 `text-size` 布局属性。 */
        getTextSize(layer: LayerRef): any;

        /** 获取图层的 `text-max-width` 布局属性。*/
        getTextMaxWidth(layer: LayerRef): any;

        /** 获取图层的 `text-line-height` 布局属性。*/
        getTextLineHeight(layer: LayerRef): any;

        /** 获取图层的 `text-letter-spacing` 布局属性。 */
        getTextLetterSpacing(layer: LayerRef): any;

        /** 获取图层的 `text-justify` 布局属性。 */
        getTextJustify(layer: LayerRef): any;

        /** 获取图层的 `text-radial-offset` 布局属性。 */
        getTextRadialOffset(layer: LayerRef): any;

        /** 获取图层的 `text-variable-anchor` 布局属性。 */
        getTextVariableAnchor(layer: LayerRef): any;

        /** 获取图层的 `text-anchor` 布局属性。*/
        getTextAnchor(layer: LayerRef): any;

        /** 获取图层的 `text-max-angle` 布局属性。 */
        getTextMaxAngle(layer: LayerRef): any;

        /** 获取图层的 `text-writing-mode` 布局属性。 */
        getTextWritingMode(layer: LayerRef): any;

        /** 获取图层的 `text-rotate` 布局属性。 */
        getTextRotate(layer: LayerRef): any;

        /** 获取图层的 `text-padding` 布局属性。 */
        getTextPadding(layer: LayerRef): any;

        /** 获取图层的 `text-keep-upright` 布局属性。 */
        getTextKeepUpright(layer: LayerRef): any;

        /** 获取图层的 `text-transform` 布局属性。 */
        getTextTransform(layer: LayerRef): any;

        /** 获取图层的 `text-offset` 布局属性。 */
        getTextOffset(layer: LayerRef): any;

        /** 获取图层的 `text-allow-overlap` 布局属性。 */
        getTextAllowOverlap(layer: LayerRef): any;

        /** 获取图层的 `text-ignore-placement` 布局属性。 */
        getTextIgnorePlacement(layer: LayerRef): any;

        /** 获取图层的 `text-optional` 布局属性。 */
        getTextOptional(layer: LayerRef): any;

        

        addControl(
            control: Control | IControl,
            position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
        ): this;

        removeControl(control: Control | IControl): this;

        /**
         * Checks if a control exists on the map.
         *
         * @param {IControl} control The {@link IControl} to check.
         * @returns {boolean} True if map contains control.
         * @example
         */
        hasControl(control: IControl): boolean;

        resize(eventData?: EventData): this;

        getBounds(): LngLatBounds;

        getMaxBounds(): LngLatBounds | null;

        setMaxBounds(lnglatbounds?: LngLatBoundsLike): this;

        setMinZoom(minZoom?: number | null): this;

        getMinZoom(): number;

        setMaxZoom(maxZoom?: number | null): this;

        getMaxZoom(): number;

        setMinPitch(minPitch?: number | null): this;

        getMinPitch(): number;

        setMaxPitch(maxPitch?: number | null): this;

        getMaxPitch(): number;

        getRenderWorldCopies(): boolean;

        setRenderWorldCopies(renderWorldCopies?: boolean): this;

        project(lnglat: LngLatLike): vjmap.Point;

        unproject(point: PointLike): vjmap.LngLat;

        isMoving(): boolean;

        isZooming(): boolean;

        isRotating(): boolean;

        /**
         * Returns an array of GeoJSON Feature objects representing visible features that satisfy the query parameters.
         *
         * The properties value of each returned feature object contains the properties of its source feature. For GeoJSON sources, only string and numeric property values are supported (i.e. null, Array, and Object values are not supported).
         *
         * Each feature includes top-level layer, source, and sourceLayer properties. The layer property is an object representing the style layer to which the feature belongs. Layout and paint properties in this object contain values which are fully evaluated for the given zoom level and feature.
         *
         * Only features that are currently rendered are included. Some features will not be included, like:
         *
         * - Features from layers whose visibility property is "none".
         * - Features from layers whose zoom range excludes the current zoom level.
         * - Symbol features that have been hidden due to text or icon collision.
         *
         * Features from all other layers are included, including features that may have no visible contribution to the rendered result; for example, because the layer's opacity or color alpha component is set to 0.
         *
         * The topmost rendered feature appears first in the returned array, and subsequent features are sorted by descending z-order. Features that are rendered multiple times (due to wrapping across the antimeridian at low zoom levels) are returned only once (though subject to the following caveat).
         *
         * Because features come from tiled vector data or GeoJSON data that is converted to tiles internally, feature geometries may be split or duplicated across tile boundaries and, as a result, features may appear multiple times in query results. For example, suppose there is a highway running through the bounding rectangle of a query. The results of the query will be those parts of the highway that lie within the map tiles covering the bounding rectangle, even if the highway extends into other tiles, and the portion of the highway within each map tile will be returned as a separate feature. Similarly, a point feature near a tile boundary may appear in multiple tiles due to tile buffering.
         *
         * @param pointOrBox The geometry of the query region: either a single point or southwest and northeast points describing a bounding box. Omitting this parameter (i.e. calling Map#queryRenderedFeatures with zero arguments, or with only a  options argument) is equivalent to passing a bounding box encompassing the entire map viewport.
         * @param options
         */
        queryRenderedFeatures(
            pointOrBox?: PointLike | [PointLike, PointLike],
            options?: { layers?: string[] | undefined; filter?: any[] | undefined } & FilterOptions,
        ): MapGeoJSONFeature[];

        /**
         * Returns an array of GeoJSON Feature objects representing features within the specified vector tile or GeoJSON source that satisfy the query parameters.
         *
         * In contrast to Map#queryRenderedFeatures, this function returns all features matching the query parameters, whether or not they are rendered by the current style (i.e. visible). The domain of the query includes all currently-loaded vector tiles and GeoJSON source tiles: this function does not check tiles outside the currently visible viewport.
         *
         * Because features come from tiled vector data or GeoJSON data that is converted to tiles internally, feature geometries may be split or duplicated across tile boundaries and, as a result, features may appear multiple times in query results. For example, suppose there is a highway running through the bounding rectangle of a query. The results of the query will be those parts of the highway that lie within the map tiles covering the bounding rectangle, even if the highway extends into other tiles, and the portion of the highway within each map tile will be returned as a separate feature. Similarly, a point feature near a tile boundary may appear in multiple tiles due to tile buffering.
         *
         * @param sourceID The ID of the vector tile or GeoJSON source to query.
         * @param parameters
         */
        querySourceFeatures(
            sourceID: string,
            parameters?: {
                sourceLayer?: string | undefined;
                filter?: any[] | undefined;
            } & FilterOptions,
        ): MapGeoJSONFeature[];

        setStyle(
            style: vjmap.Style | string,
            options?: { diff?: boolean | undefined; localIdeographFontFamily?: string | undefined },
        ): this;

        getStyle(): vjmap.Style;

        isStyleLoaded(): boolean;

        addSource(id: string, source: AnySourceData): this;

        isSourceLoaded(id: string): boolean;

        areTilesLoaded(): boolean;

        removeSource(id: string): this;

        getSource(id: string): AnySourceImpl;

        addImage(
            name: string,
            image:
                | HTMLImageElement
                | ArrayBufferView
                | { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
                | ImageData
                | ImageBitmap,
            options?: { pixelRatio?: number | undefined; sdf?: boolean | undefined },
        ): void;

        updateImage(
            name: string,
            image:
                | HTMLImageElement
                | ArrayBufferView
                | { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
                | ImageData
                | ImageBitmap,
        ): void;

        hasImage(name: string): boolean;

        removeImage(name: string): void;

        loadImage(url: string, callback: (error?: Error, result?: HTMLImageElement | ImageBitmap) => void): void;

        listImages(): string[];

        addLayer(layer: vjmap.AnyLayer, before?: string): this;

        moveLayer(id: string, beforeId?: string): this;

        removeLayer(id: string): this;

        getLayer(id: string): vjmap.AnyLayer;

        setFilter(layer: string, filter?: any[] | boolean | null, options?: FilterOptions | null): this;

        setLayerZoomRange(layerId: string, minzoom: number, maxzoom: number): this;

        getFilter(layer: string): any[];

        setPaintProperty(layer: string, name: string, value: any, klass?: string): this;

        getPaintProperty(layer: string, name: string): any;

        setLayoutProperty(layer: string, name: string, value: any): this;

        getLayoutProperty(layer: string, name: string): any;

        setLight(options: vjmap.Light, lightOptions?: any): this;

        getLight(): vjmap.Light;

        /**
         * Sets the terrain property of the style.
         *
         * @param terrain Terrain properties to set. Must conform to the [Map Style Specification](https://www.Map.com/Map-gl-style-spec/#terrain).
         * If `null` or `undefined` is provided, function removes terrain.
         * @returns {Map} `this`
         * @example
         * map.addSource('Map-dem', {
         *     'type': 'raster-dem',
         *     'url': 'Map://Map.Map-terrain-dem-v1',
         *     'tileSize': 512,
         *     'maxzoom': 14
         * });
         * // add the DEM source as a terrain layer with exaggerated height
         * map.setTerrain({ 'source': 'Map-dem', 'exaggeration': 1.5 });
         */
        setTerrain(terrain?: TerrainSpecification | null): this;

        getTerrain(): TerrainSpecification | null;

        showTerrainWireframe: boolean;

        /**
         *
         * @param lngLat The coordinate to query
         * @param options Optional {ElevationQueryOptions}
         * @returns The elevation in meters at mean sea level or null
         */
        queryTerrainElevation(lngLat: LngLatLike, options?: ElevationQueryOptions): number | null;

        setFeatureState(
            feature: FeatureIdentifier | vjmap.MapGeoJSONFeature,
            state: { [key: string]: any },
        ): void;

        getFeatureState(feature: FeatureIdentifier | vjmap.MapGeoJSONFeature): { [key: string]: any };

        removeFeatureState(target: FeatureIdentifier | vjmap.MapGeoJSONFeature, key?: string): void;

        getContainer(): HTMLElement;

        getCanvasContainer(): HTMLElement;

        getCanvas(): HTMLCanvasElement;

        loaded(): boolean;

        remove(): void;

        triggerRepaint(): void;

        showTileBoundaries: boolean;

        showCollisionBoxes: boolean;

        /**
         * Gets and sets a Boolean indicating whether the map will visualize
         * the padding offsets.
         *
         * @name showPadding
         * @type {boolean}
         * @instance
         * @memberof Map
         */
        showPadding: boolean;

        repaint: boolean;

        getCenter(): vjmap.LngLat;

        setCenter(center: LngLatLike, eventData?: vjmap.EventData): this;

        panBy(offset: PointLike, options?: vjmap.AnimationOptions, eventData?: vjmap.EventData): this;

        panTo(lnglat: LngLatLike, options?: vjmap.AnimationOptions, eventdata?: vjmap.EventData): this;

        getZoom(): number;

        setZoom(zoom: number, eventData?: vjmap.EventData): this;

        zoomTo(zoom: number, options?: vjmap.AnimationOptions, eventData?: vjmap.EventData): this;

        zoomIn(options?: vjmap.AnimationOptions, eventData?: vjmap.EventData): this;

        zoomOut(options?: vjmap.AnimationOptions, eventData?: vjmap.EventData): this;

        getBearing(): number;

        setBearing(bearing: number, eventData?: vjmap.EventData): this;

        /**
         * Returns the current padding applied around the map viewport.
         *
         * @memberof Map#
         * @returns The current padding around the map viewport.
         */
        getPadding(): PaddingOptions;

        /**
         * Sets the padding in pixels around the viewport.
         *
         * Equivalent to `jumpTo({padding: padding})`.
         *
         * @memberof Map#
         * @param padding The desired padding. Format: { left: number, right: number, top: number, bottom: number }
         * @param eventData Additional properties to be added to event objects of events triggered by this method.
         * @fires movestart
         * @fires moveend
         * @returns {Map} `this`
         * @example
         * // Sets a left padding of 300px, and a top padding of 50px
         * map.setPadding({ left: 300, top: 50 });
         */
        setPadding(padding: PaddingOptions, eventData?: EventData): this;

        rotateTo(bearing: number, options?: vjmap.AnimationOptions, eventData?: EventData): this;

        resetNorth(options?: vjmap.AnimationOptions, eventData?: vjmap.EventData): this;

        resetNorthPitch(options?: vjmap.AnimationOptions | null, eventData?: vjmap.EventData | null): this;

        snapToNorth(options?: vjmap.AnimationOptions, eventData?: vjmap.EventData): this;

        getPitch(): number;

        setPitch(pitch: number, eventData?: EventData): this;

        cameraForBounds(bounds: LngLatBoundsLike, options?: CameraForBoundsOptions): CameraForBoundsResult | undefined;

        fitBounds(bounds: LngLatBoundsLike, options?: vjmap.FitBoundsOptions, eventData?: vjmap.EventData): this;

        fitScreenCoordinates(
            p0: PointLike,
            p1: PointLike,
            bearing: number,
            options?: AnimationOptions & CameraOptions,
            eventData?: EventData,
        ): this;

        jumpTo(options: vjmap.CameraOptions, eventData?: vjmap.EventData): this;

        /**
         * Returns position and orientation of the camera entity.
         *
         * @memberof Map#
         * @returns {FreeCameraOptions} The camera state
         */
        getFreeCameraOptions(): FreeCameraOptions;

        /**
         * FreeCameraOptions provides more direct access to the underlying camera entity.
         * For backwards compatibility the state set using this API must be representable with
         * `CameraOptions` as well. Parameters are clamped into a valid range or discarded as invalid
         * if the conversion to the pitch and bearing presentation is ambiguous. For example orientation
         * can be invalid if it leads to the camera being upside down, the quaternion has zero length,
         * or the pitch is over the maximum pitch limit.
         *
         * @memberof Map#
         * @param {FreeCameraOptions} options FreeCameraOptions object
         * @param eventData Additional properties to be added to event objects of events triggered by this method.
         * @fires movestart
         * @fires zoomstart
         * @fires pitchstart
         * @fires rotate
         * @fires move
         * @fires zoom
         * @fires pitch
         * @fires moveend
         * @fires zoomend
         * @fires pitchend
         * @returns {Map} `this`
         */
        setFreeCameraOptions(options: FreeCameraOptions, eventData?: Object): this;

        easeTo(options: vjmap.EaseToOptions, eventData?: vjmap.EventData): this;

        flyTo(options: vjmap.FlyToOptions, eventData?: vjmap.EventData): this;

        isEasing(): boolean;

        stop(): this;

        on<T extends keyof MapLayerEventType>(
            type: T,
            layer: string | ReadonlyArray<string>,
            listener: (ev: MapLayerEventType[T] & EventData) => void,
        ): this;
        on<T extends keyof MapEventType>(type: T, listener: (ev: MapEventType[T] & EventData) => void): this;
        on(type: string, listener: (ev: any) => void): this;

        once<T extends keyof MapLayerEventType>(
            type: T,
            layer: string,
            listener: (ev: MapLayerEventType[T] & EventData) => void,
        ): this;
        once<T extends keyof MapEventType>(type: T, listener: (ev: MapEventType[T] & EventData) => void): this;
        once(type: string, listener: (ev: any) => void): this;
        once<T extends keyof MapEventType>(type: T): Promise<MapEventType[T]>;

        off<T extends keyof MapLayerEventType>(
            type: T,
            layer: string,
            listener: (ev: MapLayerEventType[T] & EventData) => void,
        ): this;
        off<T extends keyof MapEventType>(type: T, listener: (ev: MapEventType[T] & EventData) => void): this;
        off(type: string, listener: (ev: any) => void): this;

        scrollZoom: ScrollZoomHandler;

        boxZoom: BoxZoomHandler;

        dragRotate: DragRotateHandler;

        dragPan: DragPanHandler;

        keyboard: KeyboardHandler;

        doubleClickZoom: DoubleClickZoomHandler;

        touchZoomRotate: TouchZoomRotateHandler;

        touchPitch: TouchPitchHandler;

        getFog(): Fog | null;
        setFog(fog: Fog): this;
    }

    export interface MapOptions {
        /**
         * If true, the gl context will be created with MSA antialiasing, which can be useful for antialiasing custom layers.
         * This is false by default as a performance optimization.
         */
        antialias?: boolean | undefined;

        /** If true, an attribution control will be added to the map. */
        attributionControl?: boolean | undefined;

        bearing?: number | undefined;

        /** Snap to north threshold in degrees. */
        bearingSnap?: number | undefined;

        /** The initial bounds of the map. If bounds is specified, it overrides center and zoom constructor options. */
        bounds?: LngLatBoundsLike | undefined;

        /** If true, enable the "box zoom" interaction (see BoxZoomHandler) */
        boxZoom?: boolean | undefined;

        /** initial map center */
        center?: LngLatLike | undefined;

        /**
         * The max number of pixels a user can shift the mouse pointer during a click for it to be
         * considered a valid click (as opposed to a mouse drag).
         *
         * @default 3
         */
        clickTolerance?: number | undefined;

        /**
         * If `true`, Resource Timing API information will be collected for requests made by GeoJSON
         * and Vector Tile web workers (this information is normally inaccessible from the main
         * Javascript thread). Information will be returned in a `resourceTiming` property of
         * relevant `data` events.
         *
         * @default false
         */
        collectResourceTiming?: boolean | undefined;

        /**
         * If `true`, symbols from multiple sources can collide with each other during collision
         * detection. If `false`, collision detection is run separately for the symbols in each source.
         *
         * @default true
         */
        crossSourceCollisions?: boolean | undefined;

        /** ID of the container element */
        container: string | HTMLElement;

        /**
         * If `true` , scroll zoom will require pressing the ctrl or ⌘ key while scrolling to zoom map,
         * and touch pan will require using two fingers while panning to move the map.
         * Touch pitch will require three fingers to activate if enabled.
         */
        cooperativeGestures?: boolean;

        /** String or strings to show in an AttributionControl.
         * Only applicable if options.attributionControl is `true`. */
        customAttribution?: string | string[] | undefined;

        /**
         * If `true`, the "drag to pan" interaction is enabled.
         * An `Object` value is passed as options to {@link DragPanHandler#enable}.
         */
        dragPan?: boolean | DragPanOptions | undefined;

        /** If true, enable the "drag to rotate" interaction (see DragRotateHandler). */
        dragRotate?: boolean | undefined;

        /** If true, enable the "double click to zoom" interaction (see DoubleClickZoomHandler). */
        doubleClickZoom?: boolean | undefined;

        /** If `true`, the map's position (zoom, center latitude, center longitude, bearing, and pitch) will be synced with the hash fragment of the page's URL.
         * For example, `http://path/to/my/page.html#2.59/39.26/53.07/-24.1/60`.
         * An additional string may optionally be provided to indicate a parameter-styled hash,
         * e.g. http://path/to/my/page.html#map=2.59/39.26/53.07/-24.1/60&foo=bar, where foo
         * is a custom parameter and bar is an arbitrary hash distinct from the map hash.
         * */
        hash?: boolean | string | undefined;

        /**
         * Controls the duration of the fade-in/fade-out animation for label collisions, in milliseconds.
         * This setting affects all symbol layers. This setting does not affect the duration of runtime
         * styling transitions or raster tile cross-fading.
         *
         * @default 300
         */
        fadeDuration?: number | undefined;

        /** If true, map creation will fail if the implementation determines that the performance of the created WebGL context would be dramatically lower than expected. */
        failIfMajorPerformanceCaveat?: boolean | undefined;

        /** A fitBounds options object to use only when setting the bounds option. */
        fitBoundsOptions?: FitBoundsOptions | undefined;

        /** If false, no mouse, touch, or keyboard listeners are attached to the map, so it will not respond to input */
        interactive?: boolean | undefined;

        /** If true, enable keyboard shortcuts (see KeyboardHandler). */
        keyboard?: boolean | undefined;

        /** A patch to apply to the default localization table for UI strings, e.g. control tooltips.
         * The `locale` object maps namespaced UI string IDs to translated strings in the target language;
         * see `src/ui/default_locale.js` for an example with all supported string IDs.
         * The object may specify all UI strings (thereby adding support for a new translation) or
         * only a subset of strings (thereby patching the default translation table).
         */
        locale?: { [key: string]: string } | undefined;

        /**
         * Overrides the generation of all glyphs and font settings except font-weight keywords
         * Also overrides localIdeographFontFamily
         * @default null
         */
        localFontFamily?: string | undefined;

        /**
         * If specified, defines a CSS font-family for locally overriding generation of glyphs in the
         * 'CJK Unified Ideographs' and 'Hangul Syllables' ranges. In these ranges, font settings from
         * the map's style will be ignored, except for font-weight keywords (light/regular/medium/bold).
         * The purpose of this option is to avoid bandwidth-intensive glyph server requests.
         *
         * @default null
         */
        localIdeographFontFamily?: string | undefined;

        /**
         * A string representing the position of the Map wordmark on the map.
         *
         * @default "bottom-left"
         */
        logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | undefined;

        /** If set, the map is constrained to the given bounds. */
        maxBounds?: LngLatBoundsLike | undefined;

        /** Maximum pitch of the map. */
        maxPitch?: number | undefined;

        /** Maximum zoom of the map. */
        maxZoom?: number | undefined;

        /** Minimum pitch of the map. */
        minPitch?: number | undefined;

        /** Minimum zoom of the map. */
        minZoom?: number | undefined;

        /**
         * If true, map will prioritize rendering for performance by reordering layers
         * If false, layers will always be drawn in the specified order
         *
         * @default true
         */
        optimizeForTerrain?: boolean | undefined;

        /** If true, The maps canvas can be exported to a PNG using map.getCanvas().toDataURL();. This is false by default as a performance optimization. */
        preserveDrawingBuffer?: boolean | undefined;

        /**
         * The initial pitch (tilt) of the map, measured in degrees away from the plane of the
         * screen (0-60).
         *
         * @default 0
         */
        pitch?: number | undefined;

        /**
         * A style's projection property sets which projection a map is rendered in.
         *
         * @default 'mercator'
         */
         projection?: {
            name: 'albers' | 'equalEarth' | 'equirectangular' | 'lambertConformalConic' | 'mercator' | 'naturalEarth' | 'winkelTripel' | 'globe',
            center?: [number, number],
            parallels?: [number, number]
        };

        /**
         * If `false`, the map's pitch (tilt) control with "drag to rotate" interaction will be disabled.
         *
         * @default true
         */
        pitchWithRotate?: boolean | undefined;

        /**
         * If `false`, the map won't attempt to re-request tiles once they expire per their HTTP
         * `cacheControl`/`expires` headers.
         *
         * @default true
         */
        refreshExpiredTiles?: boolean | undefined;

        /**
         * If `true`, multiple copies of the world will be rendered, when zoomed out.
         *
         * @default true
         */
        renderWorldCopies?: boolean | undefined;

        /**
         * If `true`, the "scroll to zoom" interaction is enabled.
         * An `Object` value is passed as options to {@link ScrollZoomHandler#enable}.
         */
        scrollZoom?: boolean | InteractiveOptions | undefined;

        /** stylesheet location */
        style?: vjmap.Style | string | undefined;

        /** If  true, the map will automatically resize when the browser window resizes */
        trackResize?: boolean | undefined;

        /**
         * A callback run before the Map makes a request for an external URL. The callback can be
         * used to modify the url, set headers, or set the credentials property for cross-origin requests.
         *
         * @default null
         */
        transformRequest?: TransformRequestFunction | undefined;

        /**
         * If `true`, the "pinch to rotate and zoom" interaction is enabled.
         * An `Object` value is passed as options to {@link TouchZoomRotateHandler#enable}.
         */
        touchZoomRotate?: boolean | InteractiveOptions | undefined;

        /**
         * If `true`, the "drag to pitch" interaction is enabled.
         * An `Object` value is passed as options to {@link TouchPitchHandler#enable}.
         */
        touchPitch?: boolean | InteractiveOptions | undefined;

        /** Initial zoom level */
        zoom?: number | undefined;

        /**
         * The maximum number of tiles stored in the tile cache for a given source. If omitted, the
         * cache will be dynamically sized based on the current viewport.
         *
         * @default null
         */
        maxTileCacheSize?: number | undefined;

        /**
         * If specified, map will use this token instead of the one defined in vjmap.accessToken.
         *
         * @default null
         */
        accessToken?: string | undefined;

        /**
         * Allows for the usage of the map in automated tests without an accessToken with custom self-hosted test fixtures.
         *
         * @default null
         */
        testMode?: boolean | undefined;
    }

  export  type quat = number[];
  export  type vec3 = number[];

    /**
     * Various options for accessing physical properties of the underlying camera entity.
     * A direct access to these properties allows more flexible and precise controlling of the camera
     * while also being fully compatible and interchangeable with CameraOptions. All fields are optional.
     * See {@Link Camera#setFreeCameraOptions} and {@Link Camera#getFreeCameraOptions}
     *
     * @param {MercatorCoordinate} position Position of the camera in slightly modified web mercator coordinates
            - The size of 1 unit is the width of the projected world instead of the "mercator meter".
            Coordinate [0, 0, 0] is the north-west corner and [1, 1, 0] is the south-east corner.
            - Z coordinate is conformal and must respect minimum and maximum zoom values.
            - Zoom is automatically computed from the altitude (z)
    * @param {quat} orientation Orientation of the camera represented as a unit quaternion [x, y, z, w]
            in a left-handed coordinate space. Direction of the rotation is clockwise around the respective axis.
            The default pose of the camera is such that the forward vector is looking up the -Z axis and
            the up vector is aligned with north orientation of the map:
            forward: [0, 0, -1]
            up:      [0, -1, 0]
            right    [1, 0, 0]
            Orientation can be set freely but certain constraints still apply
            - Orientation must be representable with only pitch and bearing.
            - Pitch has an upper limit
    */
    export class FreeCameraOptions {
        constructor(position?: MercatorCoordinate, orientation?: quat);

        position: MercatorCoordinate | undefined;

        /**
         * Helper function for setting orientation of the camera by defining a focus point
         * on the map.
         *
         * @param {LngLatLike} location Location of the focus point on the map
         * @param {vec3} up Up vector of the camera is required in certain scenarios where bearing can't be deduced
         *      from the viewing direction.
         */
        lookAtPoint(location: LngLatLike, up?: vec3): void;

        /**
         * Helper function for setting the orientation of the camera as a pitch and a bearing.
         *
         * @param {number} pitch Pitch angle in degrees
         * @param {number} bearing Bearing angle in degrees
         */
        setPitchBearing(pitch: number, bearing: number): void;
    }

    export type ResourceType =
        | 'Unknown'
        | 'Style'
        | 'Source'
        | 'Tile'
        | 'Glyphs'
        | 'SpriteImage'
        | 'SpriteJSON'
        | 'Image';

    export interface RequestParameters {
        /**
         * The URL to be requested.
         */
        url: string;

        /**
         * Use `'include'` to send cookies with cross-origin requests.
         */
        credentials?: 'same-origin' | 'include' | undefined;

        /**
         * The headers to be sent with the request.
         */
        headers?: { [header: string]: any } | undefined;

        method?: 'GET' | 'POST' | 'PUT' | undefined;

        collectResourceTiming?: boolean | undefined;
    }

    export type TransformRequestFunction = (url: string, resourceType: ResourceType) => RequestParameters;

    export interface PaddingOptions {
        top: number;
        bottom: number;
        left: number;
        right: number;
    }

    export interface FeatureIdentifier {
        id?: string | number | undefined;
        source: string;
        sourceLayer?: string | undefined;
    }

    /**
     * BoxZoomHandler
     */
    export class BoxZoomHandler {
        constructor(map: vjmap.Map);

        isEnabled(): boolean;

        isActive(): boolean;

        enable(): void;

        disable(): void;
    }

    /**
     * ScrollZoomHandler
     */
    export class ScrollZoomHandler {
        constructor(map: vjmap.Map);

        isEnabled(): boolean;

        enable(options?: InteractiveOptions): void;

        disable(): void;

        setZoomRate(zoomRate: number): void;

        setWheelZoomRate(wheelZoomRate: number): void;
    }

    /**
     * DragPenHandler
     */
    export class DragPanHandler {
        constructor(map: vjmap.Map);

        isEnabled(): boolean;

        isActive(): boolean;

        enable(options?: DragPanOptions): void;

        disable(): void;
    }

    /**
     * DragRotateHandler
     */
    export class DragRotateHandler {
        constructor(
            map: vjmap.Map,
            options?: { bearingSnap?: number | undefined; pitchWithRotate?: boolean | undefined },
        );

        isEnabled(): boolean;

        isActive(): boolean;

        enable(): void;

        disable(): void;
    }

    /**
     * KeyboardHandler
     */
    export class KeyboardHandler {
        constructor(map: vjmap.Map);

        isEnabled(): boolean;

        enable(): void;

        disable(): void;

        /**
         * Returns true if the handler is enabled and has detected the start of a
         * zoom/rotate gesture.
         *
         * @returns {boolean} `true` if the handler is enabled and has detected the
         * start of a zoom/rotate gesture.
         */
        isActive(): boolean;

        /**
         * Disables the "keyboard pan/rotate" interaction, leaving the
         * "keyboard zoom" interaction enabled.
         *
         * @example
         *   map.keyboard.disableRotation();
         */
        disableRotation(): void;

        /**
         * Enables the "keyboard pan/rotate" interaction.
         *
         * @example
         *   map.keyboard.enable();
         *   map.keyboard.enableRotation();
         */
        enableRotation(): void;
    }

    /**
     * DoubleClickZoomHandler
     */
    export class DoubleClickZoomHandler {
        constructor(map: vjmap.Map);

        isEnabled(): boolean;

        enable(): void;

        disable(): void;
    }

    /**
     * TouchZoomRotateHandler
     */
    export class TouchZoomRotateHandler {
        constructor(map: vjmap.Map);

        isEnabled(): boolean;

        enable(options?: InteractiveOptions): void;

        disable(): void;

        disableRotation(): void;

        enableRotation(): void;
    }

    export class TouchPitchHandler {
        constructor(map: vjmap.Map);

        enable(options?: InteractiveOptions): void;

        isActive(): boolean;

        isEnabled(): boolean;

        disable(): void;
    }

    export interface IControl {
        onAdd(map: Map): HTMLElement;

        onRemove(map: Map): void;

        getDefaultPosition?: (() => string) | undefined;
    }

    /**
     * Control
     */
    export class Control extends Evented implements IControl {
        onAdd(map: Map): HTMLElement;
        onRemove(map: Map): void;
        getDefaultPosition?: (() => string) | undefined;
    }

    /**
     * Navigation
     */
    export class NavigationControl extends Control {
        constructor(options?: {
            showCompass?: boolean | undefined;
            showZoom?: boolean | undefined;
            visualizePitch?: boolean | undefined;
        });
    }

    export class PositionOptions {
        enableHighAccuracy?: boolean | undefined;
        timeout?: number | undefined;
        maximumAge?: number | undefined;
    }

    /**
     * Geolocate
     */
    export class GeolocateControl extends Control {
        constructor(options?: {
            positionOptions?: PositionOptions | undefined;
            fitBoundsOptions?: FitBoundsOptions | undefined;
            trackUserLocation?: boolean | undefined;
            showAccuracyCircle?: boolean | undefined;
            showUserLocation?: boolean | undefined;
            showUserHeading?: boolean | undefined;
        });
        trigger(): boolean;
    }

    /**
     * Attribution
     */
    export class AttributionControl extends Control {
        constructor(options?: { compact?: boolean | undefined; customAttribution?: string | string[] | undefined });
    }

    /**
     * Scale
     */
    export class ScaleControl extends Control {
        constructor(options?: { maxWidth?: number | undefined; unit?: string | undefined });

        setUnit(unit: 'imperial' | 'metric' | 'nautical'): void;
    }

    /**
     * FullscreenControl
     */
    export class FullscreenControl extends Control {
        constructor(options?: FullscreenControlOptions | null);
    }

    export interface FullscreenControlOptions {
        /**
         * A compatible DOM element which should be made full screen.
         * By default, the map container element will be made full screen.
         */
        container?: HTMLElement | null | undefined;
    }

    /**
     * Popup
     */
    export class Popup extends Evented {

        /**
         * 设置高度
         * @param height 高度值
         */
        setHeight(height: number): Popup;


        /**
         * 得到高度值
         */
        getHeight(): number | undefined;


        
        constructor(options?: vjmap.PopupOptions);

        addTo(map: vjmap.Map): this;

        isOpen(): boolean;

        remove(): this;

        getLngLat(): vjmap.LngLat;

        /**
         * Sets the geographical location of the popup's anchor, and moves the popup to it. Replaces trackPointer() behavior.
         *
         * @param lnglat The geographical location to set as the popup's anchor.
         */
        setLngLat(lnglat: LngLatLike): this;

        /**
         * Tracks the popup anchor to the cursor position, on screens with a pointer device (will be hidden on touchscreens). Replaces the setLngLat behavior.
         * For most use cases, `closeOnClick` and `closeButton` should also be set to `false` here.
         */
        trackPointer(): this;

        /** Returns the `Popup`'s HTML element. */
        getElement(): HTMLElement;

        setText(text: string): this;

        setHTML(html: string): this;

        setDOMContent(htmlNode: Node): this;

        getMaxWidth(): string;

        setMaxWidth(maxWidth: string): this;

        /**
         * Adds a CSS class to the popup container element.
         *
         * @param {string} className Non-empty string with CSS class name to add to popup container
         *
         * @example
         * let popup = new vjmap.Popup()
         * popup.addClassName('some-class')
         */
        addClassName(className: string): void;

        /**
         * Removes a CSS class from the popup container element.
         *
         * @param {string} className Non-empty string with CSS class name to remove from popup container
         *
         * @example
         * let popup = new vjmap.Popup()
         * popup.removeClassName('some-class')
         */
        removeClassName(className: string): void;

        /**
         * Sets the popup's offset.
         *
         * @param offset Sets the popup's offset.
         * @returns {Popup} `this`
         */
        setOffset(offset?: Offset | null): this;

        /**
         * Add or remove the given CSS class on the popup container, depending on whether the container currently has that class.
         *
         * @param {string} className Non-empty string with CSS class name to add/remove
         *
         * @returns {boolean} if the class was removed return false, if class was added, then return true
         *
         * @example
         * let popup = new vjmap.Popup()
         * popup.toggleClassName('toggleClass')
         */
        toggleClassName(className: string): void;
    }

    export interface PopupOptions {
        closeButton?: boolean | undefined;

        closeOnClick?: boolean | undefined;

        /**
         * @param {boolean} [options.closeOnMove=false] If `true`, the popup will closed when the map moves.
         */
        closeOnMove?: boolean | undefined;

        /**
         * @param {boolean} [options.focusAfterOpen=true] If `true`, the popup will try to focus the
         *   first focusable element inside the popup.
         */
        focusAfterOpen?: boolean | null | undefined;

        anchor?: Anchor | undefined;

        offset?: Offset | null | undefined;

        className?: string | undefined;

        maxWidth?: string | undefined;
    }

    export interface Style {
        layers: AnyLayer[];
        sources: Sources;

        bearing?: number | undefined;
        center?: number[] | undefined;
        fog?: Fog | undefined;
        glyphs?: string | undefined;
        metadata?: any;
        name?: string | undefined;
        pitch?: number | undefined;
        light?: Light | undefined;
        sprite?: string | undefined;
        terrain?: TerrainSpecification | undefined;
        transition?: Transition | undefined;
        version: number;
        zoom?: number | undefined;
    }

    export interface Transition {
        delay?: number | undefined;
        duration?: number | undefined;
    }

    export interface Light {
        anchor?: 'map' | 'viewport' | undefined;
        position?: number[] | undefined;
        'position-transition'?: Transition | undefined;
        color?: string | undefined;
        'color-transition'?: Transition | undefined;
        intensity?: number | undefined;
        'intensity-transition'?: Transition | undefined;
    }

    export interface Fog {
        color?: string | Expression | undefined;
        'horizon-blend'?: number | Expression | undefined;
        range?: number[] | Expression | undefined;
    }

    export interface Sources {
        [sourceName: string]: AnySourceData;
    }

    export type PromoteIdSpecification = { [key: string]: string } | string;

    export type AnySourceData =
        | GeoJSONSourceRaw
        | VideoSourceRaw
        | ImageSourceRaw
        | CanvasSourceRaw
        | VectorSource
        | RasterSource
        | RasterDemSource
        | CustomSourceInterface<HTMLImageElement | ImageData | ImageBitmap>;

    interface VectorSourceImpl extends VectorSource {
        /**
         * Sets the source `tiles` property and re-renders the map.
         *
         * @param {string[]} tiles An array of one or more tile source URLs, as in the TileJSON spec.
         * @returns {VectorTileSource} this
         */
        setTiles(tiles: ReadonlyArray<string>): VectorSourceImpl;

        /**
         * Sets the source `url` property and re-renders the map.
         *
         * @param {string} url A URL to a TileJSON resource. Supported protocols are `http:`, `https:`, and `Map://<Tileset ID>`.
         * @returns {VectorTileSource} this
         */
        setUrl(url: string): VectorSourceImpl;
    }

    export type AnySourceImpl =
        | GeoJSONSource
        | VideoSource
        | ImageSource
        | CanvasSource
        | VectorSourceImpl
        | RasterSource
        | RasterDemSource
        | CustomSource<HTMLImageElement | ImageData | ImageBitmap>;

    export interface Source {
        type: 'vector' | 'raster' | 'raster-dem' | 'geojson' | 'image' | 'video' | 'canvas' | 'custom';
    }

    /**
     * GeoJSONSource
     */

    export interface GeoJSONSourceRaw extends Source, GeoJSONSourceOptions {
        type: 'geojson';
    }

    export class GeoJSONSource implements GeoJSONSourceRaw {
        type: 'geojson';

        constructor(options?: vjmap.GeoJSONSourceOptions);

        setData(data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry> | String): this;

        getClusterExpansionZoom(clusterId: number, callback: (error: any, zoom: number) => void): this;

        getClusterChildren(
            clusterId: number,
            callback: (error: any, features: GeoJSON.Feature<GeoJSON.Geometry>[]) => void,
        ): this;

        getClusterLeaves(
            cluserId: number,
            limit: number,
            offset: number,
            callback: (error: any, features: GeoJSON.Feature<GeoJSON.Geometry>[]) => void,
        ): this;
    }

    export interface GeoJSONSourceOptions {
        data?: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry> | string | undefined;

        maxzoom?: number | undefined;

        attribution?: string | undefined;

        buffer?: number | undefined;

        tolerance?: number | undefined;

        cluster?: number | boolean | undefined;

        clusterRadius?: number | undefined;

        clusterMaxZoom?: number | undefined;

        /**
         * Minimum number of points necessary to form a cluster if clustering is enabled. Defaults to `2`.
         */
        clusterMinPoints?: number | undefined;

        clusterProperties?: object | undefined;

        lineMetrics?: boolean | undefined;

        generateId?: boolean | undefined;

        promoteId?: PromoteIdSpecification | undefined;

        filter?: any;
    }

    /**
     * VideoSource
     */
    export interface VideoSourceRaw extends Source, VideoSourceOptions {
        type: 'video';
    }

    export class VideoSource implements VideoSourceRaw {
        type: 'video';

        constructor(options?: vjmap.VideoSourceOptions);

        getVideo(): HTMLVideoElement;

        setCoordinates(coordinates: number[][]): this;
    }

    export interface VideoSourceOptions {
        urls?: string[] | undefined;

        coordinates?: number[][] | undefined;
    }

    /**
     * ImageSource
     */
    export interface ImageSourceRaw extends Source, ImageSourceOptions {
        type: 'image';
    }

    export class ImageSource implements ImageSourceRaw {
        type: 'image';

        constructor(options?: vjmap.ImageSourceOptions);

        updateImage(options: ImageSourceOptions): this;

        setCoordinates(coordinates: number[][]): this;
    }

    export interface ImageSourceOptions {
        url?: string | undefined;

        coordinates?: number[][] | undefined;
    }

    /**
     * CanvasSource
     */
    export interface CanvasSourceRaw extends Source, CanvasSourceOptions {
        type: 'canvas';
    }

    export class CanvasSource implements CanvasSourceRaw {
        type: 'canvas';

        coordinates: number[][];

        canvas: string | HTMLCanvasElement;

        play(): void;

        pause(): void;

        getCanvas(): HTMLCanvasElement;

        setCoordinates(coordinates: number[][]): this;
    }

    export interface CanvasSourceOptions {
        coordinates: number[][];

        animate?: boolean | undefined;

        canvas: string | HTMLCanvasElement;
    }

    export type CameraFunctionSpecification<T> =
        | { type: 'exponential'; stops: Array<[number, T]> }
        | { type: 'interval'; stops: Array<[number, T]> };

    export type ExpressionSpecification = Array<unknown>;

    export type PropertyValueSpecification<T> = T | CameraFunctionSpecification<T> | ExpressionSpecification;

    export interface TerrainSpecification {
        source: string;
        exaggeration?: PropertyValueSpecification<number> | undefined;
    }

    /**
     * @see https://github.com/Map/tilejson-spec/tree/master/3.0.0#33-vector_layers
     */
  export  type SourceVectorLayer = {
        id: string;
        fields?: Record<string, string>;
        description?: string;
        minzoom?: number;
        maxzoom?: number;

        // Non standard extensions that are valid in a Map context.
        source?: string;
        source_name?: string;
    };

    interface VectorSource extends Source {
        type: 'vector';
        format?: 'pbf';

        url?: string | undefined;
        id?: string;
        name?: string;

        tiles?: string[] | undefined;
        bounds?: number[] | undefined;
        scheme?: 'xyz' | 'tms' | undefined;
        minzoom?: number | undefined;
        maxzoom?: number | undefined;
        attribution?: string | undefined;
        promoteId?: PromoteIdSpecification | undefined;

        vector_layers?: SourceVectorLayer[];
    }

    interface RasterSource extends Source {
        name?: string;
        type: 'raster';
        id?: string;
        format?: 'webp' | string;

        url?: string | undefined;
        tiles?: string[] | undefined;
        bounds?: number[] | undefined;
        minzoom?: number | undefined;
        maxzoom?: number | undefined;
        tileSize?: number | undefined;
        scheme?: 'xyz' | 'tms' | undefined;
        attribution?: string | undefined;
    }

    interface RasterDemSource extends Source {
        name?: string;
        type: 'raster-dem';
        id?: string;

        url?: string | undefined;
        tiles?: string[] | undefined;
        bounds?: number[] | undefined;
        minzoom?: number | undefined;
        maxzoom?: number | undefined;
        tileSize?: number | undefined;
        attribution?: string | undefined;
        encoding?: 'terrarium' | 'Map' | undefined;
    }

    interface CustomSourceInterface<T> {
        id: string;
        type: 'custom';
        dataType: 'raster';
        minzoom?: number;
        maxzoom?: number;
        scheme?: string;
        tileSize?: number;
        attribution?: string;
        bounds?: [number, number, number, number];
        hasTile?: (tileID: { z: number, x: number, y: number }) => boolean;
        loadTile: (tileID: { z: number, x: number, y: number }, options: { signal: AbortSignal }) => Promise<T>;
        prepareTile?: (tileID: { z: number, x: number, y: number }) => T | undefined;
        unloadTile?: (tileID: { z: number, x: number, y: number }) => void;
        onAdd?: (map: Map) => void;
        onRemove?: (map: Map) => void;
    }

    interface CustomSource<T> extends Source {
        id: string;
        type: 'custom';
        scheme: string;
        minzoom: number;
        maxzoom: number;
        tileSize: number;
        attribution: string;

        _implementation: CustomSourceInterface<T>;
    }

    /**
     * LngLat
     */
    export class LngLat {
        lng: number;
        lat: number;

        constructor(lng: number, lat: number);

        /** Return a new LngLat object whose longitude is wrapped to the range (-180, 180). */
        wrap(): vjmap.LngLat;

        /** Return a LngLat as an array */
        toArray(): number[];

        /** Return a LngLat as a string */
        toString(): string;

        /** Returns the approximate distance between a pair of coordinates in meters
         * Uses the Haversine Formula (from R.W. Sinnott, "Virtues of the Haversine", Sky and Telescope, vol. 68, no. 2, 1984, p. 159) */
        distanceTo(lngLat: LngLat): number;

        toBounds(radius: number): LngLatBounds;

        static convert(input: LngLatLike): vjmap.LngLat;
    }

    /**
     * LngLatBounds
     */
    export class LngLatBounds {
        sw: LngLatLike;
        ne: LngLatLike;

        constructor(boundsLike?: [LngLatLike, LngLatLike] | [number, number, number, number]);
        constructor(sw: LngLatLike, ne: LngLatLike);

        setNorthEast(ne: LngLatLike): this;

        setSouthWest(sw: LngLatLike): this;

        /** Check if the point is within the bounding box. */
        contains(lnglat: LngLatLike): boolean;

        /** Extend the bounds to include a given LngLat or LngLatBounds. */
        extend(obj: LngLatLike | LngLatBoundsLike): this;

        /** Get the point equidistant from this box's corners */
        getCenter(): vjmap.LngLat;

        /** Get southwest corner */
        getSouthWest(): vjmap.LngLat;

        /** Get northeast corner */
        getNorthEast(): vjmap.LngLat;

        /** Get northwest corner */
        getNorthWest(): vjmap.LngLat;

        /** Get southeast corner */
        getSouthEast(): vjmap.LngLat;

        /** Get west edge longitude */
        getWest(): number;

        /** Get south edge latitude */
        getSouth(): number;

        /** Get east edge longitude */
        getEast(): number;

        /** Get north edge latitude */
        getNorth(): number;

        /** Returns a LngLatBounds as an array */
        toArray(): number[][];

        /** Return a LngLatBounds as a string */
        toString(): string;

        /** Returns a boolean */
        isEmpty(): boolean;

        /** Convert an array to a LngLatBounds object, or return an existing LngLatBounds object unchanged. */
        static convert(input: LngLatBoundsLike): vjmap.LngLatBounds;
    }

    /**
     * Point
     */
    // Todo: Pull out class to seperate definition for Module "point-geometry"
    export class Point {
        x: number;
        y: number;

        constructor(x: number, y: number);

        clone(): Point;

        add(p: Point): Point;

        sub(p: Point): Point;

        mult(k: number): Point;

        div(k: number): Point;

        rotate(a: number): Point;

        matMult(m: number): Point;

        unit(): Point;

        perp(): Point;

        round(): Point;

        mag(): number;

        equals(p: Point): boolean;

        dist(p: Point): number;

        distSqr(p: Point): number;

        angle(): number;

        angleTo(p: Point): number;

        angleWidth(p: Point): number;

        angleWithSep(x: number, y: number): number;

        static convert(a: PointLike): Point;
    }

    /**
     * MercatorCoordinate
     */
    export class MercatorCoordinate {
        /** The x component of the position. */
        x: number;

        /** The y component of the position. */
        y: number;

        /**
         * The z component of the position.
         *
         * @default 0
         */
        z?: number | undefined;

        constructor(x: number, y: number, z?: number);

        /** Returns the altitude in meters of the coordinate. */
        toAltitude(): number;

        /** Returns the LngLat for the coordinate. */
        toLngLat(): LngLat;

        /**
         * Returns the distance of 1 meter in MercatorCoordinate units at this latitude.
         *
         * For coordinates in real world units using meters, this naturally provides the
         * scale to transform into MercatorCoordinates.
         */
        meterInMercatorCoordinateUnits(): number;

        /** Project a LngLat to a MercatorCoordinate. */
        static fromLngLat(lngLatLike: LngLatLike, altitude?: number): MercatorCoordinate;
    }

    /**
     * Marker
     */
    export class Marker extends Evented {

        /**
         * 设置动画
         * @param animationType
         * MAP_ANIMATION_NONE 无动画
         * MAP_ANIMATION_BOUNCE 弹跳
         * MAP_ANIMATION_DROP 坠落
         */
        setAnimation(animationType: string): void;

        /**
         * 设置颜色
         * @param color 颜色
         */
        setColor(color: string): void;

        /**
         * 显示
         */
        show(): void;

        /**
         * 隐藏
         */
        hide(): void;

        /**
         * 获取是否隐藏了，当设置了hide或缩放级别或视图范围外不可见时，返回true，否则返回false
         */
        isHidden(): boolean;

        /**
         * 设置光标
         * @param cur 光标名称
         */
        setCursor(cur: string): void;

        /**
         * 设置高度
         * @param height 高度值
         */
        setHeight(height: number): Marker;

        /**
         * 设置显示的最小缩放级别
         * @param zoom 缩放级别
         */
        setMinZoom(zoom: number): Marker;

        /**
         * 设置显示的最大缩放级别
         * @param zoom 缩放级别
         */
        setMaxZoom(zoom: number): Marker;

        /**
         * 设置当marker不在当前地图视图范围内时，将自动移除。进入视图范围内时，将自动增加上，当自动移除或增加时，将触发`autoAdd`和`autoRemove`事件
         * @param autoRemove true不在当前地图视图范围内时，将自动移除，false不会自动移除
         * @param padding 范围向外扩的像素范围，默认500px，向视图范围往外扩些像素，在平移的时候，能看到marker，体验效果好些。
         */
        setRemoveWhenNoInMapView(autoRemove: boolean, padding?: number): Marker;

        /**
         * 设置能缩放的最大级别。如果小于这个级别，div将根据缩小级别自动缩小比例。默认不会自动缩放，当自动移除或增加时，将触发`autoAdd`和`autoRemove`事件
         * @param zoom 缩放级别
         */
        setScaleMaxZoom(zoom: number): Marker;

        /**
         * 得到高度值
         */
        getHeight(): number | undefined;

        /**
         * 得到显示的最小缩放级别
         */
        getMinZoom(): number | undefined;

        /**
         * 得到显示的最大缩放级别
         */
        getMaxZoom(): number | undefined;

        /**
         * 得到能缩放的最大级别。如果小于这个级别，div将根据缩小级别自动缩小比例。默认不会自动缩放
         */
        getScaleMaxZoom(zoom: number): number | undefined;

        /**
         * 得到当marker不在当前地图视图范围内时，将自动移除。进入视图范围内时，将自动增加上
         */
        getRemoveWhenNoInMapView(): boolean;

        /**
         * 设置是否显示隐藏
         * @param visible 是否显示
         * @param isDisplay true的话，表示用style的display去控制隐藏显示，dom还在文档中。false的话，会从文档动态清空增加
         */
        setVisible(visible?: boolean, isDisplay?: boolean): Marker;

        
        constructor(options?: vjmap.MarkerOptions);

        constructor(element?: HTMLElement, options?: vjmap.MarkerOptions);

        addTo(map: Map): this;

        remove(): this;

        getLngLat(): LngLat;

        setLngLat(lngLat: LngLatLike): this;

        getElement(): HTMLElement;

        setPopup(popup?: Popup): this;

        getPopup(): Popup;

        togglePopup(): this;

        getOffset(): PointLike;

        setOffset(offset: PointLike): this;

        setDraggable(shouldBeDraggable: boolean): this;

        isDraggable(): boolean;

        getRotation(): number;

        setRotation(rotation: number): this;

        getRotationAlignment(): Alignment;

        setRotationAlignment(alignment: Alignment): this;

        getPitchAlignment(): Alignment;

        setPitchAlignment(alignment: Alignment): this;
    }

  export  type Alignment = 'map' | 'viewport' | 'auto';

    export interface MarkerOptions {
        /** DOM element to use as a marker. The default is a light blue, droplet-shaped SVG marker */
        element?: HTMLElement | undefined;

        /** The offset in pixels as a PointLike object to apply relative to the element's center. Negatives indicate left and up. */
        offset?: PointLike | undefined;

        /** A string indicating the part of the Marker that should be positioned closest to the coordinate set via Marker.setLngLat.
         * Options are `'center'`, `'top'`, `'bottom'`, `'left'`, `'right'`, `'top-left'`, `'top-right'`, `'bottom-left'`, and `'bottom-right'`.
         * The default value os `'center'`
         */
        anchor?: Anchor | undefined;

        /** The color to use for the default marker if options.element is not provided. The default is light blue (#3FB1CE). */
        color?: string | undefined;

        /** A boolean indicating whether or not a marker is able to be dragged to a new position on the map. The default value is false */
        draggable?: boolean | undefined;

        /**
         * The max number of pixels a user can shift the mouse pointer during a click on the marker for it to be considered a valid click
         * (as opposed to a marker drag). The default (0) is to inherit map's clickTolerance.
         */
        clickTolerance?: number | null | undefined;

        /** The rotation angle of the marker in degrees, relative to its `rotationAlignment` setting. A positive value will rotate the marker clockwise.
         * The default value is 0.
         */
        rotation?: number | undefined;

        /** `map` aligns the `Marker`'s rotation relative to the map, maintaining a bearing as the map rotates.
         * `viewport` aligns the `Marker`'s rotation relative to the viewport, agnostic to map rotations.
         * `auto` is equivalent to `viewport`.
         * The default value is `auto`
         */
        rotationAlignment?: Alignment | undefined;

        /** `map` aligns the `Marker` to the plane of the map.
         * `viewport` aligns the `Marker` to the plane of the viewport.
         * `auto` automatically matches the value of `rotationAlignment`.
         * The default value is `auto`.
         */
        pitchAlignment?: Alignment | undefined;

        /** The scale to use for the default marker if options.element is not provided.
         * The default scale (1) corresponds to a height of `41px` and a width of `27px`.
         */
        scale?: number | undefined;
    }

  export  type EventedListener = (object?: Object) => any;
    /**
     * Evented
     */
    export class Evented {
        on(type: string, listener: EventedListener): this;

        off(type?: string | any, listener?: EventedListener): this;

        once(type: string, listener: EventedListener): this;

        
        fire(type: string, properties?: { [key: string]: any }): this;
    }

    /**
     * StyleOptions
     */
    export interface StyleOptions {
        transition?: boolean | undefined;
    }

    export type MapGeoJSONFeature = GeoJSON.Feature<GeoJSON.Geometry> & {
        layer: Layer;
        source: string;
        sourceLayer: string;
        state: { [key: string]: any };
    };

    export type EventData = { [key: string]: any };

    export class MapEvent<TOrig = undefined> {
        type: string;
        target: Map;
        originalEvent: TOrig;
    }

    export class MapMouseEvent extends MapEvent<MouseEvent> {
        type:
            | 'mousedown'
            | 'mouseup'
            | 'click'
            | 'dblclick'
            | 'mousemove'
            | 'mouseover'
            | 'mouseenter'
            | 'mouseleave'
            | 'mouseout'
            | 'contextmenu';

        point: Point;
        lngLat: LngLat;

        preventDefault(): void;
        defaultPrevented: boolean;
    }

    export type MapLayerMouseEvent = MapMouseEvent & { features?: MapGeoJSONFeature[] | undefined };

    export class MapTouchEvent extends MapEvent<TouchEvent> {
        type: 'touchstart' | 'touchend' | 'touchcancel';

        point: Point;
        lngLat: LngLat;
        points: Point[];
        lngLats: LngLat[];

        preventDefault(): void;
        defaultPrevented: boolean;
    }

    export type MapLayerTouchEvent = MapTouchEvent & { features?: MapGeoJSONFeature[] | undefined };

    export class MapWheelEvent extends MapEvent<WheelEvent> {
        type: 'wheel';

        preventDefault(): void;
        defaultPrevented: boolean;
    }

    export interface MapZoomEvent extends MapEvent<MouseEvent> {
        type: 'boxzoomstart' | 'boxzoomend' | 'boxzoomcancel';

        boxZoomBounds: LngLatBounds;
    }

    export type MapDataEvent = MapSourceDataEvent | MapStyleDataEvent;

    export interface MapStyleDataEvent extends MapEvent {
        dataType: 'style';
    }

    export interface MapSourceDataEvent extends MapEvent {
        dataType: 'source';
        isSourceLoaded: boolean;
        source: Source;
        sourceId: string;
        sourceDataType: 'metadata' | 'content';
        tile: any;
        coord: Coordinate;
    }

    export interface Coordinate {
        canonical: CanonicalCoordinate;
        wrap: number;
        key: number;
    }

    export interface CanonicalCoordinate {
        x: number;
        y: number;
        z: number;
        key: number;
        equals(coord: CanonicalCoordinate): boolean;
    }

    export interface MapContextEvent extends MapEvent<WebGLContextEvent> {
        type: 'webglcontextlost' | 'webglcontextrestored';
    }

    export class ErrorEvent extends MapEvent {
        type: 'error';
        error: Error;
    }

    /**
     * FilterOptions
     */
    export interface FilterOptions {
        /**
         * Whether to check if the filter conforms to the Map GL Style Specification.
         * Disabling validation is a performance optimization that should only be used
         * if you have previously validated the values you will be passing to this function.
         */
        validate?: boolean | null | undefined;
    }

    /**
     * AnimationOptions
     */
    export interface AnimationOptions {
        /** Number in milliseconds */
        duration?: number | undefined;
        /**
         * A function taking a time in the range 0..1 and returning a number where 0 is the initial
         * state and 1 is the final state.
         */
        easing?: ((time: number) => number) | undefined;
        /** point, origin of movement relative to map center */
        offset?: PointLike | undefined;
        /** When set to false, no animation happens */
        animate?: boolean | undefined;

        /** If `true`, then the animation is considered essential and will not be affected by `prefers-reduced-motion`.
         * Otherwise, the transition will happen instantly if the user has enabled the `reduced motion` accesibility feature in their operating system.
         */
        essential?: boolean | undefined;
    }

    /**
     * CameraOptions
     */
    export interface CameraOptions {
        /** Map center */
        center?: LngLatLike | undefined;
        /** Map zoom level */
        zoom?: number | undefined;
        /** Map rotation bearing in degrees counter-clockwise from north */
        bearing?: number | undefined;
        /** Map angle in degrees at which the camera is looking at the ground */
        pitch?: number | undefined;
        /** If zooming, the zoom center (defaults to map center) */
        around?: LngLatLike | undefined;
        /** Dimensions in pixels applied on each side of the viewport for shifting the vanishing point. */
        padding?: number | PaddingOptions | undefined;
    }

    export interface CameraForBoundsOptions extends CameraOptions {
        offset?: PointLike | undefined;
        maxZoom?: number | undefined;
    }

    // The Map docs say that if the result is defined, it will have zoom, center and bearing set.
    // In practice center is always a {lat, lng} object.
    export type CameraForBoundsResult = Required<Pick<CameraOptions, 'zoom' | 'bearing'>> & {
        /** Map center */
        center: { lng: number; lat: number };
    };

    /**
     * FlyToOptions
     */
    export interface FlyToOptions extends AnimationOptions, CameraOptions {
        curve?: number | undefined;
        minZoom?: number | undefined;
        speed?: number | undefined;
        screenSpeed?: number | undefined;
        maxDuration?: number | undefined;
    }

    /**
     * EaseToOptions
     */
    export interface EaseToOptions extends AnimationOptions, CameraOptions {
        delayEndEvents?: number | undefined;
    }

    export interface FitBoundsOptions extends vjmap.FlyToOptions {
        linear?: boolean | undefined;
        offset?: PointLike | undefined;
        maxZoom?: number | undefined;
        maxDuration?: number | undefined;
    }

    /**
     * MapEvent
     */
    export type MapEventType = {
        error: ErrorEvent;

        load: MapEvent;
        idle: MapEvent;
        remove: MapEvent;
        render: MapEvent;
        resize: MapEvent;

        webglcontextlost: MapContextEvent;
        webglcontextrestored: MapContextEvent;

        dataloading: MapDataEvent;
        data: MapDataEvent;
        tiledataloading: MapDataEvent;
        sourcedataloading: MapSourceDataEvent;
        styledataloading: MapStyleDataEvent;
        sourcedata: MapSourceDataEvent;
        styledata: MapStyleDataEvent;

        boxzoomcancel: MapZoomEvent;
        boxzoomstart: MapZoomEvent;
        boxzoomend: MapZoomEvent;

        touchcancel: MapTouchEvent;
        touchmove: MapTouchEvent;
        touchend: MapTouchEvent;
        touchstart: MapTouchEvent;

        click: MapMouseEvent;
        contextmenu: MapMouseEvent;
        dblclick: MapMouseEvent;
        mousemove: MapMouseEvent;
        mouseup: MapMouseEvent;
        mousedown: MapMouseEvent;
        mouseout: MapMouseEvent;
        mouseover: MapMouseEvent;

        movestart: MapEvent<MouseEvent | TouchEvent | WheelEvent | undefined>;
        move: MapEvent<MouseEvent | TouchEvent | WheelEvent | undefined>;
        moveend: MapEvent<MouseEvent | TouchEvent | WheelEvent | undefined>;

        zoomstart: MapEvent<MouseEvent | TouchEvent | WheelEvent | undefined>;
        zoom: MapEvent<MouseEvent | TouchEvent | WheelEvent | undefined>;
        zoomend: MapEvent<MouseEvent | TouchEvent | WheelEvent | undefined>;

        rotatestart: MapEvent<MouseEvent | TouchEvent | undefined>;
        rotate: MapEvent<MouseEvent | TouchEvent | undefined>;
        rotateend: MapEvent<MouseEvent | TouchEvent | undefined>;

        dragstart: MapEvent<MouseEvent | TouchEvent | undefined>;
        drag: MapEvent<MouseEvent | TouchEvent | undefined>;
        dragend: MapEvent<MouseEvent | TouchEvent | undefined>;

        pitchstart: MapEvent<MouseEvent | TouchEvent | undefined>;
        pitch: MapEvent<MouseEvent | TouchEvent | undefined>;
        pitchend: MapEvent<MouseEvent | TouchEvent | undefined>;

        wheel: MapWheelEvent;
    };

    export type MapLayerEventType = {
        click: MapLayerMouseEvent;
        dblclick: MapLayerMouseEvent;
        mousedown: MapLayerMouseEvent;
        mouseup: MapLayerMouseEvent;
        mousemove: MapLayerMouseEvent;
        mouseenter: MapLayerMouseEvent;
        mouseleave: MapLayerMouseEvent;
        mouseover: MapLayerMouseEvent;
        mouseout: MapLayerMouseEvent;
        contextmenu: MapLayerMouseEvent;

        touchstart: MapLayerTouchEvent;
        touchend: MapLayerTouchEvent;
        touchcancel: MapLayerTouchEvent;
    };

    export type AnyLayout =
        | BackgroundLayout
        | FillLayout
        | FillExtrusionLayout
        | LineLayout
        | SymbolLayout
        | RasterLayout
        | CircleLayout
        | HeatmapLayout
        | HillshadeLayout
        | SkyLayout;

    export type AnyPaint =
        | BackgroundPaint
        | FillPaint
        | FillExtrusionPaint
        | LinePaint
        | SymbolPaint
        | RasterPaint
        | CirclePaint
        | HeatmapPaint
        | HillshadePaint
        | SkyPaint;

    interface Layer {
        id: string;
        type: string;

        metadata?: any;
        ref?: string | undefined;

        source?: string | AnySourceData | undefined;

        'source-layer'?: string | undefined;

        minzoom?: number | undefined;
        maxzoom?: number | undefined;

        interactive?: boolean | undefined;

        filter?: any[] | undefined;
        layout?: AnyLayout | undefined;
        paint?: AnyPaint | undefined;
    }

    interface BackgroundLayer extends Layer {
        type: 'background';
        layout?: BackgroundLayout | undefined;
        paint?: BackgroundPaint | undefined;
    }

    interface CircleLayer extends Layer {
        type: 'circle';
        layout?: CircleLayout | undefined;
        paint?: CirclePaint | undefined;
    }

    interface FillExtrusionLayer extends Layer {
        type: 'fill-extrusion';
        layout?: FillExtrusionLayout | undefined;
        paint?: FillExtrusionPaint | undefined;
    }

    interface FillLayer extends Layer {
        type: 'fill';
        layout?: FillLayout | undefined;
        paint?: FillPaint | undefined;
    }

    interface HeatmapLayer extends Layer {
        type: 'heatmap';
        layout?: HeatmapLayout | undefined;
        paint?: HeatmapPaint | undefined;
    }

    interface HillshadeLayer extends Layer {
        type: 'hillshade';
        layout?: HillshadeLayout | undefined;
        paint?: HillshadePaint | undefined;
    }

    interface LineLayer extends Layer {
        type: 'line';
        layout?: LineLayout | undefined;
        paint?: LinePaint | undefined;
    }

    interface RasterLayer extends Layer {
        type: 'raster';
        layout?: RasterLayout | undefined;
        paint?: RasterPaint | undefined;
    }

    interface SymbolLayer extends Layer {
        type: 'symbol';
        layout?: SymbolLayout | undefined;
        paint?: SymbolPaint | undefined;
    }

    interface SkyLayer extends Layer {
        type: 'sky';
        layout?: SkyLayout | undefined;
        paint?: SkyPaint | undefined;
    }

    export type AnyLayer =
        | BackgroundLayer
        | CircleLayer
        | FillExtrusionLayer
        | FillLayer
        | HeatmapLayer
        | HillshadeLayer
        | LineLayer
        | RasterLayer
        | SymbolLayer
        | CustomLayerInterface
        | SkyLayer;

    
    export interface CustomLayerInterface {
        /** A unique layer id. */
        id: string;

        /* The layer's type. Must be "custom". */
        type: 'custom';

        /* Either "2d" or "3d". Defaults to  "2d". */
        renderingMode?: '2d' | '3d' | undefined;

        /**
         * Optional method called when the layer has been removed from the Map with Map#removeLayer.
         * This gives the layer a chance to clean up gl resources and event listeners.
         * @param map The Map this custom layer was just added to.
         * @param gl The gl context for the map.
         */
        onRemove?(map: vjmap.Map, gl: WebGLRenderingContext): void;

        /**
         * Optional method called when the layer has been added to the Map with Map#addLayer.
         * This gives the layer a chance to initialize gl resources and register event listeners.
         * @param map The Map this custom layer was just added to.
         * @param gl The gl context for the map.
         */
        onAdd?(map: vjmap.Map, gl: WebGLRenderingContext): void;

        /**
         * Optional method called during a render frame to allow a layer to prepare resources
         * or render into a texture.
         *
         * The layer cannot make any assumptions about the current GL state and must bind a framebuffer
         * before rendering.
         * @param gl The map's gl context.
         * @param matrix The map's camera matrix. It projects spherical mercator coordinates to gl
         *               coordinates. The mercator coordinate  [0, 0] represents the top left corner of
         *               the mercator world and  [1, 1] represents the bottom right corner. When the
         *               renderingMode is  "3d" , the z coordinate is conformal. A box with identical
         *               x, y, and z lengths in mercator units would be rendered as a cube.
         *               MercatorCoordinate .fromLatLng can be used to project a  LngLat to a mercator
         *               coordinate.
         */
        prerender?(gl: WebGLRenderingContext, matrix: number[]): void;

        /**
         * Called during a render frame allowing the layer to draw into the GL context.
         *
         * The layer can assume blending and depth state is set to allow the layer to properly blend
         * and clip other layers. The layer cannot make any other assumptions about the current GL state.
         *
         * If the layer needs to render to a texture, it should implement the prerender method to do this
         * and only use the render method for drawing directly into the main framebuffer.
         *
         * The blend function is set to gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA). This expects
         * colors to be provided in premultiplied alpha form where the r, g and b values are already
         * multiplied by the a value. If you are unable to provide colors in premultiplied form you may
         * want to change the blend function to
         * gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA).
         *
         * @param gl The map's gl context.
         * @param matrix The map's camera matrix. It projects spherical mercator coordinates to gl
         *               coordinates. The mercator coordinate  [0, 0] represents the top left corner of
         *               the mercator world and  [1, 1] represents the bottom right corner. When the
         *               renderingMode is  "3d" , the z coordinate is conformal. A box with identical
         *               x, y, and z lengths in mercator units would be rendered as a cube.
         *               MercatorCoordinate .fromLatLng can be used to project a  LngLat to a mercator
         *               coordinate.
         */
        render(gl: WebGLRenderingContext, matrix: number[]): void;
    }

    export interface StyleFunction {
        stops?: any[][] | undefined;
        property?: string | undefined;
        base?: number | undefined;
        type?: 'identity' | 'exponential' | 'interval' | 'categorical' | undefined;
        default?: any;
        colorSpace?: 'rgb' | 'lab' | 'hcl' | undefined;
    }

  export  type Visibility = 'visible' | 'none';

    export interface Layout {
        visibility?: Visibility | undefined;
    }

    export interface BackgroundLayout extends Layout {}

    export interface BackgroundPaint {
        'background-color'?: string | Expression | undefined;
        'background-color-transition'?: Transition | undefined;
        'background-pattern'?: string | undefined;
        'background-pattern-transition'?: Transition | undefined;
        'background-opacity'?: number | Expression | undefined;
        'background-opacity-transition'?: Transition | undefined;
    }

    export interface FillLayout extends Layout {
        'fill-sort-key'?: number | Expression | undefined;
    }

    export interface FillPaint {
        'fill-antialias'?: boolean | Expression | undefined;
        'fill-opacity'?: number | StyleFunction | Expression | undefined;
        'fill-opacity-transition'?: Transition | undefined;
        'fill-color'?: string | StyleFunction | Expression | undefined;
        'fill-color-transition'?: Transition | undefined;
        'fill-outline-color'?: string | StyleFunction | Expression | undefined;
        'fill-outline-color-transition'?: Transition | undefined;
        'fill-translate'?: number[] | undefined;
        'fill-translate-transition'?: Transition | undefined;
        'fill-translate-anchor'?: 'map' | 'viewport' | undefined;
        'fill-pattern'?: string | Expression | undefined;
        'fill-pattern-transition'?: Transition | undefined;
    }

    export interface FillExtrusionLayout extends Layout {}

    export interface FillExtrusionPaint {
        'fill-extrusion-opacity'?: number | Expression | undefined;
        'fill-extrusion-opacity-transition'?: Transition | undefined;
        'fill-extrusion-color'?: string | StyleFunction | Expression | undefined;
        'fill-extrusion-color-transition'?: Transition | undefined;
        'fill-extrusion-translate'?: number[] | Expression | undefined;
        'fill-extrusion-translate-transition'?: Transition | undefined;
        'fill-extrusion-translate-anchor'?: 'map' | 'viewport' | undefined;
        'fill-extrusion-pattern'?: string | Expression | undefined;
        'fill-extrusion-pattern-transition'?: Transition | undefined;
        'fill-extrusion-height'?: number | StyleFunction | Expression | undefined;
        'fill-extrusion-height-transition'?: Transition | undefined;
        'fill-extrusion-base'?: number | StyleFunction | Expression | undefined;
        'fill-extrusion-base-transition'?: Transition | undefined;
        'fill-extrusion-vertical-gradient'?: boolean | undefined;
    }

    export interface LineLayout extends Layout {
        'line-cap'?: 'butt' | 'round' | 'square' | Expression | undefined;
        'line-join'?: 'bevel' | 'round' | 'miter' | Expression | undefined;
        'line-miter-limit'?: number | Expression | undefined;
        'line-round-limit'?: number | Expression | undefined;
        'line-sort-key'?: number | Expression | undefined;
    }

    export interface LinePaint {
        'line-opacity'?: number | StyleFunction | Expression | undefined;
        'line-opacity-transition'?: Transition | undefined;
        'line-color'?: string | StyleFunction | Expression | undefined;
        'line-color-transition'?: Transition | undefined;
        'line-translate'?: number[] | Expression | undefined;
        'line-translate-transition'?: Transition | undefined;
        'line-translate-anchor'?: 'map' | 'viewport' | undefined;
        'line-width'?: number | StyleFunction | Expression | undefined;
        'line-width-transition'?: Transition | undefined;
        'line-gap-width'?: number | StyleFunction | Expression | undefined;
        'line-gap-width-transition'?: Transition | undefined;
        'line-offset'?: number | StyleFunction | Expression | undefined;
        'line-offset-transition'?: Transition | undefined;
        'line-blur'?: number | StyleFunction | Expression | undefined;
        'line-blur-transition'?: Transition | undefined;
        'line-dasharray'?: number[] | Expression | undefined;
        'line-dasharray-transition'?: Transition | undefined;
        'line-pattern'?: string | Expression | undefined;
        'line-pattern-transition'?: Transition | undefined;
        'line-gradient'?: Expression | undefined;
    }

    export interface SymbolLayout extends Layout {
        'symbol-placement'?: 'point' | 'line' | 'line-center' | undefined;
        'symbol-spacing'?: number | Expression | undefined;
        'symbol-avoid-edges'?: boolean | undefined;
        'symbol-z-order'?: 'viewport-y' | 'source' | undefined;
        'icon-allow-overlap'?: boolean | StyleFunction | Expression | undefined;
        'icon-ignore-placement'?: boolean | Expression | undefined;
        'icon-optional'?: boolean | undefined;
        'icon-rotation-alignment'?: 'map' | 'viewport' | 'auto' | undefined;
        'icon-size'?: number | StyleFunction | Expression | undefined;
        'icon-text-fit'?: 'none' | 'both' | 'width' | 'height' | undefined;
        'icon-text-fit-padding'?: number[] | Expression | undefined;
        'icon-image'?: string | StyleFunction | Expression | undefined;
        'icon-rotate'?: number | StyleFunction | Expression | undefined;
        'icon-padding'?: number | Expression | undefined;
        'icon-keep-upright'?: boolean | undefined;
        'icon-offset'?: number[] | StyleFunction | Expression | undefined;
        'icon-anchor'?: Anchor | StyleFunction | Expression | undefined;
        'icon-pitch-alignment'?: 'map' | 'viewport' | 'auto' | undefined;
        'text-pitch-alignment'?: 'map' | 'viewport' | 'auto' | undefined;
        'text-rotation-alignment'?: 'map' | 'viewport' | 'auto' | undefined;
        'text-field'?: string | StyleFunction | Expression | undefined;
        'text-font'?: string[] | Expression | undefined;
        'text-size'?: number | StyleFunction | Expression | undefined;
        'text-max-width'?: number | StyleFunction | Expression | undefined;
        'text-line-height'?: number | Expression | undefined;
        'text-letter-spacing'?: number | Expression | undefined;
        'text-justify'?: 'auto' | 'left' | 'center' | 'right' | Expression | undefined;
        'text-anchor'?: Anchor | StyleFunction | Expression | undefined;
        'text-max-angle'?: number | Expression | undefined;
        'text-rotate'?: number | StyleFunction | Expression | undefined;
        'text-padding'?: number | Expression | undefined;
        'text-keep-upright'?: boolean | undefined;
        'text-transform'?: 'none' | 'uppercase' | 'lowercase' | StyleFunction | Expression | undefined;
        'text-offset'?: number[] | Expression | undefined;
        'text-allow-overlap'?: boolean | undefined;
        'text-ignore-placement'?: boolean | undefined;
        'text-optional'?: boolean | undefined;
        'text-radial-offset'?: number | Expression | undefined;
        'text-variable-anchor'?: Anchor[] | undefined;
        'text-writing-mode'?: ('horizontal' | 'vertical')[] | undefined;
        'symbol-sort-key'?: number | Expression | undefined;
    }

    export interface SymbolPaint {
        'icon-opacity'?: number | StyleFunction | Expression | undefined;
        'icon-opacity-transition'?: Transition | undefined;
        'icon-color'?: string | StyleFunction | Expression | undefined;
        'icon-color-transition'?: Transition | undefined;
        'icon-halo-color'?: string | StyleFunction | Expression | undefined;
        'icon-halo-color-transition'?: Transition | undefined;
        'icon-halo-width'?: number | StyleFunction | Expression | undefined;
        'icon-halo-width-transition'?: Transition | undefined;
        'icon-halo-blur'?: number | StyleFunction | Expression | undefined;
        'icon-halo-blur-transition'?: Transition | undefined;
        'icon-translate'?: number[] | Expression | undefined;
        'icon-translate-transition'?: Transition | undefined;
        'icon-translate-anchor'?: 'map' | 'viewport' | undefined;
        'text-opacity'?: number | StyleFunction | Expression | undefined;
        'text-opacity-transition'?: Transition | undefined;
        'text-color'?: string | StyleFunction | Expression | undefined;
        'text-color-transition'?: Transition | undefined;
        'text-halo-color'?: string | StyleFunction | Expression | undefined;
        'text-halo-color-transition'?: Transition | undefined;
        'text-halo-width'?: number | StyleFunction | Expression | undefined;
        'text-halo-width-transition'?: Transition | undefined;
        'text-halo-blur'?: number | StyleFunction | Expression | undefined;
        'text-halo-blur-transition'?: Transition | undefined;
        'text-translate'?: number[] | Expression | undefined;
        'text-translate-transition'?: Transition | undefined;
        'text-translate-anchor'?: 'map' | 'viewport' | undefined;
    }

    export interface RasterLayout extends Layout {}

    export interface RasterPaint {
        'raster-opacity'?: number | Expression | undefined;
        'raster-opacity-transition'?: Transition | undefined;
        'raster-hue-rotate'?: number | Expression | undefined;
        'raster-hue-rotate-transition'?: Transition | undefined;
        'raster-brightness-min'?: number | Expression | undefined;
        'raster-brightness-min-transition'?: Transition | undefined;
        'raster-brightness-max'?: number | Expression | undefined;
        'raster-brightness-max-transition'?: Transition | undefined;
        'raster-saturation'?: number | Expression | undefined;
        'raster-saturation-transition'?: Transition | undefined;
        'raster-contrast'?: number | Expression | undefined;
        'raster-contrast-transition'?: Transition | undefined;
        'raster-fade-duration'?: number | Expression | undefined;
        'raster-resampling'?: 'linear' | 'nearest' | undefined;
    }

    export interface CircleLayout extends Layout {
        'circle-sort-key'?: number | Expression | undefined;
    }

    export interface CirclePaint {
        'circle-radius'?: number | StyleFunction | Expression | undefined;
        'circle-radius-transition'?: Transition | undefined;
        'circle-color'?: string | StyleFunction | Expression | undefined;
        'circle-color-transition'?: Transition | undefined;
        'circle-blur'?: number | StyleFunction | Expression | undefined;
        'circle-blur-transition'?: Transition | undefined;
        'circle-opacity'?: number | StyleFunction | Expression | undefined;
        'circle-opacity-transition'?: Transition | undefined;
        'circle-translate'?: number[] | Expression | undefined;
        'circle-translate-transition'?: Transition | undefined;
        'circle-translate-anchor'?: 'map' | 'viewport' | undefined;
        'circle-pitch-scale'?: 'map' | 'viewport' | undefined;
        'circle-pitch-alignment'?: 'map' | 'viewport' | undefined;
        'circle-stroke-width'?: number | StyleFunction | Expression | undefined;
        'circle-stroke-width-transition'?: Transition | undefined;
        'circle-stroke-color'?: string | StyleFunction | Expression | undefined;
        'circle-stroke-color-transition'?: Transition | undefined;
        'circle-stroke-opacity'?: number | StyleFunction | Expression | undefined;
        'circle-stroke-opacity-transition'?: Transition | undefined;
    }

    export interface HeatmapLayout extends Layout {}

    export interface HeatmapPaint {
        'heatmap-radius'?: number | StyleFunction | Expression | undefined;
        'heatmap-radius-transition'?: Transition | undefined;
        'heatmap-weight'?: number | StyleFunction | Expression | undefined;
        'heatmap-intensity'?: number | StyleFunction | Expression | undefined;
        'heatmap-intensity-transition'?: Transition | undefined;
        'heatmap-color'?: string | StyleFunction | Expression | undefined;
        'heatmap-opacity'?: number | StyleFunction | Expression | undefined;
        'heatmap-opacity-transition'?: Transition | undefined;
    }

    export interface HillshadeLayout extends Layout {}

    export interface HillshadePaint {
        'hillshade-illumination-direction'?: number | Expression | undefined;
        'hillshade-illumination-anchor'?: 'map' | 'viewport' | undefined;
        'hillshade-exaggeration'?: number | Expression | undefined;
        'hillshade-exaggeration-transition'?: Transition | undefined;
        'hillshade-shadow-color'?: string | Expression | undefined;
        'hillshade-shadow-color-transition'?: Transition | undefined;
        'hillshade-highlight-color'?: string | Expression | undefined;
        'hillshade-highlight-color-transition'?: Transition | undefined;
        'hillshade-accent-color'?: string | Expression | undefined;
        'hillshade-accent-color-transition'?: Transition | undefined;
    }

    export interface SkyLayout extends Layout {}

    export interface SkyPaint {
        'sky-atmosphere-color'?: string | Expression | undefined;
        'sky-atmosphere-halo-color'?: string | Expression | undefined;
        'sky-atmosphere-sun'?: number[] | Expression | undefined;
        'sky-atmosphere-sun-intensity'?: number | Expression | undefined;
        'sky-gradient'?: string | Expression | undefined;
        'sky-gradient-center'?: number[] | Expression | undefined;
        'sky-gradient-radius'?: number | Expression | undefined;
        'sky-opacity'?: number | Expression | undefined;
        'sky-type'?: 'gradient' | 'atmosphere' | undefined;
    }

    export type ElevationQueryOptions = {
        exaggerated: boolean;
    };

}
