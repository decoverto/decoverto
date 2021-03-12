import {isReflectMetadataSupported, MISSING_REFLECT_CONF_MSG, nameof} from './helpers';
import {
    injectMetadataInformation,
} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {SetT, TypeThunk} from './type-descriptor';

declare abstract class Reflect {
    static getMetadata(metadataKey: string, target: any, targetKey: string | symbol): any;
}

export interface IJsonSetMemberOptions extends OptionsBase {
    /** When set, indicates that the member must be present when converting from JSON. */
    isRequired?: boolean | null;

    /** When set, a default value is emitted for each uninitialized json member. */
    emitDefaultValue?: boolean | null;

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
 * Use this decorator on properties of type Set<T>.
 * @param typeThunk Constructor of set elements (e.g. 'Number' for Set<number> or 'Date'
 * for Set<Date>).
 * @param options Additional options.
 */
export function jsonSetMember(
    typeThunk: TypeThunk,
    options: IJsonSetMemberOptions = {},
): PropertyDecorator {
    return (target, propKey) => {
        // For error messages
        const decoratorName = `@jsonSetMember on ${nameof(target.constructor)}.${String(propKey)}`;

        // If ReflectDecorators is available, use it to check whether 'jsonSetMember' has been used
        // on a set. Warn if not.
        const reflectedType = isReflectMetadataSupported
            ? Reflect.getMetadata('design:type', target, propKey)
            : null;

        if (reflectedType != null && reflectedType !== Set && reflectedType !== Object) {
            throw new Error(`${decoratorName}: property is not a Set. ${MISSING_REFLECT_CONF_MSG}`);
        }

        injectMetadataInformation(target, propKey, {
            type: () => SetT(typeThunk()),
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
