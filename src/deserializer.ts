import {identity, isValueDefined, nameof} from './helpers';
import {JsonObjectMetadata} from './metadata';
import {OptionsBase} from './options-base';
import {
    AnyT,
    ArrayTypeDescriptor,
    ConcreteTypeDescriptor,
    MapShape,
    MapTypeDescriptor,
    SetTypeDescriptor,
    TypeDescriptor,
} from './type-descriptor';
import {Constructor, IndexedObject, Serializable} from './types';

interface DeserializeParams<
    Raw,
    TDescriptor extends TypeDescriptor = TypeDescriptor,
> {
    memberName?: string;
    memberOptions?: OptionsBase;
    sourceObject: Raw;
    typeDescriptor: TDescriptor;
}

interface DeserializeParamsRequired<
    Raw,
    TDescriptor extends TypeDescriptor = TypeDescriptor,
> extends DeserializeParams<Raw, TDescriptor> {
    memberName: string;
}

export type DeserializerFn<Raw, TTypeDescriptor extends TypeDescriptor, T> = (
    params: DeserializeParamsRequired<Raw, TTypeDescriptor>,
) => T;

/**
 * Utility class, converts a simple/untyped javascript object-tree to a typed object-tree.
 * It is used after parsing a JSON-string.
 */
export class Deserializer<RootType> {

    private deserializationStrategy: Map<
        Serializable<any>,
        DeserializerFn<any, TypeDescriptor, any>
    > = new Map([
        // primitives
        [AnyT.ctor, identity],
        [Number, this.deserializeDirectly.bind(this)],
        [String, this.deserializeDirectly.bind(this)],
        [Boolean, this.deserializeDirectly.bind(this)],

        [Date, this.deserializeDate.bind(this)],
        [ArrayBuffer, this.stringToArrayBuffer.bind(this)],
        [DataView, this.stringToDataView.bind(this)],

        [Array, this.convertAsArray.bind(this)],
        [Set, this.convertAsSet.bind(this)],
        [Map, this.convertAsMap.bind(this)],

        // typed arrays
        [Float32Array, this.convertAsFloatArray.bind(this)],
        [Float64Array, this.convertAsFloatArray.bind(this)],
        [Uint8Array, this.convertAsUintArray.bind(this)],
        [Uint8ClampedArray, this.convertAsUintArray.bind(this)],
        [Uint16Array, this.convertAsUintArray.bind(this)],
        [Uint32Array, this.convertAsUintArray.bind(this)],
    ]);

    setDeserializationStrategy(
        type: Serializable<any>,
        deserializer: DeserializerFn<any, TypeDescriptor, any>,
    ) {
        this.deserializationStrategy.set(type, deserializer);
    }

    convertSingleValue(
        {
            sourceObject,
            typeDescriptor,
            memberName = 'object',
            memberOptions,
        }: DeserializeParams<any>,
    ): any {
        if (sourceObject == null) {
            return sourceObject;
        }

        const deserializer = this.deserializationStrategy.get(typeDescriptor.ctor);
        if (deserializer !== undefined) {
            return deserializer({
                memberName,
                memberOptions,
                sourceObject,
                typeDescriptor,
            });
        }

        if (typeof sourceObject === 'object') {
            return this.convertAsObject({
                memberName,
                sourceObject,
                typeDescriptor,
            });
        }

        let error = `Could not deserialize '${memberName}'; don't know how to deserialize type`;

        if (typeDescriptor.hasFriendlyName()) {
            error += ` '${typeDescriptor.ctor.name}'`;
        }

        throw new TypeError(`${error}.`);
    }

    instantiateType(ctor: any) {
        return new ctor();
    }

    throwTypeMismatchError(
        targetType: string,
        expectedSourceType: string,
        actualSourceType: string,
        memberName: string,
    ): never {
        throw new TypeError(
            `Could not deserialize ${memberName} as ${targetType}:`
            + ` expected ${expectedSourceType}, got ${actualSourceType}.`,
        );
    }

    makeTypeErrorMessage(
        expectedType: Function | string,
        actualType: Function | string,
        memberName: string,
    ) {
        const expectedTypeName = typeof expectedType === 'function'
            ? nameof(expectedType)
            : expectedType;
        const actualTypeName = typeof actualType === 'function' ? nameof(actualType) : actualType;

        return `Could not deserialize ${memberName}: expected '${expectedTypeName}',`
            + ` got '${actualTypeName}'.`;
    }

