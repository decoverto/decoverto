import {JsonObjectMetadata} from './metadata';
import {extractOptionBase, OptionsBase} from './options-base';
import {Serializable} from './types';

export type InitializerCallback<T> = (sourceObject: T, rawSourceObject: T) => T;

export interface IJsonObjectOptionsBase extends OptionsBase {

    /**
     * The name of a static or instance method to call when deserialization
     * of the object is completed.
     */
    onDeserialized?: string | null;

    /**
     * The name of a static or instance method to call before the serialization
     * of the typed object is started.
     */
    beforeSerialization?: string | null;

    /**
     * The name used to differentiate between different polymorphic types.
     */
    name?: string | null;
}

export interface IJsonObjectOptions<T> extends IJsonObjectOptionsBase {
    /**
     * Function to call before deserializing and initializing the object, accepting two arguments:
     *   (1) sourceObject, an 'Object' instance with all properties already deserialized, and
     *   (2) rawSourceObject, a raw 'Object' instance representation of the current object in
     *       the serialized JSON (i.e. without deserialized properties).
     */
    initializer?: InitializerCallback<T> | null;
}

/**
 * Marks that a class is serializable using DecoratedJson, with additional settings.
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
        objectMetadata.onDeserializedMethodName = options.onDeserialized;
        objectMetadata.beforeSerializationMethodName = options.beforeSerialization;

        // T extend Object so it is fine
        objectMetadata.initializerCallback = options.initializer as any;
        if (options.name != null) {
            objectMetadata.name = options.name;
        }
        const optionsBase = extractOptionBase(options);
        if (optionsBase !== undefined) {
            objectMetadata.options = optionsBase;
        }
    };
}
