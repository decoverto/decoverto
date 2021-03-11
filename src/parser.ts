import {Deserializer} from './deserializer';
import {parseToJSObject} from './helpers';
import {createArrayType} from './json-array-member';
import {
    JsonObjectMetadata,
} from './metadata';
import {Serializer} from './serializer';
import {ensureTypeDescriptor, MapT, SetT} from './type-descriptor';
import {IndexedObject, Serializable} from './types';

export type ToPlainResult<T> =
    T extends Object
        ? {[k in keyof T]?: T[k]} | {[k: string]: any}
        : any;

export interface MappedTypeConverters<T> {

    /**
     * Use this deserializer to convert a JSON value to the type.
     */
    deserializer?: ((json: any) => T | null | undefined) | null;

    /**
     * Use this serializer to convert a type back to JSON.
     */
    serializer?: ((value: T | null | undefined) => any) | null;
}

export interface ITypedJSONSettings {
    /**
     * Maps a type to their respective (de)serializer. Prevents you from having to repeat
     * (de)serializers. Register additional types with `TypedJSON.mapType`.
     */
    mappedTypes?: Map<Serializable<any>, MappedTypeConverters<any>> | null;

    /**
     * Sets the amount of indentation to use in produced JSON strings.
     * Default value is 0, or no indentation.
     */
    indent?: number | null;

    replacer?: ((key: string, value: any) => any) | null;
}

export class TypedJSON<RootType> {

    private static _globalConfig: ITypedJSONSettings = {};

    private serializer: Serializer = new Serializer();
    private deserializer: Deserializer<RootType> = new Deserializer<RootType>();
    private indent: number = 0;
    private rootConstructor: Serializable<RootType>;
    private replacer?: (key: string, value: any) => any;

    /**
     * Creates a new TypedJSON instance to serialize (stringify) and deserialize (parse) object
     *     instances of the specified root class type.
     * @param rootConstructor The constructor of the root class type.
     * @param settings Additional configuration settings.
     */
    constructor(rootConstructor: Serializable<RootType>, settings?: ITypedJSONSettings) {
        const rootMetadata = JsonObjectMetadata.getFromConstructor(rootConstructor);

        if (rootMetadata === undefined
            || (!rootMetadata.isExplicitlyMarked && !rootMetadata.isHandledWithoutAnnotation)) {
            throw new TypeError(
                'The TypedJSON root data type must have the @jsonObject decorator used.',
            );
        }

        this.rootConstructor = rootConstructor;

        this.config(settings);
    }

    static parse<T>(
        object: any,
        rootType: Serializable<T>,
        settings?: ITypedJSONSettings,
    ): T {
        return new TypedJSON(rootType, settings).parse(object);
    }

    static parseAsArray<T>(
        object: any,
        elementType: Serializable<T>,
        settings?: ITypedJSONSettings,
        dimensions?: 1,
    ): Array<T>;
    static parseAsArray<T>(
        object: any,
        elementType: Serializable<T>,
        settings: ITypedJSONSettings | undefined,
        dimensions: 2,
    ): Array<Array<T>>;
    static parseAsArray<T>(
        object: any,
        elementType: Serializable<T>,
        settings: ITypedJSONSettings | undefined,
        dimensions: 3,
    ): Array<Array<Array<T>>>;
    static parseAsArray<T>(
        object: any,
        elementType: Serializable<T>,
        settings: ITypedJSONSettings | undefined,
        dimensions: 4,
    ): Array<Array<Array<Array<T>>>>;
    static parseAsArray<T>(
        object: any,
        elementType: Serializable<T>,
        settings: ITypedJSONSettings | undefined,
        dimensions: 5,
    ): Array<Array<Array<Array<Array<T>>>>>;
    static parseAsArray<T>(
        object: any,
        elementType: Serializable<T>,
        settings?: ITypedJSONSettings,
        dimensions?: number,
    ): Array<any> {
        return new TypedJSON(elementType, settings).parseAsArray(object, dimensions as any);
    }

    static parseAsSet<T>(
        object: any,
        elementType: Serializable<T>,
        settings?: ITypedJSONSettings,
    ): Set<T> {
        return new TypedJSON(elementType, settings).parseAsSet(object);
    }