    srcTypeNameForDebug(sourceObject: any) {
        return sourceObject == null ? 'undefined' : nameof(sourceObject.constructor);
    }

    deserializeDirectly<T extends string | number | boolean>(
        {
            memberName,
            sourceObject,
            typeDescriptor,
        }: DeserializeParamsRequired<T>,
    ): T {
        if (sourceObject.constructor !== typeDescriptor.ctor) {
            throw new TypeError(this.makeTypeErrorMessage(
                nameof(typeDescriptor.ctor),
                sourceObject.constructor,
                memberName,
            ));
        }
        return sourceObject;
    }

    convertAsObject<T>(
        {
            memberName,
            sourceObject,
            typeDescriptor,
        }: DeserializeParamsRequired<IndexedObject, ConcreteTypeDescriptor>,
    ): IndexedObject | T | undefined {
        if (typeof sourceObject as any !== 'object' || sourceObject as any === null) {
            throw new TypeError(
                `Cannot deserialize ${memberName}: 'sourceObject' must be a defined object.`,
            );
        }

        const expectedSelfType = typeDescriptor.ctor;
        const sourceObjectMetadata = JsonObjectMetadata.getFromConstructor(expectedSelfType);

        if (sourceObjectMetadata?.isExplicitlyMarked === true) {
            const sourceMetadata = sourceObjectMetadata;
            // Strong-typed deserialization available, get to it.
            // First deserialize properties into a temporary object.
            const sourceObjectWithDeserializedProperties = {} as IndexedObject;

            // Deserialize by expected properties.
            sourceMetadata.dataMembers.forEach((objMemberMetadata, propKey) => {
                const objMemberValue = sourceObject[propKey];
                const objMemberDebugName = `${nameof(sourceMetadata.classType)}.${propKey}`;
                const objMemberOptions = {};

                let revivedValue;
                if (objMemberMetadata.deserializer != null) {
                    revivedValue = objMemberMetadata.deserializer(objMemberValue);
                } else if (objMemberMetadata.type == null) {
                    throw new TypeError(
                        `Cannot deserialize ${objMemberDebugName} there is`
                        + ` no constructor nor deserialization function to use.`,
                    );
                } else {
                    revivedValue = this.convertSingleValue({
                        memberName: objMemberDebugName,
                        memberOptions: objMemberOptions,
                        sourceObject: objMemberValue,
                        typeDescriptor: objMemberMetadata.type(),
                    });
                }

                if (revivedValue !== undefined) {
                    sourceObjectWithDeserializedProperties[objMemberMetadata.key] = revivedValue;
                } else if (objMemberMetadata.isRequired === true) {
                    throw new TypeError(
                        `Missing required member '${objMemberDebugName}'.`,
                    );
                }
            });

            // Next, instantiate target object.
            let targetObject: IndexedObject;

            if (typeof sourceObjectMetadata.initializerCallback === 'function') {
                targetObject = sourceObjectMetadata.initializerCallback(
                    sourceObjectWithDeserializedProperties,
                    sourceObject,
                );

                // Check the validity of user-defined initializer callback.
                if (targetObject as any == null) {
                    throw new TypeError(
                        `Cannot deserialize ${memberName}:`
                        + ` 'initializer' function returned undefined/null`
                        + `, but '${nameof(sourceObjectMetadata.classType)}' was expected.`,
                    );
                } else if (!(targetObject instanceof sourceObjectMetadata.classType)) {
                    throw new TypeError(
                        `Cannot deserialize ${memberName}:`
                        + `'initializer' returned '${nameof(targetObject.constructor)}'`
                        + `, but '${nameof(sourceObjectMetadata.classType)}' was expected`
                        + `, and '${nameof(targetObject.constructor)}' is not a subtype of`
                        + ` '${nameof(sourceObjectMetadata.classType)}'`,
                    );
                }
            } else {
                targetObject = this.instantiateType(expectedSelfType);
            }

            // Finally, assign deserialized properties to target object.
            Object.assign(targetObject, sourceObjectWithDeserializedProperties);

            // Call onDeserialized method (if any).
            const methodName = sourceObjectMetadata.onDeserializedMethodName;
            if (methodName != null) {
                if (typeof (targetObject as any)[methodName] === 'function') {
                    // check for member first
                    (targetObject as any)[methodName]();
                } else if (typeof (targetObject.constructor as any)[methodName] === 'function') {
                    // check for static
                    (targetObject.constructor as any)[methodName]();
                } else {
                    throw new TypeError(`onDeserialized callback '${
nameof(sourceObjectMetadata.classType)}.${methodName}' is not a method.`);
                }
            }

            return targetObject;
        } else {
            // Untyped deserialization into Object instance.
            const targetObject = {} as IndexedObject;

            Object.keys(sourceObject).forEach(sourceKey => {
                targetObject[sourceKey] = this.convertSingleValue({
                    sourceObject: sourceObject[sourceKey],
                    typeDescriptor: new ConcreteTypeDescriptor(sourceObject[sourceKey].constructor),
                    memberName: sourceKey,
                });
            });

            return targetObject;
        }
    }

