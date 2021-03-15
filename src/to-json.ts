import {
    nameof,
} from './helpers';
import {JsonObjectMetadata} from './metadata';
import {mergeOptions} from './options-base';
import {ConcreteTypeDescriptor} from './type-descriptor/concrete.type-descriptor';
import {ConversionContextWithDescriptor} from './type-descriptor/type-descriptor';

/**
 * Utility class, converts a typed object tree (i.e. a tree of class instances, arrays of class
 * instances, and so on) to an untyped javascript object (also called "simple javascript object"),
 * and emits any necessary type hints in the process (for polymorphism).
 *
 * The converted object tree is what will be given to `JSON.stringify` to convert to string as the
 * last step, the process is as follows:
 *
 * (1) typed object-tree -> (2) simple JS object-tree -> (3) JSON-string
 */
export class ToJson {

    /**
     * Performs the conversion of a typed object (usually a class instance) to a simple
     * javascript object.
     */
    static convertAsObject(
        context: ConversionContextWithDescriptor<any, ConcreteTypeDescriptor>,
    ) {
        const {sourceObject, typeDescriptor} = context;
        let sourceTypeMetadata: JsonObjectMetadata | undefined;
        let targetObject: Record<string, unknown>;

        if (sourceObject.constructor !== typeDescriptor.type
            && sourceObject instanceof typeDescriptor.type) {
            // The source object is not of the expected type, but it is a valid subtype.
            // This is OK, and we'll proceed to gather object metadata from the subtype instead.
            sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(sourceObject.constructor);
        } else {
            sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(typeDescriptor.type);
        }

        if (sourceTypeMetadata === undefined) {
            // Untyped conversion, "as-is", we'll just pass the object on.
            // We'll clone the source object, because type hints are added to the object itself, and
            // we don't want to modify the original object.
            targetObject = {...sourceObject};
        } else {
            const beforeToJsonMethodName = sourceTypeMetadata.beforeToJsonMethodName;
            if (beforeToJsonMethodName != null) {
                const beforeToJsonMethod = sourceObject[beforeToJsonMethodName];
                if (typeof beforeToJsonMethod === 'function') {
                    // instance method
                    beforeToJsonMethod.bind(sourceObject)();
                } else if (typeof sourceObject.constructor[beforeToJsonMethodName] === 'function') {
                    // check for static
                    sourceObject.constructor[beforeToJsonMethodName]();
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
                    json = objMemberMetadata.toJson(sourceObject[objMemberMetadata.key]);
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
                        sourceObject: sourceObject[objMemberMetadata.key],
                    });
                }

                if (json !== undefined) {
                    targetObject[objMemberMetadata.name] = json;
                }
            });
        }

        return targetObject;
    }
}
