import test from 'ava';

import {Decoverto, model, property} from '../../src';

const decoverto = new Decoverto();

@model()
class NullTest {
    @property(() => String)
    name: string | null;
}

test('null should be preserved while converting from raw', t => {
    const obj = decoverto.type(NullTest).plainToInstance({name: null});
    t.is(obj.name, null);
});

test('null should be preserved while converting to raw', t => {
    const input = new NullTest();
    input.name = null;
    const plain = decoverto.type(NullTest).instanceToPlain(input);
    t.deepEqual(plain, {name: null});
});

@model()
class UndefinedTest {
    @property(() => String)
    name?: string;
}

test('Undefined should not be assigned while converting plainToInstance', t => {
    const obj = decoverto.type(UndefinedTest).plainToInstance({name: undefined});
    t.true(obj instanceof UndefinedTest);
    t.false(Object.prototype.hasOwnProperty.call(obj, 'name'));
});

test('Undefined should not be assigned while converting to JSON', t => {
    const input = new UndefinedTest();
    input.name = undefined;
    const json = decoverto.type(UndefinedTest).instanceToPlain(input);
    t.deepEqual(json, {});
});
