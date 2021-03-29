import {getDiagnostic} from '../diagnostics';
import {UnknownTypeError} from '../errors/unknown-type.error';
import {isObject} from '../helpers';
import {
    ModelMetadata,
    PropertyMetadata,
    PropertyOverridingConvertersMetadata,
} from '../metadata';
import {Serializable} from '../types';
import {ConversionContext, Converter} from './converter';

/**
 * This converter is responsible for traversing objects and converting them and their
 * properties.
 */
export class ConcreteConverter<Class extends Object = any, Plain = any>
    extends Converter<Class | null | undefined, Plain> {

    constructor(
        readonly type: Serializable<Class>,
    ) {
        super();
    }

    toInstance(context: ConversionContext<any | null | undefined>): Class | null | undefined {
        const {source, path} = context;

        const converter = this.getConverter(context);

        if (converter === undefined) {
            if (source == null) {
                return source;
            }

            if (!isObject(source)) {
                throw new UnknownTypeError({
                    path,
                    type: this.getFriendlyName(),
                });
            }

            return this.objectToInstance({
                ...context,
                source: source,
            }) as unknown as any; // Required since return type might not match Class
        } else {
            return converter.toInstance(context);
        }
    }

    toPlain(context: ConversionContext<Class | null | undefined>): any {
        const {source} = context;
        const converter = this.getConverter(context);

        if (converter === undefined) {
            if (source == null) {
                return source;
            }

            if (!isObject(source)) {
                this.throwTypeMismatchError(context);
            }

            return this.objectToPlain({
                ...context,
                source: source,
            }) as any; // Cast to any since generic Plain parameter could be anything
        } else {
            return converter.toPlain(context);
        }
    }

    getFriendlyName(): string {
        return this.type.name;
    }

    private objectToInstance(
        context: ConversionContext<Record<string, unknown>>,
    ): Class | Record<string, unknown> {
        const {source} = context;
        const modelMetadata = ModelMetadata
            .getFromConstructor(this.type)!
            .getSubTypeMetadata(source);
        const result = new modelMetadata.classType();

        // Convert by expected properties.
        modelMetadata.properties.forEach((propertyMetadata, property) => {
            const propertyValue = source[property];
            const typeName = modelMetadata.classType.name;

            const revivedValue = this.shouldUseType(propertyMetadata, 'toInstance')
                ? propertyMetadata.converter.toInstance({
                    ...context,
                    path: `${typeName}.${property}`,
                    source: propertyValue,
                })
                : propertyMetadata.toInstance(propertyValue);

            if (revivedValue !== undefined) {
                result[propertyMetadata.key] = revivedValue;
            }
        });

        return result;
    }

    /**
     * Performs the conversion of a typed object (usually a class instance) to a simple
     * javascript object.
     */
    private objectToPlain(context: ConversionContext<any>) {
        const {source} = context;

        this.assertInstanceOfType(source, context);

        const modelMetadata = ModelMetadata.getFromConstructor(source.constructor)!;
        const result: Record<string, unknown> = {};

        modelMetadata.properties.forEach((propertyMetadata) => {
            const property = propertyMetadata.key as keyof Class;
            const plain = this.shouldUseType(propertyMetadata, 'toPlain')
                ? propertyMetadata.converter.toPlain({
                    ...context,
                    path: `${modelMetadata.classType.name}.${property}`,
                    source: source[property],
                })
                : propertyMetadata.toPlain(source[property]);

            if (plain !== undefined) {
                result[propertyMetadata.plainName] = plain;
            }
        });

        modelMetadata.afterToPlain?.(result);

        return result;
    }

    private assertInstanceOfType(
        data: Record<string, any>,
        context: ConversionContext<any>,
    ): asserts data is Class {
        if (!(data instanceof this.type)) {
            throw new Error(getDiagnostic('cannotConvertInstanceNotASubtype', {
                actualType: data.constructor.name,
                expectedType: this.type.name,
                path: context.path,
            }));
        }
    }

    private getConverter(context: ConversionContext<any>): Converter | undefined {
        return context.converterMap.get(this.type);
    }

    /**
     * Returns true if the property should be converted using the mapped converter rather than the
     * overriding converters. False otherwise.
     */
    private shouldUseType(
        metadata: PropertyMetadata,
        method: 'toInstance' | 'toPlain',
    ): metadata is PropertyOverridingConvertersMetadata {
        return 'converter' in metadata && metadata[method] == null;
    }
}
