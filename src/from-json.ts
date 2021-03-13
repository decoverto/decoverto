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
import {Constructor, Serializable} from './types';

interface FromJsonParams<
    Raw,
    TDescriptor extends TypeDescriptor = TypeDescriptor,
> {
    memberName?: string;
    memberOptions?: OptionsBase;
    sourceObject: Raw;
    typeDescriptor: TDescriptor;
}

interface FromJsonParamsRequired<
    Raw,
    TDescriptor extends TypeDescriptor = TypeDescriptor,
> extends FromJsonParams<Raw, TDescriptor> {
    memberName: string;
}

export type FromJsonFn<Raw, TTypeDescriptor extends TypeDescriptor, T> = (
    params: FromJsonParamsRequired<Raw, TTypeDescriptor>,
) => T;

/**
 * Utility class, converts a simple/untyped javascript object-tree to a typed object-tree.
 * It is used after parsing a JSON-string.
 */
export class FromJson<RootType> {

    private strategy: Map<
        Serializable<any>,
        FromJsonFn<any, TypeDescriptor, any>
    > = new Map([
        // primitives
        [AnyT.ctor, identity],
        [Number, this.convertDirectly.bind(this)],
        [String, this.convertDirectly.bind(this)],
        [Boolean, this.convertDirectly.bind(this)],

        [Date, this.convertDate.bind(this)],
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

    setStrategy(
        type: Serializable<any>,
        fromJson: FromJsonFn<any, TypeDescriptor, any>,
    ) {
        this.strategy.set(type, fromJson);
    }

    convertSingleValue(
        {
            sourceObject,
            typeDescriptor,
            memberName = 'object',
            memberOptions,
        }: FromJsonParams<any>,
    ): any {
        if (sourceObject == null) {
            return sourceObject;
        }

        const fromJson = this.strategy.get(typeDescriptor.ctor);
        if (fromJson !== undefined) {
            return fromJson({
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

        let error = `Could not determine how to convert '${memberName}' to object`;

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
        throw new TypeError(`Conversion to object failed, could not convert ${memberName} as \
${targetType}. Expected ${expectedSourceType}, got ${actualSourceType}.`);
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

        return `Could not convert ${memberName} to object. Expected '${expectedTypeName}', got '${
            actualTypeName}'.`;
    }

    srcTypeNameForDebug(sourceObject: any) {
        return sourceObject == null ? 'undefined' : nameof(sourceObject.constructor);
    }

    convertDirectly<T extends string | number | boolean>(
        {
            memberName,
            sourceObject,
            typeDescriptor,
        }: FromJsonParamsRequired<T>,
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

    convertAsObject<T extends Record<string, unknown>>(
        {
            memberName,
            sourceObject,
            typeDescriptor,
        }: FromJsonParamsRequired<Record<string, unknown>, ConcreteTypeDescriptor>,
    ): T | Record<string, unknown> {
        if (typeof sourceObject as any !== 'object' || sourceObject as any === null) {
            throw new TypeError(
                `Cannot convert ${memberName} to object: 'sourceObject' must be a defined object.`,
            );
        }

        const expectedSelfType = typeDescriptor.ctor;
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
                } else if (objMemberMetadata.type == null) {
                    throw new TypeError(`Cannot convert ${objMemberDebugName} to object there is \
no constructor nor fromJson function to use.`);
                } else {
                    revivedValue = this.convertSingleValue({
                        memberName: objMemberDebugName,
                        memberOptions: objMemberOptions,
                        sourceObject: objMemberValue,
                        typeDescriptor: objMemberMetadata.type(),
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

            const targetObject: T = this.instantiateType(expectedSelfType);

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
                targetObject[sourceKey] = this.convertSingleValue({
                    sourceObject: sourceObject[sourceKey],
                    typeDescriptor: new ConcreteTypeDescriptor(
                        // @todo investigate any
                        (sourceObject[sourceKey] as any).constructor,
                    ),
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
        }: FromJsonParamsRequired<any>,
    ): Array<any> {
        if (!(typeDescriptor instanceof ArrayTypeDescriptor)) {
            throw new TypeError(`Could not convert ${memberName} to object. Attempted to convert \
as an Array but an incorrect TypeDescriptor was detected. Please check the supplied type.`);
        }
        if (!Array.isArray(sourceObject)) {
            throw new TypeError(this.makeTypeErrorMessage(
                Array,
                sourceObject.constructor,
                memberName,
            ));
        }

        if (typeDescriptor.elementType as any == null) {
            throw new TypeError(`Could not convert from JSON. Attempted to convert ${memberName} \
as Array: but missing constructor reference of Array elements.`);
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
        }: FromJsonParamsRequired<any>,
    ): Set<any> {
        if (!(typeDescriptor instanceof SetTypeDescriptor)) {
            throw new TypeError(`Could not convert ${memberName} to object. Attempted to parse as \
Set but an incorrect TypeDescriptor was detected. Please check supplied type.`);
        }
        if (!Array.isArray(sourceObject)) {
            throw new TypeError(this.makeTypeErrorMessage(
                Array,
                sourceObject.constructor,
                memberName,
            ));
        }

        if (typeDescriptor.elementType as any == null) {
            throw new TypeError(`Could not convert ${memberName} to object. Attempted to parse as \
Set but a constructor is missing.`);
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
        return (expectedShape === MapShape.Array && Array.isArray(source))
            || (expectedShape === MapShape.Object && typeof source === 'object');
    }

    convertAsMap(
        {
            memberName,
            memberOptions,
            sourceObject,
            typeDescriptor,
        }: FromJsonParamsRequired<any>,
    ): Map<any, any> {
        if (!(typeDescriptor instanceof MapTypeDescriptor)) {
            throw new TypeError(`Could not convert ${memberName} to object. Attempted to parse as \
Map but an incorrect TypeDescriptor was detected. Please check supplied type.`);
        }
        const expectedShape = typeDescriptor.getCompleteOptions().shape;
        if (!this.isExpectedMapShape(sourceObject, expectedShape)) {
            const expectedType = expectedShape === MapShape.Array ? Array : Object;
            throw new TypeError(this.makeTypeErrorMessage(
                expectedType,
                sourceObject.constructor,
                memberName,
            ));
        }

        if (typeDescriptor.keyType as any == null) {
            throw new TypeError(`Could not convert to object. Attempted to parse ${memberName} as \
Map but the key constructor is missing.`);
        }

        if (typeDescriptor.valueType as any == null) {
            throw new TypeError(`Could not convert to object. Attempted to parse ${memberName} as \
Map but the value constructor is missing.`);
        }

        const keyMemberName = `${memberName}[].key`;
        const valueMemberName = `${memberName}[].value`;
        const resultMap = new Map<any, any>();

        if (expectedShape === MapShape.Object) {
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

    convertDate(
        {
            memberName,
            sourceObject,
        }: FromJsonParamsRequired<string | number | Date>,
    ): Date {
        // Support for Date with ISO 8601 format, or with numeric timestamp (milliseconds elapsed
        // since the Epoch).
        // ISO 8601 spec.: https://www.w3.org/TR/NOTE-datetime

        if (typeof sourceObject === 'number') {
            const isInteger = sourceObject % 1 === 0;
            if (!isInteger) {
                throw new TypeError(`Could not parse ${memberName} as Date. Expected an integer, \
got a number with decimal places.`);
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
        }: FromJsonParamsRequired<string | any>,
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
        }: FromJsonParamsRequired<string | any>,
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
        }: FromJsonParamsRequired<Array<number>>,
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
        }: FromJsonParamsRequired<Array<number>>,
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
