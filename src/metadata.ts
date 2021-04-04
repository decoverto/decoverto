import {Converter} from './converters/converter';
import {getDiagnostic} from './diagnostics';
import {ModelOptionsInheritance} from './model.decorator';
import {Constructor, Serializable} from './types';

export const metadataFieldKey = Symbol('decovertoMetadata');

export interface PropertyMetadataBase {

    /** Name of the property as it appears in the plain form. */
    plainName: string;

    /** Name of the property as it appears in the class. */
    key: string;
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

    /**
     * This converter will perform the conversion unless overwritten by `toInstance` or `toPlain`.
     */
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

export type SubclassMatcher = (plain: Record<string, unknown>) => boolean;

export class ModelMetadata {

    /**
     * Method executed after conversion to plain has taken place.
     */
    afterToPlain?: (result: Record<string, unknown>) => void;

    /** Gets or sets the constructor function for the model. */
    classType: Constructor<any>;

    inheritance?: ModelOptionsInheritance;

    /** Name used to encode polymorphic type */
    name?: string | null;

    /**
     * This function is called if the model has subclasses yet none match.
     */
    onNoMatchingSubclass?: (data: Record<string, unknown>) => ModelMetadata | never;

    properties = new Map<string, PropertyMetadata>();

    subclasses: Array<{
        matches: SubclassMatcher;
        metadata: ModelMetadata;
    }> = [];

    constructor(
        classType: Constructor<any>,
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

    static installOnPrototype(prototype: Record<string, any>): ModelMetadata {
        if (Object.prototype.hasOwnProperty.call(prototype, metadataFieldKey)) {
            return prototype[metadataFieldKey as any];
        }

        const objectMetadata = new ModelMetadata(prototype.constructor as Constructor<any>);

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

    /**
     * Returns the appropriate metadata for the given plain object.
     * @param data The object that will be matched.
     */
    getSubclassMetadata<T>(
        data: Record<string, unknown>,
    ): ModelMetadata {
        const subclass = this.subclasses.find(type => type.matches(data));

        if (subclass === undefined) {
            if (this.onNoMatchingSubclass === undefined) {
                return this;
            } else {
                return this.onNoMatchingSubclass(data);
            }
        }

        return subclass.metadata;
    }
}

export function injectMetadataInformation(
    prototype: Record<string, any> | Function,
    propKey: string | symbol,
    metadata: PropertyMetadata,
) {
    const typeName = prototype.constructor.name;

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

    if (typeof prototype[propKey as string] === 'function') {
        throw new Error(getDiagnostic('propertyCannotBeUsedOnInstanceMethod', {
            property: propKey,
            typeName,
        }));
    }

    const objectMetadata = ModelMetadata.installOnPrototype(prototype);

    objectMetadata.properties.set(metadata.plainName, metadata);
}
