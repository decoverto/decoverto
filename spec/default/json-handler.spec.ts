import test from 'ava';

import {DecoratedJson, JsonHandlerSimple, jsonObject, jsonProperty} from '../../src';

@jsonObject()
class JsonHandlerTest {

    @jsonProperty()
    foo: 'unchanged' | 'changed';

    constructor(foo: 'unchanged' | 'changed') {
        this.foo = foo;
    }
}

test('JsonHandlerSimple should use replacer', t => {
    const decoratedJson = new DecoratedJson({
        jsonHandler: new JsonHandlerSimple({
            replacer: (key, value) => {
                if (value === 'unchanged') {
                    return 'changed';
                }

                return value;
            },
        }),
    });

    const typeHandler = decoratedJson.type(JsonHandlerTest);
    const plain = JSON.parse(typeHandler.stringify(new JsonHandlerTest('unchanged')));
    t.is(plain.foo, 'changed');
});

test('JsonHandlerSimple should use reviver', t => {
    const decoratedJson = new DecoratedJson({
        jsonHandler: new JsonHandlerSimple({
            reviver: (key, value) => {
                if (value === 'unchanged') {
                    return 'changed';
                }

                return value;
            },
        }),
    });
    const typeHandler = decoratedJson.type(JsonHandlerTest);
    const parsed = typeHandler.parseJson(JSON.stringify({foo: 'unchanged'}));
    t.is(parsed.foo, 'changed');
});

test('JsonHandlerSimple should use correct indentation', t => {
    const decoratedJson = new DecoratedJson({
        jsonHandler: new JsonHandlerSimple({
            spaces: 4,
        }),
    });
    const typeHandler = decoratedJson.type(JsonHandlerTest);
    const stringified = typeHandler.stringify(new JsonHandlerTest('unchanged'));
    t.true(stringified.includes('   "foo"'));
});

const customJsonHandler = new DecoratedJson({
    jsonHandler: {
        parse: () => new JsonHandlerTest('changed'),
        stringify: () => '{"foo": "changed"}',
    },
}).type(JsonHandlerTest);

test('Custom JSON handler should use the custom parse function', t => {
    t.is(customJsonHandler.parseJson(JSON.stringify({foo: 'unchanged'})).foo, 'changed');
});

test('Custom JSON handler should use the custom stringify function', t => {
    t.is(customJsonHandler.stringify(new JsonHandlerTest('unchanged')), '{"foo": "changed"}');
});
