import {JsonObjectMetadata} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {Serializable} from './types';

export type InitializerCallback<T> = (sourceObject: T, rawSourceObject: T) => T;

export type JsonObjectOptions<T> = OptionsBase;

/**
 * Marks that a class is convertible using Decoverto, with additional settings.
 * @param options Configuration settings.
 */
export function jsonObject<T>(
    options: JsonObjectOptions<T> = {},
): (target: Serializable<T>) => void {
    return target => {
        // Create or obtain JsonObjectMetadata object.
        const objectMetadata = JsonObjectMetadata.ensurePresentInPrototype(target.prototype);

        // Fill JsonObjectMetadata.
        objectMetadata.isExplicitlyMarked = true;

        const optionsBase = extractOptionBase(options);
        if (optionsBase !== undefined) {
            objectMetadata.options = optionsBase;
        }
    };
}
