import test from 'ava';

import {Decoverto} from '../../src';

const decoverto = new Decoverto();

test('Invalid string should error on parse', t => {
    t.throws(() => decoverto.type(String).rawToInstance('"sdfs"fdsf"'), {
        instanceOf: SyntaxError,
        message: 'Unexpected token f in JSON at position 6',
    });
});

test('String toPlain should not modify the source', t => {
    t.is(decoverto.type(String).instanceToPlain('str'), 'str');
});

test('Unquoted builtins should convert plain to instance', t => {
    t.is(decoverto.type(Number).plainToInstance(45834), 45834);
    t.is(decoverto.type(Boolean).plainToInstance(true), true);

    const dataBuffer = Uint8Array.from([100, 117, 112, 97]) as any;
    t.deepEqual(decoverto.type(Uint8Array).plainToInstance([100, 117, 112, 97]), dataBuffer);
});

test('Unquoted builtins should convert to plain', t => {
    t.is(decoverto.type(Number).instanceToPlain(45834), 45834);
    t.is(decoverto.type(Boolean).instanceToPlain(true), true);

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt8(0, 100);
    view.setInt8(1, 117);
    view.setInt8(2, 112);
    view.setInt8(3, 97);
    t.is(decoverto.type(ArrayBuffer).instanceToPlain(buffer), '畤慰');
    t.is(decoverto.type(DataView).instanceToPlain(view), '畤慰');
    t.deepEqual(
        decoverto.type(Uint8Array).instanceToPlain(new Uint8Array(buffer)),
        [100, 117, 112, 97],
    );
});
