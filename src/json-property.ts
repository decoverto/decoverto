import {getDiagnostic} from './diagnostics';
import {
    isReflectMetadataSupported,
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

export interface JsonPropertyOptions extends OptionsBase {

    /** When set, indicates that the property must be present when converting from JSON. */
    isRequired?: boolean | null;

    /** The jsonName on the JSON that should be used instead of the class property jsonName. */
    jsonName?: string | null;

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
export function jsonProperty(options: JsonPropertyOptions): PropertyDecorator;

/**
 * Specifies that a property should be included in the JSON conversion, with a defined type and
 * extra options.
 */
export function jsonProperty(
    type?: TypeThunk | TypeDescriptor,
    options?: JsonPropertyOptions,
): PropertyDecorator;

export function jsonProperty<T extends Function>(
    optionsOrType?: JsonPropertyOptions | Typelike<any>,
    options?: JsonPropertyOptions,
): PropertyDecorator {
    return (target, property) => {
        const typeName = target.constructor.name;
        let type: Typelike<any> | undefined;

        if (isTypeLike(optionsOrType)) {
            type = optionsOrType;
        } else {
            options = optionsOrType;
        }

        options = options ?? {};

        if (type !== undefined) {
            type = ensureTypeDescriptor(type);
        } else if (options.fromJson != null && options.toJson != null) {
            // Do nothing
        } else if (isReflectMetadataSupported) {
            const reflectCtor = Reflect.getMetadata(
                'design:type',
                target,
                property,
            ) as Constructor<any> | null | undefined;

            if (reflectCtor == null) {
                throw new Error(getDiagnostic('jsonPropertyReflectedTypeIsNull', {
                    typeName,
                    property,
                }));
            }

            if (reflectCtor === Object) {
                throw new Error(getDiagnostic('jsonPropertyReflectedTypeIsObject', {
                    typeName,
                    property,
                }));
            }

            type = new ConcreteTypeDescriptor(reflectCtor);
        } else {
            throw new Error(getDiagnostic('jsonPropertyNoTypeNoConvertersNoReflect', {
                typeName,
                property,
            }));
        }

        // TypeScript limitation, when the previous if statement has concluded, either `type` is
        // defined or both converters are.
        const conditionalOptions = type === undefined
            ? {fromJson: options.fromJson!, toJson: options.toJson!}
            : {fromJson: options.fromJson, toJson: options.toJson, type};

        injectMetadataInformation(target, property, {
            ...conditionalOptions,
            isRequired: options.isRequired,
            options: extractOptionBase(options),
            key: property.toString(),
            jsonName: options.jsonName ?? property.toString(),
        });
    };
}
