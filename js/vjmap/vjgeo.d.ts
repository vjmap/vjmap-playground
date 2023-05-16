/**
 * Schema objects for geo.
 *
 */
declare namespace vjgeo {
    /**
     * 二维空间中的 x-y 点.
     * 实现为具有 2 个元素的数组。第一个元素是 x，第二个元素是 y.
     *
     * Examples:
     * ```
     * var p: IPoint = [0, 0];   //typescript
     * var p = [0, 0];   //javascript
     * ```
     */
    interface IPoint {
        [index: number]: number;
    }
    /**
     * 直线、曲线或其他简单的二维形状。
     */
    interface IPath {
        /**
         * 路径的类型，例如“线”、“圆”或“圆弧”。这些字符串在路径类型中枚举.
         */
        "type": string;
        /**
         * 基点.
         */
        origin: IPoint;
        /**
         * 图层.
         */
        layer?: string;
        /**
        * 属性数据.
        */
        data?: IProperties;
    }
    /**
     * 线条路径.
     *
     * Examples:
     * ```
     * var line: IPathLine = { type: 'line', origin: [0, 0], end: [1, 1] };   //typescript
     * var line = { type: 'line', origin: [0, 0], end: [1, 1] };   //javascript
     * ```
     */
    interface IPathLine extends IPath {
        /**
         * 定义线的终点。起点是原点.
         */
        end: IPoint;
    }
    /**
     * 圆形路径.
     *
     * Examples:
     * ```
     * var circle: IPathCircle = { type: 'circle', origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: 'circle', origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    interface IPathCircle extends IPath {
        /**
         * The radius of the circle.
         */
        radius: number;
    }
    /**
     * 圆弧形路径.
     *
     * Examples:
     * ```
     * var arc: IPathArc = { type: 'arc', origin: [0, 0], radius: 7, startAngle: 0, endAngle: 45 };   //typescript
     * var arc = { type: 'arc', origin: [0, 0], radius: 7, startAngle: 0, endAngle: 45 };   //javascript
     * ```
     */
    interface IPathArc extends IPathCircle {
        /**
         * 开始绘制圆弧的角度（以度为单位）, 在（逆时针）方向.
         */
        startAngle: number;
        /**
         * 以（逆时针）方向结束绘制弧的角度（以度为单位）。如果超过 360 度，则可能小于起始角度.
         */
        endAngle: number;
    }
    /**
     * 贝塞尔曲线定义贝塞尔曲线的端点和控制点.
     */
    interface IPathBezierSeed extends IPathLine {
        /**
         * 贝塞尔控制点. One point for quadratic, 2 points for cubic.
         */
        controls: IPoint[];
        /**
         * T values of the parent if this is a child that represents a split.
         */
        parentRange?: IBezierRange;
    }
    /**
     * 贝塞尔曲线中弧路径段的贝塞尔值.
     */
    interface IBezierRange {
        /**
         * 起点处的贝塞尔值.
         */
        startT: number;
        /**
         * 终点处的贝塞尔值.
         */
        endT: number;
    }
    /**
     * 贝塞尔曲线中的弧路径段.
     */
    interface IPathArcInBezierCurve extends IPath {
        bezierData: IBezierRange;
    }
    /**
     * 文本.
     */
    interface ICaption {
        /**
         * 文本值.
         */
        text: string;
        /**
         * 文本对齐的不可见线.
         * 文本将水平和垂直居中此线的中心点.
         * 文本可能比线条长或短，仅用于位置和角度.
         * 可以省略锚线的端点，在这种情况下，即使模型旋转，文本也将始终保持无角度.
         */
        anchor: IPathLine;
        /**
         * 属性数据.
         */
        data?: IProperties;
    }
    /**
     * 按 id 路径对象.
     */
    interface IPathMap {
        [id: string]: IPath | IPathArc | IPathCircle | IPathLine;
    }
    /**
     * 按 id 对对象进行建模.
     */
    interface IModelMap {
        [id: string]: IModel;
    }
    interface IProperties {
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
        matrix?: any;
        /** 扩展数据. */
        xdata?: string;
        /** 是否填充. */
        isFill?: boolean;
        /** 是否填充为洞. */
        isHole?: boolean;
        /** 实体类型，有此属性数据的话，将转换为相对应的实体类型.（path为line的时候有效） */
        typename?: string;
        [key: string]: any;
    }
    /**
     * 模型是一个复合对象，可能包含路径映射或递归模型映射.
     *
     * Example:
     * ```
     * var m = {
     *   paths: {
     *     "line1": { type: 'line', origin: [0, 0], end: [1, 1] },
     *     "line2": { type: 'line', origin: [0, 0], end: [-1, -1] }
     *   }
     * };
     * ```
     */
    interface IModel {
        /**
         * 此模型的可选基点位置.
         */
        origin?: IPoint;
        /**
         * 模型类型.
         */
        "type"?: string;
        /**
         * 此模型中路径对象的可选映射.
         */
        paths?: IPathMap;
        /**
         * 此模型中模型的可选映射.
         */
        models?: IModelMap;
        /**
         * 单位.
         */
        units?: string;
        /**
         * 注释.
         */
        notes?: string;
        /**
         * 图层.
         */
        layer?: string;
        /**
         * 属性数据.
         */
        data?: IProperties;
        /**
         * 标题文本.
         */
        caption?: ICaption;
        /**
         * 导出选项.
         */
        exporterOptions?: {
            [exporterName: string]: any;
        };
    }
}
/**
 * Root module for geo.
 *
 * Example: get a reference to geo
 * ```
 *
 * ```
 *
 */
