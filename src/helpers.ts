declare abstract class Reflect {
    static getMetadata(metadataKey: string, target: any, targetKey: string | symbol): any;
}

/**
 * Determines whether the specified type is a type that can be passed on "as-is" into
 * `JSON.stringify`.
 * Values of these types don't need special conversion.
 * @param type The constructor of the type (wrapper constructor for primitive types, e.g. `Number`
 * for `number`).
 */
export function isJsonStringifyCompatible(type: Function): boolean {
    return [Date, Number, String, Boolean].indexOf(type as any) !== -1;
}

export function isTypeTypedArray(type: Function): boolean {
    return [
        Float32Array,
        Float64Array,
        Int8Array,
        Uint8Array,
        Uint8ClampedArray,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
    ].indexOf(type as any) !== -1;
}

export function isObject(value: any): value is Record<string, unknown> {
    return value != null && typeof value === 'object';
}

export function shouldOmitParseString(jsonStr: string, expectedType: Function): boolean {
    const expectsTypesConvertedAsStrings = expectedType === String
        || expectedType === ArrayBuffer
        || expectedType === DataView;

    const hasQuotes = jsonStr.length >= 2
        && jsonStr[0] === '"'
        && jsonStr[jsonStr.length - 1] === '"';

    if (expectedType === Date) {
        // Date can both have strings and numbers as input
        const isNumber = !isNaN(Number(jsonStr.trim()));
        return !hasQuotes && !isNumber;
    }

    return expectsTypesConvertedAsStrings && !hasQuotes;
}

export const isReflectMetadataSupported =
    isObject(Reflect) && typeof Reflect.getMetadata as any === 'function';
