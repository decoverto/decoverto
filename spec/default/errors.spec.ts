import test from 'ava';

import {Decoverto, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

const decoverto = new Decoverto();

test('An error should be thrown when it is unknown how to convert a type', t => {
    class CustomType {
    }

    @jsonObject()
    class TestNonDeterminableTypes {

        @jsonProperty()
        bar: CustomType;
    }

    const testNonDeterminableTypesHandler = decoverto.type(TestNonDeterminableTypes);
    t.throws(() => testNonDeterminableTypesHandler.plainToInstance({bar: 'bar'}), {
        message: getDiagnostic('unknownTypeError', {
            path: 'TestNonDeterminableTypes.bar',
            type: 'CustomType',
        }),
    });
});
