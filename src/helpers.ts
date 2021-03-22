declare abstract class Reflect {
    static getMetadata(metadataKey: string, target: any, targetKey: string | symbol): any;
}

export function isObject(value: any): value is Record<string, unknown> {
    return value != null && typeof value === 'object';
}

export const isReflectMetadataSupported =
    isObject(Reflect) && typeof Reflect.getMetadata as any === 'function';
