import test from 'ava';

import {Decoverto, JsonHandlerSimple, jsonObject, jsonProperty} from '../../src';

@jsonObject()
class JsonHandlerTest {

    @jsonProperty()
    foo: 'unchanged' | 'changed';

    constructor(foo: 'unchanged' | 'changed') {
        this.foo = foo;
    }
}

test('JsonHandlerSimple should use replacer', t => {
    const decoverto = new Decoverto({
        jsonHandler: new JsonHandlerSimple({
            replacer: (key, value) => {
                if (value === 'unchanged') {
                    return 'changed';
                }

                return value;
            },
        }),
    });

    const typeHandler = decoverto.type(JsonHandlerTest);
    const plain = JSON.parse(typeHandler.instanceToRaw(new JsonHandlerTest('unchanged')));
    t.is(plain.foo, 'changed');
});

test('JsonHandlerSimple should use reviver', t => {
    const decoverto = new Decoverto({
        jsonHandler: new JsonHandlerSimple({
            reviver: (key, value) => {
                if (value === 'unchanged') {
                    return 'changed';
                }

                return value;
            },
        }),
    });
    const typeHandler = decoverto.type(JsonHandlerTest);
    const parsed = typeHandler.rawToInstance(JSON.stringify({foo: 'unchanged'}));
    t.is(parsed.foo, 'changed');
});

test('JsonHandlerSimple should use correct indentation', t => {
    const decoverto = new Decoverto({
        jsonHandler: new JsonHandlerSimple({
            spaces: 4,
        }),
    });
    const typeHandler = decoverto.type(JsonHandlerTest);
    const stringified = typeHandler.instanceToRaw(new JsonHandlerTest('unchanged'));
    t.true(stringified.includes('   "foo"'));
});

const customJsonHandler = new Decoverto({
    jsonHandler: {
        parse: () => new JsonHandlerTest('changed'),
        stringify: () => '{"foo": "changed"}',
    },
}).type(JsonHandlerTest);

test('Custom JSON handler should use the custom parse function', t => {
    t.is(customJsonHandler.rawToInstance(JSON.stringify({foo: 'unchanged'})).foo, 'changed');
});

test('Custom JSON handler should use the custom instanceToRaw function', t => {
    t.is(customJsonHandler.instanceToRaw(new JsonHandlerTest('unchanged')), '{"foo": "changed"}');
});
