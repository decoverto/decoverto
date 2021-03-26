import test from 'ava';

import {Any, AnyConverter, array, Decoverto, model, property} from '../../src';
import {createPassThroughMacro} from '../helpers/macros';

const decoverto = new Decoverto();

@model()
class SimplePropertyAny {
    @property(Any)
    any: any;

    @property(Any)
    anyNullable?: any | null;
}

const passThroughMacro = createPassThroughMacro({
    class: SimplePropertyAny,
    createSubject: value => ({
        any: value,
        anyNullable: value,
    }),
});

test('@property(Any) should parse simple object correctly', t => {
    const result = decoverto.type(SimplePropertyAny).plainToInstance({
        any: {foo: 'bar'},
        anyNullable: {foo: 'bar'},
    });
    t.is(result.any.foo, 'bar');
    t.is(result.anyNullable.foo, 'bar');
});

test('@property(Any) should parse class instance correctly', t => {
    const foo = {foo: 'bar'};
    const result = decoverto.type(SimplePropertyAny).plainToInstance({
        any: foo,
        anyNullable: foo,
    });
    t.deepEqual(result.any, foo);
    t.deepEqual(result.anyNullable, foo);
});

test('@property(Any)', passThroughMacro, {
    type: 'toInstance',
    value: null,
});

test('@property(Any)', passThroughMacro, {
    type: 'toPlain',
    value: null,
});

test('@property(Any)', passThroughMacro, {
    type: 'toInstance',
    value: undefined,
});

test('@property(Any)', passThroughMacro, {
    type: 'toPlain',
    value: undefined,
});

test('@property(Any)', passThroughMacro, {
    type: 'toInstance',
    value: {foo: 'bar'},
});

test('@property(Any)', passThroughMacro, {
    type: 'toPlain',
    value: {foo: 'bar'},
});

test('Any should handle complex structures', t => {
    @model()
    class Event {

        @property(Any)
        data?: {[k: string]: any} | null;
    }

    @model()
    class A {

        @property(array(() => Event))
        events: Array<Event>;
    }

    const result = decoverto.type(A).plainToInstance({
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
    t.is(new AnyConverter().getFriendlyName(), 'Any');
});