    static parseAsMap<K, V>(
        object: any,
        keyType: Serializable<K>,
        valueType: Serializable<V>,
        settings?: ITypedJSONSettings,
    ): Map<K, V> {
        return new TypedJSON(valueType, settings).parseAsMap(object, keyType);
    }

    static toPlainJson<T>(
        object: T,
        rootType: Serializable<T>,
        settings?: ITypedJSONSettings,
    ): ToPlainResult<T> {
        return new TypedJSON(rootType, settings).toPlainJson(object);
    }

    static toPlainArray<T>(
        object: Array<T>,
        elementType: Serializable<T>,
        dimensions?: 1,
        settings?: ITypedJSONSettings,
    ): Array<ToPlainResult<T>>;
    static toPlainArray<T>(
        object: Array<Array<T>>,
        elementType: Serializable<T>,
        dimensions: 2,
        settings?: ITypedJSONSettings,
    ): Array<Array<ToPlainResult<T>>>;
    static toPlainArray<T>(
        object: Array<Array<Array<T>>>,
        elementType: Serializable<T>,
        dimensions: 3,
        settings?: ITypedJSONSettings,
    ): Array<Array<Array<ToPlainResult<T>>>>;
    static toPlainArray<T>(
        object: Array<Array<Array<Array<T>>>>,
        elementType: Serializable<T>,
        dimensions: 4, settings?: ITypedJSONSettings,
    ): Array<Array<Array<Array<ToPlainResult<T>>>>>;
    static toPlainArray<T>(
        object: Array<Array<Array<Array<Array<T>>>>>,
        elementType: Serializable<T>,
        dimensions: 5,
        settings?: ITypedJSONSettings,
    ): Array<Array<Array<Array<Array<ToPlainResult<T>>>>>>;
    static toPlainArray<T>(
        object: Array<any>,
        elementType: Serializable<T>,
        dimensions: number,
        settings?: ITypedJSONSettings,
    ): Array<ToPlainResult<T>>;
    static toPlainArray<T>(
        object: Array<any>,
        elementType: Serializable<T>,
        dimensions?: any,
        settings?: ITypedJSONSettings,
    ): Array<ToPlainResult<T>> {
        return new TypedJSON(elementType, settings).toPlainArray(object, dimensions);
    }

    static toPlainSet<T>(
        object: Set<T>,
        elementType: Serializable<T>,
        settings?: ITypedJSONSettings,
    ): Array<ToPlainResult<T>> | undefined {
        return new TypedJSON(elementType, settings).toPlainSet(object);
    }

    static toPlainMap<K, V>(
        object: Map<K, V>,
        keyCtor: Serializable<K>,
        valueCtor: Serializable<V>,
        settings?: ITypedJSONSettings,
    ): IndexedObject | Array<{key: any; value: ToPlainResult<V>}> | undefined {
        return new TypedJSON(valueCtor, settings).toPlainMap(object, keyCtor);
    }

    static stringify<T>(
        object: T,
        rootType: Serializable<T>,
        settings?: ITypedJSONSettings,
    ): string {
        return new TypedJSON(rootType, settings).stringify(object);
    }

    static stringifyAsArray<T>(
        object: Array<T>,
        elementType: Serializable<T>,
        dimensions?: 1,
        settings?: ITypedJSONSettings,
    ): string;
    static stringifyAsArray<T>(
        object: Array<Array<T>>,
        elementType: Serializable<T>,
        dimensions: 2,
        settings?: ITypedJSONSettings,
    ): string;
    static stringifyAsArray<T>(
        object: Array<Array<Array<T>>>,
        elementType: Serializable<T>,
        dimensions: 3,
        settings?: ITypedJSONSettings,
    ): string;
    static stringifyAsArray<T>(
        object: Array<Array<Array<Array<T>>>>,
        elementType: Serializable<T>,
        dimensions: 4,
        settings?: ITypedJSONSettings,
    ): string;
    static stringifyAsArray<T>(
        object: Array<Array<Array<Array<Array<T>>>>>,
        elementType: Serializable<T>,
        dimensions: 5,
        settings?: ITypedJSONSettings,
    ): string;
    static stringifyAsArray<T>(
        object: Array<any>,
        elementType: Serializable<T>,
        dimensions: number, settings?: ITypedJSONSettings,
    ): string;
    static stringifyAsArray<T>(
        object: Array<any>,
        elementType: Serializable<T>,
        dimensions?: any,
        settings?: ITypedJSONSettings,
    ): string {
        return new TypedJSON(elementType, settings).stringifyAsArray(object, dimensions);
    }

