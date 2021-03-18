import test from 'ava';

import {DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

const decoratedJson = new DecoratedJson();

test('An error should be thrown when it is unknown how to convert a type', t => {
    class CustomType {
    }

    @jsonObject()
    class TestNonDeterminableTypes {

        @jsonProperty()
        bar: CustomType;
    }

    const testNonDeterminableTypesHandler = decoratedJson.type(TestNonDeterminableTypes);
    t.throws(() => testNonDeterminableTypesHandler.parse({bar: 'bar'}), {
        message: getDiagnostic('unknownTypeError', {
            path: 'TestNonDeterminableTypes.bar',
            type: 'CustomType',
        }),
    });
});
