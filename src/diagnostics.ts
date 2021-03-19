import {InvalidValueErrorInput} from './errors/invalid-value.error';
import {UnknownTypeErrorInput} from './errors/unknown-type.error';

export const Diagnostics = {
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
    jsonPropertyNoTypeOrCustomConverters(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1001,
            message: `@jsonProperty on ${info.typeName}.${String(info.property)} has an unknown \
type.`,
        };
    },
    jsonPropertyCannotBeUsedOnStaticProperty(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1002,
            message: `@jsonProperty on ${info.typeName}.${String(info.property)} cannot be used on \
a static property.`,
        };
    },
    jsonPropertyCannotBeUsedOnInstanceMethod(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1003,
            message: `@jsonProperty on ${info.typeName}.${String(info.property)} cannot be used on \
an instance method.`,
        };
    },
    noStrategyToConvertJsonPropertyFromJson(info: {property: string; typeName: string}) {
        return {
            code: 1004,
            message: `Could not convert '${info.typeName}.${info.property}' with unknown type to
object. Define a type or the fromJson function.`,
        };
    },
    noStrategyToConvertJsonPropertyToJson(info: {property: string; typeName: string}) {
        return {
            code: 1004,
            message: `Could not convert '${info.typeName}.${info.property}' with unknown type to
JSON. Define a type or the toJson function.`,
        };
    },
    missingRequiredProperty(info: {property: string; typeName: string}) {
        return {
            code: 1006,
            message: `Missing required property '${info.property}'.`,
        };
    },
    missingJsonObjectDecorator(info: {typeName: string}) {
        return {
            code: 1007,
            message: `The type ${info.typeName} is missing the @jsonObject decorator.`,
        };
    },
    jsonPropertyReflectedTypeIsObject(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1008,
            message: `Cannot determine type on @jsonProperty at ${info.typeName}.\
${String(info.property)}. Solutions:
 - Pass the type to the @jsonProperty decorator, e.g. @jsonProperty(() => String)
 - If the property has a default value, make sure to explicitly type it. E.g. prop: number = 5
 - Specify fromJson and toJson on @jsonProperty, e.g. @jsonProperty({fromJson: ..., toJson: ...})`,
        };
    },
    jsonPropertyNoTypeNoConvertersNoReflect(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1009,
            message: `Cannot determine type on @jsonProperty at ${info.typeName}.\
${String(info.property)}. Solutions:
 - Enable reflect-metadata
 - Provide the type as an argument of the @jsonProperty decorator. E.g. \
@jsonProperty(() => String)
 - Specify fromJson and toJson on @jsonProperty, e.g. @jsonProperty({fromJson: ..., toJson: ...})`,
        };
    },

    invalidValueError(info: InvalidValueErrorInput) {
        return {
            code: 2000,
            message: `Got invalid value${info.path === '' ? '' : ` at ${info.path}`}. Received \
${info.actualType}, expected ${info.expectedType}.`,
        };
    },
    unknownTypeError(info: UnknownTypeErrorInput) {
      return {
          code: 2001,
          message: `Could not determine how to convert unknown type ${info.type} at ${info.path}`,
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