    static stringifyAsSet<T>(
        object: Set<T>,
        elementType: Serializable<T>,
        settings?: ITypedJSONSettings,
    ): string {
        return new TypedJSON(elementType, settings).stringifyAsSet(object);
    }

    static stringifyAsMap<K, V>(
        object: Map<K, V>,
        keyCtor: Serializable<K>,
        valueCtor: Serializable<V>,
        settings?: ITypedJSONSettings,
    ): string {
        return new TypedJSON(valueCtor, settings).stringifyAsMap(object, keyCtor);
    }

    static setGlobalConfig(config: ITypedJSONSettings) {
        Object.assign(this._globalConfig, config);
    }

    /**
     * Map a type to its (de)serializer.
     */
    static mapType<T, R = T>(type: Serializable<T>, converters: MappedTypeConverters<R>): void {
        if (this._globalConfig.mappedTypes == null) {
            this._globalConfig.mappedTypes = new Map<any, any>();
        }

        this._globalConfig.mappedTypes.set(type, converters);
    }

    /**
     * Configures TypedJSON through a settings object.
     * @param settings The configuration settings object.
     */
    config(settings?: ITypedJSONSettings) {
        settings = {
            ...TypedJSON._globalConfig,
            ...settings,
        };

        if (settings.replacer != null) {
            this.replacer = settings.replacer;
        }
        if (settings.indent != null) {
            this.indent = settings.indent;
        }

        if (settings.mappedTypes != null) {
            settings.mappedTypes.forEach((upDown, type) => {
                this.setSerializationStrategies(type, upDown);
            });
        }
    }

    mapType<T, R = T>(type: Serializable<T>, converters: MappedTypeConverters<R>): void {
        this.setSerializationStrategies(type, converters);
    }

    /**
     * Converts a JSON string to the root class type.
     * @param object The JSON to parse and convert.
     * @throws Error if any errors are thrown in the specified errorHandler callback (re-thrown).
     * @returns Deserialized T or undefined if there were errors.
     */
    parse(object: any): RootType {
        const json = parseToJSObject(object, this.rootConstructor);

        return this.deserializer.convertSingleValue({
            sourceObject: json,
            typeDescriptor: ensureTypeDescriptor(this.rootConstructor),
        });
    }

    parseAsArray(object: any, dimensions?: 1): Array<RootType>;
    parseAsArray(object: any, dimensions: 2): Array<Array<RootType>>;
    parseAsArray(object: any, dimensions: 3): Array<Array<Array<RootType>>>;
    parseAsArray(object: any, dimensions: 4): Array<Array<Array<Array<RootType>>>>;
    parseAsArray(object: any, dimensions: 5): Array<Array<Array<Array<Array<RootType>>>>>;
    parseAsArray(object: any, dimensions: number): Array<any>;
    parseAsArray(object: any, dimensions: number = 1): Array<any> {
        const json = parseToJSObject(object, Array);
        return this.deserializer.convertSingleValue({
            sourceObject: json,
            typeDescriptor: createArrayType(ensureTypeDescriptor(this.rootConstructor), dimensions),
        });
    }

    parseAsSet(object: any): Set<RootType> {
        const json = parseToJSObject(object, Set);
        return this.deserializer.convertSingleValue({
            sourceObject: json,
            typeDescriptor: SetT(this.rootConstructor),
        });
    }

    parseAsMap<K>(object: any, keyConstructor: Serializable<K>): Map<K, RootType> {
        const json = parseToJSObject(object, Map);
        return this.deserializer.convertSingleValue({
            sourceObject: json,
            typeDescriptor: MapT(keyConstructor, this.rootConstructor),
        });
    }

