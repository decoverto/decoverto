import {ConcreteConverter} from './converters/concrete.converter';
import {
    Converter,
    isTypeLike,
    Typelike,
    TypeThunk,
} from './converters/converter';
import {toConverter} from './converters/converter.utils';
import {getDiagnostic} from './diagnostics';
import {
    isReflectMetadataSupported,
} from './helpers';
import {injectMetadataInformation} from './metadata';
import {Constructor} from './types';

declare abstract class Reflect {
    static getMetadata(metadataKey: string, target: any, targetKey: string | symbol): any;
}

export interface PropertyOptions {

    /** The name of the plain property should it differ from the property on the instance */
    plainName?: string | null;

    /**
     * When set, this method will be used to convert the value **from** plain.
     */
    toInstance?: ((data: any) => any) | null;

    /**
     * When set, this method will be used to convert the value **to** plain.
     */
    toPlain?: ((instance: any) => any) | null;
}

/**
 * Specifies that the property should be included in the conversion, with additional options.
 * Requires ReflectDecorators.
 */
export function property(options: PropertyOptions): PropertyDecorator;

/**
 * Specifies that a property should be included in the conversion, with a defined type and
 * extra options.
 */
export function property(
    type?: TypeThunk | Converter,
    options?: PropertyOptions,
): PropertyDecorator;

export function property<T extends Function>(
    optionsOrType?: PropertyOptions | Typelike<any>,
    options?: PropertyOptions,
): PropertyDecorator {
    return (target, propertyKey) => {
        const typeName = target.constructor.name;
        let converter: Typelike<any> | undefined;

        if (isTypeLike(optionsOrType)) {
            converter = optionsOrType;
        } else {
            options = optionsOrType;
        }

        options = options ?? {};

        if (converter !== undefined) {
            converter = toConverter(converter);
        } else if (options.toInstance != null && options.toPlain != null) {
            // Do nothing
        } else if (isReflectMetadataSupported) {
            const reflectCtor = Reflect.getMetadata(
                'design:type',
                target,
                propertyKey,
            ) as Constructor<any> | null | undefined;

            if (reflectCtor == null) {
                throw new Error(getDiagnostic('propertyReflectedTypeIsNull', {
                    typeName,
                    property: propertyKey,
                }));
            }

            if (reflectCtor === Object) {
                throw new Error(getDiagnostic('propertyReflectedTypeIsObject', {
                    typeName,
                    property: propertyKey,
                }));
            }

            if (reflectCtor === Array) {
                throw new Error(getDiagnostic('propertyReflectedTypeIsArray', {
                    typeName,
                    property: propertyKey,
                }));
            }

            converter = new ConcreteConverter(reflectCtor);
        } else {
            throw new Error(getDiagnostic('propertyNoTypeNoConvertersNoReflect', {
                typeName,
                property: propertyKey,
            }));
        }

        // TypeScript limitation, when the previous if statement has concluded, either `converter`
        // is defined or both overriding converters are.
        const conditionalOptions = converter === undefined
            ? {toInstance: options.toInstance!, toPlain: options.toPlain!}
            : {converter, toInstance: options.toInstance, toPlain: options.toPlain};

        injectMetadataInformation(target, propertyKey, {
            ...conditionalOptions,
            key: propertyKey.toString(),
            plainName: options.plainName ?? propertyKey.toString(),
        });
    };
}
