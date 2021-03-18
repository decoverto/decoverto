import {getDiagnostic} from '../diagnostics';
import {UnknownTypeError} from '../errors/unknown-type.error';
import {isObject, nameof} from '../helpers';
import {JsonObjectMetadata} from '../metadata';
import {mergeOptions} from '../options-base';
import {Constructor} from '../types';
import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext, TypeDescriptor} from './type-descriptor';

/**
 * A concrete type descriptor converts instances of user defined classes.
 */
export class ConcreteTypeDescriptor<Class extends Object = any>
    extends SimpleTypeDescriptor<Class> {

    fromJson(context: ConversionContext<any | null | undefined>): Class | null | undefined {
        const {source, path} = context;

        if (source === null) {
            return null;
        } else if (source === undefined) {
            return undefined;
        }

        const converter = this.getConverter(context);

        if (converter === undefined) {
            if (!isObject(source)) {
                throw new UnknownTypeError({
                    path,
                    type: this.getFriendlyName(),
                });
            }

            return this.fromJsonObject({
                ...context,
                source: source,
            }) as unknown as any; // Required since return type might not match Class
        } else {
            return converter.fromJson(context);
        }
    }

    fromJsonObject(
        context: ConversionContext<Record<string, unknown>>,
    ): Class | Record<string, unknown> {
        const {source} = context;
        const sourceObjectMetadata = JsonObjectMetadata.getFromConstructor(this.type);

        if (sourceObjectMetadata?.isExplicitlyMarked === true) {
            const sourceMetadata = sourceObjectMetadata;
            // Strong-typed conversion available, get to it.
            // First convert properties into a temporary object.
            const sourceObjectWithConvertedProperties: Record<string, unknown> = {};

            // Convert by expected properties.
            sourceMetadata.properties.forEach((objMemberMetadata, propKey) => {
                const objMemberValue = source[propKey];
                const typeName = nameof(sourceMetadata.classType);
                const objMemberOptions = {};

                let revivedValue;
                if (objMemberMetadata.fromJson != null) {
                    revivedValue = objMemberMetadata.fromJson(objMemberValue);
                } else if (objMemberMetadata.type === undefined) {
                    throw new TypeError(getDiagnostic('noStrategyToConvertJsonPropertyFromJson', {
                        property: objMemberMetadata.name,
                        typeName,
                    }));
                } else {
                    revivedValue = objMemberMetadata.type.fromJson({
                        ...context,
                        propertyOptions: objMemberOptions,
                        path: `${typeName}.${propKey}`,
                        source: objMemberValue,
                    });
                }

                if (revivedValue !== undefined) {
                    sourceObjectWithConvertedProperties[objMemberMetadata.key] = revivedValue;
                } else if (objMemberMetadata.isRequired === true) {
                    throw new TypeError(getDiagnostic('missingRequiredProperty', {
                        property: objMemberMetadata.name,
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
                targetObject[sourceKey] = new ConcreteTypeDescriptor(
                    // @todo investigate any
                    (source[sourceKey] as any).constructor,
                ).fromJson({
                    ...context,
                    source: source[sourceKey],
                    path: sourceKey,
                });
            });

            return targetObject;
        }
    }

    toJson(context: ConversionContext<Class | null | undefined>): any {
        const {source, path} = context;

        if (source === null) {
            return null;
        } else if (source === undefined) {
            return undefined;
        }

        const converter = this.getConverter(context);

        if (converter === undefined) {
            if (!isObject(source)) {
                throw new UnknownTypeError({
                    path,
                    type: this.getFriendlyName(),
                });
            }

            return this.toJsonObject({
                ...context,
                source: source,
            }) as any; // Cast to any since generic Json parameter could be anything
        } else {
            return converter.toJson(context);
        }
    }

    /**
     * Performs the conversion of a typed object (usually a class instance) to a simple
     * javascript object.
     */
    toJsonObject(context: ConversionContext<any>) {
        const {source} = context;
        let sourceTypeMetadata: JsonObjectMetadata | undefined;
        let targetObject: Record<string, unknown>;

        if (source.constructor !== this.type
            && source instanceof this.type) {
            // The source object is not of the expected type, but it is a valid subtype.
            // This is OK, and we'll proceed to gather object metadata from the subtype instead.
            sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(
                source.constructor as Constructor<Class>,
            );
        } else {
            sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(this.type);
        }

        if (sourceTypeMetadata === undefined) {
            // Untyped conversion, "as-is", we'll just pass the object on.
            // We'll clone the source object, because type hints are added to the object itself, and
            // we don't want to modify the original object.
            targetObject = {...source};
        } else {
            const sourceMeta = sourceTypeMetadata;
            // Strong-typed conversion available.
            // We'll convert all properties that have been marked with @jsonProperty
            // and perform recursive conversion on each of them. The
            // converted objects are put on the 'targetObject', which is what will be put into
            // 'JSON.stringify' finally.
            targetObject = {};

            const classOptions = sourceMeta.options ?? {};

            sourceMeta.properties.forEach((objMemberMetadata, propKey) => {
                const objMemberOptions = mergeOptions(classOptions, objMemberMetadata.options);
                const typeName = nameof(sourceMeta.classType);
                let json;
                if (objMemberMetadata.toJson != null) {
                    json = objMemberMetadata.toJson(source[objMemberMetadata.key]);
                } else if (objMemberMetadata.type === undefined) {
                    throw new TypeError(getDiagnostic('noStrategyToConvertJsonPropertyToJson', {
                        property: objMemberMetadata.name,
                        typeName,
                    }));
                } else {
                    json = objMemberMetadata.type.toJson({
                        ...context,
                        path: `${typeName}.${propKey}`,
                        propertyOptions: objMemberOptions,
                        source: source[objMemberMetadata.key],
                    });
                }

                if (json !== undefined) {
                    targetObject[objMemberMetadata.name] = json;
                }
            });
        }

        return targetObject;
    }

    private getConverter(context: ConversionContext<any>): TypeDescriptor | undefined {
        return context.typeMap.get(this.type);
    }
}
