import test from 'ava';

import {Any, array, DecoratedJson, jsonObject, jsonProperty} from '../src';

const decoratedJson = new DecoratedJson();

@jsonObject()
class SimplePropertyAny {
    @jsonProperty(Any)
    any: any;

    @jsonProperty(Any)
    anyNullable?: any | null;
}

test('@jsonProperty(Any) should parse simple object correctly', t => {
    const result = decoratedJson.type(SimplePropertyAny).parse({
        any: {foo: 'bar'},
        anyNullable: {foo: 'bar'},
    });
    t.is(result.any.foo, 'bar');
    t.is(result.anyNullable.foo, 'bar');
});

test('@jsonProperty(Any) should parse class instance correctly', t => {
    const foo = {foo: 'bar'};
    const result = decoratedJson.type(SimplePropertyAny).parse({
        any: foo,
        anyNullable: foo,
    });
    t.deepEqual(result.any, foo);
    t.deepEqual(result.anyNullable, foo);
});

test('@jsonProperty(Any) should convert with referential equality', t => {
    const foo = {foo: 'bar'};
    const simplePropertyAny = new SimplePropertyAny();
    simplePropertyAny.any = foo;
    simplePropertyAny.anyNullable = foo;
    const result = decoratedJson
        .type(SimplePropertyAny)
        .toPlainJson(simplePropertyAny);
    t.is(result.any, foo);
    t.is(result.anyNullable, foo);
});

test('Any should handle complex structures', t => {
    @jsonObject()
    class Event {

        @jsonProperty(Any)
        data?: {[k: string]: any} | null;
    }

    @jsonObject()
    class A {

        @jsonProperty(array(() => Event))
        events: Array<Event>;
    }

    const result = decoratedJson.type(A).parse({
        events: [
            {
                data: {
                    files: [
                        {
                            name: 'file1',
                        },
                    ],
                },
            },
        ],
    });

    t.is(result.events[0].data?.files[0].name, 'file1');
});
