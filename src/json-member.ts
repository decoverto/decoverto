import {
    isReflectMetadataSupported,
    LAZY_TYPE_EXPLANATION,
    nameof,
} from './helpers';
import {injectMetadataInformation} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {ConcreteTypeDescriptor} from './type-descriptor/concrete.type-descriptor';
import {
    isTypeLike,
    TypeDescriptor,
    Typelike,
    TypeThunk,
} from './type-descriptor/type-descriptor';
import {ensureTypeDescriptor} from './type-descriptor/type-descriptor.utils';
import {Constructor} from './types';

declare abstract class Reflect {
    static getMetadata(metadataKey: string, target: any, targetKey: string | symbol): any;
}

export interface IJsonMemberOptions extends OptionsBase {

    /** When set, indicates that the member must be present when converting from JSON. */
    isRequired?: boolean | null;

    /** When set, a default value is emitted if the property is uninitialized/undefined. */
    emitDefaultValue?: boolean | null;

    /** When set, the key on the JSON that should be used instead of the class property name. */
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
 * Specifies that the property should be included in the JSON conversion, with additional options.
 * Requires ReflectDecorators.
 */
export function jsonMember(options: IJsonMemberOptions): PropertyDecorator;

/**
 * Specifies that a property should be included in the JSON conversion, with a defined type and
 * extra options.
 */
export function jsonMember(
    type?: TypeThunk | TypeDescriptor,
    options?: IJsonMemberOptions,
): PropertyDecorator;

export function jsonMember<T extends Function>(
    optionsOrType?: IJsonMemberOptions | Typelike<any>,
    options?: IJsonMemberOptions,
): PropertyDecorator {
    return (target, property) => {
        const decoratorName = `@jsonMember on ${nameof(target.constructor)}.${String(property)}`;
        let type: Typelike<any> | undefined;

        if (isTypeLike(optionsOrType)) {
            type = optionsOrType;
        } else {
            options = optionsOrType;
        }

        options = options ?? {};

        if (type !== undefined) {
            // Do nothing
        } else if (isReflectMetadataSupported) {
            const reflectCtor = Reflect.getMetadata(
                'design:type',
                target,
                property,
            ) as Constructor<any> | null | undefined;

            if (reflectCtor == null) {
                throw new Error(`${decoratorName}: cannot resolve detected property constructor at \
runtime. ${LAZY_TYPE_EXPLANATION}`);
            }

            type = new ConcreteTypeDescriptor(reflectCtor);
        } else if (options.fromJson === undefined) {
            throw new Error(`${decoratorName}: Cannot determine type`);
        }

        injectMetadataInformation(target, property, {
            type: type === undefined ? undefined : ensureTypeDescriptor(type),
            emitDefaultValue: options.emitDefaultValue,
            isRequired: options.isRequired,
            options: extractOptionBase(options),
            key: property.toString(),
            name: options.name ?? property.toString(),
            fromJson: options.fromJson,
            toJson: options.toJson,
        });
    };
}
