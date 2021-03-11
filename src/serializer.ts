import {
    identity,
    isInstanceOf,
    isValueDefined,
    nameof,
} from './helpers';
import {JsonObjectMetadata} from './metadata';
import {mergeOptions, OptionsBase} from './options-base';
import {
    AnyT,
    ArrayTypeDescriptor,
    ConcreteTypeDescriptor,
    MapShape,
    MapTypeDescriptor,
    SetTypeDescriptor,
    TypeDescriptor,
} from './type-descriptor';
import {IndexedObject, Serializable} from './types';

interface SerializeParamsBase<
    Raw,
    TDescriptor extends TypeDescriptor = TypeDescriptor,
    > {
    /**
     * The original object that should be serialized.
     */
    sourceObject: Raw;
}

interface SerializeParams<
    Raw,
    TDescriptor extends TypeDescriptor = TypeDescriptor,
> extends SerializeParamsBase<Raw, TDescriptor> {
    /**
     * Name of the object being serialized, used for debugging purposes.
     */
    memberName?: string;
    memberOptions?: OptionsBase;
    /**
     * Instance of TypeDescriptor containing information about expected
     * serialization.
     */
    typeDescriptor: TDescriptor;
}

export type SerializerFn<Raw, TTypeDescriptor extends TypeDescriptor = TypeDescriptor> = (
    params: SerializeParams<Raw, TTypeDescriptor>,
) => any;

/**
 * Utility class, converts a typed object tree (i.e. a tree of class instances, arrays of class
 * instances, and so on) to an untyped javascript object (also called "simple javascript object"),
 * and emits any necessary type hints in the process (for polymorphism).
 *
 * The converted object tree is what will be given to `JSON.stringify` to convert to string as the
 * last step, the serialization is basically like:
 *
 * (1) typed object-tree -> (2) simple JS object-tree -> (3) JSON-string
 */
export class Serializer {
    private serializationStrategy = new Map<
        Serializable<any>,
        SerializerFn<any>
    >([
        // primitives
        [AnyT.ctor, identity],
        [Date, identity],
        [Number, identity],
        [String, identity],
        [Boolean, identity],

        [ArrayBuffer, this.convertAsArrayBuffer.bind(this)],
        [DataView, this.convertAsDataView.bind(this)],

        [Array, this.convertAsArray.bind(this)],
        [Set, this.convertAsSet.bind(this)],
        [Map, this.convertAsMap.bind(this)],

        // typed arrays
        [Float32Array, this.convertAsTypedArray.bind(this)],
        [Float64Array, this.convertAsTypedArray.bind(this)],
        [Int8Array, this.convertAsTypedArray.bind(this)],
        [Uint8Array, this.convertAsTypedArray.bind(this)],
        [Uint8ClampedArray, this.convertAsTypedArray.bind(this)],
        [Int16Array, this.convertAsTypedArray.bind(this)],
        [Uint16Array, this.convertAsTypedArray.bind(this)],
        [Int32Array, this.convertAsTypedArray.bind(this)],
        [Uint32Array, this.convertAsTypedArray.bind(this)],
    ]);

    setSerializationStrategy(
        type: Serializable<any>,
        serializer: SerializerFn<any>,
    ) {
        this.serializationStrategy.set(type, serializer);
    }

    /**
     * Convert a value of any supported serializable type.
     * The value type will be detected, and the correct serialization method will be called.
     */
    convertSingleValue(
        {
            memberName = 'object',
            memberOptions,
            sourceObject,
            typeDescriptor,
        }: SerializeParams<any>,
    ): any {
        if (sourceObject == null) {
            return sourceObject;
        }

        if (!isInstanceOf(sourceObject, typeDescriptor.ctor)) {
            const expectedName = nameof(typeDescriptor.ctor);
            const actualName = nameof(sourceObject.constructor);

            throw new TypeError(
                `Could not serialize '${memberName}': expected '${expectedName}',`
                + ` got '${actualName}'.`,
            );
        }

        const serializer = this.serializationStrategy.get(typeDescriptor.ctor);
        if (serializer !== undefined) {
            return serializer({
                memberName,
                memberOptions,
                sourceObject,
                typeDescriptor,
            });
        }
        // if not present in the strategy do property by property serialization
        if (typeof sourceObject === 'object') {
            return this.convertAsObject({
                memberName,
                memberOptions,
                sourceObject,
                typeDescriptor,
            });
        }

        let error = `Could not serialize '${memberName}'; don't know how to serialize type`;

        if (typeDescriptor.hasFriendlyName()) {
            error += ` '${typeDescriptor.ctor.name}'`;
        }

        throw new TypeError(`${error}.`);
    }

