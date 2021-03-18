import test from 'ava';

import {DecoratedJson} from '../src';

const decoratedJson = new DecoratedJson();

test('Invalid string should error on parse', t => {
    t.throws(() => decoratedJson.type(String).parse('"sdfs"fdsf"'), {
        instanceOf: SyntaxError,
        message: 'Unexpected token f in JSON at position 6',
    });
});

test('String toPlainJson should not modify the source', t => {
    t.is(decoratedJson.type(String).toPlainJson('str'), 'str');
});

test('Unquoted builtins should convert from JSON', t => {
    t.is(decoratedJson.type(Number).parse(45834), 45834);
    t.is(decoratedJson.type(Boolean).parse(true), true);
    t.deepEqual(decoratedJson.type(Date).parse(1543915254), new Date(1543915254));

    const dataBuffer = Uint8Array.from([100, 117, 112, 97]) as any;
    t.deepEqual(decoratedJson.type(Uint8Array).parse([100, 117, 112, 97]), dataBuffer);
});

test('Unquoted builtins should convert to JSON', t => {
    t.is(decoratedJson.type(Number).toPlainJson(45834), 45834);
    t.is(decoratedJson.type(Boolean).toPlainJson(true), true);
    const dateMs = new Date(1543915254);
    t.is(decoratedJson.type(Date).toPlainJson(dateMs), dateMs);
    t.true(decoratedJson.type(Date).toPlainJson(dateMs) instanceof Date);
    const dateStr = new Date('2018-12-04T09:20:54');
    t.is(decoratedJson.type(Date).toPlainJson(dateStr), dateStr);

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt8(0, 100);
    view.setInt8(1, 117);
    view.setInt8(2, 112);
    view.setInt8(3, 97);
    t.is(decoratedJson.type(ArrayBuffer).toPlainJson(buffer), '畤慰');
    t.is(decoratedJson.type(DataView).toPlainJson(view), '畤慰');
    t.deepEqual(
        decoratedJson.type(Uint8Array).toPlainJson(new Uint8Array(buffer)),
        [100, 117, 112, 97],
    );
});
