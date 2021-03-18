import test from 'ava';

import {DecoratedJson} from '../../src';

const decoratedJson = new DecoratedJson();
const typeHandler = decoratedJson.type(String);
const toJsonObject = typeHandler.toJsonObject.bind(typeHandler);

test('toJsonObject should pass through objects', t => {
    const obj = {
        a: 1,
        b: 2,
    };

    const obj2 = toJsonObject(obj, Object);
    t.is(obj2, obj);
});

test('toJsonObject should pass through arrays', t => {
    const arr = [{
        a: 1,
        b: 2,
    }];

    const arr2 = toJsonObject(arr, Array);
    t.is(arr2, arr);
});

test('toJsonObject should parse object string', t => {
    const arr = {
        a: 1,
        b: 2,
    };

    const arr2 = toJsonObject(JSON.stringify(arr), Object);
    t.deepEqual(arr2, arr);
});

test('toJsonObject should pass through primitives', t => {
    t.is(toJsonObject(1, Number), 1);
    t.is(toJsonObject(false, Boolean), false);
});

test('toJsonObject should parse strings with quotes, but passthrough otherwise', t => {
    t.is(toJsonObject('"I am a string"', String), 'I am a string');
    t.is(toJsonObject('just a string', String), 'just a string');
    t.is(toJsonObject('"1970-01-18T20:51:55.254Z"', Date), '1970-01-18T20:51:55.254Z');
    t.is(toJsonObject('1970-01-18T20:51:55.254Z', Date), '1970-01-18T20:51:55.254Z');
    t.is(toJsonObject('"畤慰"', ArrayBuffer), '畤慰');
    t.is(toJsonObject('畤慰', ArrayBuffer), '畤慰');
    t.is(toJsonObject('"畤慰"', DataView), '畤慰');
    t.is(toJsonObject('畤慰', DataView), '畤慰');
});

test('toJsonObject should pass through builtins', t => {
    const date = new Date();
    t.is(toJsonObject(date, Date), date);
    const buffer = new ArrayBuffer(3);
    t.is(toJsonObject(buffer, ArrayBuffer), buffer);
});
