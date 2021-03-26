import test from 'ava';

import {Decoverto, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

const decoverto = new Decoverto();

@model()
class ArrayBufferSpec {

    @property(() => ArrayBuffer)
    property?: ArrayBuffer | null;
}

const passThroughMacro = createPassThroughMacro({
    class: ArrayBufferSpec,
    createSubject: value => ({property: value}),
});

test('ArrayBuffer', passThroughMacro, {
    type: 'toInstance',
    value: null,
});

test('ArrayBuffer', passThroughMacro, {
    type: 'toPlain',
    value: null,
});

test('ArrayBuffer', passThroughMacro, {
    type: 'toInstance',
    value: undefined,
});

test('ArrayBuffer', passThroughMacro, {
    type: 'toPlain',
    value: undefined,
});

test('ArrayBuffer errors if toInstance source type is not string', t => {
    t.throws(() => decoverto.type(ArrayBufferSpec).plainToInstance({property: 123}), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Number',
            expectedType: 'String',
            path: 'ArrayBufferSpec.property',
        }),
    });
});
