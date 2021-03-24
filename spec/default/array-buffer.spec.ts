import test from 'ava';

import {DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

const decoratedJson = new DecoratedJson();

@jsonObject()
class ArrayBufferSpec {

    @jsonProperty(() => ArrayBuffer)
    property?: ArrayBuffer | null;
}

const passThroughMacro = createPassThroughMacro({
    class: ArrayBufferSpec,
    createSubject: value => ({property: value}),
});

test('ArrayBuffer', passThroughMacro, {
    type: 'fromJson',
    value: null,
});

test('ArrayBuffer', passThroughMacro, {
    type: 'toJson',
    value: null,
});

test('ArrayBuffer', passThroughMacro, {
    type: 'fromJson',
    value: undefined,
});

test('ArrayBuffer', passThroughMacro, {
    type: 'toJson',
    value: undefined,
});

test('ArrayBuffer errors if toInstance source type is not string', t => {
    t.throws(() => decoratedJson.type(ArrayBufferSpec).plainToInstance({property: 123}), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Number',
            expectedType: 'String',
            path: 'ArrayBufferSpec.property',
        }),
    });
});
