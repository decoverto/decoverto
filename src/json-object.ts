import {JsonObjectMetadata} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {Serializable} from './types';

export type InitializerCallback<T> = (sourceObject: T, rawSourceObject: T) => T;

export type IJsonObjectOptions<T> = OptionsBase;

/**
 * Marks that a class is convertible using DecoratedJson, with additional settings.
 * @param options Configuration settings.
 */
export function jsonObject<T>(
    options: IJsonObjectOptions<T> = {},
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
