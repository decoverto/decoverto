import {isValueDefined} from '../helpers';
import {
    ConversionContext,
    TypeDescriptor,
    Typelike,
} from './type-descriptor';
import {ensureTypeDescriptor} from './type-descriptor.utils';

export const enum MapShape {
    /**
     * A map will be converted as an array of key-value objects.
     * E.g. `map: Map<string, string>` is represented in JSON as:
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
     * A map will be converted as a JSON object.
     * E.g. `map: Map<string, string>` is represented in JSON as:
     * ```json
     * {
     *     "map": {
     *         "key": "value"
     *     }
     * }
     * ```
     */
    Object = 'Object',
}

export interface MapOptions {
    /**
     * How the map should be converted.
     */
    shape: MapShape;
}

export type MapJson =
    | Array<{key: any; value: any}>
    | Record<string, any> | null | undefined
;

export class MapTypeDescriptor<Key extends Object, Value extends Object>
    extends TypeDescriptor<Map<Key, Value>, MapJson> {

    readonly shape: MapShape;

    constructor(
        readonly keyType: TypeDescriptor,
        readonly valueType: TypeDescriptor,
        readonly options: MapOptions,
    ) {
        super();
        this.shape = options.shape;
    }

    fromJson(
        context: ConversionContext<MapJson | null | undefined>,
    ): Map<any, any> | null | undefined {
        const {sourceObject, path} = context;

        if (sourceObject == null) {
            return sourceObject;
        }

        if (!this.isExpectedMapShape(sourceObject)) {
            const expectedType = this.shape === MapShape.Array ? Array : Object;
            throw new TypeError(this.throwTypeMismatchError({
                expectedSourceType: expectedType.name,
                context,
            }));
        }

        const resultMap = new Map<any, any>();

        if (Array.isArray(sourceObject)) {
            sourceObject.forEach((element, index) => {
                const key = this.keyType.fromJson({
                    ...context,
                    path: `${path}[${index}].key`,
                    sourceObject: element.key,
                });

                // Undefined/null keys not supported, skip if so.
                if (isValueDefined(key)) {
                    resultMap.set(
                        key,
                        this.valueType.fromJson({
                            ...context,
                            path: `${path}[${index}].value`,
                            sourceObject: element.value,
                        }),
                    );
                }
            });
        } else {
            Object.keys(sourceObject).forEach((key, index) => {
                const resultKey = this.keyType.fromJson({
                    ...context,
                    path: `${path}[${index}].key`,
                    sourceObject: key,
                });
                if (isValueDefined(resultKey)) {
                    resultMap.set(
                        resultKey,
                        this.valueType.fromJson({
                            ...context,
                            path: `${path}[${index}].value`,
                            sourceObject: sourceObject[key],
                        }),
                    );
                }
            });
        }

        return resultMap;
    }

    /**
     * Performs the conversion of a map of typed objects (or primitive values) into an array
     * of simple javascript objects with `key` and `value` properties.
     */
    toJson(
        context: ConversionContext<Map<any, any> | null | undefined>,
    ): MapJson | null | undefined {
        if (context.sourceObject == null) {
            return context.sourceObject;
        }

        const result: Array<{key: any; value: any}> | Record<string, any> =
            this.shape === MapShape.Object ? {} : [];

        // Convert each *entry* in the map to a simple javascript object with key and value
        // properties.
        context.sourceObject.forEach((value, key) => {
            const resultKeyValuePairObj = {
                key: this.keyType.toJson({
                    ...context,
                    path: `${context.path}[].value`,
                    sourceObject: key,
                }),
                value: this.valueType.toJson({
                    ...context,
                    path: `${context.path}[].value`,
                    sourceObject: value,
                }),
            };

            // We are not going to emit entries with undefined keys OR undefined values.
            const keyDefined = isValueDefined(resultKeyValuePairObj.key);
            const valueDefined = resultKeyValuePairObj.value !== undefined;
            if (keyDefined && valueDefined) {
                if (Array.isArray(result)) {
                    result.push(resultKeyValuePairObj);
                } else {
                    result[resultKeyValuePairObj.key] = resultKeyValuePairObj.value;
                }
            }
        });

        return result;
    }

    getFriendlyName(): string {
        return `Map<${this.keyType.getFriendlyName()}, ${this.valueType.getFriendlyName()}>`;
    }

    private isExpectedMapShape(source: any): boolean {
        return (this.shape === MapShape.Array && Array.isArray(source))
            || (this.shape === MapShape.Object && typeof source === 'object');
    }
}

export function map<K, V>(
    keyType: Typelike<K>,
    valueType: Typelike<V>,
    options: MapOptions,
): MapTypeDescriptor<K, V> {
    return new MapTypeDescriptor(
        ensureTypeDescriptor(keyType),
        ensureTypeDescriptor(valueType),
        options,
    );
}