    convertAsArray(
        {
            memberName,
            memberOptions,
            sourceObject,
            typeDescriptor,
        }: DeserializeParamsRequired<any>,
    ): Array<any> {
        if (!(typeDescriptor instanceof ArrayTypeDescriptor)) {
            throw new TypeError(
                `Could not deserialize ${memberName} as Array: incorrect TypeDescriptor detected,`
                + ' please use proper annotation or function for this type',
            );
        }
        if (!Array.isArray(sourceObject)) {
            throw new TypeError(this.makeTypeErrorMessage(
                Array,
                sourceObject.constructor,
                memberName,
            ));
        }

        if (typeDescriptor.elementType as any == null) {
            throw new TypeError(`Could not deserialize ${memberName} as Array: missing constructor \
reference of Array elements.`);
        }

        return sourceObject.map((element, i) => {
            return this.convertSingleValue(
                {
                    memberName: `${memberName}[${i}]`,
                    memberOptions,
                    sourceObject: element,
                    typeDescriptor: typeDescriptor.elementType,
                },
            );
        });
    }

    convertAsSet(
        {
            memberName,
            memberOptions,
            sourceObject,
            typeDescriptor,
        }: DeserializeParamsRequired<any>,
    ): Set<any> {
        if (!(typeDescriptor instanceof SetTypeDescriptor)) {
            throw new TypeError(
                `Could not deserialize ${memberName} as Set: incorrect TypeDescriptor detected,`
                + ` please use proper annotation or for this type`,
            );
        }
        if (!Array.isArray(sourceObject)) {
            throw new TypeError(this.makeTypeErrorMessage(
                Array,
                sourceObject.constructor,
                memberName,
            ));
        }

        if (typeDescriptor.elementType as any == null) {
            throw new TypeError(`Could not deserialize ${memberName} as Set: missing constructor \
reference of Set elements.`);
        }

        const resultSet = new Set<any>();

        sourceObject.forEach((element, i) => {
            resultSet.add(this.convertSingleValue(
                {
                    memberName: `${memberName}[${i}]`,
                    memberOptions,
                    sourceObject: element,
                    typeDescriptor: typeDescriptor.elementType,
                },
            ));
        });

        return resultSet;
    }

    isExpectedMapShape(source: any, expectedShape: MapShape): boolean {
        return (expectedShape === MapShape.ARRAY && Array.isArray(source))
            || (expectedShape === MapShape.OBJECT && typeof source === 'object');
    }

    convertAsMap(
        {
            memberName,
            memberOptions,
            sourceObject,
            typeDescriptor,
        }: DeserializeParamsRequired<any>,
    ): Map<any, any> {
        if (!(typeDescriptor instanceof MapTypeDescriptor)) {
            throw new TypeError(
                `Could not deserialize ${memberName} as Map: incorrect TypeDescriptor detected,`
                + 'please use proper annotation or for this type',
            );
        }
        const expectedShape = typeDescriptor.getCompleteOptions().shape;
        if (!this.isExpectedMapShape(sourceObject, expectedShape)) {
            const expectedType = expectedShape === MapShape.ARRAY ? Array : Object;
            throw new TypeError(this.makeTypeErrorMessage(
                expectedType,
                sourceObject.constructor,
                memberName,
            ));
        }

        if (typeDescriptor.keyType as any == null) {
            throw new TypeError(
                `Could not deserialize ${memberName} as Map: missing key constructor.`,
            );
        }

        if (typeDescriptor.valueType as any == null) {
            throw new TypeError(
                `Could not deserialize ${memberName} as Map: missing value constructor.`,
            );
        }

        const keyMemberName = `${memberName}[].key`;
        const valueMemberName = `${memberName}[].value`;
        const resultMap = new Map<any, any>();

        if (expectedShape === MapShape.OBJECT) {
            Object.keys(sourceObject).forEach(key => {
                const resultKey = this.convertSingleValue({
                    memberName: keyMemberName,
                    memberOptions,
                    sourceObject: key,
                    typeDescriptor: typeDescriptor.keyType,
                });
                if (isValueDefined(resultKey)) {
                    resultMap.set(
                        resultKey,
                        this.convertSingleValue({
                            memberName: valueMemberName,
                            memberOptions,
                            sourceObject: sourceObject[key],
                            typeDescriptor: typeDescriptor.valueType,
                        }),
                    );
                }
            });
        } else {
            sourceObject.forEach((element: any) => {
                const key = this.convertSingleValue({
                    memberName: keyMemberName,
                    memberOptions,
                    sourceObject: element.key,
                    typeDescriptor: typeDescriptor.keyType,
                });

                // Undefined/null keys not supported, skip if so.
                if (isValueDefined(key)) {
                    resultMap.set(
                        key,
                        this.convertSingleValue({
                            memberName: valueMemberName,
                            memberOptions,
                            sourceObject: element.value,
                            typeDescriptor: typeDescriptor.valueType,
                        }),
                    );
                }
            });
        }

        return resultMap;
    }

