import { Control } from 'vjmap';
import { GeoBounds } from 'vjmap';
import { GeoPoint } from 'vjmap';
import type { IConditionQueryFeatures } from 'vjmap';
import { IControl } from 'vjmap';
import { IDrawTool } from 'vjmap';
import { IMapStyleParam } from 'vjmap';
import type { IOpenMapParam } from 'vjmap';
import { Map as Map_2 } from 'vjmap';
import type { MapOptions } from 'vjmap';
import { Marker } from 'vjmap';
import { Service } from 'vjmap';
import type { SourceSpecification } from 'vjmap';
import { default as vjmap_2 } from 'vjmap';

export declare const addExportRefInfoInText: (prj: any, data: any) => any;

export declare const addFeaturesToDraw: (data: any, drawLayer: any, combineInObject?: boolean) => any;

export declare const addHighLightSourceLayer: (map: Map_2, layerId?: string, highlightColor?: string) => void;

export declare const base2OverlayCoordinate: (pt: vjmap_2.GeoPoint, coordinates: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}[], isSetRotateZero?: boolean, basemapIsWeb?: boolean) => vjmap_2.GeoPoint;

export declare class CacheDbStorage {
    dbName: string;
    tableName: string;
    isInitDb: boolean;
    constructor();
    init(): Promise<void>;
    getInst(): TsIndexDb;
    getAll(): Promise<DbRecord[]>;
    getRecordByKey(key: string): Promise<DbRecord[]>;
    getValueByKey(key: string, parseJson?: boolean): Promise<any>;
    setValueByKey(key: string, value: any, toJson?: boolean): Promise<DbRecord>;
    upsert(record: DbRecord): Promise<DbRecord>;
    deleteRecord(key: string): Promise<DbRecord>;
    deleteTable(): Promise<unknown>;
    deleteDb(): Promise<unknown>;
    toStringKey(key: Record<string, any>, prefix?: string): string;
}

export declare const cacheStorage: CacheDbStorage;

export declare const cad2webCoordinate: (svc: vjmap_2.Service, pt: vjmap_2.GeoPoint, crs: string, fourParameterStr?: string, isWgs84?: boolean) => Promise<any>;

export declare const cancelDraw: (map: Map_2) => void;

export declare const clearHighlight: (map: Map_2, layerId?: string) => void;

export declare const clearHighLightSourceLayer: (map: Map_2, layerId?: string) => void;

export declare const convertArrayToGeoJson: (value: Array<[number, number]>) => any;

export declare const copyCadEntity: (map: Map_2, draw: IDrawTool, updateMapStyleObj: any, showInfoFunc?: Function, dlgConfirmInfo?: Function, isRectSel?: boolean, promptFunc?: Function) => Promise<void>;

export declare const createGeomData: (map: Map_2, entities?: any, docMapBounds?: any, environment?: any, linetypes?: any, dbFrom?: any, asFeatureCollection?: boolean, renderAccuracy?: number) => Promise<{
    type: string;
    features: {
        id: any;
        type: string;
        properties: any;
    }[];
}>;

export declare const createHatch: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function, param?: Record<string, any>) => Promise<void>;

export declare const createLineTypeCurve: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function, param?: Record<string, any>) => Promise<void>;

export declare const createLineTypePolyline: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function, param?: Record<string, any>) => Promise<void>;

export declare const createMapStyleLayerName: (svc: Service, overMapType: WmsOverlayMapType, overMapParam: WmsMapParam | WmsMapParam[], backcolor?: number) => Promise<WmsMapParam | WmsMapParam[] | undefined>;

export declare const createOutSymbol: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function, param?: Record<string, any>) => Promise<any>;

export declare const createUpdateMapStyleObj: (map: Map_2, option?: Record<string, any>) => {
    addHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
    hideObjectIds: Set<string>;
    getClipBounds: () => any;
};

export declare const createUpdateMapStyleRasterObj: (map: Map_2, option?: Record<string, any>) => {
    addHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
    hideObjectIds: Set<string>;
    getClipBounds: () => any;
};

export declare const createUpdateMapStyleVectorObj: (map: Map_2, option?: Record<string, any>) => {
    addHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
    hideObjectIds: Set<string>;
    getClipBounds: () => any;
};

