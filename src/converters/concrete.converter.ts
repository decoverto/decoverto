import {getDiagnostic} from '../diagnostics';
import {UnknownTypeError} from '../errors/unknown-type.error';
import {isObject} from '../helpers';
import {
    ModelMetadata,
    PropertyMetadata,
    PropertyOverridingConvertersMetadata,
} from '../metadata';
import {mergeOptions} from '../options-base';
import {Constructor} from '../types';
import {ConversionContext, Converter} from './converter';
import {SimpleConverter} from './simple.converter';

/**
 * This converter is responsible for traversing objects and converting them and their
 * properties.
 */
export class ConcreteConverter<Class extends Object = any>
    extends SimpleConverter<Class> {

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

    objectToInstance(
        context: ConversionContext<Record<string, unknown>>,
    ): Class | Record<string, unknown> {
        const {source} = context;
        const sourceObjectMetadata = ModelMetadata.getFromConstructor(this.type);

        if (sourceObjectMetadata?.isExplicitlyMarked === true) {
            const sourceMetadata = sourceObjectMetadata;
            // Strong-typed conversion available, get to it.
            // First convert properties into a temporary object.
            const sourceObjectWithConvertedProperties: Record<string, unknown> = {};

            // Convert by expected properties.
            sourceMetadata.properties.forEach((objMemberMetadata, propKey) => {
                const objMemberValue = source[propKey];
                const typeName = sourceMetadata.classType.name;
                const objMemberOptions = {};

                const revivedValue = this.shouldUseType(objMemberMetadata, 'toInstance')
                    ? objMemberMetadata.converter.toInstance({
                        ...context,
                        propertyOptions: objMemberOptions,
                        path: `${typeName}.${propKey}`,
                        source: objMemberValue,
                    })
                    : objMemberMetadata.toInstance(objMemberValue);

                if (revivedValue !== undefined) {
                    sourceObjectWithConvertedProperties[objMemberMetadata.key] = revivedValue;
                } else if (objMemberMetadata.isRequired === true) {
                    throw new TypeError(getDiagnostic('missingRequiredProperty', {
                        property: objMemberMetadata.plainName,
                        typeName,
                    }));
                }
            });

            const targetObject = new this.type();

            // Finally, assign converted properties to target object.
            Object.assign(targetObject, sourceObjectWithConvertedProperties);

            return targetObject;
        } else {
            // @todo investigate whether isExplicitlyMarked is needed at all
            const targetObject: Record<string, unknown> = {};

            Object.keys(source).forEach(sourceKey => {
                targetObject[sourceKey] = new ConcreteConverter(
                    // @todo investigate any
                    (source[sourceKey] as any).constructor,
                ).toInstance({
                    ...context,
                    source: source[sourceKey],
                    path: sourceKey,
                });
            });

            return targetObject;
        }
    }

    toPlain(context: ConversionContext<Class | null | undefined>): any {
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

            return this.objectToPlain({
                ...context,
                source: source,
            }) as any; // Cast to any since generic Plain parameter could be anything
        } else {
            return converter.toPlain(context);
        }
    }

    /**
     * Performs the conversion of a typed object (usually a class instance) to a simple
     * javascript object.
     */
    objectToPlain(context: ConversionContext<any>) {
        const {source} = context;
        let sourceTypeMetadata: ModelMetadata | undefined;
        let targetObject: Record<string, unknown>;

        if (source.constructor !== this.type
            && source instanceof this.type) {
            // The source object is not of the expected type, but it is a valid subtype.
            // This is OK, and we'll proceed to gather object metadata from the subtype instead.
            sourceTypeMetadata = ModelMetadata.getFromConstructor(
                source.constructor as Constructor<Class>,
            );
        } else {
            sourceTypeMetadata = ModelMetadata.getFromConstructor(this.type);
        }

        if (sourceTypeMetadata === undefined) {
            // Untyped conversion, "as-is", we'll just pass the object on.
            // We'll clone the source object, because type hints are added to the object itself, and
            // we don't want to modify the original object.
            targetObject = {...source};
        } else {
            const sourceMeta = sourceTypeMetadata;
            // Strong-typed conversion available.
            // We'll convert all properties that have been marked with @property
            // and perform recursive conversion on each of them. The
            // converted objects are put on the 'targetObject'
            targetObject = {};

            const classOptions = sourceMeta.options ?? {};

            sourceMeta.properties.forEach((objMemberMetadata, propKey) => {
                const objMemberOptions = mergeOptions(classOptions, objMemberMetadata.options);
                const typeName = sourceMeta.classType.name;
                const plain = this.shouldUseType(objMemberMetadata, 'toPlain')
                    ? objMemberMetadata.converter.toPlain({
                        ...context,
                        path: `${typeName}.${propKey}`,
                        propertyOptions: objMemberOptions,
                        source: source[objMemberMetadata.key],
                    })
                    : objMemberMetadata.toPlain(source[objMemberMetadata.key]);

                if (plain !== undefined) {
                    targetObject[objMemberMetadata.plainName] = plain;
                }
            });
        }

        return targetObject;
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