    /**
     * Performs the conversion of a typed object (usually a class instance) to a simple
     * javascript object for serialization.
     */
    private convertAsObject(
        {
            sourceObject,
            typeDescriptor,
        }: SerializeParams<IndexedObject, ConcreteTypeDescriptor>,
    ) {
        let sourceTypeMetadata: JsonObjectMetadata | undefined;
        let targetObject: IndexedObject;

        if (sourceObject.constructor !== typeDescriptor.ctor
            && sourceObject instanceof typeDescriptor.ctor) {
            // The source object is not of the expected type, but it is a valid subtype.
            // This is OK, and we'll proceed to gather object metadata from the subtype instead.
            sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(sourceObject.constructor);
        } else {
            sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(typeDescriptor.ctor);
        }

        if (sourceTypeMetadata === undefined) {
            // Untyped serialization, "as-is", we'll just pass the object on.
            // We'll clone the source object, because type hints are added to the object itself, and
            // we don't want to modify the original object.
            targetObject = {...sourceObject};
        } else {
            const beforeSerializationMethodName = sourceTypeMetadata.beforeSerializationMethodName;
            if (beforeSerializationMethodName != null) {
                if (typeof sourceObject[beforeSerializationMethodName] === 'function') {
                    // check for member first
                    sourceObject[beforeSerializationMethodName]();
                } else if (typeof (sourceObject.constructor as any)[beforeSerializationMethodName]
                    === 'function') {
                    // check for static
                (sourceObject.constructor as any)[beforeSerializationMethodName]();
                } else {
                    throw new TypeError(`beforeSerialization callback \
'${nameof(sourceTypeMetadata.classType)}.${beforeSerializationMethodName}' is not a method.`);
                }
            }

            const sourceMeta = sourceTypeMetadata;
            // Strong-typed serialization available.
            // We'll serialize by members that have been marked with @jsonMember (including
            // array/set/map members), and perform recursive conversion on each of them. The
            // converted objects are put on the 'targetObject', which is what will be put into
            // 'JSON.stringify' finally.
            targetObject = {};

            const classOptions = sourceMeta.options ?? {};

            sourceMeta.dataMembers.forEach((objMemberMetadata) => {
                const objMemberOptions = mergeOptions(classOptions, objMemberMetadata.options);
                let serialized;
                if (objMemberMetadata.serializer != null) {
                    serialized = objMemberMetadata.serializer(sourceObject[objMemberMetadata.key]);
                } else if (objMemberMetadata.type == null) {
                    throw new TypeError(
                        `Could not serialize ${objMemberMetadata.name}, there is`
                        + ` no constructor nor serialization function to use.`,
                    );
                } else {
                    serialized = this.convertSingleValue({
                        memberName: `${nameof(sourceMeta.classType)}.${objMemberMetadata.key}`,
                        memberOptions: objMemberOptions,
                        sourceObject: sourceObject[objMemberMetadata.key],
                        typeDescriptor: objMemberMetadata.type(),
                    });
                }

                if (serialized !== undefined) {
                    targetObject[objMemberMetadata.name] = serialized;
                }
            });
        }

        return targetObject;
    }

    /**
     * Performs the conversion of an array of typed objects (or primitive values) to an array of
     * simple javascript objects (or primitive values) for serialization.
     */
    private convertAsArray(
        {
            memberName,
            memberOptions,
            sourceObject,
            typeDescriptor,
        }: SerializeParams<Array<any>>,
    ): Array<any> {
        if (!(typeDescriptor instanceof ArrayTypeDescriptor)) {
            throw new TypeError(`Could not serialize ${memberName} as Array: incorrect \
TypeDescriptor detected, please use proper annotation or function for this type`);
        }
        if (typeDescriptor.elementType as any == null) {
            throw new TypeError(
                `Could not serialize ${memberName} as Array: missing element type definition.`,
            );
        }

        // Check the type of each element, individually.
        // If at least one array element type is incorrect, we return undefined, which results in no
        // value emitted during serialization. This is so that invalid element types don't
        // unexpectedly alter the ordering of other, valid elements, and that no unexpected
        // undefined values are in the emitted array.
        sourceObject.forEach((element, i) => {
            if (element !== null && !isInstanceOf(element, typeDescriptor.elementType.ctor)
            ) {
                const expectedTypeName = nameof(typeDescriptor.elementType.ctor);
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                const actualTypeName = element && nameof(element.constructor);
                throw new TypeError(`Could not serialize ${memberName}[${i}]:`
                    + ` expected '${expectedTypeName}', got '${actualTypeName}'.`);
            }
        });

        return sourceObject.map((element, i) => {
            return this.convertSingleValue({
                sourceObject: element,
                typeDescriptor: typeDescriptor.elementType,
                memberName: `${memberName}[${i}]`,
                memberOptions,
            });
        });
    }

