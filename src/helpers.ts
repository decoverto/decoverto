declare abstract class Reflect {
    static getMetadata(metadataKey: string, target: any, targetKey: string | symbol): any;
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
