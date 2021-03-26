import test from 'ava';

import {Decoverto, JsonParser, model, property} from '../../src';

@model()
class JsonHandlerTest {

    @property()
    foo: 'unchanged' | 'changed';

    constructor(foo: 'unchanged' | 'changed') {
        this.foo = foo;
    }
}

test('JsonParser should use replacer', t => {
    const decoverto = new Decoverto({
        parser: new JsonParser({
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

test('JsonParser should use reviver', t => {
    const decoverto = new Decoverto({
        parser: new JsonParser({
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

test('JsonParser should use correct indentation', t => {
    const decoverto = new Decoverto({
        parser: new JsonParser({
            spaces: 4,
        }),
    });
    const typeHandler = decoverto.type(JsonHandlerTest);
    const stringified = typeHandler.instanceToRaw(new JsonHandlerTest('unchanged'));
    t.true(stringified.includes('   "foo"'));
});

const customJsonHandler = new Decoverto({
    parser: {
        parse: () => new JsonHandlerTest('changed'),
        toRaw: () => '{"foo": "changed"}',
    },
}).type(JsonHandlerTest);

test('Custom JSON handler should use the custom parse function', t => {
    t.is(customJsonHandler.rawToInstance(JSON.stringify({foo: 'unchanged'})).foo, 'changed');
});

test('Custom JSON handler should use the custom instanceToRaw function', t => {
    t.is(customJsonHandler.instanceToRaw(new JsonHandlerTest('unchanged')), '{"foo": "changed"}');
});
