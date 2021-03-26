import {Converter} from './converters/converter';
import {getDiagnostic} from './diagnostics';
import {OptionsBase} from './options-base';
import {Serializable} from './types';

export const metadataFieldKey = Symbol('decovertoMetadata');

export interface PropertyMetadataBase {

    /** Name of the property as it appears in the plain form. */
    plainName: string;

    /** Name of the property as it appears in the class. */
    key: string;

    /** If set, indicates that the property must be present when converting to instance. */
    isRequired?: boolean | null;

    options?: OptionsBase | null;
}

export interface PropertyOnlyConvertersMetadata extends PropertyMetadataBase {

    /**
     * This method will be used to convert the value to instance.
     */
    toInstance: ((data: any) => any);

    /**
     * This method will be used to convert the value to plain.
     */
    toPlain: ((instance: any) => any);
}

export interface PropertyOverridingConvertersMetadata extends PropertyMetadataBase {

    converter: Converter;

    /**
     * When set, this will override the default strategy used to convert values to instance.
     */
    toInstance?: ((data: any) => any) | null;

    /**
     * When set, this will override the default strategy used to convert values to plain.
     */
    toPlain?: ((instance: any) => any) | null;
}

export type PropertyMetadata =
    | PropertyOnlyConvertersMetadata
    | PropertyOverridingConvertersMetadata;

export class ModelMetadata {

    /** Gets or sets the constructor function for the model. */
    classType: Function;

    /**
     * Indicates whether this class was explicitly annotated with @model()
     * or implicitly by @property()
     */
    isExplicitlyMarked: boolean = false;

    /** Name used to encode polymorphic type */
    name?: string | null;

    options?: OptionsBase | null;

    properties = new Map<string, PropertyMetadata>();

    constructor(
        classType: Function,
    ) {
        this.classType = classType;
    }

    /**
     * Gets model metadata information from a class.
     * @param ctor The constructor class.
     */
    static getFromConstructor<T>(ctor: Serializable<T>): ModelMetadata | undefined {
        const prototype = ctor.prototype;
        if (prototype == null) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(prototype, metadataFieldKey)) {
            return prototype[metadataFieldKey as any];
        }
    }

    static ensurePresentInPrototype(prototype: Record<string, any>): ModelMetadata {
        if (Object.prototype.hasOwnProperty.call(prototype, metadataFieldKey)) {
            return prototype[metadataFieldKey as any];
        }
        // Target has no ModelMetadata associated with it yet, create it now.
        const objectMetadata = new ModelMetadata(prototype.constructor);

        // Inherit properties from parent @model (if any).
        const parentMetadata: ModelMetadata | undefined = prototype[metadataFieldKey as any];
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
    metadata: PropertyMetadata,
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
            throw new Error(getDiagnostic('propertyCannotBeUsedOnStaticMethod', {
                property: propKey,
                typeName: prototype.prototype.constructor.name,
            }));
        } else {
            throw new Error(getDiagnostic('propertyCannotBeUsedOnStaticProperty', {
                property: propKey,
                typeName: prototype.prototype.constructor.name,
            }));
        }
    }

    // Methods cannot be converted.
    if (typeof prototype[propKey as string] === 'function') {
        throw new Error(getDiagnostic('propertyCannotBeUsedOnInstanceMethod', {
            property: propKey,
            typeName,
        }));
    }

    // Add model metadata to 'constructor' if not yet exists ('constructor' is the prototype).
    // NOTE: this will not fire up custom conversion, as 'constructor' must be explicitly marked
    // with '@model' as well.
    const objectMetadata = ModelMetadata.ensurePresentInPrototype(prototype);

    objectMetadata.properties.set(metadata.plainName, metadata);
}
