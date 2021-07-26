import test from 'ava';

import {Decoverto, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

const decoverto = new Decoverto();

test('An error should be thrown when it is unknown how to convert a type', t => {
    class CustomType {
    }

    @model()
    class TestNonDeterminableTypes {

        @property()
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
