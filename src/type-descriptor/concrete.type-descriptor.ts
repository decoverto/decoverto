import {nameof} from '../helpers';
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
            if (typeof source !== 'object') {
                throw new TypeError(`Could not determine how to convert '${path}' from JSON. Type: \
${this.getFriendlyName()}.`);
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
        const {path, source} = context;

        if (typeof source as any !== 'object' || source as any === null) {
            throw new TypeError(
                `Cannot convert ${path} to object: 'sourceObject' must be a defined object.`,
            );
        }

        const sourceObjectMetadata = JsonObjectMetadata.getFromConstructor(this.type);

        if (sourceObjectMetadata?.isExplicitlyMarked === true) {
            const sourceMetadata = sourceObjectMetadata;
            // Strong-typed conversion available, get to it.
            // First convert properties into a temporary object.
            const sourceObjectWithConvertedProperties: Record<string, unknown> = {};

            // Convert by expected properties.
            sourceMetadata.dataMembers.forEach((objMemberMetadata, propKey) => {
                const objMemberValue = source[propKey];
                const objMemberDebugName = `${nameof(sourceMetadata.classType)}.${propKey}`;
                const objMemberOptions = {};

                let revivedValue;
                if (objMemberMetadata.fromJson != null) {
                    revivedValue = objMemberMetadata.fromJson(objMemberValue);
                } else if (objMemberMetadata.type === undefined) {
                    throw new TypeError(`Cannot convert ${objMemberDebugName} to object there is \
no constructor nor fromJson function to use.`);
                } else {
                    revivedValue = objMemberMetadata.type.fromJson({
                        ...context,
                        memberOptions: objMemberOptions,
                        path: objMemberDebugName,
                        source: objMemberValue,
                    });
                }

                if (revivedValue !== undefined) {
                    sourceObjectWithConvertedProperties[objMemberMetadata.key] = revivedValue;
                } else if (objMemberMetadata.isRequired === true) {
                    throw new TypeError(
                        `Missing required member '${objMemberDebugName}'.`,
                    );
                }
            });

            const targetObject = new this.type();

            // Finally, assign converted properties to target object.
            Object.assign(targetObject, sourceObjectWithConvertedProperties);

            // Call afterFromJson method (if any).
            const methodName = sourceObjectMetadata.afterFromJsonMethodName;
            if (methodName != null) {
                if (typeof (targetObject as any)[methodName] === 'function') {
                    // check for member first
                    (targetObject as any)[methodName]();
                } else if (typeof (targetObject.constructor as any)[methodName] === 'function') {
                    // check for static
                    (targetObject.constructor as any)[methodName]();
                } else {
                    throw new TypeError(`afterFromJson callback '${
                        nameof(sourceObjectMetadata.classType)}.${methodName}' is not a method.`);
                }
            }

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
            if (typeof source !== 'object') {
                throw new TypeError(`Could not determine how to convert '${path}' to JSON. Type: \
${this.getFriendlyName()}.`);
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
            const beforeToJsonMethodName = sourceTypeMetadata.beforeToJsonMethodName;
            if (beforeToJsonMethodName != null) {
                const beforeToJsonMethod = source[beforeToJsonMethodName];
                if (typeof beforeToJsonMethod === 'function') {
                    // instance method
                    beforeToJsonMethod.bind(source)();
                } else if (typeof source.constructor[beforeToJsonMethodName] === 'function') {
                    // check for static
                    source.constructor[beforeToJsonMethodName]();
                } else {
                    throw new TypeError(`beforeToJson callback \
'${nameof(sourceTypeMetadata.classType)}.${beforeToJsonMethodName}' is not a method.`);
                }
            }

            const sourceMeta = sourceTypeMetadata;
            // Strong-typed conversion available.
            // We'll convert by members that have been marked with @jsonMember (including
            // array/set/map members), and perform recursive conversion on each of them. The
            // converted objects are put on the 'targetObject', which is what will be put into
            // 'JSON.stringify' finally.
            targetObject = {};

            const classOptions = sourceMeta.options ?? {};

            sourceMeta.dataMembers.forEach((objMemberMetadata) => {
                const objMemberOptions = mergeOptions(classOptions, objMemberMetadata.options);
                let json;
                if (objMemberMetadata.toJson != null) {
                    json = objMemberMetadata.toJson(source[objMemberMetadata.key]);
                } else if (objMemberMetadata.type === undefined) {
                    throw new TypeError(
                        `Could not convert ${objMemberMetadata.name} to JSON, there is`
                        + ` no constructor nor toJson function to use.`,
                    );
                } else {
                    json = objMemberMetadata.type.toJson({
                        ...context,
                        path: `${nameof(sourceMeta.classType)}.${objMemberMetadata.key}`,
                        memberOptions: objMemberOptions,
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
