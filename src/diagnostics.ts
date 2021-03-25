import {InvalidValueErrorInput} from './errors/invalid-value.error';
import {UnknownTypeErrorInput} from './errors/unknown-type.error';
import {Serializable} from './types';

export const Diagnostics = {
    // Setup errors; decorators and such
    jsonPropertyReflectedTypeIsNull(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1000,
            message: `Cannot determine type on @jsonProperty at ${info.typeName}. \
${String(info.property)}. Do you have emitDecoratorMetadata enabled in your tsconfig.json?
Other solutions:
 - Provide the type as an argument of the @jsonProperty decorator. E.g. \
@jsonProperty(() => String)
 - Specify fromJson and toJson on @jsonProperty, e.g. @jsonProperty({fromJson: ..., toJson: ...})`,
        };
    },
    jsonPropertyNoTypeNoConvertersNoReflect(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1001,
            message: `Cannot determine type on @jsonProperty at ${info.typeName}.\
${String(info.property)}. Solutions:
 - Enable reflect-metadata
 - Provide the type as an argument of the @jsonProperty decorator. E.g. \
@jsonProperty(() => String)
 - Specify fromJson and toJson on @jsonProperty, e.g. @jsonProperty({fromJson: ..., toJson: ...})`,
        };
    },
    jsonPropertyReflectedTypeIsObject(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1002,
            message: `Cannot determine type on @jsonProperty at ${info.typeName}.\
${String(info.property)}. Solutions:
 - Pass the type to the @jsonProperty decorator, e.g. @jsonProperty(() => String)
 - If the property has a default value, make sure to explicitly type it. E.g. prop: number = 5
 - Specify fromJson and toJson on @jsonProperty, e.g. @jsonProperty({fromJson: ..., toJson: ...})`,
        };
    },
    jsonPropertyCannotBeUsedOnStaticProperty(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1003,
            message: `@jsonProperty on ${info.typeName}.${String(info.property)} cannot be used on \
a static property.`,
        };
    },
    jsonPropertyCannotBeUsedOnInstanceMethod(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1004,
            message: `@jsonProperty on ${info.typeName}.${String(info.property)} cannot be used on \
an instance method.`,
        };
    },
    jsonPropertyCannotBeUsedOnStaticMethod(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1005,
            message: `@jsonProperty on ${info.typeName}.${String(info.property)} cannot be used on \
a static method.`,
        };
    },

    // Initialization errors, e.g. new Decoverto
    unknownTypeCreatingTypeHandler(info: {type: Serializable<any>}) {
        return {
            code: 2000,
            message: `The type ${info.type.name} cannot be used to create a new type handler. It \
is missing the @jsonObject decorator and is not in the converter map.`,
        };
    },

    // Conversion errors
    invalidValueError(info: InvalidValueErrorInput) {
        return {
            code: 3000,
            message: `Got invalid value${info.path === '' ? '' : ` at ${info.path}`}. Received \
${info.actualType}, expected ${info.expectedType}.`,
        };
    },
    unknownTypeError(info: UnknownTypeErrorInput) {
      return {
          code: 3001,
          message: `Could not determine how to convert unknown type ${info.type} at ${info.path}`,
      };
    },
    missingRequiredProperty(info: {property: string; typeName: string}) {
        return {
            code: 3002,
            message: `Missing required property '${info.property}'.`,
        };
    },
};

export function getDiagnostic<K extends keyof typeof Diagnostics>(
    error: K,
    args: Parameters<typeof Diagnostics[K]>[0],
): string {
    const diagnostic = Diagnostics[error](args as any);

    return `DJ${diagnostic.code}: ${diagnostic.message}`;
}