export declare type DbIndex = {
    key: string;
    option?: IDBIndexParameters;
};

export declare interface DbOperate<T> {
    tableName: string;
    key: string;
    data: T | T[];
    value: string | number;
    condition(data: T): boolean;
    success(res: T[] | T): void;
    handle(res: T): void;
}

export declare type DbRecord = {
    id?: string;
    key: string;
    value: string;
};

export declare type DbTable = {
    tableName: string;
    option?: IDBObjectStoreParameters;
    indexs: DbIndex[];
};

export declare const deleteCadEntity: (map: Map_2, draw: IDrawTool, updateMapStyleObj: any, showInfoFunc?: Function, dlgConfirmInfo?: Function, isRectSel?: boolean, promptFunc?: Function) => Promise<void>;

export declare const drawArrow: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function, param?: Record<string, any>) => Promise<void>;

export declare const drawCircle: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, isFill?: boolean) => Promise<void>;

export declare const drawEllipseArc: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function) => void;

export declare const drawEllipseEdge: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function) => void;

export declare const drawEllipseFill: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function) => void;

export declare const drawEllipseFillArc: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function) => void;

export declare const drawFillExrusion: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>) => Promise<void>;

export declare const drawLineSting: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>) => Promise<void>;

export declare const drawPoint: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>) => Promise<void>;

export declare const drawPolygon: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>) => Promise<void>;

export declare const drawRectangle: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, isFill?: boolean) => Promise<void>;

export declare const drawSlantRectangle: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, isFill?: boolean) => Promise<void>;

export declare const drawText: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, drawProperty?: Record<string, any>, showInfoFunc?: Function, disableInteractive?: boolean, docBounds?: [number, number, number, number]) => Promise<any>;

export declare const editCadEntity: (map: Map_2, draw: IDrawTool, updateMapStyleObj: any, editOp: "delete" | "modify" | "copy", showInfoFunc?: Function, dlgConfirmInfo?: Function, isRectSel?: boolean, promptFunc?: Function) => Promise<void>;

export declare function evalDataConvert(featureCollection: any, code: string, map: Map_2, mapApp: any): Promise<any>;

export declare function execProgram(code: string, map: Map_2, mapApp: any, context?: any): Promise<any>;

export declare const exportDwg: (map: Map_2, draw: IDrawTool, newMapId?: string) => Promise<any>;

export declare const gaodeProviderTiles: (isImageUrl?: boolean) => string[];

export declare const getEntityObjectId: (id: string) => string;

export declare const getEpsgRange: (type: "BEIJING54_3" | "BEIJING54_6" | "XIAN80_3" | "XIAN80_6" | "CGCS2000_3" | "CGCS2000_6") => any;

export declare const getGeoJsonBounds: (data: any) => vjmap_2.GeoBounds;

export declare const getHighlightEntities: (map: Map_2, bounds: [number, number, number, number] | undefined, useGeomCoord?: boolean, queryParam?: IConditionQueryFeatures, includeWholeEntity?: boolean, disableSelectEntities?: Set<String>, isClearOld?: boolean, layerId?: string, highlightColor?: string) => Promise<{
    features: never[];
    type: string;
}>;

/**
 * @method 获取单例的单个对象
 */
export declare const getInstance: (dbName: string) => TsIndexDb;

export declare const getMapSnapPoints: (map: Map_2, snapObj: any, snapQueryLimit?: number) => Promise<void>;

export declare const getPointOnePixelDrawStyleOption: () => any;

export declare const getQueryGeomData: (map: Map_2, queryParam: any, propData?: Record<string, any>) => Promise<{
    type: string;
    features: {
        id: string;
        type: string;
        properties: {
            objectid: string;
            color: string;
            alpha: number;
            opacity: number;
            lineWidth: number;
            name: any;
            isline: any;
            layerindex: any;
        };
        geometry: any;
    }[];
}>;

export declare const getShardsTileUrl: (tileUrl: string, map?: Map_2) => string[];

export declare const getTextRefCo: (feature: any) => {
    refCo1: any;
    refCo2: any;
};

export declare const getTileShards: (tileUrl: string) => {
    tileUrl: string;
    tileShards: string;
};

export declare const getTrackFeatureProperty: (draw: IDrawTool, key?: string) => any;