    /**
     * Performs the conversion of a set of typed objects (or primitive values) into an array
     * of simple javascript objects.
     * @returns
     */
    private convertAsSet(
        {
            sourceObject,
            typeDescriptor,
            memberName,
            memberOptions,
        }: SerializeParams<Set<any>>,
    ): Array<any> {
        if (!(typeDescriptor instanceof SetTypeDescriptor)) {
            throw new TypeError(`Could not serialize ${memberName} as Set: incorrect \
TypeDescriptor detected, please use proper annotation or function for this type`);
        }
        if (typeDescriptor.elementType as any == null) {
            throw new TypeError(
                `Could not serialize ${memberName} as Set: missing element type definition.`,
            );
        }

        memberName += '[]';
        const resultArray: Array<any> = [];

        // Convert each element of the set, and put it into an output array.
        // The output array is the one serialized, as JSON.stringify does not support Set
        // serialization.
        // (TODO: clarification needed)
        sourceObject.forEach((element) => {
            const resultElement = this.convertSingleValue({
                sourceObject: element,
                typeDescriptor: typeDescriptor.elementType,
                memberName,
                memberOptions,
            });

            // Add to output if the source element was undefined, OR the converted element is
            // defined.
            // This will add intentionally undefined values to output, but not values that became
            // undefined DURING serializing (usually because of a type-error).
            if (!isValueDefined(element) || isValueDefined(resultElement)) {
                resultArray.push(resultElement);
            }
        });

        return resultArray;
    }

    /**
     * Performs the conversion of a map of typed objects (or primitive values) into an array
     * of simple javascript objects with `key` and `value` properties.
     */
    private convertAsMap(
        {
            memberName,
            memberOptions,
            sourceObject,
            typeDescriptor,
        }: SerializeParams<Map<any, any>>,
    ): IndexedObject | Array<{key: any; value: any}> {
        if (!(typeDescriptor instanceof MapTypeDescriptor)) {
            throw new TypeError(`Could not serialize ${memberName} as Map: incorrect \
TypeDescriptor detected, please use proper annotation or function for this type`);
        }
        if (typeDescriptor.valueType as any == null) { // @todo Check type
            throw new TypeError(
                `Could not serialize ${memberName} as Map: missing value type definition.`,
            );
        }

        if (typeDescriptor.keyType as any == null) { // @todo Check type
            throw new TypeError(
                `Could not serialize ${memberName} as Map: missing key type definition.`,
            );
        }

        const keyMemberName = `${memberName}[].key`;
        const valueMemberName = `${memberName}[].value`;
        const resultShape = typeDescriptor.getCompleteOptions().shape;
        const result = resultShape === MapShape.OBJECT ? ({} as IndexedObject) : [];

        // Convert each *entry* in the map to a simple javascript object with key and value
        // properties.
        sourceObject.forEach((value, key) => {
            const resultKeyValuePairObj = {
                key: this.convertSingleValue({
                    sourceObject: key,
                    typeDescriptor: typeDescriptor.keyType,
                    memberName: keyMemberName,
                    memberOptions,
                }),
                value: this.convertSingleValue({
                    sourceObject: value,
                    typeDescriptor: typeDescriptor.valueType,
                    memberName: valueMemberName,
                    memberOptions,
                }),
            };

            // We are not going to emit entries with undefined keys OR undefined values.
            const keyDefined = isValueDefined(resultKeyValuePairObj.key);
            const valueDefined = resultKeyValuePairObj.value !== undefined;
            if (keyDefined && valueDefined) {
                if (resultShape === MapShape.OBJECT) {
                    result[resultKeyValuePairObj.key] = resultKeyValuePairObj.value;
                } else {
                    result.push(resultKeyValuePairObj);
                }
            }
        });

        return result;
    }

    /**
     * Performs the conversion of a typed javascript array to a simple untyped javascript array.
     * This is needed because typed arrays are otherwise serialized as objects, so we'll end up
     * with something like "{ 0: 0, 1: 1, ... }".
     */
    private convertAsTypedArray(
        {
            sourceObject,
        }: SerializeParamsBase<ArrayBufferView>,
    ) {
        return Array.from(sourceObject as any);
    }

    /**
     * Performs the conversion of a raw ArrayBuffer to a string.
     */
    private convertAsArrayBuffer(
        {
            sourceObject,
        }: SerializeParamsBase<ArrayBuffer>,
    ) {
        // ArrayBuffer -> 16-bit character codes -> character array -> joined string.
        return Array.from(new Uint16Array(sourceObject))
            .map(charCode => String.fromCharCode(charCode)).join('');
    }

    /**
     * Performs the conversion of DataView, converting its internal ArrayBuffer to a string and
     * returning that string.
     */
    private convertAsDataView(
        {
            sourceObject,
        }: SerializeParamsBase<DataView>,
    ) {
        return this.convertAsArrayBuffer({
            sourceObject: sourceObject.buffer,
        });
    }
}
