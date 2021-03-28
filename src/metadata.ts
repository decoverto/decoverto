import {Converter} from './converters/converter';
import {getDiagnostic} from './diagnostics';
import {ModelOptionsInheritance} from './model.decorator';
import {OptionsBase} from './options-base';
import {Constructor, Serializable} from './types';

export const metadataFieldKey = Symbol('decovertoMetadata');

export interface PropertyMetadataBase {

    /** Name of the property as it appears in the plain form. */
    plainName: string;

    /** Name of the property as it appears in the class. */
    key: string;

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

export type SubtypeMatcher = (plain: Record<string, unknown>) => boolean;

export class ModelMetadata {

    /**
     * Method executed after conversion to plain has taken place.
     */
    afterToPlain?: (result: Record<string, unknown>) => void;

    /** Gets or sets the constructor function for the model. */
    classType: Constructor<any>;

    /**
     * Used by inheritance to check whether a given object should be converted by the type covered
     * by this metadata.
     */
    doesSubtypeMatch?: SubtypeMatcher;

    inheritance?: ModelOptionsInheritance;

    /** Name used to encode polymorphic type */
    name?: string | null;

    options?: OptionsBase | null;

    properties = new Map<string, PropertyMetadata>();

    subtypes: Array<ModelMetadata> = [];

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
     * Checks all subtypes of the metadata recursively and returns the one that matches the given
     * plain object.
     * @param data The object that will be matched.
     */
    getSubTypeMetadata<T>(
        data: Record<string, unknown>,
    ): ModelMetadata {
        const subtype = this.subtypes.find(type => type.doesSubtypeMatch?.(data) === true);

        if (subtype === undefined) {
            return this;
        }

        return subtype.getSubTypeMetadata(data);
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