export declare const getWmsAutoCadBaseMapTileUrl: (svc: Service, baseMapParam: WmsBaseMapParam, overMapParam: WmsMapParam | WmsMapParam[], layerProps?: Record<string, any>) => Promise<string | undefined>;

export declare const getWmsAutoWebBaseMapTileUrl: (svc: Service, overMapType: WmsOverlayMapType, baseMapParam: WmsBaseMapParam, overMapParam: WmsMapParam | WmsMapParam[], layerProps?: Record<string, any>) => Promise<string>;

export declare const getWmsDirectTileUrl: (svc: Service, overMapType: WmsOverlayMapType, baseMapParam: WmsBaseMapParam, overMapParam: WmsMapParam | WmsMapParam[], layerProps?: Record<string, any>) => Promise<string>;

export declare const getWmsMapsBounds: (svc: Service, overMapType: WmsOverlayMapType, baseMapType: "" | "CAD" | "WGS84" | "GCJ02", overMapParam: WmsMapParam | WmsMapParam[]) => Promise<GeoBounds | undefined>;

export declare const getWmsParamTileUrl: (svc: Service, overMapType: WmsOverlayMapType, baseMapParam: WmsBaseMapParam, overMapParam: WmsMapParam | WmsMapParam[], layerProps?: Record<string, any>) => Promise<string>;

export declare const getWmsTileUrl: (svc: Service, baseMapParam: WmsBaseMapParam, overMapType: WmsOverlayMapType, overMapParam: OverMapParam) => Promise<string[] | undefined>;

export declare type IIndexDb = {
    dbName: string;
    version: number;
    tables: DbTable[];
};

/**
 * @method 初始化函数
 * @param param0
 * @param isMany
 */
export declare const initIndexDb: ({ dbName, version, tables }: IIndexDb) => Promise<TsIndexDb>;

export declare const interactiveCreateGeom: (data: any, map: Map_2, options?: Record<string, any>, showInfoFunc?: Function, param?: {
    disableScale?: boolean;
    disableRotate?: boolean;
    drawInitPixelLength?: number;
    tempLineColor?: string;
    baseAlign?: "leftBottom" | "center" | "leftTop";
    keepGeoSize?: boolean;
    position?: GeoPoint;
    scaleValue?: number;
    angleValue?: number;
    unCombineFeature?: boolean;
}) => Promise<{
    feature: any;
    rotation: number;
} | undefined>;

export declare const isAlphanumeric: (char: string) => boolean;

export declare const isTrackFeature: (feature: any) => boolean;

export declare const isWebBaseMap: (baseMapType?: string) => boolean;

export declare class LayerBase {
    map: Map_2;
    mapLayer: MapLayer;
    visibleOff?: boolean;
    constructor();
    addLayer(map: Map_2, mapLayer: MapLayer): Promise<void>;
    setLayerStyle(map: Map_2, layerId: string, layerProps: Record<string, any>, oldLayer: MapLayer): void;
    setVisible(map: Map_2, layerId: string, visibleOff?: boolean): void;
    removeLayer(map: Map_2, layerId: string): void;
    getLayerId(): string | string[] | undefined;
    onSourceDataChange(map: Map_2, sourceId?: string, forceUpdate?: boolean, timerUpdate?: boolean): void;
    loadUrlImage(src: string): Promise<HTMLImageElement>;
    evalValue(options: Record<string, any> | string, properties: Record<string, any>, map: Map_2): any;
    createAnimateImages(map: Map_2, mapLayer: MapLayer): Promise<string[] | ImageData[]>;
    setMarkerOptions(marker: Marker, options: Record<string, any>): void;
}

export declare const listenKeyEvent: () => {
    removeEventListener: () => void;
    isAltKey: () => boolean | undefined;
    isCtrlKey: () => boolean | undefined;
    isShiftKey: () => boolean | undefined;
    curKey: () => KeyboardEvent | undefined;
};

export declare const loadDataToDraw: (map: Map_2, draw: IDrawTool, data: string, updateMapStyleObj: any) => Promise<void>;

export declare const loadWebMap: (map: Map_2, config: MapAppConfig) => void;

