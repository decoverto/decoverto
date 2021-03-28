import {ModelMetadata} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {Serializable} from './types';

export type InitializerCallback<T> = (sourceObject: T, rawSourceObject: T) => T;

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

export interface ModelOptions<T> extends OptionsBase {
    inheritance?: ModelOptionsInheritance;
}

/**
 * Marks that a class is convertible using Decoverto, with additional settings.
 * @param options Configuration settings.
 */
export function model<T>(
    options: ModelOptions<T> = {},
): (target: Serializable<T>) => void {
    return target => {
        const objectMetadata = ModelMetadata.installOnPrototype(target.prototype);

        objectMetadata.inheritance = options.inheritance;

        const optionsBase = extractOptionBase(options);
        if (optionsBase !== undefined) {
            objectMetadata.options = optionsBase;
        }
    };
}
