import test from 'ava';

import {Any, AnyTypeDescriptor, array, DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {createPassThroughMacro} from '../helpers/macros';

const decoratedJson = new DecoratedJson();

@jsonObject()
class SimplePropertyAny {
    @jsonProperty(Any)
    any: any;

    @jsonProperty(Any)
    anyNullable?: any | null;
}

const passThroughMacro = createPassThroughMacro({
    class: SimplePropertyAny,
    createSubject: value => ({
        any: value,
        anyNullable: value,
    }),
});

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

test('@jsonProperty(Any)', passThroughMacro, {
    type: 'fromJson',
    value: null,
});

test('@jsonProperty(Any)', passThroughMacro, {
    type: 'toJson',
    value: null,
});

test('@jsonProperty(Any)', passThroughMacro, {
    type: 'fromJson',
    value: undefined,
});

test('@jsonProperty(Any)', passThroughMacro, {
    type: 'toJson',
    value: undefined,
});

test('@jsonProperty(Any)', passThroughMacro, {
    type: 'fromJson',
    value: {foo: 'bar'},
});

test('@jsonProperty(Any)', passThroughMacro, {
    type: 'toJson',
    value: {foo: 'bar'},
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

test(`Any should have 'Any' as friendly name`, t => {
    t.is(new AnyTypeDescriptor().getFriendlyName(), 'Any');
});