export declare class MapApp {
    config: MapAppConfig;
    svc: Service;
    map: Map_2;
    sources: MapSource[];
    layers: MapLayer[];
    controls: (Control | IControl | null)[];
    layersInst: Record<string, LayerBase>;
    projectKey: string | undefined;
    containerId: string;
    private timeMgr;
    isEditorMode?: boolean;
    isDisableRunProgram?: boolean;
    context?: any;
    private programCleaner?;
    private oldCacheImages?;
    keyEvent?: ReturnType<typeof listenKeyEvent>;
    constructor(config?: MapAppConfig);
    mount(containerId: string, env?: {
        serviceUrl: string;
        serviceToken: string;
    }): void;
    attachMap(map: Map_2): void;
    isWebBaseMap(config?: MapAppConfig): boolean;
    setConfig(config?: MapAppConfig, noSetMapOptions?: boolean): Promise<{
        error: any;
    } | undefined>;
    setMapOpenOptions(option: Partial<MapOpenOptions>): Promise<void>;
    setMapOptions(option: MapOption): void;
    /**
     * 增加地图图像资源
     */
    addMapImages(): Promise<void>;
    /**
     * 清空地图上的所有数据
     */
    clearData(): Promise<void>;
    /**
     * 移除所有逻辑程序段
     */
    removePrograms(): void;
    /**
     * 移除所有逻辑程序段
     */
    execProgram(): Promise<void>;
    /**
     * 销毁
     */
    destory(): Promise<void>;
    /**
     * 切换地图
     * @param param 打开选项
     */
    switchMap(param: MapOpenOptions): Promise<any>;
    /**
     * 增加数据源
     */
    addSource(source: MapSource, isUpdateConfig?: boolean): Promise<boolean>;
    /**
     * 获取数据源数据
     */
    getSourceData(sourceId: string): Promise<any>;
    /**
     * 设置数据源数据
     */
    setSourceData(sourceId: string, data?: any, isUpdateConfig?: boolean): Promise<void>;
    /**
     * 更新除geojson之外的数据源
     */
    updateSource(source: MapSource, isRemove?: boolean): Promise<void>;
    /**
     * 删除数据源
     */
    removeSource(sourceId: string, isUpdateConfig?: boolean): void;
    /**
     * 增加图层
     */
    addLayer(layer: MapLayer, isUpdateConfig?: boolean): Promise<void>;
    /**
     * 设置图层属性
     */
    setLayerStyle(layerId: string, layerProps: Record<string, any>, isUpdateConfig?: boolean): Promise<void>;
    /**
     * 设置图层开关
     */
    setLayerVisible(layerId: string, visibleOff?: boolean, isUpdateConfig?: boolean): Promise<void>;
    /**
     * 设置数据源开关
     */
    setSourceVisible(sourceId: string, visibleOff?: boolean, isUpdateConfig?: boolean): Promise<void>;
    /**
     * 删除图层
     */
    removeLayer(layerId: string, isUpdateConfig?: boolean): void;
    /**
     * 增加定时器
     */
    addTimer(mapSource: MapSource): void;
    /**
     * 清空定时器
     */
    clearTimer(sourceId: string): void;
    /**
     * 移除所有控件
     */
    removeControls(): void;
    /**
     * 增加控件
     */
    addControls(): void;
    /**
     * 获取配置
     */
    getConfig(): MapAppConfig;
    private findDepsSourceId;
    /**
     * 通知数据源数据改变
     */
    notifySourceDataChange(sourceId?: string, forceUpdate?: boolean, timerUpdate?: boolean): Promise<void>;
    getSysImages(): string[];
    static guid(digit?: number): string;
}

declare interface MapAppConfig {
    title?: string;
    description?: string;
    serviceUrl?: string;
    serviceToken?: string;
    accessKey?: string;
    workspace?: string;
    thumbnail?: string;
    mapInitBounds?: string;
    backgroundColor?: string;
    baseMapType?: "" | "CAD" | "WGS84" | "GCJ02";
    webMapTiles?: string[];
    mapOpenOptions?: MapOpenOptions;
    mapOptions?: MapOption;
    mapSources?: MapSource[];
    mapLayers?: MapLayer[];
    controls?: {
        name: string;
        position: string;
        options?: string;
    }[];
    mapImages?: {
        key: string;
        value: string;
        options?: string;
    }[];
    program?: Record<string, string>;
}

