import {InvalidValueErrorInput} from './errors/invalid-value.error';
import {UnknownTypeErrorInput} from './errors/unknown-type.error';

export const Diagnostics = {
    jsonPropertyReflectedTypeIsNull(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1000,
            message: `@jsonProperty on ${info.typeName}.${String(info.property)}: cannot resolve \
detected property constructor at runtime.`,
        };
    },
    jsonPropertyNoTypeOrCustomConverters(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1001,
            message: `@jsonProperty on ${info.typeName}.${String(info.property)} has unknown type`,
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
          message: `Could not determine how to convert unknown type ${info.type} at ${
              info.path}`,
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
