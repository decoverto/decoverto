import {Converter} from './converters/converter';
import {getDiagnostic} from './diagnostics';
import {OptionsBase} from './options-base';
import {Serializable} from './types';

export const metadataFieldKey = Symbol('decoratedJsonMetadata');

export interface JsonPropertyMetadataBase {

    /** Name of the property as it appears in JSON. */
    jsonName: string;

    /** Name of the property as it appears in the class. */
    key: string;

    /** If set, indicates that the property must be present when converting from JSON. */
    isRequired?: boolean | null;

    options?: OptionsBase | null;
}

export interface JsonPropertyOnlyConvertersMetadata extends JsonPropertyMetadataBase {

    /**
     * This method will be used to convert the value **from** JSON.
     */
    fromJson: ((json: any) => any);

    /**
     * This method will be used to convert the value **to** JSON.
     */
    toJson: ((value: any) => any);
}

export interface JsonPropertyOverridingConvertersMetadata extends JsonPropertyMetadataBase {

    converter: Converter;

    /**
     * When set, this will override the default strategy used to convert values **from** JSON.
     */
    fromJson?: ((json: any) => any) | null;

    /**
     * When set, this will override the default strategy used to convert values **to** JSON.
     */
    toJson?: ((value: any) => any) | null;
}

export type JsonPropertyMetadata =
    | JsonPropertyOnlyConvertersMetadata
    | JsonPropertyOverridingConvertersMetadata;

export class JsonObjectMetadata {

    /** Gets or sets the constructor function for the jsonObject. */
    classType: Function;

    /**
     * Indicates whether this class was explicitly annotated with @jsonObject()
     * or implicitly by @jsonProperty()
     */
    isExplicitlyMarked: boolean = false;

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

        if (Object.prototype.hasOwnProperty.call(prototype, metadataFieldKey)) {
            return prototype[metadataFieldKey as any];
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
}

export function injectMetadataInformation(
    prototype: Record<string, any> | Function,
    propKey: string | symbol,
    metadata: JsonPropertyMetadata,
) {
    // For error messages
    const typeName = prototype.constructor.name;

    // When a property decorator is applied to a static member, 'constructor' is a constructor
    // function.
    // See:
    // eslint-disable-next-line max-len
    // https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Decorators.md#property-decorators
    // ... and static members are not supported here, so abort.
    if (typeof prototype === 'function') {
        if (typeof (prototype as any)[propKey] === 'function') {
            throw new Error(getDiagnostic('jsonPropertyCannotBeUsedOnStaticMethod', {
                property: propKey,
                typeName: prototype.prototype.constructor.name,
            }));
        } else {
            throw new Error(getDiagnostic('jsonPropertyCannotBeUsedOnStaticProperty', {
                property: propKey,
                typeName: prototype.prototype.constructor.name,
            }));
        }
    }

    // Methods cannot be converted JSON.
    if (typeof prototype[propKey as string] === 'function') {
        throw new Error(getDiagnostic('jsonPropertyCannotBeUsedOnInstanceMethod', {
            property: propKey,
            typeName,
        }));
    }

    // Add jsonObject metadata to 'constructor' if not yet exists ('constructor' is the prototype).
    // NOTE: this will not fire up custom conversion, as 'constructor' must be explicitly marked
    // with '@jsonObject' as well.
    const objectMetadata = JsonObjectMetadata.ensurePresentInPrototype(prototype);

    objectMetadata.properties.set(metadata.jsonName, metadata);
}