    /**
     * Converts an instance of the specified class type to a plain JSON object.
     * @param object The instance to convert to a JSON string.
     * @returns Serialized object.
     */
    toPlainJson(object: RootType): ToPlainResult<RootType> {
        return this.serializer.convertSingleValue({
            sourceObject: object,
            typeDescriptor: ensureTypeDescriptor(this.rootConstructor),
        });
    }

    toPlainArray(
        object: Array<RootType>,
        dimensions?: 1,
    ): Array<ToPlainResult<RootType>>;
    toPlainArray(
        object: Array<Array<RootType>>,
        dimensions: 2,
    ): Array<Array<ToPlainResult<RootType>>>;
    toPlainArray(
        object: Array<Array<Array<RootType>>>,
        dimensions: 3,
    ): Array<Array<Array<ToPlainResult<RootType>>>>;
    toPlainArray(
        object: Array<Array<Array<Array<RootType>>>>,
        dimensions: 4,
    ): Array<Array<Array<Array<ToPlainResult<RootType>>>>>;
    toPlainArray(
        object: Array<Array<Array<Array<Array<RootType>>>>>,
        dimensions: 5,
    ): Array<Array<Array<Array<Array<ToPlainResult<RootType>>>>>>;
    toPlainArray(object: Array<any>, dimensions: number = 1) {
        return this.serializer.convertSingleValue({
            sourceObject: object,
            typeDescriptor: createArrayType(ensureTypeDescriptor(this.rootConstructor), dimensions),
        });
    }

    toPlainSet(object: Set<RootType>): Array<ToPlainResult<RootType>> {
        return this.serializer.convertSingleValue({
            sourceObject: object,
            typeDescriptor: SetT(this.rootConstructor),
        });
    }

    toPlainMap<K>(
        object: Map<K, RootType>,
        keyConstructor: Serializable<K>,
    ): IndexedObject | Array<{key: any; value: ToPlainResult<RootType>}> {
        return this.serializer.convertSingleValue({
            sourceObject: object,
            typeDescriptor: MapT(keyConstructor, this.rootConstructor),
        });
    }

    /**
     * Converts an instance of the specified class type to a JSON string.
     * @param object The instance to convert to a JSON string.
     * @throws Error if any errors are thrown in the specified errorHandler callback (re-thrown).
     * @returns String with the serialized object.
     */
    stringify(object: RootType): string {
        const result = this.toPlainJson(object);
        return JSON.stringify(result, this.replacer, this.indent);
    }

    stringifyAsArray(object: Array<RootType>, dimensions?: 1): string;
    stringifyAsArray(object: Array<Array<RootType>>, dimensions: 2): string;
    stringifyAsArray(object: Array<Array<Array<RootType>>>, dimensions: 3): string;
    stringifyAsArray(object: Array<Array<Array<Array<RootType>>>>, dimensions: 4): string;
    stringifyAsArray(object: Array<Array<Array<Array<Array<RootType>>>>>, dimensions: 5): string;
    stringifyAsArray(object: Array<any>, dimensions: any): string {
        return JSON.stringify(this.toPlainArray(object, dimensions), this.replacer, this.indent);
    }

    stringifyAsSet(object: Set<RootType>): string {
        return JSON.stringify(this.toPlainSet(object), this.replacer, this.indent);
    }

    stringifyAsMap<K>(object: Map<K, RootType>, keyConstructor: Serializable<K>): string {
        return JSON.stringify(this.toPlainMap(object, keyConstructor), this.replacer, this.indent);
    }

    private setSerializationStrategies<T, R = T>(
        type: Serializable<T>,
        converters: MappedTypeConverters<R>,
    ): void {
        if (converters.deserializer != null) {
            this.deserializer.setDeserializationStrategy(type, ({sourceObject}) => {
                return converters.deserializer!(sourceObject);
            });
        }

        if (converters.serializer != null) {
            this.serializer.setSerializationStrategy(type, ({sourceObject}) => {
                return converters.serializer!(sourceObject);
            });
        }
    }
}
