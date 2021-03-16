import {shouldOmitParseString} from './helpers';
import {JsonHandler, JsonHandlerSimple} from './json-handler';
import {JsonObjectMetadata} from './metadata';
import {ArrayTypeDescriptor} from './type-descriptor/array.type-descriptor';
import {ConcreteTypeDescriptor} from './type-descriptor/concrete.type-descriptor';
import {SetTypeDescriptor} from './type-descriptor/set.type-descriptor';
import {TypeDescriptor} from './type-descriptor/type-descriptor';
import {Serializable} from './types';

export type ToPlainResult<T> =
    T extends Record<string, unknown>
        ? {[k in keyof T]?: T[k]} | {[k: string]: any}
        : any;

export interface DecoratedJsonTypeHandlerSettings {
    conversionMap: Map<Serializable<any>, TypeDescriptor>;
    jsonHandler: JsonHandler;
}

/**
 * Make some settings optional.
 */
export type DecoratedJsonTypeHandlerSettingsInput =
    Omit<DecoratedJsonTypeHandlerSettings, 'jsonHandler'>
    & Partial<DecoratedJsonTypeHandlerSettings>;

export class DecoratedJsonTypeHandler<RootType> {

    private settings!: DecoratedJsonTypeHandlerSettings;
    private readonly rootTypeDescriptor: ConcreteTypeDescriptor;

    /**
     * Creates a new DecoratedJson instance to perform conversion to and from JSON for the given
     * root class type.
     * @param rootConstructor The constructor of the root class type.
     * @param settings Additional configuration settings.
     */
    constructor(
        private readonly rootConstructor: Serializable<RootType>,
        settings: DecoratedJsonTypeHandlerSettingsInput,
    ) {
        this.rootTypeDescriptor = new ConcreteTypeDescriptor<RootType, any>(rootConstructor);
        const rootMetadata = JsonObjectMetadata.getFromConstructor(rootConstructor);

        if (rootMetadata === undefined
            || (!rootMetadata.isExplicitlyMarked && !rootMetadata.isHandledWithoutAnnotation)) {
            throw new TypeError(
                'The DecoratedJson root data type must have the @jsonObject decorator used.',
            );
        }

        this.rootConstructor = rootConstructor;
        this.configure(settings);
    }

    configure(settings: DecoratedJsonTypeHandlerSettingsInput) {
        this.settings = {
            conversionMap: settings.conversionMap,
            jsonHandler: settings.jsonHandler ?? new JsonHandlerSimple({}),
        };
    }

    /**
     * Converts a JSON string to the root class type.
     * @param object The JSON to parse and convert.
     */
    parse(object: any): RootType {
        const json = this.toJsonObject(object, this.rootConstructor);
        return this.toObjectSingleValue(json, this.rootTypeDescriptor);
    }

    parseArray(object: Array<any> | string): Array<RootType> {
        const json = this.toJsonObject(object, Array);
        return this.toObjectSingleValue(json, new ArrayTypeDescriptor(this.rootTypeDescriptor));
    }

    parseSet(object: Array<any> | string): Set<RootType> {
        const json = this.toJsonObject(object, Set);
        return this.toObjectSingleValue(json, new SetTypeDescriptor(this.rootTypeDescriptor));
    }

    /**
     * Converts an instance of the specified class type to a plain JSON object.
     */
    toPlainJson(object: RootType): ToPlainResult<RootType> {
        return this.toJsonSingleValue(object, this.rootTypeDescriptor);
    }

    toPlainArray(object: Array<RootType>): Array<ToPlainResult<RootType>> {
        return this.toJsonSingleValue(object, new ArrayTypeDescriptor(this.rootTypeDescriptor));
    }

    toPlainSet(object: Set<RootType>): Array<ToPlainResult<RootType>> {
        return this.toJsonSingleValue(object, new SetTypeDescriptor(this.rootTypeDescriptor));
    }

    /**
     * Converts an instance of the specified class type to a JSON string.
     * @param object The instance to convert to a JSON string.
     */
    stringify(object: RootType): string {
        const result = this.toPlainJson(object);

        return this.settings.jsonHandler.stringify(result);
    }

    stringifyArray(object: Array<RootType>): string {
        return this.settings.jsonHandler.stringify(this.toPlainArray(object));
    }

    stringifySet(object: Set<RootType>): string {
        return this.settings.jsonHandler.stringify(this.toPlainSet(object));
    }

    /**
     * Turn the given value into a JSON object. If the value is already an object, it will be
     * returned unchanged.
     * @internal
     */
    toJsonObject<T>(json: any, expectedType: Serializable<T>): any {
        if (typeof json !== 'string' || shouldOmitParseString(json, expectedType)) {
            return json;
        }

        return this.settings.jsonHandler.parse(json);
    }

    private toJsonSingleValue(object: any, typeDescriptor: TypeDescriptor) {
        return typeDescriptor.toJson({
            source: object,
            typeMap: this.settings.conversionMap,
        });
    }

    private toObjectSingleValue(object: any, typeDescriptor: TypeDescriptor) {
        return typeDescriptor.fromJson({
            source: object,
            typeMap: this.settings.conversionMap,
        });
    }
}
