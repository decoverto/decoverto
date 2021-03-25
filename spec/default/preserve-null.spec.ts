import test from 'ava';

import {Decoverto, jsonObject, jsonProperty} from '../../src';

const decoverto = new Decoverto();

@jsonObject()
class NullTest {
    @jsonProperty(() => String)
    name: string | null;
}

test('null should be preserved while converting from JSON', t => {
    const obj = decoverto.type(NullTest).plainToInstance({name: null});
    t.is(obj.name, null);
});

test('null should be preserved while converting to JSON', t => {
    const input = new NullTest();
    input.name = null;
    const json = decoverto.type(NullTest).instanceToPlain(input);
    t.deepEqual(json, {name: null});
});

@jsonObject()
class UndefinedTest {
    @jsonProperty(() => String)
    name?: string;
}

test('Undefined should not be assigned while converting from JSON', t => {
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
