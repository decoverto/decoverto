import {InvalidValueErrorInput} from './errors/invalid-value.error';
import {UnknownTypeErrorInput} from './errors/unknown-type.error';
import {Serializable} from './types';

export const Diagnostics = {
    // Setup errors; decorators and such
    propertyReflectedTypeIsNull(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1000,
            message: `Cannot determine type on @property at ${info.typeName}.\
${String(info.property)}. Do you have emitDecoratorMetadata enabled in your tsconfig.json?
Other solutions:
 - Provide the type as an argument of the @property decorator. E.g. \
@property(() => String)
 - Specify toInstance and toPlain on @property, e.g. @property({toInstance: ..., toPlain: ...})`,
        };
    },
    propertyNoTypeNoConvertersNoReflect(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1001,
            message: `Cannot determine type on @property at ${info.typeName}.\
${String(info.property)}. Solutions:
 - Enable reflect-metadata
 - Provide the type as an argument of the @property decorator. E.g. \
@property(() => String)
 - Specify toInstance and toPlain on @property, e.g. @property({toInstance: ..., toPlain: ...})`,
        };
    },
    propertyReflectedTypeIsObject(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1002,
            message: `Cannot determine type on @property at ${info.typeName}.\
${String(info.property)}. Solutions:
 - Pass the type to the @property decorator, e.g. @property(() => String)
 - If the property has a default value, make sure to explicitly type it. E.g. prop: number = 5
 - Specify toInstance and toPlain on @property, e.g. @property({toInstance: ..., toPlain: ...})`,
        };
    },
    propertyCannotBeUsedOnStaticProperty(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1003,
            message: `@property on ${info.typeName}.${String(info.property)} cannot be used on \
a static property.`,
        };
    },
    propertyCannotBeUsedOnInstanceMethod(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1004,
            message: `@property on ${info.typeName}.${String(info.property)} cannot be used on \
an instance method.`,
        };
    },
    propertyCannotBeUsedOnStaticMethod(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1005,
            message: `@property on ${info.typeName}.${String(info.property)} cannot be used on \
a static method.`,
        };
    },
    inheritingModelHasNoBase(info: {typeName: string}) {
        return {
            code: 1006,
            message: `${info.typeName} is decorated with @inherits but does not extend a class.`,
        };
    },
    inheritedModelIsNotDecorated(info: {baseName: string; typeName: string}) {
        return {
            code: 1007,
            message: `${info.typeName} is decorated with @inherits and extends \
'${info.baseName}' but '${info.baseName}' is missing the @model decorator.`,
        };
    },
    inheritedModelDoesNotHaveInheritanceStrategy(info: {baseName: string; typeName: string}) {
        return {
            code: 1008,
            message: `${info.typeName} is decorated with @inherits and extends \
'${info.baseName}' but '${info.baseName}' does not have an inheritance strategy. Specify one using \
@model({inheritance: ...}).`,
        };
    },
    inheritanceDiscriminatorStrategyMismatch(info: {baseName: string; typeName: string}) {
        return {
            code: 1009,
            message: `${info.typeName} is decorated with @inherits and extends \
'${info.baseName}' but '${info.baseName}' declares the 'discriminator' strategy and no \
discriminator value was specified on @inherits.`,
        };
    },
    inheritancePredicateStrategyMismatch(info: {baseName: string; typeName: string}) {
        return {
            code: 1010,
            message: `${info.typeName} is decorated with @inherits and extends \
'${info.baseName}' but '${info.baseName}' declares the 'predicate' strategy and no 'matches' \
function was specified on @inherits.`,
        };
    },
    inheritanceOnlyOneStrategyAllowed(info: {
        subclassName: string;
        superclassName: string;
    }) {
        return {
            code: 1011,
            message: `${info.subclassName} extends ${info.superclassName} but both declare an \
inheritance strategy. A inheritance strategy can only set on one model in the chain.`,
        };
    },
    propertyReflectedTypeIsArray(info: {property: string | symbol; typeName: string}) {
        return {
            code: 1012,
            message: `Cannot determine type on @property at ${info.typeName}.\
${String(info.property)}. Solutions:
 - It looks like you're trying to define an array. Define one using @property(array(() => String))
 - Specify toInstance and toPlain on @property, e.g. @property({toInstance: ..., toPlain: ...})`,
        };
    },

    // Initialization errors, e.g. new Decoverto
    unknownTypeCreatingTypeHandler(info: {type: Serializable<any>}) {
        return {
            code: 2000,
            message: `The type ${info.type.name} cannot be used to create a new type handler. It \
is missing the @model decorator and is not in the converter map.`,
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
          message: `Could not determine how to convert type ${info.type} at ${info.path}. \
Solutions:
 - Add the @model decorator to ${info.type}
 - Create a converter for ${info.type} and add it to the converter map. E.g. decoverto.converterMap\
.set(${info.type}, new ${info.type}Converter());
 - Override the conversion for ${info.path} by using toInstance and toPlain. \
e.g. @property({toInstance: ..., toPlain: ...})`,
      };
    },
    cannotConvertInstanceNotASubclass(info: {
        actualType: string;
        expectedType: string;
        path: string;
    }) {
        return {
            code: 3003,
            message: `Could not convert instance${info.path === '' ? '' : ` at ${info.path}`}. \
Object of type '${info.actualType}' is not an instance, or subclass, of ${info.expectedType}'.`,
        };
    },
    inheritanceNoMatchingDiscriminator(info: {
        baseName: string;
        discriminatorKey: string;
        discriminatorValue: string;
    }) {
        return {
            code: 3004,
            message: `No type extending '${info.baseName}' matches the discriminator with key '${
                info.discriminatorKey}' and value '${info.discriminatorValue}'.`,
        };
    },
    inheritanceNoMatchingPredicate(info: {
        baseName: string;
    }) {
        return {
            code: 3005,
            message: `No type extending '${info.baseName}' found using predicate strategy.`,
        };
    },
};

export function getDiagnostic<K extends keyof typeof Diagnostics>(
    error: K,
    args: Parameters<typeof Diagnostics[K]>[0],
): string {
    const diagnostic = Diagnostics[error](args as any);

    return `DV${diagnostic.code}: ${diagnostic.message}`;
}
