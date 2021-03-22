import {ArrayConverter} from './converters/array.converter';
import {ConcreteConverter} from './converters/concrete.converter';
import {Converter} from './converters/converter';
import {SetConverter} from './converters/set.converter';
import {getDiagnostic} from './diagnostics';
import {shouldOmitParseString} from './helpers';
import {JsonHandler} from './json-handler';
import {JsonObjectMetadata} from './metadata';
import {Serializable} from './types';

export type ToPlainResult<T> =
    T extends Record<string, unknown>
        ? {[k in keyof T]?: T[k]} | {[k: string]: any}
        : any;

export interface TypeHandlerSettings {
    jsonHandler: JsonHandler;

    /**
     * Maps a type to its respective converter.
     */
    converterMap: Map<Serializable<any>, Converter>;
}

export class TypeHandler<RootType> {

    private settings!: TypeHandlerSettings;
    private readonly rootConverter: ConcreteConverter;

    /**
     * Creates a new DecoratedJson instance to perform conversion to and from JSON for the given
     * root class type.
     * @param rootConstructor The constructor of the root class type.
     * @param settings Additional configuration settings.
     */
    constructor(
        private readonly rootConstructor: Serializable<RootType>,
        settings: TypeHandlerSettings,
    ) {
        this.rootConverter = new ConcreteConverter<RootType>(rootConstructor);
        const rootMetadata = JsonObjectMetadata.getFromConstructor(rootConstructor);

        if (rootMetadata === undefined
            || (!rootMetadata.isExplicitlyMarked && !rootMetadata.isHandledWithoutAnnotation)) {
            throw new TypeError(getDiagnostic('missingJsonObjectDecorator', {
                typeName: rootConstructor.name,
            }));
        }

        this.rootConstructor = rootConstructor;
        this.configure(settings);
    }

    configure(settings: TypeHandlerSettings) {
        this.settings = {
            converterMap: settings.converterMap,
            jsonHandler: settings.jsonHandler,
        };
    }

    /**
     * Converts a JSON string to the root class type.
     * @param object The JSON to parse and convert.
     */
    parse(object: any): RootType {
        const json = this.toJsonObject(object, this.rootConstructor);
        return this.toObjectSingleValue(json, this.rootConverter);
    }

    parseArray(object: Array<any> | string): Array<RootType> {
        const json = this.toJsonObject(object, Array);
        return this.toObjectSingleValue(json, new ArrayConverter(this.rootConverter));
    }

    parseSet(object: Array<any> | string): Set<RootType> {
        const json = this.toJsonObject(object, Set);
        return this.toObjectSingleValue(json, new SetConverter(this.rootConverter));
    }

    /**
     * Converts an instance of the specified class type to a plain JSON object.
     */
    toPlainJson(object: RootType): ToPlainResult<RootType> {
        return this.toJsonSingleValue(object, this.rootConverter);
    }

    toPlainArray(object: Array<RootType>): Array<ToPlainResult<RootType>> {
        return this.toJsonSingleValue(object, new ArrayConverter(this.rootConverter));
    }

    toPlainSet(object: Set<RootType>): Array<ToPlainResult<RootType>> {
        return this.toJsonSingleValue(object, new SetConverter(this.rootConverter));
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

    private toJsonSingleValue(object: any, converter: Converter) {
        return converter.toJson({
            path: '',
            source: object,
            converterMap: this.settings.converterMap,
        });
    }

    private toObjectSingleValue(object: any, converter: Converter) {
        return converter.fromJson({
            path: '',
            source: object,
            converterMap: this.settings.converterMap,
        });
    }
}