declare interface MapLayer {
    layerId: string;
    sourceId: string;
    memo?: string;
    tag?: string;
    type: string;
    before?: string;
    visibleOff?: boolean;
    [key: string]: any;
}

declare interface MapOpenOptions extends IOpenMapParam {
    isKeepOldLayers?: boolean;
    isVectorStyle?: boolean;
    isSetCenter?: boolean;
    isFitBounds?: boolean;
}

declare type MapOption = Omit<MapOptions, "container">;

declare interface MapSource {
    id: string;
    source: SourceSpecification;
    tag?: string;
    props?: Record<string, any>;
    visibleOff?: boolean;
    memo?: string;
    [key: string]: any;
}

export declare const modifyCadEntity: (map: Map_2, draw: IDrawTool, updateMapStyleObj: any, showInfoFunc?: Function, dlgConfirmInfo?: Function, isRectSel?: boolean, promptFunc?: Function) => Promise<void>;

export declare const modifyDrawText: (map: Map_2, draw: IDrawTool, promptFunc?: Function, message?: Function) => Promise<void>;

export declare const osmProviderTiles: () => string[];

export declare const overlay2BaseCoordinate: (pt: vjmap_2.GeoPoint, coordinates: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}[], isSetRotateZero?: boolean, basemapIsWeb?: boolean) => vjmap_2.GeoPoint;

export declare interface OverMapParam {
    maps: WmsMapParam | WmsMapParam[];
    layerProps: Record<string, any>;
}

export declare const polygonToPolyline: (feature: any) => any;

export declare function ProcessDataToFeatureCollection(map: Map_2, res: any, isUseGeomCoord: boolean): any;

export declare const providerLayers: Record<string, typeof LayerBase>;

export declare type providerLayerTypes = keyof typeof providerLayers;

export declare function queryMapData(map: Map_2, queryParam: {
    condition?: string;
    bounds?: string;
    isContains?: boolean;
    coordType?: 0 | 1;
    clearPropData?: boolean;
    disableCacheData?: boolean;
}, condition?: Record<string, any>): Promise<any>;

export declare function requestChangeData(map: Map_2, param: {
    reqType: 'GET' | 'POST' | "SOURCE";
    url: string;
    data?: any;
    header?: Record<string, string>;
    processJS?: string;
    fromSourceId?: string;
}, mapApp?: any): Promise<any>;

export declare function runMeasureCmd(map: Map_2, cmd: string): Promise<void>;

export declare const selectFeatures: (map: Map_2, useGeomCoord?: boolean, includeWholeEntity?: boolean, isPointSel?: boolean, disableSnap?: boolean, disableSelectEntities?: Set<String>) => Promise<any>;

export declare const selectRotate: (map: Map_2, draw: IDrawTool, options?: Record<string, any>, showInfoFunc?: Function) => Promise<void>;

export declare const setFeatureProperty: (feature: any, drawProperty?: Record<string, any>) => void;

export declare const setLayerOpacity: (map: Map_2, opacity: number, rasterLayerIdMatch?: string) => void;

export declare const setLayerToLowest: (map: Map_2, layerId: string) => void;

export declare const setTrackFeatureProperty: (draw: IDrawTool, props: Record<string, any>) => void;

export declare function sleep(ms?: number): Promise<unknown>;

export declare const switchCadLayers: (map: Map_2, layers: {
    name: string;
    isOff: boolean;
}[], isVectorStyle: boolean) => Promise<void>;

export declare const switchVectorLayers: (map: Map_2, onLayers: string[]) => void;

export declare const tiandituProviderTiles: (isImageUrl?: boolean) => string[];

export declare const toBezierCurve: (map: Map_2, draw: IDrawTool) => void;

export declare function toMapLayer(layer: MapLayer, props: Record<string, any>): MapLayer;

export declare const toProperties: (param: Record<string, any>) => Record<string, any>;

export declare const transformFourParam: (map: Map_2, data: any, fourParam: any, isGeoCoord?: boolean) => any;

export declare const transformGeoJsonData: (map: Map_2, data: any, basePt: any, destPt: any, scale?: number, angle?: number, isGeoCoord?: boolean) => any;

