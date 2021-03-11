import {MappedTypeConverters} from './decorated-json.interface';
import {Deserializer} from './deserializer';
import {shouldOmitParseString} from './helpers';
import {createArrayType} from './json-array-member';
import {JsonHandler, JsonHandlerSimple} from './json-handler';
import {JsonObjectMetadata} from './metadata';
import {Serializer} from './serializer';
import {ensureTypeDescriptor, MapT, SetT} from './type-descriptor';
import {IndexedObject, Serializable} from './types';

export type ToPlainResult<T> =
    T extends Object
        ? {[k in keyof T]?: T[k]} | {[k: string]: any}
        : any;

export interface DecoratedJsonTypeHandlerSettings {
    jsonHandler: JsonHandler;
}

export class DecoratedJsonTypeHandler<RootType> {

    private deserializer: Deserializer<RootType> = new Deserializer<RootType>();
    private serializer: Serializer = new Serializer();
    private settings!: DecoratedJsonTypeHandlerSettings;

    /**
     * Creates a new DecoratedJson instance to serialize (stringify) and deserialize (parse) object
     *     instances of the specified root class type.
     * @param rootConstructor The constructor of the root class type.
     * @param settings Additional configuration settings.
     */
    constructor(
        private readonly rootConstructor: Serializable<RootType>,
        settings?: Partial<DecoratedJsonTypeHandlerSettings>,
    ) {
        const rootMetadata = JsonObjectMetadata.getFromConstructor(rootConstructor);

        if (rootMetadata === undefined
            || (!rootMetadata.isExplicitlyMarked && !rootMetadata.isHandledWithoutAnnotation)) {
            throw new TypeError(
                'The DecoratedJson root data type must have the @jsonObject decorator used.',
            );
        }

        this.rootConstructor = rootConstructor;
        this.configure(settings ?? {});
    }

    configure(settings: Partial<DecoratedJsonTypeHandlerSettings>) {
        this.settings = {
            jsonHandler: settings.jsonHandler ?? new JsonHandlerSimple({}),
        };
    }

    /**
     * Converts a JSON string to the root class type.
     * @param object The JSON to parse and convert.
     */
    parse(object: any): RootType {
        const json = this.toJsonObject(object, this.rootConstructor);

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
        const json = this.toJsonObject(object, Array);
        return this.deserializer.convertSingleValue({
            sourceObject: json,
            typeDescriptor: createArrayType(ensureTypeDescriptor(this.rootConstructor), dimensions),
        });
    }

    parseAsSet(object: any): Set<RootType> {
        const json = this.toJsonObject(object, Set);
        return this.deserializer.convertSingleValue({
            sourceObject: json,
            typeDescriptor: SetT(this.rootConstructor),
        });
    }

    parseAsMap<K>(object: any, keyConstructor: Serializable<K>): Map<K, RootType> {
        const json = this.toJsonObject(object, Map);
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
     */
    stringify(object: RootType): string {
        const result = this.toPlainJson(object);

        return this.settings.jsonHandler.stringify(result);
    }

    stringifyAsArray(object: Array<RootType>, dimensions?: 1): string;
    stringifyAsArray(object: Array<Array<RootType>>, dimensions: 2): string;
    stringifyAsArray(object: Array<Array<Array<RootType>>>, dimensions: 3): string;
    stringifyAsArray(object: Array<Array<Array<Array<RootType>>>>, dimensions: 4): string;
    stringifyAsArray(object: Array<Array<Array<Array<Array<RootType>>>>>, dimensions: 5): string;
    stringifyAsArray(object: Array<any>, dimensions: any): string {
        return this.settings.jsonHandler.stringify(this.toPlainArray(object, dimensions));
    }

    stringifyAsSet(object: Set<RootType>): string {
        return this.settings.jsonHandler.stringify(this.toPlainSet(object));
    }

    stringifyAsMap<K>(object: Map<K, RootType>, keyConstructor: Serializable<K>): string {
        return this.settings.jsonHandler.stringify(this.toPlainMap(object, keyConstructor));
    }

    setSerializationStrategies<T, R = T>(
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

    /**
     * Turn the given value into a JSON object. If the value is already an object, it will be
     * returned unchanged.
     * @internal
     */
    toJsonObject<T>(json: any, expectedType: Serializable<T>): IndexedObject {
        if (typeof json !== 'string' || shouldOmitParseString(json, expectedType)) {
            return json;
        }

        return this.settings.jsonHandler.parse(json);
    }
}
