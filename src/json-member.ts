import {
    isReflectMetadataSupported,
    isSubtypeOf,
    isValueDefined,
    LAZY_TYPE_EXPLANATION,
    logWarning,
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

    /** When set, indicates that the member must be present when deserializing. */
    isRequired?: boolean | null;

    /** When set, a default value is emitted if the property is uninitialized/undefined. */
    emitDefaultValue?: boolean | null;

    /** When set, the key on the JSON that should be used instead of the class property name. */
    name?: string | null;

    /**
     * When set, this deserializer will be used to deserialize the member. The callee must assure
     * the correct type.
     */
    deserializer?: ((json: any) => any) | null;

    /** When set, this serializer will be used to serialize the member. */
    serializer?: ((value: any) => any) | null;
}

/**
 * Specifies that a property is part of the object when serializing, with additional options.
 * Requires ReflectDecorators.
 */
export function jsonMember(options: IJsonMemberOptions): PropertyDecorator;

/**
 * Specifies that a property is part of the object when serializing, with a defined type and extra
 * options.
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

        if (Object.prototype.hasOwnProperty.call(options, 'constructor')) {
            if (typeThunk !== undefined) {
                throw new Error(
                    'Cannot both define constructor option and type. Only one allowed.',
                );
            }

            if (!isValueDefined(options.constructor)) {
                throw new Error(`${decoratorName}: cannot resolve specified property constructor \
at runtime. ${LAZY_TYPE_EXPLANATION}`);
            }

            // Property constructor has been specified. Use ReflectDecorators (if available) to
            // check whether that constructor is correct. Warn if not.
            const newTypeDescriptor = ensureTypeDescriptor(options.constructor);
            typeThunk = () => newTypeDescriptor;
            if (isReflectMetadataSupported && !isSubtypeOf(
                newTypeDescriptor.ctor,
                Reflect.getMetadata('design:type', target, property),
            )) {
                logWarning(
                    `${decoratorName}: detected property type does not match`
                    + ` 'constructor' option.`,
                );
            }
        } else if (typeThunk !== undefined) {
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
        } else if (options.deserializer === undefined) {
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
            deserializer: options.deserializer,
            serializer: options.serializer,
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
to serialize this property.`);
    }

    if (!(typeDescriptor instanceof SetTypeDescriptor) && isConstructorEqual(typeDescriptor, Set)) {
        throw new Error(`${decoratorName}: property is a Set. Use the jsonSetMember decorator to \
serialize this property.`);
    }

    if (!(typeDescriptor instanceof MapTypeDescriptor) && isConstructorEqual(typeDescriptor, Map)) {
        throw new Error(`${decoratorName}: property is a Map. Use the jsonMapMember decorator to \`
serialize this property.`);
    }
}