export declare class TsIndexDb {
    private dbName;
    private version;
    private tableList;
    private db;
    private queue;
    constructor({ dbName, version, tables }: IIndexDb);
    private static _instance;
    static getInstance(dbOptions: IIndexDb): TsIndexDb;
    /**
     * @method 查询某张表的所有数据(返回具体数组)
     * @param {Object}
     *   @property {String} tableName 表名
     */
    queryAll<T>({ tableName }: Pick<DbOperate<T>, 'tableName'>): Promise<T[]>;
    /**
     * @method 查询(返回具体数组)
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Function} condition 查询的条件
     * */
    query<T>({ tableName, condition }: Pick<DbOperate<T>, 'condition' | 'tableName'>): Promise<T[]>;
    /**
     * @method 查询数据(更具表具体属性)返回具体某一个
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Number|String} key 名
     *   @property {Number|String} value 值
     *
     * */
    query_by_keyValue<T>({ tableName, key, value }: Pick<DbOperate<T>, 'tableName' | 'key' | 'value'>): Promise<T>;
    /**
     * @method 查询数据（主键值）
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Number|String} value 主键值
     *
     * */
    query_by_primaryKey<T>({ tableName, value }: Pick<DbOperate<T>, 'tableName' | 'value'>): Promise<T>;
    /**
     * @method 修改数据(返回修改的数组)
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Function} condition 查询的条件，遍历，与filter类似
     *      @arg {Object} 每个元素
     *      @return 条件
     *   @property {Function} handle 处理函数，接收本条数据的引用，对其修改
     * */
    update<T>({ tableName, condition, handle }: Pick<DbOperate<T>, 'tableName' | 'condition' | 'handle'>): Promise<T>;
    /**
     * @method 修改某条数据(主键)返回修改的对象
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String\|Number} value 目标主键值
     *   @property {Function} handle 处理函数，接收本条数据的引用，对其修改
     * */
    update_by_primaryKey<T>({ tableName, value, handle }: Pick<DbOperate<T>, 'tableName' | 'value' | 'handle'>): Promise<T>;
    /**
     * @method 增加数据
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Object} data 插入的数据
     * */
    insert<T>({ tableName, data }: Pick<DbOperate<T>, 'tableName' | 'data'>): Promise<T>;
    /**
     * @method 删除数据(返回删除数组)
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Function} condition 查询的条件，遍历，与filter类似
     *      @arg {Object} 每个元素
     *      @return 条件
     * */
    delete<T>({ tableName, condition }: Pick<DbOperate<T>, 'tableName' | 'condition'>): Promise<T>;
    /**
     * @method 删除数据(主键)
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String\|Number} value 目标主键值
     * */
    delete_by_primaryKey<T>({ tableName, value }: Pick<DbOperate<T>, 'tableName' | 'value'>): Promise<T>;
    /**
     * @method 打开数据库
     */
    open_db(): Promise<TsIndexDb>;
    /**
     *@method 关闭数据库
     * @param  {[type]} db [数据库名称]
     */
    close_db(): Promise<unknown>;
    /**
     * @method 删除数据库
     * @param {String}name 数据库名称
     */
    delete_db(name: string): Promise<unknown>;
    /**
     * @method 删除表数据
     * @param {String}name 数据库名称
     */
    delete_table(tableName: string): Promise<unknown>;
    /**
     * 创建table
     * @option<Object>  keyPath指定主键 autoIncrement是否自增
     * @index 索引配置
     * */
    private create_table;
    /**
     * 提交Db请求
     * @param tableName  表名
     * @param commit 提交具体函数
     * @param mode 事物方式
     * @param backF 游标方法
     */
    private commitDb;
    /**
     * @method 游标开启成功,遍历游标
     * @param {Function} 条件
     * @param {Function} 满足条件的处理方式 @arg {Object} @property cursor游标 @property currentValue当前值
     * @param {Function} 游标遍历完执行的方法
     * @return {Null}
     * */
    cursor_success(e: any, { condition, handler, success }: any): void;
}

