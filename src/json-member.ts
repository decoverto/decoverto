import {
    isReflectMetadataSupported,
    LAZY_TYPE_EXPLANATION,
    nameof,
} from './helpers';
import {injectMetadataInformation} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {
    ArrayTypeDescriptor,
    ensureTypeDescriptor,
    isTypeThunk,
    MapTypeDescriptor,
    SetTypeDescriptor,
    TypeDescriptor,
    Typelike,
    TypeThunk,
} from './type-descriptor';
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
    type?: TypeThunk,
    options?: IJsonMemberOptions,
): PropertyDecorator;

export function jsonMember<T extends Function>(
    optionsOrType?: IJsonMemberOptions | TypeThunk,
    options?: IJsonMemberOptions,
): PropertyDecorator {
    return (target, property) => {
        const decoratorName = `@jsonMember on ${nameof(target.constructor)}.${String(property)}`;
        let typeThunk: TypeThunk | undefined;

        if (isTypeThunk(optionsOrType)) {
            typeThunk = optionsOrType;
        } else {
            options = optionsOrType;
        }

        options = options ?? {};

        if (typeThunk !== undefined) {
            // Do nothing
        } else if (isReflectMetadataSupported) {
            const reflectCtor = Reflect.getMetadata(
                'design:type',
                target,
                property,
            ) as Function | null | undefined;

            if (reflectCtor == null) {
                throw new Error(`${decoratorName}: cannot resolve detected property constructor at \
runtime. ${LAZY_TYPE_EXPLANATION}`);
            }
            typeThunk = () => ensureTypeDescriptor(reflectCtor);
        } else if (options.fromJson === undefined) {
            throw new Error(`${decoratorName}: Cannot determine type`);
        }

        const typeToTest = typeThunk?.();

        if (typeToTest !== undefined) {
            throwIfSpecialProperty(decoratorName, typeToTest);
        }

        injectMetadataInformation(target, property, {
            type: typeThunk === undefined
                ? undefined
                : () => ensureTypeDescriptor(typeThunk!()),
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

function isConstructorEqual(type: Typelike, constructor: Constructor<any>) {
    return type instanceof TypeDescriptor ? type.ctor === constructor : type === constructor;
}

function throwIfSpecialProperty(decoratorName: string, typeDescriptor: Typelike) {
    if (!(typeDescriptor instanceof ArrayTypeDescriptor)
        && isConstructorEqual(typeDescriptor, Array)) {
        throw new Error(`${decoratorName}: property is an Array. Use the jsonArrayMember decorator \
instead.`);
    }

    if (!(typeDescriptor instanceof SetTypeDescriptor) && isConstructorEqual(typeDescriptor, Set)) {
        throw new Error(`${decoratorName}: property is a Set. Use the jsonSetMember decorator \
instead.`);
    }

    if (!(typeDescriptor instanceof MapTypeDescriptor) && isConstructorEqual(typeDescriptor, Map)) {
        throw new Error(`${decoratorName}: property is a Map. Use the jsonMapMember decorator \`
instead.`);
    }
}
