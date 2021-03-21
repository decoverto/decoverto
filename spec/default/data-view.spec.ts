import test from 'ava';

import {DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

const decoratedJson = new DecoratedJson();

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

test.failing('DataView', passThroughMacro, {
    type: 'fromJson',
    value: undefined,
});

test('DataView', passThroughMacro, {
    type: 'toJson',
    value: undefined,
});

test.failing('DataView errors if fromJson source type is not string', t => {
    t.throws(() => decoratedJson.type(DataViewSpec).parse({property: 123}), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Number',
            expectedType: 'String',
            path: 'DataViewSpec.property',
        }),
    });
});