declare namespace vjcommon {
    export {
        MapApp,
        providerLayerTypes,
        providerLayers,
        LayerBase,
        exportDwg,
        setFeatureProperty,
        cancelDraw,
        drawPoint,
        drawLineSting,
        drawPolygon,
        drawFillExrusion,
        polygonToPolyline,
        drawCircle,
        drawRectangle,
        drawSlantRectangle,
        selectRotate,
        toBezierCurve,
        drawEllipseFill,
        drawEllipseEdge,
        drawEllipseFillArc,
        drawEllipseArc,
        getGeoJsonBounds,
        interactiveCreateGeom,
        drawArrow,
        createLineTypePolyline,
        createLineTypeCurve,
        createHatch,
        getQueryGeomData,
        createOutSymbol,
        drawText,
        addFeaturesToDraw,
        getPointOnePixelDrawStyleOption,
        getTextRefCo,
        modifyDrawText,
        isTrackFeature,
        setTrackFeatureProperty,
        getTrackFeatureProperty,
        addExportRefInfoInText,
        editCadEntity,
        deleteCadEntity,
        modifyCadEntity,
        copyCadEntity,
        createGeomData,
        loadDataToDraw,
        DbRecord,
        CacheDbStorage,
        cacheStorage,
        IIndexDb,
        DbIndex,
        DbTable,
        DbOperate,
        TsIndexDb,
        initIndexDb,
        getInstance,
        switchCadLayers,
        switchVectorLayers,
        setLayerOpacity,
        setLayerToLowest,
        queryMapData,
        ProcessDataToFeatureCollection,
        requestChangeData,
        evalDataConvert,
        toProperties,
        convertArrayToGeoJson,
        runMeasureCmd,
        addHighLightSourceLayer,
        clearHighLightSourceLayer,
        getHighlightEntities,
        clearHighlight,
        selectFeatures,
        getMapSnapPoints,
        createUpdateMapStyleObj,
        createUpdateMapStyleRasterObj,
        createUpdateMapStyleVectorObj,
        listenKeyEvent,
        WmsOverlayMapType,
        WmsBaseMapParam,
        WmsMapParam,
        OverMapParam,
        createMapStyleLayerName,
        getWmsMapsBounds,
        getWmsDirectTileUrl,
        getWmsAutoWebBaseMapTileUrl,
        getWmsAutoCadBaseMapTileUrl,
        getWmsParamTileUrl,
        getWmsTileUrl,
        cad2webCoordinate,
        web2cadCoordinate,
        overlay2BaseCoordinate,
        base2OverlayCoordinate,
        getEpsgRange,
        osmProviderTiles,
        tiandituProviderTiles,
        gaodeProviderTiles,
        loadWebMap,
        toMapLayer,
        sleep,
        execProgram,
        getShardsTileUrl,
        getTileShards,
        isAlphanumeric,
        isWebBaseMap,
        getEntityObjectId,
        transformGeoJsonData,
        transformFourParam
    }
}
export default vjcommon;

export declare const web2cadCoordinate: (svc: vjmap_2.Service, pt: vjmap_2.GeoPoint, crs: string, fourParameterStr?: string, isWgs84?: boolean) => Promise<number[]>;

export declare interface WmsBaseMapParam {
    baseMapType?: "" | "CAD" | "WGS84" | "GCJ02";
    /** 地图ID. */
    mapid?: string;
    /** 地图版本. */
    version?: string;
    /** 地理真实范围 */
    mapbounds?: string;
}

export declare interface WmsMapParam {
    /** 地图ID(为空时采用当前打开的mapid) */
    mapid: string;
    /** 地图版本(为空时采用当前打开的地图版本). */
    version?: string;
    /** 图层样式名称. (如果图层样式名称为空时，则根据下面的样式去获取图层样式名称) */
    layer?: string;
    /** 图层样式. */
    style?: IMapStyleParam;
    /** cad图的坐标系 */
    crs?: string;
    /** 四参数(x偏移,y偏移,缩放，旋转弧度)*/
    fourParameterX?: number;
    fourParameterY?: number;
    fourParameterScale?: number;
    fourParameterRotate?: number;
    baseMapType?: "" | "CAD" | "WGS84" | "GCJ02";
    webMapTiles?: string[];
    isSetRotateZero?: boolean;
    coordinates?: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }[];
}

export declare enum WmsOverlayMapType {
    /** 不叠加. */
    None = "none",
    /** 直接叠加. */
    Direct = "direct",
    /** 自动叠加 */
    Auto = "auto",
    /** 四参数叠加 */
    Param = "param"
}

export { }
