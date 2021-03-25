import test from 'ava';

import {Decoverto, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

const decoverto = new Decoverto();

@jsonObject()
class DataViewSpec {

    @jsonProperty(() => DataView)
    property?: DataView | null;
}

const passThroughMacro = createPassThroughMacro({
    class: DataViewSpec,
    createSubject: value => ({property: value}),
});

test('DataView', passThroughMacro, {
    type: 'fromJson',
    value: null,
});

test('DataView', passThroughMacro, {
    type: 'toJson',
    value: null,
});

test('DataView', passThroughMacro, {
    type: 'fromJson',
    value: undefined,
});

test('DataView', passThroughMacro, {
    type: 'toJson',
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
