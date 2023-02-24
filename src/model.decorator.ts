import {getDiagnostic} from './diagnostics';
import {ModelMetadata} from './metadata';
import {Serializable} from './types';

export interface ModelOptionsInheritanceDiscriminator {
    discriminatorKey: string;
    /**
     * Perform inheritance matching using a discriminator. The discriminator can, but does not have
     * to be, present on the class with `@property`. Example:
     * ```TypeScript
     * @model({
     *     inheritance: {
     *         discriminatorKey: 'type',
     *         strategy: 'discriminator',
     *     }
     * })
     * class Person {
     * }
     *
     * @inherits({discriminator: 'Employee'})
     * @model()
     * class Employee extends Person {
     * }
     * ```
     */
    strategy: 'discriminator';
}

export interface ModelOptionsInheritancePredicate {
    /**
     * Perform inheritance matching using a predicate. Example:
     * ```TypeScript
     * @model({
     *     inheritance: {
     *         strategy: 'predicate',
     *     }
     * })
     * class Person {
     * }
     *
     * @inherits({
     *     matches(data) {
     *         return 'employeeNr' in data;
     *     },
     * })
     * @model()
     * class Employee extends Person {
     *     @property
     *     employeeNr: string;
     * }
     * ```
     */
    strategy: 'predicate';
}

export type ModelOptionsInheritance =
    | ModelOptionsInheritanceDiscriminator
    | ModelOptionsInheritancePredicate;

export interface ModelOptions<T> {
    inheritance?: ModelOptionsInheritance;
}

/**
 * Marks that a class is convertible using Decoverto, with additional settings.
 * @param options Configuration settings.
 */
export function model<T extends Object>(
    options: ModelOptions<T> = {},
): (target: Serializable<T>) => void {
    return target => {
        const objectMetadata = ModelMetadata.installOnPrototype(target.prototype);

        if (options.inheritance !== undefined) {
            assertNoInheritanceStrategyInChain(target);
            objectMetadata.inheritance = options.inheritance;
        }

        switch (options.inheritance?.strategy) {
            case 'discriminator': {
                const discriminatorKey = options.inheritance.discriminatorKey;
                objectMetadata.onNoMatchingSubclass = data => {
                    throw new Error(getDiagnostic('inheritanceNoMatchingDiscriminator', {
                        baseName: target.name,
                        discriminatorKey: discriminatorKey,
                        discriminatorValue: data[discriminatorKey] as string,
                    }));
                };
                break;
            }
            case 'predicate': {
                objectMetadata.onNoMatchingSubclass = data => {
                    throw new Error(getDiagnostic('inheritanceNoMatchingPredicate', {
                        baseName: target.name,
                    }));
                };

                break;
            }
        }
    };
}

/**
 * Error if another @models up the chain defines an inheritance strategy. Only one inheritance
 * strategy is allowed per chain.
 */
function assertNoInheritanceStrategyInChain(target: Serializable<any>): void | never {
    let parent = target;
    let parentMetadata: ModelMetadata | undefined;

    do {
        parent = Object.getPrototypeOf(parent);
        parentMetadata = ModelMetadata.getFromConstructor(parent);

        if (parentMetadata?.inheritance !== undefined) {
            throw new Error(getDiagnostic('inheritanceOnlyOneStrategyAllowed', {
                subclassName: target.name,
                superclassName: parent.name,
            }));
        }
    } while (parentMetadata !== undefined);
}
