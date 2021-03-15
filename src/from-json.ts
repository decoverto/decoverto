import {nameof} from './helpers';
import {JsonObjectMetadata} from './metadata';
import {ConcreteTypeDescriptor} from './type-descriptor/concrete.type-descriptor';
import {ConversionContextWithDescriptor} from './type-descriptor/type-descriptor';

export class FromJson {

    static convertAsObject<T extends Record<string, unknown>>(
        context: ConversionContextWithDescriptor<Record<string, unknown>, ConcreteTypeDescriptor>,
    ): T | Record<string, unknown> {
        const {path, sourceObject, typeDescriptor} = context;

        if (typeof sourceObject as any !== 'object' || sourceObject as any === null) {
            throw new TypeError(
                `Cannot convert ${path} to object: 'sourceObject' must be a defined object.`,
            );
        }

        const expectedSelfType = typeDescriptor.type;
        const sourceObjectMetadata = JsonObjectMetadata.getFromConstructor(expectedSelfType);

        if (sourceObjectMetadata?.isExplicitlyMarked === true) {
            const sourceMetadata = sourceObjectMetadata;
            // Strong-typed conversion available, get to it.
            // First convert properties into a temporary object.
            const sourceObjectWithConvertedProperties: Record<string, unknown> = {};

            // Convert by expected properties.
            sourceMetadata.dataMembers.forEach((objMemberMetadata, propKey) => {
                const objMemberValue = sourceObject[propKey];
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
                        sourceObject: objMemberValue,
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

            const targetObject: T = new expectedSelfType();

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

            Object.keys(sourceObject).forEach(sourceKey => {
                targetObject[sourceKey] = new ConcreteTypeDescriptor(
                    // @todo investigate any
                    (sourceObject[sourceKey] as any).constructor,
                ).fromJson({
                    ...context,
                    sourceObject: sourceObject[sourceKey],
                    path: sourceKey,
                });
            });

            return targetObject;
        }
    }
}
