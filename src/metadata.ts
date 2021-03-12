import {isJsonStringifyCompatible, isTypeTypedArray, nameof} from './helpers';
import {OptionsBase} from './options-base';
import {TypeDescriptor} from './type-descriptor';
import {IndexedObject, Serializable} from './types';

export const metadataFieldKey = Symbol('decoratedJsonMetadata');

export interface JsonMemberMetadata {
    /** If set, a default value will be emitted for uninitialized members. */
    emitDefaultValue?: boolean | null;

    /** Member name as it appears in JSON. */
    name: string;

    /** Property or field key of the json member. */
    key: string;

    /** Type descriptor of the member. */
    type?: (() => TypeDescriptor) | null;

    /** If set, indicates that the member must be present when converting from JSON. */
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

    dataMembers = new Map<string, JsonMemberMetadata>();

    /** Gets or sets the constructor function for the jsonObject. */
    classType: Function;

    /**
     * Indicates whether this class was explicitly annotated with @jsonObject()
     * or implicitly by @jsonMember()
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

    afterFromJsonMethodName?: string | null;

    beforeToJsonMethodName?: string | null;

    initializerCallback?: ((sourceObject: Object, rawSourceObject: Object) => Object) | null;

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

        // Ignore implicitly added jsonObject (through jsonMember)
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

    static ensurePresentInPrototype(prototype: IndexedObject): JsonObjectMetadata {
        if (Object.prototype.hasOwnProperty.call(prototype, metadataFieldKey)) {
            return prototype[metadataFieldKey as any];
        }
        // Target has no JsonObjectMetadata associated with it yet, create it now.
        const objectMetadata = new JsonObjectMetadata(prototype.constructor);

        // Inherit json members and from parent @jsonObject (if any).
        const parentMetadata: JsonObjectMetadata | undefined = prototype[metadataFieldKey as any];
        if (parentMetadata !== undefined) {
            parentMetadata.dataMembers.forEach((memberMetadata, propKey) => {
                objectMetadata.dataMembers.set(propKey, memberMetadata);
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
    prototype: IndexedObject,
    propKey: string | symbol,
    metadata: JsonMemberMetadata,
) {
    // For error messages
    const decoratorName = `@jsonMember on ${nameof(prototype.constructor)}.${String(propKey)}`;

    // When a property decorator is applied to a static member, 'constructor' is a constructor
    // function.
    // See:
    // eslint-disable-next-line max-len
    // https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Decorators.md#property-decorators
    // ... and static members are not supported here, so abort.
    if (typeof prototype as any === 'function') {
        throw new Error(`${decoratorName}: cannot use a static property.`);
    }

    // Methods cannot be converted JSON.
    // symbol indexing is not supported by ts
    if (typeof prototype[propKey as string] === 'function') {
        throw new Error(`${decoratorName}: cannot use a method property.`);
    }

    // @todo check if metadata is ever undefined, if so, change parameter type
    if (metadata as any == null
        || (metadata.type === undefined && metadata.fromJson === undefined)) {
        throw new Error(`${decoratorName}: JsonMemberMetadata has unknown type.`);
    }

    // Add jsonObject metadata to 'constructor' if not yet exists ('constructor' is the prototype).
    // NOTE: this will not fire up custom conversion, as 'constructor' must be explicitly marked
    // with '@jsonObject' as well.
    const objectMetadata = JsonObjectMetadata.ensurePresentInPrototype(prototype);

    // clear metadata of undefined properties to save memory
    (Object.keys(metadata) as Array<keyof JsonMemberMetadata>)
        .forEach((key) => (metadata[key] === undefined) && delete metadata[key]);
    objectMetadata.dataMembers.set(metadata.name, metadata);
}