    deserializeDate(
        {
            memberName,
            sourceObject,
        }: DeserializeParamsRequired<string | number | Date>,
    ): Date {
        // Support for Date with ISO 8601 format, or with numeric timestamp (milliseconds elapsed
        // since the Epoch).
        // ISO 8601 spec.: https://www.w3.org/TR/NOTE-datetime

        if (typeof sourceObject === 'number') {
            const isInteger = sourceObject % 1 === 0;
            if (!isInteger) {
                throw new TypeError(
                    `Could not deserialize ${memberName} as Date:`
                    + ` expected an integer, got a number with decimal places.`,
                );
            }

            return new Date(sourceObject);
        } else if (typeof sourceObject === 'string') {
            return new Date(sourceObject);
        } else if (sourceObject instanceof Date) {
            return sourceObject;
        } else {
            this.throwTypeMismatchError(
                'Date',
                'an ISO-8601 string',
                this.srcTypeNameForDebug(sourceObject),
                memberName,
            );
        }
    }

    stringToArrayBuffer(
        {
            memberName,
            sourceObject,
        }: DeserializeParamsRequired<string | any>,
    ) {
        if (typeof sourceObject !== 'string') {
            this.throwTypeMismatchError(
                'ArrayBuffer',
                'a string source',
                this.srcTypeNameForDebug(sourceObject),
                memberName,
            );
        }
        return this.createArrayBufferFromString(sourceObject);
    }

    stringToDataView(
        {
            memberName,
            sourceObject,
        }: DeserializeParamsRequired<string | any>,
    ) {
        if (typeof sourceObject !== 'string') {
            this.throwTypeMismatchError(
                'DataView',
                'a string source',
                this.srcTypeNameForDebug(sourceObject),
                memberName,
            );
        }
        return new DataView(this.createArrayBufferFromString(sourceObject));
    }

    createArrayBufferFromString(input: string): ArrayBuffer {
        const buf = new ArrayBuffer(input.length * 2); // 2 bytes for each char
        const bufView = new Uint16Array(buf);

        for (let i = 0, strLen = input.length; i < strLen; i++) {
            bufView[i] = input.charCodeAt(i);
        }

        return buf;
    }

    convertAsFloatArray<T extends Float32Array | Float64Array>(
        {
            memberName,
            typeDescriptor,
            sourceObject,
        }: DeserializeParamsRequired<Array<number>>,
    ): T {
        const constructor = typeDescriptor.ctor as Constructor<T>;
        if (Array.isArray(sourceObject) && sourceObject.every(elem => !isNaN(elem))) {
            return new constructor(sourceObject);
        }
        return this.throwTypeMismatchError(
            constructor.name,
            'a numeric source array',
            this.srcTypeNameForDebug(sourceObject),
            memberName,
        );
    }

    convertAsUintArray<T extends Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array>(
        {
            memberName,
            typeDescriptor,
            sourceObject,
        }: DeserializeParamsRequired<Array<number>>,
    ): T {
        const constructor = typeDescriptor.ctor as Constructor<T>;

        if (Array.isArray(sourceObject) && sourceObject.every(elem => !isNaN(elem))) {
            return new constructor(sourceObject.map(value => Math.trunc(value)));
        }

        return this.throwTypeMismatchError(
            typeDescriptor.ctor.name,
            'a numeric source array',
            this.srcTypeNameForDebug(sourceObject),
            memberName,
        );
    }
}