declare namespace vjgeo {
    /**
     * Enumeration of environment types.
     */
    var environmentTypes: {
        BrowserUI: string;
        NodeJs: string;
        WebWorker: string;
        Unknown: string;
    };
    /**
     * 当前执行环境类型，应为环境类型之一.
     */
    var environment: string;
    /**
     * 基于字符串的单位类型枚举：公制或其他.
     * 模型可以指定它正在使用的单位制（如果有）。导入模型时，它可能具有不同的单位.
     * 单位转换函数是 vjgeo.units.conversionScale（）.
     */
    var unitType: {
        Centimeter: string;
        Foot: string;
        Inch: string;
        Meter: string;
        Millimeter: string;
    };
    /**
     * 将小数部分拆分为整数和小数部分作为字符串.
     *
     * 示例：获取 80.012 的整部分和小数部分
     * ```
     * vjgeo.splitDecimal(80.012); //returns ["80", "012"]
     * ```
     *
     * @param n 要拆分的数字.
     * @returns 当 n 包含小数点时为 2 个字符串的数组，或当 n 为整数时为一个字符串的数组.
     */
    function splitDecimal(n: number): string[];
    /**
     * 数字四舍五入
     *
     * 示例：四舍五入到小数点后 3 位
     * ```
     * vjgeo.round(3.14159, .001); //returns 3.142
     * ```
     *
     * @param n 要舍入的数字.
     * @param accuracy 可选的小数位数.
     * @returns Rounded number.
     */
    function round(n: number, accuracy?: number): number;
    /**
     * 创建路由数组的字符串表示形式.
     *
     * @param route 作为路由段的字符串数组.
     * @returns 数组连接组成的字符串.
     */
    function createRouteKey(route: string[]): string;
    /**
     * 沿着模型内的路线以提取其模型树中的特定节点.
     *
     * @param modelContext 内部walk模型.
     * @param route 路由的字符串或路由段的字符串数组.
     * @returns 模型或 Path 对象在模型上下文树中.
     */
    function travel(modelContext: IModel, route: string | string[]): {
        result: IPath | IModel;
        offset: IPoint;
    };
    /**
     * 克隆对象。
     *
     * @param objectToClone The object to clone.
     * @returns A new clone of the original object.
     */
    function cloneObject<T>(objectToClone: T): T;
    /**
     * 将属性从一个对象复制到另一个对象.
     *
     * Example:
     * ```
     * vjgeo.extendObject({ abc: 12 }, { hello: 'world' }); //returns { abc: 12, hello: 'world' }
     * ```
     *
     * @param target 要扩展的对象。它将收到新属性.
     * @param other 包含要合并的属性的对象.
     * @returns 合并后的原始对象.
     */
    function extendObject(target: Object, other: Object): Object;
    /**
     * 判断变量是否为函数.
     *
     * @param value The object to test.
     * @returns True if the object is a function type.
     */
    function isFunction(value: any): boolean;
    /**
     * 判断变量是否为数字.
     *
     * @param value The object to test.
     * @returns True if the object is a number type.
     */
    function isNumber(value: any): boolean;
    /**
     * 判断变量是否是Object.
     *
     * @param value The object to test.
     * @returns True if the object is an object type.
     */
    function isObject(value: any): boolean;
    /**
     * 判断变量是否是Object并且不是Array.
     *
     * @param value The object to test.
     * @returns True if the object is an object type.
     */
    function isObjectNotArray(value: any): boolean;
    /**
     * 判断变量是否是Object或undefined并且不是Array.
     *
     * @param value The object to test.
     * @returns True if the object is an object type.
     */
    function isObjectOrUndefinedNotArray(value: any): boolean;
    /**
     * 判断变量是否点.
     *
     * @param item The item to test.
     */
    function isPoint(item: any): boolean;
    /**
     * 范围.
     */
    interface IMeasure {
        /**
         * 包含要测量项的矩形的最小 x 和 y 值的点.
         */
        low: IPoint;
        /**
         * 包含要测量项目的矩形的最大 x 和 y 值的点.
         */
        high: IPoint;
    }
    /**
     * 具有中心点的范围测量值.
     */
    interface IMeasureWithCenter extends IMeasure {
        /**
         * 包含要测量的项目的矩形的中心点.
         */
        center: IPoint;
        /**
         * 包含要测量的项目的矩形的宽度.
         */
        width: number;
        /**
         * 包含要测量的项目的矩形的高度.
         */
        height: number;
    }
    /**
     * A map of measurements.
     */
    interface IMeasureMap {
        [key: string]: IMeasure;
    }
    /**
     * 在合并操作中删除的路径.
     */
    interface IPathRemoved extends IPath {
        /**
         * 删除路径的原因.
         */
        reason: string;
        /**
         * 路径的原始路由键，用于标识其来源.
         */
        routeKey: string;
    }
    /**
     * 传递给 measure.isPointInsideModel（） 的选项.
     */
    interface IMeasurePointInsideOptions {
        /**
         * 模型上下文边界之外的可选参考点.
         */
        farPoint?: IPoint;
        /**
         * 模型中路径测量的可选图集（以防止相交计算）.
         */
        measureAtlas?: measure.Atlas;
        /**
         * 输出变量，其中包含光线与模型相交的点数组。射线是从pointToCheck到options.farPoint的一条线.
         */
        out_intersectionPoints?: IPoint[];
    }
    /**
     * 判断变量是否为Path对象.
     *
     * @param item The item to test.
     */
    function isPath(item: any): boolean;
    /**
     * 判断变量是否为Line对象.
     *
     * @param item The item to test.
     */
    function isPathLine(item: any): boolean;
    /**
     * 判断变量是否为PathCircle对象..
     *
     * @param item The item to test.
     */
    function isPathCircle(item: any): boolean;
    /**
     * 判断变量是否为PathArc对象.
     *
     * @param item The item to test.
     */
    function isPathArc(item: any): boolean;
    /**
     * 测试以查看对象是否实现了贝塞尔曲线中弧的必需属性。
     *
     * @param item The item to test.
     */
    function isPathArcInBezierCurve(item: any): boolean;
    /**
     * 所有路径类型的基于字符串的枚举.
     *
     * 示例：创建圆时使用 pathType 而不是字符串文字.
     * ```
     * var circle: IPathCircle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    var pathType: {
        Line: string;
        Circle: string;
        Arc: string;
        BezierSeed: string;
    };
    /**
     * 直线的斜率和 y 截距.
     */
    interface ISlope {
        /**
         * 布尔值，用于查看线是否有斜率或垂直.
         */
        hasSlope: boolean;
        /**
         * 非垂直坡度的可选值.
         */
        slope?: number;
        /**
         * 用于计算此斜率的线.
         */
        line: IPathLine;
        /**
         * x = 0 时的可选值 y.
         */
        yIntercept?: number;
    }
    /**
     * 传递给 path.intersection（） 的选项
     */
    interface IPathIntersectionBaseOptions {
        /**
         * 可选布尔值，仅返回deep交点，即不在终点或切线上.
         */
        excludeTangents?: boolean;
        /**
         * 可选输出变量，如果路径重叠，该变量将设置为 true.
         */
        out_AreOverlapped?: boolean;
    }
    /**
     * 传递给 path.intersection（） 的选项
     */
    interface IPathIntersectionOptions extends IPathIntersectionBaseOptions {
        /**
         * 可选布尔值，仅返回deep交点，即不在终点或切线上.
         */
        path1Offset?: IPoint;
        /**
         * 可选输出变量，如果路径重叠，该变量将设置为 true.
         */
        path2Offset?: IPoint;
    }
    /**
     * 两条路径的交点.
     */
    interface IPathIntersection {
        /**
         * 两条路径相交的点数组。数组的长度可以是 1 或 2 .
         */
        intersectionPoints: IPoint[];
        /**
         * 仅当传递给路径交集的第一个参数是圆弧或圆时，才会定义此数组属性.
         * 它包含相对于第一个路径参数的交点角度.
         * 数组的长度可以是 1 或 2.
         */
        path1Angles?: number[];
        /**
         * 仅当传递给路径交集的第二个参数是圆弧或圆时，才会定义此数组属性.
         * 它包含相对于第二个路径参数的交点角度.
         * 数组的长度可以是 1 或 2.
         */
        path2Angles?: number[];
    }
    /**
     * 匹配点时的选项
     */
    interface IPointMatchOptions {
        /**
         * 将两个点视为相同的最大距离.
         */
        pointMatchingDistance?: number;
    }
    /**
     * 传递给模型的选项。.
     */
    interface ICombineOptions extends IPointMatchOptions {
        /**
         * 用于删除不属于循环的路径的标志.
         */
        trimDeadEnds?: boolean;
        /**
         * 已知在模型之外的点.
         */
        farPoint?: IPoint;
        /**
         * 模型 A 的缓存测量值.
         */
        measureA?: measure.Atlas;
        /**
         * 模型 B 的缓存测量值.
         */
        measureB?: measure.Atlas;
        /**
         * 包含组合中删除的路径的 2 个模型（对应于输入模型）的输出数组.
         * 每个路径的类型都是 IPathRemoved，它有一个 .reason 属性，描述它被删除的原因.
         */
        out_deleted?: IModel[];
    }
    /**
     * 要传递给 measure.isPointOnPath 的选项.
     */
    interface IIsPointOnPathOptions {
        /**
         * 线的斜率（如果适用）。如果不存在，这将添加到选项对象中.
         */
        cachedLineSlope?: ISlope;
    }
    /**
     * 传递给 model.findLoops 的选项.
     */
    interface IFindLoopsOptions extends IPointMatchOptions {
        /**
         * 用于从原始模型中删除循环路径的标志.
         */
        removeFromOriginal?: boolean;
    }
    /**
     * 传递给 model.simplify（） 的选项
     */
    interface ISimplifyOptions extends IPointMatchOptions {
        /**
         * Optional
         */
        scalarMatchingDistance?: number;
    }
    /**
     * 可能指示在其端点之间沿任一方向“流动”的路径.
     */
    interface IPathDirectional extends IPath {
        /**
         * 路径的端点.
         */
        endPoints: IPoint[];
        /**
         * 路径向前或向后流动.
         */
        reversed?: boolean;
    }
    /**
     * model.walkPaths（） 的回调签名.
     */
    interface IModelPathCallback {
        (modelContext: IModel, pathId: string, pathContext: IPath): void;
    }
    /**
     * 测试以查看对象是否实现了模型的必需属性.
     */
    function isModel(item: any): boolean;
    /**
     * 对模型中路径 ID 的引用.
     */
    interface IRefPathIdInModel {
        modelContext: IModel;
        pathId: string;
    }
    /**
     * 到路径或模型的路径及其绝对偏移.
     */
    interface IRouteOffset {
        layer: string;
        offset: IPoint;
        route: string[];
        routeKey: string;
        data?: IProperties;
    }
    /**
     * A path reference in a walk.
     */
    interface IWalkPath extends IRefPathIdInModel, IRouteOffset {
        pathContext: IPath;
    }
    /**
     * model.walk（） 中路径的回调签名.
     */
    interface IWalkPathCallback {
        (context: IWalkPath): void;
    }
    /**
     * 用于从 IWalkPath 返回布尔值的回调.
     */
    interface IWalkPathBooleanCallback {
        (context: IWalkPath): boolean;
    }
    /**
     * 链中的一环，带有流动方向.
     */
    interface IChainLink {
        /**
         * Reference to the path.
         */
        walkedPath: IWalkPath;
        /**
         * 路径向前或向后流动.
         */
        reversed: boolean;
        /**
         * 路径的端点，在绝对坐标中.
         */
        endPoints: IPoint[];
        /**
         * Length of the path.
         */
        pathLength: number;
    }
    /**
     * 端到端连接的路径链.
     */
    interface IChain {
        /**
         * The links in this chain.
         */
        links: IChainLink[];
        /**
         * 标记此链是否形成端到端的循环.
         */
        endless: boolean;
        /**
         * 链中所有路径的总长度.
         */
        pathLength: number;
        /**
         * 此链中包含的链。使用“包含”选项找到链时填充
         */
        contains?: IChain[];
    }
    /**
     * A map of chains by layer.
     */
    interface IChainsMap {
        [layer: string]: IChain[];
    }
    /**
     * 测试以查看对象是否实现了链的必需属性.
     *
     * @param item The item to test.
     */
    function isChain(item: any): boolean;
    /**
     * 回调 model.findChains（） 以及生成的链和未链接路径数组.
     */
    interface IChainCallback {
        (chains: IChain[], loose: IWalkPath[], layer: string, ignored?: IWalkPath[]): void;
    }
    /**
     * 传递给 model.findChains 的选项.
     */
    interface IFindChainsOptions extends IPointMatchOptions {
        /**
         * 标记以按层分隔链.
         */
        byLayers?: boolean;
        /**
         * 标记不递归模型，仅在当前模型的直接路径内查找.
         */
        shallow?: boolean;
        /**
         * 标记以根据链的路径彼此内部来排序层次结构中的链.
         */
        contain?: boolean | IContainChainsOptions;
        /**
         * 标记以将贝塞尔曲线弧段展平为 IPathBezierSeed.
         */
        unifyBeziers?: boolean;
    }
    /**
     * 要传递给 model.findChains.包含选项的子选项.
     */
    interface IContainChainsOptions {
        /**
         * 标记到所包含链的替代方向.
         */
        alternateDirection?: boolean;
    }
    /**
     * 对模型中模型的引用.
     */
    interface IRefModelInModel {
        parentModel: IModel;
        childId: string;
        childModel: IModel;
    }
    /**
     * A model reference in a walk.
     */
    interface IWalkModel extends IRefModelInModel, IRouteOffset {
    }
    /**
     * model.walk（） 的回调签名.
     */
    interface IWalkModelCallback {
        (context: IWalkModel): void;
    }
    /**
     * model.walk（） 的回调签名，它可能返回 false 以停止任何进一步的行走.
     */
    interface IWalkModelCancellableCallback {
        (context: IWalkModel): boolean;
    }
    /**
     * 传递给 model.walk（） 的选项.
     */
    interface IWalkOptions {
        /**
         * 每个模型中每个路径的回调.
         */
        onPath?: IWalkPathCallback;
        /**
         * 每个模型中每个子模型的回调。返回 false 以停止走下更多模型.
         */
        beforeChildWalk?: IWalkModelCancellableCallback;
        /**
         * 在每个模型的所有子模型都已遍历后，对每个子模型中的每个子模型进行回调.
         */
        afterChildWalk?: IWalkModelCallback;
    }
    /**
     * 围绕模型的六边形.
     */
    interface IBoundingHex extends IModel {
        /**
         * 六边形的半径，也是边的长度.
         */
        radius: number;
    }
    /**
     * 描述参数及其限制.
     */
    interface IMetaParameter {
        /**
         * 显示参数的文本.
         */
        title: string;
        /**
         * 参数的类型。目前支持“范围”.
         */
        type: string;
        /**
         * 范围的可选最小值.
         */
        min?: number;
        /**
         * 范围的可选最大值.
         */
        max?: number;
        /**
         * 最小值和最大值之间的可选步长值.
         */
        step?: number;
        /**
         * 此参数的初始示例值.
         */
        value: any;
    }
    /**
     * IKit 是一个具有一些示例参数的模型生成类。将其视为一个打包模型，其中包含有关如何最好地使用它的说明.
     */
    interface IKit {
        /**
         * 构造函数。该套件必须是“可更新的”，并且必须产生 IModel.
         * 它可以有任意数量的任何类型的参数.
         */
        new (...args: any[]): IModel;
        /**
         * 附加到构造函数的是一个名为metaParameters的属性，它是IMetaParameter对象的数组。.
         * 数组的每个元素对应于构造函数的一个参数，按顺序.
         */
        metaParameters?: IMetaParameter[];
        /**
         * 有关此套件的信息，纯文本或markdown格式.
         */
        notes?: string;
    }
    /**
     * 允许对对象调用一系列函数的容器.
     */
    interface ICascade {
        /**
         * 级联的初始上下文对象.
         */
        $initial: any;
        /**
         * 级联的当前最终值.
         */
        $result: any;
        /**
         * Use the $original as the $result.
         */
        $reset: () => this;
    }
    /**
     * 创建一个容器以在模型上级联一系列函数。这允许 JQuery 风格的方法链接，例如:
     * ```
     * vjgeo.$(shape).center().rotate(45).$result
     * ```
     * 每个函数调用的输出成为下一个函数调用的第一个参数输入.
     * 最后一个函数调用的返回值可通过“.result”属性获得.
     *
     * @param modelContext 执行函数的初始模型.
     * @returns 具有 ICascadeModel 方法的新级联容器.
     */
    function $(modelContext: IModel): ICascadeModel;
    /**
     * 创建一个容器以在路径上级联一系列函数。这允许 JQuery 风格的方法链接，例如:
     * ```
     * vjgeo.$(path).center().rotate(90).$result
     * ```
     * 每个函数调用的输出成为下一个函数调用的第一个参数输入.
     * 最后一个函数调用的返回值可通过“.result”属性获得.
     *
     * @param pathContext 执行函数的初始路径.
     * @returns 具有 ICascadePath 方法的新级联容器.
     */
    function $(pathContext: IModel): ICascadePath;
    /**
     * 创建一个容器以在点上级联一系列函数。这允许 JQuery 风格的方法链接，例如:
     * ```
     * vjgeo.$([1,0]).scale(5).rotate(60).$result
     * ```
     * 每个函数调用的输出成为下一个函数调用的第一个参数输入.
     * 最后一个函数调用的返回值可通过“.result”属性获得.
     *
     * @param pointContext 执行函数的初始点.
     * @returns 具有 ICascadePoint 方法的新级联容器.
     */
    function $(pointContext: IPoint): ICascadePoint;
}
declare module "vjgeo" {
    export = vjgeo;
}
declare namespace vjgeo {
    interface ICascadeModel extends ICascade {
        /**
         * 向模型添加标题对象.
         *
         * @param text Text to add.
         * @param leftAnchorPoint 文本左侧中间的可选点.
         * @param rightAnchorPoint 文本右侧中间的可选点.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        addCaption(text: string, leftAnchorPoint?: IPoint, rightAnchorPoint?: IPoint): ICascadeModel;
        /**
         * 将模型添加为子模型:
```
parentModel.models[childModelId] = childModel;
```
         *
         * @param childModel The model to add.
         * @param childModelId The id of the child model.
         * @param overWrite (default false) 用于覆盖子模型 ID 引用的任何模型的可选标志。默认值为 false，这将创建一个类似于 childModelId 的 id.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        addModel(childModel: IModel, childModelId: string, overWrite?: boolean): ICascadeModel;
        /**
         * 添加路径作为子路径:
```
parentModel.paths[childPathId] = childPath;
```
with additional checks to make it safe for cascading.
         *
         * @param pathContext The path to add.
         * @param pathId The id of the path.
         * @param overWrite (default false) Optional 标志以覆盖 pathId 引用的任何路径。默认值为 false，这将创建一个类似于 pathId 的 id.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        addPath(pathContext: IPath, pathId: string, overWrite?: boolean): ICascadeModel;
        /**
         * 将一个模型添加为另一个模型的子模型.
```
parentModel.models[childModelId] = childModel;
```
         *
         * @param parentModel The model to add to.
         * @param childModelId The id of the child model.
         * @param overWrite (default false) Optional 标志以覆盖子模型 ID 引用的任何模型。默认值为 false，这将创建一个类似于 childModelId 的 id.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        addTo(parentModel: IModel, childModelId: string, overWrite?: boolean): ICascadeModel;
        /**
         * 断开模型与另一路径相交的路径.
         *
         * @param modelToIntersect 包含查找交集的路径的可选模型，否则将使用 modelToBreak.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        breakPathsAtIntersections(modelToIntersect?: IModel): ICascadeModel;
        /**
         * 将模型居中 [0， 0].
         *
         * @param centerX (default true) Boolean 以 X 轴为中心。默认值为 true.
         * @param centerY (default true) Boolean 以 y 轴为中心。默认值为 true.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        center(centerX?: boolean, centerY?: boolean): ICascadeModel;
        /**
         * 克隆模型。别名 vjgeo.cloneObject（modelToClone）
         *
         * @returns this cascade container, this.$result will be A clone of the model you passed.

         */
        clone(): ICascadeModel;
        /**
         * 组合 2 个模型。每个模型都将相应地修改.
         *
         * @param modelB 第二个要组合的模型.
         * @param includeAInsideB (default false) 标志以包含模型 A 中位于模型 B 内部的路径.
         * @param includeAOutsideB (default true) 标志以包含模型 A 中位于模型 B 外部的路径.
         * @param includeBInsideA (default false) 标志以包含模型 B 中位于模型 A 内部的路径.
         * @param includeBOutsideA (default true) 标志以包含模型 B 中位于模型 A 外部的路径.
         * @param options 可选 ICombineOptions 对象.
         * @returns this cascade container, this.$result will be 包含“a”和“b”两个输入模型的新模型.

         */
        combine(modelB: IModel, includeAInsideB?: boolean, includeAOutsideB?: boolean, includeBInsideA?: boolean, includeBOutsideA?: boolean, options?: ICombineOptions): ICascadeModel;
        /**
         * 合并 2 个模型，产生相交。每个模型都将相应地修改.
         *
         * @param modelB 第二个要组合的模型.
         * @returns this cascade container, this.$result will be 包含“a”和“b”两个输入模型的新模型.

         */
        combineIntersection(modelB: IModel): ICascadeModel;
        /**
         * 合并 2 个模型，结果从 A 中减去 B。每个模型都将相应地修改.
         *
         * @param modelB 第二个要组合的模型.
         * @returns this cascade container, this.$result will be 包含“a”和“b”两个输入模型的新模型.

         */
        combineSubtraction(modelB: IModel): ICascadeModel;
        /**
         * 合并 2 个模型，形成一个联合。每个模型都将相应地修改.
         *
         * @param modelB 第二个要组合的模型.
         * @returns this cascade container, this.$result will be 包含“a”和“b”两个输入模型的新模型.

         */
        combineUnion(modelB: IModel): ICascadeModel;
        /**
         * 转换模型以匹配不同的单位系统.
         *
         * @param destUnitType The unit system.
         * @returns this cascade container, this.$result will be The scaled model (for cascading).

         */
        convertUnits(destUnitType: string): ICascadeModel;
        /**
         * 设置模型的属性数据。
```
modelContext.data = data;
```
         *
         * @param data The data
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        data(data: IProperties): ICascadeModel;
        /**
         * 模型的扭曲 - 分别缩放 x 和 y.
         *
         * @param scaleX x 缩放量.
         * @param scaleY y 缩放量.
         * @param scaleOrigin (default false) 用于缩放原点的可选布尔值。对于根模型通常为 false，通常为 false。.
         * @param bezierAccuracy 贝塞尔曲线的可选精度.
         * @returns this cascade container, this.$result will be New model (for cascading).

         */
        distort(scaleX: number, scaleY: number, scaleOrigin?: boolean, bezierAccuracy?: number): ICascadeModel;
        /**
         * 展开模型中的所有路径，然后合并生成的扩展.
         *
         * @param distance Distance to expand.
         * @param joints (default 0) 路径之间关节处的点数。圆接头使用 0，尖头接头使用 1，斜面接头使用 2.
         * @param combineOptions (default {}) Optional object containing combine options.
         * @returns this cascade container, this.$result will be 围绕原始模型路径的模型.

         */
        expandPaths(distance: number, joints?: number, combineOptions?: ICombineOptions): ICascadeModel;
        /**
         * 设置模型的图层名称。
```
modelContext.layer = layer;
```
         *
         * @param layer The layer name.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        layer(layer: string): ICascadeModel;
        /**
         * 创建模型的克隆，在 x 轴和 y 轴上或两个轴上镜像.
         *
         * @param mirrorX Boolean 在 X 轴上镜像.
         * @param mirrorY Boolean 在 Y 轴上镜像.
         * @returns this cascade container, this.$result will be Mirrored model.

         */
        mirror(mirrorX: boolean, mirrorY: boolean): ICascadeModel;
        /**
         * 将模型移动到绝对点。请注意，这也是通过直接设置 origin 属性来实现的。此函数用于级联.
         *
         * @param origin The new position of the model.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        move(origin: IPoint): ICascadeModel;
        /**
         * 按相对量移动模型的原点.
         *
         * @param delta 作为点对象的 x 和 y 调整.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        moveRelative(delta: IPoint): ICascadeModel;
        /**
         * 将模型的所有子项（模型和路径，递归方式）移动到同一个坐标空间。当子点之间的点需要相互连接时很有用.
         *
         * @param origin Optional offset reference point.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        originate(origin?: IPoint): ICascadeModel;
        /**
         * 按指定的距离勾勒模型轮廓。
         *
         * @param distance Distance to outline.
         * @param joints (default 0) 路径之间关节处的点数。圆接头使用 0，尖头接头使用 1，斜面接头使用 2.
         * @param inside (default false) 可选的布尔值，用于在模型内部而不是外部绘制线条.
         * @param options (default {}) Options to send to combine() function.
         * @returns this cascade container, this.$result will be Model which surrounds the paths outside of the original model.

         */
        outline(distance: number, joints?: number, inside?: boolean, options?: ICombineOptions): ICascadeModel;
        /**
         * 为模型中路径的 id 添加前缀.
         *
         * @param prefix The prefix to prepend on paths ids.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        prefixPathIds(prefix: string): ICascadeModel;
        /**
         * 从具有未连接到其他路径的端点的模型中删除路径.
         *
         * @param pointMatchingDistance 可选最大距离，可将两个点视为相同.
         * @param keep 可选的回调函数（应返回布尔值）来决定是否应保留路径.
         * @param trackDeleted 可选的回调函数，将记录丢弃的路径及其被丢弃的原因.
         * @returns this cascade container, this.$result will be The input model (for cascading).

         */
        removeDeadEnds(pointMatchingDistance?: number, keep?: IWalkPathBooleanCallback, trackDeleted?: undefined): ICascadeModel;
        /**
         * 旋转模型.
         *
         * @param angleInDegrees 旋转量，以度为单位.
         * @param rotationOrigin (default [0, 0]) 旋转中心点.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        rotate(angleInDegrees: number, rotationOrigin?: IPoint): ICascadeModel;
        /**
         * 缩放模型.
         *
         * @param scaleValue 缩放量.
         * @param scaleOrigin (default false) 用于缩放原点的可选布尔值。对于根模型通常为 false，通常为 false。.
         * @param basePoint 缩放的基点.
         * @param isBasePointRelative 缩放的基点是否是相对于模型的坐标（没有包含origin). 默认是绝对坐标.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        scale(scaleValue: number, scaleOrigin?: boolean, basePoint?: IPoint, isBasePointRelative?: boolean): ICascadeModel;
        /**
         * 通过减少冗余来简化模型的路径：将多个重叠路径合并为一条路径。
         *
         * @param options Optional options object.
         * @returns this cascade container, this.$result will be The simplified model (for cascading).

         */
        simplify(options?: ISimplifyOptions): ICascadeModel;
        /**
         * 递归遍历给定模型的所有子模型和路径.
         *
         * @param options Object containing callbacks.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        walk(options: IWalkOptions): ICascadeModel;
        /**
         * 移动模型，使其边界框从 [0， 0] 开始.
         *
         * @param zeroX (default true) Boolean to zero on the x axis. Default is true.
         * @param zeroY (default true) Boolean to zero on the y axis. Default is true.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        zero(zeroX?: boolean, zeroY?: boolean): ICascadeModel;
    }
    interface ICascadePath extends ICascade {
        /**
         * 添加模型的路径。
```
parentModel.paths[pathId] = childPath;
```
         *
         * @param parentModel The model to add to.
         * @param pathId The id of the path.
         * @param overwrite (default false) ????????????????????????????
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        addTo(parentModel: IModel, pathId: string, overwrite?: boolean): ICascadePath;
        /**
         * 通过延长或缩短路径来更改路径.
         *
         * @param distance 要在路径中添加或删除的长度数字量。使用正数延长，负数缩短。缩短时：此函数不会更改路径，如果生成的路径长度小于或等于零，则返回 null.
         * @param useOrigin (default false) 可选标志，用于从起点而不是路径末尾更改.
         * @returns this cascade container, this.$result will be 原始路径（用于级联），如果无法更改路径，则为 null.

         */
        alterLength(distance: number, useOrigin?: boolean): ICascadePath;
        /**
         * 将一条路径一分为二。提供的路径将在提供的中断点处结束,
返回一条新路径，该路径从 pointOfBreak 开始，到提供的路径的初始终点结束.
对于 Circle，原始路径将就地转换为 Arc，并返回 null.
         *
         * @param pointOfBreak The point at which to break the path.
         * @returns this cascade container, this.$result will be 当路径类型为直线或圆弧时，相同类型的新路径。为圆返回空值.

         */
        breakAtPoint(pointOfBreak: IPoint): ICascadePath;
        /**
         * 将路径居中位于 [0， 0].
         *
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        center(): ICascadePath;
        /**
         * 创建路径的克隆。这比克隆对象更快.
         *
         * @param offset 可选点移动路径相对距离.
         * @returns this cascade container, this.$result will be Cloned path.

         */
        clone(offset?: IPoint): ICascadePath;
        /**
         * 将一个路径的属性复制到另一个路径.
         *
         * @param destPath The destination path to copy property values to.
         * @returns this cascade container, this.$result will be The source path.

         */
        copyProps(destPath: IPath): ICascadePath;
        /**
         * 设置路径的属性数据。
```
pathContext.data = data;
```
         *
         * @param data The data
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        data(data: IProperties): ICascadePath;
        /**
         * 设置路径图层.
```
pathContext.layer = layer;
```
         *
         * @param layer The layer name.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        layer(layer: string): ICascadePath;
        /**
         * 创建路径的克隆，在 x 轴和 y 轴上或两个轴上镜像.
         *
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns this cascade container, this.$result will be Mirrored path.

         */
        mirror(mirrorX: boolean, mirrorY: boolean): ICascadePath;
        /**
         * 将路径移动到绝对点.
         *
         * @param origin The new origin for the path.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        move(origin: IPoint): ICascadePath;
        /**
         * 按相对量移动路径的原点.
         *
         * @param delta 作为点对象的 x 和 y 调整.
         * @param subtract 可选的布尔值减去而不是加法.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        moveRelative(delta: IPoint, subtract?: boolean): ICascadePath;
        /**
         * 旋转路径.
         *
         * @param angleInDegrees 旋转量，以度为单位.
         * @param rotationOrigin (default [0, 0]) 旋转中心点.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        rotate(angleInDegrees: number, rotationOrigin?: IPoint): ICascadePath;
        /**
         * 缩放路径.
         *
         * @param scaleValue 缩放量.
         * @param basePoint 缩放的基点.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        scale(scaleValue: number, basePoint?: IPoint): ICascadePath;
        /**
         * 移动路径，使其边界框从 [0， 0] 开始.
         *
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        zero(): ICascadePath;
    }
    interface ICascadePoint extends ICascade {
        /**
         * 将两个点相加，并将结果作为新的点对象返回.
         *
         * @param b Second point.
         * @param subtract 可选的布尔值减去而不是加法.
         * @returns this cascade container, this.$result will be A new point object.

         */
        add(b: IPoint, subtract?: boolean): ICascadePoint;
        /**
         * 获取两点中间值.
         *
         * @param b Second point.
         * @returns this cascade container, this.$result will be New point object which is the average of a and b.

         */
        average(b: IPoint): ICascadePoint;
        /**
         * 克隆点.
         *
         * @returns this cascade container, this.$result will be A new point with same values as the original.

         */
        clone(): ICascadePoint;
        /**
         * 从点数组中，找到与给定参考点最近的点.
         *
         * @param pointOptions Array of points to choose from.
         * @returns this cascade container, this.$result will be The first closest point from the pointOptions.

         */
        closest(pointOptions: IPoint[]): ICascadePoint;
        /**
         * 扭曲点.
         *
         * @param scaleX The amount of x scaling.
         * @param scaleY The amount of y scaling.
         * @returns this cascade container, this.$result will be A new point.

         */
        distort(scaleX: number, scaleY: number): ICascadePoint;
        /**
         * 创建点的克隆，在 x 轴和 y 轴上或两个轴上镜像.
         *
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns this cascade container, this.$result will be Mirrored point.

         */
        mirror(mirrorX: boolean, mirrorY: boolean): ICascadePoint;
        /**
         * 旋转点.
         *
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin (default [0, 0]) The center point of rotation.
         * @returns this cascade container, this.$result will be A new point.

         */
        rotate(angleInDegrees: number, rotationOrigin?: IPoint): ICascadePoint;
        /**
         * 四舍五入点的值.
         *
         * @param accuracy Optional exemplar number of decimal places.
         * @returns this cascade container, this.$result will be A new point with the values rounded.

         */
        rounded(accuracy?: number): ICascadePoint;
        /**
         * 缩放点的坐标.
         *
         * @param scaleValue The amount of scaling.
         * @param basePoint The basePoint of scaling.
         * @returns this cascade container, this.$result will be A new point.

         */
        scale(scaleValue: number, basePoint?: IPoint): ICascadePoint;
        /**
         * 从另一个点减去一个点，并将结果作为新点返回. Add(a, b, subtract = true).
         *
         * @param b Second point.
         * @returns this cascade container, this.$result will be A new point object.

         */
        subtract(b: IPoint): ICascadePoint;
    }
}
declare namespace vjgeo.angle {
    /**
     * 确保角度不大于 360
     *
     * @param angleInDegrees 角度（度）.
     * @returns 角度但不大于360度.
     */
    function noRevolutions(angleInDegrees: number): number;
    /**
     * 将角度从度转换为弧度.
     *
     * @param angleInDegrees 角度（度）.
     * @returns 弧度.
     */
    function toRadians(angleInDegrees: number): number;
    /**
     * 将角度从弧度转换为度.
     *
     * @param angleInRadians 弧度.
     * @returns 角度.
     */
    function toDegrees(angleInRadians: number): number;
    /**
     * 获取圆弧的结束角度，确保大于其起始角度.
     *
     * @param arc 圆弧形路径对象.
     * @returns 圆弧的结束角度.
     */
    function ofArcEnd(arc: IPathArc): number;
    /**
     * 获取圆弧的起始角度和结束角度中间的角度.
     *
     * @param arc 圆弧路径对象.
     * @param ratio 介于 0 和 1 之间的可选数字，指定起点和终点角度之间的百分比。默认值为 .5
     * @returns 中间角度.
     */
    function ofArcMiddle(arc: IPathArc, ratio?: number): number;
    /**
     * 圆弧的起始角和终点角之间的总角度.
     *
     * @param arc 弧形路径对象.
     * @returns 圆弧角度.
     */
    function ofArcSpan(arc: IPathArc): number;
    /**
     * 线路径的角度.
     *
     * @param line 线路径对象.
     * @returns 线路径的角度（以度为单位）.
     */
    function ofLineInDegrees(line: IPathLine): number;
    /**
     * 两点组成线的角度，以度为单位.
     *
     * @param pointToFindAngle The point to find the angle.
     * @param origin Point of origin of the angle.
     * @returns Angle of the line throught the point, in degrees.
     */
    function ofPointInDegrees(origin: IPoint, pointToFindAngle: IPoint): number;
    /**
     * 两点组成线的角度，以弧度为单位.
     *
     * @param pointToFindAngle The point to find the angle.
     * @param origin Point of origin of the angle.
     * @returns Angle of the line throught the point, in radians.
     */
    function ofPointInRadians(origin: IPoint, pointToFindAngle: IPoint): number;
    /**
     * 在 x 轴和 y 轴上镜像的角度.
     *
     * @param angleInDegrees The angle to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored angle.
     */
    function mirror(angleInDegrees: number, mirrorX: boolean, mirrorY: boolean): number;
    /**
     * 获取 2 个链节之间的接头角度.
     *
     * @param linkA First chain link.
     * @param linkB Second chain link.
     * @returns Angle between chain links.
     */
    function ofChainLinkJoint(linkA: IChainLink, linkB: IChainLink): number;
}
declare namespace vjgeo.point {
    /**
     * 将两个点相加，并将结果作为新的点对象返回.
     *
     * @param a First point.
     * @param b Second point.
     * @param subtract 可选的布尔值减去而不是加法.
     * @returns A new point object.
     */
    function add(a: IPoint, b: IPoint, subtract?: boolean): IPoint;
    /**
     * 获取两点中间值.
     *
     * @param a First point.
     * @param b Second point.
     * @returns New point object which is the average of a and b.
     */
    function average(a: IPoint, b: IPoint): IPoint;
    /**
     * 克隆点.
     *
     * @param pointToClone The point to clone.
     * @returns A new point with same values as the original.
     */
    function clone(pointToClone: IPoint): IPoint;
    /**
     * 从点数组中，找到与给定参考点最近的点.
     *
     * @param referencePoint The reference point.
     * @param pointOptions Array of points to choose from.
     * @returns The first closest point from the pointOptions.
     */
    function closest(referencePoint: IPoint, pointOptions: IPoint[]): IPoint;
    /**
     * 从极坐标获取一个点.
     *
     * @param angleInRadians 极坐标的角度，以弧度为单位.
     * @param radius The radius of the polar coordinate.
     * @returns A new point object.
     */
    function fromPolar(angleInRadians: number, radius: number): IPoint;
    /**
     * 以给定的角度获取圆或弧路径上的点.
     * @param angleInDegrees 要查找点的角度（以度为单位）.
     * @param circle A circle or arc.
     * @returns A new point object.
     */
    function fromAngleOnCircle(angleInDegrees: number, circle: IPathCircle): IPoint;
    /**
     * 获取弧形路径的两个端点.
     *
     * @param arc The arc path object.
     * @returns 包含 2 个元素的数组：[0] 是对应于起始角度的点对象，[1] 是对应于结束角度的点对象.
     */
    function fromArc(arc: IPathArc): IPoint[];
    /**
     * 获取路径的两个端点.
     *
     * @param pathContext The path object.
     * @returns 包含 2 个元素的数组：[0] 是对应于原点的点对象，[1] 是对应于终点的点对象.
     */
    function fromPathEnds(pathContext: IPath, pathOffset?: IPoint): IPoint[];
    /**
     * 计算两条线的斜率相交.
     *
     * @param lineA First line to use for slope.
     * @param lineB Second line to use for slope.
     * @param options Optional IPathIntersectionOptions.
     * @returns 两个斜坡的交点，如果坡度不相交，则为空.
     */
    function fromSlopeIntersection(lineA: IPathLine, lineB: IPathLine, options?: IPathIntersectionBaseOptions): IPoint;
    /**
     * 获取路径的中点.
     *
     * @param pathContext The path object.
     * @param ratio 路径上点的可选比率（介于 0 和 1 之间）。中间默认值为 .5.
     * @returns 路径上的点，在路径的中间.
     */
    function middle(pathContext: IPath, ratio?: number): IPoint;
    /**
     * 创建点的克隆，在 x 轴和 y 轴上或两个轴上镜像.
     *
     * @param pointToMirror The point to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored point.
     */
    function mirror(pointToMirror: IPoint, mirrorX: boolean, mirrorY: boolean): IPoint;
    /**
     * 四舍五入点的值.
     *
     * @param pointContext The point to serialize.
     * @param accuracy Optional exemplar number of decimal places.
     * @returns A new point with the values rounded.
     */
    function rounded(pointContext: IPoint, accuracy?: number): IPoint;
    /**
     * 旋转点.
     *
     * @param pointToRotate The point to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns A new point.
     */
    function rotate(pointToRotate: IPoint, angleInDegrees: number, rotationOrigin?: IPoint): IPoint;
    /**
     * 缩放点的坐标.
     *
     * @param pointToScale The point to scale.
     * @param scaleValue The amount of scaling.
     * @param basePoint The basePoint of scaling.
     * @returns A new point.
     */
    function scale(pointToScale: IPoint, scaleValue: number, basePoint?: IPoint): IPoint;
    /**
     * 扭曲点.
     *
     * @param pointToDistort The point to distort.
     * @param scaleX The amount of x scaling.
     * @param scaleY The amount of y scaling.
     * @returns A new point.
     */
    function distort(pointToDistort: IPoint, scaleX: number, scaleY: number): IPoint;
    /**
     * 从另一个点减去一个点，并将结果作为新点返回. Add(a, b, subtract = true).
     *
     * @param a First point.
     * @param b Second point.
     * @returns A new point object.
     */
    function subtract(a: IPoint, b: IPoint): IPoint;
    /**
     * 位于 0，0 坐标处的点.
     *
     * @returns A new point.
     */
    function zero(): IPoint;
}
declare namespace vjgeo.path {
    /**
     * 添加模型的路径。
     * ```
     * parentModel.paths[pathId] = childPath;
     * ```
     *
     * @param childPath The path to add.
     * @param parentModel The model to add to.
     * @param pathId The id of the path.
     * @param 覆盖可选标志以覆盖 pathId 引用的任何路径。默认值为 false，这将创建一个类似于 pathId 的 id.
     * @returns The original path (for cascading).
     */
    function addTo(childPath: IPath, parentModel: IModel, pathId: string, overwrite?: boolean): IPath;
    /**
     * 创建路径的克隆。这比克隆对象更快.
     *
     * @param pathToClone The path to clone.
     * @param offset 可选点移动路径相对距离.
     * @returns Cloned path.
     */
    function clone(pathToClone: IPath, offset?: IPoint): IPath;
    /**
     * 将一个路径的属性复制到另一个路径.
     *
     * @param srcPath The source path to copy property values from.
     * @param destPath The destination path to copy property values to.
     * @returns The source path.
     */
    function copyProps(srcPath: IPath, destPath: IPath): IPath;
    /**
     * 设置路径图层.
     * ```
     * pathContext.layer = layer;
     * ```
     *
     * @param pathContext The path to set the layer.
     * @param layer The layer name.
     * @returns The original path (for cascading).
     */
    function layer(pathContext: IPath, layer: string): IPath;
    /**
     * 设置路径的属性数据。
     * ```
     * pathContext.data = data;
     * ```
     *
     * @param pathContext The path to set the data.
     * @param data The data
     * @returns The original path (for cascading).
     */
    function data(pathContext: IPath, data: IProperties): IPath;
    /**
     * 创建路径的克隆，在 x 轴和 y 轴上或两个轴上镜像.
     *
     * @param pathToMirror The path to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored path.
     */
    function mirror(pathToMirror: IPath, mirrorX: boolean, mirrorY: boolean): IPath;
    /**
     * 将路径移动到绝对点.
     *
     * @param pathToMove The path to move.
     * @param origin The new origin for the path.
     * @returns The original path (for cascading).
     */
    function move(pathToMove: IPath, origin: IPoint): IPath;
    /**
     * 按相对量移动路径的原点.
     *
     * @param pathToMove The path to move.
     * @param delta 作为点对象的 x 和 y 调整.
     * @param subtract 可选的布尔值减去而不是加法.
     * @returns The original path (for cascading).
     */
    function moveRelative(pathToMove: IPath, delta: IPoint, subtract?: boolean): IPath;
    /**
     * 在任务执行期间临时相对移动一些路径，然后取消移动它们.
     *
     * @param pathsToMove The paths to move.
     * @param deltas The x & y adjustments as a point object array.
     * @param task The function to call while the paths are temporarily moved.
     */
    function moveTemporary(pathsToMove: IPath[], deltas: IPoint[], task: Function): void;
    /**
     * 旋转路径.
     *
     * @param pathToRotate The path to rotate.
     * @param angleInDegrees 旋转量，以度为单位.
     * @param rotationOrigin 旋转中心点.
     * @returns The original path (for cascading).
     */
    function rotate(pathToRotate: IPath, angleInDegrees: number, rotationOrigin?: IPoint): IPath;
    /**
     * 缩放路径.
     *
     * @param pathToScale The path to scale.
     * @param scaleValue 缩放量.
     * @param basePoint 缩放的基点.
     * @returns The original path (for cascading).
     */
    function scale(pathToScale: IPath, scaleValue: number, basePoint?: IPoint): IPath;
    /**
     * 扭曲路径 - 分别缩放 x 和 y.
     *
     * @param pathToDistort The path to distort.
     * @param scaleX x 缩放量.
     * @param scaleY y 缩放量.
     * @returns 新的IModel（用于圆和弧）或IPath（用于线和贝塞尔曲线）.
     */
    function distort(pathToDistort: IPath, scaleX: number, scaleY: number): IModel | IPath;
    /**
     * 在斜率交点连接 2 条线.
     *
     * @param lineA First line to converge.
     * @param lineB Second line to converge.
     * @param useOriginA 用于线 A 的起点而不是终点的可选标志.
     * @param useOriginB 用于线 B 的起点而不是终点的可选标志.
     * @returns point of convergence.
     */
    function converge(lineA: IPathLine, lineB: IPathLine, useOriginA?: boolean, useOriginB?: boolean): IPoint;
    /**
     * 通过延长或缩短路径来更改路径.
     *
     * @param pathToAlter Path to alter.
     * @param distance 要在路径中添加或删除的长度数字量。使用正数延长，负数缩短。缩短时：此函数不会更改路径，如果生成的路径长度小于或等于零，则返回 null.
     * @param useOrigin 可选标志，用于从起点而不是路径末尾更改.
     * @returns 原始路径（用于级联），如果无法更改路径，则为 null.
     */
    function alterLength(pathToAlter: IPath, distance: number, useOrigin?: boolean): IPath;
    /**
     * 沿路径获取点.
     *
     * @param pathContext Path to get points from.
     * @param numberOfPoints 划分路径的点数.
     * @returns 路径上的点数组以均匀的间隔分布.
     */
    function toPoints(pathContext: IPath, numberOfPoints: number): IPoint[];
    /**
     * 沿路径获取关键点（最少数量的点）.
     *
     * @param pathContext Path to get points from.
     * @param maxArcFacet 圆弧或圆上点之间的可选最大长度.
     * @returns Array of points which are on the path.
     */
    function toKeyPoints(pathContext: IPath, maxArcFacet?: number): IPoint[];
    /**
     * 将路径居中位于 [0， 0].
     *
     * @param pathToCenter The path to center.
     * @returns The original path (for cascading).
     */
    function center(pathToCenter: IPath): IPath;
    /**
     * 移动路径，使其边界框从 [0， 0] 开始.
     *
     * @param pathToZero The path to zero.
     * @returns The original path (for cascading).
     */
    function zero(pathToZero: IPath): IPath;
}
declare namespace vjgeo.path {
    /**
     * 将一条路径一分为二。提供的路径将在提供的中断点处结束,
     * 返回一条新路径，该路径从 pointOfBreak 开始，到提供的路径的初始终点结束.
     * 对于 Circle，原始路径将就地转换为 Arc，并返回 null.
     *
     * @param pathToBreak The path to break.
     * @param pointOfBreak The point at which to break the path.
     * @returns 当路径类型为直线或圆弧时，相同类型的新路径。为圆返回空值.
     */
    function breakAtPoint(pathToBreak: IPath, pointOfBreak: IPoint): IPath;
}
declare namespace vjgeo.paths {
    /**
     * 圆弧形路径类.
     */
    class Arc implements IPathArc {
        origin: IPoint;
        radius: number;
        startAngle: number;
        endAngle: number;
        type: string;
        data: IProperties;
        /**
         * 圆弧路径的类，从原点、半径、起始角度和结束角度创建.
         *
         * @param origin The center point of the arc.
         * @param radius The radius of the arc.
         * @param startAngle The start angle of the arc.
         * @param endAngle The end angle of the arc.
         * @param data 属性数据
         */
        constructor(origin: IPoint, radius: number, startAngle: number, endAngle: number, data?: IProperties);
        /**
         * 圆弧路径类，由 2 个点、半径、是否长度多的一段标志和顺时针标志创建.
         *
         * @param pointA First end point of the arc.
         * @param pointB Second end point of the arc.
         * @param radius The radius of the arc.
         * @param largeArc 是否长度多的一段，用于指示顺时针方向的布尔标志.
         * @param clockwise 用于指示顺时针方向的布尔标志.
         * @param data properities data
         */
        constructor(pointA: IPoint, pointB: IPoint, radius: number, largeArc: boolean, clockwise: boolean, data?: IProperties);
        /**
         * 圆弧路径类，由 2 个点和指示顺时针的可选布尔标志创建.
         *
         * @param pointA First end point of the arc.
         * @param pointB Second end point of the arc.
         * @param clockwise 用于指示顺时针方向的布尔标志.
         * @param data properities data
         */
        constructor(pointA: IPoint, pointB: IPoint, clockwise?: boolean, data?: IProperties);
        /**
         * 圆弧路径类，由 3 个点创建.
         *
         * @param pointA First end point of the arc.
         * @param pointB Middle point on the arc.
         * @param pointC Second end point of the arc.
         * @param data properities data
         */
        constructor(pointA: IPoint, pointB: IPoint, pointC: IPoint, data?: IProperties);
    }
    /**
     * 圆路径类.
     */
    class Circle implements IPathCircle {
        type: string;
        origin: IPoint;
        radius: number;
        data: IProperties;
        /**
         * 圆路径的类，从半径创建。圆心将为 [0， 0].
         *
         * Example:
         * ```
         * var c = new vjgeo.paths.Circle(7);
         * ```
         *
         * @param radius The radius of the circle.
         * @param data properities data
         */
        constructor(radius: number, data?: IProperties);
        /**
         * 圆路径的类，从圆心和半径创建.
         *
         * Example:
         * ```
         * var c = new vjgeo.paths.Circle([10, 10], 7);
         * ```
         *
         * @param origin The center point of the circle.
         * @param radius The radius of the circle.
         * @param data properities data
         */
        constructor(origin: IPoint, radius: number, data?: IProperties);
        /**
         * 圆形路径类，从 2 个点创建.
         *
         * Example:
         * ```
         * var c = new vjgeo.paths.Circle([5, 15], [25, 15]);
         * ```
         *
         * @param pointA First point on the circle.
         * @param pointB Second point on the circle.
         * @param data properities data
         */
        constructor(pointA: IPoint, pointB: IPoint, data?: IProperties);
        /**
         * 圆形路径的类，从 3 个点创建.
         *
         * Example:
         * ```
         * var c = new vjgeo.paths.Circle([0, 0], [0, 10], [20, 0]);
         * ```
         *
         * @param pointA First point on the circle.
         * @param pointB Second point on the circle.
         * @param pointC Third point on the circle.
         * @param data properities data
         */
        constructor(pointA: IPoint, pointB: IPoint, pointC: IPoint, data?: IProperties);
    }
    /**
     * 路径类.
     */
    class Line implements IPathLine {
        type: string;
        origin: IPoint;
        end: IPoint;
        data: IProperties;
        /**
         * 线路径类，由 2 个点的数组构造.
         *
         * @param points Array of 2 points.
         * @param data properities data
         */
        constructor(points: IPoint[], data?: IProperties);
        /**
         * 线路径类，由 2 个点构造.
         *
         * @param origin The origin point of the line.
         * @param end The end point of the line.
         * @param data properities data
         */
        constructor(origin: IPoint, end: IPoint, data?: IProperties);
    }
    /**
     * 弦类，它只是连接圆弧端点的线路径.
     *
     * @param arc Arc to use as the basic for the chord.
     */
    class Chord implements IPathLine {
        type: string;
        origin: IPoint;
        end: IPoint;
        data: IProperties;
        constructor(arc: IPathArc, data?: IProperties);
    }
    /**
     * 平行线路径类.
     *
     * @param toLine A line to be parallel to.
     * @param distance 平行线和原始线之间的距离.
     * @param nearPoint 确定要放置平行线的哪一侧的任何点.
     * @param data properities data
     */
    class Parallel implements IPathLine {
        type: string;
        origin: IPoint;
        end: IPoint;
        data: IProperties;
        constructor(toLine: IPathLine, distance: number, nearPoint: IPoint, data?: IProperties);
    }
}
declare namespace vjgeo.model {
    /**
     * 向模型添加标题对象.
     * @param modelContext The model to add to.
     * @param text Text to add.
     * @param leftAnchorPoint 文本左侧中间的可选点.
     * @param rightAnchorPoint 文本右侧中间的可选点.
     * @returns The original model (for cascading).
     */
    function addCaption(modelContext: IModel, text: string, leftAnchorPoint?: IPoint, rightAnchorPoint?: IPoint): IModel;
    /**
     * 添加路径作为子路径:
     * ```
     * parentModel.paths[childPathId] = childPath;
     * ```
     * with additional checks to make it safe for cascading.
     *
     * @param modelContext The model to add to.
     * @param pathContext The path to add.
     * @param pathId The id of the path.
     * @param overWrite Optional 标志以覆盖 pathId 引用的任何路径。默认值为 false，这将创建一个类似于 pathId 的 id.
     * @returns The original model (for cascading).
     */
    function addPath(modelContext: IModel, pathContext: IPath, pathId: string, overWrite?: boolean): IModel;
    /**
     * 将模型添加为子模型:
     * ```
     * parentModel.models[childModelId] = childModel;
     * ```
     *
     * @param parentModel The model to add to.
     * @param childModel The model to add.
     * @param childModelId The id of the child model.
     * @param overWrite 用于覆盖子模型 ID 引用的任何模型的可选标志。默认值为 false，这将创建一个类似于 childModelId 的 id.
     * @returns The original model (for cascading).
     */
    function addModel(parentModel: IModel, childModel: IModel, childModelId: string, overWrite?: boolean): IModel;
    /**
     * 将一个模型添加为另一个模型的子模型.
     * ```
     * parentModel.models[childModelId] = childModel;
     * ```
     *
     * @param childModel The model to add.
     * @param parentModel The model to add to.
     * @param childModelId The id of the child model.
     * @param overWrite Optional 标志以覆盖子模型 ID 引用的任何模型。默认值为 false，这将创建一个类似于 childModelId 的 id.
     * @returns The original model (for cascading).
     */
    function addTo(childModel: IModel, parentModel: IModel, childModelId: string, overWrite?: boolean): IModel;
    /**
     * 克隆模型。别名 vjgeo.cloneObject（modelToClone）
     *
     * @param modelToClone The model to clone.
     * @returns A clone of the model you passed.
     */
    function clone(modelToClone: IModel): IModel;
    /**
     * 计算给定模型中子模型的数量.
     *
     * @param modelContext The model containing other models.
     * @returns Number of child models.
     */
    function countChildModels(modelContext: IModel): number;
    /**
     * 获取此模型中处于绝对位置的所有 Caption 对象及其子模型.
     * @param modelContext The model to search for Caption objects.
     * @returns Array of Caption objects.
     */
    function getAllCaptionsOffset(modelContext: IModel): (ICaption & {
        layer?: string;
    })[];
    /**
     * 在模型映射中获取具有相同前缀的未使用 id.
     *
     * @param modelContext The model containing the models map.
     * @param modelId 直接使用的 id（如果未使用）或用作前缀.
     */
    function getSimilarModelId(modelContext: IModel, modelId: string): string;
    /**
     * 在路径映射中获取具有相同前缀的未使用 ID.
     *
     * @param modelContext The model containing the paths map.
     * @param pathId 直接使用（如果未使用）或作为前缀的 id。
     */
    function getSimilarPathId(modelContext: IModel, pathId: string): string;
    /**
     * 设置模型的图层名称。
     * ```
     * modelContext.layer = layer;
     * ```
     *
     * @param modelContext The model to set the layer.
     * @param layer The layer name.
     * @returns The original model (for cascading).
     */
    function layer(modelContext: IModel, layer: string): IModel;
    /**
     * 设置模型的属性数据。
     * ```
     * modelContext.data = data;
     * ```
     *
     * @param modelContext The model to set the properties.
     * @param data The data
     * @returns The original model (for cascading).
     */
    function data(modelContext: IModel, data: IProperties): IModel;
    /**
     * 将模型的所有子项（模型和路径，递归方式）移动到同一个坐标空间。当子点之间的点需要相互连接时很有用.
     *
     * @param modelToOriginate The model to originate.
     * @param origin Optional offset reference point.
     * @returns The original model (for cascading).
     */
    function originate(modelToOriginate: IModel, origin?: IPoint): IModel;
    /**
     * 将模型居中 [0， 0].
     *
     * @param modelToCenter The model to center.
     * @param centerX Boolean 以 X 轴为中心。默认值为 true.
     * @param centerY Boolean 以 y 轴为中心。默认值为 true.
     * @returns The original model (for cascading).
     */
    function center(modelToCenter: IModel, centerX?: boolean, centerY?: boolean): IModel;
    /**
     * 创建模型的克隆，在 x 轴和 y 轴上或两个轴上镜像.
     *
     * @param modelToMirror The model to mirror.
     * @param mirrorX Boolean 在 X 轴上镜像.
     * @param mirrorY Boolean 在 Y 轴上镜像.
     * @returns Mirrored model.
     */
    function mirror(modelToMirror: IModel, mirrorX: boolean, mirrorY: boolean): IModel;
    /**
     * 将模型移动到绝对点。请注意，这也是通过直接设置 origin 属性来实现的。此函数用于级联.
     *
     * @param modelToMove The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for cascading).
     */
    function move(modelToMove: IModel, origin: IPoint): IModel;
    /**
     * 按相对量移动模型的原点.
     *
     * @param modelToMove The model to move.
     * @param delta 作为点对象的 x 和 y 调整.
     * @returns The original model (for cascading).
     */
    function moveRelative(modelToMove: IModel, delta: IPoint): IModel;
    /**
     * 为模型中路径的 id 添加前缀.
     *
     * @param modelToPrefix The model to prefix.
     * @param prefix The prefix to prepend on paths ids.
     * @returns The original model (for cascading).
     */
    function prefixPathIds(modelToPrefix: IModel, prefix: string): IModel;
    /**
     * 旋转模型.
     *
     * @param modelToRotate The model to rotate.
     * @param angleInDegrees 旋转量，以度为单位.
     * @param rotationOrigin 旋转中心点.
     * @returns The original model (for cascading).
     */
    function rotate(modelToRotate: IModel, angleInDegrees: number, rotationOrigin?: IPoint): IModel;
    /**
     * 缩放模型.
     *
     * @param modelToScale The model to scale.
     * @param scaleValue 缩放量.
     * @param scaleOrigin 用于缩放原点的可选布尔值。对于根模型通常为 false，通常为 false。.
     * @param basePoint 缩放的基点.
     * @param isBasePointRelative 缩放的基点是否是相对于模型的坐标（没有包含origin). 默认是绝对坐标.
     * @returns The original model (for cascading).
     */
    function scale(modelToScale: IModel, scaleValue: number, scaleOrigin?: boolean, basePoint?: IPoint, isBasePointRelative?: boolean): IModel;
    /**
     * 模型的扭曲 - 分别缩放 x 和 y.
     *
     * @param modelToDistort The model to distort.
     * @param scaleX x 缩放量.
     * @param scaleY y 缩放量.
     * @param scaleOrigin 用于缩放原点的可选布尔值。对于根模型通常为 false，通常为 false。.
     * @param bezierAccuracy 贝塞尔曲线的可选精度.
     * @returns New model (for cascading).
     */
    function distort(modelToDistort: IModel, scaleX: number, scaleY: number, scaleOrigin?: boolean, bezierAccuracy?: number): IModel;
    /**
     * 转换模型以匹配不同的单位系统.
     *
     * @param modeltoConvert The model to convert.
     * @param destUnitType The unit system.
     * @returns The scaled model (for cascading).
     */
    function convertUnits(modeltoConvert: IModel, destUnitType: string): IModel;
    /**
     * 递归遍历给定模型的所有子模型和路径.
     *
     * @param modelContext The model to walk.
     * @param options Object containing callbacks.
     * @returns The original model (for cascading).
     */
    function walk(modelContext: IModel, options: IWalkOptions): IModel;
    /**
     * 移动模型，使其边界框从 [0， 0] 开始.
     *
     * @param modelToZero The model to zero.
     * @param zeroX Boolean to zero on the x axis. Default is true.
     * @param zeroY Boolean to zero on the y axis. Default is true.
     * @returns The original model (for cascading).
     */
    function zero(modelToZero: IModel, zeroX?: boolean, zeroY?: boolean): IModel;
}
declare namespace vjgeo.model {
    /**
     * 断开模型与另一路径相交的路径.
     *
     * @param modelToBreak 包含要断开的路径的模型.
     * @param modelToIntersect 包含查找交集的路径的可选模型，否则将使用 modelToBreak.
     * @returns The original model (for cascading).
     */
    function breakPathsAtIntersections(modelToBreak: IModel, modelToIntersect?: IModel): IModel;
    /**
     * 组合 2 个模型。每个模型都将相应地修改.
     *
     * @param modelA 第一个组合模型.
     * @param modelB 第二个要组合的模型.
     * @param includeAInsideB 标志以包含模型 A 中位于模型 B 内部的路径.
     * @param includeAOutsideB 标志以包含模型 A 中位于模型 B 外部的路径.
     * @param includeBInsideA 标志以包含模型 B 中位于模型 A 内部的路径.
     * @param includeBOutsideA 标志以包含模型 B 中位于模型 A 外部的路径.
     * @param options 可选 ICombineOptions 对象.
     * @returns 包含“a”和“b”两个输入模型的新模型.
     */
    function combine(modelA: IModel, modelB: IModel, includeAInsideB?: boolean, includeAOutsideB?: boolean, includeBInsideA?: boolean, includeBOutsideA?: boolean, options?: ICombineOptions): IModel;
    /**
     * 合并 2 个模型，产生相交。每个模型都将相应地修改.
     *
     * @param modelA 第一个组合模型.
     * @param modelB 第二个要组合的模型.
     * @returns 包含“a”和“b”两个输入模型的新模型.
     */
    function combineIntersection(modelA: IModel, modelB: IModel): IModel;
    /**
     * 合并 2 个模型，结果从 A 中减去 B。每个模型都将相应地修改.
     *
     * @param modelA 第一个组合模型.
     * @param modelB 第二个要组合的模型.
     * @returns 包含“a”和“b”两个输入模型的新模型.
     */
    function combineSubtraction(modelA: IModel, modelB: IModel): IModel;
    /**
     * 合并 2 个模型，形成一个联合。每个模型都将相应地修改.
     *
     * @param modelA 第一个组合模型.
     * @param modelB 第二个要组合的模型.
     * @returns 包含“a”和“b”两个输入模型的新模型.
     */
    function combineUnion(modelA: IModel, modelB: IModel): IModel;
}
declare namespace vjgeo {
    /**
     * 比较键以查看它们是否相等.
     */
    interface ICollectionKeyComparer<K> {
        (a: K, b: K): boolean;
    }
    /**
     * 共享公用键的项的集合.
     */
    interface ICollection<K, T> {
        key: K;
        items: T[];
    }
    /**
     * 收集共享公用键的项.
     */
    class Collector<K, T> {
        private comparer?;
        collections: ICollection<K, T>[];
        constructor(comparer?: ICollectionKeyComparer<K>);
        addItemToCollection(key: K, item: T): void;
        findCollection(key: K, action?: (index: number) => void): T[];
        removeCollection(key: K): boolean;
        removeItemFromCollection(key: K, item: T): boolean;
        getCollectionsOfMultiple(cb: (key: K, items: T[]) => void): void;
    }
    /**
     * 存储在 PointGraph 索引中的元素类型.
     */
    interface IPointGraphIndexElement {
        /**
         * The point.
         */
        point: IPoint;
        /**
         * The id of this point.
         */
        pointId: number;
        /**
         * 其他 pointId 的数组与此合并.
         */
        merged?: number[];
        /**
         * Array of valueId's for this point.
         */
        valueIds: number[];
        /**
         * This point's ordinal position in the kd-tree.
         */
        kdId?: number;
    }
    /**
     * 位于相同点上的项目图表.
     */
    class PointGraph<T> {
        /**
         * Number of points inserted
         */
        insertedCount: number;
        /**
         * 按 x 然后按 y 映射到点 id 的唯一点。即使在合并后，这将保持不变.
         */
        graph: {
            [x: number]: {
                [y: number]: number;
            };
        };
        /**
         * Index of points by id.
         */
        index: {
            [pointId: number]: IPointGraphIndexElement;
        };
        /**
         * Map of point ids which once existed but have been merged into another id due to close proximity.
         */
        merged: {
            [pointId: number]: number;
        };
        /**
         * List of values inserted at points.
         */
        values: T[];
        /**
         * KD tree object.
         */
        private kdbush;
        constructor();
        /**
         * 将存储的点、图形、列表重置为初始状态.
         */
        reset(): void;
        /**
         * 插入值.
         * @param value Value associated with this point.
         * @returns valueId of the inserted value.
         */
        insertValue(value: T): number;
        /**
         * 在点处插入值.
         * @param p Point.
         * @param value Value associated with this point.
         */
        insertValueIdAtPoint(valueId: number, p: IPoint): {
            existed: boolean;
            pointId: number;
        };
        /**
         * 合并彼此之间给定距离内的点。插入值后调用此值.
         * @param withinDistance Distance to consider points equal.
         */
        mergePoints(withinDistance: number): void;
        /**
         * 查找只有一个关联值的所有点。然后，合并到此集合中最近的其他点.
         * 插入值后调用此值.
         * @param 距离内认为点相等的距离.
         */
        mergeNearestSinglePoints(withinDistance: number): void;
        private mergeIndexElements;
        /**
         * 迭代索引中的点.
         * @param cb Callback for each point in the index.
         */
        forEachPoint(cb: (p: IPoint, values: T[], pointId?: number, el?: IPointGraphIndexElement) => void): void;
        /**
         * 在合并后获取点的 id.
         * @param p Point to look up id.
         */
        getIdOfPoint(p: IPoint): number;
        /**
         * 合并后获取点的索引元素.
         * @param p Point to look up index element.
         */
        getElementAtPoint(p: IPoint): IPointGraphIndexElement;
    }
}
declare namespace vjgeo.model {
    /**
     * 通过减少冗余来简化模型的路径：将多个重叠路径合并为一条路径。
     *
     * @param modelContext The originated model to search for similar paths.
     * @param options Optional options object.
     * @returns The simplified model (for cascading).
     */
    function simplify(modelToSimplify: IModel, options?: ISimplifyOptions): IModel;
}
declare namespace vjgeo.path {
    /**
     * 通过创建围绕路径的模型来扩展路径.
     *
     * @param pathToExpand Path to expand.
     * @param expansion Distance to expand.
     * @param isolateCaps 可选标志，用于将end caps放入名为“caps”的单独模型中.
     * @returns Model which surrounds the path.
     */
    function expand(pathToExpand: IPath, expansion: number, isolateCaps?: boolean): IModel;
    /**
     * 使用直线表示弧.
     *
     * @param arc 要拉直的圆弧对象.
     * @param bevel 可选标志，用于倾斜角度以防止其过于尖锐.
     * @param prefix 要应用于路径 ID 的可选字符串前缀.
     * @param close 可选标志，用于通过连接端点创建闭合几何图形.
     * @returns Model of straight lines with same endpoints as the arc.
     */
    function straighten(arc: IPathArc, bevel?: boolean, prefix?: string, close?: boolean): IModel;
}
declare namespace vjgeo.model {
    /**
     * 展开模型中的所有路径，然后合并生成的扩展.
     *
     * @param modelToExpand Model to expand.
     * @param distance Distance to expand.
     * @param joints 路径之间关节处的点数。圆接头使用 0，尖头接头使用 1，斜面接头使用 2.
     * @param combineOptions Optional object containing combine options.
     * @returns 围绕原始模型路径的模型.
     */
    function expandPaths(modelToExpand: IModel, distance: number, joints?: number, combineOptions?: ICombineOptions): IModel;
    /**
     * 按指定的距离勾勒模型轮廓。
     *
     * @param modelToOutline Model to outline.
     * @param distance Distance to outline.
     * @param joints 路径之间关节处的点数。圆接头使用 0，尖头接头使用 1，斜面接头使用 2.
     * @param inside 可选的布尔值，用于在模型内部而不是外部绘制线条.
     * @param options Options to send to combine() function.
     * @returns Model which surrounds the paths outside of the original model.
     */
    function outline(modelToOutline: IModel, distance: number, joints?: number, inside?: boolean, options?: ICombineOptions): IModel;
}
declare namespace vjgeo.units {
    /**
     * 获取源单位和目标单位之间的转换比率.
     *
     * @param srcUnitType unitType converting from.
     * @param destUnitType unitType converting to.
     * @returns Numeric ratio of the conversion.
     */
    function conversionScale(srcUnitType: string, destUnitType: string): number;
    /**
     * 检查单位类型是否为有效的单位.
     *
     * @param tryUnit unit type to check.
     * @returns Boolean true if unit type is valid.
     */
    function isValidUnit(tryUnit: string): boolean;
}
declare namespace vjgeo.measure {
    /**
     * 确定两个角度是否相等.
     *
     * @param angleA First angle.
     * @param angleB Second angle.
     * @returns true if angles are the same, false if they are not
     */
    function isAngleEqual(angleA: number, angleB: number, accuracy?: number): boolean;
    /**
     * 判断两条路径是否相等.
     *
     * @param pathA First path.
     * @param pathB Second path.
     * @returns true if paths are the same, false if they are not
     */
    function isPathEqual(pathA: IPath, pathB: IPath, withinPointDistance?: number, pathAOffset?: IPoint, pathBOffset?: IPoint): boolean;
    /**
     * 判断两个点是否相等.
     *
     * @param a First point.
     * @param b Second point.
     * @param withinDistance 将点视为相等的可选距离.
     * @returns true if points are the same, false if they are not
     */
    function isPointEqual(a: IPoint, b: IPoint, withinDistance?: number): boolean;
    /**
     * 确定点在点数组中是否不同.
     *
     * @param pointToCheck point to check.
     * @param pointArray array of points.
     * @param withinDistance 将点视为相等的可选距离.
     * @returns false if point is equal to any point in the array.
     */
    function isPointDistinct(pointToCheck: IPoint, pointArray: IPoint[], withinDistance?: number): boolean;
    /**
     * 确定点是否在斜坡上.
     *
     * @param p Point to check.
     * @param b Slope.
     * @param withinDistance 可选公差距离.
     * @returns true if point is on the slope
     */
    function isPointOnSlope(p: IPoint, slope: ISlope, withinDistance?: number): boolean;
    /**
     * 确定点是否在圆上.
     *
     * @param p Point to check.
     * @param circle Circle.
     * @param withinDistance 可选公差距离.
     * @returns true if point is on the circle
     */
    function isPointOnCircle(p: IPoint, circle: IPathCircle, withinDistance?: number): boolean;
    /**
     * 确定点是否位于路径上.
     * @param pointToCheck point to check.
     * @param onPath path to check against.
     * @param withinDistance 要考虑路径上点的可选距离.
     * @param pathOffset Optional offset of path from [0, 0].
     * @param options Optional IIsPointOnPathOptions to cache computation.
     */
    function isPointOnPath(pointToCheck: IPoint, onPath: IPath, withinDistance?: number, pathOffset?: IPoint, options?: IIsPointOnPathOptions): boolean;
    /**
     * 判断坡度是否相等.
     *
     * @param slopeA The ISlope to test.
     * @param slopeB The ISlope to check for equality.
     * @returns Boolean true if slopes are equal.
     */
    function isSlopeEqual(slopeA: ISlope, slopeB: ISlope): boolean;
    /**
     * 判断平行斜率.
     *
     * @param slopeA The ISlope to test.
     * @param slopeB The ISlope to check for parallel.
     * @returns Boolean true if slopes are parallel.
     */
    function isSlopeParallel(slopeA: ISlope, slopeB: ISlope): boolean;
}
declare namespace vjgeo.measure {
    /**
     * 在原有测量值上面增加一个新的测量值.
     *
     * @param baseMeasure 原有测量值.
     * @param addMeasure 新的测量值.
     * @param augmentBaseMeasure 用于调用测量的可选标志。.
     * @returns 增加的原始测量值（用于级联）.
     */
    function increase(baseMeasure: IMeasure, addMeasure: IMeasure, augmentBaseMeasure?: boolean): IMeasure;
    /**
     * 检查弧是否朝向给定点凹陷或凸起.
     *
     * @param arc The arc to test.
     * @param towardsPoint The point to test.
     * @returns Boolean true if arc is concave towards point.
     */
    function isArcConcaveTowardsPoint(arc: IPathArc, towardsPoint: IPoint): boolean;
    /**
     * 检查弧是否与另一个弧重叠.
     *
     * @param arcA The arc to test.
     * @param arcB The arc to check for overlap.
     * @param excludeTangents 布尔值以排除确切的端点并仅查找深度重叠.
     * @returns Boolean true if arcA is overlapped with arcB.
     */
    function isArcSpanOverlapping(arcA: IPathArc, arcB: IPathArc, excludeTangents: boolean): boolean;
    /**
     * 检查给定的数字是否在两个给定限制之间.
     *
     * @param valueInQuestion The number to test.
     * @param limitA First limit.
     * @param limitB Second limit.
     * @param exclusive 要排除等于限制的标志.
     * @returns Boolean true if value is between (or equal to) the limits.
     */
    function isBetween(valueInQuestion: number, limitA: number, limitB: number, exclusive: boolean): boolean;
    /**
     * 检查给定的角度是否介于弧的起始角和结束角之间.
     *
     * @param angleInQuestion The angle to test.
     * @param arc Arc to test against.
     * @param exclusive 要排除的标志等于开始或结束角度.
     * @returns 如果角度介于（或等于）弧的起始角和结束角之间，则布尔值为 true.
     */
    function isBetweenArcAngles(angleInQuestion: number, arc: IPathArc, exclusive: boolean): boolean;
    /**
     * 检查给定点是否位于线的端点之间.
     *
     * @param pointInQuestion The point to test.
     * @param line Line to test against.
     * @param exclusive 要排除等于原点或终点的标志.
     * @returns Boolean true if point is between (or equal to) the line's origin and end points.
     */
    function isBetweenPoints(pointInQuestion: IPoint, line: IPathLine, exclusive: boolean): boolean;
    /**
     * 检查给定的贝塞尔种子是否具有同一斜率上的所有点.
     *
     * @param seed The bezier seed to test.
     * @param exclusive 可选布尔值，仅在终结点边界内进行测试.
     * @returns 如果贝塞尔种子在线斜率上和线端点之间具有控制点，则布尔值为 true.
     */
    function isBezierSeedLinear(seed: IPathBezierSeed, exclusive?: boolean): boolean;
    /**
     * 检查链中的路径流是否顺时针.
     *
     * @param chainContext The chain to test.
     * @param out_result 可选输出对象（如果提供）将使用凸包结果填充.
     * @returns Boolean true if paths in the chain flow clockwise.
     */
    function isChainClockwise(chainContext: IChain, out_result?: {
        hullPoints?: IPoint[];
        keyPoints?: IPoint[];
    }): boolean;
    /**
     * 检查点数组是否顺时针.
     *
     * @param points The array of points to test.
     * @param out_result 可选输出对象（如果提供）将使用凸包结果填充.
     * @returns Boolean true if points flow clockwise.
     */
    function isPointArrayClockwise(points: IPoint[], out_result?: {
        hullPoints?: IPoint[];
        keyPoints?: IPoint[];
    }): boolean;
    /**
     * 检查另一行是否重叠.
     *
     * @param lineA The line to test.
     * @param lineB The line to check for overlap.
     * @param excludeTangents 布尔值以排除确切的端点并仅查找深度重叠.
     * @returns Boolean true if lineA is overlapped with lineB.
     */
    function isLineOverlapping(lineA: IPathLine, lineB: IPathLine, excludeTangents: boolean): boolean;
    /**
     * 检查测量是否与另一个测量重叠.
     *
     * @param measureA The measurement to test.
     * @param measureB The measurement to check for overlap.
     * @returns Boolean true if measureA is overlapped with measureB.
     */
    function isMeasurementOverlapping(measureA: IMeasure, measureB: IMeasure): boolean;
    /**
     * 获取直线的斜率.
     */
    function lineSlope(line: IPathLine): ISlope;
    /**
     * 计算两点之间的距离.
     *
     * @param a First point.
     * @param b Second point.
     * @returns Distance between points.
     */
    function pointDistance(a: IPoint, b: IPoint): number;
    /**
     * 计算包含路径的最小矩形.
     *
     * @param pathToMeasure The path to measure.
     * @returns object with low and high points.
     */
    function pathExtents(pathToMeasure: IPath, addOffset?: IPoint): IMeasure;
    /**
     * 测量路径的长度.
     *
     * @param pathToMeasure The path to measure.
     * @returns Length of the path.
     */
    function pathLength(pathToMeasure: IPath): number;
    /**
     * 测量模型中所有路径的长度.
     *
     * @param modelToMeasure The model containing paths to measure.
     * @returns Length of all paths in the model.
     */
    function modelPathLength(modelToMeasure: IModel): number;
    /**
     * 测量包含模型的最小矩形.
     *
     * @param modelToMeasure The model to measure.
     * @param atlas Optional atlas to save measurements.
     * @returns object with low and high points.
     */
    function modelExtents(modelToMeasure: IModel, atlas?: Atlas): IMeasureWithCenter;
    /**
     * 增强测量 - 添加更多属性，如中心点、高度和宽度.
     *
     * @param measureToAugment The measurement to augment.
     * @returns Measurement object with augmented properties.
     */
    function augment(measureToAugment: IMeasure): IMeasureWithCenter;
    /**
     * A list of maps of measurements.
     *
     * @param modelToMeasure The model to measure.
     * @param atlas Optional atlas to save measurements.
     * @returns object with low and high points.
     */
    class Atlas {
        modelContext: IModel;
        /**
         * 标记已测量的模型.
         */
        modelsMeasured: boolean;
        /**
         * 模型测量图，由路由键映射.
         */
        modelMap: IMeasureMap;
        /**
         * 路径测量地图，由路由键映射.
         */
        pathMap: IMeasureMap;
        /**
         * Constructor.
         * @param modelContext The model to measure.
         */
        constructor(modelContext: IModel);
        measureModels(): void;
    }
    /**
     * 测量模型周围的最小边界六边形。六边形的方向使得左右两侧垂直，顶部和底部是尖的.
     *
     * @param modelToMeasure The model to measure.
     * @returns IBoundingHex object which is a hexagon model, with an additional radius property.
     */
    function boundingHexagon(modelToMeasure: IModel): IBoundingHex;
    /**
     * 检查点是否在模型内部.
     *
     * @param pointToCheck The point to check.
     * @param modelContext The model to check against.
     * @param options 可选的 IMeasurePointInsideOptions 对象。
     * @returns Boolean true if the path is inside of the modelContext.
     */
    function isPointInsideModel(pointToCheck: IPoint, modelContext: IModel, options?: IMeasurePointInsideOptions): boolean;
}
declare namespace vjgeo.exporter {
    /**
     * @private
     */
    interface IExportOptions {
        /**
         * Optional exemplar of number of decimal places.
         */
        accuracy?: number;
        /**
         * Optional unit system to embed in exported file, if the export format allows alternate unit systems.
         */
        units?: string;
    }
    /**
     * Options for JSON export.
     */
    interface IJsonExportOptions extends IExportOptions {
        /**
         * Optional number of characters to indent after a newline.
         */
        indentation?: number;
    }
    /**
     * 导出为JSON格式.
     *
     * @param itemToExport 要导出的项：可以是路径、路径数组或模型对象.
     * @param options Rendering options object.
     * @param options.精度 小数位数的可选示例.
     * @param options.缩进 换行符后缩进的可选字符数.
     * @returns String of content.
     */
    function toJson(itemToExport: any, options?: vjgeo.exporter.IJsonExportOptions): string;
    /**
     * 尝试从模型中获取单位系统
     * @private
     */
    function tryGetModelUnits(itemToExport: any): string;
    /**
     * Named colors, safe for CSS and DXF
     */
    var colors: {
        black: number;
        red: number;
        yellow: number;
        lime: number;
        aqua: number;
        blue: number;
        fuchsia: number;
        white: number;
        gray: number;
        maroon: number;
        orange: number;
        olive: number;
        green: number;
        teal: number;
        navy: number;
        purple: number;
        silver: number;
    };
    interface IStatusCallback {
        (status: {
            progress?: number;
        }): void;
    }
}
declare namespace vjgeo.importer {
    /**
     * 从数字字符串创建数字数组。数字可以用任何非数字分隔.
     *
     * Example:
     * ```
     * var n = vjgeo.importer.parseNumericList('5, 10, 15.20 25-30-35 4e1 .5');
     * ```
     *
     * @param s The string of numbers.
     * @returns Array of numbers.
     */
    function parseNumericList(s: string): number[];
    /**
     * html颜色转实体颜色
     * @param color html
     * @return {number}
     */
    function htmlColorToEntColor(color: string): number;
    /**
     * 从 GeoJson 数据创建模型.
     *
     * @param geoJson GeoJson data.
     * @param options IGeoJsonImportOptions object.
     * @param options.bezierAccuracy 贝塞尔曲线的可选精度.
     * @returns An IModel object.
     */
    function fromGeoJsonData(geoJson: {
        type: "FeatureCollection";
        features: any[];
    }, data?: IProperties): IModel;
}
declare namespace vjgeo.exporter {
    /**
     * 通过颜色索引获取dwg的颜色.
     *
     * @param index 颜色索引.
     * @param isHtmlColor 是否转成html格式的颜色.
     * @returns 颜色值.
     */
    function getDwgColorByIndex(index: number, isHtmlColor?: boolean): string | number[];
    function toDWG(modelToExport: IModel, options?: IDwgRenderOptions): string;
    function toDWG(pathsToExport: IPath[], options?: IDwgRenderOptions): string;
    function toDWG(pathToExport: IPath, options?: IDwgRenderOptions): string;
    /**
     * DWG 图层选项.
     */
    interface IDwgLayerOptions {
        /**
         * DWG layer color.
         */
        color: number;
        /**
         * Text size for TEXT entities.
         */
        fontSize?: number;
    }
    /**
     * DWG rendering options.
     */
    interface IDwgRenderOptions extends IExportOptions, IPointMatchOptions {
        /**
         * 是否使用多段线，否的话，将打散成一条条直线
         */
        noUsePOLYLINE?: boolean;
        /**
        * font size
        */
        fontSize?: number;
        /**
         * 输出文档类型 true为isGeoJson, false为dwg(默认)
         */
        isGeoJson?: boolean;
        /**
         * 离散点个数。默认36
         */
        dispersedPointCount?: number;
    }
}
declare namespace vjgeo.solvers {
    /**
     * 在知道等边三角形边长时求解其高度.
     *
     * @param sideLength 等边三角形一条边的长度（所有 3 条边相等）.
     * @returns 等边三角形的高度.
     */
    function equilateralAltitude(sideLength: number): number;
    /**
     * 求解知道等边三角形高度时的边长.
     *
     * @param altitude 等边三角形的高度.
     * @returns 等边三角形边的长度（所有 3 条边相等）.
     */
    function equilateralSide(altitude: number): number;
    /**
     * 当您知道 3 条边的长度时求解三角形的角度.
     *
     * @param lengthA 三角形边a的长度.
     * @param lengthB 三角形边b的长度.
     * @param lengthC 三角形边c的长度.
     * @returns Angle 角度.
     */
    function solveTriangleSSS(lengthA: number, lengthB: number, lengthC: number): number;
    /**
     * 当您知道一条边的长度和 2 个角时，求解三角形一条边的长度.
     *
     * @param oppositeAngleInDegrees 角1.
     * @param lengthOfSideBetweenAngles 三角形一侧的长度，位于提供的角度之间.
     * @param otherAngleInDegrees 角2.
     * @returns 三角形边c的长度.
     */
    function solveTriangleASA(oppositeAngleInDegrees: number, lengthOfSideBetweenAngles: number, otherAngleInDegrees: number): number;
    /**
     * 求解 2 个圆之间的切线的角度.
     *
     * @param a First circle.
     * @param b Second circle.
     * @param inner 布尔值使用内切线而不是外切线.
     * @returns 角度数组（以度为单位），其中圆之间的 2 条线将与两个圆相切.
     */
    function circleTangentAngles(a: IPathCircle, b: IPathCircle, inner?: boolean): number[];
}
declare namespace vjgeo.path {
    /**
     * 查找 2 条路径相交的点.
     *
     * @param path1 找到交叉点的第一条路径.
     * @param path2 寻找交叉点的第二条路径.
     * @param options 可选 IPath 交集选项.
     * @returns IPath交集对象，具有交点（和角度，当路径是弧形或圆时）;如果路径不相交，则为 null.
     */
    function intersection(path1: IPath, path2: IPath, options?: IPathIntersectionOptions): IPathIntersection;
}
declare namespace vjgeo.path {
    /**
     * 在 2 条线之间的外角添加一个圆角。这些线必须在一个点相遇。
     *
     * @param lineA 圆角的第一行，将对其进行修改以适合圆角.
     * @param lineB 圆角的第二条线，将对其进行修改以适合圆角.
     * @returns 新圆角的弧形路径对象.
     */
    function dogbone(lineA: IPathLine, lineB: IPathLine, filletRadius: number, options?: IPointMatchOptions): IPathArc;
    /**
     * 在 2 条路径之间的内角添加一个圆角。路径必须在一个点相遇。
     *
     * @param pathA 圆角的第一个路径，将对其进行修改以适合圆角.
     * @param pathB 第二条路径到圆角，将对其进行修改以适合圆角.
     * @param filletRadius 圆角半径.
     * @param options 可选的 IPointMatchOptions 对象，用于指定 pointMatchingDistance.
     * @returns 新圆角的弧形路径对象.
     */
    function fillet(pathA: IPath, pathB: IPath, filletRadius: number, options?: IPointMatchOptions): IPathArc;
}
declare namespace vjgeo.chain {
    /**
     * 在链中的每个环节之间添加一个狗骨圆角。每个路径将被裁剪以适合圆角，并且所有圆角将作为返回的模型对象中的路径返回.
     *
     * @param chainToFillet 添加圆角的链条.
     * @param filletRadius 圆角半径.
     * @returns 包含将链中的接头切成圆角的路径的模型对象.
     */
    function dogbone(chainToFillet: IChain, filletRadius: number): IModel;
    /**
     * 在链中的每个环节之间添加一个狗骨圆角。每个路径将被裁剪以适合圆角，并且所有圆角将作为返回的模型对象中的路径返回.
     *
     * @param chainToFillet 添加圆角的链条.
     * @param filletRadii 指定方向半径的对象.
     * @param filletRadii.left 左转圆角半径.
     * @param filletRadii.right 右转圆角半径.
     * @returns 包含将链中的接头切成圆角的路径的模型对象.
     */
    function dogbone(chainToFillet: IChain, filletRadii: {
        left?: number;
        right?: number;
    }): IModel;
    /**
     * 在链中的每个链接之间添加一个圆角。每个路径将被裁剪以适合圆角，并且所有圆角将作为返回的模型对象中的路径返回.
     *
     * @param chainToFillet 添加圆角的链条.
     * @param filletRadius 圆角半径.
     * @returns 包含将链中的接头切成圆角的路径的模型对象.
     */
    function fillet(chainToFillet: IChain, filletRadius: number): IModel;
    /**
     * 在链中的每个链接之间添加一个圆角。每个路径将被裁剪以适合圆角，并且所有圆角将作为返回的模型对象中的路径返回.
     *
     * @param chainToFillet 添加圆角的链条.
     * @param filletRadii 指定方向半径的对象.
     * @param filletRadii.left 左转圆角半径.
     * @param filletRadii.right 右转圆角半径.
     * @returns 包含将链中的接头切成圆角的路径的模型对象.
     */
    function fillet(chainToFillet: IChain, filletRadii: {
        left?: number;
        right?: number;
    }): IModel;
}
declare namespace vjgeo.kit {
    /**
     * 将 JavaScript “apply” 函数与 “new” 关键字结合使用的辅助函数.
     *
     * @param ctor 作为 IKit 的类的构造函数.
     * @param args 传递给构造函数的参数数组.
     * @returns 类的新实例，用于实现 IModel 接口。
     */
    function construct(ctor: IKit, args: any): IModel;
    /**
     * 仅从kit中提取初始参数值.
     *
     * @param ctor 作为 IKit 的类的构造函数.
     * @returns 元参数数组中提供的初始样本值数组.
     */
    function getParameterValues(ctor: IKit): any[];
}
declare namespace vjgeo.model {
    /**
     * 在模型内跨所有层查找单个链。查找链的简写;当您知道模型中只有一个链要查找时很有用.
     *
     * @param modelContext 用于搜索链的模型.
     * @returns 链对象或空（如果未找到链）.
     */
    function findSingleChain(modelContext: IModel): IChain;
    /**
     * 查找具有公共终结点和表单链的路径.
     *
     * @param modelContext The model to search for chains.
     * @param options Optional options object.
     * @returns 链的数组，或链数组的映射（由层 ID 键控） - 如果 options.byLayers 为 true.
     */
    function findChains(modelContext: IModel, options?: IFindChainsOptions): IChain[] | IChainsMap;
    /**
     * 查找具有公共终结点和表单链的路径.
     *
     * @param modelContext The model to search for chains.
     * @param callback Callback function when chains are found.
     * @param options Optional options object.
     * @returns 链的数组，或链数组的映射（由层 ID 键控） - 如果 options.byLayers 为 true.
     */
    function findChains(modelContext: IModel, callback: IChainCallback, options?: IFindChainsOptions): IChain[] | IChainsMap;
}
declare namespace vjgeo.chain {
    /**
     * 转移循环链条的环节.
     *
     * @param chainContext 链条循环通过。一定是循环的.
     * @param amount 要移位的可选链接数。向后循环可能为负值.
     * @returns 链级联上下文.
     */
    function cycle(chainContext: IChain, amount?: number): IChain;
    /**
     * 反转链条的链接.
     *
     * @param chainContext Chain to reverse.
     * @returns The chainContext for cascading.
     */
    function reverse(chainContext: IChain): IChain;
    /**
     * 将循环链的开头设置为路径的已知路由键.
     *
     * @param chainContext Chain to cycle through. Must be endless.
     * @param routeKey RouteKey of the desired path to start the chain with.
     * @returns The chainContext for cascading.
     */
    function startAt(chainContext: IChain, routeKey: string): IChain;
    /**
     * 将链转换为新模型，独立于找到链的任何模型.
     *
     * @param chainContext Chain to convert to a model.
     * @param detachFromOldModel 标志，从其当前父模型中删除链的路径。如果为 false，则将克隆每个路径。如果为 true，则原始路径将重新设置为生成的新模型的父级。默认值为假.
     * @returns A new model containing paths from the chain.
     */
    function toNewModel(chainContext: IChain, detachFromOldModel?: boolean): IModel;
    /**
     * 沿路径链获取点.
     *
     * @param chainContext Chain of paths to get points from.
     * @param distance 沿点之间链的数字距离，或沿每个点之间链的距离的数字数组.
     * @param maxPoints 要检索的最大点数.
     * @returns 链上的点阵列以均匀的间隔分布.
     */
    function toPoints(chainContext: IChain, distanceOrDistances: number | number[], maxPoints?: number): IPoint[];
    /**
     * 沿路径链获取关键点（最少数量的点）.
     *
     * @param chainContext Chain of paths to get points from.
     * @param maxArcFacet The maximum length between points on an arc or circle.
     * @returns Array of points which are on the chain.
     */
    function toKeyPoints(chainContext: IChain, maxArcFacet?: number): IPoint[];
}
declare namespace vjgeo.model {
    /**
     * 从具有未连接到其他路径的端点的模型中删除路径.
     *
     * @param modelContext The model to search for dead ends.
     * @param pointMatchingDistance 可选最大距离，可将两个点视为相同.
     * @param keep 可选的回调函数（应返回布尔值）来决定是否应保留路径.
     * @param trackDeleted 可选的回调函数，将记录丢弃的路径及其被丢弃的原因.
     * @returns The input model (for cascading).
     */
    function removeDeadEnds(modelContext: IModel, pointMatchingDistance?: number, keep?: IWalkPathBooleanCallback, trackDeleted?: (wp: IWalkPath, reason: string) => void): IModel;
}
declare namespace vjgeo.exporter {
}
declare namespace vjgeo.importer {
    /**
     * SVG importing options.
     */
    interface ISVGImportOptions {
        /**
         * Optional accuracy of Bezier curves and elliptic paths.
         */
        bezierAccuracy?: number;
    }
    /**
     * Create a model from SVG path data.
     *
     * @param pathData SVG path data.
     * @param options ISVGImportOptions object.
     * @param options.bezierAccuracy Optional accuracy of Bezier curves.
     * @returns An IModel object.
     */
    function fromSVGPathData(pathData: string, options?: ISVGImportOptions): IModel;
}
declare namespace vjgeo.layout {
    /**
     * 沿路径布局模型的子项.
     * 每个子项的 x 位置将投影到路径上，以便保持子项之间的比例.
     * 每个子项将被旋转，使其垂直于子项x中心的路径.
     *
     * @param parentModel 包含要布局的子项的模型.
     * @param onPath 要布局的道路.
     * @param baseline 从路径垂直位移的数字百分比值。默认值为零.
     * @param reversed 沿路径反向行驶的标志。默认值为false.
     * @param contain 用于在路径长度内包含子布局的标志。默认值为false.
     * @param rotate 用于将子项旋转到垂直的标志。默认值为 true.
     * @returns 父模型，用于级联.
     */
    function childrenOnPath(parentModel: IModel, onPath: IPath, baseline?: number, reversed?: boolean, contain?: boolean, rotate?: boolean): IModel;
    /**
     * 沿链布局模型的子项.
     * 每个子项的x位置将被投影到链条上，以便保持子项之间的比例.
     * 子项的投影位置将成为近似链的点数组.
     * 每个子点都将旋转，以便根据这一系列点形成的顶点角进行斜接.
     *
     * @param parentModel 包含要布局的子项的模型.
     * @param onChain 要布局的链条.
     * @param baseline 链中垂直位移的数字百分比值。默认值为零.
     * @param reversed 旗帜沿链反向行进。默认值为 false.
     * @param contain 用于包含链长度内的子布局的标志。默认值为 false.
     * @param rotate 用于将子项旋转到斜接角度的标志。默认值为 true.
     * @returns 父模型，用于级联.
     */
    function childrenOnChain(parentModel: IModel, onChain: IChain, baseline?: number, reversed?: boolean, contain?: boolean, rotated?: boolean): IModel;
    /**
     * 径向格式的布局克隆.
     *
     * Example:
     * ```
     *
     *
     * var belt = new vjgeo.models.Belt(5, 50, 20);
     *
     * vjgeo.model.move(belt, [25, 0]);
     *
     * var petals = vjgeo.layout.cloneToRadial(belt, 8, 45);
     *
     * vjgeo.exporter.toDWG(petals);
     * ```
     *
     * @param itemToClone: 模型或路径对象.
     * @param count 径向结果中的克隆数.
     * @param angleInDegrees 克隆之间的旋转角度..
     * @returns 具有径向格式克隆的新模型.
     */
    function cloneToRadial(itemToClone: IModel | IPath, count: number, angleInDegrees: number, rotationOrigin?: IPoint): IModel;
    /**
     * 列格式的布局克隆.
     *
     * Example:
     * ```
     *
     * var dogbone = new vjgeo.models.Dogbone(50, 20, 2, -1, false);
     *
     * var grooves = vjgeo.layout.cloneToColumn(dogbone, 5, 20);
     *
     * vjgeo.exporter.toDWG(grooves);
     * ```
     *
     * @param itemToClone: 模型或路径对象.
     * @param count 列中的克隆数.
     * @param margin 每个克隆之间的可选距离.
     * @returns 列中包含克隆的新模型.
     */
    function cloneToColumn(itemToClone: IModel | IPath, count: number, margin?: number): IModel;
    /**
     * 行格式的布局克隆.
     *
     * Example:
     * ```
     * var tongueWidth = 60;
     * var grooveWidth = 50;
     * var grooveDepth = 30;
     * var groove = new vjgeo.models.Dogbone(grooveWidth, grooveDepth, 5, 0, true);
     *
     * groove.paths['leftTongue'] = new vjgeo.paths.Line([-tongueWidth / 2, 0], [0, 0]);
     * groove.paths['rightTongue'] = new vjgeo.paths.Line([grooveWidth, 0], [grooveWidth + tongueWidth / 2, 0]);
     *
     * var tongueAndGrooves = vjgeo.layout.cloneToRow(groove, 3);
     *
     * vjgeo.exporter.toDWG(tongueAndGrooves);
     * ```
     *
     * @param itemToClone: 模型或路径对象.
     * @param count 行中的克隆数.
     * @param margin 每个克隆之间的可选距离.
     * @returns 连续克隆的新模型.
     */
    function cloneToRow(itemToClone: IModel | IPath, count: number, margin?: number): IModel;
    /**
     * 网格格式的布局克隆.
     *
     * Example:
     * ```
     * var square = new vjgeo.models.Square(43);
     * var grid = vjgeo.layout.cloneToGrid(square, 5, 5, 7);
     * vjgeo.exporter.toDWG(grid);
     * ```
     *
     * @param itemToClone: 模型或路径对象.
     * @param xCount 网格中的列数.
     * @param yCount 网格中的行数.
     * @param margin 每个克隆之间的可选数字距离。也可以是二维数字数组，以 x 和 y 维度指定距离.
     * @returns 网格布局中具有克隆的新模型.
     */
    function cloneToGrid(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number | IPoint): IModel;
    /**
     * 砖块格式的布局克隆。交替行中每行将有一个新增项.
     *
     * Examples:
     * ```
     * var brick = new vjgeo.models.RoundRectangle(50, 30, 4);
     * var wall = vjgeo.layout.cloneToBrick(brick, 8, 6, 3);
     * vjgeo.exporter.toDWG(wall);
     * ```
     *
     * ```
     * //Fish scales
     * var arc = new vjgeo.paths.Arc([0, 0], 50, 20, 160);
     * var scales = vjgeo.layout.cloneToBrick(arc, 8, 20);
     * document.write(vjgeo.exporter.toDWG(scales));
     * ```
     *
     * @param itemToClone: 模型或路径对象.
     * @param xCount 砖网格中的列数.
     * @param yCount 砖网格中的行数.
     * @param margin 每个克隆之间的可选数字距离。也可以是二维数字数组，以 x 和 y 维度指定距离.
     * @returns 砖布局中带有克隆的新模型.
     */
    function cloneToBrick(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number | IPoint): IModel;
    /**
     * 蜂窝格式的布局克隆。交替行中每行将有一个新增项.
     *
     * Examples:
     * ```
     * //Honeycomb
     * var hex = new vjgeo.models.Polygon(6, 50, 30);
     * var pattern = vjgeo.layout.cloneToHoneycomb(hex, 8, 9, 10);
     * vjgeo.exporter.toDWG(pattern);
     * ```
     *
     * @param itemToClone: 模型或路径对象.
     * @param xCount 蜂窝网格中的列数.
     * @param yCount 蜂窝网格中的行数.
     * @param margin 每个克隆之间的可选距离.
     * @returns 蜂窝布局克隆的新模型.
     */
    function cloneToHoneycomb(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number): IModel;
}
declare namespace vjgeo.models {
    class BezierCurve implements IModel {
        models: IModelMap;
        paths: IPathMap;
        origin: IPoint;
        type: string;
        seed: IPathBezierSeed;
        accuracy: number;
        data: IProperties;
        constructor(points: IPoint[], accuracy?: number, data?: IProperties);
        constructor(seed: IPathBezierSeed, accuracy?: number, data?: IProperties);
        constructor(origin: IPoint, control: IPoint, end: IPoint, accuracy?: number, data?: IProperties);
        constructor(origin: IPoint, controls: IPoint[], end: IPoint, accuracy?: number, data?: IProperties);
        constructor(origin: IPoint, control1: IPoint, control2: IPoint, end: IPoint, accuracy?: number, data?: IProperties);
        static typeName: string;
        static getBezierSeeds(curve: BezierCurve, options?: IFindChainsOptions): IPath[] | {
            [layer: string]: IPath[];
        };
        static computeLength(seed: IPathBezierSeed): number;
        static computePoint(seed: IPathBezierSeed, t: number): IPoint;
    }
}
declare var Bezier: any;
declare namespace vjgeo.models {
    class Ellipse implements IModel {
        models: IModelMap;
        origin: IPoint;
        data: IProperties;
        /**
         * 用 2 个半径创建的椭圆类.
         *
         * @param radiusX The x radius of the ellipse.
         * @param radiusY The y radius of the ellipse.
         * @param accuracy 基础贝塞尔曲线的可选精度。
         * @param data 属性数据
         */
        constructor(radiusX: number, radiusY: number, accuracy?: number, data?: IProperties);
        /**
         * 通过原点和 2 个半径处创建的椭圆类.
         *
         * @param origin The center of the ellipse.
         * @param radiusX The x radius of the ellipse.
         * @param radiusY The y radius of the ellipse.
         * @param accuracy 贝塞尔曲线的可选精度.
         * @param data 属性数据
         */
        constructor(origin: IPoint, radiusX: number, radiusY: number, accuracy?: number, data?: IProperties);
        /**
         * 在特定 x、y 和 2 半径处创建的椭圆类.
         *
         * @param cx The x coordinate of the center of the ellipse.
         * @param cy The y coordinate of the center of the ellipse.
         * @param rX The x radius of the ellipse.
         * @param rY The y radius of the ellipse.
         * @param accuracy 贝塞尔曲线的可选精度.
         * @param data 属性数据
         */
        constructor(cx: number, cy: number, rx: number, ry: number, accuracy?: number, data?: IProperties);
    }
    class EllipticArc implements IModel {
        models: IModelMap;
        data: IProperties;
        /**
         * Class for Elliptic Arc created by distorting a circular arc.
         *
         * @param arc The circular arc to use as the basis of the elliptic arc.
         * @param radiusX The x radius of the ellipse.
         * @param radiusY The y radius of the ellipse.
         * @param accuracy Optional accuracy of the underlying BezierCurve.
         * @param data properities data
         */
        constructor(startAngle: number, endAngle: number, radiusX: number, radiusY: number, accuracy?: number, data?: IProperties);
        /**
         * Class for Elliptic Arc created by distorting a circular arc.
         *
         * @param arc The circular arc to use as the basis of the elliptic arc.
         * @param distortX The x scale of the ellipse.
         * @param distortY The y scale of the ellipse.
         * @param accuracy Optional accuracy of the underlying BezierCurve.
         * @param data properities data
         */
        constructor(arc: IPathArc, distortX: number, distortY: number, accuracy?: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Polyline implements IModel {
        paths: IPathMap;
        data: IProperties;
        /**
         * 通过连接字符串中指定的点来创建模型。模型将被“闭合”——即最后一个点将连接到第一个点.
         *
         * Example:
         * ```
         * var c = new vjgeo.models.Polyline('-10 0 10 0 0 20'); // 3 coordinates to form a triangle
         * ```
         *
         * @param numericList 包含数字列表的字符串，可以用空格、逗号或任何允许的非数字分隔）.
         * @param data 属性数据
         */
        constructor(numericList: string, data?: IProperties);
        /**
         * 通过连接字符串中指定的点来创建模型。模型可能处于闭合状态，也可能保持打开状态.
         *
         * Example:
         * ```
         * var c = new vjgeo.models.Polyline(false, '-10 0 10 0 0 20'); // 3 coordinates to form a polyline
         * ```
         *
         * @param isClosed Flag to specify if last point should connect to the first point.
         * @param numericList 包含数字列表的字符串，可以用空格、逗号或任何允许的非数字分隔）.
         * @param data 属性数据
         */
        constructor(isClosed: boolean, numericList: string, data?: IProperties);
        /**
         * 通过连接数字数组中指定的点来创建模型。模型将被“闭合”——即最后一个点将连接到第一个点.
         *
         * Example:
         * ```
         * var c = new vjgeo.models.Polyline([-10, 0, 10, 0, 0, 20]); // 3 coordinates to form a triangle
         * ```
         *
         * @param coords Array of coordinates.
         * @param data 属性数据
         */
        constructor(coords: number[], data?: IProperties);
        /**
         * 通过连接数字数组中指定的点来创建模型。模型可能处于闭合状态，也可能保持打开状态.
         *
         * Example:
         * ```
         * var c = new vjgeo.models.Polyline(false, [-10, 0, 10, 0, 0, 20]); // 3 coordinates to form a polyline
         * ```
         *
         * @param isClosed 用于指定最后一个点是否应连接到第一个点的标志.
         * @param coords Array of coordinates.
         * @param data 属性数据
         */
        constructor(isClosed: boolean, coords: number[], data?: IProperties);
        /**
         * 通过连接点数组中指定的点来创建模型。模型可能处于闭合状态，也可能保持打开状态.
         *
         * Example:
         * ```
         * var c = new vjgeo.models.Polyline(false, [[-10, 0], [10, 0], [0, 20]]); // 3 coordinates left open
         * ```
         *
         * @param isClosed 用于指定最后一个点是否应连接到第一个点的标志.
         * @param points Array of IPoints.
         * @param data 属性数据
         */
        constructor(isClosed: boolean, points: IPoint[], data?: IProperties);
        /**
         * 多线.
         *
         * Example:
         * ```
         * var c = new vjgeo.models.Polyline(false, [[[-10, 0], [10, 0], [0, 20]],[[-20, 0], [20, 0], [10, 20]]]); // 3 coordinates left open
         * ```
         *
         * @param lines Array of lines.
         * @param data properities data
         */
        constructor(lines: IPoint[][], data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Polygon implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(numberOfSides: number, radius: number, firstCornerAngleInDegrees?: number, circumscribed?: boolean, data?: IProperties);
        static circumscribedRadius(radius: number, angleInRadians: number): number;
        static getPoints(numberOfSides: number, radius: number, firstCornerAngleInDegrees?: number, circumscribed?: boolean): IPoint[];
    }
}
declare namespace vjgeo.models {
    class Holes implements IModel {
        paths: IPathMap;
        data: IProperties;
        /**
         * 从中心点数组创建半径相同的圆数组.
         *
         * Example:
         * ```
         * //Create some holes from an array of points
         *
         * var model = new vjgeo.models.Holes(10, [[0, 0],[50, 0],[25, 40]]);
         * vjgeo.exporter.toDWG(model);
         * ```
         *
         * @param holeRadius 孔半径.
         * @param points 每个孔的原点数组.
         * @param ids 孔的相应路径 ID 的可选数组.
         * @param data 属性数据
         */
        constructor(holeRadius: number, points: IPoint[], ids?: string[], data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class BoltCircle implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngleInDegrees?: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class BoltRectangle implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(width: number, height: number, holeRadius: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Dogbone implements IModel {
        paths: IPathMap;
        data: IProperties;
        /**
         * 从宽度、高度、角半径、样式创建dogbone圆角.
         *
         * Example:
         * ```
         * var d = new vjgeo.models.Dogbone(50, 100, 5);
         * ```
         *
         * @param width 矩形的宽度.
         * @param height 矩形的高度.
         * @param radius 拐角半径.
         * @param style 可选角样式：0（默认）表示Dogbone，1 表示垂直，-1 表示水平.
         * @param bottomless 用于省略底线和底角的可选标志（默认为 false）.
         * @param data 属性数据
         */
        constructor(width: number, height: number, radius: number, style?: number, bottomless?: boolean, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Dome implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(width: number, height: number, radius?: number, bottomless?: boolean, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class RoundRectangle implements IModel {
        origin: IPoint;
        paths: IPathMap;
        data: IProperties;
        /**
         * 根据宽度、高度和角半径创建圆形矩形.
         *
         * Example:
         * ```
         * var r = new vjgeo.models.RoundRectangle(100, 50, 5);
         * ```
         *
         * @param width Width of the rectangle.
         * @param height Height of the rectangle.
         * @param radius Corner radius.
         * @param data 属性数据
         */
        constructor(width: number, height: number, radius: number, data?: IProperties);
        /**
         * 创建一个围绕模型的圆形矩形.
         *
         * Example:
         * ```
         * var b = new vjgeo.models.BoltRectangle(30, 20, 1); //draw a bolt rectangle so we have something to surround
         * var r = new vjgeo.models.RoundRectangle(b, 2.5);   //surround it
         * ```
         *
         * @param modelToSurround IModel object.
         * @param margin 与模型的距离。这也将成为拐角半径.
         * @param data 属性数据
         */
        constructor(modelToSurround: IModel, margin: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Oval implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(width: number, height: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class OvalArc implements IModel {
        paths: IPathMap;
        models: IModelMap;
        data: IProperties;
        constructor(startAngle: number, endAngle: number, sweepRadius: number, slotRadius: number, selfIntersect?: boolean, isolateCaps?: boolean, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Rectangle implements IModel {
        paths: IPathMap;
        origin: IPoint;
        data: IProperties;
        /**
         * 从宽度和高度创建矩形.
         *
         * Example:
         * ```
         * //Create a rectangle from width and height
         *
         * var model = new vjgeo.models.Rectangle(50, 100);
         * vjgeo.exporter.toDWG(model);
         * ```
         *
         * @param width Width of the rectangle.
         * @param height Height of the rectangle.
         * @param data 属性数据
         */
        constructor(width: number, height: number, data?: IProperties);
        /**
         * 创建一个将围绕模型的矩形.
         *
         * Example:
         * ```
         * //Create a rectangle which will surround a model
         *
         * var e = new vjgeo.models.Ellipse(17, 10); // draw an ellipse so we have something to surround.
         * var r = new vjgeo.models.Rectangle(e, 3); // draws a rectangle surrounding the ellipse by 3 units.
         * vjgeo.exporter.toDWG({ models: { e: e, r: r }});
         * ```
         *
         * @param modelToSurround IModel object.
         * @param margin Optional 与模型的距离.
         * @param data 属性数据
         */
        constructor(modelToSurround: IModel, margin?: number, data?: IProperties);
        /**
         * 从测量创建矩形.
         *
         * Example:
         * ```
         * //Create a rectangle from a measurement.
         *
         * var e = new vjgeo.models.Ellipse(17, 10); // draw an ellipse so we have something to measure.
         * var m = vjgeo.measure.modelExtents(e);    // measure the ellipse.
         * var r = new vjgeo.models.Rectangle(m);    // draws a rectangle surrounding the ellipse.
         * vjgeo.exporter.toDWG({ models: { e: e, r: r }});
         * ```
         *
         * @param measurement IMeasure object.
         * @param data 属性数据
        */
        constructor(measurement: IMeasure, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Ring implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(outerRadius: number, innerRadius?: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Belt implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(leftRadius: number, distance: number, rightRadius: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class SCurve implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(width: number, height: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Slot implements IModel {
        paths: IPathMap;
        origin: IPoint;
        models: IModelMap;
        data: IProperties;
        constructor(origin: IPoint, endPoint: IPoint, radius: number, isolateCaps?: boolean, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Square implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(side: number, data?: IProperties);
    }
}
declare namespace vjgeo.models {
    class Star implements IModel {
        paths: IPathMap;
        data: IProperties;
        constructor(numberOfPoints: number, outerRadius: number, innerRadius?: number, skipPoints?: number, data?: IProperties);
        static InnerRadiusRatio(numberOfPoints: number, skipPoints: number): number;
    }
}
declare namespace vjgeo.models {
    class Text implements IModel {
        paths: IPathMap;
        data: IProperties;
        /**
         * 文本模型.
         * @param text String of text to render.
         * @param position position.
         * @param height text height
         * @param rotation text rotation.
         * @param isMText 是否是多行文本.
         * @param data 属性数据.
         * @returns Model of the text.
         */
        constructor(text: string, position: IPoint, height: number, rotation?: number, isMText?: boolean, data?: IProperties);
    }
    class DbEntity implements IModel {
        paths: IPathMap;
        data: IProperties;
        /**
         * 数据实体模型.
         * @param typename 实休数据库类型名称. 所有数据库实体类型请参考 https://vjmap.com/doc/Class_DbEntity.html
         * @param param 对应点和对应属性名映射.
         * @param data 属性数据.
         * @returns Model of the dbentity.
         */
        constructor(typename: string, param: {
            point: IPoint;
            attr: string;
        }[], data?: IProperties);
    }
}
