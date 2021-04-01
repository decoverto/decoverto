import {getDiagnostic} from './diagnostics';
import {ModelMetadata, SubtypeMatcher} from './metadata';

export interface InheritsOptionsDiscriminator {
    /**
     * If the discriminator matches this value, this class will be used to create an instance.
     * Requires the `discriminator` strategy on the parent's `@model` which also sets the key on
     * which the discriminator is found.
     */
    discriminator: string;
}

export interface InheritsOptionsPredicate {
    /**
     * Useful in case of inheritance by
     * [structural typing](https://en.wikipedia.org/wiki/Structural_type_system).
     * Return true if the given object is supposed to be transformed into an instance of this class.
     * Requires the `predicate` strategy on the parent's `@model`.
     */
    matches: SubtypeMatcher;
}

export type InheritsOptions =
    | InheritsOptionsDiscriminator
    | InheritsOptionsPredicate;

export function inherits(options: InheritsOptions): ClassDecorator {
    return target => {
        const typeName = target.name;
        let baseClass = Object.getPrototypeOf(target);

        if (baseClass === Function.prototype) {
            throw new Error(getDiagnostic('inheritingModelHasNoBase', {
                typeName,
            }));
        }

        const metadata = ModelMetadata.installOnPrototype(target.prototype);
        let parentMetadata = ModelMetadata.getFromConstructor(baseClass);

        if (parentMetadata === undefined) {
            throw new Error(getDiagnostic('inheritedModelIsNotDecorated', {
                baseName: baseClass.name,
                typeName,
            }));
        }

        while (parentMetadata.inheritance === undefined) {
            // Traverse up the prototype chain and find a decorated class with an inheritance
            // strategy.
            const nextBaseClass = Object.getPrototypeOf(baseClass);
            const nextParentMetadata = ModelMetadata.getFromConstructor(nextBaseClass);

            if (nextParentMetadata === undefined) {
                // Current prototype is not decorated. Stop traversal.
                break;
            }

            baseClass = nextBaseClass;
            parentMetadata = nextParentMetadata;
        }

        let subtypeMatcher: SubtypeMatcher;

        switch (parentMetadata.inheritance?.strategy) {
            case 'discriminator':
                if ('discriminator' in options) {
                    const discriminatorKey = parentMetadata.inheritance.discriminatorKey;
                    metadata.afterToPlain = result => {
                        // Re-add discriminator
                        result[discriminatorKey] = options.discriminator;
                    };
                    subtypeMatcher = object => object[discriminatorKey] === options.discriminator;
                } else {
                    throw new Error(getDiagnostic('inheritanceDiscriminatorStrategyMismatch', {
                        baseName: baseClass.name,
                        typeName,
                    }));
                }
                break;
            case 'predicate':
                if ('matches' in options) {
                    subtypeMatcher = options.matches;
                } else {
                    throw new Error(getDiagnostic('inheritancePredicateStrategyMismatch', {
                        baseName: baseClass.name,
                        typeName,
                    }));
                }
                break;
            default:
                throw new Error(getDiagnostic('inheritedModelDoesNotHaveInheritanceStrategy', {
                    baseName: baseClass.name,
                    typeName,
                }));
        }

        parentMetadata.subtypes.push({
            matches: subtypeMatcher,
            metadata,
        });
    };
}
