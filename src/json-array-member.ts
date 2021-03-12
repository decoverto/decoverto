import {isReflectMetadataSupported, MISSING_REFLECT_CONF_MSG, nameof} from './helpers';
import {injectMetadataInformation} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {
    ArrayTypeDescriptor,
    ensureTypeDescriptor,
    TypeDescriptor,
    TypeThunk,
} from './type-descriptor';

declare abstract class Reflect {
    static getMetadata(metadataKey: string, target: any, targetKey: string | symbol): any;
}

export interface IJsonArrayMemberOptions extends OptionsBase {
    /** When set, indicates that the member must be present when converting from JSON. */
    isRequired?: boolean | null;

    /** When set, an empty array is emitted if the property is undefined/uninitialized. */
    emitDefaultValue?: boolean | null;

    /** Sets array dimensions (e.g. 1 for 'number[]' or 2 for 'number[][]'). Defaults to 1. */
    dimensions?: number | null;

    /** When set, the key on the JSON that should be used instead of the class property name */
    name?: string | null;

    /**
     * When set, this method will be used to convert the value **from** JSON.
     */
    fromJson?: ((json: any) => any) | null;

    /**
     * When set, this method will be used to convert the value **to** JSON.
     */
    toJson?: ((value: any) => any) | null;
}

/**
 * Specifies that the property should be included in the JSON conversion.
 * @param typeThunk Constructor of array elements (e.g. 'Number' for 'number[]', or 'Date'
 * for 'Date[]').
 * @param options Additional options.
 */
export function jsonArrayMember(
    typeThunk: TypeThunk,
    options: IJsonArrayMemberOptions = {},
): PropertyDecorator {
    return (target, propKey) => {
        const decoratorName =
            `@jsonArrayMember on ${nameof(target.constructor)}.${String(propKey)}`;

        const dimensions = options.dimensions == null ? 1 : options.dimensions;
        if (!isNaN(dimensions) && dimensions < 1) {
            throw new Error(`${decoratorName}: 'dimensions' option must be at least 1.`);
        }

        // If ReflectDecorators is available, use it to check whether 'jsonArrayMember' has been
        // used on an array.
        const reflectedType = isReflectMetadataSupported
            ? Reflect.getMetadata('design:type', target, propKey)
            : null;

        if (reflectedType != null && reflectedType !== Array && reflectedType !== Object) {
            throw new Error(
                `${decoratorName}: property is not an Array. ${MISSING_REFLECT_CONF_MSG}`,
            );
        }

        injectMetadataInformation(target, propKey, {
            type: () => createArrayType(ensureTypeDescriptor(typeThunk()), dimensions),
            emitDefaultValue: options.emitDefaultValue,
            isRequired: options.isRequired,
            options: extractOptionBase(options),
            key: propKey.toString(),
            name: options.name ?? propKey.toString(),
            fromJson: options.fromJson,
            toJson: options.toJson,
        });
    };
}

export function createArrayType(
    elementType: TypeDescriptor,
    dimensions: number,
): ArrayTypeDescriptor {
    let type = new ArrayTypeDescriptor(elementType);
    for (let i = 1; i < dimensions; ++i) {
        type = new ArrayTypeDescriptor(type);
    }
    return type;
}
