import test from 'ava';

import {Decoverto, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

const decoverto = new Decoverto();

@model()
class DataViewSpec {

    @property(() => DataView)
    property?: DataView | null;
}

const passThroughMacro = createPassThroughMacro({
    class: DataViewSpec,
    createSubject: value => ({property: value}),
});

test('DataView', passThroughMacro, {
    type: 'toInstance',
    value: null,
});

test('DataView', passThroughMacro, {
    type: 'toPlain',
    value: null,
});

test('DataView', passThroughMacro, {
    type: 'toInstance',
    value: undefined,
});

test('DataView', passThroughMacro, {
    type: 'toPlain',
    value: undefined,
});

test('DataView errors if toInstance source type is not string', t => {
    t.throws(() => decoverto.type(DataViewSpec).plainToInstance({property: 123}), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Number',
            expectedType: 'String',
            path: 'DataViewSpec.property',
        }),
    });
});
