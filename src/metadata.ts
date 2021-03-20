import {getDiagnostic} from './diagnostics';
import {isJsonStringifyCompatible, isTypeTypedArray} from './helpers';
import {OptionsBase} from './options-base';
import {TypeDescriptor} from './type-descriptor/type-descriptor';
import {Serializable} from './types';

export const metadataFieldKey = Symbol('decoratedJsonMetadata');

export interface JsonPropertyMetadata {

    /** Name of the property as it appears in JSON. */
    jsonName: string;

    /** Name of the property as it appears in the class. */
    key: string;

    /** Type descriptor of the property. */
    type?: TypeDescriptor;

    /** If set, indicates that the property must be present when converting from JSON. */
    isRequired?: boolean | null;

    options?: OptionsBase | null;

    /**
     * When set, this method will be used to convert the value **from** JSON.
     */
    fromJson?: ((json: any) => any) | null;

    /**
     * When set, this method will be used to convert the value **to** JSON.
     */
    toJson?: ((value: any) => any) | null;
}

export class JsonObjectMetadata {

    /** Gets or sets the constructor function for the jsonObject. */
    classType: Function;

    /**
     * Indicates whether this class was explicitly annotated with @jsonObject()
     * or implicitly by @jsonProperty()
     */
    isExplicitlyMarked: boolean = false;

    /**
     * Indicates whether this type is handled without annotation. This is usually
     * used for the builtin types (except for Maps, Sets, and normal Arrays).
     */
    isHandledWithoutAnnotation: boolean = false;

    /** Name used to encode polymorphic type */
    name?: string | null;

    options?: OptionsBase | null;

    properties = new Map<string, JsonPropertyMetadata>();

    constructor(
        classType: Function,
    ) {
        this.classType = classType;
    }

    /**
     * Gets jsonObject metadata information from a class.
     * @param ctor The constructor class.
     */
    static getFromConstructor<T>(ctor: Serializable<T>): JsonObjectMetadata | undefined {
        const prototype = ctor.prototype;
        if (prototype == null) {
            return;
        }

        let metadata: JsonObjectMetadata | undefined;
        if (Object.prototype.hasOwnProperty.call(prototype, metadataFieldKey)) {
            // The class prototype contains own jsonObject metadata
            metadata = prototype[metadataFieldKey as any];
        }

        // Ignore implicitly added jsonObject (through jsonProperty)
        if (metadata?.isExplicitlyMarked === true) {
            return metadata;
        }

        // In the end maybe it is something which we can handle directly
        if (JsonObjectMetadata.doesHandleWithoutAnnotation(ctor)) {
            const primitiveMeta = new JsonObjectMetadata(ctor);
            primitiveMeta.isExplicitlyMarked = true;
            // we do not store the metadata here to not modify builtin prototype
            return primitiveMeta;
        }
    }

    static ensurePresentInPrototype(prototype: Record<string, any>): JsonObjectMetadata {
        if (Object.prototype.hasOwnProperty.call(prototype, metadataFieldKey)) {
            return prototype[metadataFieldKey as any];
        }
        // Target has no JsonObjectMetadata associated with it yet, create it now.
        const objectMetadata = new JsonObjectMetadata(prototype.constructor);

        // Inherit json properties from parent @jsonObject (if any).
        const parentMetadata: JsonObjectMetadata | undefined = prototype[metadataFieldKey as any];
        if (parentMetadata !== undefined) {
            parentMetadata.properties.forEach((propertyMetadata, propKey) => {
                objectMetadata.properties.set(propKey, propertyMetadata);
            });
        }

        Object.defineProperty(prototype, metadataFieldKey, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: objectMetadata,
        });
        return objectMetadata;
    }

    private static doesHandleWithoutAnnotation(ctor: Function): boolean {
        return isJsonStringifyCompatible(ctor) || isTypeTypedArray(ctor)
            || ctor === DataView || ctor === ArrayBuffer;
    }
}

export function injectMetadataInformation(
    prototype: Record<string, any> | Function,
    propKey: string | symbol,
    metadata: JsonPropertyMetadata,
) {
    // For error messages
    const typeName = prototype.constructor.name;

    // When a property decorator is applied to a static property, 'constructor' is a constructor
    // function.
    // See:
    // eslint-disable-next-line max-len
    // https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Decorators.md#property-decorators
    // ... and static properties are not supported here, so abort.
    if (typeof prototype === 'function') {
        throw new Error(getDiagnostic('jsonPropertyCannotBeUsedOnStaticProperty', {
            property: propKey,
            typeName,
        }));
    }

    // Methods cannot be converted JSON.
    // symbol indexing is not supported by ts
    if (typeof prototype[propKey as string] === 'function') {
        throw new Error(getDiagnostic('jsonPropertyCannotBeUsedOnInstanceMethod', {
            property: propKey,
            typeName,
        }));
    }

    if (metadata.type === undefined && metadata.fromJson === undefined) {
        throw new Error(getDiagnostic('jsonPropertyNoTypeOrCustomConverters', {
            property: propKey,
            typeName,
        }));
    }

    // Add jsonObject metadata to 'constructor' if not yet exists ('constructor' is the prototype).
    // NOTE: this will not fire up custom conversion, as 'constructor' must be explicitly marked
    // with '@jsonObject' as well.
    const objectMetadata = JsonObjectMetadata.ensurePresentInPrototype(prototype);

    // clear metadata of undefined properties to save memory
    (Object.keys(metadata) as Array<keyof JsonPropertyMetadata>)
        .forEach((key) => (metadata[key] === undefined) && delete metadata[key]);
    objectMetadata.properties.set(metadata.jsonName, metadata);
}
