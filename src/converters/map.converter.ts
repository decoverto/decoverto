import {isObject} from '../helpers';
import {
    ConversionContext,
    Converter,
    Typelike,
} from './converter';
import {toConverter} from './converter.utils';

export enum MapShape {
    /**
     * A map will be converted as an array of key-value objects.
     * E.g. `map: Map<string, string>` is represented as:
     * ```json
     * {
     *     "map": [
     *         {
     *             "key": "one",
     *             "value": "value",
     *         }
     *     ]
     * }
     * ```
     */
    Array = 'Array',

    /**
     * A map will be converted as an object.
     * E.g. `map: Map<string, string>` is represented as:
     * ```json
     * {
     *     "map": {
     *         "key": "value"
     *     }
     * }
     * ```
     */
    Object = 'Object',

    /**
     * A map will be converted as an array of tuples.
     * E.g. `map: Map<string, string>` is represented as:
     * ```json
     * {
     *     "map": [
     *         ["key", "value"]
     *     ]
     * }
     * ```
     */
    Tuple = 'Tuple',
}

export interface MapOptions {
    /**
     * How the map should be converted.
     */
    shape: MapShape;
}

export type MapPlain =
    | Array<{key: any; value: any}>
    | Record<string, any> | null | undefined
;

export class MapConverter<Key extends Object, Value extends Object>
    extends Converter<Map<Key, Value> | null | undefined, MapPlain> {

    readonly shape: MapShape;

    constructor(
        readonly keyType: Converter<Key>,
        readonly valueType: Converter<Value>,
        readonly options: MapOptions,
    ) {
        super();
        this.shape = options.shape;
    }

    toInstance(
        context: ConversionContext<MapPlain | null | undefined>,
    ): Map<Key, Value> | null | undefined {
        const {source, path} = context;

        if (source == null) {
            return source;
        }

        if (!this.isExpectedMapShape(source)) {
            this.throwTypeMismatchError({
                ...context,
                expectedType: `${this.shape} notation`,
            });
        }

        const resultMap = new Map<any, any>();

        if (Array.isArray(source) && this.shape === MapShape.Array) {
            source.forEach((element, index) => {
                const key = this.keyType.toInstance({
                    ...context,
                    path: `${path}[${index}].key`,
                    source: element.key,
                });

                resultMap.set(
                    key,
                    this.valueType.toInstance({
                        ...context,
                        path: `${path}[${index}].value`,
                        source: element.value,
                    }),
                );
            });
        } else if (Array.isArray(source) && this.shape === MapShape.Tuple) {
            source.forEach((element, index) => {
                const key = this.keyType.toInstance({
                    ...context,
                    path: `${path}[${index}].key`,
                    source: element[0],
                });

                resultMap.set(
                    key,
                    this.valueType.toInstance({
                        ...context,
                        path: `${path}[${index}].value`,
                        source: element[1],
                    }),
                );
            });
        } else {
            Object.keys(source).forEach((key, index) => {
                const resultKey = this.keyType.toInstance({
                    ...context,
                    path: `${path}[${index}].key`,
                    source: key,
                });
                resultMap.set(
                    resultKey,
                    this.valueType.toInstance({
                        ...context,
                        path: `${path}[${index}].value`,
                        source: source[key],
                    }),
                );
            });
        }

        return resultMap;
    }

    /**
     * Performs the conversion of a map of typed objects (or primitive values) into an array
     * of simple javascript objects with `key` and `value` properties.
     */
    toPlain(
        context: ConversionContext<Map<Key, Value> | null | undefined>,
    ): MapPlain | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        const result: Array<{key: any; value: any} | [any, any]> | Record<string, any> =
            this.shape === MapShape.Object ? {} : [];

        // Convert each *entry* in the map to a simple javascript object with key and value
        // properties.
        context.source.forEach((value, key) => {
            const resultKeyValuePairObj = {
                key: this.keyType.toPlain({
                    ...context,
                    path: `${context.path}[].value`,
                    source: key,
                }) ?? null,
                value: this.valueType.toPlain({
                    ...context,
                    path: `${context.path}[].value`,
                    source: value,
                }) ?? null,
            };

            // We are not going to emit entries with undefined keys OR undefined values.
            if (Array.isArray(result)) {
                if (this.shape === MapShape.Array) {
                    result.push(resultKeyValuePairObj);
                } else {
                    result.push([resultKeyValuePairObj.key, resultKeyValuePairObj.value]);
                }
            } else {
                result[resultKeyValuePairObj.key] = resultKeyValuePairObj.value;
            }
        });

        return result;
    }

    getFriendlyName(): string {
        return `Map<${this.keyType.getFriendlyName()}, ${this.valueType.getFriendlyName()}>`;
    }

    private isExpectedMapShape(source: any): boolean {
        switch (this.shape) {
            case MapShape.Array:
                return Array.isArray(source);
            case MapShape.Object:
                return isObject(source) && !Array.isArray(source);
            case MapShape.Tuple:
                return Array.isArray(source);
        }
    }
}

export function map<K, V>(
    keyType: Typelike<K>,
    valueType: Typelike<V>,
    options: MapOptions,
): MapConverter<K, V> {
    return new MapConverter(
        toConverter(keyType),
        toConverter(valueType),
        options,
    );
}
