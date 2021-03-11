import {DecoratedJson} from '../src';

const decoratedJson = new DecoratedJson();
const typeHandler = decoratedJson.type(String);
const toJsonObject = typeHandler.toJsonObject.bind(typeHandler);

describe('parse To Object', () => {
    it('should passthrough objects', () => {
        const obj = {
            a: 1,
            b: 2,
        };

        const obj2 = toJsonObject(obj, Object);
        expect(obj2).toBe(obj);
    });

    it('should passthrough arrays', () => {
        const arr = [{
            a: 1,
            b: 2,
        }];

        const arr2 = toJsonObject(arr, Array);
        expect(arr2).toBe(arr);
    });

    it('should parse object string', () => {
        const arr = {
            a: 1,
            b: 2,
        };

        const arr2 = toJsonObject(JSON.stringify(arr), Object);
        expect(arr2).toEqual(arr);
    });

    it('should passthrough primitives', () => {
        expect(toJsonObject(1, Number)).toBe(1);
        expect(toJsonObject(false, Boolean)).toBe(false);
    });

    it('should parse strings with quotes, but passthrough otherwise', () => {
        // string is obvious
        expect(toJsonObject('"I am a string"', String)).toEqual('I am a string');
        expect(toJsonObject('just a string', String)).toBe('just a string');
        // but also the types that are serialized to string
        expect(toJsonObject('"1970-01-18T20:51:55.254Z"', Date))
            .toEqual('1970-01-18T20:51:55.254Z');
        expect(toJsonObject('1970-01-18T20:51:55.254Z', Date)).toBe('1970-01-18T20:51:55.254Z');
        expect(toJsonObject('"畤慰"', ArrayBuffer)).toEqual('畤慰');
        expect(toJsonObject('畤慰', ArrayBuffer)).toBe('畤慰');
        expect(toJsonObject('"畤慰"', DataView)).toEqual('畤慰');
        expect(toJsonObject('畤慰', DataView)).toBe('畤慰');
    });

    it('should passthrough builtins', () => {
        const date = new Date();
        expect(toJsonObject(date, Date)).toBe(date);
        const buffer = new ArrayBuffer(3);
        expect(toJsonObject(buffer, ArrayBuffer)).toBe(buffer);
    });
});
