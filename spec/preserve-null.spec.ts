import test from 'ava';

import {DecoratedJson, jsonObject, jsonProperty} from '../src';

const decoratedJson = new DecoratedJson();

@jsonObject()
class NullTest {
    @jsonProperty(() => String)
    name: string | null;
}

test('null should be preserved while converting from JSON', t => {
    const obj = decoratedJson.type(NullTest).parse({name: null});
    t.is(obj.name, null);
});

test('null should be preserved while converting to JSON', t => {
    const input = new NullTest();
    input.name = null;
    const json = decoratedJson.type(NullTest).toPlainJson(input);
    t.deepEqual(json, {name: null});
});

@jsonObject()
class UndefinedTest {
    @jsonProperty(() => String)
    name?: string;
}

test('Undefined should not be assigned while converting from JSON', t => {
    const obj = decoratedJson.type(UndefinedTest).parse({name: undefined});
    t.true(obj instanceof UndefinedTest);
    t.false(Object.prototype.hasOwnProperty.call(obj, 'name'));
});

test('Undefined should not be assigned while converting to JSON', t => {
    const input = new UndefinedTest();
    input.name = undefined;
    const json = decoratedJson.type(UndefinedTest).toPlainJson(input);
    t.deepEqual(json, {});
});
