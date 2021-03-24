import {ModelMetadata} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {Serializable} from './types';

export type InitializerCallback<T> = (sourceObject: T, rawSourceObject: T) => T;

export type ModelOptions<T> = OptionsBase;

/**
 * Marks that a class is convertible using Decoverto, with additional settings.
 * @param options Configuration settings.
 */
export function model<T>(
    options: ModelOptions<T> = {},
): (target: Serializable<T>) => void {
    return target => {
        const objectMetadata = ModelMetadata.installOnPrototype(target.prototype);

        const optionsBase = extractOptionBase(options);
        if (optionsBase !== undefined) {
            objectMetadata.options = optionsBase;
        }
    };
}
