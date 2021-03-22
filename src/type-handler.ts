import {ArrayConverter} from './converters/array.converter';
import {ConcreteConverter} from './converters/concrete.converter';
import {Converter} from './converters/converter';
import {SetConverter} from './converters/set.converter';
import {getDiagnostic} from './diagnostics';
import {JsonHandler} from './json-handler';
import {JsonObjectMetadata} from './metadata';
import {Serializable} from './types';

export type Plain<T> =
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

        if (!settings.converterMap.has(this.rootConstructor)
            && (rootMetadata === undefined || !rootMetadata.isExplicitlyMarked)) {
            throw new TypeError(getDiagnostic('unknownTypeCreatingTypeHandler', {
                type: rootConstructor,
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
     * Converts a JSON string to an instance of RootType.
     * @example
     * handler.parse('"foo"');
     * @example
     * type(String).parse('{"bar": "foo"}');
     */
    parseJson(string: string): RootType {
        return this.parsePlain(this.settings.jsonHandler.parse(string));
    }

    /**
     * Converts a JSON string to an array of RootType instances.
     * @example
     * type(String).parseJsonAsArray('["foo", "bar"]');
     */
    parseJsonAsArray(array: string): Array<RootType> {
        return this.parsePlainAsArray(this.settings.jsonHandler.parse(array));
    }

    /**
     * Converts a JSON string to a set of RootType instances.
     * @example
     * type(String).parseJsonAsSet('["foo", "bar"]');
     */
    parseJsonAsSet(array: string): Set<RootType> {
        return this.parsePlainAsSet(this.settings.jsonHandler.parse(array));
    }

    /**
     * Converts the plain form of RootType to an instance.
     * @example
     * handler.parsePlain({foo: 'bar'});
     * @example
     * type(String).parsePlain('string');
     */
    parsePlain(value: any): RootType {
        return this.toObjectSingleValue(value, this.rootConverter);
    }

    /**
     * Converts an array of plain forms of RootType to an array of instances.
     * @example
     * handler.parsePlainAsArray([{foo: 'bar'}]);
     * @example
     * type(String).parsePlainAsArray(['string']);
     */
    parsePlainAsArray(array: Array<any>): Array<RootType> {
        return this.toObjectSingleValue(array, new ArrayConverter(this.rootConverter));
    }

    /**
     * Converts an array of plain forms of RootType to a set of instances.
     * @example
     * handler.parsePlainAsSet([{foo: 'bar'}]);
     * @example
     * type(String).parsePlainAsSet(['string']);
     */
    parsePlainAsSet(array: Array<any>): Set<RootType> {
        return this.toObjectSingleValue(array, new SetConverter(this.rootConverter));
    }

    /**
     * Converts an instance of RootType to a JSON string.
     * @example
     * handler.stringify(example); // '{"foo": "bar"}'
     */
    stringify(object: RootType): string {
        return this.settings.jsonHandler.stringify(this.toPlain(object));
    }

    /**
     * Converts an array of RootType instances to a JSON string.
     * @example
     * handler.stringifyArray([example]); // '[{"foo": "bar"}]'
     */
    stringifyArray(object: Array<RootType>): string {
        return this.settings.jsonHandler.stringify(this.arrayToPlain(object));
    }

    /**
     * Converts a set of RootType instances to a JSON string.
     * @example
     * handler.stringifySet(new Set([example])); // '[{"foo": "bar"}]
     */
    stringifySet(object: Set<RootType>): string {
        return this.settings.jsonHandler.stringify(this.setToPlain(object));
    }

    /**
     * Converts an instance of RootType to its plain form.
     * @example
     * handler.toPlain(example); // {foo: 'bar'}
     */
    toPlain(object: RootType): Plain<RootType> {
        return this.toJsonSingleValue(object, this.rootConverter);
    }

    /**
     * Converts an array of RootType to an array of its plain form.
     * @example
     * handler.arrayToPlain([example]); // [{foo: 'bar'}]
     */
    arrayToPlain(object: Array<RootType>): Array<Plain<RootType>> {
        return this.toJsonSingleValue(object, new ArrayConverter(this.rootConverter));
    }

    /**
     * Converts a set of RootType to an array of its plain form.
     * @example
     * handler.arrayToPlain(new Set([example])); // [{foo: 'bar'}]
     */
    setToPlain(object: Set<RootType>): Array<Plain<RootType>> {
        return this.toJsonSingleValue(object, new SetConverter(this.rootConverter));
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
